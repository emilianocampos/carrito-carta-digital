'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Palette,
  Check,
  Smartphone,
  Sliders,
  Sparkles,
  Loader2,
  Eye,
  Store,
  ExternalLink,
  Plus,
  ShoppingCart,
  Clock,
  UtensilsCrossed,
  Image as ImageIcon,
  Search,
  Moon,
  Sun,
} from 'lucide-react';
import { THEME_PRESETS, getPresetByCode, generateCssVariables } from '../presets';
import { saveMenuThemeAction, updateBrandingAndCardStyleAction } from '../actions';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import type { PublicMenuData } from '@/features/catalog/queries';
import type { ThemeTokens, CardLayoutType, CardRadiusType, LayoutConfig } from '../types';
import { ProductCard } from './ProductCard';

interface ThemeEditorViewProps {
  tenantId: string;
  tenantSlug: string;
  initialPresetCode: string;
  initialTokens: Partial<ThemeTokens>;
  initialLayoutConfig: LayoutConfig;
  menuData: PublicMenuData;
}

// Swatches de colores sugeridos para botones
const PRIMARY_COLOR_SWATCHES = [
  { name: 'Indigo Eléctrico', hex: '#5865F2' },
  { name: 'Esmeralda Fresco', hex: '#10b981' },
  { name: 'Naranja Street Food', hex: '#ff5722' },
  { name: 'Rojo Gourmet', hex: '#e11d48' },
  { name: 'Violeta Neón', hex: '#7c3aed' },
  { name: 'Ámbar Cálido', hex: '#f59e0b' },
  { name: 'Negro Mate', hex: '#0f172a' },
  { name: 'Azul Cyan', hex: '#06b6d4' },
];

// Swatches de fondos populares
const BACKGROUND_COLOR_SWATCHES = [
  { name: 'Noche Profunda', hex: '#090d16' },
  { name: 'Carbón Dark', hex: '#0f172a' },
  { name: 'Negro Puro', hex: '#070d12' },
  { name: 'Zinc Oscuro', hex: '#18181b' },
  { name: 'Azul Claro Soft', hex: '#f0f4fc' },
  { name: 'Blanco Puro', hex: '#ffffff' },
  { name: 'Arena Minimal', hex: '#f8f8f6' },
  { name: 'Cálido Crema', hex: '#fffbeb' },
];

export function ThemeEditorView({
  tenantId,
  tenantSlug,
  initialPresetCode,
  initialTokens,
  initialLayoutConfig,
  menuData,
}: ThemeEditorViewProps) {
  const [selectedPresetCode, setSelectedPresetCode] = useState<string>(initialPresetCode);

  const basePreset = getPresetByCode(selectedPresetCode);

  // Tokens reactivos editables
  const [tokens, setTokens] = useState<ThemeTokens>({
    colors: {
      ...basePreset.tokens.colors,
      ...(initialTokens.colors || {}),
    },
    typography: {
      ...basePreset.tokens.typography,
      ...(initialTokens.typography || {}),
    },
    cards: {
      ...basePreset.tokens.cards,
      ...(initialTokens.cards || {}),
    },
  });

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Estados de Branding & Modelo de Tarjeta
  const [businessName, setBusinessName] = useState<string>(menuData.tenant.name || '');
  const [slogan, setSlogan] = useState<string>(menuData.settings.slogan || '¡Los mejores sabores al paso!');
  const [cardStyle, setCardStyle] = useState<'con_foto' | 'sin_foto' | 'vintage'>(
    menuData.settings.cardStyle || 'con_foto'
  );
  const [mobileViewMode, setMobileViewMode] = useState<'reels' | 'grid'>(
    initialLayoutConfig?.mobileViewMode || 'reels'
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(menuData.tenant.logoUrl);
  const [bannerUrl, setBannerUrl] = useState<string | null>(menuData.tenant.bannerUrl);

  // Cambiar Preset Base
  const handleSelectPreset = (code: string) => {
    setSelectedPresetCode(code);
    const newPreset = getPresetByCode(code);
    setTokens(newPreset.tokens);
  };

  // Actualizar Color
  const handleColorChange = (key: keyof ThemeTokens['colors'], value: string) => {
    setTokens((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [key]: value,
      },
    }));
  };

  // Actualizar Layout de Tarjetas
  const handleLayoutChange = (layout: CardLayoutType) => {
    setTokens((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        layout,
      },
    }));
  };

  // Actualizar Radio de Bordes
  const handleRadiusChange = (radius: CardRadiusType) => {
    setTokens((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        radius,
      },
    }));
  };

  // Guardar en Base de Datos (Tema + Branding + Modelo de Tarjeta + Vista Móvil)
  const handleSaveTheme = () => {
    setErrorMessage(null);
    setSaveSuccess(false);

    startTransition(async () => {
      const [themeRes, brandingRes] = await Promise.all([
        saveMenuThemeAction(
          tenantId,
          selectedPresetCode,
          tokens,
          {
            ...initialLayoutConfig,
            mobileViewMode,
          }
        ),
        updateBrandingAndCardStyleAction(tenantId, {
          slogan,
          cardStyle,
          logoUrl,
          bannerUrl,
          name: businessName,
        }),
      ]);

      if (!themeRes.success) {
        setErrorMessage(themeRes.error);
      } else if (!brandingRes.success) {
        setErrorMessage(brandingRes.error);
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      }
    });
  };

  // Inyección de variables CSS para la preview
  const cssVars = generateCssVariables(tokens);

  // Muestra de productos para la preview
  const sampleProducts = menuData.categories.flatMap((c) => c.products).slice(0, 3);
  const brandInitial = businessName ? businessName.charAt(0).toUpperCase() : 'C';

  return (
    <div className="min-h-screen bg-[#f0f4fc] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 pb-32 max-w-7xl mx-auto w-full antialiased space-y-7 selection:bg-[#5865F2] selection:text-white transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-[#5865F2]/10 dark:bg-[#5865F2]/20 text-[#5865F2] dark:text-indigo-400 border border-[#5865F2]/20 dark:border-[#5865F2]/30">
              Personalización de Carta
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Palette className="w-7 h-7 text-[#5865F2]" />
            <span>Personalización Visual & Marca</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Configurá la foto del banner, logo del local, colores de botones y el estilo de tu carta digital.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href={`/c/${tenantSlug}`}
            target="_blank"
            className="py-2.5 px-4 rounded-2xl bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs tracking-wide shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            title="Ver cómo queda tu carta pública en vivo"
          >
            <span>Ver Carta Pública</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <button
            type="button"
            disabled={isPending}
            onClick={handleSaveTheme}
            className="py-2.5 px-5 rounded-2xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs tracking-wide shadow-md shadow-[#5865F2]/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>¡Cambios Guardados!</span>
              </>
            ) : (
              <span>Guardar Personalización</span>
            )}
          </button>
        </div>
      </div>

      {/* Switcher Móvil: Editor vs Preview */}
      <div className="md:hidden grid grid-cols-2 gap-1 p-1 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('editor')}
          className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'editor'
              ? 'bg-[#5865F2] text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Editor de Estilos</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'preview'
              ? 'bg-[#5865F2] text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Vista Previa en Vivo</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold shadow-sm">
          {errorMessage}
        </div>
      )}

      {/* Grid de 2 Columnas (Editor en la izq / Preview fija en la der) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* PANEL DE CONFIGURACIÓN (6 columnas en desktop) */}
        <div
          className={`md:col-span-6 space-y-6 ${
            activeTab === 'preview' ? 'hidden md:block' : 'block'
          }`}
        >
          {/* SECCIÓN 1: FOTO DEL BANNER, FOTO DEL LOCAL & MARCA */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none space-y-5 transition-all">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  1. Portada & Fotos del Local
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Subí el banner de portada y la foto/logo del comercio directamente desde tu dispositivo
                </p>
              </div>
            </div>

            {/* Inputs de Nombre y Slogan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nombre del Local
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ej: Faron Food Truck"
                  className="w-full bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#5865F2] focus:bg-white dark:focus:bg-slate-800 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Slogan o Frase de Bienvenida
                </label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  placeholder="Ej: ¡Los mejores sabores al paso!"
                  className="w-full bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#5865F2] focus:bg-white dark:focus:bg-slate-800 transition-colors"
                />
              </div>
            </div>

            {/* Subida de Banner y Logo */}
            <div className="space-y-4 pt-2">
              {/* Foto de Banner Hero */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Foto de Portada / Banner Hero (Panorámica)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Recomendado: 1200 x 450 px</span>
                </div>
                <ImageUploadDropzone
                  tenantId={tenantId}
                  folder="branding"
                  label="Arrastrá o hacé clic para subir el Banner de Portada"
                  value={bannerUrl}
                  onChange={(url) => setBannerUrl(url)}
                  aspectRatio="banner"
                />
              </div>

              {/* Foto / Logo del Local */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Foto del Local o Logo Circular</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Recomendado: Cuadrada 500 x 500 px (PNG transparente o JPG)</span>
                </div>
                <div className="max-w-xs">
                  <ImageUploadDropzone
                    tenantId={tenantId}
                    folder="branding"
                    label="Subir Foto de Perfil o Logo del Local"
                    value={logoUrl}
                    onChange={(url) => setLogoUrl(url)}
                    aspectRatio="square"
                  />
                </div>

                {/* Selector de Color de Fondo del Círculo para Logos PNG */}
                {logoUrl && (
                  <div className="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-[#5865F2]" />
                          <span>Fondo del Círculo del Logo</span>
                        </label>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Elegí el color de fondo para el círculo (ideal para logos PNG con transparencia)
                        </p>
                      </div>

                      {/* Mini Preview del círculo con el logo */}
                      <div
                        style={{ backgroundColor: tokens.colors.logoBg || '#ffffff' }}
                        className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-700 shadow-md flex items-center justify-center relative overflow-hidden shrink-0"
                      >
                        <Image
                          src={logoUrl}
                          alt="Logo preview"
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                    </div>

                    {/* Presets de Color */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {[
                        { label: 'Blanco', value: '#ffffff' },
                        { label: 'Negro', value: '#0f172a' },
                        { label: 'Color Marca', value: tokens.colors.primary },
                        { label: 'Arena / Crema', value: '#faf7f2' },
                        { label: 'Gris Claro', value: '#f1f5f9' },
                        { label: 'Transparente', value: 'transparent' },
                      ].map((opt) => {
                        const isSelected = (tokens.colors.logoBg || '#ffffff') === opt.value;
                        return (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => handleColorChange('logoBg', opt.value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                              isSelected
                                ? 'border-[#5865F2] bg-[#5865F2]/10 text-[#5865F2] ring-1 ring-[#5865F2]'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                              style={{
                                backgroundColor:
                                  opt.value === 'transparent' ? '#ffffff' : opt.value,
                              }}
                            />
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}

                      {/* Selector personalizado */}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <input
                          type="color"
                          value={
                            tokens.colors.logoBg && tokens.colors.logoBg !== 'transparent'
                              ? tokens.colors.logoBg
                              : '#ffffff'
                          }
                          onChange={(e) => handleColorChange('logoBg', e.target.value)}
                          className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer p-0.5 bg-transparent"
                          title="Elegir color personalizado"
                        />
                        <input
                          type="text"
                          value={tokens.colors.logoBg || '#ffffff'}
                          onChange={(e) => handleColorChange('logoBg', e.target.value)}
                          className="w-20 px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: COLORES PRINCIPALES & BOTONES */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none space-y-5 transition-all">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-[#5865F2] flex items-center justify-center">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  2. Colores Principales & Botones
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Elegí el color de acento de tus botones principales, fondo y precios de la carta
                </p>
              </div>
            </div>

            {/* COLOR PRINCIPAL / BOTONES DESTACADO */}
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-black text-slate-900 dark:text-white block">
                    Color de Botones Principales (&quot;Ver Carrito&quot;, &quot;+ Agregar&quot;)
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Aplica directamente a todos los botones interactivos de tu carta
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    style={{ backgroundColor: tokens.colors.primary }}
                    className="w-6 h-6 rounded-lg shadow-sm border border-white/20 shrink-0"
                  />
                  <input
                    type="color"
                    value={tokens.colors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                    title="Elegir color personalizado"
                  />
                  <input
                    type="text"
                    value={tokens.colors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="w-20 px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase"
                  />
                </div>
              </div>

              {/* Swatches Rápidos */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                  Colores Populares Gastronómicos
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRIMARY_COLOR_SWATCHES.map((swatch) => {
                    const isSelected = tokens.colors.primary.toLowerCase() === swatch.hex.toLowerCase();
                    return (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => handleColorChange('primary', swatch.hex)}
                        className={`group px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white dark:bg-slate-800 border-[#5865F2] ring-2 ring-[#5865F2]/20 shadow-sm'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span
                          style={{ backgroundColor: swatch.hex }}
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                        />
                        <span className="text-slate-700 dark:text-slate-200 text-[11px]">{swatch.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-[#5865F2] stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botón Preview en Vivo del Color */}
              <div className="pt-2 flex items-center gap-3">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Previsualización de tus botones:
                </span>
                <div className="flex items-center gap-2">
                  <div
                    style={{ backgroundColor: tokens.colors.primary }}
                    className="px-3 py-1.5 rounded-xl text-white font-bold text-xs shadow-sm flex items-center gap-1"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    <span>Ver Carrito</span>
                  </div>
                  <div
                    style={{ backgroundColor: tokens.colors.primary }}
                    className="px-3 py-1.5 rounded-xl text-white font-bold text-xs shadow-sm flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar</span>
                  </div>
                </div>
              </div>
            </div>

            {/* COLOR DE FONDO, TARJETAS Y PRECIOS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              {/* Fondo de la Carta */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                  Fondo de la Carta
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tokens.colors.background}
                    onChange={(e) => handleColorChange('background', e.target.value)}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={tokens.colors.background}
                    onChange={(e) => handleColorChange('background', e.target.value)}
                    className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase"
                  />
                </div>
              </div>

              {/* Color de Tarjetas */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                  Color de Tarjetas
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tokens.colors.card}
                    onChange={(e) => handleColorChange('card', e.target.value)}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={tokens.colors.card}
                    onChange={(e) => handleColorChange('card', e.target.value)}
                    className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase"
                  />
                </div>
              </div>

              {/* Color de Precios */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                  Color de Precios
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tokens.colors.price}
                    onChange={(e) => handleColorChange('price', e.target.value)}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={tokens.colors.price}
                    onChange={(e) => handleColorChange('price', e.target.value)}
                    className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: PRESETS & MODELOS DE TARJETA */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none space-y-5 transition-all">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  3. Disposición & Estilo de Tarjetas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Elegí cómo se estructuran las tarjetas de los platos en la carta
                </p>
              </div>
            </div>

            {/* Tipo de Tarjeta */}
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Estilo Visual de los Platos
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setCardStyle('con_foto')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                    cardStyle === 'con_foto'
                      ? 'bg-white dark:bg-[#1e293b] border-[#5865F2] text-slate-900 dark:text-white shadow-md ring-2 ring-[#5865F2]/20'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-black block text-slate-900 dark:text-white">📸 Con Foto Hero</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight block">
                    Foto en primer plano, título a la izq y precio a la der
                  </span>
                  {cardStyle === 'con_foto' && (
                    <span className="text-[10px] text-[#5865F2] font-black flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> Seleccionado
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setCardStyle('sin_foto')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                    cardStyle === 'sin_foto'
                      ? 'bg-white dark:bg-[#1e293b] border-[#5865F2] text-slate-900 dark:text-white shadow-md ring-2 ring-[#5865F2]/20'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-black block text-slate-900 dark:text-white">📄 Sin Foto (Compacto)</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight block">
                    Estilo cafetería o bar de vinos, ultra ágil y elegante
                  </span>
                  {cardStyle === 'sin_foto' && (
                    <span className="text-[10px] text-[#5865F2] font-black flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> Seleccionado
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setCardStyle('vintage')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                    cardStyle === 'vintage'
                      ? 'bg-white dark:bg-[#1e293b] border-[#5865F2] text-slate-900 dark:text-white shadow-md ring-2 ring-[#5865F2]/20'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-black block text-slate-900 dark:text-white">☕ Bistro / Vintage</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight block">
                    Bordes artesanales, calidez gastronómica
                  </span>
                  {cardStyle === 'vintage' && (
                    <span className="text-[10px] text-[#5865F2] font-black flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> Seleccionado
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Modo de Visualización Móvil (Reels vs Grilla) */}
            <div className="space-y-2.5 pt-2">
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Experiencia en Celulares
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Formato predeterminado de la carta cuando tus clientes escaneen el QR en la plaza
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMobileViewMode('reels')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                    mobileViewMode === 'reels'
                      ? 'bg-white dark:bg-[#1e293b] border-[#5865F2] text-slate-900 dark:text-white shadow-md ring-2 ring-[#5865F2]/20'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎬</span>
                    <span className="text-xs font-black block text-slate-900 dark:text-white">
                      Modo Reels / TikTok
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight block">
                    Swipe vertical pantalla completa, visual y envolvente. Ideal para captar clientes en la plaza.
                  </span>
                  {mobileViewMode === 'reels' && (
                    <span className="text-[10px] text-[#5865F2] font-black flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> Activo en celulares
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setMobileViewMode('grid')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                    mobileViewMode === 'grid'
                      ? 'bg-white dark:bg-[#1e293b] border-[#5865F2] text-slate-900 dark:text-white shadow-md ring-2 ring-[#5865F2]/20'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">⊞</span>
                    <span className="text-xs font-black block text-slate-900 dark:text-white">
                      Modo Grilla / Lista
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight block">
                    Formato clásico corrido con scroll vertical rápido, ideal para cartas extensas o clientes apurados.
                  </span>
                  {mobileViewMode === 'grid' && (
                    <span className="text-[10px] text-[#5865F2] font-black flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> Activo en celulares
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Radio de Esquinas */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Redondeo de Esquinas
              </span>
              <div className="grid grid-cols-4 gap-2.5">
                {(['none', 'md', 'lg', '2xl'] as CardRadiusType[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRadiusChange(r)}
                    className={`py-2 rounded-xl border text-xs font-bold uppercase transition-all cursor-pointer ${
                      tokens.cards.radius === r
                        ? 'bg-[#5865F2] border-[#5865F2] text-white shadow-sm font-black'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {r === 'none' ? 'Recto' : r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PANEL DE VISTA PREVIA MÓVIL (6 columnas en desktop) */}
        <div
          className={`md:col-span-6 flex flex-col items-center justify-start ${
            activeTab === 'editor' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="sticky top-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#5865F2]" />
                <span>Vista Previa en Vivo</span>
              </span>
              <span
                style={{ backgroundColor: tokens.colors.primary }}
                className="text-[10px] text-white font-bold uppercase px-2.5 py-0.5 rounded-full shadow-xs"
              >
                Color Botones
              </span>
            </div>

            {/* Marco de Teléfono */}
            <div
              style={{
                ...cssVars,
              }}
              className="w-full rounded-[2.75rem] border-[7px] border-slate-900 dark:border-slate-800 overflow-hidden shadow-2xl space-y-0 max-h-[82vh] overflow-y-auto no-scrollbar bg-[#f0f4fc] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-all"
            >
              {/* Dynamic Island / Notch superior */}
              <div className="w-full bg-white dark:bg-[#111827] pt-2 pb-1 flex justify-center items-center shrink-0">
                <div className="w-20 h-3.5 bg-slate-950 rounded-full flex items-center justify-end pr-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                </div>
              </div>

              {/* Mini Navbar Superior de la Carta */}
              <div className="sticky top-0 z-20 w-full bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md px-3 sm:px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2 truncate min-w-0">
                  {logoUrl ? (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0 relative">
                      <Image
                        src={logoUrl}
                        alt="Logo"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-black text-xs shrink-0 overflow-hidden relative shadow-xs">
                      <span>{brandInitial}</span>
                    </div>
                  )}
                  <div className="truncate">
                    <h5 className="font-black text-xs text-slate-900 dark:text-white truncate leading-tight">
                      {businessName || 'Tu Local'}
                    </h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate leading-tight">
                      {slogan || 'Delivery & Restaurante'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    <Moon className="w-3 h-3" />
                  </div>
                  <div
                    style={{ backgroundColor: tokens.colors.primary }}
                    className="px-2.5 py-1 rounded-xl text-white font-bold text-[10px] flex items-center gap-1 shadow-xs shrink-0"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    <span className="hidden xs:inline">Ver Carrito</span>
                  </div>
                </div>
              </div>

              {/* Portada Hero con Banner y Logo Centrado */}
              <div className="relative w-full h-36 bg-slate-950 dark:bg-[#090d16] flex flex-col items-center justify-center text-center p-3 overflow-hidden">
                {bannerUrl && (
                  <>
                    <Image
                      src={bannerUrl}
                      alt="Banner de portada"
                      fill
                      priority
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/45" />
                  </>
                )}

                <div className="relative z-10 flex flex-col items-center space-y-1 text-white">
                  {/* Avatar Circular con borde blanco */}
                  <div
                    style={{ backgroundColor: tokens.colors.logoBg || '#ffffff' }}
                    className="w-13 h-13 rounded-full border-[2.5px] border-white/90 dark:border-slate-700 overflow-hidden shadow-xl relative flex items-center justify-center p-1"
                  >
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt="Logo circular"
                        fill
                        className="object-contain p-0.5"
                      />
                    ) : (
                      <div
                        style={{ backgroundColor: tokens.colors.primary }}
                        className="w-full h-full flex items-center justify-center text-xl font-black text-white"
                      >
                        {brandInitial}
                      </div>
                    )}
                  </div>

                  <h4 className="text-sm font-black text-white tracking-tight leading-tight">
                    {businessName || 'Nombre de tu Local'}
                  </h4>

                  <p className="text-[10px] text-slate-200/90 font-medium max-w-[240px] truncate leading-tight">
                    &ldquo;{slogan || '¡Los mejores sabores al paso!'}&rdquo;
                  </p>

                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-amber-300 text-[9px] font-semibold">
                    <Clock className="w-2.5 h-2.5" />
                    <span>Listo en ~5 min</span>
                  </div>
                </div>
              </div>

              {/* Sección "Nuestro Menú" y buscador */}
              <div className="p-3 bg-[#f0f4fc] dark:bg-[#090d16] space-y-2.5">
                <div className="flex items-center justify-between gap-1.5">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                    Nuestro Menú
                  </h4>
                </div>

                {/* Buscador visual */}
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <div className="w-full pl-7 pr-2.5 py-1.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 flex items-center">
                    Buscar en el menú...
                  </div>
                </div>

                {/* Píldoras de Categorías reales de la tienda */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                  <div
                    style={{ backgroundColor: tokens.colors.primary }}
                    className="px-2.5 py-1 rounded-xl text-white font-bold text-[10px] shrink-0 shadow-xs flex items-center gap-1"
                  >
                    <span>Todo</span>
                    <span className="text-[9px] opacity-90 font-mono bg-black/20 px-1.5 py-0.2 rounded-full">
                      {menuData.categories.reduce((acc, c) => acc + c.products.length, 0)}
                    </span>
                  </div>
                  {menuData.categories.map((cat, i) => (
                    <div
                      key={cat.id || i}
                      className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 font-bold text-[10px] shrink-0 border border-slate-200 dark:border-slate-800 flex items-center gap-1 shadow-xs"
                    >
                      <span>{cat.name}</span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-full">
                        {cat.products.length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lista de Productos simulada con fondo idéntico al comercio */}
              <div className="p-3 space-y-3 bg-[#f0f4fc] dark:bg-[#090d16]">
                {menuData.categories.filter((c) => c.products.length > 0).length > 0 ? (
                  menuData.categories
                    .filter((c) => c.products.length > 0)
                    .slice(0, 2)
                    .map((cat) => (
                      <div key={cat.id} className="space-y-2">
                        {cardStyle === 'vintage' && (
                          <div className="border-2 border-[#ff4d00] dark:border-[#ff621f] rounded-2xl px-4 py-1.5 inline-flex items-center gap-2 mb-1 shadow-xs bg-white dark:bg-[#111827]">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d00] shrink-0" />
                            <span className="text-[#ff4d00] dark:text-[#ff621f] font-black text-[11px] uppercase tracking-wider">
                              {cat.name}
                            </span>
                          </div>
                        )}
                        <div className={cardStyle === 'vintage' ? 'bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden' : 'space-y-2'}>
                          {cat.products.slice(0, 2).map((p) => (
                            <ProductCard
                              key={p.id}
                              product={p}
                              categoryName={cat.name}
                              currency={menuData.settings.currency}
                              isPaused={false}
                              layout={tokens.cards.layout}
                              cardStyle={cardStyle}
                              onSelectProduct={() => {}}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className={cardStyle === 'vintage' ? 'bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden' : 'space-y-2.5'}>
                    {sampleProducts.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        categoryName="Especialidades"
                        currency={menuData.settings.currency}
                        isPaused={false}
                        layout={tokens.cards.layout}
                        cardStyle={cardStyle}
                        onSelectProduct={() => {}}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
