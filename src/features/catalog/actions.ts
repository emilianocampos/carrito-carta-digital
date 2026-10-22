'use server';

import { createClient } from '@/lib/supabase/server';
import { requireTenantMembership } from '@/features/auth/server';
import { canCreateProduct } from '@/features/billing/entitlements';
import {
  categorySchema,
  productSchema,
  comboSchema,
  type CategoryInput,
  type ProductInput,
  type ComboInput,
} from './schemas';
import { revalidatePath } from 'next/cache';

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ==============================================================================
// CATEGORIES ACTIONS
// ==============================================================================

export async function createCategoryAction(
  tenantId: string,
  input: CategoryInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireTenantMembership(tenantId, 'manager');
    const parsed = categorySchema.parse(input);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .insert({
        tenant_id: tenantId,
        name: parsed.name,
        description: parsed.description ?? null,
        image_url: parsed.imageUrl ? parsed.imageUrl : null,
        sort_order: parsed.sortOrder,
        is_active: parsed.isActive,
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    revalidatePath(`/admin/${tenantId}/menu`);
    revalidatePath(`/c/[slug]`, 'layout');
    return { success: true, data: { id: data.id } };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al crear la categoría' };
  }
}

export async function updateCategoryAction(
  tenantId: string,
  categoryId: string,
  input: Partial<CategoryInput>
): Promise<ActionResult> {
  try {
    await requireTenantMembership(tenantId, 'manager');

    const supabase = await createClient();
    const { error } = await supabase
      .from('categories')
      .update({
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.imageUrl !== undefined && { image_url: input.imageUrl ? input.imageUrl : null }),
        ...(input.sortOrder !== undefined && { sort_order: input.sortOrder }),
        ...(input.isActive !== undefined && { is_active: input.isActive }),
      })
      .eq('id', categoryId)
      .eq('tenant_id', tenantId);

    if (error) throw new Error(error.message);

    revalidatePath(`/admin/${tenantId}/menu`);
    revalidatePath(`/c/[slug]`, 'layout');
    return { success: true, data: undefined };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al actualizar categoría' };
  }
}

export async function deleteCategoryAction(
  tenantId: string,
  categoryId: string
): Promise<ActionResult> {
  try {
    await requireTenantMembership(tenantId, 'manager');

    const supabase = await createClient();
    // Soft delete: no destruye relaciones históricas
    const { error } = await supabase
      .from('categories')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', categoryId)
      .eq('tenant_id', tenantId);

    if (error) throw new Error(error.message);

    revalidatePath(`/admin/${tenantId}/menu`);
    revalidatePath(`/c/[slug]`, 'layout');
    return { success: true, data: undefined };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al eliminar categoría' };
  }
}

// ==============================================================================
// PRODUCTS ACTIONS
// ==============================================================================

export async function createProductAction(
  tenantId: string,
  input: ProductInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireTenantMembership(tenantId, 'manager');

    // 1. Verificación atómica de límites de plan
    const { allowed, current, limit } = await canCreateProduct(tenantId);
    if (!allowed) {
      return {
        success: false,
        error: `Has alcanzado el límite de ${limit} productos de tu plan actual (${current}/${limit}). Realiza un upgrade para agregar más.`,
      };
    }

    const parsed = productSchema.parse(input);
    const supabase = await createClient();

    // 2. Insertar Producto
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        tenant_id: tenantId,
        category_id: parsed.categoryId,
        name: parsed.name,
        description: parsed.description ?? null,
        price: parsed.price,
        image_url: parsed.imageUrl ? parsed.imageUrl : null,
        preparation_time_minutes: parsed.preparationTimeMinutes,
        is_available: parsed.isAvailable,
        is_featured: parsed.isFeatured,
        sort_order: parsed.sortOrder,
      })
      .select('id')
      .single();

    if (productError || !product) throw new Error(productError?.message ?? 'Error al insertar producto');

    // 3. Insertar grupos de opciones y variantes si existen
    if (parsed.optionGroups && parsed.optionGroups.length > 0) {
      for (const group of parsed.optionGroups) {
        const { data: insertedGroup, error: groupError } = await supabase
          .from('product_option_groups')
          .insert({
            tenant_id: tenantId,
            product_id: product.id,
            name: group.name,
            min_selectable: group.minSelectable,
            max_selectable: group.maxSelectable,
            is_required: group.isRequired,
            sort_order: group.sortOrder,
          })
          .select('id')
          .single();

        if (groupError || !insertedGroup) continue;

        if (group.options && group.options.length > 0) {
          const optionsToInsert = group.options.map((opt) => ({
            group_id: insertedGroup.id,
            name: opt.name,
            extra_price: opt.extraPrice,
            is_available: opt.isAvailable,
            sort_order: opt.sortOrder,
          }));

          await supabase.from('product_options').insert(optionsToInsert);
        }
      }
    }

    revalidatePath(`/admin/${tenantId}/menu`);
    revalidatePath(`/c/[slug]`, 'layout');
    return { success: true, data: { id: product.id } };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al crear producto' };
  }
}

export async function toggleProductAvailabilityAction(
  tenantId: string,
  productId: string,
  isAvailable: boolean
): Promise<ActionResult> {
  try {
    // Cocineros (staff) también pueden pausar/despausar productos si se quedan sin insumos
    await requireTenantMembership(tenantId, 'staff');

    const supabase = await createClient();
    const { error } = await supabase
      .from('products')
      .update({ is_available: isAvailable })
      .eq('id', productId)
      .eq('tenant_id', tenantId);

    if (error) throw new Error(error.message);

    revalidatePath(`/admin/${tenantId}/menu`);
    revalidatePath(`/c/[slug]`, 'layout');
    return { success: true, data: undefined };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al cambiar disponibilidad' };
  }
}

export async function updateProductAction(
  tenantId: string,
  productId: string,
  input: ProductInput
): Promise<ActionResult> {
  try {
    await requireTenantMembership(tenantId, 'manager');
    const parsed = productSchema.parse(input);
    const supabase = await createClient();

    // 1. Actualizar producto base
    const { error: productError } = await supabase
      .from('products')
      .update({
        category_id: parsed.categoryId,
        name: parsed.name,
        description: parsed.description ?? null,
        price: parsed.price,
        image_url: parsed.imageUrl ? parsed.imageUrl : null,
        preparation_time_minutes: parsed.preparationTimeMinutes,
        is_available: parsed.isAvailable,
        is_featured: parsed.isFeatured,
        sort_order: parsed.sortOrder,
      })
      .eq('id', productId)
      .eq('tenant_id', tenantId);

    if (productError) throw new Error(productError.message);

    // 2. Reemplazar grupos de opciones si se pasaron
    if (parsed.optionGroups !== undefined) {
      await supabase
        .from('product_option_groups')
        .delete()
        .eq('product_id', productId)
        .eq('tenant_id', tenantId);

      for (const group of parsed.optionGroups) {
        const { data: insertedGroup, error: groupError } = await supabase
          .from('product_option_groups')
          .insert({
            tenant_id: tenantId,
            product_id: productId,
            name: group.name,
            min_selectable: group.minSelectable,
            max_selectable: group.maxSelectable,
            is_required: group.isRequired,
            sort_order: group.sortOrder,
          })
          .select('id')
          .single();

        if (groupError || !insertedGroup) continue;

        if (group.options && group.options.length > 0) {
          const optionsToInsert = group.options.map((opt) => ({
            group_id: insertedGroup.id,
            name: opt.name,
            extra_price: opt.extraPrice,
            is_available: opt.isAvailable,
            sort_order: opt.sortOrder,
          }));

          await supabase.from('product_options').insert(optionsToInsert);
        }
      }
    }

    revalidatePath(`/admin/${tenantId}/menu`);
    revalidatePath(`/c/[slug]`, 'layout');
    return { success: true, data: undefined };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al actualizar producto' };
  }
}

export async function toggleCategoryActiveAction(
  tenantId: string,
  categoryId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    await requireTenantMembership(tenantId, 'manager');

    const supabase = await createClient();
    const { error } = await supabase
      .from('categories')
      .update({ is_active: isActive })
      .eq('id', categoryId)
      .eq('tenant_id', tenantId);

    if (error) throw new Error(error.message);

    revalidatePath(`/admin/${tenantId}/menu`);
    revalidatePath(`/c/[slug]`, 'layout');
    return { success: true, data: undefined };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al cambiar visibilidad de categoría' };
  }
}

export async function deleteProductAction(
  tenantId: string,
  productId: string
): Promise<ActionResult> {
  try {
    await requireTenantMembership(tenantId, 'manager');

    const supabase = await createClient();
    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString(), is_available: false })
      .eq('id', productId)
      .eq('tenant_id', tenantId);

    if (error) throw new Error(error.message);

    revalidatePath(`/admin/${tenantId}/menu`);
    revalidatePath(`/c/[slug]`, 'layout');
    return { success: true, data: undefined };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al eliminar producto' };
  }
}

export async function duplicateProductAction(
  tenantId: string,
  productId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireTenantMembership(tenantId, 'manager');

    const { allowed, current, limit } = await canCreateProduct(tenantId);
    if (!allowed) {
      return {
        success: false,
        error: `Límite de productos alcanzado (${current}/${limit}). No puedes duplicar más productos en tu plan actual.`,
      };
    }

    const supabase = await createClient();

    // Obtener producto original
    const { data: original, error: getError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('tenant_id', tenantId)
      .single();

    if (getError || !original) throw new Error('Producto original no encontrado');

    // Clonar producto base
    const { data: duplicated, error: dupError } = await supabase
      .from('products')
      .insert({
        tenant_id: tenantId,
        category_id: original.category_id,
        name: `${original.name} (Copia)`,
        description: original.description,
        price: original.price,
        image_url: original.image_url,
        preparation_time_minutes: original.preparation_time_minutes,
        is_available: original.is_available,
        is_featured: false,
        sort_order: original.sort_order + 1,
      })
      .select('id')
      .single();

    if (dupError || !duplicated) throw new Error('Error al duplicar el producto');

    // Clonar grupos de opciones si tiene
    const { data: groups } = await supabase
      .from('product_option_groups')
      .select('*')
      .eq('product_id', productId)
      .eq('tenant_id', tenantId);

    if (groups && groups.length > 0) {
      for (const group of groups) {
        const { data: newGroup } = await supabase
          .from('product_option_groups')
          .insert({
            tenant_id: tenantId,
            product_id: duplicated.id,
            name: group.name,
            min_selectable: group.min_selectable,
            max_selectable: group.max_selectable,
            is_required: group.is_required,
            sort_order: group.sort_order,
          })
          .select('id')
          .single();

        if (newGroup) {
          const { data: options } = await supabase
            .from('product_options')
            .select('*')
            .eq('group_id', group.id);

          if (options && options.length > 0) {
            const opts = options.map((opt) => ({
              group_id: newGroup.id,
              name: opt.name,
              extra_price: opt.extra_price,
              is_available: opt.is_available,
              sort_order: opt.sort_order,
            }));

            await supabase.from('product_options').insert(opts);
          }
        }
      }
    }

    revalidatePath(`/admin/${tenantId}/menu`);
    revalidatePath(`/c/[slug]`, 'layout');
    return { success: true, data: { id: duplicated.id } };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al duplicar producto' };
  }
}

// ==============================================================================
// DRAG & DROP REORDER ACTIONS
// ==============================================================================

export async function reorderCategoriesAction(
  tenantId: string,
  orderedIds: string[]
): Promise<ActionResult> {
  try {
    await requireTenantMembership(tenantId, 'manager');
    const supabase = await createClient();

    // Actualizar orden de cada categoría
    for (let i = 0; i < orderedIds.length; i++) {
      await supabase
        .from('categories')
        .update({ sort_order: i })
        .eq('id', orderedIds[i])
        .eq('tenant_id', tenantId);
    }

    revalidatePath(`/admin/${tenantId}/menu`);
    revalidatePath(`/c/[slug]`, 'layout');
    return { success: true, data: undefined };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al reordenar categorías' };
  }
}

export async function reorderCombosAction(
  tenantId: string,
  orderedIds: string[]
): Promise<ActionResult> {
  try {
    await requireTenantMembership(tenantId, 'manager');
    const supabase = await createClient();

    for (let i = 0; i < orderedIds.length; i++) {
      await supabase
        .from('products')
        .update({ sort_order: i })
        .eq('id', orderedIds[i])
        .eq('tenant_id', tenantId);
    }

    revalidatePath(`/admin/${tenantId}/menu`);
    revalidatePath(`/c/[slug]`, 'layout');
    return { success: true, data: undefined };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al reordenar combos' };
  }
}

// ==============================================================================
// COMBOS ACTIONS (CRUD)
// ==============================================================================

export async function createComboAction(
  tenantId: string,
  input: ComboInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireTenantMembership(tenantId, 'manager');

    // 1. Verificación de límites de plan
    const { allowed, current, limit } = await canCreateProduct(tenantId);
    if (!allowed) {
      return {
        success: false,
        error: `Has alcanzado el límite de ${limit} productos/combos de tu plan actual (${current}/${limit}). Realiza un upgrade para agregar más.`,
      };
    }

    const parsed = comboSchema.parse(input);
    const supabase = await createClient();

    // 2. Insertar Combo en la tabla products con is_combo = true
    const { data: combo, error: comboError } = await supabase
      .from('products')
      .insert({
        tenant_id: tenantId,
        category_id: parsed.categoryId,
        name: parsed.name,
        description: parsed.description ?? null,
        price: parsed.price,
        original_price: parsed.originalPrice ?? null,
        image_url: parsed.imageUrl ? parsed.imageUrl : null,
        preparation_time_minutes: parsed.preparationTimeMinutes,
        is_available: parsed.isAvailable,
        is_featured: parsed.isFeatured,
        sort_order: parsed.sortOrder,
        is_combo: true,
      })
      .select('id')
      .single();

    if (comboError || !combo) {
      throw new Error(comboError?.message ?? 'Error al insertar el combo');
    }

    // 3. Insertar items del combo en product_combo_items
    if (parsed.items && parsed.items.length > 0) {
      const itemsToInsert = parsed.items.map((item, idx) => ({
        parent_product_id: combo.id,
        item_product_id: item.productId,
        quantity: item.quantity,
        sort_order: item.sortOrder ?? idx,
      }));

      const { error: itemsError } = await supabase
        .from('product_combo_items')
        .insert(itemsToInsert);

      if (itemsError) throw new Error(itemsError.message);
    }

    revalidatePath(`/admin/${tenantId}/menu`);
    revalidatePath(`/c/[slug]`, 'layout');
    return { success: true, data: { id: combo.id } };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al crear el combo' };
  }
}

export async function updateComboAction(
  tenantId: string,
  comboId: string,
  input: ComboInput
): Promise<ActionResult> {
  try {
    await requireTenantMembership(tenantId, 'manager');
    const parsed = comboSchema.parse(input);
    const supabase = await createClient();

    // 1. Actualizar Combo
    const { error: comboError } = await supabase
      .from('products')
      .update({
        category_id: parsed.categoryId,
        name: parsed.name,
        description: parsed.description ?? null,
        price: parsed.price,
        original_price: parsed.originalPrice ?? null,
        image_url: parsed.imageUrl ? parsed.imageUrl : null,
        preparation_time_minutes: parsed.preparationTimeMinutes,
        is_available: parsed.isAvailable,
        is_featured: parsed.isFeatured,
        sort_order: parsed.sortOrder,
      })
      .eq('id', comboId)
      .eq('tenant_id', tenantId);

    if (comboError) throw new Error(comboError.message);

    // 2. Reemplazar items del combo
    await supabase.from('product_combo_items').delete().eq('parent_product_id', comboId);

    if (parsed.items && parsed.items.length > 0) {
      const itemsToInsert = parsed.items.map((item, idx) => ({
        parent_product_id: comboId,
        item_product_id: item.productId,
        quantity: item.quantity,
        sort_order: item.sortOrder ?? idx,
      }));

      const { error: itemsError } = await supabase
        .from('product_combo_items')
        .insert(itemsToInsert);

      if (itemsError) throw new Error(itemsError.message);
    }

    revalidatePath(`/admin/${tenantId}/menu`);
    revalidatePath(`/c/[slug]`, 'layout');
    return { success: true, data: undefined };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al actualizar combo' };
  }
}

export async function deleteComboAction(
  tenantId: string,
  comboId: string
): Promise<ActionResult> {
  try {
    await requireTenantMembership(tenantId, 'manager');
    const supabase = await createClient();

    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString(), is_available: false })
      .eq('id', comboId)
      .eq('tenant_id', tenantId);

    if (error) throw new Error(error.message);

    revalidatePath(`/admin/${tenantId}/menu`);
    revalidatePath(`/c/[slug]`, 'layout');
    return { success: true, data: undefined };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al eliminar combo' };
  }
}

export async function toggleComboAvailabilityAction(
  tenantId: string,
  comboId: string,
  isAvailable: boolean
): Promise<ActionResult> {
  try {
    await requireTenantMembership(tenantId, 'staff');
    const supabase = await createClient();

    const { error } = await supabase
      .from('products')
      .update({ is_available: isAvailable })
      .eq('id', comboId)
      .eq('tenant_id', tenantId);

    if (error) throw new Error(error.message);

    revalidatePath(`/admin/${tenantId}/menu`);
    revalidatePath(`/c/[slug]`, 'layout');
    return { success: true, data: undefined };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al cambiar disponibilidad' };
  }
}

export async function duplicateComboAction(
  tenantId: string,
  comboId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireTenantMembership(tenantId, 'manager');

    const { allowed, current, limit } = await canCreateProduct(tenantId);
    if (!allowed) {
      return {
        success: false,
        error: `Límite alcanzado (${current}/${limit}). Realiza un upgrade para duplicar más combos.`,
      };
    }

    const supabase = await createClient();

    const { data: original, error: origError } = await supabase
      .from('products')
      .select('*')
      .eq('id', comboId)
      .eq('tenant_id', tenantId)
      .single();

    if (origError || !original) throw new Error('Combo original no encontrado');

    const { data: duplicated, error: dupError } = await supabase
      .from('products')
      .insert({
        tenant_id: tenantId,
        category_id: original.category_id,
        name: `${original.name} (Copia)`,
        description: original.description,
        price: original.price,
        original_price: original.original_price,
        image_url: original.image_url,
        preparation_time_minutes: original.preparation_time_minutes,
        is_available: original.is_available,
        is_featured: false,
        is_combo: true,
        sort_order: original.sort_order + 1,
      })
      .select('id')
      .single();

    if (dupError || !duplicated) throw new Error('Error al duplicar el combo');

    // Duplicar los items del combo
    const { data: items } = await supabase
      .from('product_combo_items')
      .select('*')
      .eq('parent_product_id', comboId);

    if (items && items.length > 0) {
      const clonedItems = items.map((it) => ({
        parent_product_id: duplicated.id,
        item_product_id: it.item_product_id,
        quantity: it.quantity,
        sort_order: it.sort_order,
      }));

      await supabase.from('product_combo_items').insert(clonedItems);
    }

    revalidatePath(`/admin/${tenantId}/menu`);
    revalidatePath(`/c/[slug]`, 'layout');
    return { success: true, data: { id: duplicated.id } };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al duplicar combo' };
  }
}

