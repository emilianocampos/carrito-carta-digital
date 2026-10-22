# 18 — ROW LEVEL SECURITY (RLS) Y SEGURIDAD
## Aislamiento Multi-Tenant, Políticas de PostgreSQL y Protección de Datos

---

## 1. ¿QUÉ ES ROW LEVEL SECURITY (RLS) Y POR QUÉ EXISTE?

En la mayoría de las aplicaciones tradicionales, la seguridad se implementa únicamente en el código de backend:
```typescript
// Enfoque inseguro tradicional
const products = await db.query(
  "SELECT * FROM products WHERE tenant_id = $1", 
  [tenantId]
);
```
Si un programador olvida agregar `WHERE tenant_id = ...` en una sola consulta de la aplicación, un carrito podría ver o editar los productos, clientes o facturación de otro carrito.

**Row Level Security (RLS)** es una funcionalidad nativa del motor de base de datos **PostgreSQL**. Cuando RLS está activado en una tabla, PostgreSQL examina cada fila individualmente antes de entregarla al usuario o permitir una modificación. Si la fila no cumple la regla de seguridad (policy), PostgreSQL actúa como si la fila ni siquiera existiera.

> 🛡️ **LEMA FUNDAMENTAL:**  
> **"Nunca confíes en el frontend para la seguridad."**  
> Aunque un atacante modifique el código JavaScript en su navegador o envíe peticiones HTTP manipuladas con Postman o cURL, PostgreSQL rechazará cualquier operación no autorizada en el núcleo de la base de datos.

---

## 2. ANATOMÍA DE UNA POLÍTICA RLS: `USING` VS. `WITH CHECK`

Una política RLS en PostgreSQL se compone de dos cláusulas clave:

1. **`USING (condición)`**: Se aplica a operaciones de lectura (`SELECT`), actualización (`UPDATE`) y eliminación (`DELETE`). Determina **qué filas existentes son visibles** para la consulta.
2. **`WITH CHECK (condición)`**: Se aplica a operaciones de inserción (`INSERT`) y actualización (`UPDATE`). Determina **qué nuevos datos está permitido escribir**.

---

## 3. FUNCIONES DE SEGURIDAD UTILIZADAS EN ESTE PROYECTO

En [`supabase/migrations/20260902000001_initial_schema.sql`](../supabase/migrations/20260902000001_initial_schema.sql) definimos funciones auxiliares `SECURITY DEFINER`:

### 1. `get_auth_tenant_ids()`
```sql
create or replace function get_auth_tenant_ids()
returns setof uuid as $$
begin
  return query
    select tenant_id from public.memberships
    where user_id = auth.uid();
end;
$$ language plpgsql security definer stable;
```
* **¿Qué hace?** Lee el ID del usuario actual mediante `auth.uid()` (extraído del token JWT firmado) y devuelve la lista de IDs de carritos a los que pertenece.
* **¿Por qué `SECURITY DEFINER`?** Permite que la función consulte la tabla `memberships` con privilegios del sistema, evitando recursiones infinitas dentro de las políticas RLS.

### 2. `is_tenant_member(target_tenant_id uuid, required_role text default null)`
```sql
create or replace function is_tenant_member(target_tenant_id uuid, required_role text default null)
returns boolean as $$
begin
  if is_super_admin() then
    return true;
  end if;

  if required_role is null then
    return exists (
      select 1 from public.memberships
      where tenant_id = target_tenant_id and user_id = auth.uid()
    );
  elsif required_role = 'owner' then
    return exists (
      select 1 from public.memberships
      where tenant_id = target_tenant_id and user_id = auth.uid() and role = 'owner'
    );
  elsif required_role = 'manager' then
    return exists (
      select 1 from public.memberships
      where tenant_id = target_tenant_id and user_id = auth.uid() and role in ('owner', 'manager')
    );
  else
    return exists (
      select 1 from public.memberships
      where tenant_id = target_tenant_id and user_id = auth.uid()
    );
  end if;
end;
$$ language plpgsql security definer stable;
```
* **¿Qué hace?** Valida jerarquía de roles (`owner` > `manager` > `staff`) y otorga pase libre automático si el usuario es `super_admin`.

---

## 4. AUDITORÍA DE POLÍTICAS REALES DEL PROYECTO

A continuación se analizan las políticas críticas implementadas:

### 1. Política de Productos Públicos vs. Privados
```sql
create policy "Public and members can read products" on products
  for select using (
    (deleted_at is null and is_available = true and tenant_id in (select id from tenants where status = 'active'))
    or is_tenant_member(tenant_id)
  );
```
* **Qué permite:** 
  1. Un cliente no autenticado puede leer productos siempre que: no estén borrados (`deleted_at is null`), estén disponibles (`is_available = true`), y el carrito no esté suspendido.
  2. Un miembro del staff puede ver todos los productos de su carrito, incluso los pausados temporalmente.
* **¿Qué pasaría si estuviera mal configurada?** Si quitáramos la condición `is_available = true`, los clientes verían productos agotados y los comprarían por error.

### 2. Política de Gestión de Pedidos
```sql
create policy "Members can view and update tenant orders" on orders
  for all using (is_tenant_member(tenant_id) or is_super_admin());
```
* **Qué garantiza:** **Aislamiento total entre carritos.** El dueño o cocinero del carrito A no puede listar, ver, modificar estados ni cancelar pedidos del carrito B bajo ninguna circunstancia.
