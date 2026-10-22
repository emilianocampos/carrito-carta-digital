'use client';

import React from 'react';
import Image from 'next/image';
import {
  X,
  Clock,
  Star,
  Package,
  Eye,
  ShoppingBag,
  Sparkles,
  Info,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { PublicProduct } from '@/features/catalog/queries';

interface ProductInfoModalProps {
  product: PublicProduct | null;
  categoryName?: string;
  currency: string;
  isOpen: boolean;
  onClose: () => void;
  onOrderNow?: (product: PublicProduct) => void;
}

export function ProductInfoModal({
  product,
  categoryName,
  currency,
  isOpen,
  onClose,
  onOrderNow,
}: ProductInfoModalProps) {
  if (!isOpen || !product) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      {/* Fondo clickeable para cerrar */}
      <div className="fixed inset-0 cursor-pointer" onClick={onClose} />

      {/* Contenedor del Modal */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#111827] rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Imagen Superior con Botón Cerrar */}
        <div className="relative w-full h-56 sm:h-64 bg-slate-900 overflow-hidden shrink-0">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              priority
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-900 to-slate-800 text-slate-600">
              <ShoppingBag className="w-20 h-20 opacity-30" />
            </div>
          )}

          {/* Gradiente para contraste */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40" />

          {/* Botón Cerrar (X) Flotante */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all cursor-pointer active:scale-95"
            aria-label="Cerrar detalle"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Badges Flotantes sobre la foto */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
            <div className="flex flex-wrap items-center gap-1.5">
              {categoryName && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-xs">
                  {categoryName}
                </span>
              )}

              {product.isFeatured && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-amber-400 text-slate-950 flex items-center gap-1 shadow-xs">
                  <Star className="w-3 h-3 fill-slate-950" />
                  <span>Destacado</span>
                </span>
              )}

              {isCombo && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-rose-500 text-white shadow-xs flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  <span>Combo</span>
                </span>
              )}
            </div>

            {hasPrepTime && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 text-[11px] font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>~{prepTime} min</span>
              </div>
            )}
          </div>
        </div>

        {/* Contenido de Información */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Título y Precio */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Info className="w-3 h-3 text-indigo-500" />
                <span>Información del Plato</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {product.name}
              </h2>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono block leading-none">
                {formatCurrency(product.price, currency)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-slate-400 line-through font-mono mt-0.5 block">
                  {formatCurrency(product.originalPrice!, currency)} (-{discountPercent}%)
                </span>
              )}
            </div>
          </div>

          {/* Descripción Completa */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ingredientes & Preparación
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
              {product.description ||
                'Plato elaborado en el momento con ingredientes frescos de primera calidad.'}
            </p>
          </div>

          {/* Desglose de combo si aplica */}
          {isCombo && product.comboItems && product.comboItems.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Este combo incluye:</span>
              </h3>
              <div className="grid grid-cols-1 gap-1.5">
                {product.comboItems.map((ci, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-slate-900 dark:text-white">
                      {ci.name}
                    </span>
                    <span className="font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[11px]">
                      {ci.quantity}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer con Botones */}
        <div className="p-4 sm:p-5 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          {onOrderNow && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOrderNow(product);
              }}
              style={{ backgroundColor: 'var(--theme-primary, #5865F2)' }}
              className="flex-1 py-3 px-5 rounded-2xl hover:brightness-110 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-black/10 active:scale-95 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <span>Pedir este plato</span>
              <span className="font-mono text-xs opacity-90">
                ({formatCurrency(product.price, currency)})
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
