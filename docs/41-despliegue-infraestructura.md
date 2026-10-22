# 41 — DESPLIEGUE E INFRAESTRUCTURA DE PRODUCCIÓN
## Variables de Entorno, Vercel, Supabase Cloud y Dominios Personalizados

---

## 1. VARIABLES DE ENTORNO REQUERIDAS

Para desplegar la aplicación en producción (ej: Vercel o Railway), se deben configurar las siguientes variables de entorno:

```ini
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Plataforma
NEXT_PUBLIC_APP_URL=https://tucarrito.app

# Inteligencia Artificial (Opcional, tiene fallback Mock offline)
GEMINI_API_KEY=AIzaSy...

# Mercado Pago Global (Fallback para la plataforma)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
```

---

## 2. CONFIGURACIÓN DE RUTAS Y DOMINIOS

* **Carta Digital del Food Truck:** `https://tucarrito.app/c/[slug]`
* **Comandera de Cocina:** `https://tucarrito.app/admin/[tenantSlug]/orders`
* **Dashboard de Administrador:** `https://tucarrito.app/admin/[tenantSlug]/dashboard`
* **Panel de Super Admin Global:** `https://tucarrito.app/admin/super`
* **Webhook de Pagos:** `https://tucarrito.app/api/webhooks/mercadopago`
