'use client';

import { enterRafflePublicAction } from './actions';

export interface CustomerProfile {
  name: string;
  email: string;
  phone?: string;
}

export function getStoredCustomerProfile(tenantSlug: string): CustomerProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`takeaway_customer_${tenantSlug}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCustomerProfile(tenantSlug: string, profile: CustomerProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`takeaway_customer_${tenantSlug}`, JSON.stringify(profile));
  } catch {
    // Silently ignore localStorage quota errors
  }
}

export async function participateInRaffle(
  tenantSlug: string,
  raffleId: string,
  profile: CustomerProfile
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await enterRafflePublicAction(
      tenantSlug,
      raffleId,
      profile.name,
      profile.email,
      profile.phone
    );

    if (res.success) {
      return { success: true };
    }
    return { success: false, error: res.error || 'No se pudo registrar la participación' };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error de conexión al inscribirse',
    };
  }
}
