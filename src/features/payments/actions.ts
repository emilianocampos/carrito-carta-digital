'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireTenantMembership } from '@/features/auth/server';
import { createMercadoPagoPreference } from './mercadopago';
import { revalidatePath } from 'next/cache';

export type PaymentActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Genera la preferencia de pago en Mercado Pago para una orden existente.
 */
export async function createPaymentPreferenceAction(
  orderId: string
): Promise<PaymentActionResult<{ initPoint: string }>> {
  try {
    const adminSupabase = createAdminClient();

    // 1. Obtener orden
    const { data: order, error: orderError } = await adminSupabase
      .from('orders')
      .select('id, order_number, tenant_id, customer_name, customer_phone, total, payment_status, gateway_init_point')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return { success: false, error: 'Pedido no encontrado' };
    }

    // Si ya tiene un init point generado previamente y no está pagado, reutilizarlo
    if (order.gateway_init_point && order.payment_status === 'pending') {
      return { success: true, data: { initPoint: order.gateway_init_point } };
    }

    // 2. Obtener tenant y configuración
    const { data: tenant } = await adminSupabase
      .from('tenants')
      .select('slug')
      .eq('id', order.tenant_id)
      .single();

    const { data: settings } = await adminSupabase
      .from('tenant_settings')
      .select('currency, mercadopago_access_token')
      .eq('tenant_id', order.tenant_id)
      .single();

    if (!tenant || !settings) {
      return { success: false, error: 'Configuración de carrito no disponible' };
    }

    // 3. Obtener ítems
    const { data: items } = await adminSupabase
      .from('order_items')
      .select('product_name, unit_price, quantity')
      .eq('order_id', order.id);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const preferenceResult = await createMercadoPagoPreference({
      orderId: order.id,
      orderNumber: order.order_number,
      tenantSlug: tenant.slug,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      total: Number(order.total),
      currency: settings.currency || 'ARS',
      accessToken: settings.mercadopago_access_token,
      appUrl,
      items: (items ?? []).map((i) => ({
        title: i.product_name,
        unitPrice: Number(i.unit_price),
        quantity: i.quantity,
      })),
    });

    // 4. Guardar en base de datos
    await adminSupabase
      .from('orders')
      .update({
        gateway_preference_id: preferenceResult.preferenceId,
        gateway_init_point: preferenceResult.initPoint,
      })
      .eq('id', order.id);

    return { success: true, data: { initPoint: preferenceResult.initPoint } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al conectar con Mercado Pago',
    };
  }
}

export interface PaymentSettingsInput {
  acceptsCash: boolean;
  acceptsMercadoPago: boolean;
  mercadopagoAccessToken?: string | null;
  mercadopagoPublicKey?: string | null;
  mercadopagoSandboxMode: boolean;
}

/**
 * Actualiza las opciones de pago del carrito.
 */
export async function updateTenantPaymentSettingsAction(
  tenantId: string,
  input: PaymentSettingsInput
): Promise<PaymentActionResult> {
  try {
    await requireTenantMembership(tenantId, 'manager');
    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
      .from('tenant_settings')
      .update({
        accepts_cash: input.acceptsCash,
        accepts_mercadopago: input.acceptsMercadoPago,
        mercadopago_access_token: input.mercadopagoAccessToken?.trim() || null,
        mercadopago_public_key: input.mercadopagoPublicKey?.trim() || null,
        mercadopago_sandbox_mode: input.mercadopagoSandboxMode,
      })
      .eq('tenant_id', tenantId);

    if (error) throw new Error(error.message);

    revalidatePath('/admin', 'layout');
    revalidatePath('/c/[slug]', 'layout');

    return { success: true, data: undefined };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al guardar configuración de pagos',
    };
  }
}
