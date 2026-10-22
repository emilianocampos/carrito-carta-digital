import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Cliente de Supabase para Client Components ("use client").
 * Utiliza las credenciales públicas expuestas en el navegador y gestiona la sesión
 * mediante almacenamiento de cookies locales compartidas con el servidor.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Faltan variables de entorno públicas de Supabase: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
