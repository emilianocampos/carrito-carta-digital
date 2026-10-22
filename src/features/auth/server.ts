import { createClient } from '@/lib/supabase/server';
import type { MembershipRole } from '@/types/database';

export interface AuthContext {
  userId: string;
  email: string | null;
  isSuperAdmin: boolean;
}

export interface TenantAuthContext extends AuthContext {
  tenantId: string;
  role: MembershipRole;
}

/**
 * Obtiene el usuario autenticado actual y su perfil en el servidor.
 * Retorna null si no hay sesión activa.
 */
export async function getCurrentUser(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  return {
    userId: user.id,
    email: user.email ?? null,
    isSuperAdmin: profile?.is_super_admin ?? false,
  };
}

/**
 * Exige autenticación; lanza error o devuelve el usuario si está logueado.
 */
export async function requireAuth(): Promise<AuthContext> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('No autorizado: Se requiere inicio de sesión.');
  }
  return user;
}

/**
 * Obtiene y valida la membresía del usuario actual en un tenant específico.
 * Lanza error si el usuario no pertenece al tenant (salvo si es Super Admin).
 */
export async function requireTenantMembership(
  tenantId: string,
  minimumRole?: 'owner' | 'manager' | 'staff'
): Promise<TenantAuthContext> {
  const user = await requireAuth();

  // Super Admin siempre tiene bypass
  if (user.isSuperAdmin) {
    return {
      ...user,
      tenantId,
      role: 'owner',
    };
  }

  const supabase = await createClient();
  const { data: membership, error } = await supabase
    .from('memberships')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.userId)
    .single();

  if (error || !membership) {
    throw new Error('Prohibido: No tienes membresía en este carrito.');
  }

  // Verificación de jerarquía de roles: owner > manager > staff
  if (minimumRole) {
    const roleHierarchy: Record<MembershipRole, number> = {
      owner: 3,
      manager: 2,
      staff: 1,
    };

    if (roleHierarchy[membership.role] < roleHierarchy[minimumRole]) {
      throw new Error(`Permiso insuficiente: Se requiere rol ${minimumRole} o superior.`);
    }
  }

  return {
    ...user,
    tenantId,
    role: membership.role,
  };
}

/**
 * Exige rol de Super Admin global de la plataforma SaaS.
 * Lanza error si el usuario no está autenticado o no es super admin.
 */
export async function requireSuperAdmin(): Promise<AuthContext> {
  const user = await requireAuth();
  if (!user.isSuperAdmin) {
    throw new Error('Prohibido: Se requieren privilegios de Super Administrador de plataforma.');
  }
  return user;
}

/**
 * Obtiene el primer tenant asociado al usuario (si existe)
 */
export async function getUserTenant(userId: string) {
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from('memberships')
    .select('tenant_id, tenants(id, name, slug)')
    .eq('user_id', userId)
    .limit(1);

  if (!memberships || memberships.length === 0 || !memberships[0].tenants) {
    return null;
  }

  return memberships[0].tenants as unknown as { id: string; name: string; slug: string };
}

