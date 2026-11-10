import type { ThemePreset, ThemeTokens } from './types';

export const THEME_PRESETS: ThemePreset[] = [
  {
    code: 'antigravity_dark',
    name: 'Antigravity Dark (Azulado)',
    description: 'Estética nocturna inspirada en Antigravity IDE: fondo obsidiana azulado, superficies pizarra fría y botones azul cobalto eléctrico.',
    previewColor: '#1d64f2',
    tokens: {
      colors: {
        background: '#0a0d14',
        surface: '#0e131f',
        card: '#121826',
        primary: '#1d64f2',
        secondary: '#3b82f6',
        text: '#edf2f7',
        mutedText: '#8b98b1',
        price: '#60a5fa',
        border: '#212b42',
      },
      typography: {
        fontFamily: 'Inter',
        headingWeight: '800',
      },
      cards: {
        layout: 'horizontal',
        radius: 'lg',
        shadow: 'colored',
        borderWidth: '1px',
      },
    },
    layoutConfig: {
      headerStyle: 'banner_with_avatar',
      showCategoryBadges: true,
    },
  },
  {
    code: 'street_food_dark',
    name: 'Street Food Dark',
    description: 'Estilo nocturno de alto contraste, ideal para carritos de comida al paso con estética moderna.',
    previewColor: '#10b981',
    tokens: {
      colors: {
        background: '#070d12',
        surface: '#0f172a',
        card: '#0f172a',
        primary: '#10b981',
        secondary: '#059669',
        text: '#f8fafc',
        mutedText: '#94a3b8',
        price: '#34d399',
        border: '#1e293b',
      },
      typography: {
        fontFamily: 'Inter',
        headingWeight: '800',
      },
      cards: {
        layout: 'horizontal',
        radius: 'lg',
        shadow: 'sm',
        borderWidth: '1px',
      },
    },
    layoutConfig: {
      headerStyle: 'banner_with_avatar',
      showCategoryBadges: true,
    },
  },
  {
    code: 'gourmet_minimalist',
    name: 'Gourmet Minimalist',
    description: 'Estilo claro, refinado y limpio para cafeterías de especialidad, bistrós y pastelería.',
    previewColor: '#1b4332',
    tokens: {
      colors: {
        background: '#f8f8f6',
        surface: '#ffffff',
        card: '#ffffff',
        primary: '#1b4332',
        secondary: '#2d6a4f',
        text: '#111827',
        mutedText: '#6b7280',
        price: '#1b4332',
        border: '#e5e7eb',
      },
      typography: {
        fontFamily: 'Plus Jakarta Sans',
        headingWeight: '700',
      },
      cards: {
        layout: 'vertical',
        radius: 'md',
        shadow: 'sm',
        borderWidth: '1px',
      },
    },
    layoutConfig: {
      headerStyle: 'minimal_bar',
      showCategoryBadges: false,
    },
  },
  {
    code: 'vibrant_fast_food',
    name: 'Vibrant Fast Food',
    description: 'Colores cálidos audaces, tarjetas con esquinas extra redondeadas e imágenes prominentes.',
    previewColor: '#ff4d00',
    tokens: {
      colors: {
        background: '#140808',
        surface: '#1f0d0d',
        card: '#220e0e',
        primary: '#ff4d00',
        secondary: '#f97316',
        text: '#ffffff',
        mutedText: '#a38484',
        price: '#ff621f',
        border: '#3a1818',
      },
      typography: {
        fontFamily: 'Outfit',
        headingWeight: '900',
      },
      cards: {
        layout: 'horizontal',
        radius: '2xl',
        shadow: 'colored',
        borderWidth: '1px',
      },
    },
    layoutConfig: {
      headerStyle: 'centered_hero',
      showCategoryBadges: true,
    },
  },
];

export function getPresetByCode(code: string): ThemePreset {
  const found = THEME_PRESETS.find((p) => p.code === code);
  return found || THEME_PRESETS[0];
}

/**
 * Resuelve los tokens completos combinando el preset base con las personalizaciones del tenant.
 */
export function resolveThemeTokens(
  presetCode: string,
  customTokens?: Partial<ThemeTokens> | Record<string, unknown>
): ThemeTokens {
  const base = getPresetByCode(presetCode).tokens;

  if (!customTokens || Object.keys(customTokens).length === 0) {
    return base;
  }

  const custom = customTokens as Partial<ThemeTokens>;

  return {
    colors: {
      ...base.colors,
      ...(custom.colors || {}),
    },
    typography: {
      ...base.typography,
      ...(custom.typography || {}),
    },
    cards: {
      ...base.cards,
      ...(custom.cards || {}),
    },
  };
}

/**
 * Genera el mapa de variables CSS para inyectar en línea en runtime.
 */
export function generateCssVariables(tokens: ThemeTokens): React.CSSProperties {
  const radiusMap: Record<string, string> = {
    none: '0px',
    sm: '0.375rem',
    md: '0.75rem',
    lg: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  };

  return {
    '--theme-bg': tokens.colors.background,
    '--theme-surface': tokens.colors.surface,
    '--theme-card': tokens.colors.card,
    '--theme-primary': tokens.colors.primary,
    '--theme-text': tokens.colors.text,
    '--theme-muted': tokens.colors.mutedText,
    '--theme-price': tokens.colors.price,
    '--theme-border': tokens.colors.border,
    '--theme-logo-bg': tokens.colors.logoBg || '#ffffff',
    '--theme-radius': radiusMap[tokens.cards.radius] || '1rem',
    '--theme-font': tokens.typography.fontFamily,
  } as React.CSSProperties;
}
