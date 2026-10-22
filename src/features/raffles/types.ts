export type RaffleStatus = 'active' | 'completed' | 'cancelled';

export interface Raffle {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  prize: string;
  imageUrl: string | null;
  endDate: string | null;
  status: RaffleStatus;
  winnerName: string | null;
  winnerEmail: string | null;
  winnerDrawnAt: string | null;
  entriesCount: number;
  createdAt: string;
}

export interface RaffleEntry {
  id: string;
  raffleId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  createdAt: string;
}

export interface CreateRaffleInput {
  title: string;
  description?: string | null;
  prize: string;
  imageUrl?: string | null;
  endDate?: string | null;
}

export interface AdminRafflesData {
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  isPremiumOrTrial: boolean;
  raffles: Raffle[];
  entriesByRaffle: Record<string, RaffleEntry[]>;
}
