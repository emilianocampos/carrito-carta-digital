# 38 — GUÍA DE MANTENIMIENTO Y EVOLUCIÓN SIN IA
## Procedimientos para Desarrolladores Humanos, Diagnóstico y Buenas Prácticas

---

## 1. ESTRUCTURA Y CONVENCIONES DEL PROYECTO

Cualquier ingeniero de software que deba mantener esta plataforma puede ubicarse en segundos siguiendo esta organización:

* `src/features/`: Módulos de negocio completamente autosuficientes (`auth`, `menu-catalog`, `orders`, `promotions`, `payments`, `ai`, `super-admin`).
* `src/app/`: Rutas Next.js App Router extremadamente delgadas que solo resuelven parámetros y delegan la lógica a los componentes de `features`.
* `src/types/database.ts`: Contrato de tipos de Supabase generado directamente a partir de las migraciones SQL.

---

## 2. PROCEDIMIENTO PARA AGREGAR UNA NUEVA TABLA O COLUMNA

1. Crear un archivo SQL numerado en `supabase/migrations/` (ej: `20260902000004_nueva_tabla.sql`).
2. Declarar las restricciones de `tenant_id` y habilitar `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
3. Actualizar `src/types/database.ts` reflejando la tabla bajo `Database['public']['Tables']` incluyendo obligatoriamente `Relationships: []`.
4. Ejecutar `npx tsc --noEmit` para verificar que ningún Server Action o query falle.

---

## 3. CHECKLIST PARA RESOLVER INCIDENCIAS COMUNES

* **El cocinero dice que no escucha la campana sonora:**
  * Los navegadores modernos bloquean el audio automático hasta que el usuario interactúa con la pantalla al menos una vez. Al entrar al KDS, el cocinero debe tocar cualquier botón para desbloquear el `AudioContext`.
* **Un cupón no aplica el descuento esperado:**
  * Verificar en `src/features/promotions/actions.ts` la validación de compra mínima (`min_order_amount`) y tope de descuento (`max_discount_amount`). Recordar que el recálculo se hace en el servidor.
* **El Webhook de Mercado Pago no actualiza el pedido:**
  * Verificar que el servidor tenga configurado `NEXT_PUBLIC_APP_URL` con HTTPS público o un túnel como ngrok para recibir el POST de Mercado Pago.
