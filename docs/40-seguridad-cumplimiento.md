# 40 — SEGURIDAD, AUTENTICACIÓN Y OWASP
## Políticas de Seguridad, Protección contra Inyecciones y Manejo de Secretos

---

## 1. GUARDAS DE SEGURIDAD EN CAPAS

La plataforma implementa el principio de **Defensa en Profundidad (Defense-in-Depth)**:

1. **Capa 1 — Network & Headers:** Middleware de Next.js verifica sesiones activas y redirige intentos no autorizados.
2. **Capa 2 — Server Actions & Zod:** Validación estricta de todos los payloads entrantes. Precios y descuentos calculados exclusivamente en el servidor.
3. **Capa 3 — RBAC (Role-Based Access Control):** Función `requireTenantMembership` que valida si el usuario es `owner`, `manager` o `staff`.
4. **Capa 4 — PostgreSQL Row Level Security (RLS):** Última línea de defensa inexpugnable. Ninguna query SQL puede violar el filtro de `tenant_id`.

---

## 2. MANEJO SEGURO DE SECRETOS DE MERCADO PAGO

* Los Access Tokens de cada carrito se guardan encriptados en reposo en PostgreSQL.
* Jamás se envían las claves privadas al navegador del comensal.
* El frontend solo interactúa con el `init_point` público generado por el backend.
