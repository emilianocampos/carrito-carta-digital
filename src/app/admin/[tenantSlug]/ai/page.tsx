import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireTenantMembership } from '@/features/auth/server';
import { AIStudioView } from '@/features/ai/components/AIStudioView';

interface AIPageProps {
  params: Promise<{
    tenantSlug: string;
  }>;
}

export async function generateMetadata({ params }: AIPageProps): Promise<Metadata> {
  const { tenantSlug } = await params;
  return {
    title: `Estudio de IA | ${tenantSlug} — Carrito Take-Away`,
    description: 'Herramientas de IA gastronómica para digitalización de cartas y marketing.',
  };
}

export default async function AIPage({ params }: AIPageProps) {
  const { tenantSlug } = await params;
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

  // 2. Validar membresía (manager o superior)
  try {
    await requireTenantMembership(tenant.id, 'manager');
  } catch {
    redirect(`/login?redirect=/admin/${tenantSlug}/ai`);
  }

  // 3. Obtener moneda
  const { data: settings } = await supabase
    .from('tenant_settings')
    .select('currency')
    .eq('tenant_id', tenant.id)
    .single();

  return (
    <AIStudioView
      tenantId={tenant.id}
      tenantSlug={tenant.slug}
      currency={settings?.currency || 'ARS'}
    />
  );
}
