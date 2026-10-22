export type CardLayoutType = 'horizontal' | 'vertical' | 'minimal' | 'big_image';
export type CardRadiusType = 'none' | 'sm' | 'md' | 'lg' | '2xl' | 'full';
export type CardShadowType = 'none' | 'sm' | 'md' | 'colored';
export type FontFamilyType = 'Inter' | 'Outfit' | 'Plus Jakarta Sans' | 'Bebas Neue';

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  primary: string;
  secondary?: string;
  text: string;
  mutedText: string;
  price: string;
  border: string;
  badgeBg?: string;
  badgeText?: string;
  logoBg?: string;
}

export interface ThemeTypography {
  fontFamily: FontFamilyType;
  headingWeight: '600' | '700' | '800' | '900';
}

export interface ThemeCards {
  layout: CardLayoutType;
  radius: CardRadiusType;
  shadow: CardShadowType;
  borderWidth: '0px' | '1px' | '2px';
}

export interface ThemeTokens {
  colors: ThemeColors;
  typography: ThemeTypography;
  cards: ThemeCards;
}

export interface LayoutConfig {
  headerStyle?: 'banner_with_avatar' | 'minimal_bar' | 'centered_hero';
  showCategoryBadges?: boolean;
  mobileViewMode?: 'reels' | 'grid';
}

export interface ThemePreset {
  code: string;
  name: string;
  description: string;
  previewColor: string;
  tokens: ThemeTokens;
  layoutConfig: LayoutConfig;
}
