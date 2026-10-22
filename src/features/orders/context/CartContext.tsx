'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { PublicProduct } from '@/features/catalog/queries';
import type { CartItemPayload, SelectedOptionItem } from '@/features/menu-engine/components/ProductCustomizerModal';

export interface CartItem {
  id: string; // ID único para distinguir hamburguesa con cheddar vs misma hamburguesa sin cheddar
  product: PublicProduct;
  quantity: number;
  selectedOptions: SelectedOptionItem[];
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

interface CartContextType {
  items: CartItem[];
  totalCount: number;
  totalAmount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addItem: (payload: CartItemPayload) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function generateItemKey(
  productId: string,
  options: SelectedOptionItem[],
  notes?: string
): string {
  const optionsKey = options
    .map((o) => `${o.groupId}:${o.optionId}`)
    .sort()
    .join('|');
  return `${productId}_${optionsKey}_${notes?.trim() || ''}`;
}

export function CartProvider({
  tenantSlug,
  children,
}: {
  tenantSlug: string;
  children: React.ReactNode;
}) {
  const storageKey = `carrito_takeaway_cart_${tenantSlug}`;
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Cargar carrito desde LocalStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // Ignorar fallas de lectura de storage
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey]);

  // Persistir en LocalStorage ante cambios
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // Fallback
    }
  }, [items, isLoaded, storageKey]);

  const addItem = (payload: CartItemPayload) => {
    const itemKey = generateItemKey(
      payload.product.id,
      payload.selectedOptions,
      payload.notes
    );

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === itemKey);
      if (existingIndex > -1) {
        // Incrementar cantidad del item idéntico
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + payload.quantity;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          subtotal: existing.unitPrice * newQty,
        };
        return updated;
      } else {
        // Agregar nuevo item
        const newItem: CartItem = {
          id: itemKey,
          product: payload.product,
          quantity: payload.quantity,
          selectedOptions: payload.selectedOptions,
          unitPrice: payload.unitPrice,
          subtotal: payload.subtotal,
          notes: payload.notes,
        };
        return [...prev, newItem];
      }
    });
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              subtotal: item.unitPrice * quantity,
            }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Fallback
    }
  };

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.subtotal, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      totalCount,
      totalAmount,
      isCartOpen,
      setIsCartOpen,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [items, totalCount, totalAmount, isCartOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser utilizado dentro de un CartProvider');
  }
  return context;
}
