'use server';

import { createClient } from '@/lib/supabase/server';
import { requireTenantMembership } from '@/features/auth/server';
import { revalidatePath } from 'next/cache';
import type { CreateRaffleInput } from './types';

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Crear un nuevo sorteo (Exclusivo para staff del carrito con plan activo o trial)
 */
export async function createRaffleAction(
  tenantId: string,
  input: CreateRaffleInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireTenantMembership(tenantId, 'staff');

    if (!input.title?.trim()) {
      return { success: false, error: 'El título del sorteo es obligatorio' };
    }
    if (!input.prize?.trim()) {
      return { success: false, error: 'El premio del sorteo es obligatorio' };
    }

    const supabase = await createClient();

    // Validar suscripción (debe estar en trial o plan premium)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, plans(code)')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const isTrial = !subscription || subscription.status === 'trialing';
    const planCode = (subscription?.plans as unknown as { code?: string })?.code;
    const isPremium = planCode === 'premium';

    if (!isTrial && !isPremium) {
      return {
        success: false,
        error: 'Los sorteos son una funcionalidad exclusiva del Plan Premium. Actualizá tu suscripción para habilitarlos.',
      };
    }

    const { data, error } = await supabase
      .from('raffles')
      .insert({
        tenant_id: tenantId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        prize: input.prize.trim(),
        image_url: input.imageUrl?.trim() || null,
        end_date: input.endDate || null,
        status: 'active',
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Error al crear el sorteo');
    }

    revalidatePath(`/admin/${tenantId}/raffles`);
    revalidatePath(`/c/[slug]`, 'layout');
    return { success: true, data: { id: data.id } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al crear sorteo',
    };
  }
}

/**
 * Realizar sorteo y seleccionar un ganador al azar
 */
export async function drawRaffleWinnerAction(
  tenantId: string,
  raffleId: string
): Promise<ActionResult<{ winnerName: string; winnerEmail: string }>> {
  try {
    await requireTenantMembership(tenantId, 'manager');
    const supabase = await createClient();

    // 1. Obtener participantes inscritos
    const { data: entries, error: entriesError } = await supabase
      .from('raffle_entries')
      .select('*')
      .eq('raffle_id', raffleId)
      .eq('tenant_id', tenantId);

    if (entriesError) throw new Error(entriesError.message);

    if (!entries || entries.length === 0) {
      return {
        success: false,
        error: 'No hay participantes registrados todavía en este sorteo.',
      };
    }

    // 2. Elegir un ganador al azar usando número aleatorio seguro
    const randomIndex = Math.floor(Math.random() * entries.length);
    const winner = entries[randomIndex];

    // 3. Actualizar el sorteo con los datos del ganador
    const { error: updateError } = await supabase
      .from('raffles')
      .update({
        status: 'completed',
        winner_name: winner.customer_name,
        winner_email: winner.customer_email,
        winner_drawn_at: new Date().toISOString(),
      })
      .eq('id', raffleId)
      .eq('tenant_id', tenantId);

    if (updateError) throw new Error(updateError.message);

    revalidatePath(`/admin/${tenantId}/raffles`);
    revalidatePath(`/c/[slug]`, 'layout');

    return {
      success: true,
      data: {
        winnerName: winner.customer_name,
        winnerEmail: winner.customer_email,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al sortear ganador',
    };
  }
}

/**
 * Cancelar / Eliminar sorteo
 */
export async function deleteRaffleAction(
  tenantId: string,
  raffleId: string
): Promise<ActionResult> {
  try {
    await requireTenantMembership(tenantId, 'manager');
    const supabase = await createClient();

    const { error } = await supabase
      .from('raffles')
      .delete()
      .eq('id', raffleId)
      .eq('tenant_id', tenantId);

    if (error) throw new Error(error.message);

    revalidatePath(`/admin/${tenantId}/raffles`);
    revalidatePath(`/c/[slug]`, 'layout');
    return { success: true, data: undefined };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al eliminar sorteo',
    };
  }
}

/**
 * Inscripción pública de un cliente en un sorteo (desde la carta)
 */
export async function enterRafflePublicAction(
  tenantSlug: string,
  raffleId: string,
  name: string,
  email: string,
  phone?: string
): Promise<ActionResult<{ alreadyEntered: boolean }>> {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'Por favor ingresá un email válido.' };
    }
    if (!trimmedName) {
      return { success: false, error: 'Por favor ingresá tu nombre.' };
    }

    const supabase = await createClient();

    // 1. Obtener tenant por slug
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single();

    if (tenantError || !tenant) {
      return { success: false, error: 'Negocio no encontrado.' };
    }

    // 2. Verificar si el sorteo está activo
    const { data: raffle, error: raffleError } = await supabase
      .from('raffles')
      .select('id, status')
      .eq('id', raffleId)
      .eq('tenant_id', tenant.id)
      .single();

    if (raffleError || !raffle || raffle.status !== 'active') {
      return { success: false, error: 'Este sorteo ya ha finalizado o no está disponible.' };
    }

    // 3. Revisar si ya está inscrito
    const { data: existing } = await supabase
      .from('raffle_entries')
      .select('id')
      .eq('raffle_id', raffleId)
      .eq('customer_email', trimmedEmail)
      .maybeSingle();

    if (existing) {
      return { success: true, data: { alreadyEntered: true } };
    }

    // 4. Guardar o vincular cliente en la base de clientes del carrito
    const cleanPhone = phone?.trim() || '0000000000';
    let customerId: string | null = null;

    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (customer) {
      customerId = customer.id;
    } else {
      const { data: newCust } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenant.id,
          name: trimmedName,
          email: trimmedEmail,
          phone: cleanPhone,
        })
        .select('id')
        .maybeSingle();

      if (newCust) customerId = newCust.id;
    }

    // 5. Insertar inscripción en el sorteo
    const { error: insertError } = await supabase.from('raffle_entries').insert({
      raffle_id: raffleId,
      tenant_id: tenant.id,
      customer_id: customerId,
      customer_name: trimmedName,
      customer_email: trimmedEmail,
      customer_phone: phone?.trim() || null,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        return { success: true, data: { alreadyEntered: true } };
      }
      throw new Error(insertError.message);
    }

    revalidatePath(`/admin/${tenantSlug}/raffles`);
    return { success: true, data: { alreadyEntered: false } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al inscribirse en el sorteo',
    };
  }
}
