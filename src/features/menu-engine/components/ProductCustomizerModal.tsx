'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { X, Plus, Minus, FileEdit, PlusCircle, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { PublicProduct, PublicOption } from '@/features/catalog/queries';

export interface SelectedOptionItem {
  groupId: string;
  groupName: string;
  optionId: string;
  name: string;
  extraPrice: number;
}

export interface CartItemPayload {
  product: PublicProduct;
  quantity: number;
  selectedOptions: SelectedOptionItem[];
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

interface ProductCustomizerModalProps {
  product: PublicProduct | null;
  currency: string;
  onClose: () => void;
  onAddToCart: (item: CartItemPayload) => void;
}

export function ProductCustomizerModal({
  product,
  currency,
  onClose,
  onAddToCart,
}: ProductCustomizerModalProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, PublicOption[]>>({});
  const [clarifications, setClarifications] = useState<string>('');
  const [additions, setAdditions] = useState<string>('');

  // Reiniciar estado si cambia de producto
  React.useEffect(() => {
    if (product) {
      setQuantity(1);
      setSelectedOptions({});
      setClarifications('');
      setAdditions('');
    }
  }, [product]);

  const handleToggleOption = (
    groupId: string,
    option: PublicOption,
    maxSelectable: number
  ) => {
    setSelectedOptions((prev) => {
      const currentInGroup = prev[groupId] || [];
      const isAlreadySelected = currentInGroup.some((o) => o.id === option.id);

      if (maxSelectable === 1) {
        return {
          ...prev,
          [groupId]: isAlreadySelected ? [] : [option],
        };
      }

      if (isAlreadySelected) {
        return {
          ...prev,
          [groupId]: currentInGroup.filter((o) => o.id !== option.id),
        };
      } else {
        if (currentInGroup.length >= maxSelectable) {
          return prev;
        }
        return {
          ...prev,
          [groupId]: [...currentInGroup, option],
        };
      }
    });
  };

  // Cálculo de precio unitario dinámico (ejecutado antes de cualquier return condicional)
  const unitPrice = useMemo(() => {
    if (!product) return 0;
    let price = product.price;
    Object.values(selectedOptions).forEach((options) => {
      options.forEach((opt) => {
        price += opt.extraPrice;
      });
    });
    return price;
  }, [product, selectedOptions]);

  const total = unitPrice * quantity;

  // Retorno condicional estricto después de TODOS los hooks
  if (!product) return null;

  const handleConfirmAddToCart = () => {
    // Aplanar opciones seleccionadas
    const flattenedOptions: SelectedOptionItem[] = [];
    product.optionGroups.forEach((group) => {
      const selected = selectedOptions[group.id] || [];
      selected.forEach((opt) => {
        flattenedOptions.push({
          groupId: group.id,
          groupName: group.name,
          optionId: opt.id,
          name: opt.name,
          extraPrice: opt.extraPrice,
        });
      });
    });

    // Combinar aclaraciones y adiciones
    const noteParts: string[] = [];
    if (clarifications.trim()) noteParts.push(`Detalle: ${clarifications.trim()}`);
    if (additions.trim()) noteParts.push(`Adicional: ${additions.trim()}`);
    const finalNotes = noteParts.length > 0 ? noteParts.join(' | ') : undefined;

    onAddToCart({
      product,
      quantity,
      selectedOptions: flattenedOptions,
      unitPrice,
      subtotal: total,
      notes: finalNotes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#111827] border-t sm:border border-slate-200/90 dark:border-slate-800 rounded-t-[2rem] sm:rounded-[2rem] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 transition-colors">
        {/* Foto Superior con Botón de Cerrar */}
        {product.imageUrl ? (
          <div className="relative w-full h-48 sm:h-56 bg-slate-900 shrink-0 overflow-hidden">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
            />
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer shadow-md backdrop-blur-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative w-full h-24 bg-slate-100 dark:bg-slate-800/60 flex items-center justify-end p-3 shrink-0">
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Contenido del Modal (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 no-scrollbar">
          {/* Título del Plato */}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {product.name}
            </h2>
            {product.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* Campo 1: Detalle (Aclaraciones) - Opcional */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileEdit className="w-3.5 h-3.5 text-slate-500" />
                <span>Detalle (Aclaraciones)</span>
              </label>
              <span className="text-slate-400 text-[11px] font-medium">Opcional</span>
            </div>
            <textarea
              rows={2}
              value={clarifications}
              onChange={(e) => setClarifications(e.target.value)}
              placeholder="Ej: Sin hielo, sin cebolla, punto de cocción..."
              className="w-full bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-800 transition-all resize-none shadow-2xs"
            />
          </div>

          {/* Campo 2: Adicional (Adición) - Opcional */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>Adicional (Adición)</span>
              </label>
              <span className="text-slate-400 text-[11px] font-medium">Opcional</span>
            </div>
            <textarea
              rows={2}
              value={additions}
              onChange={(e) => setAdditions(e.target.value)}
              placeholder="Ej: Con limón, extra queso cheddar, doble salsa..."
              className="w-full bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-800 transition-all resize-none shadow-2xs"
            />
          </div>

          {/* Grupos de Opciones estructuradas del catálogo si existen */}
          {product.optionGroups && product.optionGroups.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {product.optionGroups.map((group) => {
                const selectedInGroup = selectedOptions[group.id] || [];
                return (
                  <div key={group.id} className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {group.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {group.isRequired ? 'Obligatorio' : 'Opcional'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {group.options.map((opt) => {
                        const isSelected = selectedInGroup.some((o) => o.id === opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              handleToggleOption(group.id, opt, group.maxSelectable)
                            }
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-slate-900 dark:text-white shadow-2xs'
                                : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3.5 h-3.5 rounded-${
                                  group.maxSelectable === 1 ? 'full' : 'md'
                                } border flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                              <span>{opt.name}</span>
                            </div>

                            {opt.extraPrice > 0 && (
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono text-[11px]">
                                +{formatCurrency(opt.extraPrice, currency)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Fila Cantidad */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800/40">
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Cantidad
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center font-black text-sm text-slate-900 dark:text-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer con Botón Grande "Agregar al Pedido" + Precio */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#111827]">
          <button
            type="button"
            onClick={handleConfirmAddToCart}
            style={{ backgroundColor: 'var(--theme-primary, #5865F2)' }}
            className="w-full py-3.5 px-5 rounded-2xl hover:brightness-110 text-white font-black text-sm flex items-center justify-between shadow-lg shadow-black/10 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Agregar al Pedido</span>
            <span className="px-3 py-1 rounded-xl bg-black/20 font-bold font-mono text-sm">
              {formatCurrency(total, currency)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
