# CARRITO TAKE-AWAY — DOCUMENTACIÓN TÉCNICA Y GUÍA EDUCATIVA DEL SISTEMA

Bienvenido a la documentación oficial y manual de arquitectura de **Carrito Take-Away**, una plataforma SaaS Multi-Tenant de alto rendimiento diseñada específicamente para carritos de comida, food trucks y pequeños negocios gastronómicos.

Esta documentación está concebida bajo un principio fundamental:
> **Aprender arquitectura de software profesional, Next.js, React, Supabase y PostgreSQL utilizando este proyecto real como caso de estudio.**

---

## 🧭 ¿POR DÓNDE EMPIEZO?

Seleccioná tu objetivo para ir directamente al capítulo correspondiente:

### 🚀 Quiero instalar y levantar el proyecto en mi computadora
👉 [01 — Comenzar desde Cero](./01-comenzar-desde-cero.md)  
*Requisitos, instalación de dependencias, configuración de `.env`, arranque de Supabase y Next.js paso a paso.*

### 🏛️ Quiero entender cómo está pensado el sistema y cómo se comunican las partes
👉 [02 — Arquitectura General](./02-arquitectura-general.md)  
*Vertical Slice Architecture, React Server Components vs. Client Components, flujo completo de una petición.*

### 📂 Quiero entender qué hace cada carpeta y archivo
👉 [03 — Estructura del Proyecto](./03-estructura-del-proyecto.md)  
*Mapa detallado del código fuente, por qué existe cada carpeta y qué consecuencias tiene mover código.*

### 🛡️ Quiero entender la seguridad, aislamiento de datos y Row Level Security (RLS)
👉 [18 — RLS y Seguridad](./18-rls-y-seguridad.md)  
*Explicación de RLS desde cero, por qué la seguridad nunca depende del frontend y auditoría de cada política del SQL real.*

### 🏢 Quiero entender cómo funciona el Multi-Tenancy
👉 [20 — Multi-Tenancy](./20-multitenancy.md)  
*Relación Usuario ➔ Membresía ➔ Tenant, aislamiento de carritos y prevención de fugas de datos.*

### 👥 Quiero entender los roles y permisos del personal
👉 [21 — Roles y Permisos](./21-roles-y-permisos.md)  
*Matriz RBAC real: Super Admin, Owner, Manager y Staff (cocinero).*

### 🏷️ Quiero entender los Feature Flags, Planes y Límites de consumo
👉 [22 — Feature Flags y Entitlements](./22-feature-flags-y-entitlements.md)  
*Cómo funciona `hasFeature()`, jerarquía de Overrides y control transaccional de cuotas.*

---

## 🗺️ MAPA GENERAL DE CAPÍTULOS

| N° | Capítulo | Estado |
| :--- | :--- | :--- |
| **01** | [Comenzar desde Cero](./01-comenzar-desde-cero.md) | **[IMPLEMENTADO]** |
| **02** | [Arquitectura General](./02-arquitectura-general.md) | **[IMPLEMENTADO]** |
| **03** | [Estructura del Proyecto](./03-estructura-del-proyecto.md) | **[IMPLEMENTADO]** |
| **04** | JavaScript y TypeScript en el Proyecto | [EN DESARROLLO] |
| **05** | React desde Cero aplicado a Gastronomía | [EN DESARROLLO] |
| **06** | Hooks de React Documentados | [EN DESARROLLO] |
| **07** | Componentes React y Composición | [EN DESARROLLO] |
| **08** | Next.js desde Cero y App Router | [EN DESARROLLO] |
| **09** | App Router y Enrutamiento Dinámico | [EN DESARROLLO] |
| **10** | Server Components vs. Client Components | [EN DESARROLLO] |
| **16** | Supabase y PostgreSQL desde Cero | [EN DESARROLLO] |
| **17** | Modelo de Datos y Tablas Relacionales | [EN DESARROLLO] |
| **18** | [Row Level Security (RLS) y Seguridad](./18-rls-y-seguridad.md) | **[IMPLEMENTADO]** |
| **19** | Autenticación y Manejo de Sesiones | [EN DESARROLLO] |
| **20** | [Multi-Tenancy y Aislamiento](./20-multitenancy.md) | **[IMPLEMENTADO]** |
| **21** | [Roles y Permisos (RBAC)](./21-roles-y-permisos.md) | **[IMPLEMENTADO]** |
| **22** | [Feature Flags, Planes y Límites](./22-feature-flags-y-entitlements.md) | **[IMPLEMENTADO]** |
| **23** | [Supabase Realtime y WebSockets en Cocina](./23-realtime.md) | **[IMPLEMENTADO]** |
| **24** | [Supabase Storage y Gestión de Fotos](./24-storage.md) | **[IMPLEMENTADO]** |
| **25** | [Catálogo de Productos y Modificadores](./25-catalogo-productos.md) | **[IMPLEMENTADO]** |
| **26** | [KDS de Cocina y Operación Móvil](./26-kds-cocina.md) | **[IMPLEMENTADO]** |
| **27** | [Carta Digital y Rendimiento Móvil](./27-menu-digital.md) | **[IMPLEMENTADO]** |
| **28** | [Ciclo de Vida y Estados de Pedidos](./28-pedidos.md) | **[IMPLEMENTADO]** |
| **29** | [Promociones y Descuentos](./29-promociones.md) | **[IMPLEMENTADO]** |
| **30** | [Integración de Pagos con Mercado Pago](./30-pagos-mercadopago.md) | **[IMPLEMENTADO]** |
| **31** | [Fidelización y Puntos](./31-fidelizacion.md) | **[IMPLEMENTADO]** |
| **32** | [Módulo de IA Desacoplado](./32-modulo-ia.md) | **[IMPLEMENTADO]** |
| **33** | [Sistema de Temas y Presets de Diseño](./33-temas-y-presets.md) | **[IMPLEMENTADO]** |
| **34** | [Panel de Super Admin y Control Multi-Tenant](./34-super-admin.md) | **[IMPLEMENTADO]** |
| **35** | [Suscripciones, Planes y Feature Overrides](./35-suscripciones.md) | **[IMPLEMENTADO]** |
| **36** | [Sistema de Notificaciones Multicanal](./36-notificaciones.md) | **[IMPLEMENTADO]** |
| **37** | [Flujos Completos de Negocio](./37-flujos-completos.md) | **[IMPLEMENTADO]** |
| **38** | [Guía de Mantenimiento sin IA](./38-mantenimiento-sin-ia.md) | **[IMPLEMENTADO]** |
| **39** | [Estrategia de Testing y QA](./39-testing-qa.md) | **[IMPLEMENTADO]** |
| **40** | [Seguridad y Cumplimiento](./40-seguridad-cumplimiento.md) | **[IMPLEMENTADO]** |
| **41** | [Despliegue e Infraestructura](./41-despliegue-infraestructura.md) | **[IMPLEMENTADO]** |
| **44** | [Manual del Administrador de Carrito](./44-manual-administrador-tenant.md) | **[IMPLEMENTADO]** |
| **45** | [Manual del Cocinero KDS](./45-manual-cocinero-kds.md) | **[IMPLEMENTADO]** |
| **47** | [Manual del Super Administrador SaaS](./47-manual-super-admin.md) | **[IMPLEMENTADO]** |
| **49** | [Glosario Técnico y Gastronómico](./49-glosario-tecnico.md) | **[IMPLEMENTADO]** |

---

## 📌 REGLA DE ORO DE ESTA DOCUMENTACIÓN

Cada explicación en esta suite documental cumple con tres condiciones:
1. **Basada en código REAL existente:** No se inventan funciones o tablas que no estén escritas en el repositorio.
2. **Explicación del POR QUÉ:** No se limita a describir la sintaxis; detalla qué problema resuelve y qué sucedería si se altera.
3. **Progresión pedagógica:** Permite que cualquier programador, independientemente de su nivel inicial, comprenda el sistema y adquiera autonomía para modificarlo.
