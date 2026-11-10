import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireTenantMembership } from '@/features/auth/server';
import { getPublicMenuBySlug } from '@/features/catalog/queries';
import { ThemeEditorView } from '@/features/menu-engine/components/ThemeEditorView';
import type { ThemeTokens, LayoutConfig } from '@/features/menu-engine/types';

interface ThemePageProps {
  params: Promise<{
    tenantSlug: string;
  }>;
}

export async function generateMetadata({ params }: ThemePageProps): Promise<Metadata> {
  const { tenantSlug } = await params;
  return {
    title: `Personalización Visual | ${tenantSlug} — Carrito Take-Away`,
    description: 'Selector de presets y editor visual con preview en tiempo real.',
  };
}

export default async function ThemePage({ params }: ThemePageProps) {
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

  // 2. Verificar membresía (manager o superior para diseño)
  try {
    await requireTenantMembership(tenant.id, 'manager');
  } catch {
    redirect(`/login?redirect=/admin/${tenantSlug}/theme`);
  }

  // 3. Obtener tema guardado del carrito
  const { data: themeRecord } = await supabase
    .from('menu_themes')
    .select('preset_code, tokens, layout_config')
    .eq('tenant_id', tenant.id)
    .maybeSingle();

  // 4. Obtener datos de la carta pública para alimentar la preview interactiva
  const menuData = await getPublicMenuBySlug(tenantSlug);

  if (!menuData) {
    notFound();
  }

  const initialPresetCode = themeRecord?.preset_code || 'antigravity_dark';
  const initialTokens = (themeRecord?.tokens as Partial<ThemeTokens>) || {};
  const initialLayoutConfig = (themeRecord?.layout_config as LayoutConfig) || {};

  return (
    <ThemeEditorView
      tenantId={tenant.id}
      tenantSlug={tenant.slug}
      initialPresetCode={initialPresetCode}
      initialTokens={initialTokens}
      initialLayoutConfig={initialLayoutConfig}
      menuData={menuData}
    />
  );
}
