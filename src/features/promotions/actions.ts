'use server';

import { createClient } from '@/lib/supabase/server';
import { requireTenantMembership } from '@/features/auth/server';
import { couponSchema, validateCouponSchema, type CouponInput, type ValidateCouponInput } from './schemas';
import type { Database } from '@/types/database';
import { revalidatePath } from 'next/cache';

type CouponRow = Database['public']['Tables']['coupons']['Row'];

export type PromotionActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Crea un cupón de descuento en el carrito. Requiere rol de manager o superior.
 */
export async function createCouponAction(
  tenantId: string,
  input: CouponInput
): Promise<PromotionActionResult<{ couponId: string }>> {
  try {
    await requireTenantMembership(tenantId, 'manager');
    const parsed = couponSchema.parse(input);

    const supabase = await createClient();

    // Validar código único por tenant
    const { data: existing } = await supabase
      .from('coupons')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('code', parsed.code)
      .maybeSingle();

    if (existing) {
      return { success: false, error: `Ya existe un cupón con el código "${parsed.code}".` };
    }

    const { data: coupon, error } = await supabase
      .from('coupons')
      .insert({
        tenant_id: tenantId,
        code: parsed.code,
        discount_type: parsed.discountType,
        discount_value: parsed.discountValue,
        min_order_amount: parsed.minOrderAmount,
        max_discount_amount: parsed.maxDiscountAmount || null,
        max_uses: parsed.maxUses || null,
        valid_from: parsed.validFrom || new Date().toISOString(),
        valid_until: parsed.validUntil || null,
        is_active: true,
      })
      .select('id')
      .single();

    if (error || !coupon) throw new Error(error?.message || 'Error al crear cupón');

    revalidatePath('/admin', 'layout');

    return { success: true, data: { couponId: coupon.id } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al crear cupón',
    };
  }
}

/**
 * Activa o desactiva un cupón.
 */
export async function toggleCouponAction(
  tenantId: string,
  couponId: string,
  isActive: boolean
): Promise<PromotionActionResult> {
  try {
    await requireTenantMembership(tenantId, 'manager');
    const supabase = await createClient();

    const { error } = await supabase
      .from('coupons')
      .update({ is_active: isActive })
      .eq('id', couponId)
      .eq('tenant_id', tenantId);

    if (error) throw new Error(error.message);

    revalidatePath('/admin', 'layout');
    return { success: true, data: undefined };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al modificar cupón',
    };
  }
}

/**
 * Elimina un cupón.
 */
export async function deleteCouponAction(
  tenantId: string,
  couponId: string
): Promise<PromotionActionResult> {
  try {
    await requireTenantMembership(tenantId, 'manager');
    const supabase = await createClient();

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', couponId)
      .eq('tenant_id', tenantId);

    if (error) throw new Error(error.message);

    revalidatePath('/admin', 'layout');
    return { success: true, data: undefined };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al eliminar cupón',
    };
  }
}

export interface CouponValidationResult {
  valid: boolean;
  couponId?: string;
  code: string;
  discountAmount: number;
  newTotal: number;
  message?: string;
}

/**
 * Valida un cupón de forma pública para la vista previa del cliente en el checkout.
 */
export async function validateCouponAction(
  input: ValidateCouponInput
): Promise<PromotionActionResult<CouponValidationResult>> {
  try {
    const parsed = validateCouponSchema.parse(input);
    const codeUpper = parsed.code.trim().toUpperCase();
    const supabase = await createClient();

    // 1. Obtener tenant por slug
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, status')
      .eq('slug', parsed.tenantSlug)
      .single();

    if (!tenant || tenant.status !== 'active') {
      return { success: false, error: 'Carrito no encontrado o inactivo.' };
    }

    // 2. Buscar cupón activo
    const { data: couponRaw, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('code', codeUpper)
      .maybeSingle();

    const coupon = couponRaw as CouponRow | null;

    if (error || !coupon || !coupon.is_active) {
      return {
        success: true,
        data: {
          valid: false,
          code: codeUpper,
          discountAmount: 0,
          newTotal: parsed.subtotal,
          message: 'El cupón no existe o está inactivo.',
        },
      };
    }

    const now = new Date();

    // Validar fecha inicio
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return {
        success: true,
        data: {
          valid: false,
          code: codeUpper,
          discountAmount: 0,
          newTotal: parsed.subtotal,
          message: 'El cupón todavía no está vigente.',
        },
      };
    }

    // Validar fecha vencimiento
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return {
        success: true,
        data: {
          valid: false,
          code: codeUpper,
          discountAmount: 0,
          newTotal: parsed.subtotal,
          message: 'El cupón ha expirado.',
        },
      };
    }

    // Validar límite de usos
    if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
      return {
        success: true,
        data: {
          valid: false,
          code: codeUpper,
          discountAmount: 0,
          newTotal: parsed.subtotal,
          message: 'El cupón ha alcanzado el límite máximo de canjes.',
        },
      };
    }

    // Validar compra mínima
    const minOrder = Number(coupon.min_order_amount) || 0;
    if (parsed.subtotal < minOrder) {
      return {
        success: true,
        data: {
          valid: false,
          code: codeUpper,
          discountAmount: 0,
          newTotal: parsed.subtotal,
          message: `El pedido mínimo para este cupón es de $${minOrder}.`,
        },
      };
    }

    // Calcular descuento
    let discount = 0;
    const discountVal = Number(coupon.discount_value);

    if (coupon.discount_type === 'percentage') {
      discount = (parsed.subtotal * discountVal) / 100;
    } else {
      discount = discountVal;
    }

    // Aplicar tope de descuento si existe
    if (coupon.max_discount_amount) {
      const maxDiscount = Number(coupon.max_discount_amount);
      if (discount > maxDiscount) discount = maxDiscount;
    }

    // El descuento no puede superar el subtotal
    if (discount > parsed.subtotal) {
      discount = parsed.subtotal;
    }

    const newTotal = Math.max(parsed.subtotal - discount, 0);

    return {
      success: true,
      data: {
        valid: true,
        couponId: coupon.id,
        code: coupon.code,
        discountAmount: Math.round(discount * 100) / 100,
        newTotal: Math.round(newTotal * 100) / 100,
        message: '¡Cupón aplicado con éxito!',
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al validar cupón',
    };
  }
}
