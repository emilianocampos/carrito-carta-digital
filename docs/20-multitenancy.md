# 20 — MULTI-TENANCY
## Modelo de Aislamiento, Tenancy Compartido y Resolución de Contexto

---

## 1. ¿QUÉ ES UNA ARQUITECTURA MULTI-TENANT?

En una arquitectura Multi-Tenant, una única instancia de la aplicación y una única base de datos dan servicio a múltiples clientes de negocio (cada uno llamado **Tenant** o Carrito).

### Modelos de Multi-Tenancy posibles:
1. **Base de datos separada por tenant:** Máximo aislamiento pero costo exorbitante y mantenimiento inmanejable para cientos o miles de carritos.
2. **Esquema separado por tenant (PostgreSQL schemas):** Complejidad en migraciones.
3. **Base de datos compartida con discriminador de fila (`tenant_id`) y RLS:**  
   *(La arquitectura implementada en este proyecto).* Es la más eficiente, económica y escalable.

---

## 2. LA TRÍADA DE IDENTIDAD: USER ➔ MEMBERSHIP ➔ TENANT

Uno de los errores más comunes al diseñar SaaS es colocar `tenant_id` directamente en la tabla de usuarios:
```sql
-- ❌ DISEÑO DEFECTUOSO (Impide que una persona trabaje en más de un carrito)
create table users (
  id uuid,
  tenant_id uuid
);
```

En **Carrito Take-Away**, un usuario es un individuo independiente y su relación con uno o más carritos se modela mediante la tabla intermedia `memberships`:

```text
       ┌───────────────┐
       │     USERS     │ (auth.users de Supabase)
       └───────┬───────┘
               │ 1
               ▼ N
       ┌───────────────┐
       │  MEMBERSHIPS  │ (user_id, tenant_id, role)
       └───────┬───────┘
               │ N
               ▼ 1
       ┌───────────────┐
       │    TENANTS    │ (id, name, slug, status)
       └───────────────┘
```

### Casos de uso que este modelo resuelve:
* Un cocinero trabaja de lunes a miércoles en el carrito "Burger House" como `staff`, y los fines de semana en "Lomitos El Flaco" como `manager`.
* Un empresario gastronómico es `owner` de 3 carritos diferentes en distintos puntos de la ciudad y puede cambiar de uno a otro desde el mismo celular sin cerrar sesión.

---

## 3. CÓMO SE RESUELVE EL TENANT EN CADA PETICIÓN

### En la Carta Pública:
* La URL contiene el slug: `/c/burger-house`.
* El Server Component busca en la tabla `tenants` por `slug = 'burger-house'` y obtiene el `tenant_id`.
* Todas las consultas posteriores de categorías y productos usan este `tenant_id`.

### En el Panel Administrativo Móvil:
* El usuario se autentica con email y contraseña.
* El helper `src/features/auth/server.ts` invoca `requireTenantMembership(tenantId, 'staff')`.
* Si el usuario no tiene fila en `memberships` para ese `tenant_id`, se deniega el acceso inmediatamente en el servidor.
