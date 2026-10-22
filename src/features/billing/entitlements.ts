import { createClient } from '@/lib/supabase/server';

/**
 * Motor centralizado de verificación de funcionalidades (Feature Flags / Entitlements).
 * Jerarquía estricta:
 * 1. TENANT OVERRIDE (si existe y no ha expirado)
 * 2. PLAN ASIGNADO (a través de la suscripción del tenant)
 * 3. FALLBACK: false
 */
export async function hasFeature(tenantId: string, featureCode: string): Promise<boolean> {
  const supabase = await createClient();

  // 1. Revisar si la feature existe
  const { data: feature } = await supabase
    .from('features')
    .select('id')
    .eq('code', featureCode)
    .single();

  if (!feature) {
    return false;
  }

  // 2. Revisar override específico para este tenant
  const { data: override } = await supabase
    .from('tenant_feature_overrides')
    .select('value, expires_at')
    .eq('tenant_id', tenantId)
    .eq('feature_id', feature.id)
    .single();

  if (override) {
    if (!override.expires_at || new Date(override.expires_at) > new Date()) {
      return Boolean(override.value);
    }
  }

  // 3. Revisar el plan de la suscripción activa
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_id, status')
    .eq('tenant_id', tenantId)
    .single();

  if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
    return false;
  }

  // 4. Consultar valor de la feature en el plan
  const { data: planFeature } = await supabase
    .from('plan_features')
    .select('value')
    .eq('plan_id', subscription.plan_id)
    .eq('feature_id', feature.id)
    .single();

  if (!planFeature) {
    return false;
  }

  return Boolean(planFeature.value);
}

/**
 * Obtiene el límite numérico configurado para un recurso (ej. 'max_products', 'max_categories').
 * Devuelve un número entero o Infinity si es ilimitado.
 */
export async function getResourceLimit(tenantId: string, limitCode: string): Promise<number> {
  const supabase = await createClient();

  const { data: feature } = await supabase
    .from('features')
    .select('id')
    .eq('code', limitCode)
    .single();

  if (!feature) {
    return limitCode === 'max_products' ? 50 : limitCode === 'max_categories' ? 20 : 0;
  }

  // Revisar override
  const { data: override } = await supabase
    .from('tenant_feature_overrides')
    .select('value, expires_at')
    .eq('tenant_id', tenantId)
    .eq('feature_id', feature.id)
    .single();

  if (override && (!override.expires_at || new Date(override.expires_at) > new Date())) {
    const val = Number(override.value);
    return isNaN(val) ? 50 : val;
  }

  // Revisar suscripción
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_id, status')
    .eq('tenant_id', tenantId)
    .single();

  if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
    // Si aún no tiene suscripción activa o está en trial/desarrollo, permitimos límite básico
    return limitCode === 'max_products' ? 50 : limitCode === 'max_categories' ? 20 : 0;
  }

  const { data: planFeature } = await supabase
    .from('plan_features')
    .select('value')
    .eq('plan_id', subscription.plan_id)
    .eq('feature_id', feature.id)
    .single();

  if (!planFeature) {
    return limitCode === 'max_products' ? 50 : limitCode === 'max_categories' ? 20 : 0;
  }

  const val = Number(planFeature.value);
  return isNaN(val) ? 50 : val;
}

/**
 * Verifica atómicamente si el tenant puede crear un nuevo producto según su límite de plan.
 */
export async function canCreateProduct(tenantId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  let limit = await getResourceLimit(tenantId, 'max_products');
  if (limit <= 0) {
    limit = 50;
  }
  const supabase = await createClient();

  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .is('deleted_at', null);

  const current = count ?? 0;
  return {
    allowed: current < limit,
    current,
    limit,
  };
}
