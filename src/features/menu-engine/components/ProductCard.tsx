'use client';

import React from 'react';
import Image from 'next/image';
import { ShoppingBag, Star, Package, Clock, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { PublicProduct } from '@/features/catalog/queries';
import type { CardLayoutType } from '../types';

interface ProductCardProps {
  product: PublicProduct;
  categoryName?: string;
  currency: string;
  isPaused: boolean;
  layout?: CardLayoutType;
  cardStyle?: 'con_foto' | 'sin_foto' | 'vintage';
  onSelectProduct: (product: PublicProduct) => void;
  onOpenInfo?: (product: PublicProduct) => void;
}

export function ProductCard({
  product,
  categoryName,
  currency,
  isPaused,
  cardStyle = 'con_foto',
  onSelectProduct,
  onOpenInfo,
}: ProductCardProps) {
  const isCombo = Boolean(product.isCombo);
  const hasPrepTime = typeof product.preparationTimeMinutes === 'number'
    ? product.preparationTimeMinutes > 0
    : false;
  const prepTime = product.preparationTimeMinutes || 0;

  const hasDiscount =
    product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  // =========================================================================
  // 1. ESTILO VINTAGE (Idéntico a Imagen 1)
  // Lista de platos tipo carta gastronómica impresa: Nombre mayúscula a la izq, precio a la der.
  // =========================================================================
  if (cardStyle === 'vintage') {
    return (
      <div
        onClick={() => !isPaused && (onOpenInfo ? onOpenInfo(product) : onSelectProduct(product))}
        className={`group w-full py-2.5 px-3 border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4 cursor-pointer ${
          isPaused ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-wide group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
              {product.name}
            </span>
            {isCombo && (
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                Combo
              </span>
            )}
            {product.isFeatured && (
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400">
                Top
              </span>
            )}
          </div>
          {product.description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white font-mono whitespace-nowrap">
            {formatCurrency(product.price, currency)}
          </span>
          {!isPaused && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectProduct(product);
              }}
              className="py-1 px-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95"
            >
              Pedir
            </button>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. ESTILO SIN FOTO (Idéntico a Imagen 2)
  // Tarjeta compacta: Título en color de marca a la izq + precio der;
  // Fila inferior con tag de categoría y botón [🛍 Pedir]
  // =========================================================================
  if (cardStyle === 'sin_foto') {
    return (
      <div
        onClick={() => !isPaused && onOpenInfo?.(product)}
        style={{ borderRadius: 'var(--theme-radius, 4px)' }}
        className={`group relative w-full bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:shadow-sm cursor-pointer ${
          isPaused ? 'opacity-60' : ''
        }`}
      >
        {/* Fila Superior: Título a la Izquierda en color primario/vino + Precio a la Derecha */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <h3
              style={{ color: 'var(--theme-primary, #6b112c)' }}
              className="font-bold text-sm sm:text-base leading-snug tracking-tight line-clamp-2"
            >
              {product.name}
            </h3>
            {product.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          <div className="text-right shrink-0">
            <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white font-mono whitespace-nowrap">
              {formatCurrency(product.price, currency)}
            </span>
            {hasDiscount && (
              <span className="block text-[10px] text-slate-400 line-through font-mono mt-0.5">
                {formatCurrency(product.originalPrice!, currency)}
              </span>
            )}
          </div>
        </div>

        {/* Fila Inferior: Categoría a la Izq + Botón Pedir a la Der */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-auto">
          <div>
            {categoryName ? (
              <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                {categoryName}
              </span>
            ) : hasPrepTime ? (
              <span className="text-[11px] text-slate-400">~{prepTime} min</span>
            ) : null}
          </div>

          {!isPaused && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectProduct(product);
              }}
              style={{ backgroundColor: 'var(--theme-primary, #6b112c)' }}
              className="py-1.5 px-4 rounded-full hover:brightness-110 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Pedir</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. ESTILO PREDETERMINADO: CON FOTO HERO (Estilo Antigravity Dark Azulado)
  // =========================================================================
  return (
    <div
      onClick={() => !isPaused && onOpenInfo?.(product)}
      style={{ borderRadius: 'var(--theme-radius, 1rem)' }}
      className={`group relative w-full bg-white dark:bg-[#121826] border border-slate-200/80 dark:border-[#212b42] hover:border-slate-300 dark:hover:border-[#3b82f6]/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md dark:shadow-[0_6px_24px_rgba(0,0,0,0.45)] transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer ${
        isPaused ? 'opacity-60' : ''
      }`}
    >
      <div>
        {/* Foto Superior con Badges */}
        {product.imageUrl ? (
          <div className="relative w-full h-44 sm:h-52 bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Badges Flotantes a la Izquierda (Categoría + Destacado / Combo) */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
              {categoryName && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-white/95 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 shadow-sm backdrop-blur-xs">
                  {categoryName}
                </span>
              )}
              {product.isFeatured && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm">
                  <Star className="w-3 h-3 fill-slate-950" />
                  <span>Destacado</span>
                </span>
              )}
              {isCombo && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-rose-500 text-white shadow-sm flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  <span>Combo</span>
                </span>
              )}
            </div>

            {/* Badge de Disponibilidad a la Derecha */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
              {!isPaused ? (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-emerald-500 text-white shadow-sm flex items-center gap-1 backdrop-blur-xs">
                  <Eye className="w-3 h-3 stroke-[2.5]" />
                  <span>Disponible</span>
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-rose-600 text-white shadow-sm">
                  Agotado
                </span>
              )}
              {hasDiscount && (
                <span className="text-[10px] font-black px-2 py-1 rounded bg-amber-500 text-white shadow-sm">
                  {discountPercent}% OFF
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="relative w-full h-32 bg-[#f4f5f8] dark:bg-slate-800/50 flex items-center justify-center p-3">
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
              {categoryName && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-xs border border-slate-200/80 dark:border-slate-700">
                  {categoryName}
                </span>
              )}
              {product.isFeatured && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm">
                  <Star className="w-3 h-3 fill-slate-950" />
                  <span>Destacado</span>
                </span>
              )}
            </div>
            <div className="absolute top-3 right-3 z-10">
              {!isPaused ? (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                  <Eye className="w-3 h-3 stroke-[2.5]" />
                  <span>Disponible</span>
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-rose-600 text-white shadow-sm">
                  Agotado
                </span>
              )}
            </div>
          </div>
        )}

        {/* Bloque de Información: Título, Precio y Descripción */}
        <div className="p-4 sm:p-5 space-y-2">
          {/* Fila Título + Precio */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-snug line-clamp-1 tracking-tight">
              {product.name}
            </h3>

            <div className="text-right shrink-0">
              <span className="font-black text-base sm:text-lg text-slate-900 dark:text-white whitespace-nowrap font-mono leading-none">
                {formatCurrency(product.price, currency)}
              </span>
              {hasDiscount && (
                <span className="block text-[10px] text-slate-400 line-through font-mono mt-0.5">
                  {formatCurrency(product.originalPrice!, currency)}
                </span>
              )}
            </div>
          </div>

          {/* DESCRIPCIÓN DEL PLATO */}
          {product.description && (
            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Ítems del combo si aplica */}
          {isCombo && product.comboItems && product.comboItems.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {product.comboItems.map((ci, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60"
                >
                  {ci.quantity}x {ci.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fila Inferior: Tiempo de Salida + Botón Pedir */}
      <div className="p-4 sm:p-5 pt-0 flex items-center justify-between gap-2 mt-auto">
        {hasPrepTime ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-amber-200/90 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Sale en ~{prepTime} min</span>
          </div>
        ) : (
          <div />
        )}

        {!isPaused && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectProduct(product);
            }}
            style={{ backgroundColor: 'var(--theme-primary, #1d64f2)' }}
            className="py-1.5 px-4 rounded-full hover:brightness-110 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm shadow-[#1d64f2]/25 active:scale-95 shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Pedir</span>
          </button>
        )}
      </div>
    </div>
  );
}
