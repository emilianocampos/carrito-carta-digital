import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/features/auth/server';
import {
  SuperAdminView,
  type SuperAdminTenant,
  type SuperAdminPlan,
  type AuditLogEntry,
} from '@/features/super-admin/components/SuperAdminView';
import type { TenantStatus } from '@/types/database';

export const metadata: Metadata = {
  title: 'Super Admin | Carrito Take-Away',
  description: 'Panel de control maestro de la plataforma SaaS.',
};

export default async function SuperAdminPage() {
  // 1. Validar autorización estricta de Super Admin
  try {
    await requireSuperAdmin();
  } catch {
    redirect('/login?redirect=/admin/super');
  }

  const supabase = await createClient();

  // 2. Obtener todos los tenants de la plataforma
  const { data: tenantsRaw } = await supabase
    .from('tenants')
    .select('id, name, slug, status, created_at')
    .order('created_at', { ascending: false });

  // 3. Obtener suscripciones y planes (incluyendo período de prueba gratis)
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('tenant_id, status, current_period_end, plans(code, name)');

  interface SubDetails {
    code: string;
    name: string;
    subscriptionStatus: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'suspended' | 'expired';
    trialEndsAt: string | null;
    daysRemainingInTrial: number;
    isTrialExpired: boolean;
  }

  const subMap = new Map<string, SubDetails>();
  const now = new Date();

  if (subscriptions) {
    subscriptions.forEach((s) => {
      const p = s.plans as unknown as { code: string; name: string };
      const status = (s.status as SubDetails['subscriptionStatus']) || 'trialing';
      const trialEndsAt = s.current_period_end || null;
      const daysRemaining = trialEndsAt
        ? Math.ceil((new Date(trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const isTrialExpired = status === 'expired' || (status === 'trialing' && daysRemaining <= 0);

      subMap.set(s.tenant_id, {
        code: p?.code || 'basic',
        name: p?.name || 'Básico',
        subscriptionStatus: status,
        trialEndsAt,
        daysRemainingInTrial: Math.max(0, daysRemaining),
        isTrialExpired,
      });
    });
  }

  // 4. Obtener agregados por tenant (productos, pedidos y facturación)
  const { data: products } = await supabase
    .from('products')
    .select('tenant_id')
    .is('deleted_at', null);

  const prodCountMap = new Map<string, number>();
  if (products) {
    products.forEach((p) => {
      prodCountMap.set(p.tenant_id, (prodCountMap.get(p.tenant_id) || 0) + 1);
    });
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('tenant_id, total, order_status');

  const orderCountMap = new Map<string, number>();
  const salesMap = new Map<string, number>();

  if (orders) {
    orders.forEach((o) => {
      orderCountMap.set(o.tenant_id, (orderCountMap.get(o.tenant_id) || 0) + 1);
      if (o.order_status !== 'cancelled') {
        salesMap.set(o.tenant_id, (salesMap.get(o.tenant_id) || 0) + Number(o.total));
      }
    });
  }

  const formattedTenants: SuperAdminTenant[] = (tenantsRaw ?? []).map((t) => {
    const sub = subMap.get(t.id) || {
      code: 'basic',
      name: 'Básico',
      subscriptionStatus: 'trialing' as const,
      trialEndsAt: null,
      daysRemainingInTrial: 7,
      isTrialExpired: false,
    };

    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      status: t.status as TenantStatus,
      createdAt: t.created_at,
      planCode: sub.code,
      planName: sub.name,
      subscriptionStatus: sub.subscriptionStatus,
      trialEndsAt: sub.trialEndsAt,
      daysRemainingInTrial: sub.daysRemainingInTrial,
      isTrialExpired: sub.isTrialExpired,
      productsCount: prodCountMap.get(t.id) || 0,
      ordersCount: orderCountMap.get(t.id) || 0,
      totalSales: salesMap.get(t.id) || 0,
    };
  });

  // 5. Contar total de comensales en toda la plataforma
  const { count: customersCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  // 6. Obtener planes
  const { data: plansRaw } = await supabase
    .from('plans')
    .select('id, code, name, price')
    .order('price', { ascending: true });

  const formattedPlans: SuperAdminPlan[] = (plansRaw ?? []).map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    priceMonthly: Number(p.price),
    featuresCount: p.code === 'basic' ? 3 : p.code === 'pro' ? 8 : 14,
  }));

  // 7. Obtener logs recientes de auditoría
  const { data: auditLogsRaw } = await supabase
    .from('audit_logs')
    .select('id, action, entity_type, created_at, metadata')
    .order('created_at', { ascending: false })
    .limit(30);

  const formattedLogs: AuditLogEntry[] = (auditLogsRaw ?? []).map((l) => ({
    id: l.id,
    action: l.action,
    entityType: l.entity_type,
    createdAt: l.created_at,
    metadata: (l.metadata as Record<string, unknown>) || {},
  }));

  return (
    <SuperAdminView
      tenants={formattedTenants}
      plans={formattedPlans}
      auditLogs={formattedLogs}
      totalCustomersCount={customersCount || 0}
    />
  );
}
