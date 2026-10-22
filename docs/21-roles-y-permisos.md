# 21 — ROLES Y PERMISOS (RBAC)
## Matriz de Acceso, Jerarquía y Autorización en Servidor

---

## 1. LOS CUATRO ROLES DEL SISTEMA

| Rol | Ámbito | Descripción |
| :--- | :--- | :--- |
| **SUPER_ADMIN** | Global (Plataforma) | Dueño de la plataforma SaaS. Administra todos los carritos, planes de suscripción, features globales, límites excepcionales y métricas de facturación. No pertenece a un carrito particular. |
| **OWNER** | Tenant Específico | Propietario del carrito gastronómico. Tiene control total sobre el negocio: carta, precios, métodos de pago, vinculación de Mercado Pago, personal y suscripción. |
| **MANAGER** | Tenant Específico | Encargado o jefe de turno. Puede administrar productos, categorías, horarios, promociones y resolver incidencias de pedidos. No puede eliminar el carrito ni gestionar datos de facturación del SaaS. |
| **STAFF** | Tenant Específico | Cocinero o despachador en el puesto. Acceso optimizado para el panel de cocina (KDS): aceptar pedidos, cambiar estados a preparando/listo y modificar el tiempo estimado (ETA) de despacho. |

---

## 2. MATRIZ REAL DE PERMISOS

| Acción de Negocio | Super Admin | Owner | Manager | Staff |
| :--- | :---: | :---: | :---: | :---: |
| **Crear / Suspender Tenants** | **✓** | ✗ | ✗ | ✗ |
| **Configurar Planes y Precios del SaaS** | **✓** | ✗ | ✗ | ✗ |
| **Habilitar Override de Features por Tenant** | **✓** | ✗ | ✗ | ✗ |
| **Invitar / Remover Miembros del Carrito** | ✗ | **✓** | ✗ | ✗ |
| **Vincular Credenciales de Mercado Pago** | ✗ | **✓** | ✗ | ✗ |
| **Crear / Modificar Productos y Precios** | ✗ | **✓** | **✓** | ✗ |
| **Modificar Temas y Colores de la Carta** | ✗ | **✓** | **✓** | ✗ |
| **Pausar Pedidos del Carrito** | ✗ | **✓** | **✓** | **✓** |
| **Cambiar Tiempo de Preparación (ETA)** | ✗ | **✓** | **✓** | **✓** |
| **Aceptar, Preparar y Entregar Pedidos** | ✗ | **✓** | **✓** | **✓** |

---

## 3. IMPLEMENTACIÓN EN CÓDIGO: VERIFICACIÓN JERÁRQUICA

En [`src/features/auth/server.ts`](../src/features/auth/server.ts) implementamos `requireTenantMembership()`:

```typescript
// Si se exige rol 'manager', tanto 'manager' como 'owner' están autorizados:
const roleHierarchy: Record<MembershipRole, number> = {
  owner: 3,
  manager: 2,
  staff: 1,
};

if (roleHierarchy[membership.role] < roleHierarchy[minimumRole]) {
  throw new Error(`Permiso insuficiente: Se requiere rol ${minimumRole} o superior.`);
}
```

### ¿Por qué nunca chequear permisos solo en la UI?
Si en un botón colocamos:
```tsx
{role === 'owner' && <button onClick={deleteProduct}>Eliminar</button>}
```
Un usuario malintencionado puede inspeccionar el DOM en DevTools, forzar la visualización del botón o ejecutar la petición en consola. Por eso, la Server Action `deleteProductAction` siempre valida `await requireTenantMembership(tenantId, 'owner')` en el servidor antes de hacer cualquier cambio.
