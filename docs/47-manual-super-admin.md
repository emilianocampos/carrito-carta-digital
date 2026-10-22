# 47 — MANUAL DEL SUPER ADMINISTRADOR (SAAS OWNER)
## Guía de Control Maestro de Plataforma, Cobro de Planes y Overrides

---

## 1. PANEL MAESTRO (`/admin/super`)

El panel de Super Admin es de acceso exclusivo para fundadores y administradores globales con `is_super_admin = true` en su perfil.

### Métricas Clave de Negocio (KPIs):
* **Food Trucks:** Cantidad de carritos activos vs. total registrados en la red.
* **Comensales:** Base acumulada de clientes que han hecho pedidos en algún carrito.
* **GMV Transaccionado:** Volumen total facturado en comidas a través de la plataforma.
* **MRR Estimado:** Facturación mensual recurrente proyectada sumando las suscripciones de los carritos activos.

---

## 2. GESTIÓN DE CARRITOS Y POLÍTICAS COMERCIALES

* **Suspender un Carrito:** Con 1 tap en el botón de pausa podés suspender un food truck por falta de pago o reclamos de calidad. La carta pública se desactiva inmediatamente.
* **Cambio de Plan:** Selector instantáneo para pasar un carrito de Plan Básico a Pro o Premium.
* **Feature Overrides de Cortesía:** Con el botón de rayo podés otorgar excepciones (ej: catálogo ilimitado) sin alterar la lógica de los planes estándar de la base de datos.
