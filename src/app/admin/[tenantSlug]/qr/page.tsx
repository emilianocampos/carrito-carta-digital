import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireTenantMembership } from '@/features/auth/server';
import { QRMarketingView } from '@/features/qr-marketing/components/QRMarketingView';

interface QRPageProps {
  params: Promise<{
    tenantSlug: string;
  }>;
}

export async function generateMetadata({ params }: QRPageProps): Promise<Metadata> {
  const { tenantSlug } = await params;
  return {
    title: `Código QR & Cartelería | ${tenantSlug} — Carrito Take-Away`,
    description: 'Generá tu QR para la plaza, descargá cartelería lista para imprimir y compartí el link en Instagram.',
  };
}

export default async function QRPage({ params }: QRPageProps) {
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

  // 2. Verificar membresía (staff o manager)
  try {
    await requireTenantMembership(tenant.id, 'staff');
  } catch {
    redirect(`/login?redirect=/admin/${tenantSlug}/qr`);
  }

  // 3. Obtener configuración (slogan, moneda)
  const { data: settings } = await supabase
    .from('tenant_settings')
    .select('slogan, currency')
    .eq('tenant_id', tenant.id)
    .maybeSingle();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return (
    <QRMarketingView
      tenantSlug={tenant.slug}
      tenantName={tenant.name}
      slogan={settings?.slogan}
      currency={settings?.currency || 'ARS'}
      appUrl={appUrl}
    />
  );
}
