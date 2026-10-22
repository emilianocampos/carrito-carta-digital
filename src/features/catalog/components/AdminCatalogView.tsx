'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Check,
  X,
  ExternalLink,
  Clock,
  Star,
  Eye,
  EyeOff,
  AlertCircle,
  UtensilsCrossed,
  Layers,
  Loader2,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Package,
  GripVertical,
  Percent,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type {
  AdminProduct,
  AdminCategory,
  AdminCombo,
  AdminCatalogData,
  PublicOptionGroup,
  PublicOption,
} from '../queries';
import type { ProductInput, ComboInput } from '../schemas';
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  duplicateProductAction,
  toggleProductAvailabilityAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  toggleCategoryActiveAction,
  reorderCategoriesAction,
  createComboAction,
  updateComboAction,
  deleteComboAction,
  toggleComboAvailabilityAction,
  duplicateComboAction,
} from '../actions';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import { AdminComboModal } from './AdminComboModal';

interface AdminCatalogViewProps {
  initialData: AdminCatalogData;
}

export function AdminCatalogView({ initialData }: AdminCatalogViewProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'combos' | 'categories'>('products');
  const [products, setProducts] = useState<AdminProduct[]>(initialData.products);
  const [combos, setCombos] = useState<AdminCombo[]>(initialData.combos || []);
  const [categories, setCategories] = useState<AdminCategory[]>(initialData.categories);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'paused'>('all');

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados para modales
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);

  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<AdminCombo | null>(null);

  // Drag and drop para categorías
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);
  const [dragOverCategoryIndex, setDragOverCategoryIndex] = useState<number | null>(null);

  const [deletingTarget, setDeletingTarget] = useState<{
    type: 'product' | 'category' | 'combo';
    id: string;
    name: string;
  } | null>(null);

  // Campos del formulario de Producto
  const [prodName, setProdName] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState('');
  const [prodPrice, setProdPrice] = useState<number | ''>('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodPrepTime, setProdPrepTime] = useState<number>(15);
  const [prodIsAvailable, setProdIsAvailable] = useState(true);
  const [prodIsFeatured, setProdIsFeatured] = useState(false);
  const [prodOptionGroups, setProdOptionGroups] = useState<PublicOptionGroup[]>([]);

  // Campos del formulario de Categoría
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catImageUrl, setCatImageUrl] = useState('');
  const [catSortOrder, setCatSortOrder] = useState<number>(0);
  const [catIsActive, setCatIsActive] = useState(true);

  const tenant = initialData.tenant;
  const currency = initialData.currency;
  const planLimit = initialData.planLimit;

  // Filtrado de Productos
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategoryFilter === 'all' || p.categoryId === selectedCategoryFilter;

    const matchesAvailability =
      availabilityFilter === 'all'
        ? true
        : availabilityFilter === 'available'
        ? p.isAvailable
        : !p.isAvailable;

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  // Filtrado de Categorías
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtrado de Combos
  const filteredCombos = combos.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategoryFilter === 'all' || c.categoryId === selectedCategoryFilter;

    const matchesAvailability =
      availabilityFilter === 'all'
        ? true
        : availabilityFilter === 'available'
        ? c.isAvailable
        : !c.isAvailable;

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  // Abrir Modal de Combo
  const openComboModal = (combo?: AdminCombo) => {
    setErrorMessage(null);
    setEditingCombo(combo || null);
    setIsComboModalOpen(true);
  };

  // Abrir Modal de Producto (Nuevo o Editar)
  const openProductModal = (product?: AdminProduct) => {
    setErrorMessage(null);
    if (product) {
      setEditingProduct(product);
      setProdName(product.name);
      setProdCategoryId(product.categoryId);
      setProdPrice(product.price);
      setProdDescription(product.description || '');
      setProdImageUrl(product.imageUrl || '');
      setProdPrepTime(product.preparationTimeMinutes ?? 15);
      setProdIsAvailable(product.isAvailable);
      setProdIsFeatured(product.isFeatured);
      setProdOptionGroups(JSON.parse(JSON.stringify(product.optionGroups || [])));
    } else {
      setEditingProduct(null);
      setProdName('');
      setProdCategoryId(categories[0]?.id || '');
      setProdPrice('');
      setProdDescription('');
      setProdImageUrl('');
      setProdPrepTime(15);
      setProdIsAvailable(true);
      setProdIsFeatured(false);
      setProdOptionGroups([]);
    }
    setIsProductModalOpen(true);
  };

  // Abrir Modal de Categoría (Nueva o Editar)
  const openCategoryModal = (category?: AdminCategory) => {
    setErrorMessage(null);
    if (category) {
      setEditingCategory(category);
      setCatName(category.name);
      setCatDescription(category.description || '');
      setCatImageUrl(category.imageUrl || '');
      setCatSortOrder(category.sortOrder);
      setCatIsActive(category.isActive);
    } else {
      setEditingCategory(null);
      setCatName('');
      setCatDescription('');
      setCatImageUrl('');
      setCatSortOrder(categories.length);
      setCatIsActive(true);
    }
    setIsCategoryModalOpen(true);
  };

  // Guardar Producto
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!prodName.trim()) {
      setErrorMessage('El nombre del producto es obligatorio.');
      return;
    }
    if (!prodCategoryId) {
      setErrorMessage('Debes seleccionar una categoría.');
      return;
    }
    if (prodPrice === '' || Number(prodPrice) < 0) {
      setErrorMessage('El precio no puede ser negativo.');
      return;
    }

    const formattedOptionGroups = prodOptionGroups.map((group, gIdx) => ({
      id: group.id && !group.id.startsWith('temp-') ? group.id : undefined,
      name: group.name,
      minSelectable: Number(group.minSelectable) || 0,
      maxSelectable: Number(group.maxSelectable) || 1,
      isRequired: Boolean(group.isRequired),
      sortOrder: gIdx,
      options: (group.options || []).map((opt, oIdx) => ({
        id: opt.id && !opt.id.startsWith('temp-') ? opt.id : undefined,
        name: opt.name,
        extraPrice: Number(opt.extraPrice) || 0,
        isAvailable: true,
        sortOrder: oIdx,
      })),
    }));

    const payload: ProductInput = {
      name: prodName.trim(),
      categoryId: prodCategoryId,
      price: Number(prodPrice),
      description: prodDescription.trim() || null,
      imageUrl: prodImageUrl.trim() || null,
      preparationTimeMinutes: typeof prodPrepTime === 'number' && prodPrepTime >= 0 ? prodPrepTime : 15,
      isAvailable: prodIsAvailable,
      isFeatured: prodIsFeatured,
      sortOrder: editingProduct ? editingProduct.sortOrder : products.length,
      optionGroups: formattedOptionGroups,
    };

    startTransition(async () => {
      if (editingProduct) {
        const res = await updateProductAction(tenant.id, editingProduct.id, payload);
        if (res.success) {
          const categoryName = categories.find((c) => c.id === prodCategoryId)?.name || '';
          setProducts((prev) =>
            prev.map((p) =>
              p.id === editingProduct.id
                ? {
                    ...p,
                    name: payload.name,
                    categoryId: payload.categoryId,
                    categoryName,
                    price: payload.price,
                    description: payload.description ?? null,
                    imageUrl: payload.imageUrl ?? null,
                    preparationTimeMinutes: payload.preparationTimeMinutes,
                    isAvailable: payload.isAvailable,
                    isFeatured: payload.isFeatured,
                    sortOrder: payload.sortOrder,
                    optionGroups: prodOptionGroups,
                  }
                : p
            )
          );
          setIsProductModalOpen(false);
          triggerToast('Producto actualizado correctamente.');
        } else {
          setErrorMessage(res.error);
        }
      } else {
        const res = await createProductAction(tenant.id, payload);
        if (res.success) {
          const categoryName = categories.find((c) => c.id === prodCategoryId)?.name || '';
          const newProd: AdminProduct = {
            id: res.data.id,
            name: payload.name,
            categoryId: payload.categoryId,
            categoryName,
            price: payload.price,
            description: payload.description ?? null,
            imageUrl: payload.imageUrl ?? null,
            preparationTimeMinutes: payload.preparationTimeMinutes,
            isAvailable: payload.isAvailable,
            isFeatured: payload.isFeatured,
            sortOrder: payload.sortOrder,
            optionGroups: prodOptionGroups,
          };
          setProducts((prev) => [...prev, newProd]);
          // Actualizar contador de productos en la categoría
          setCategories((prev) =>
            prev.map((c) =>
              c.id === prodCategoryId ? { ...c, productsCount: c.productsCount + 1 } : c
            )
          );
          setIsProductModalOpen(false);
          triggerToast('¡Producto creado con éxito!');
        } else {
          setErrorMessage(res.error);
        }
      }
    });
  };

  // Guardar Categoría
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!catName.trim()) {
      setErrorMessage('El nombre de la categoría es obligatorio.');
      return;
    }

    const payload = {
      name: catName.trim(),
      description: catDescription.trim() || null,
      imageUrl: catImageUrl.trim() || null,
      sortOrder: Number(catSortOrder) || 0,
      isActive: catIsActive,
    };

    startTransition(async () => {
      if (editingCategory) {
        const res = await updateCategoryAction(tenant.id, editingCategory.id, payload);
        if (res.success) {
          setCategories((prev) =>
            prev.map((c) => (c.id === editingCategory.id ? { ...c, ...payload } : c))
          );
          // Si cambió el nombre, actualizar productos asociados
          setProducts((prev) =>
            prev.map((p) =>
              p.categoryId === editingCategory.id
                ? { ...p, categoryName: payload.name }
                : p
            )
          );
          setIsCategoryModalOpen(false);
          triggerToast('Categoría actualizada con éxito.');
        } else {
          setErrorMessage(res.error);
        }
      } else {
        const res = await createCategoryAction(tenant.id, payload);
        if (res.success) {
          const newCat: AdminCategory = {
            id: res.data.id,
            ...payload,
            productsCount: 0,
          };
          setCategories((prev) => [...prev, newCat]);
          setIsCategoryModalOpen(false);
          triggerToast('¡Categoría creada con éxito!');
        } else {
          setErrorMessage(res.error);
        }
      }
    });
  };

  // Pausar / Despausar producto en 1 click
  const handleToggleProductAvailability = (product: AdminProduct) => {
    const newStatus = !product.isAvailable;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isAvailable: newStatus } : p))
    );

    startTransition(async () => {
      await toggleProductAvailabilityAction(tenant.id, product.id, newStatus);
    });
  };

  // Duplicar producto
  const handleDuplicateProduct = (productId: string) => {
    startTransition(async () => {
      const res = await duplicateProductAction(tenant.id, productId);
      if (res.success) {
        const original = products.find((p) => p.id === productId);
        if (original) {
          const duplicated: AdminProduct = {
            ...original,
            id: res.data.id,
            name: `${original.name} (Copia)`,
            isFeatured: false,
            sortOrder: original.sortOrder + 1,
          };
          setProducts((prev) => [...prev, duplicated]);
          triggerToast('Producto duplicado con éxito.');
        }
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  // Activar / Desactivar categoría
  const handleToggleCategoryActive = (category: AdminCategory) => {
    const newActive = !category.isActive;
    setCategories((prev) =>
      prev.map((c) => (c.id === category.id ? { ...c, isActive: newActive } : c))
    );

    startTransition(async () => {
      await toggleCategoryActiveAction(tenant.id, category.id, newActive);
    });
  };

  // Guardar o Actualizar Combo
  const handleSaveCombo = async (data: ComboInput) => {
    setErrorMessage(null);
    startTransition(async () => {
      if (editingCombo) {
        const res = await updateComboAction(tenant.id, editingCombo.id, data);
        if (res.success) {
          triggerToast('¡Combo actualizado correctamente!');
          setIsComboModalOpen(false);
          const cat = categories.find((c) => c.id === data.categoryId);
          setCombos((prev) =>
            prev.map((c) =>
              c.id === editingCombo.id
                ? {
                    ...c,
                    name: data.name,
                    categoryId: data.categoryId,
                    categoryName: cat?.name || c.categoryName,
                    price: data.price,
                    originalPrice: data.originalPrice ?? null,
                    imageUrl: data.imageUrl ?? null,
                    description: data.description ?? null,
                    preparationTimeMinutes: data.preparationTimeMinutes,
                    isAvailable: data.isAvailable,
                    isFeatured: data.isFeatured,
                    regularCalculatedPrice: data.originalPrice ?? data.price,
                    savingsAmount: data.originalPrice ? Math.max(0, data.originalPrice - data.price) : 0,
                    discountPercentage:
                      data.originalPrice && data.originalPrice > data.price
                        ? Math.round(((data.originalPrice - data.price) / data.originalPrice) * 100)
                        : 0,
                  }
                : c
            )
          );
        } else {
          setErrorMessage(res.error);
        }
      } else {
        const res = await createComboAction(tenant.id, data);
        if (res.success) {
          triggerToast('¡Nuevo combo creado con éxito!');
          setIsComboModalOpen(false);
          const cat = categories.find((c) => c.id === data.categoryId);
          const newCombo: AdminCombo = {
            id: res.data.id,
            name: data.name,
            categoryId: data.categoryId,
            categoryName: cat?.name || '',
            price: data.price,
            originalPrice: data.originalPrice ?? null,
            imageUrl: data.imageUrl ?? null,
            description: data.description ?? null,
            preparationTimeMinutes: data.preparationTimeMinutes,
            isAvailable: data.isAvailable,
            isFeatured: data.isFeatured,
            sortOrder: combos.length,
            items: data.items.map((it, idx) => {
              const prod = products.find((p) => p.id === it.productId);
              return {
                id: `ci-${idx}`,
                productId: it.productId,
                productName: prod?.name || '',
                productPrice: prod?.price || 0,
                productImageUrl: prod?.imageUrl || null,
                quantity: it.quantity,
                sortOrder: idx,
              };
            }),
            regularCalculatedPrice: data.originalPrice ?? data.price,
            savingsAmount: data.originalPrice ? Math.max(0, data.originalPrice - data.price) : 0,
            discountPercentage:
              data.originalPrice && data.originalPrice > data.price
                ? Math.round(((data.originalPrice - data.price) / data.originalPrice) * 100)
                : 0,
          };
          setCombos((prev) => [newCombo, ...prev]);
        } else {
          setErrorMessage(res.error);
        }
      }
    });
  };

  // Toggle disponibilidad de combo
  const handleToggleComboAvailability = (combo: AdminCombo) => {
    const newAvailable = !combo.isAvailable;
    setCombos((prev) =>
      prev.map((c) => (c.id === combo.id ? { ...c, isAvailable: newAvailable } : c))
    );
    startTransition(async () => {
      await toggleComboAvailabilityAction(tenant.id, combo.id, newAvailable);
    });
  };

  // Duplicar combo
  const handleDuplicateCombo = (combo: AdminCombo) => {
    startTransition(async () => {
      const res = await duplicateComboAction(tenant.id, combo.id);
      if (res.success) {
        const cloned: AdminCombo = {
          ...combo,
          id: res.data.id,
          name: `${combo.name} (Copia)`,
          isFeatured: false,
        };
        setCombos((prev) => [cloned, ...prev]);
        triggerToast('Combo duplicado exitosamente.');
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  // Drag and drop para reordenar categorías
  const handleCategoryDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCategoryIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCategoryIndex !== index) {
      setDragOverCategoryIndex(index);
    }
  };

  const handleCategoryDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverCategoryIndex(null);
    if (draggedCategoryIndex === null || draggedCategoryIndex === dropIndex) return;

    const reordered = [...categories];
    const [moved] = reordered.splice(draggedCategoryIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    const updated = reordered.map((cat, idx) => ({ ...cat, sortOrder: idx }));
    setCategories(updated);
    setDraggedCategoryIndex(null);

    startTransition(async () => {
      await reorderCategoriesAction(tenant.id, updated.map((c) => c.id));
      triggerToast('Orden de categorías actualizado.');
    });
  };

  // Confirmar y Ejecutar Eliminación
  const handleConfirmDelete = () => {
    if (!deletingTarget) return;

    startTransition(async () => {
      if (deletingTarget.type === 'product') {
        const res = await deleteProductAction(tenant.id, deletingTarget.id);
        if (res.success) {
          const removed = products.find((p) => p.id === deletingTarget.id);
          setProducts((prev) => prev.filter((p) => p.id !== deletingTarget.id));
          if (removed) {
            setCategories((prev) =>
              prev.map((c) =>
                c.id === removed.categoryId
                  ? { ...c, productsCount: Math.max(0, c.productsCount - 1) }
                  : c
              )
            );
          }
          triggerToast('Producto eliminado.');
        } else {
          setErrorMessage(res.error);
        }
      } else if (deletingTarget.type === 'combo') {
        const res = await deleteComboAction(tenant.id, deletingTarget.id);
        if (res.success) {
          setCombos((prev) => prev.filter((c) => c.id !== deletingTarget.id));
          triggerToast('Combo eliminado.');
        } else {
          setErrorMessage(res.error);
        }
      } else {
        const res = await deleteCategoryAction(tenant.id, deletingTarget.id);
        if (res.success) {
          setCategories((prev) => prev.filter((c) => c.id !== deletingTarget.id));
          triggerToast('Categoría eliminada.');
        } else {
          setErrorMessage(res.error);
        }
      }
      setDeletingTarget(null);
    });
  };

  // Helpers de Toast
  const triggerToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Helpers para manejo dinámico de Grupos de Opciones dentro del Modal de Producto
  const handleAddOptionGroup = () => {
    setProdOptionGroups((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: 'Opciones de elección',
        isRequired: false,
        minSelectable: 0,
        maxSelectable: 1,
        options: [
          { id: crypto.randomUUID(), name: 'Opción 1', extraPrice: 0 },
        ],
      },
    ]);
  };

  const handleRemoveOptionGroup = (index: number) => {
    setProdOptionGroups((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateGroupField = (
    groupIndex: number,
    field: keyof PublicOptionGroup,
    val: unknown
  ) => {
    setProdOptionGroups((prev) =>
      prev.map((g, i) => (i === groupIndex ? { ...g, [field]: val } : g))
    );
  };

  const handleAddOptionToGroup = (groupIndex: number) => {
    setProdOptionGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? {
              ...g,
              options: [
                ...g.options,
                { id: crypto.randomUUID(), name: 'Nueva Opción', extraPrice: 0 },
              ],
            }
          : g
      )
    );
  };

  const handleRemoveOptionFromGroup = (groupIndex: number, optIndex: number) => {
    setProdOptionGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? { ...g, options: g.options.filter((_, oi) => oi !== optIndex) }
          : g
      )
    );
  };

  const handleUpdateOptionField = (
    groupIndex: number,
    optIndex: number,
    field: keyof PublicOption,
    val: unknown
  ) => {
    setProdOptionGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? {
              ...g,
              options: g.options.map((opt, oi) =>
                oi === optIndex ? { ...opt, [field]: val } : opt
              ),
            }
          : g
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#f0f4fc] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 pb-32 max-w-7xl mx-auto w-full antialiased space-y-7 selection:bg-[#5865F2] selection:text-white transition-colors duration-200">
      {/* Toast Notificación */}
      {successMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-[#5865F2] text-white font-black text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header con Título, Límite de Plan y Botón Nuevo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/20">
              Gestión de Carta
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <UtensilsCrossed className="w-7 h-7 text-[#5865F2]" />
            <span>Productos & Categorías</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Administrá manualmente los platos, precios, categorías y adicionales sin depender de IA.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Link
            href={`/c/${tenant.slug}`}
            target="_blank"
            className="py-2.5 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Ver Carta</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              if (activeTab === 'products') openProductModal();
              else if (activeTab === 'combos') openComboModal();
              else openCategoryModal();
            }}
            className="py-2.5 px-5 rounded-2xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs tracking-wide shadow-md shadow-[#5865F2]/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>
              {activeTab === 'products'
                ? 'Nuevo Plato'
                : activeTab === 'combos'
                ? 'Nuevo Combo'
                : 'Nueva Categoría'}
            </span>
          </button>
        </div>
      </div>

      {/* Alerta de Error si ocurre */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-800 dark:hover:text-rose-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selector de 3 Pestañas (Platos vs Combos vs Categorías) & Contador de Plan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-sm max-w-md w-full">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'products'
                ? 'bg-[#5865F2] text-white shadow-sm font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span className="truncate">Platos ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('combos')}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'combos'
                ? 'bg-[#5865F2] text-white shadow-sm font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span className="truncate">Combos ({combos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'categories'
                ? 'bg-[#5865F2] text-white shadow-sm font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="truncate">Categorías ({categories.length})</span>
          </button>
        </div>

        {/* Badge de Capacidad del Plan */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs px-3.5 py-1.5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Uso del Plan:</span>
          <span className="font-mono font-black text-slate-800 dark:text-slate-200">
            {products.length + combos.length} / {planLimit.limit === Infinity ? '∞' : planLimit.limit} ítems
          </span>
          {!planLimit.allowed && (
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white">
              Límite alcanzado
            </span>
          )}
        </div>
      </div>

      {/* CONTROLES DE FILTRO Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeTab === 'products'
                ? 'Buscar por nombre o ingredientes...'
                : 'Buscar categoría...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#5865F2] shadow-sm transition-colors"
          />
        </div>

        {/* Filtros específicos de Productos */}
        {activeTab === 'products' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {/* Filtro por Categoría */}
            <div className="relative">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                aria-label="Filtrar por categoría"
                className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#5865F2] shadow-sm transition-colors"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Disponibilidad */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
              <button
                type="button"
                onClick={() => setAvailabilityFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                  availabilityFilter === 'all'
                    ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setAvailabilityFilter('available')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                  availabilityFilter === 'available'
                    ? 'bg-[#5865F2] text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Activos
              </button>
              <button
                type="button"
                onClick={() => setAvailabilityFilter('paused')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                  availabilityFilter === 'paused'
                    ? 'bg-amber-500 text-white font-black shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Pausados
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* PESTAÑA 1: LISTADO DE PRODUCTOS */}
      {/* ===================================================================== */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-center space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 mx-auto">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">No se encontraron productos</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {searchQuery || selectedCategoryFilter !== 'all' || availabilityFilter !== 'all'
                  ? 'Probá cambiando los filtros o la búsqueda ingresada.'
                  : 'Aún no cargaste ningún plato. Empezá creando tu primer producto.'}
              </p>
              <button
                type="button"
                onClick={() => openProductModal()}
                className="py-2.5 px-5 rounded-2xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs tracking-wide shadow-md shadow-[#5865F2]/20 active:scale-95 transition-all"
              >
                + Crear Primer Producto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`p-5 rounded-3xl bg-white dark:bg-[#111827] border transition-all space-y-4 flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md dark:shadow-none group ${
                    product.isAvailable
                      ? 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-80'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Imagen y Badges */}
                    <div className="relative w-full h-40 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 overflow-hidden">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold text-xs">
                          <UtensilsCrossed className="w-8 h-8 opacity-40" />
                        </div>
                      )}

                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm">
                          {product.categoryName}
                        </span>

                        {product.isFeatured && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 flex items-center gap-0.5 shadow-sm">
                            <Star className="w-3 h-3 fill-current" />
                            <span>Destacado</span>
                          </span>
                        )}
                      </div>

                      {/* Switch Rápido Disponibilidad */}
                      <button
                        type="button"
                        onClick={() => handleToggleProductAvailability(product)}
                        className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md transition-all shadow-md flex items-center gap-1 ${
                          product.isAvailable
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600 font-bold'
                            : 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold'
                        }`}
                        title={
                          product.isAvailable
                            ? 'Hacé clic para pausar (ocultar por falta de stock)'
                            : 'Hacé clic para reactivar producto'
                        }
                      >
                        {product.isAvailable ? (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Disponible</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Pausado</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Información del Producto */}
                    <div>
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-[#5865F2] dark:group-hover:text-[#818cf8] transition-colors truncate">
                          {product.name}
                        </h3>
                        <span className="text-sm font-black text-slate-900 dark:text-white shrink-0 font-mono">
                          {formatCurrency(product.price, currency)}
                        </span>
                      </div>

                      {product.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Metadatos (Tiempo y Opciones) */}
                    <div className="flex items-center gap-3 text-[11px] pt-1">
                      {product.preparationTimeMinutes && product.preparationTimeMinutes > 0 ? (
                        <span className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
                          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Sale en ~{product.preparationTimeMinutes} min</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                          <span>Sin tiempo de cocción</span>
                        </span>
                      )}

                      {product.optionGroups && product.optionGroups.length > 0 && (
                        <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                          <span>•</span>
                          <span>{product.optionGroups.length} opciones</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Barra de Acciones del Producto */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openProductModal(product)}
                        className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
                        title="Editar plato"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicateProduct(product.id)}
                        className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                        title="Duplicar producto"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setDeletingTarget({
                          type: 'product',
                          id: product.id,
                          name: product.name,
                        })
                      }
                      className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all"
                      title="Eliminar plato"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* PESTAÑA 2: LISTADO DE COMBOS & PROMOS */}
      {/* ===================================================================== */}
      {activeTab === 'combos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-xs shadow-sm">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Package className="w-4 h-4 text-[#5865F2]" />
              <span>
                Los <strong>Combos</strong> permiten agrupar varios productos con descuento visible para aumentar tu ticket promedio.
              </span>
            </div>
            <button
              type="button"
              onClick={() => openComboModal()}
              className="py-2 px-3.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs shadow-md shadow-[#5865F2]/20 transition-all flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Armar Combo</span>
            </button>
          </div>

          {filteredCombos.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-center space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 mx-auto">
                <Package className="w-7 h-7 text-[#5865F2]" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">No tenés combos creados aún</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Armá promociones como &ldquo;Promo Pareja&rdquo; o &ldquo;Menú Ejecutivo&rdquo; con nuestro constructor visual Drag & Drop.
              </p>
              <button
                type="button"
                onClick={() => openComboModal()}
                className="py-2.5 px-5 rounded-2xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs tracking-wide shadow-md shadow-[#5865F2]/20 active:scale-95 transition-all"
              >
                + Armar Primer Combo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCombos.map((combo) => (
                <div
                  key={combo.id}
                  className="rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 overflow-hidden flex flex-col justify-between transition-all shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md dark:shadow-none group"
                >
                  <div className="space-y-3 p-5">
                    {/* Imagen o Placeholder del Combo */}
                    <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60">
                      {combo.imageUrl ? (
                        <Image
                          src={combo.imageUrl}
                          alt={combo.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2">
                          <Package className="w-8 h-8 text-[#5865F2]/60" />
                          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">Combo sin foto</span>
                        </div>
                      )}

                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[#5865F2] border border-slate-200 dark:border-slate-700 shadow-sm">
                          {combo.categoryName || 'Combo'}
                        </span>
                        {combo.isFeatured && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-400 backdrop-blur-md text-slate-950 font-extrabold flex items-center gap-1 shadow-sm">
                            <Star className="w-3 h-3 fill-slate-950" />
                            <span>Destacado</span>
                          </span>
                        )}
                      </div>

                      {combo.discountPercentage > 0 && (
                        <div className="absolute bottom-3 right-3">
                          <span className="px-2.5 py-1 rounded-xl bg-rose-500 text-white font-black text-xs tracking-tight shadow-md flex items-center gap-1">
                            <Percent className="w-3 h-3" />
                            <span>{combo.discountPercentage}% OFF</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Título, Descripción y Precios */}
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-[#5865F2] dark:group-hover:text-[#818cf8] transition-colors leading-snug">
                          {combo.name}
                        </h3>
                      </div>

                      {combo.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {combo.description}
                        </p>
                      )}
                    </div>

                    {/* Precios: Regular tachado vs Promo */}
                    <div className="flex items-baseline gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                        {formatCurrency(combo.price, currency)}
                      </span>
                      {combo.originalPrice && combo.originalPrice > combo.price && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 line-through font-mono">
                          {formatCurrency(combo.originalPrice, currency)}
                        </span>
                      )}
                      {combo.savingsAmount > 0 && (
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40 font-bold ml-auto">
                          Ahorro: {formatCurrency(combo.savingsAmount, currency)}
                        </span>
                      )}
                    </div>

                    {/* Ítems incluidos en el combo */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
                        Incluye en esta promo:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {combo.items.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">Sin ítems vinculados</span>
                        ) : (
                          combo.items.map((it) => (
                            <span
                              key={it.id || it.productId}
                              className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 shadow-2xs"
                            >
                              <span className="text-[#5865F2] font-mono">{it.quantity}x</span>
                              <span className="truncate max-w-[120px]">{it.productName}</span>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones del Combo */}
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleComboAvailability(combo)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 ${
                        combo.isAvailable
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 hover:border-rose-200 dark:hover:border-rose-800'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/70 dark:border-rose-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-200 dark:hover:border-emerald-800'
                      }`}
                      title="Pausar o activar combo"
                    >
                      {combo.isAvailable ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Activo</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Pausado</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openComboModal(combo)}
                        className="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1"
                        title="Editar combo"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicateCombo(combo)}
                        className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        title="Duplicar combo"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeletingTarget({
                            type: 'combo',
                            id: combo.id,
                            name: combo.name,
                          })
                        }
                        className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        title="Eliminar combo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* PESTAÑA 3: LISTADO DE CATEGORÍAS CON DRAG AND DROP */}
      {/* ===================================================================== */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-xs shadow-sm">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <GripVertical className="w-4 h-4 text-[#5865F2]" />
              <span>
                💡 <strong>Drag & Drop activo:</strong> Arrastrá las tarjetas de categoría para cambiar su orden en la carta digital.
              </span>
            </div>
            <button
              type="button"
              onClick={() => openCategoryModal()}
              className="py-2 px-3.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs shadow-md shadow-[#5865F2]/20 transition-all flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Nueva Categoría</span>
            </button>
          </div>

          {filteredCategories.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-center space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 mx-auto">
                <Layers className="w-6 h-6 text-[#5865F2]" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">No hay categorías cargadas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Organiza tu carta creando categorías como Hamburguesas, Bebidas o Postres.
              </p>
              <button
                type="button"
                onClick={() => openCategoryModal()}
                className="py-2.5 px-5 rounded-2xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs tracking-wide shadow-md shadow-[#5865F2]/20 active:scale-95 transition-all"
              >
                + Crear Primera Categoría
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((category, idx) => (
                <div
                  key={category.id}
                  draggable
                  onDragStart={(e) => handleCategoryDragStart(e, idx)}
                  onDragOver={(e) => handleCategoryDragOver(e, idx)}
                  onDrop={(e) => handleCategoryDrop(e, idx)}
                  className={`p-5 rounded-3xl bg-white dark:bg-[#111827] border space-y-4 flex flex-col justify-between transition-all duration-150 cursor-grab active:cursor-grabbing select-none shadow-[0_2px_12px_rgba(0,0,0,0.03)] ${
                    draggedCategoryIndex === idx ? 'opacity-30 scale-95 border-dashed border-[#5865F2]' : ''
                  } ${
                    dragOverCategoryIndex === idx
                      ? 'border-[#5865F2] ring-2 ring-[#5865F2]/20 bg-indigo-50/30 dark:bg-indigo-950/30 scale-[1.02]'
                      : 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                        <GripVertical className="w-4 h-4 text-[#5865F2]" />
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                          Posición #{category.sortOrder + 1}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleCategoryActive(category)}
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border transition-colors ${
                          category.isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
                        }`}
                        title="Cambiar visibilidad en el menú público"
                      >
                        {category.isActive ? 'Visible en Carta' : 'Oculta'}
                      </button>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">{category.name}</h3>
                      {category.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {category.description}
                        </p>
                      )}
                    </div>

                    <div className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 pt-1">
                      <span className="w-2 h-2 rounded-full bg-[#5865F2]" />
                      <span>{category.productsCount} productos vinculados</span>
                    </div>
                  </div>

                  {/* Acciones de la Categoría */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => openCategoryModal(category)}
                      className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setDeletingTarget({
                          type: 'category',
                          id: category.id,
                          name: category.name,
                        })
                      }
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: CREAR O EDITAR PRODUCTO */}
      {/* ===================================================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl my-8 max-h-[90vh] overflow-y-auto text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-center justify-center text-[#5865F2]">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configurá los datos, precio y opcionales de este plato
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Título del Producto */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Título del Producto (Nombre para la card) *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="Ej: Smash Bacon Doble"
                    className="w-full bg-slate-50/50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#5865F2] focus:bg-white dark:focus:bg-slate-800 transition-colors"
                  />
                </div>

                {/* Categoría */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Categoría *</label>
                  <select
                    required
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(e.target.value)}
                    aria-label="Seleccionar categoría para el producto"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 2. Precio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Precio ({currency}) para la card *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={prodPrice}
                    onChange={(e) =>
                      setProdPrice(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Ej: 6500"
                    className="w-full bg-slate-50/50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#5865F2] focus:bg-white dark:focus:bg-slate-800 transition-colors"
                  />
                </div>

                {/* 3. Tiempo aprox en el que sale */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tiempo aprox en el que sale
                    </label>
                    {prodPrepTime > 0 ? (
                      <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/40">
                        ~{prodPrepTime} min
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
                      checked={prodPrepTime === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProdPrepTime(0);
                        } else {
                          setProdPrepTime(15);
                        }
                      }}
                      className="w-4 h-4 rounded text-[#5865F2] focus:ring-0 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Sin tiempo de cocción
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 ml-1.5 text-[11px]">
                        (Bebidas, snacks, sin demora)
                      </span>
                    </div>
                  </label>

                  {/* Input si tiene tiempo de preparación */}
                  {prodPrepTime > 0 ? (
                    <div className="space-y-1 pt-0.5">
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={prodPrepTime}
                        onChange={(e) => setProdPrepTime(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-50/50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#5865F2] focus:bg-white dark:focus:bg-slate-800 transition-colors"
                        placeholder="Minutos estimados (ej: 15)"
                      />
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        Se mostrará en la card del menú (ej: &ldquo;Sale en ~{prodPrepTime} min&rdquo;).
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
                      ✓ Listo para entrega inmediata (no se mostrará tiempo en la card del menú).
                    </p>
                  )}
                </div>
              </div>

              {/* 4. Imagen del Producto */}
              <div className="space-y-1.5">
                <ImageUploadDropzone
                  tenantId={tenant.id}
                  folder="products"
                  label="Imagen del Producto (Foto principal de la card)"
                  value={prodImageUrl}
                  onChange={(url) => setProdImageUrl(url || '')}
                  aspectRatio="video"
                />
              </div>

              {/* 5. Descripción del Producto */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Descripción & Ingredientes (Texto explicativo para la card)
                </label>
                <textarea
                  rows={2}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="Dos medallones de carne vacuna smash, doble cheddar, cebolla caramelizada..."
                  className="w-full bg-slate-50/50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#5865F2] focus:bg-white dark:focus:bg-slate-800 transition-colors"
                />
              </div>

              {/* Toggles Destacado & Disponible */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodIsAvailable}
                    onChange={(e) => setProdIsAvailable(e.target.checked)}
                    className="w-4 h-4 rounded text-[#5865F2] focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Disponible</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Visible para comprar</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodIsFeatured}
                    onChange={(e) => setProdIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-[#5865F2] focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Plato Destacado</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Badge de recomendación</span>
                  </div>
                </label>
              </div>

              {/* SECCIÓN DE GRUPOS DE OPCIONES & ADICIONALES */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Grupos de Opciones y Variantes
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Puntos de cocción, panes especiales, salsas extras o bebidas combo
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddOptionGroup}
                    className="py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#5865F2] text-xs font-bold text-[#5865F2] dark:text-[#818cf8] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Grupo</span>
                  </button>
                </div>

                {prodOptionGroups.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center">
                    Sin grupos de opciones. El comensal elegirá solo el producto base.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {prodOptionGroups.map((group, gIdx) => (
                      <div
                        key={group.id || gIdx}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={group.name}
                            onChange={(e) =>
                              handleUpdateGroupField(gIdx, 'name', e.target.value)
                            }
                            placeholder="Nombre del grupo (ej: Punto de la carne)"
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5865F2] flex-1"
                          />

                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={group.isRequired}
                              onChange={(e) =>
                                handleUpdateGroupField(gIdx, 'isRequired', e.target.checked)
                              }
                              className="w-3.5 h-3.5 rounded text-[#5865F2]"
                            />
                            <span>Obligatorio</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => handleRemoveOptionGroup(gIdx)}
                            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition-colors"
                            title="Eliminar grupo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Opciones dentro del grupo */}
                        <div className="space-y-2 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                          {group.options.map((opt, oIdx) => (
                            <div key={opt.id || oIdx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={opt.name}
                                onChange={(e) =>
                                  handleUpdateOptionField(gIdx, oIdx, 'name', e.target.value)
                                }
                                placeholder="Nombre (ej: Jugoso)"
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-900 dark:text-white flex-1"
                              />

                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-400 dark:text-slate-500">+</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={opt.extraPrice}
                                  onChange={(e) =>
                                    handleUpdateOptionField(
                                      gIdx,
                                      oIdx,
                                      'extraPrice',
                                      Number(e.target.value)
                                    )
                                  }
                                  placeholder="Extra $"
                                  className="w-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-xs text-slate-900 dark:text-white font-mono"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveOptionFromGroup(gIdx, oIdx)}
                                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => handleAddOptionToGroup(gIdx)}
                            className="text-[11px] text-[#5865F2] dark:text-[#818cf8] font-bold hover:underline pt-1 block"
                          >
                            + Agregar opción a este grupo
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botón Guardar */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="py-2.5 px-5 rounded-2xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs tracking-wide shadow-md shadow-[#5865F2]/20 flex items-center gap-1.5 disabled:opacity-50 transition-all"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingProduct ? 'Actualizar Producto' : 'Crear Producto'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: CREAR O EDITAR CATEGORÍA */}
      {/* ===================================================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-center justify-center text-[#5865F2]">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nombre de la Categoría *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ej: Hamburguesas, Bebidas, Combos"
                  className="w-full bg-slate-50/50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#5865F2] focus:bg-white dark:focus:bg-slate-800 transition-colors"
                />
              </div>

              {/* Descripción */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Descripción (opcional)</label>
                <textarea
                  rows={2}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="Breve texto visible para los comensales..."
                  className="w-full bg-slate-50/50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#5865F2] focus:bg-white dark:focus:bg-slate-800 transition-colors"
                />
              </div>

              {/* Imagen de Categoría (Storage) */}
              <div className="space-y-1.5">
                <ImageUploadDropzone
                  tenantId={tenant.id}
                  folder="categories"
                  label="Foto o Banner de la Categoría (opcional)"
                  value={catImageUrl}
                  onChange={(url) => setCatImageUrl(url || '')}
                  aspectRatio="banner"
                />
              </div>

              {/* Orden y Visibilidad */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Orden en la Carta</label>
                  <input
                    type="number"
                    value={catSortOrder}
                    onChange={(e) => setCatSortOrder(Number(e.target.value))}
                    className="w-full bg-slate-50/50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#5865F2] focus:bg-white dark:focus:bg-slate-800 transition-colors"
                  />
                </div>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer mt-auto">
                  <input
                    type="checkbox"
                    checked={catIsActive}
                    onChange={(e) => setCatIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#5865F2]"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Visible</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">En el menú público</span>
                  </div>
                </label>
              </div>

              {/* Botón Guardar */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="py-2.5 px-5 rounded-2xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs tracking-wide shadow-md shadow-[#5865F2]/20 flex items-center gap-1.5 disabled:opacity-50 transition-all"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingCategory ? 'Actualizar Categoría' : 'Crear Categoría'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: CREAR O EDITAR COMBO CON DRAG & DROP BUILDER */}
      {/* ===================================================================== */}
      <AdminComboModal
        isOpen={isComboModalOpen}
        onClose={() => setIsComboModalOpen(false)}
        onSave={handleSaveCombo}
        editingCombo={editingCombo}
        categories={categories}
        products={products}
        currency={currency}
        tenantId={tenant.id}
        isPending={isPending}
      />

      {/* ===================================================================== */}
      {/* MODAL 4: CONFIRMACIÓN DE ELIMINACIÓN */}
      {/* ===================================================================== */}
      {deletingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 space-y-4 text-center shadow-2xl text-slate-800 dark:text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                ¿Eliminar {deletingTarget.type === 'product' ? 'este plato' : deletingTarget.type === 'combo' ? 'este combo' : 'esta categoría'}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Vas a eliminar &ldquo;{deletingTarget.name}&rdquo;. Esta acción quitará el ítem de tu carta digital.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingTarget(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmDelete}
                className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all"
              >
                {isPending ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
