# 02 — ARQUITECTURA GENERAL DEL SISTEMA
## Diseño Modular, Patrones de Software y Separación de Responsabilidades

---

## 1. PRINCIPIO RECTOR: VERTICAL SLICE ARCHITECTURE

La mayoría de los tutoriales de programación organizan el código por tipo técnico:
```text
controllers/
models/
views/
services/
```
En un SaaS mediano o grande, esta organización provoca que para modificar una sola funcionalidad (por ejemplo, "Agregar una variante a un producto"), un desarrollador tenga que abrir y editar 6 archivos repartidos por extremos opuestos del proyecto.

En **Carrito Take-Away**, aplicamos **Vertical Slice Architecture** (Arquitectura por Rebanadas Verticales) agrupada en `src/features/`:

```text
src/features/catalog/
├── actions/             # Mutaciones server-side (crear producto, editar precio)
├── components/          # Componentes visuales exclusivos del catálogo
├── queries/             # Consultas a Supabase
├── schemas/             # Validaciones Zod de productos y categorías
└── types/               # Tipos de TypeScript del catálogo
```

### Ventajas de este enfoque:
1. **Alta cohesión:** Todo lo que cambia junto vive junto.
2. **Bajo acoplamiento:** Si el módulo de fidelización (`features/loyalty`) sufre un rediseño, no rompe el módulo de pedidos (`features/orders`).
3. **Escalabilidad del equipo:** Distintos desarrolladores pueden trabajar en módulos diferentes sin colisiones en Git.

---

## 2. REACT SERVER COMPONENTS (RSC) VS. CLIENT COMPONENTS

Next.js 16 utiliza el paradigma moderno de React donde los componentes son **Server Components por defecto**.

### Comparativa Conceptual:

| Característica | Server Component (por defecto) | Client Component (`"use client"`) |
| :--- | :--- | :--- |
| **¿Dónde se ejecuta?** | Exclusivamente en el Servidor (Node.js) | En el Servidor (render inicial) y en el Navegador |
| **¿Afecta el peso del bundle JS?** | **No** (0 bytes de JS enviados al cliente) | **Sí** (se descarga código JS al navegador) |
| **¿Acceso a Base de Datos directa?** | **Sí** (vía `src/lib/supabase/server.ts`) | **No** (debe pasar por Server Actions o API) |
| **¿Puede usar `useState` o `useEffect`?** | **No** | **Sí** |
| **¿Maneja eventos de usuario (`onClick`)?** | **No** | **Sí** |
| **Seguridad de Secretos** | Totalmente protegidos (nunca llegan al cliente) | Inseguros si se colocan claves privadas |

### Regla de Oro en este proyecto:
> **Mantené los componentes como Server Components siempre que sea posible.**  
> Solo agregá `"use client"` en las hojas más pequeñas del árbol que requieran interactividad inmediata (un botón con un modal desplegable, un input interactivo, o un hook de WebSocket).

---

## 3. SERVER ACTIONS: MUTACIONES SEGURAS SIN CONTROLADORES REST

Antes de Next.js App Router, para guardar un formulario se requería crear una ruta `/api/products` (Route Handler) y hacer un `fetch()` con JSON desde el navegador.

Con **Server Actions**, escribimos funciones asíncronas marcadas con `"use server"` que se ejecutan directamente en el servidor pero pueden ser invocadas de forma nativa desde formularios o botones en React:

```typescript
// Ejemplo conceptual de Server Action
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleProductAvailability(productId: string, isAvailable: boolean) {
  const supabase = await createClient();
  
  // RLS valida automáticamente si el usuario autenticado tiene permisos
  const { error } = await supabase
    .from("products")
    .update({ is_available: isAvailable })
    .eq("id", productId);

  if (error) throw new Error(error.message);
  
  // Invalida la caché de Next.js para que la UI se actualice al instante
  revalidatePath("/admin/menu");
}
```

---

## 4. PATRÓN RESULT EN LUGAR DE LANZAR EXCEPCIONES AL CLIENTE

En lugar de dejar que errores de base de datos o validaciones rompan la UI con stack traces feos o pantallas blancas, estandarizamos las respuestas de mutaciones con el **Result Pattern**:

```typescript
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };
```

Esto permite al componente React verificar:
```typescript
const result = await toggleProductAvailability(id, true);
if (!result.success) {
  toast.error(result.error);
} else {
  toast.success("Producto actualizado");
}
```
