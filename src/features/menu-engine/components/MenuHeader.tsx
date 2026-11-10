'use client';

import React from 'react';
import Image from 'next/image';
import {
  MapPin,
  Phone,
  AlertCircle,
  User,
  Trophy,
  ShoppingCart,
  UtensilsCrossed,
  PackageSearch,
} from 'lucide-react';
import type { PublicMenuData } from '@/features/catalog/queries';
import { ThemeToggle } from '@/components/ThemeToggle';

interface MenuHeaderProps {
  tenant: PublicMenuData['tenant'];
  settings: PublicMenuData['settings'];
  onOpenProfile?: () => void;
  onOpenMyOrders?: () => void;
  activeRafflesCount?: number;
  onOpenCart?: () => void;
  cartCount?: number;
}

export function MenuHeader({
  tenant,
  settings,
  onOpenProfile,
  onOpenMyOrders,
  activeRafflesCount = 0,
  onOpenCart,
  cartCount = 0,
}: MenuHeaderProps) {
  const brandInitial = tenant.name ? tenant.name.charAt(0).toUpperCase() : 'C';
  const [scrollY, setScrollY] = React.useState(0);

  React.useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="relative w-full">
      {/* 1. NAVBAR STICKY SUPERIOR */}
      <div className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3 shadow-xs transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Logo + Nombre + Subtítulo */}
          <div className="flex items-center gap-3 min-w-0">
            {tenant.logoUrl ? (
              <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0 relative">
                <Image
                  src={tenant.logoUrl}
                  alt={`Logo ${tenant.name}`}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 shrink-0 overflow-hidden relative font-black text-base shadow-xs">
                {brandInitial}
              </div>
            )}

            <div className="truncate">
              <h2 className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white truncate leading-tight">
                {tenant.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate leading-tight">
                {settings.slogan || 'Delivery & Restaurante'}
              </p>
            </div>
          </div>

          {/* Botones Derecha: Selector de Tema + Perfil + Carrito */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Toggle de Modo Oscuro / Claro */}
            <ThemeToggle className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700 shadow-xs cursor-pointer" />

            {onOpenMyOrders && (
              <button
                type="button"
                onClick={onOpenMyOrders}
                className="py-2 px-3 sm:px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5 sm:gap-2 shadow-xs active:scale-95 group cursor-pointer"
                title="Consultá el estado de tu pedido en vivo con tu nombre y apellido"
              >
                <PackageSearch className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform stroke-[2.2]" />
                <span className="hidden xs:inline">Mis Pedidos</span>
              </button>
            )}

            {onOpenProfile && (
              <button
                type="button"
                onClick={onOpenProfile}
                className="py-2 px-3 sm:px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-2 shadow-xs active:scale-95 group cursor-pointer"
              >
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:scale-110 transition-transform" />
                  {activeRafflesCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  )}
                </div>
                <span className="hidden xs:inline">Mi Perfil</span>
                {activeRafflesCount > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[9px] uppercase font-black px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
                    <Trophy className="w-2.5 h-2.5" />
                    <span>Sorteo</span>
                  </span>
                )}
              </button>
            )}

            {onOpenCart && (
              <button
                type="button"
                onClick={onOpenCart}
                style={{ backgroundColor: 'var(--theme-primary, #1d64f2)' }}
                className="py-2.5 px-4 rounded-full hover:brightness-110 text-white font-bold text-xs shadow-md shadow-[#1d64f2]/30 active:scale-95 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Ver Carrito</span>
                {cartCount > 0 && (
                  <span
                    style={{ color: 'var(--theme-primary, #1d64f2)' }}
                    className="w-5 h-5 rounded-full bg-white text-[11px] font-black flex items-center justify-center shadow-xs"
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. PORTADA DEL NEGOCIO CON ANIMACIÓN PARALLAX */}
      <div className="relative w-full h-44 sm:h-56 md:h-64 overflow-hidden flex flex-col items-center justify-center text-center p-4 bg-slate-950 dark:bg-[#090d16] select-none">
        {tenant.bannerUrl && (
          <div
            className="absolute inset-x-0 -top-[15%] w-full h-[130%]"
            style={{
              transform: `translate3d(0, ${scrollY * 0.4}px, 0) scale(${scrollY < 0 ? 1 + Math.abs(scrollY) / 200 : 1.05
                })`,
              willChange: 'transform',
            }}
          >
            <Image
              src={tenant.bannerUrl}
              alt={tenant.name}
              fill
              priority
              className="object-cover"
            />
          </div>
        )}

        {/* Gradiente de profundidad Parallax */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/85 transition-opacity"
          style={{
            opacity: Math.min(0.9, 0.45 + (scrollY / 180) * 0.4),
          }}
        />

        {/* Info Centrada de la Portada con Colapso Suave Parallax */}
        <div
          className="relative z-10 flex flex-col items-center space-y-2 max-w-xl mx-auto text-white transition-transform"
          style={{
            opacity: Math.max(0, 1 - scrollY / 130),
            transform: `translate3d(0, ${-scrollY * 0.15}px, 0) scale(${Math.max(
              0.82,
              1 - scrollY / 380
            )})`,
            willChange: 'transform, opacity',
          }}
        >
          {/* Logo Circular Centrado */}
          <div
            style={{ backgroundColor: 'var(--theme-logo-bg, #ffffff)' }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[3px] border-white/90 dark:border-slate-700 overflow-hidden shadow-xl relative flex items-center justify-center p-1.5"
          >
            {tenant.logoUrl ? (
              <Image
                src={tenant.logoUrl}
                alt={`Logo de ${tenant.name}`}
                fill
                className="object-contain p-1"
              />
            ) : (
              <div
                style={{ backgroundColor: 'var(--theme-primary, #5865F2)' }}
                className="w-full h-full flex items-center justify-center text-2xl font-black text-white"
              >
                {brandInitial}
              </div>
            )}
          </div>

          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
            {tenant.name}
          </h1>

          {settings.slogan && (
            <p className="text-xs sm:text-sm text-white/90 font-medium max-w-md drop-shadow-xs">
              &ldquo;{settings.slogan}&rdquo;
            </p>
          )}

          {/* Badges Rápidos: Contacto */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
            {settings.address && (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-semibold shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span className="truncate max-w-[200px]">{settings.address}</span>
              </div>
            )}

            {settings.whatsappPhone && (
              <a
                href={`https://wa.me/${settings.whatsappPhone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/80 hover:bg-emerald-500 text-white font-bold backdrop-blur-md transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Alerta de Pedidos Pausados si aplica */}
      {settings.isOrderingPaused && (
        <div className="max-w-4xl mx-auto px-4 pt-3">
          <div className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900 dark:text-rose-100">Pedidos pausados temporalmente</p>
              <p className="text-rose-700 dark:text-rose-300 text-[11px] mt-0.5">
                {settings.pauseReason || 'El carrito no está recibiendo nuevos pedidos en este momento.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
