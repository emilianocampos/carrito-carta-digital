import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Cliente con permisos de Service Role (Super Admin / Backend Privilegiado).
 * ¡ATENCIÓN DE SEGURIDAD!:
 * Este cliente evade completamente Row Level Security (RLS).
 * SOLO debe ser utilizado en el servidor para tareas del sistema, background jobs,
 * o reconciliación de webhooks que no tienen contexto de usuario.
 * NUNCA exponer en Client Components ni enviar este token al navegador.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Faltan variables para createAdminClient: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
