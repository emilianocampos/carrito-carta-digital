'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AuthActionResult {
  success: boolean;
  error?: string;
  redirectUrl?: string;
  requiresEmailConfirmation?: boolean;
}

/**
 * Normaliza y genera un slug válido para el carrito
 */
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Server action para Iniciar Sesión con email y contraseña
 */
export async function loginAction(
  formData: FormData,
  customRedirect?: string | null
): Promise<AuthActionResult> {
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Por favor completá tu correo y contraseña.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return {
      success: false,
      error: 'Credenciales inválidas. Verificá tu correo y contraseña.',
    };
  }

  // 1. Si hay un redirect personalizado seguro, usarlo
  if (customRedirect && customRedirect.startsWith('/') && !customRedirect.startsWith('//')) {
    return { success: true, redirectUrl: customRedirect };
  }

  // Usamos adminSupabase para verificar roles y tenant sin interferencias de RLS
  const adminSupabase = createAdminClient();

  // 2. Comprobar si el usuario es Super Admin
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profile?.is_super_admin) {
    return { success: true, redirectUrl: '/admin/super' };
  }

  // 3. Buscar el primer tenant al que pertenece
  const { data: memberships } = await adminSupabase
    .from('memberships')
    .select('tenants(slug)')
    .eq('user_id', data.user.id)
    .limit(1);

  if (memberships && memberships.length > 0 && memberships[0].tenants) {
    const tenant = memberships[0].tenants as unknown as { slug: string };
    if (tenant?.slug) {
      return { success: true, redirectUrl: `/admin/${tenant.slug}/dashboard` };
    }
  }

  // Si no tiene tenant asignado todavía
  return { success: true, redirectUrl: '/' };
}

/**
 * Server action para Crear Cuenta / Registrar nuevo usuario
 */
export async function registerAction(formData: FormData): Promise<AuthActionResult> {
  const fullName = (formData.get('fullName') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const cartName = (formData.get('cartName') as string)?.trim();

  if (!fullName) {
    return { success: false, error: 'Ingresá tu nombre completo.' };
  }

  if (!email || !email.includes('@')) {
    return { success: false, error: 'Ingresá un correo electrónico válido.' };
  }

  if (!password || password.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
  }

  if (!cartName) {
    return { success: false, error: 'Ingresá el nombre de tu negocio o carrito.' };
  }

  const supabase = await createClient();

  // 1. Registrar usuario en Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const user = data.user;
  if (!user) {
    return { success: false, error: 'No se pudo crear el usuario. Intentá nuevamente.' };
  }

  // 2. Crear inmediatamente el negocio (tenant), configuración, membresía de dueño y suscripción
  let createdSlug = '';
  try {
    const adminSupabase = createAdminClient();
    let baseSlug = slugify(cartName);
    if (!baseSlug) baseSlug = 'mi-carrito';

    // Verificar si el slug ya existe
    const { data: existing } = await adminSupabase
      .from('tenants')
      .select('id')
      .eq('slug', baseSlug)
      .maybeSingle();

    const finalSlug = existing ? `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}` : baseSlug;
    createdSlug = finalSlug;

    // Crear el tenant
    const { data: newTenant, error: tenantError } = await adminSupabase
      .from('tenants')
      .insert({
        name: cartName,
        slug: finalSlug,
        status: 'active',
      })
      .select('id, slug')
      .single();

    if (tenantError || !newTenant) {
      console.error('Error al crear tenant:', tenantError);
      return { success: false, error: 'No se pudo crear el negocio. Por favor reintentá.' };
    }

    // Asociar membresía como owner
    await adminSupabase.from('memberships').insert({
      tenant_id: newTenant.id,
      user_id: user.id,
      role: 'owner',
    });

    // Configuración inicial del tenant
    await adminSupabase.from('tenant_settings').insert({
      tenant_id: newTenant.id,
    });

    // Tema inicial del tenant
    await adminSupabase.from('menu_themes').insert({
      tenant_id: newTenant.id,
      preset_code: 'dark',
      tokens: {
        primary_color: '#10b981',
        background_color: '#070d12',
        font_family: 'Inter',
      },
    });

    // Suscripción inicial en período de prueba gratuito de 7 días
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 7); // 7 días de prueba gratis

    await adminSupabase.from('subscriptions').insert({
      tenant_id: newTenant.id,
      plan_id: '11111111-1111-1111-1111-111111111111',
      status: 'trialing',
      current_period_start: now.toISOString(),
      current_period_end: trialEnd.toISOString(),
    });
  } catch (tenantErr) {
    console.error('Error inicializando negocio:', tenantErr);
    return { success: false, error: 'Error al inicializar el local. Por favor contactá soporte.' };
  }

  // Si Supabase requiere confirmación previa de email
  if (!data.session) {
    return {
      success: true,
      requiresEmailConfirmation: true,
    };
  }

  // Si ya tiene sesión activa, entrar directo al panel admin
  return { success: true, redirectUrl: `/admin/${createdSlug}/dashboard` };
}

/**
 * Server action para Cerrar Sesión
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
