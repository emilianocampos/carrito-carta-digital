'use client';

import React, { useState, useMemo } from 'react';
import { ShoppingBag, Search, UtensilsCrossed } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { PublicMenuData, PublicProduct } from '@/features/catalog/queries';
import type { Raffle } from '@/features/raffles/types';
import { MenuHeader } from './MenuHeader';
import { CategoryNav } from './CategoryNav';
import { ProductCard } from './ProductCard';
import { ReelsProductCard } from './ReelsProductCard';
import { ProductCustomizerModal } from './ProductCustomizerModal';
import { ProductInfoModal } from './ProductInfoModal';
import { CustomerProfileModal } from './CustomerProfileModal';
import { CustomerOrdersModal } from '@/features/orders/components/CustomerOrdersModal';
import { CartProvider, useCart } from '@/features/orders/context/CartContext';
import { CartDrawer } from '@/features/orders/components/CartDrawer';
import { resolveThemeTokens, generateCssVariables } from '../presets';
import { CurtainDoorsEntrance } from './CurtainDoorsEntrance';

interface PublicMenuViewProps {
  menuData: PublicMenuData;
  initialRaffles?: Raffle[];
}

function MenuContent({
  menuData,
  initialRaffles = [],
}: {
  menuData: PublicMenuData;
  initialRaffles?: Raffle[];
}) {
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);
  const [infoProduct, setInfoProduct] = useState<PublicProduct | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const reelsContainerRef = React.useRef<HTMLDivElement>(null);

  const { tenant, settings, categories, theme } = menuData;
  const mobileViewMode = (theme?.layoutConfig?.mobileViewMode as 'reels' | 'grid') || 'reels';
  const { addItem, totalCount, totalAmount, setIsCartOpen } = useCart();

  // Resolver tokens de diseño y variables CSS en runtime
  const themeTokens = resolveThemeTokens(theme.presetCode, theme.tokens);
  const cssVars = generateCssVariables(themeTokens);

  // Total de productos disponibles en toda la carta
  const totalProductsCount = useMemo(() => {
    return categories.reduce((sum, c) => sum + c.products.length, 0);
  }, [categories]);

  // Filtrado reactivo en tiempo real por categoría y búsqueda
  const filteredCategories = useMemo(() => {
    return categories
      .filter((cat) => {
        if (selectedCategoryId === 'all') return true;
        return cat.id === selectedCategoryId;
      })
      .map((cat) => {
        const matchingProducts = cat.products.filter((p) => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchDesc = p.description ? p.description.toLowerCase().includes(q) : false;
          return matchName || matchDesc;
        });

        return {
          ...cat,
          products: matchingProducts,
        };
      })
      .filter((cat) => cat.products.length > 0);
  }, [categories, selectedCategoryId, searchQuery]);

  // Lista aplanada con nombre de categoría para el feed estilo Reels
  const allFilteredProducts = useMemo(() => {
    return filteredCategories.flatMap((cat) =>
      cat.products.map((prod) => ({
        ...prod,
        categoryName: cat.name,
      }))
    );
  }, [filteredCategories]);

  const activeRafflesCount = initialRaffles.filter((r) => r.status === 'active').length;

  const scrollToCard = (targetIndex: number) => {
    if (!reelsContainerRef.current) return;
    const container = reelsContainerRef.current;
    const cardHeight = container.clientHeight;
    container.scrollTo({
      top: targetIndex * cardHeight,
      behavior: 'smooth',
    });
  };

  return (
    <div
      style={{
        ...cssVars,
      }}
      className="min-h-screen bg-[#f0f4fc] dark:bg-[#0a0d14] text-slate-800 dark:text-[#edf2f7] flex flex-col antialiased selection:bg-[#1d64f2] selection:text-white pb-28 sm:pb-32 transition-colors duration-200"
    >
      {/* Transición de entrada estilo Curtain Doors (Motion) */}
      <CurtainDoorsEntrance tenantName={tenant.name} logoUrl={tenant.logoUrl} />

      {/* 1. Header con Navbar superior, logo, slogan y banner centrado */}
      <MenuHeader
        tenant={tenant}
        settings={settings}
        onOpenMyOrders={() => setIsMyOrdersOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        activeRafflesCount={activeRafflesCount}
        onOpenCart={() => setIsCartOpen(true)}
        cartCount={totalCount}
      />

      {/* 2. Sección "Nuestra Carta" con buscador y píldoras */}
      <CategoryNav
        categories={categories}
        totalProductsCount={totalProductsCount}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 3. Contenido Principal: Listado de Categorías y Productos */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-3 sm:pt-6 space-y-6 sm:space-y-10 pb-24 sm:pb-28">
        {allFilteredProducts.length === 0 ? (
          <div className="p-12 text-center border border-slate-200/80 dark:border-slate-800 rounded-3xl bg-white dark:bg-[#111827] space-y-3.5 mt-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <UtensilsCrossed className="w-12 h-12 text-slate-400 mx-auto opacity-70" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {searchQuery
                ? `No se encontraron resultados para "${searchQuery}"`
                : 'No hay productos en esta sección'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Probá seleccionando otra categoría o borrando el término de búsqueda.
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ backgroundColor: 'var(--theme-primary, #68132d)' }}
                className="py-2.5 px-5 rounded-2xl hover:brightness-110 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <>
            {/* 1. VISTA EXCLUSIVA MÓVIL (sm:hidden): Reels o Grilla según configuración */}
            <div className="sm:hidden">
              {settings.cardStyle === 'vintage' ? (
                /* MODO VINTAGE EN MÓVIL */
                <div className="space-y-6">
                  {filteredCategories.map((category) => (
                    <div key={category.id} className="space-y-3">
                      <div className="border-2 border-[#ff4d00] dark:border-[#ff621f] rounded-2xl px-5 py-2 inline-flex items-center gap-2.5 shadow-xs bg-white dark:bg-[#111827]">
                        <span className="w-3 h-3 rounded-full bg-[#ff4d00] shrink-0" />
                        <span className="text-[#ff4d00] dark:text-[#ff621f] font-black text-xs uppercase tracking-wider">
                          {category.name}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
                        {category.products.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            categoryName={category.name}
                            currency={settings.currency}
                            isPaused={settings.isOrderingPaused}
                            layout={themeTokens.cards.layout}
                            cardStyle="vintage"
                            onSelectProduct={(p) => setSelectedProduct(p)}
                            onOpenInfo={(p) => setInfoProduct(p)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : mobileViewMode === 'reels' ? (
                /* MODO REELS EN MÓVIL (Swipe vertical card por card) */
                <div
                  ref={reelsContainerRef}
                  className="w-full h-[calc(100dvh-195px)] min-h-[500px] max-h-[630px] overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar overscroll-y-contain rounded-3xl shadow-2xl"
                  style={{ scrollSnapType: 'y mandatory' }}
                >
                  {allFilteredProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="w-full h-full snap-start snap-always pb-3"
                    >
                      <ReelsProductCard
                        product={product}
                        categoryName={product.categoryName}
                        currency={settings.currency}
                        isPaused={settings.isOrderingPaused}
                        currentIndex={index + 1}
                        totalCount={allFilteredProducts.length}
                        onSelectProduct={(p) => setSelectedProduct(p)}
                        onOpenInfo={(p) => setInfoProduct(p)}
                        onNext={() => scrollToCard(index + 1)}
                        onPrev={() => scrollToCard(index - 1)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* MODO GRILLA EN MÓVIL (Lista estándar vertical) */
                <div className="grid grid-cols-1 gap-4">
                  {allFilteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      categoryName={product.categoryName}
                      currency={settings.currency}
                      isPaused={settings.isOrderingPaused}
                      layout={themeTokens.cards.layout}
                      cardStyle={settings.cardStyle}
                      onSelectProduct={(p) => setSelectedProduct(p)}
                      onOpenInfo={(p) => setInfoProduct(p)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 2. VISTA EXCLUSIVA ESCRITORIO / PC (hidden sm:block): SIEMPRE GRILLA TRADICIONAL */}
            <div className="hidden sm:block">
              {settings.cardStyle === 'vintage' ? (
                /* MODO VINTAGE EN ESCRITORIO */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                  {filteredCategories.map((category) => (
                    <div key={category.id} className="space-y-3">
                      <div className="border-2 border-[#ff4d00] dark:border-[#ff621f] rounded-2xl px-6 py-2.5 inline-flex items-center gap-3 shadow-xs bg-white dark:bg-[#111827]">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#ff4d00] shrink-0" />
                        <span className="text-[#ff4d00] dark:text-[#ff621f] font-black text-xs sm:text-sm uppercase tracking-wider">
                          {category.name}
                        </span>
                      </div>

                      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
                        {category.products.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            categoryName={category.name}
                            currency={settings.currency}
                            isPaused={settings.isOrderingPaused}
                            layout={themeTokens.cards.layout}
                            cardStyle="vintage"
                            onSelectProduct={(p) => setSelectedProduct(p)}
                            onOpenInfo={(p) => setInfoProduct(p)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* CUADRÍCULA ESTÁNDAR EN ESCRITORIO (2 a 3 columnas) */
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {allFilteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      categoryName={product.categoryName}
                      currency={settings.currency}
                      isPaused={settings.isOrderingPaused}
                      layout={themeTokens.cards.layout}
                      cardStyle={settings.cardStyle}
                      onSelectProduct={(p) => setSelectedProduct(p)}
                      onOpenInfo={(p) => setInfoProduct(p)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Modal de Información del Producto (Solo Info al tocar la card) */}
      <ProductInfoModal
        product={infoProduct}
        categoryName={infoProduct?.categoryName}
        currency={settings.currency}
        isOpen={Boolean(infoProduct)}
        onClose={() => setInfoProduct(null)}
        onOrderNow={(p) => setSelectedProduct(p)}
      />

      {/* Modal de Personalización de Producto / Opcionales */}
      <ProductCustomizerModal
        product={selectedProduct}
        currency={settings.currency}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(item) => addItem(item)}
      />

      {/* Modal de "Mi Perfil" & Sorteos del Negocio */}
      <CustomerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        tenantSlug={tenant.slug}
        tenantName={tenant.name}
        raffles={initialRaffles}
      />

      {/* Modal de "Mis Pedidos" con búsqueda por Nombre y Apellido */}
      <CustomerOrdersModal
        isOpen={isMyOrdersOpen}
        onClose={() => setIsMyOrdersOpen(false)}
        tenantId={tenant.id}
        tenantSlug={tenant.slug}
        tenantName={tenant.name}
        currency={settings.currency}
      />

      {/* Botón Flotante del Carrito (Abajo) */}
      {!settings.isOrderingPaused && totalCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            style={{ backgroundColor: 'var(--theme-primary, #1d64f2)' }}
            className="w-full sm:w-auto py-3.5 px-6 rounded-2xl text-white font-black text-sm flex items-center justify-between sm:justify-center gap-4 shadow-2xl shadow-black/40 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer border border-white/20 backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                <span className="absolute -top-2.5 -right-2.5 min-w-4.5 h-4.5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs border-2 border-white">
                  {totalCount}
                </span>
              </div>
              <span className="text-xs sm:text-sm uppercase tracking-wider font-extrabold">Ver Mi Pedido</span>
            </div>

            <span className="font-mono text-sm font-black bg-white/20 px-2.5 py-1 rounded-xl">
              {formatCurrency(totalAmount, settings.currency)}
            </span>
          </button>
        </div>
      )}

      {/* Drawer Desplegable de Carrito y Checkout */}
      <CartDrawer
        tenantId={tenant.id}
        tenantSlug={tenant.slug}
        currency={settings.currency}
        acceptsCash={settings.acceptsCash}
        acceptsMercadoPago={settings.acceptsMercadoPago}
        currentPrepTimeMinutes={settings.currentPreparationTimeMinutes}
      />
    </div>
  );
}

export function PublicMenuView({
  menuData,
  initialRaffles = [],
}: PublicMenuViewProps) {
  return (
    <CartProvider tenantSlug={menuData.tenant.slug}>
      <MenuContent menuData={menuData} initialRaffles={initialRaffles} />
    </CartProvider>
  );
}
