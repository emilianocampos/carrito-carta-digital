# 03 — ESTRUCTURA DEL PROYECTO
## Inventario de Carpetas, Responsabilidades y Convenciones de Código

---

## 1. ÁRBOL COMPLETO DE DIRECTORIOS

```text
carrito-take-away/
├── docs/                        # Documentación técnica, pedagógica y guías de mantenimiento
├── supabase/
│   ├── migrations/              # Archivos SQL versionados con DDL, funciones y políticas RLS
│   └── seed.sql                 # Datos iniciales para planes, features y carritos demo
├── src/
│   ├── app/                     # Enrutamiento basado en archivos de Next.js (App Router)
│   │   ├── globals.css          # Estilos globales y directivas de Tailwind CSS
│   │   ├── layout.tsx           # Layout raíz de la aplicación (HTML base, Fuentes, Providers)
│   │   └── page.tsx             # Landing page / Entrada principal
│   ├── components/              # Componentes de UI reutilizables
│   │   ├── ui/                  # Componentes primitivos (Botones, Modales, Inputs, Badges)
│   │   └── feedback/            # Toasts, esqueletos de carga y límites de error
│   ├── features/                # Módulos verticales de negocio (Vertical Slices)
│   │   ├── auth/                # Sesión, perfiles, cookies y autorización
│   │   ├── billing/             # Planes, verificación de límites y entitlements (hasFeature)
│   │   ├── catalog/             # Productos, categorías y variantes
│   │   ├── menu-engine/         # Motor de temas, presets visuales y preview
│   │   ├── orders/              # Máquina de estados de pedidos, KDS móvil y Realtime
│   │   └── tenants/             # Gestión de carritos, slugs y membresías
│   ├── lib/                     # Infraestructura técnica y librerías base
│   │   ├── supabase/            # Clientes de Supabase (client, server, admin, middleware)
│   │   ├── validations/         # Esquemas de validación Zod compartidos
│   │   └── utils.ts             # Utilidades universales (cn, formatCurrency, slugify)
│   ├── types/                   # Definiciones de TypeScript
│   │   └── database.ts          # Mapeo exacto de tablas y tipos de Supabase
│   └── middleware.ts            # Middleware de Next.js (refresco de tokens de sesión)
├── .env.example                 # Plantilla de variables de entorno seguras
├── .env.local                   # Variables de entorno locales activas
├── package.json                 # Dependencias y scripts de ejecución
├── tsconfig.json                # Configuración de compilación de TypeScript
└── next.config.ts               # Configuración del compilador de Next.js
```

---

## 2. INVENTARIO DETALLADO DE ARCHIVOS FUNDAMENTALES

### `src/lib/supabase/client.ts`
* **Responsabilidad:** Provee el cliente de Supabase para componentes del navegador (`"use client"`).
* **Se ejecuta en:** Navegador del cliente.
* **Qué hace internamente:** Lee `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, gestiona la sesión mediante cookies del browser y permite suscribirse a canales WebSocket de Realtime.
* **Qué NO debería hacer:** NUNCA intentar usar `SUPABASE_SERVICE_ROLE_KEY` en este archivo.

### `src/lib/supabase/server.ts`
* **Responsabilidad:** Provee el cliente de Supabase para Server Components, Server Actions y Route Handlers.
* **Se ejecuta en:** Servidor Node.js.
* **Qué hace internamente:** Utiliza la función `cookies()` de `next/headers` para leer las cookies de la petición HTTP actual y transmitirlas a Supabase, asegurando que PostgreSQL reconozca al usuario autenticado (`auth.uid()`).
* **Qué podría romperse si se modifica:** Si se remueve el manejo de `cookies.getAll()` y `cookies.setAll()`, la sesión se perderá en las mutaciones del servidor.

### `src/lib/supabase/admin.ts`
* **Responsabilidad:** Cliente privilegiado con la clave de servicio (`SUPABASE_SERVICE_ROLE_KEY`).
* **Se ejecuta en:** Servidor exclusivo.
* **Peligro:** Salta todas las políticas RLS. Solo debe utilizarse para tareas de mantenimiento administrativo o conciliación de webhooks externos.

### `src/features/billing/entitlements.ts`
* **Responsabilidad:** Motor de evaluación de Feature Flags y Límites de consumo.
* **Funciones clave:** `hasFeature(tenantId, featureCode)`, `getResourceLimit(tenantId, limitCode)`, `canCreateProduct(tenantId)`.
* **Regla de negocio:** Evalúa primero si hay un override para el tenant; si no, evalúa el plan de la suscripción; de lo contrario, niega el acceso por defecto.
