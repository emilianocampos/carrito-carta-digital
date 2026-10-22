import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireTenantMembership } from '@/features/auth/server';
import {
  KitchenKDSView,
  type KitchenOrder,
  type KitchenOrderItem,
} from '@/features/orders/components/KitchenKDSView';
import type { OrderStatus } from '@/types/database';

interface AdminOrdersPageProps {
  params: Promise<{
    tenantSlug: string;
  }>;
}

export async function generateMetadata({ params }: AdminOrdersPageProps): Promise<Metadata> {
  const { tenantSlug } = await params;
  return {
    title: `Cocina KDS | ${tenantSlug} — Carrito Take-Away`,
    description: 'Comandera y despacho en tiempo real para cocina.',
  };
}

export default async function AdminOrdersPage({ params }: AdminOrdersPageProps) {
  const { tenantSlug } = await params;
  const supabase = await createClient();

  // 1. Obtener Tenant por slug
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name, slug, status')
    .eq('slug', tenantSlug)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  // 2. Verificar autorización del usuario en este carrito (mínimo staff)
  try {
    await requireTenantMembership(tenant.id, 'staff');
  } catch {
    // Si no está autenticado, redirigir a login
    redirect(`/login?redirect=/admin/${tenantSlug}/orders`);
  }

  // 3. Obtener configuración operativa del carrito
  const { data: settings } = await supabase
    .from('tenant_settings')
    .select('currency, current_preparation_time_minutes, is_ordering_paused, pause_reason')
    .eq('tenant_id', tenant.id)
    .maybeSingle();

  // 4. Obtener pedidos recientes (últimas 24 horas)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      customer_name,
      customer_phone,
      order_status,
      payment_status,
      order_type,
      scheduled_for,
      estimated_ready_at,
      total,
      notes,
      created_at
    `)
    .eq('tenant_id', tenant.id)
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  // 5. Obtener ítems de los pedidos
  const orderIds = orders ? orders.map((o) => o.id) : [];
  let itemsMap: Record<string, KitchenOrderItem[]> = {};

  if (orderIds.length > 0) {
    const { data: items } = await supabase
      .from('order_items')
      .select('id, order_id, product_name, unit_price, quantity, subtotal, options_snapshot')
      .in('order_id', orderIds);

    if (items) {
      items.forEach((item) => {
        if (!itemsMap[item.order_id]) itemsMap[item.order_id] = [];
        itemsMap[item.order_id].push({
          id: item.id,
          productName: item.product_name,
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          subtotal: Number(item.subtotal),
          optionsSnapshot: (item.options_snapshot as unknown as KitchenOrderItem['optionsSnapshot']) ?? {},
        });
      });
    }
  }

  const initialOrders: KitchenOrder[] = (orders ?? []).map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    orderStatus: o.order_status as OrderStatus,
    paymentStatus: o.payment_status,
    orderType: o.order_type as 'takeaway' | 'pickup_scheduled',
    scheduledFor: o.scheduled_for,
    estimatedReadyAt: o.estimated_ready_at,
    total: Number(o.total),
    notes: o.notes,
    createdAt: o.created_at,
    items: itemsMap[o.id] ?? [],
  }));

  return (
    <KitchenKDSView
      tenantId={tenant.id}
      tenantSlug={tenant.slug}
      currency={settings?.currency ?? 'ARS'}
      initialPreparationTimeMinutes={settings?.current_preparation_time_minutes ?? 20}
      initialIsOrderingPaused={settings?.is_ordering_paused ?? false}
      initialPauseReason={settings?.pause_reason}
      initialOrders={initialOrders}
    />
  );
}
