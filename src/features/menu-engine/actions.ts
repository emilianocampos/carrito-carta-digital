'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireTenantMembership } from '@/features/auth/server';
import type { ThemeTokens, LayoutConfig } from './types';
import type { Json } from '@/types/database';
import { revalidatePath } from 'next/cache';

export type ThemeActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Guarda o actualiza el tema y preset visual personalizado de la carta del carrito.
 * Requiere rol de manager o owner.
 */
export async function saveMenuThemeAction(
  tenantId: string,
  presetCode: string,
  tokens: Partial<ThemeTokens>,
  layoutConfig: LayoutConfig
): Promise<ThemeActionResult> {
  try {
    await requireTenantMembership(tenantId, 'manager');

    // Usamos el cliente de backend para el upsert seguro tras validar membresía
    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
      .from('menu_themes')
      .upsert(
        {
          tenant_id: tenantId,
          preset_code: presetCode,
          tokens: tokens as unknown as Json,
          layout_config: layoutConfig as unknown as Json,
        },
        { onConflict: 'tenant_id' }
      );

    if (error) throw new Error(error.message);

    revalidatePath('/c/[slug]', 'layout');
    revalidatePath('/admin', 'layout');

    return { success: true, data: undefined };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al guardar el tema visual',
    };
  }
}

/**
 * Guarda o actualiza branding (logo, banner, slogan) y modelo de tarjeta (con_foto, sin_foto, vintage)
 */
export async function updateBrandingAndCardStyleAction(
  tenantId: string,
  data: {
    slogan?: string;
    cardStyle?: 'con_foto' | 'sin_foto' | 'vintage';
    logoUrl?: string | null;
    bannerUrl?: string | null;
    name?: string;
  }
): Promise<ThemeActionResult> {
  try {
    await requireTenantMembership(tenantId, 'manager');
    const adminSupabase = createAdminClient();

    // Actualizar settings
    const settingsUpdate: {
      slogan?: string;
      card_style?: 'con_foto' | 'sin_foto' | 'vintage';
    } = {};
    if (data.slogan !== undefined) settingsUpdate.slogan = data.slogan;
    if (data.cardStyle !== undefined) settingsUpdate.card_style = data.cardStyle;

    if (Object.keys(settingsUpdate).length > 0) {
      const { error: settingsError } = await adminSupabase
        .from('tenant_settings')
        .update(settingsUpdate)
        .eq('tenant_id', tenantId);

      if (settingsError) {
        // Si la columna card_style o slogan no existe aún en el schema de Supabase, reintentar sin ella para no trabar el guardado de logo/banner
        if (settingsError.message.includes('card_style')) {
          delete settingsUpdate.card_style;
          if (Object.keys(settingsUpdate).length > 0) {
            await adminSupabase
              .from('tenant_settings')
              .update(settingsUpdate)
              .eq('tenant_id', tenantId);
          }
        } else {
          throw new Error(settingsError.message);
        }
      }
    }

    // Actualizar tenant (logo, banner, name)
    const tenantUpdate: {
      logo_url?: string | null;
      banner_url?: string | null;
      name?: string;
    } = {};
    if (data.logoUrl !== undefined) tenantUpdate.logo_url = data.logoUrl;
    if (data.bannerUrl !== undefined) tenantUpdate.banner_url = data.bannerUrl;
    if (data.name !== undefined) tenantUpdate.name = data.name;

    if (Object.keys(tenantUpdate).length > 0) {
      const { error: tenantError } = await adminSupabase
        .from('tenants')
        .update(tenantUpdate)
        .eq('id', tenantId);
      if (tenantError) throw new Error(tenantError.message);
    }

    revalidatePath('/c/[slug]', 'layout');
    revalidatePath('/admin', 'layout');

    return { success: true, data: undefined };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al guardar la configuración de marca',
    };
  }
}

