# 34 — PANEL DE SUPER ADMIN Y CONTROL DE TENANTS
## Jerarquía de Plataforma, Bypass de RLS y Registro Maestro de Auditoría

---

## 1. ROLES DE TENANT VS. SUPER ADMIN DE PLATAFORMA

En un SaaS multi-tenant como **Carrito Take-Away**, conviven dos planos de seguridad completamente distintos:

```mermaid
graph TD
    subgraph Plano de Plataforma (SaaS)
        SA[Super Admin: is_super_admin = true]
    end

    subgraph Plano de Inquilinos (Tenants)
        T1[Burger House]
        T2[Tacos Chingones]
        T3[Pizza Móvil]

        O1[Owner] --> T1
        M1[Manager] --> T1
        S1[Staff] --> T1

        O2[Owner] --> T2
    end

    SA -->|Bypass y Control Maestro| T1
    SA -->|Bypass y Control Maestro| T2
    SA -->|Bypass y Control Maestro| T3
```

### Diferencias Clave:
* **Tenant Owner:** Solo ve y administra los datos de su propio food truck (`tenant_id = X`).
* **Super Admin:** Es el dueño de la infraestructura SaaS. Tiene acceso a métricas agregadas globales (GMV de toda la red, MRR, comensales totales) y puede suspender carritos infractores o asignar planes.

---

## 2. AUDITORÍA OBLIGATORIA (`audit_logs`)

Cualquier cambio sensible realizado por un Super Admin (suspensión de cuenta, alteración de plan o creación de overrides) debe ser **inmutable y auditable**.

En [`src/features/super-admin/actions.ts`](../src/features/super-admin/actions.ts), cada Server Action registra automáticamente una fila en `audit_logs`:

```typescript
await supabase.from('audit_logs').insert({
  actor_id: admin.userId,
  tenant_id: tenantId,
  action: 'tenant_status_changed',
  entity_type: 'tenants',
  entity_id: tenantId,
  metadata: {
    oldStatus: 'active',
    newStatus: 'suspended',
    reason: 'Falta de pago de suscripción',
  },
});
```

---

## 3. SUSPENSIÓN DE UN CARRITO: EFECTO EN CASCADA

Cuando el Super Admin presiona `[Suspender Carrito]`:
1. `tenants.status` cambia de `'active'` a `'suspended'`.
2. **Efecto en la Carta Digital (`/c/[slug]`):** El Server Component detecta que el tenant no está activo y muestra inmediatamente la página `not-found.tsx` o pantalla de servicio suspendido.
3. **Efecto en la API de Pedidos:** `createOrderAction()` comprueba el estado antes de procesar transacciones y rechaza cualquier intento de compra.
4. **Efecto en el Staff:** El cocinero y el dueño ya no pueden despachar pedidos hasta regularizar su situación.
