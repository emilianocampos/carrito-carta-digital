# 01 — COMENZAR DESDE CERO
## Guía de Instalación, Configuración y Recorrido Paso a Paso

---

## 1. ¿QUÉ ES ESTE PROYECTO Y QUÉ PROBLEMA RESUELVE?

**Carrito Take-Away** es un SaaS (Software as a Service) Multi-Tenant para negocios gastronómicos móviles o de espacio reducido: food trucks, carritos de hamburguesas, lomiterías y puestos al paso.

### El problema de la gastronomía móvil:
1. **Largas filas frente al mostrador:** El comensal espera 20 minutos de pie solo para hacer el pedido, y otros 20 para recibirlo.
2. **Caos en cocina con comandas de papel:** Papeles mojados con grasa, pedidos perdidos y falta de visibilidad del tiempo estimado de entrega (ETA).
3. **Altas comisiones de plataformas de delivery (20% a 35%):** Comercios al paso tienen márgenes ajustados y pierden dinero vendiendo a través de apps tradicionales cuando el cliente ya está físicamente en el lugar.
4. **Falta de computadoras en el puesto:** El dueño opera desde su celular, a menudo con una sola mano libre mientras cocina o atiende.

### La solución:
* El cliente escanea un código QR en el carrito o abre un enlace, ve la carta digital de alta fidelidad visual, arma su hamburguesa con adicionales, paga o elige pago en efectivo, y recibe un número de seguimiento en tiempo real.
* El cocinero maneja los pedidos desde su propio smartphone con toques gigantes: `[Aceptar]`, `[Preparar]`, `[Listo]`, ajustando el tiempo de cocina con 1 tap.

---

## 2. STACK TECNOLÓGICO Y ROL DE CADA HERRAMIENTA

| Tecnología | Rol en el Proyecto | ¿Por qué se eligió? |
| :--- | :--- | :--- |
| **Next.js 16 (App Router)** | Framework Full-Stack | Permite Server Components (velocidad y seguridad) y Server Actions sin requerir un servidor Express separado. |
| **React 19** | Biblioteca de Interfaz | Paradigma declarativo, re-renderizado reactivo y compatibilidad con interfaces móviles fluidas. |
| **TypeScript 5** | Tipado Estático | Evita errores en tiempo de ejecución (ej. acceder a propiedades inexistentes de un producto o pedido). |
| **Supabase** | Backend as a Service | Provee PostgreSQL gestionado, autenticación por cookies/JWT, WebSockets en tiempo real y almacenamiento de fotos. |
| **PostgreSQL con RLS** | Base de Datos Relacional | Garantiza que ningún carrito pueda ver o modificar datos de otro carrito mediante políticas a nivel de fila (RLS). |
| **Tailwind CSS v4** | Motor de Estilos | Estilos en línea mediante clases utilitarias altamente optimizadas, sin hojas de estilo CSS desordenadas. |
| **Zod** | Validación de Esquemas | Valida rigurosamente la entrada de datos en el servidor antes de tocar la base de datos. |

---

## 3. REQUISITOS PREVIOS

Asegurate de tener instalados en tu computadora:
* **Node.js**: Versión 20.x o superior (recomendado Node 22 o 24).
* **npm**: Gestor de paquetes incluido con Node.js.
* **Cuenta en Supabase**: Gratuita en [supabase.com](https://supabase.com) (o Supabase CLI local con Docker).

---

## 4. INSTALACIÓN PASO A PASO

### Paso 1: Clonar el repositorio y acceder a la carpeta
```bash
cd carrito-take-away
```

### Paso 2: Instalar dependencias
Las dependencias ya están configuradas en `package.json`. Ejecutá:
```bash
npm install
```

### Paso 3: Configurar las variables de entorno
Copiá el archivo de plantilla `.env.example` creando un nuevo archivo `.env.local`:
```bash
cp .env.example .env.local
```

Abrí `.env.local` y completá con los datos de tu proyecto de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-publica
SUPABASE_SERVICE_ROLE_KEY=tu-clave-secreta-service-role
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ **REGLA FUNDAMENTAL DE SEGURIDAD:**  
> Las variables que comienzan con `NEXT_PUBLIC_` son accesibles en el navegador. La clave `SUPABASE_SERVICE_ROLE_KEY` NUNCA debe llevar el prefijo `NEXT_PUBLIC_` porque posee privilegios absolutos sobre la base de datos y saltaría todas las protecciones RLS.

---

## 5. EJECUTAR MIGRACIONES Y SEEDS EN SUPABASE

Para crear todas las tablas, índices, funciones y políticas de seguridad:

1. Ingresá a tu panel de **Supabase Dashboard** ➔ Sección **SQL Editor**.
2. Abrí el archivo [`supabase/migrations/20260902000001_initial_schema.sql`](../supabase/migrations/20260902000001_initial_schema.sql).
3. Copiá y pegá todo su contenido en el SQL Editor de Supabase y presioná **Run**.
4. Abrí el archivo [`supabase/seed.sql`](../supabase/seed.sql), pegalo en una nueva pestaña del SQL Editor y ejecutalo. Esto creará los planes por defecto (`basic`, `pro`, `premium`), el catálogo de funcionalidades y el carrito demo **Burger House**.

---

## 6. INICIAR EL SERVIDOR DE DESARROLLO

Ejecutá en tu terminal:
```bash
npm run dev
```

Next.js compilará la aplicación y estará disponible en:
```
http://localhost:3000
```

---

## 7. EL VIAJE COMPLETO DE UNA PETICIÓN (REQUEST LIFECYCLE)

Para entender cómo dialogan las capas de la aplicación, sigamos qué ocurre cuando un usuario abre una página:

```text
[1] Navegador del Usuario
      │  (Envía GET /c/burger-house)
      ▼
[2] Next.js Middleware (src/middleware.ts)
      │  (Lee cookies de sesión y refresca tokens de Supabase)
      ▼
[3] App Router & Layout Server Component
      │  (Ejecuta código exclusivamente en el SERVIDOR Node.js)
      ▼
[4] Data Access Layer (src/lib/supabase/server.ts)
      │  (Realiza query a PostgreSQL con credenciales de usuario)
      ▼
[5] PostgreSQL & Row Level Security (RLS)
      │  (Valida: ¿El tenant está activo? ¿Los productos están disponibles?)
      ▼
[6] React Server Component Render
      │  (Genera el HTML y el árbol de componentes RSC)
      ▼
[7] Navegador recibe HTML inicial instantáneo
      │  (Visualización inmediata para el usuario)
      ▼
[8] Hidratación de Client Components ("use client")
      │  (Botones de agregar al carrito y filtros adquieren interactividad)
```
