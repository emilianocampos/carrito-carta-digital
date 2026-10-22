'use server';

import { createClient } from '@/lib/supabase/server';
import { requireTenantMembership } from '@/features/auth/server';
import { hasFeature, canCreateProduct } from '@/features/billing/entitlements';
import { getAIProvider } from './factory';
import type { ParsedMenuResult, MarketingCopyResult } from './types';
import { revalidatePath } from 'next/cache';

export type AIActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Procesa una imagen de una pizarra o menú físico con Visión Multimodal.
 */
export async function extractMenuFromImageAction(
  tenantId: string,
  imageBase64: string
): Promise<AIActionResult<ParsedMenuResult>> {
  try {
    await requireTenantMembership(tenantId, 'manager');

    // Validación de Entitlement en el plan
    const isAllowed = await hasFeature(tenantId, 'ai_menu_import');
    if (!isAllowed) {
      return {
        success: false,
        error: 'El Escaneo de Menú con IA está disponible en los planes Pro y Premium.',
      };
    }

    const provider = getAIProvider();
    const result = await provider.extractMenuFromImage(imageBase64);

    return { success: true, data: result };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al procesar la imagen del menú',
    };
  }
}

/**
 * Importa las categorías y productos extraídos por la IA a la base de datos del carrito.
 */
export async function importParsedMenuAction(
  tenantId: string,
  parsedMenu: ParsedMenuResult
): Promise<AIActionResult<{ importedCategoriesCount: number; importedProductsCount: number }>> {
  try {
    await requireTenantMembership(tenantId, 'manager');
    const supabase = await createClient();

    let importedCategoriesCount = 0;
    let importedProductsCount = 0;

    for (const cat of parsedMenu.categories) {
      // 1. Buscar o crear categoría
      let categoryId: string | null = null;
      const { data: existingCat } = await supabase
        .from('categories')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('name', cat.name)
        .is('deleted_at', null)
        .maybeSingle();

      if (existingCat) {
        categoryId = existingCat.id;
      } else {
        const { data: newCat, error: catErr } = await supabase
          .from('categories')
          .insert({
            tenant_id: tenantId,
            name: cat.name,
            sort_order: 0,
            is_active: true,
          })
          .select('id')
          .single();

        if (catErr || !newCat) continue;
        categoryId = newCat.id;
        importedCategoriesCount++;
      }

      // 2. Insertar productos verificando cuota del plan
      for (const prod of cat.products) {
        const quotaCheck = await canCreateProduct(tenantId);
        if (!quotaCheck.allowed) {
          // Si alcanzó el límite del plan, cortar respetando la cuota
          break;
        }

        const { error: prodErr } = await supabase.from('products').insert({
          tenant_id: tenantId,
          category_id: categoryId,
          name: prod.name,
          description: prod.description || null,
          price: prod.price,
          is_available: true,
          is_featured: false,
          sort_order: 0,
          preparation_time_minutes: 15,
        });

        if (!prodErr) {
          importedProductsCount++;
        }
      }
    }

    revalidatePath('/c/[slug]', 'layout');
    revalidatePath('/admin', 'layout');

    return {
      success: true,
      data: { importedCategoriesCount, importedProductsCount },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al importar los productos',
    };
  }
}

/**
 * Genera opciones de descripción gastronómica atractiva con IA.
 */
export async function generateProductDescriptionAction(
  tenantId: string,
  productName: string,
  categoryName?: string,
  ingredients?: string
): Promise<AIActionResult<{ descriptions: string[] }>> {
  try {
    await requireTenantMembership(tenantId, 'manager');

    const isAllowed = await hasFeature(tenantId, 'ai_descriptions');
    if (!isAllowed) {
      return {
        success: false,
        error: 'El Redactor Gastronómico con IA está disponible en los planes Pro y Premium.',
      };
    }

    const provider = getAIProvider();
    const descriptions = await provider.generateProductDescription(
      productName,
      categoryName,
      ingredients
    );

    return { success: true, data: { descriptions } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al generar descripciones',
    };
  }
}

/**
 * Genera copys persuasivos para cartelería física con código QR.
 */
export async function generateMarketingCopyAction(
  tenantId: string,
  specialty: string,
  tone: 'fun' | 'serious' | 'promotional'
): Promise<AIActionResult<MarketingCopyResult>> {
  try {
    await requireTenantMembership(tenantId, 'manager');
    const supabase = await createClient();

    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single();

    const provider = getAIProvider();
    const result = await provider.generateMarketingCopy(
      tenant?.name || 'Carrito Take-Away',
      specialty,
      tone
    );

    return { success: true, data: result };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al generar copy publicitario',
    };
  }
}
