import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireTenantMembership } from '@/features/auth/server';
import { UnifiedSettingsView } from './UnifiedSettingsView';

interface SettingsPageProps {
  params: Promise<{
    tenantSlug: string;
  }>;
  searchParams?: Promise<{
    tab?: string;
  }>;
}

export async function generateMetadata({ params }: SettingsPageProps): Promise<Metadata> {
  const { tenantSlug } = await params;
  return {
    title: `Configuración | ${tenantSlug} — Carrito Take-Away`,
    description: 'Gestión de credenciales de Mercado Pago, métodos de cobro y planes de suscripción.',
  };
}

export default async function SettingsPage({ params, searchParams }: SettingsPageProps) {
  const { tenantSlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const activeTab = resolvedSearchParams.tab === 'billing' ? 'billing' : 'payments';

  const supabase = await createClient();

  // 1. Obtener Tenant por slug
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .eq('slug', tenantSlug)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  // 2. Verificar membresía (manager o superior)
  try {
    await requireTenantMembership(tenant.id, 'manager');
  } catch {
    redirect(`/login?redirect=/admin/${tenantSlug}/settings`);
  }

  // 3. Obtener configuración de pagos y credenciales del tenant
  const { data: settings } = await supabase
    .from('tenant_settings')
    .select('accepts_cash, accepts_mercadopago, mercadopago_access_token, mercadopago_public_key, mercadopago_sandbox_mode')
    .eq('tenant_id', tenant.id)
    .single();

  // 4. Obtener suscripción actual
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, current_period_end, plans(id, code, name, price)')
    .eq('tenant_id', tenant.id)
    .maybeSingle();

  // 5. Obtener planes disponibles
  const { data: plansRaw } = await supabase
    .from('plans')
    .select('id, code, name, price')
    .eq('is_active', true)
    .order('price', { ascending: true });

  const plans = plansRaw ?? [];

  return (
    <UnifiedSettingsView
      tenantId={tenant.id}
      tenantSlug={tenant.slug}
      tenantName={tenant.name}
      initialTab={activeTab}
      initialPaymentSettings={{
        acceptsCash: settings?.accepts_cash ?? true,
        acceptsMercadoPago: settings?.accepts_mercadopago ?? false,
        mercadopagoAccessToken: settings?.mercadopago_access_token ?? null,
        mercadopagoPublicKey: settings?.mercadopago_public_key ?? null,
        mercadopagoSandboxMode: settings?.mercadopago_sandbox_mode ?? true,
      }}
      subscription={subscription as any}
      plans={plans}
    />
  );
}
