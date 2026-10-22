import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import {
  OrderTrackingView,
  type OrderTrackingData,
  type OrderItemSnapshot,
} from '@/features/orders/components/OrderTrackingView';
import type { OrderStatus, PaymentStatus } from '@/types/database';

interface TrackingPageProps {
  params: Promise<{
    slug: string;
    orderId: string;
  }>;
}

export async function generateMetadata({ params }: TrackingPageProps): Promise<Metadata> {
  const { orderId } = await params;
  return {
    title: `Seguimiento de Pedido | Carrito Take-Away`,
    description: `Seguí el estado de preparación de tu pedido en tiempo real. ID: ${orderId}`,
  };
}

export default async function TrackingPage({ params }: TrackingPageProps) {
  const { slug, orderId } = await params;
  const supabase = await createClient();

  // 1. Obtener datos del pedido
  const { data: order, error: orderError } = await supabase
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
      subtotal,
      discount,
      total,
      notes,
      created_at,
      tenants!inner (
        name,
        slug,
        status
      )
    `)
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    notFound();
  }

  // 2. Obtener settings del carrito
  const { data: settings } = await supabase
    .from('tenant_settings')
    .select('currency, whatsapp_phone')
    .eq('tenant_id', (order as unknown as { tenant_id: string }).tenant_id ?? '')
    .maybeSingle();

  // 3. Obtener ítems del pedido
  const { data: items } = await supabase
    .from('order_items')
    .select('id, product_name, unit_price, quantity, subtotal, options_snapshot')
    .eq('order_id', orderId);

  const formattedItems: OrderItemSnapshot[] = (items ?? []).map((item) => ({
    id: item.id,
    productName: item.product_name,
    unitPrice: Number(item.unit_price),
    quantity: item.quantity,
    subtotal: Number(item.subtotal),
    optionsSnapshot: (item.options_snapshot as unknown as OrderItemSnapshot['optionsSnapshot']) ?? {},
  }));

  const trackingData: OrderTrackingData = {
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    orderStatus: order.order_status as OrderStatus,
    paymentStatus: order.payment_status as PaymentStatus,
    orderType: order.order_type as 'takeaway' | 'pickup_scheduled',
    scheduledFor: order.scheduled_for,
    estimatedReadyAt: order.estimated_ready_at,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    total: Number(order.total),
    notes: order.notes,
    createdAt: order.created_at,
    tenant: {
      name: (order.tenants as unknown as { name: string }).name,
      slug: (order.tenants as unknown as { slug: string }).slug,
      whatsappPhone: settings?.whatsapp_phone ?? null,
      currency: settings?.currency ?? 'ARS',
    },
    items: formattedItems,
  };

  return <OrderTrackingView initialOrder={trackingData} />;
}
