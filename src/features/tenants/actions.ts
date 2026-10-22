'use server';

import { createClient } from '@/lib/supabase/server';
import { requireTenantMembership } from '@/features/auth/server';
import { revalidatePath } from 'next/cache';

export type TenantActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Ajusta el tiempo estimado global de preparación (ETA) del carrito.
 * Accesible tanto para el dueño (owner) como para el cocinero (staff).
 */
export async function updatePreparationTimeAction(
  tenantId: string,
  minutes: number
): Promise<TenantActionResult<{ minutes: number }>> {
  try {
    await requireTenantMembership(tenantId, 'staff');

    const validMinutes = Math.min(Math.max(Math.round(minutes), 5), 180);
    const supabase = await createClient();

    const { error } = await supabase
      .from('tenant_settings')
      .update({ current_preparation_time_minutes: validMinutes })
      .eq('tenant_id', tenantId);

    if (error) throw new Error(error.message);

    revalidatePath('/admin', 'layout');
    revalidatePath('/c/[slug]', 'layout');

    return { success: true, data: { minutes: validMinutes } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al actualizar el tiempo de preparación',
    };
  }
}

/**
 * Pausa o reanuda la recepción de nuevos pedidos en el carrito.
 * Cuando se pausa, la carta pública continúa visible para ver precios,
 * pero no se permite enviar nuevos pedidos y se muestra el motivo.
 */
export async function toggleOrderPauseAction(
  tenantId: string,
  isPaused: boolean,
  reason?: string
): Promise<TenantActionResult<{ isPaused: boolean }>> {
  try {
    await requireTenantMembership(tenantId, 'staff');

    const supabase = await createClient();

    const { error } = await supabase
      .from('tenant_settings')
      .update({
        is_ordering_paused: isPaused,
        pause_reason: isPaused ? (reason?.trim() || 'El carrito ha pausado la recepción de pedidos.') : null,
      })
      .eq('tenant_id', tenantId);

    if (error) throw new Error(error.message);

    revalidatePath('/admin', 'layout');
    revalidatePath('/c/[slug]', 'layout');

    return { success: true, data: { isPaused } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al cambiar el estado de pausa',
    };
  }
}
