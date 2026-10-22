'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  Package,
  Plus,
  Minus,
  Trash2,
  Search,
  GripVertical,
  Percent,
  Sparkles,
  Loader2,
  Utensils,
} from 'lucide-react';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import { formatCurrency } from '@/lib/utils';
import type { AdminProduct, AdminCategory, AdminCombo } from '../queries';
import type { ComboInput, ComboItemInput } from '../schemas';

interface AdminComboModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ComboInput) => Promise<void>;
  editingCombo: AdminCombo | null;
  categories: AdminCategory[];
  products: AdminProduct[];
  currency: string;
  tenantId: string;
  isPending: boolean;
}

export function AdminComboModal({
  isOpen,
  onClose,
  onSave,
  editingCombo,
  categories,
  products,
  currency,
  tenantId,
  isPending,
}: AdminComboModalProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [originalPrice, setOriginalPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prepTime, setPrepTime] = useState<number>(15);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [selectedItems, setSelectedItems] = useState<ComboItemInput[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [isDropTargetActive, setIsDropTargetActive] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Inicializar estado cuando se abre o cambia el combo en edición
  useEffect(() => {
    if (editingCombo) {
      setName(editingCombo.name);
      setCategoryId(editingCombo.categoryId);
      setPrice(editingCombo.price);
      setOriginalPrice(editingCombo.originalPrice ?? '');
      setDescription(editingCombo.description || '');
      setImageUrl(editingCombo.imageUrl || null);
      setPrepTime(editingCombo.preparationTimeMinutes);
      setIsAvailable(editingCombo.isAvailable);
      setIsFeatured(editingCombo.isFeatured);
      setSelectedItems(
        editingCombo.items.map((it, idx) => ({
          productId: it.productId,
          quantity: it.quantity,
          sortOrder: it.sortOrder ?? idx,
        }))
      );
    } else {
      setName('');
      setCategoryId(categories[0]?.id || '');
      setPrice('');
      setOriginalPrice('');
      setDescription('');
      setImageUrl(null);
      setPrepTime(15);
      setIsAvailable(true);
      setIsFeatured(false);
      setSelectedItems([]);
    }
    setFormError(null);
  }, [editingCombo, categories, isOpen]);

  if (!isOpen) return null;

  // Mapa de productos para consulta rápida de datos (nombre, precio, foto)
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Cálculo del precio regular si compraran los ítems por separado
  const regularCalculatedTotal = selectedItems.reduce((acc, item) => {
    const prod = productMap.get(item.productId);
    return acc + (prod ? prod.price * item.quantity : 0);
  }, 0);

  // Ahorro y porcentaje de descuento estimado
  const numericPrice = typeof price === 'number' ? price : 0;
  const referencePrice =
    typeof originalPrice === 'number' && originalPrice > 0
      ? originalPrice
      : regularCalculatedTotal;

  const savings = referencePrice > numericPrice ? referencePrice - numericPrice : 0;
  const discountPercent =
    referencePrice > 0 && savings > 0
      ? Math.round((savings / referencePrice) * 100)
      : 0;

  // Filtrado de productos disponibles para agregar
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Agregar producto al combo
  const handleAddProduct = (productId: string) => {
    setSelectedItems((prev) => {
      const existing = prev.find((it) => it.productId === productId);
      if (existing) {
        return prev.map((it) =>
          it.productId === productId ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [...prev, { productId, quantity: 1, sortOrder: prev.length }];
    });
  };

  // Modificar cantidad
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((it) => {
          if (it.productId === productId) {
            const newQty = it.quantity + delta;
            return newQty > 0 ? { ...it, quantity: newQty } : null;
          }
          return it;
        })
        .filter((it): it is ComboItemInput => it !== null)
    );
  };

  // Eliminar producto del combo
  const handleRemoveProduct = (productId: string) => {
    setSelectedItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  // Drag and drop handlers
  const handleDragStartProduct = (e: React.DragEvent, productId: string) => {
    e.dataTransfer.setData('text/plain', productId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDropOnZone = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropTargetActive(false);
    const productId = e.dataTransfer.getData('text/plain');
    if (productId && productMap.has(productId)) {
      handleAddProduct(productId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('El nombre del combo es obligatorio.');
      return;
    }
    if (!categoryId) {
      setFormError('Debes seleccionar una categoría.');
      return;
    }
    if (price === '' || Number(price) < 0) {
      setFormError('El precio del combo debe ser válido.');
      return;
    }
    if (selectedItems.length === 0) {
      setFormError('Debes incluir al menos un producto en el combo.');
      return;
    }

    const payload: ComboInput = {
      name: name.trim(),
      categoryId,
      price: Number(price),
      originalPrice:
        originalPrice !== '' && Number(originalPrice) > 0
          ? Number(originalPrice)
          : regularCalculatedTotal > 0
          ? regularCalculatedTotal
          : undefined,
      description: description.trim() || undefined,
      imageUrl: imageUrl || undefined,
      preparationTimeMinutes: prepTime,
      isAvailable,
      isFeatured,
      sortOrder: editingCombo?.sortOrder ?? 0,
      items: selectedItems,
    };

    await onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl my-6 max-h-[92vh] overflow-y-auto text-slate-800 dark:text-slate-100">
        {/* Header del Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-center justify-center text-[#5865F2]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{editingCombo ? 'Editar Combo / Promo' : 'Armar Nuevo Combo'}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/20">
                  Drag & Drop
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Agrupá productos para venderlos con precio promocional irresistible
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {formError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. DATOS PRINCIPALES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nombre del Combo *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Promo Dúo Smash + Papas + Bebidas"
                className="w-full bg-slate-50/50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#5865F2] focus:bg-white dark:focus:bg-slate-800 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Categoría en la Carta *</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                aria-label="Seleccionar categoría"
                className="w-full bg-slate-50/50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#5865F2] focus:bg-white dark:focus:bg-slate-800 transition-colors"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="dark:bg-slate-800">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. PRECIOS Y DESCUENTO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5865F2] dark:text-[#818cf8]">
                Precio de Oferta del Combo ({currency}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) =>
                  setPrice(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="Ej: 11900"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-[#5865F2]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Precio Regular Tachado
                </label>
                {regularCalculatedTotal > 0 && (
                  <button
                    type="button"
                    onClick={() => setOriginalPrice(regularCalculatedTotal)}
                    className="text-[10px] text-[#5865F2] dark:text-[#818cf8] font-semibold hover:underline"
                  >
                    Usar calculado ({formatCurrency(regularCalculatedTotal, currency)})
                  </button>
                )}
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={originalPrice}
                onChange={(e) =>
                  setOriginalPrice(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder={
                  regularCalculatedTotal > 0
                    ? `Calculado: ${regularCalculatedTotal}`
                    : 'Ej: 14500'
                }
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#5865F2]"
              />
            </div>

            <div className="flex flex-col justify-center bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                Ahorro para el Cliente
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {formatCurrency(savings, currency)}
                </span>
                {discountPercent > 0 && (
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                    -{discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3. CONSTRUCTOR VISUAL DRAG & DROP DE PRODUCTOS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#5865F2]" />
                  <span>Constructor de Combo: Productos Incluidos</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Arrastrá platos desde la izquierda hacia la zona de armado o hacé clic en &ldquo;+&rdquo;
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {selectedItems.length} {selectedItems.length === 1 ? 'producto' : 'productos'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PANEL IZQUIERDO: PRODUCTOS DISPONIBLES */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex flex-col h-72">
                <div className="relative mb-2.5">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar platos para agregar..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#5865F2]"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                  {filteredProducts.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-10 italic">
                      No se encontraron platos
                    </p>
                  ) : (
                    filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={(e) => handleDragStartProduct(e, p.id)}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#5865F2] flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing transition-all select-none group shadow-2xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <GripVertical className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 shrink-0" />
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden relative shrink-0 border border-slate-200 dark:border-slate-600">
                            {p.imageUrl ? (
                              <Image
                                src={p.imageUrl}
                                alt={p.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                                <Utensils className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              {formatCurrency(p.price, currency)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddProduct(p.id)}
                          className="py-1 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/60 hover:bg-[#5865F2] text-slate-600 dark:text-slate-300 hover:text-white text-[11px] font-bold border border-slate-200 dark:border-slate-600 transition-all flex items-center gap-1 shrink-0"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Agregar</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* PANEL DERECHO: ZONA DROP DE COMBO ARMADO */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                  setIsDropTargetActive(true);
                }}
                onDragLeave={() => setIsDropTargetActive(false)}
                onDrop={handleDropOnZone}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col h-72 ${
                  isDropTargetActive
                    ? 'bg-indigo-50/40 dark:bg-indigo-950/40 border-[#5865F2] ring-2 ring-[#5865F2]/20 scale-[1.01]'
                    : 'bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700 mb-2">
                  <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
                    Contenido del Combo
                  </span>
                  <span className="text-[11px] text-[#5865F2] dark:text-[#818cf8] font-mono font-bold">
                    Subtotal: {formatCurrency(regularCalculatedTotal, currency)}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                  {selectedItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 dark:text-slate-500">
                      <Package className="w-8 h-8 mb-2 opacity-40 text-[#5865F2]" />
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        Arrastrá platos aquí
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        o usá el botón Agregar para incluir ítems en esta promo
                      </p>
                    </div>
                  ) : (
                    selectedItems.map((item) => {
                      const prod = productMap.get(item.productId);
                      if (!prod) return null;
                      return (
                        <div
                          key={item.productId}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden relative shrink-0 border border-slate-200 dark:border-slate-600">
                              {prod.imageUrl ? (
                                <Image
                                  src={prod.imageUrl}
                                  alt={prod.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                                  <Utensils className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                {prod.name}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                {formatCurrency(prod.price * item.quantity, currency)} (
                                {formatCurrency(prod.price, currency)} c/u)
                              </p>
                            </div>
                          </div>

                          {/* Controles de Cantidad */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.productId, -1)}
                              className="w-6 h-6 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-black text-slate-900 dark:text-white font-mono">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.productId, 1)}
                              className="w-6 h-6 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(item.productId)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 ml-1 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. SUBIDA DE FOTO A SUPABASE STORAGE */}
          <div className="space-y-1.5">
            <ImageUploadDropzone
              tenantId={tenantId}
              folder="combos"
              label="Foto del Combo (Subir desde dispositivo sin URLs)"
              value={imageUrl}
              onChange={(url) => setImageUrl(url)}
              aspectRatio="video"
            />
          </div>

          {/* 5. DESCRIPCIÓN & TIEMPO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Descripción comercial del Combo (opcional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Incluye 2 Burgers completas con papas fritas y 2 bebidas medianas a elección..."
                className="w-full bg-slate-50/50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#5865F2] focus:bg-white dark:focus:bg-slate-800 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tiempo aprox en el que sale
                </label>
                {prepTime > 0 ? (
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/40">
                    ~{prepTime} min
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/40">
                    Sin tiempo de cocción
                  </span>
                )}
              </div>

              {/* Toggle Sin tiempo de cocción */}
              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors">
                <input
                  type="checkbox"
                  checked={prepTime === 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setPrepTime(0);
                    } else {
                      setPrepTime(20);
                    }
                  }}
                  className="w-4 h-4 rounded text-[#5865F2] focus:ring-0 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Sin tiempo de cocción
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1.5 text-[11px]">
                    (Entrega inmediata / bebidas)
                  </span>
                </div>
              </label>

              {prepTime > 0 ? (
                <div className="space-y-1 pt-0.5">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={prepTime}
                    onChange={(e) => setPrepTime(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-50/50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#5865F2] focus:bg-white dark:focus:bg-slate-800 transition-colors"
                    placeholder="Minutos estimados (ej: 20)"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Se mostrará en la card del menú (ej: &ldquo;Sale en ~{prepTime} min&rdquo;).
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
                  ✓ Listo para entrega inmediata (no se mostrará tiempo en la card del menú).
                </p>
              )}
            </div>
          </div>

          {/* 6. TOGGLES VISIBILIDAD */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 rounded text-[#5865F2] focus:ring-0"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Disponible</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Habilitado para pedidos</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-[#5865F2] focus:ring-0"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Destacado</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Badge de recomendación</span>
              </div>
            </label>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="py-2.5 px-6 rounded-2xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs tracking-wide shadow-md shadow-[#5865F2]/20 flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editingCombo ? 'Guardar Cambios' : 'Crear Combo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
