# 33 — MOTOR DE TEMAS, PRESETS VISUALES Y FIGMA-TO-ENGINE
## Separación de Datos vs. Presentación, Inyección de Variables CSS y Previews en Vivo

---

## 1. PRINCIPIO FUNDAMENTAL: DATOS ≠ PRESENTACIÓN

En muchas plataformas web mal diseñadas, cuando se crea un "tema oscuro" o un "tema gourmet", los desarrolladores duplican la página entera (`menu-dark.tsx`, `menu-gourmet.tsx`).

### ¿Por qué esto es una catástrofe de mantenimiento?
* Si agregás una funcionalidad (por ejemplo, "Aclaraciones para la cocina"), tenés que programarla y testearla 3 veces.
* Si un cliente reporta un bug en el checkout, el bug existe por triplicado.

En **Carrito Take-Away**, existe **UN ÚNICO MOTOR DE MENÚ** (`<PublicMenuView />`):
$$\text{Menu Data (PostgreSQL)} + \text{Theme Tokens (JSON)} = \text{Carta Digital}$$

Los productos, precios y categorías son **DATOS**.  
Los colores, radios, tipografías y disposición de tarjetas son **PRESENTACIÓN**.

---

## 2. METODOLOGÍA PARA CONVERTIR UN DISEÑO DE FIGMA EN UN PRESET

Cuando un diseñador entrega un archivo de Figma con una nueva propuesta visual para un carrito de hamburguesas o una pizzería:

```text
[Diseño Figma]
      │
      ▼ (Fase de Deconstrucción)
1. Extraer Paleta Cromática:
   - Fondo (Background)
   - Superficie / Tarjetas (Card)
   - Color de Énfasis / Botón (Primary)
   - Color del Precio (Price)
   - Borde (Border)
      │
2. Identificar Disposición de Tarjeta (Card Layout):
   - Horizontal (foto lateral compacta)
   - Vertical (foto prominente arriba)
      │
3. Extraer Radios y Espaciados:
   - Radio de esquinas: sm, md, lg, 2xl o full
      │
      ▼
Registrar en THEME_PRESETS (src/features/menu-engine/presets.ts)
```

**Resultado:** Se crea un preset reutilizable que cualquier carrito de la plataforma puede activar con 1 solo clic, sin haber tocado una sola línea de lógica de pedidos ni de base de datos.

---

## 3. INYECCIÓN DE VARIABLES CSS DINÁMICAS EN RUNTIME

¿Cómo logramos que el diseño cambie inmediatamente sin tener que recompilar la aplicación ni regenerar clases de Tailwind?

En [`src/features/menu-engine/presets.ts`](../src/features/menu-engine/presets.ts) generamos **CSS Custom Properties (Variables CSS)** que se inyectan en el elemento raíz del menú:

```typescript
export function generateCssVariables(tokens: ThemeTokens): React.CSSProperties {
  return {
    '--theme-bg': tokens.colors.background,
    '--theme-surface': tokens.colors.surface,
    '--theme-card': tokens.colors.card,
    '--theme-primary': tokens.colors.primary,
    '--theme-text': tokens.colors.text,
    '--theme-muted': tokens.colors.mutedText,
    '--theme-price': tokens.colors.price,
    '--theme-border': tokens.colors.border,
    '--theme-radius': radiusMap[tokens.cards.radius] || '1rem',
  } as React.CSSProperties;
}
```

Los componentes consumen estas variables de forma nativa:
```tsx
<div
  style={{
    backgroundColor: 'var(--theme-card)',
    borderColor: 'var(--theme-border)',
    borderRadius: 'var(--theme-radius)',
  }}
>
  <h3 style={{ color: 'var(--theme-text)' }}>{product.name}</h3>
  <span style={{ color: 'var(--theme-price)' }}>${product.price}</span>
</div>
```

---

## 4. PREVIEW MÓVIL EN TIEMPO REAL (`ThemeEditorView.tsx`)

En el panel de administración (`/admin/[tenantSlug]/theme`), el dueño o manager dispone de:
1. **Un editor táctil:** selector de presets prefabricados, selectores de color nativos HTML5 y botones de radio de esquina.
2. **Un simulador de smartphone a la derecha:**  
   No es un iframe lento ni una captura estática; es un componente React real que consume el estado reactivo `tokens` en vivo. A medida que el usuario arrastra un selector de color o cambia de layout (horizontal ➔ vertical), el teléfono virtual se actualiza al instante con **cero latencia**.
