'use server';

import { createClient } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/features/auth/server';
import type { TenantStatus, Json } from '@/types/database';
import { revalidatePath } from 'next/cache';

export type SuperAdminActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Suspende, activa o cancela un carrito en la plataforma.
 */
export async function toggleTenantStatusAction(
  tenantId: string,
  newStatus: TenantStatus,
  reason?: string
): Promise<SuperAdminActionResult> {
  try {
    const admin = await requireSuperAdmin();
    const supabase = await createClient();

    // Obtener estado anterior
    const { data: tenant, error: fetchErr } = await supabase
      .from('tenants')
      .select('name, status')
      .eq('id', tenantId)
      .single();

    if (fetchErr || !tenant) {
      return { success: false, error: 'Carrito no encontrado' };
    }

    const oldStatus = tenant.status;

    // Actualizar estado del tenant
    const { error: updateErr } = await supabase
      .from('tenants')
      .update({ status: newStatus })
      .eq('id', tenantId);

    if (updateErr) throw new Error(updateErr.message);

    // Auditoría
    await supabase.from('audit_logs').insert({
      actor_id: admin.userId,
      tenant_id: tenantId,
      action: 'tenant_status_changed',
      entity_type: 'tenants',
      entity_id: tenantId,
      metadata: {
        tenantName: tenant.name,
        oldStatus,
        newStatus,
        reason: reason || 'Acción manual desde Panel de Super Admin',
      } as unknown as Json,
    });

    revalidatePath('/admin/super', 'layout');
    revalidatePath('/c/[slug]', 'layout');

    return { success: true, data: undefined };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al modificar estado del carrito',
    };
  }
}

/**
 * Cambia el plan asignado a un tenant (Basic, Pro, Premium).
 */
export async function changeTenantPlanAction(
  tenantId: string,
  newPlanCode: string
): Promise<SuperAdminActionResult> {
  try {
    const admin = await requireSuperAdmin();
    const supabase = await createClient();

    // 1. Obtener plan destino
    const { data: targetPlan, error: planErr } = await supabase
      .from('plans')
      .select('id, name, code')
      .eq('code', newPlanCode)
      .single();

    if (planErr || !targetPlan) {
      return { success: false, error: 'Plan seleccionado no válido' };
    }

    // 2. Obtener suscripción actual
    const { data: currentSub } = await supabase
      .from('subscriptions')
      .select('id, plan_id, status')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (currentSub) {
      await supabase
        .from('subscriptions')
        .update({
          plan_id: targetPlan.id,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentSub.id);
    } else {
      const now = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      await supabase.from('subscriptions').insert({
        tenant_id: tenantId,
        plan_id: targetPlan.id,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: nextMonth.toISOString(),
      });
    }

    // Auditoría
    await supabase.from('audit_logs').insert({
      actor_id: admin.userId,
      tenant_id: tenantId,
      action: 'tenant_plan_changed',
      entity_type: 'subscriptions',
      entity_id: tenantId,
      metadata: {
        newPlanCode: targetPlan.code,
        newPlanName: targetPlan.name,
      } as unknown as Json,
    });

    revalidatePath('/admin/super', 'layout');
    return { success: true, data: undefined };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al cambiar plan del carrito',
    };
  }
}

/**
 * Aplica un override específico de feature para un tenant (Override > Plan > Default).
 */
export async function setTenantFeatureOverrideAction(
  tenantId: string,
  featureCode: string,
  value: unknown,
  reason: string,
  expiresAt?: string
): Promise<SuperAdminActionResult> {
  try {
    const admin = await requireSuperAdmin();
    const supabase = await createClient();

    const { data: feature, error: featErr } = await supabase
      .from('features')
      .select('id, code, name')
      .eq('code', featureCode)
      .single();

    if (featErr || !feature) {
      return { success: false, error: 'Feature no encontrada' };
    }

    // Upsert override
    const { error: overrideErr } = await supabase
      .from('tenant_feature_overrides')
      .upsert(
        {
          tenant_id: tenantId,
          feature_id: feature.id,
          value: value as Json,
          reason,
          expires_at: expiresAt || null,
        },
        { onConflict: 'tenant_id,feature_id' }
      );

    if (overrideErr) throw new Error(overrideErr.message);

    // Auditoría
    await supabase.from('audit_logs').insert({
      actor_id: admin.userId,
      tenant_id: tenantId,
      action: 'feature_override_set',
      entity_type: 'tenant_feature_overrides',
      entity_id: tenantId,
      metadata: {
        featureCode: feature.code,
        value,
        reason,
        expiresAt,
      } as unknown as Json,
    });

    revalidatePath('/admin/super', 'layout');
    return { success: true, data: undefined };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al aplicar override',
    };
  }
}

/**
 * Elimina un override de feature de un tenant.
 */
export async function deleteTenantFeatureOverrideAction(
  overrideId: string,
  tenantId: string
): Promise<SuperAdminActionResult> {
  try {
    const admin = await requireSuperAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from('tenant_feature_overrides')
      .delete()
      .eq('id', overrideId);

    if (error) throw new Error(error.message);

    // Auditoría
    await supabase.from('audit_logs').insert({
      actor_id: admin.userId,
      tenant_id: tenantId,
      action: 'feature_override_deleted',
      entity_type: 'tenant_feature_overrides',
      entity_id: overrideId,
      metadata: { overrideId } as unknown as Json,
    });

    revalidatePath('/admin/super', 'layout');
    return { success: true, data: undefined };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al eliminar override',
    };
  }
}

/**
 * Extiende el período de prueba de 7 días de un tenant.
 */
export async function extendTenantTrialAction(
  tenantId: string,
  days: number = 7
): Promise<SuperAdminActionResult> {
  try {
    const admin = await requireSuperAdmin();
    const supabase = await createClient();

    const { data: currentSub } = await supabase
      .from('subscriptions')
      .select('id, current_period_end')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const baseDate = currentSub?.current_period_end && new Date(currentSub.current_period_end) > new Date()
      ? new Date(currentSub.current_period_end)
      : new Date();

    const newEnd = new Date(baseDate);
    newEnd.setDate(newEnd.getDate() + days);

    if (currentSub) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'trialing',
          current_period_end: newEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentSub.id);
    }

    // Auditoría
    await supabase.from('audit_logs').insert({
      actor_id: admin.userId,
      tenant_id: tenantId,
      action: 'tenant_trial_extended',
      entity_type: 'subscriptions',
      entity_id: tenantId,
      metadata: {
        extendedDays: days,
        newExpiration: newEnd.toISOString(),
      } as unknown as Json,
    });

    revalidatePath('/admin/super', 'layout');
    return { success: true, data: undefined };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al extender período de prueba',
    };
  }
}
