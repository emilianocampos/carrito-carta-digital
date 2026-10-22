# 22 — FEATURE FLAGS, PLANES Y ENTITLEMENTS
## Sistema Centralizado de Funcionalidades, Overrides y Cuotas por Plan

---

## 1. EL ERROR DE ACOPLAR CONDICIONES AL NOMBRE DEL PLAN

En muchos proyectos de software se encuentran condiciones dispersas por el código como:
```typescript
// ❌ MALA PRÁCTICA (Código frágil y acoplado)
if (tenant.plan === 'pro' || tenant.plan === 'premium') {
  showLoyaltyProgram();
}
```
Si el día de mañana se crea un nuevo "Plan Food Truck Express" o se decide incluir el programa de fidelización en el "Plan Básico" como oferta temporal, hay que buscar y reemplazar cientos de `if` en todo el proyecto.

---

## 2. LA JERARQUÍA DE EVALUACIÓN DE ENTITLEMENTS

En **Carrito Take-Away**, todas las comprobaciones de funcionalidades pasan por [`src/features/billing/entitlements.ts`](../src/features/billing/entitlements.ts):

$$\text{TENANT OVERRIDE} \succ \text{PLAN ASIGNADO} \succ \text{DEFAULT (FALSE)}$$

```text
               ¿Existe Tenant Override?
                      │
            ┌─────────┴─────────┐
          SÍ│                   │NO
            ▼                   ▼
    ¿Está vigente?       ¿Tiene Plan activo?
      │           │             │
    SÍ│         NO│           SÍ│     NO
      ▼           ▼             ▼      ▼
   [Usar      [Descartar]    [Usar   [false]
  Override]        │        Plan]
                   └───────►
```

### Caso Real de Uso:
El carrito "Burger House" tiene el **Plan Básico** (el cual no incluye importación de cartas con IA). El Super Admin quiere otorgarle una prueba de 30 días de la función de IA como cortesía comercial.
* En lugar de cambiarle el plan entero, el Super Admin inserta una fila en `tenant_feature_overrides`:
  ```sql
  insert into tenant_feature_overrides (tenant_id, feature_id, value, expires_at)
  values ('...', 'ai_menu_import', 'true'::jsonb, now() + interval '30 days');
  ```
* La función `hasFeature(tenantId, 'ai_menu_import')` devolverá `true` durante esos 30 días y luego volverá automáticamente al valor del plan base sin intervención manual.

---

## 3. CONTROL DE LÍMITES NUMÉRICOS (QUOTAS)

Para límites como `max_products` o `max_categories`:
```typescript
const { allowed, current, limit } = await canCreateProduct(tenantId);
if (!allowed) {
  return {
    success: false,
    error: `Has alcanzado el límite de ${limit} productos de tu plan actual (${current}/${limit}). Hacé un upgrade para agregar más.`,
  };
}
```
La validación se ejecuta en el servidor antes de realizar la inserción, protegiendo al negocio contra abusos y asegurando el modelo de monetización del SaaS.
