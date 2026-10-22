'use server';

import { createClient } from '@/lib/supabase/server';
import { requireTenantMembership } from '@/features/auth/server';
import { createOrderSchema, type CreateOrderInput } from './schemas';
import type { OrderStatus, Json } from '@/types/database';
import { revalidatePath } from 'next/cache';

export type OrderActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createOrderAction(
  input: CreateOrderInput
): Promise<OrderActionResult<{ orderId: string; orderNumber: number; tenantSlug: string }>> {
  try {
    const parsed = createOrderSchema.parse(input);
    const supabase = await createClient();

    // 1. Validar que el carrito esté activo y acepte pedidos
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, slug, status')
      .eq('id', parsed.tenantId)
      .single();

    if (tenantError || !tenant || tenant.status !== 'active') {
      return { success: false, error: 'El carrito no está activo en este momento.' };
    }

    const { data: settings } = await supabase
      .from('tenant_settings')
      .select('is_ordering_paused, pause_reason, current_preparation_time_minutes')
      .eq('tenant_id', tenant.id)
      .single();

    if (settings?.is_ordering_paused) {
      return {
        success: false,
        error: settings.pause_reason || 'El carrito ha pausado la recepción de pedidos.',
      };
    }

    // 2. Recálculo estricto de precios en el servidor (Seguridad: nunca confiar en el frontend)
    const productIds = Array.from(new Set(parsed.items.map((i) => i.productId)));
    const { data: dbProducts, error: prodError } = await supabase
      .from('products')
      .select('id, name, price, is_available, preparation_time_minutes, deleted_at')
      .in('id', productIds)
      .eq('tenant_id', tenant.id);

    if (prodError || !dbProducts || dbProducts.length !== productIds.length) {
      return { success: false, error: 'Uno o más productos seleccionados ya no existen.' };
    }

    // Validar disponibilidad
    for (const p of dbProducts) {
      if (!p.is_available || p.deleted_at !== null) {
        return { success: false, error: `El producto "${p.name}" está agotado en este momento.` };
      }
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // Obtener opciones de la DB si las hay
    const allOptionIds = Array.from(
      new Set(parsed.items.flatMap((i) => i.selectedOptionIds))
    );
    let optionMap = new Map<string, { id: string; name: string; extraPrice: number }>();

    if (allOptionIds.length > 0) {
      const { data: dbOptions } = await supabase
        .from('product_options')
        .select('id, name, extra_price, is_available')
        .in('id', allOptionIds)
        .eq('is_available', true);

      if (dbOptions) {
        optionMap = new Map(
          dbOptions.map((o) => [o.id, { id: o.id, name: o.name, extraPrice: Number(o.extra_price) }])
        );
      }
    }

    // Calcular totales y construir snapshots inmutables
    let subtotal = 0;
    const computedItems: Array<{
      productId: string;
      productName: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
      optionsSnapshot: Json;
    }> = [];

    for (const item of parsed.items) {
      const prod = productMap.get(item.productId)!;
      let itemUnitPrice = Number(prod.price);
      const optionsSnapshotList: Array<{ name: string; extraPrice: number }> = [];

      for (const optId of item.selectedOptionIds) {
        const opt = optionMap.get(optId);
        if (opt) {
          itemUnitPrice += opt.extraPrice;
          optionsSnapshotList.push({ name: opt.name, extraPrice: opt.extraPrice });
        }
      }

      const itemSubtotal = itemUnitPrice * item.quantity;
      subtotal += itemSubtotal;

      computedItems.push({
        productId: prod.id,
        productName: prod.name,
        unitPrice: itemUnitPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        optionsSnapshot: {
          options: optionsSnapshotList,
          notes: item.notes || null,
        } as unknown as Json,
      });
    }

    // 3. Validación y Recálculo Seguro de Cupón en Servidor
    let discountAmount = 0;
    let couponId: string | null = null;

    if (parsed.couponCode) {
      const codeUpper = parsed.couponCode.trim().toUpperCase();
      const { data: dbCoupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('code', codeUpper)
        .eq('is_active', true)
        .maybeSingle();

      if (dbCoupon) {
        const now = new Date();
        const isValidDate =
          (!dbCoupon.valid_from || new Date(dbCoupon.valid_from) <= now) &&
          (!dbCoupon.valid_until || new Date(dbCoupon.valid_until) >= now);
        const isValidUses =
          dbCoupon.max_uses === null || dbCoupon.current_uses < dbCoupon.max_uses;
        const isValidMin = subtotal >= (Number(dbCoupon.min_order_amount) || 0);

        if (isValidDate && isValidUses && isValidMin) {
          couponId = dbCoupon.id;
          const discVal = Number(dbCoupon.discount_value);
          if (dbCoupon.discount_type === 'percentage') {
            discountAmount = (subtotal * discVal) / 100;
          } else {
            discountAmount = discVal;
          }

          if (dbCoupon.max_discount_amount) {
            discountAmount = Math.min(discountAmount, Number(dbCoupon.max_discount_amount));
          }
          discountAmount = Math.min(discountAmount, subtotal);

          // Incrementar uso del cupón
          await supabase
            .from('coupons')
            .update({ current_uses: dbCoupon.current_uses + 1 })
            .eq('id', dbCoupon.id);
        }
      }
    }

    const finalTotal = Math.max(subtotal - discountAmount, 0);

    // 4. Cálculo de Tiempo Estimado de Preparación (ETA)
    const basePrepMinutes = settings?.current_preparation_time_minutes ?? 20;
    const now = new Date();
    const estimatedReadyAt = parsed.scheduledFor
      ? new Date(parsed.scheduledFor).toISOString()
      : new Date(now.getTime() + basePrepMinutes * 60000).toISOString();

    // 5. Identificación / CRM Progresivo y Fidelización por Puntos
    const cleanPhone = parsed.customerPhone.replace(/[^0-9+]/g, '');
    let customerId: string | null = null;
    const pointsEarned = Math.floor(finalTotal / 100); // 1 punto cada $100

    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id, total_orders, total_spent, points_balance')
      .eq('tenant_id', tenant.id)
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
      const newPoints = (existingCustomer.points_balance || 0) + pointsEarned;
      await supabase
        .from('customers')
        .update({
          name: parsed.customerName,
          total_orders: (existingCustomer.total_orders || 0) + 1,
          total_spent: (Number(existingCustomer.total_spent) || 0) + finalTotal,
          points_balance: newPoints,
          last_order_at: now.toISOString(),
        })
        .eq('id', existingCustomer.id);
    } else {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenant.id,
          name: parsed.customerName,
          phone: cleanPhone,
          total_orders: 1,
          total_spent: finalTotal,
          points_balance: pointsEarned,
          last_order_at: now.toISOString(),
        })
        .select('id')
        .single();

      if (newCustomer) customerId = newCustomer.id;
    }

    // 6. Inserción del Pedido Principal
    const paymentStatus =
      parsed.paymentMethod === 'cash_on_pickup' ? 'cash_on_pickup' : 'pending';

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tenant_id: tenant.id,
        customer_id: customerId,
        customer_name: parsed.customerName,
        customer_phone: cleanPhone,
        order_type: parsed.orderType,
        scheduled_for: parsed.scheduledFor ? new Date(parsed.scheduledFor).toISOString() : null,
        order_status: 'pending',
        payment_status: paymentStatus,
        subtotal,
        discount: discountAmount,
        coupon_id: couponId,
        total: finalTotal,
        estimated_ready_at: estimatedReadyAt,
        notes: parsed.notes ?? null,
      })
      .select('id, order_number')
      .single();

    if (orderError || !order) {
      throw new Error(orderError?.message ?? 'Error al registrar el pedido');
    }

    // Registrar puntos en el ledger si hubo puntos ganados y cliente
    if (pointsEarned > 0 && customerId) {
      await supabase.from('customer_points_ledger').insert({
        tenant_id: tenant.id,
        customer_id: customerId,
        order_id: order.id,
        points: pointsEarned,
        reason: 'order_reward',
      });
    }

    // 6. Inserción de los Order Items con Snapshot Inmutable
    const itemsToInsert = computedItems.map((ci) => ({
      order_id: order.id,
      product_id: ci.productId,
      product_name: ci.productName,
      unit_price: ci.unitPrice,
      quantity: ci.quantity,
      subtotal: ci.subtotal,
      options_snapshot: ci.optionsSnapshot,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);

    if (itemsError) {
      throw new Error('Error al registrar los ítems del pedido');
    }

    // Revalidar el panel de cocina
    revalidatePath(`/admin/${tenant.slug}/orders`);

    return {
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        tenantSlug: tenant.slug,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error inesperado al crear el pedido',
    };
  }
}

export async function updateOrderStatusAction(
  tenantId: string,
  orderId: string,
  newStatus: OrderStatus
): Promise<OrderActionResult> {
  try {
    // Requiere al menos rol staff en el carrito
    await requireTenantMembership(tenantId, 'staff');

    const supabase = await createClient();

    // Obtener estado actual
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('order_status')
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !currentOrder) {
      throw new Error('Pedido no encontrado.');
    }

    // Validar máquina de estados: un pedido cancelado no puede reabrirse directamente
    if (currentOrder.order_status === 'cancelled') {
      throw new Error('No es posible modificar un pedido cancelado.');
    }

    const { error } = await supabase
      .from('orders')
      .update({ order_status: newStatus })
      .eq('id', orderId)
      .eq('tenant_id', tenantId);

    if (error) throw new Error(error.message);

    revalidatePath(`/admin`);
    revalidatePath(`/c/[slug]/track/${orderId}`, 'page');

    return { success: true, data: undefined };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al actualizar el estado del pedido',
    };
  }
}
