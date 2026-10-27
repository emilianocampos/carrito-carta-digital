'use client';

import React from 'react';
import Image from 'next/image';
import {
  ShoppingBag,
  Star,
  Package,
  Eye,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { PublicProduct } from '@/features/catalog/queries';

interface ReelsProductCardProps {
  product: PublicProduct;
  categoryName?: string;
  currency: string;
  isPaused: boolean;
  currentIndex: number;
  totalCount: number;
  onSelectProduct: (product: PublicProduct) => void;
  onOpenInfo?: (product: PublicProduct) => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export function ReelsProductCard({
  product,
  categoryName,
  currency,
  isPaused,
  currentIndex,
  totalCount,
  onSelectProduct,
  onOpenInfo,
  onNext,
  onPrev,
}: ReelsProductCardProps) {
  const isCombo = Boolean(product.isCombo);
  const hasPrepTime = typeof product.preparationTimeMinutes === 'number'
    ? product.preparationTimeMinutes > 0
    : false;
  const prepTime = product.preparationTimeMinutes || 0;

  const hasDiscount =
    product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.originalPrice! - product.price) / product.originalPrice!) * 100
      )
    : 0;

  const handleCardClick = () => {
    if (onOpenInfo) {
      onOpenInfo(product);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative w-full h-full snap-start snap-always shrink-0 rounded-3xl overflow-hidden shadow-2xl bg-slate-950 flex flex-col justify-between select-none border border-white/10 cursor-pointer group animate-in fade-in zoom-in-[0.98] duration-500 ease-out fill-mode-both transition-all"
    >
      {/* 1. Fondo de la Card: Foto o Gradiente Gastronómico con zoom sutil */}
      {product.imageUrl ? (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="100vw"
            priority={currentIndex <= 2}
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          {/* Capas de gradientes estilo Reels/TikTok para máxima legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-900 via-[#1a1429] to-slate-950">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <ShoppingBag className="w-56 h-56 text-white stroke-[1]" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>
      )}

      {/* 2. Barra Superior Flotante: Categoría, Badges e Índice de Card (Entrada animada desde arriba) */}
      <div className="relative z-10 p-3.5 sm:p-4 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-3 duration-500 delay-100 fill-mode-both">
        <div className="flex flex-wrap items-center gap-1.5">
          {categoryName && (
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/25 shadow-sm">
              {categoryName}
            </span>
          )}

          {product.isFeatured && (
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm">
              <Star className="w-3 h-3 fill-slate-950" />
              <span>Destacado</span>
            </span>
          )}

          {isCombo && (
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-sm flex items-center gap-1">
              <Package className="w-3 h-3" />
              <span>Combo</span>
            </span>
          )}
        </div>

        {/* Indicador de posición (ej: 3 / 15) + Badge Tocar para Info */}
        <div className="flex items-center gap-1.5">
          <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-white/90 text-[10px] font-bold border border-white/10">
            <Info className="w-3 h-3 text-sky-400" />
            <span>Tocar para info</span>
          </span>

          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-white/90 font-mono text-[11px] font-bold border border-white/15 shrink-0">
            <span>{currentIndex}</span>
            <span className="text-white/40">/</span>
            <span className="text-white/70">{totalCount}</span>
          </div>
        </div>
      </div>

      {/* 3. Barra Lateral Derecha: Solo Badges Informativos y Flechas (Entrada animada desde derecha) */}
      <div className="absolute right-3.5 bottom-24 z-20 flex flex-col items-center gap-2.5 pointer-events-auto animate-in fade-in slide-in-from-right-3 duration-500 delay-150 fill-mode-both">
        {/* Badge Tiempo de Salida */}
        {hasPrepTime && (
          <div className="flex flex-col items-center justify-center w-10 h-10 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 text-white/90 shadow-md">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[9px] font-bold font-mono text-white/80 mt-0.5">
              ~{prepTime}m
            </span>
          </div>
        )}

        {/* Botones de navegación táctil arriba/abajo */}
        <div className="flex flex-col gap-1 pt-1 opacity-70 hover:opacity-100 transition-opacity">
          {onPrev && currentIndex > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-xs flex items-center justify-center text-white/80 hover:text-white border border-white/10 cursor-pointer"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
          {onNext && currentIndex < totalCount && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-xs flex items-center justify-center text-white/80 hover:text-white border border-white/10 cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Overlay Inferior: Nombre, Descripción y ÚNICO Botón Grande (Entrada animada desde abajo) */}
      <div className="relative z-10 p-4 sm:p-5 pt-0 space-y-2 w-full pr-14 sm:pr-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
        {/* Título y Estado */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            {!isPaused ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/90 text-white backdrop-blur-xs shadow-xs">
                <Eye className="w-3 h-3 stroke-[2.5]" />
                <span>Disponible</span>
              </span>
            ) : (
              <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-600 text-white shadow-xs">
                Agotado
              </span>
            )}

            {isCombo && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/90 text-white backdrop-blur-xs shadow-xs">
                <Sparkles className="w-3 h-3" />
                <span>Combo</span>
              </span>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white leading-tight drop-shadow-md tracking-tight line-clamp-1">
            {product.name}
          </h3>
        </div>

        {/* Descripción corta */}
        {product.description && (
          <p className="text-xs text-white/90 leading-relaxed line-clamp-2 drop-shadow-sm font-medium">
            {product.description}
          </p>
        )}

        {/* Botón Inferior Grande y Ancho "Pedir este plato" (ÚNICO BOTÓN) */}
        {!isPaused && (
          <div className="pt-1 w-full">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectProduct(product);
              }}
              style={{ backgroundColor: 'var(--theme-primary, #5865F2)' }}
              className="w-full py-2.5 sm:py-3 px-4 rounded-2xl hover:brightness-110 text-white font-black text-xs sm:text-sm flex items-center justify-between shadow-2xl shadow-black/50 active:scale-[0.98] transition-all cursor-pointer border border-white/25"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                <span>Pedir este plato</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-lg bg-black/25 font-mono font-bold text-xs sm:text-sm">
                {formatCurrency(product.price, currency)}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
