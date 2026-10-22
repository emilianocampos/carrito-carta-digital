import { createClient } from '@/lib/supabase/server';
import type { AdminRafflesData, Raffle, RaffleEntry } from './types';

export async function getAdminRafflesData(slug: string): Promise<AdminRafflesData | null> {
  const supabase = await createClient();

  // 1. Obtener Tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (tenantError || !tenant) return null;

  // 2. Verificar si está en Plan Premium o Trial
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, plans(code)')
    .eq('tenant_id', tenant.id)
    .maybeSingle();

  const isTrial = !subscription || subscription.status === 'trialing';
  const planCode = (subscription?.plans as unknown as { code?: string })?.code;
  const isPremiumOrTrial = isTrial || planCode === 'premium';

  // 3. Obtener sorteos del tenant
  const { data: rawRaffles } = await supabase
    .from('raffles')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false });

  const raffleIds = (rawRaffles ?? []).map((r) => r.id);
  const entriesByRaffle: Record<string, RaffleEntry[]> = {};
  const entriesCountMap = new Map<string, number>();

  if (raffleIds.length > 0) {
    const { data: entries } = await supabase
      .from('raffle_entries')
      .select('id, raffle_id, customer_name, customer_email, customer_phone, created_at')
      .in('raffle_id', raffleIds)
      .order('created_at', { ascending: false });

    (entries ?? []).forEach((e) => {
      if (!entriesByRaffle[e.raffle_id]) entriesByRaffle[e.raffle_id] = [];
      entriesByRaffle[e.raffle_id].push({
        id: e.id,
        raffleId: e.raffle_id,
        customerName: e.customer_name,
        customerEmail: e.customer_email,
        customerPhone: e.customer_phone,
        createdAt: e.created_at,
      });

      entriesCountMap.set(e.raffle_id, (entriesCountMap.get(e.raffle_id) || 0) + 1);
    });
  }

  const raffles: Raffle[] = (rawRaffles ?? []).map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    title: r.title,
    description: r.description,
    prize: r.prize,
    imageUrl: r.image_url,
    endDate: r.end_date,
    status: r.status as Raffle['status'],
    winnerName: r.winner_name,
    winnerEmail: r.winner_email,
    winnerDrawnAt: r.winner_drawn_at,
    entriesCount: entriesCountMap.get(r.id) || 0,
    createdAt: r.created_at,
  }));

  return {
    tenant,
    isPremiumOrTrial,
    raffles,
    entriesByRaffle,
  };
}

export async function getActivePublicRaffles(tenantId: string): Promise<Raffle[]> {
  const supabase = await createClient();

  const { data: rawRaffles } = await supabase
    .from('raffles')
    .select('*')
    .eq('tenant_id', tenantId)
    .in('status', ['active', 'completed'])
    .order('created_at', { ascending: false });

  return (rawRaffles ?? []).map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    title: r.title,
    description: r.description,
    prize: r.prize,
    imageUrl: r.image_url,
    endDate: r.end_date,
    status: r.status as Raffle['status'],
    winnerName: r.winner_name,
    winnerEmail: r.winner_email,
    winnerDrawnAt: r.winner_drawn_at,
    entriesCount: 0,
    createdAt: r.created_at,
  }));
}
