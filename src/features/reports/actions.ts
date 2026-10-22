'use server';

import { createClient } from '@/lib/supabase/server';
import { requireTenantMembership } from '@/features/auth/server';

export interface ProductSaleItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface OrderSaleItem {
  id: string;
  orderNumber: number;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  paymentStatus: string;
  orderStatus: string;
  total: number;
  itemsSummary: string;
}

export interface SalesReportData {
  tenantName: string;
  currency: string;
  period: 'today' | 'yesterday' | 'week' | 'month' | 'all';
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalOrdersCount: number;
  averageTicket: number;
  paymentBreakdown: {
    cashTotal: number;
    cashCount: number;
    onlineTotal: number;
    onlineCount: number;
  };
  productsSummary: ProductSaleItem[];
  ordersList: OrderSaleItem[];
}

export async function getSalesReportAction(
  tenantId: string,
  period: 'today' | 'yesterday' | 'week' | 'month' | 'all' = 'today'
): Promise<{ success: boolean; data?: SalesReportData; error?: string }> {
  try {
    await requireTenantMembership(tenantId, 'staff');
    const supabase = await createClient();

    // 1. Obtener datos del Tenant y Moneda
    const [{ data: tenant }, { data: settings }] = await Promise.all([
      supabase.from('tenants').select('name').eq('id', tenantId).single(),
      supabase.from('tenant_settings').select('currency').eq('tenant_id', tenantId).maybeSingle(),
    ]);

    const tenantName = tenant?.name || 'Carrito';
    const currency = settings?.currency || 'ARS';

    // 2. Calcular rango de fechas según período
    const now = new Date();
    let startDate: Date;
    let periodLabel = 'Hoy';

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      periodLabel = `Hoy (${startDate.toLocaleDateString('es-AR')})`;
    } else if (period === 'yesterday') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      periodLabel = `Ayer (${startDate.toLocaleDateString('es-AR')})`;
    } else if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      periodLabel = `Últimos 7 días (desde ${startDate.toLocaleDateString('es-AR')})`;
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      periodLabel = `Mes Actual (${now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })})`;
    } else {
      startDate = new Date(2020, 0, 1);
      periodLabel = 'Histórico Completo';
    }

    // 3. Consultar órdenes en el rango (excluyendo canceladas)
    let query = supabase
      .from('orders')
      .select('id, order_number, customer_name, customer_phone, total, payment_status, order_status, created_at')
      .eq('tenant_id', tenantId)
      .neq('order_status', 'cancelled')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (period === 'yesterday') {
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      query = query.lte('created_at', endOfYesterday.toISOString());
    }

    const { data: rawOrders, error } = await query;
    if (error) throw new Error(error.message);

    const orders = rawOrders || [];
    const orderIds = orders.map((o) => o.id);

    const itemsMap: Record<
      string,
      Array<{ product_name: string; quantity: number; unit_price: number; subtotal: number }>
    > = {};

    if (orderIds.length > 0) {
      const { data: items } = await supabase
        .from('order_items')
        .select('order_id, product_name, quantity, unit_price, subtotal')
        .in('order_id', orderIds);

      if (items) {
        items.forEach((it) => {
          if (!itemsMap[it.order_id]) itemsMap[it.order_id] = [];
          itemsMap[it.order_id].push({
            product_name: it.product_name,
            quantity: Number(it.quantity || 1),
            unit_price: Number(it.unit_price || 0),
            subtotal: Number(it.subtotal || 0),
          });
        });
      }
    }

    // 4. Procesar métricas agregadas
    let totalRevenue = 0;
    let cashTotal = 0;
    let cashCount = 0;
    let onlineTotal = 0;
    let onlineCount = 0;

    const productsMap = new Map<string, { quantity: number; unitPrice: number; totalAmount: number }>();

    const ordersList: OrderSaleItem[] = orders.map((o) => {
      const orderTotal = Number(o.total || 0);
      totalRevenue += orderTotal;

      if (o.payment_status === 'cash_on_pickup') {
        cashTotal += orderTotal;
        cashCount += 1;
      } else {
        onlineTotal += orderTotal;
        onlineCount += 1;
      }

      const items = itemsMap[o.id] || [];

      items.forEach((it) => {
        const current = productsMap.get(it.product_name) || {
          quantity: 0,
          unitPrice: Number(it.unit_price || 0),
          totalAmount: 0,
        };
        current.quantity += Number(it.quantity || 1);
        current.totalAmount += Number(it.subtotal || it.unit_price * it.quantity || 0);
        productsMap.set(it.product_name, current);
      });

      const itemsSummary = items
        .map((it) => `${it.quantity}x ${it.product_name}`)
        .join(', ');

      return {
        id: o.id,
        orderNumber: o.order_number,
        createdAt: o.created_at,
        customerName: o.customer_name || 'Cliente',
        customerPhone: o.customer_phone || '-',
        paymentStatus: o.payment_status,
        orderStatus: o.order_status,
        total: orderTotal,
        itemsSummary,
      };
    });

    const totalOrdersCount = ordersList.length;
    const averageTicket = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

    // Convertir mapa de productos a array ordenado por recaudación
    const productsSummary: ProductSaleItem[] = Array.from(productsMap.entries())
      .map(([name, data]) => ({
        productName: name,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalAmount: data.totalAmount,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      success: true,
      data: {
        tenantName,
        currency,
        period,
        periodLabel,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        totalRevenue,
        totalOrdersCount,
        averageTicket,
        paymentBreakdown: {
          cashTotal,
          cashCount,
          onlineTotal,
          onlineCount,
        },
        productsSummary,
        ordersList,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al generar el reporte de ventas.',
    };
  }
}
