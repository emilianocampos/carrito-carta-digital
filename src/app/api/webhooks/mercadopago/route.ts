import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    // Mercado Pago envía el ID de pago en body.data.id o en los query params (topic=payment&id=...)
    const paymentId =
      body?.data?.id ||
      url.searchParams.get('data.id') ||
      url.searchParams.get('id');

    const type = body?.type || url.searchParams.get('topic') || url.searchParams.get('type');

    // Si la notificación no es de tipo 'payment' o no tiene ID, responder OK para confirmar recepción
    if (!paymentId || (type && type !== 'payment')) {
      return NextResponse.json({ status: 'ignored_non_payment' }, { status: 200 });
    }

    const supabaseAdmin = createAdminClient();

    // 1. Obtener datos del pago directamente de la API de Mercado Pago
    // Usamos el token global o token del webhook
    const globalToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    let paymentData: {
      status?: string;
      external_reference?: string;
      transaction_amount?: number;
    } | null = null;

    if (globalToken) {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${globalToken}`,
        },
      });

      if (mpRes.ok) {
        paymentData = await mpRes.json();
      }
    }

    // Si no pudimos consultar por falta de token global, buscar si hay una orden con ese preference_id
    const orderId = paymentData?.external_reference;
    const mpStatus = paymentData?.status;

    if (!orderId) {
      return NextResponse.json({ status: 'no_external_reference' }, { status: 200 });
    }

    // 2. Reconciliación Idempotente contra PostgreSQL
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, order_status, payment_status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ status: 'order_not_found' }, { status: 200 });
    }

    // IDEMPOTENCIA: Si la orden ya estaba aprobada, no re-procesar
    if (order.payment_status === 'approved') {
      return NextResponse.json({ status: 'already_approved' }, { status: 200 });
    }

    // 3. Aplicar transición según estado del pago
    if (mpStatus === 'approved') {
      // El pago fue aprobado: pasa a 'approved' y entra directamente a 'preparing' en cocina
      const nextOrderStatus = order.order_status === 'pending' ? 'preparing' : order.order_status;

      await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'approved',
          order_status: nextOrderStatus,
          gateway_payment_id: String(paymentId),
        })
        .eq('id', order.id);
    } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
      await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'rejected',
          gateway_payment_id: String(paymentId),
        })
        .eq('id', order.id);
    }

    return NextResponse.json({ received: true, orderId, mpStatus }, { status: 200 });
  } catch (err: unknown) {
    // Siempre responder 200 para evitar que Mercado Pago reintente infinitamente
    console.error('Mercado Pago Webhook Error:', err);
    return NextResponse.json(
      { status: 'error_logged', error: err instanceof Error ? err.message : 'Unknown' },
      { status: 200 }
    );
  }
}
