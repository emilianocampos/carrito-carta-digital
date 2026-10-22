# 27 — CARTA DIGITAL Y MOTOR DE MENÚ MÓVIL
## Arquitectura de Alta Velocidad, Mobile-First y Separación Datos vs. Presentación

---

## 1. EL DESAFÍO DE LA CARTA DIGITAL EN UN CARRITO DE COMIDA

Cuando un comensal escanea un código QR en la barra de un food truck:
1. **Está usando datos móviles 4G (a menudo con señal inestable).**
2. **Tiene hambre y poca paciencia:** si la página tarda más de 3 segundos en cargar o descarga 5 megabytes de JavaScript, el cliente guarda el celular y pide por mostrador.
3. **Usa un teléfono de gama media con pantalla pequeña (360px a 400px de ancho).**

Por este motivo, la carta digital pública en `/c/[slug]` está diseñada bajo el principio de **cero fricción**:
* No requiere instalar ninguna aplicación nativa (funciona directo en el navegador del celular).
* No exige crear una cuenta ni recordar contraseñas para ver los precios o agregar productos.
* Se renderiza en el servidor mediante **React Server Components (RSC)**, enviando HTML precalculado instantáneo.

---

## 2. SEPARACIÓN DE RESPONSABILIDADES: DATOS VS. PRESENTACIÓN

Un error fatal en sistemas de cartas digitales es mezclar el diseño visual con la lógica de base de datos:
```typescript
// ❌ CÓDIGO ACOPLADO Y RÍGIDO (Difícil de mantener)
function BurgerMenu() {
  return <div className="bg-red-800 text-white font-bebas">...</div>;
}
```

En **Carrito Take-Away**, aplicamos una separación estricta:
1. **Los Datos (`PublicMenuData` en `src/features/catalog/queries.ts`):**  
   Son puramente relacionales: nombre, precio, descripción, foto, tiempo de preparación, variantes y grupos de adicionales. No saben qué color tiene el fondo ni qué tipografía se usa.
2. **El Motor de Menú (`src/features/menu-engine/`):**  
   Compone los datos estructurados en componentes visuales modulares:
   * [`MenuHeader.tsx`](../src/features/menu-engine/components/MenuHeader.tsx): Banner, logo, ETA y banner de pedidos pausados.
   * [`CategoryNav.tsx`](../src/features/menu-engine/components/CategoryNav.tsx): Barra horizontal fija con desplazamiento suave (ScrollSpy).
   * [`ProductCard.tsx`](../src/features/menu-engine/components/ProductCard.tsx): Tarjeta móvil optimizada para un tap rápido.
   * [`ProductCustomizerModal.tsx`](../src/features/menu-engine/components/ProductCustomizerModal.tsx): BottomSheet interactivo para selección de extras.

---

## 3. CÓMO FUNCIONA EL PIPELINE DE CONSULTA EN EL SERVIDOR

```text
Usuario escanea QR (GET /c/burger-house)
                   │
                   ▼
       [Page Server Component]
       src/app/(public)/c/[slug]/page.tsx
                   │
                   ▼ (Invoca query segura)
       getPublicMenuBySlug("burger-house")
       src/features/catalog/queries.ts
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
1. Busca Tenant         2. Busca Categorías
   (status='active')       (is_active=true)
        │                     │
        └──────────┬──────────┘
                   ▼
3. Busca Productos y Grupos de Opciones
   (is_available=true, deleted_at is null)
                   │
                   ▼
Construye árbol jerárquico anidado de categorías con productos
                   │
                   ▼
Renderiza <PublicMenuView menuData={...} />
                   │
                   ▼
Navegador recibe HTML pintado al 100% en menos de 500ms
```

---

## 4. ANATOMÍA DEL CUSTOMIZER MODAL (CLIENT COMPONENT)

[`ProductCustomizerModal.tsx`](../src/features/menu-engine/components/ProductCustomizerModal.tsx) es un **Client Component (`"use client"`)** porque gestiona estado efímero del usuario:
* **Selección exclusiva (Radio):** Cuando un grupo tiene `maxSelectable === 1` (ej. Tamaño: Simple o Doble).
* **Selección múltiple (Checkboxes):** Cuando un grupo permite hasta N adicionales (ej. Cheddar extra, Panceta, Huevo).
* **Cálculo dinámico del subtotal:**
  $$\text{Subtotal} = (\text{Precio Base} + \sum \text{Precios Extras}) \times \text{Cantidad}$$
* **Validación de reglas obligatorias:** Si una hamburguesa exige elegir punto de cocción (`isRequired === true`), el botón "Agregar al pedido" permanece deshabilitado hasta cumplir el requisito.
