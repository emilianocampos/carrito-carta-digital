import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireTenantMembership } from '@/features/auth/server';
import {
  CustomersView,
  type CustomerData,
  type CouponData,
} from '@/features/promotions/components/CustomersView';

interface CustomersPageProps {
  params: Promise<{
    tenantSlug: string;
  }>;
}

export async function generateMetadata({ params }: CustomersPageProps): Promise<Metadata> {
  const { tenantSlug } = await params;
  return {
    title: `Clientes & Cupones | ${tenantSlug} — Carrito Take-Away`,
    description: 'CRM de clientes, puntos acumulados y gestión de promociones.',
  };
}

export default async function CustomersPage({ params }: CustomersPageProps) {
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

  // 2. Verificar membresía (manager o superior para CRM y Cupones)
  try {
    await requireTenantMembership(tenant.id, 'manager');
  } catch {
    redirect(`/login?redirect=/admin/${tenantSlug}/customers`);
  }

  // 3. Obtener configuración (moneda)
  const { data: settings } = await supabase
    .from('tenant_settings')
    .select('currency')
    .eq('tenant_id', tenant.id)
    .maybeSingle();

  // 4. Obtener listado de clientes
  const { data: customersRaw } = await supabase
    .from('customers')
    .select('id, name, phone, total_orders, total_spent, points_balance, last_order_at, created_at')
    .eq('tenant_id', tenant.id)
    .order('total_orders', { ascending: false });

  const customers: CustomerData[] = (customersRaw ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    totalOrders: c.total_orders,
    totalSpent: Number(c.total_spent),
    pointsBalance: c.points_balance,
    lastOrderAt: c.last_order_at,
    createdAt: c.created_at,
  }));

  // 5. Obtener listado de cupones
  const { data: couponsRaw } = await supabase
    .from('coupons')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false });

  const coupons: CouponData[] = (couponsRaw ?? []).map((c) => ({
    id: c.id,
    code: c.code,
    discountType: c.discount_type as 'percentage' | 'fixed_amount',
    discountValue: Number(c.discount_value),
    minOrderAmount: Number(c.min_order_amount),
    maxDiscountAmount: c.max_discount_amount ? Number(c.max_discount_amount) : null,
    maxUses: c.max_uses,
    currentUses: c.current_uses,
    validUntil: c.valid_until,
    isActive: c.is_active,
  }));

  return (
    <CustomersView
      tenantId={tenant.id}
      tenantSlug={tenant.slug}
      currency={settings?.currency ?? 'ARS'}
      initialCustomers={customers}
      initialCoupons={coupons}
    />
  );
}
