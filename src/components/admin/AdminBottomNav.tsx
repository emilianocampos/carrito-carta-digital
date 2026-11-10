'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Flame,
  Palette,
  MoreHorizontal,
  X,
  CreditCard,
  Sparkles,
  Zap,
  ExternalLink,
  UtensilsCrossed,
  Trophy,
  Settings,
  QrCode,
} from 'lucide-react';

interface AdminBottomNavProps {
  tenantSlug: string;
  pendingCount?: number;
}

export function AdminBottomNav({ tenantSlug, pendingCount = 0 }: AdminBottomNavProps) {
  const pathname = usePathname() || '';
  const [showMoreModal, setShowMoreModal] = useState(false);

  const isDashboardActive = pathname.endsWith('/dashboard');
  const isOrdersActive = pathname.includes('/orders');
  const isCustomersActive = pathname.includes('/customers');
  const isThemeActive = pathname.includes('/theme');
  const isMoreActive =
    pathname.includes('/settings') ||
    pathname.includes('/ai') ||
    pathname.includes('/menu') ||
    pathname.includes('/raffles') ||
    pathname.includes('/qr');

  const moreItems = [
    {
      title: 'Productos & Categorías',
      desc: 'Gestión de platos, combos, precios y opcionales',
      href: `/admin/${tenantSlug}/menu`,
      icon: UtensilsCrossed,
      color: 'text-sky-500 dark:text-sky-400',
      bgColor: 'bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/60',
    },
    {
      title: 'Código QR & Cartelería',
      desc: 'Cartel A4 para la plaza y link de Instagram',
      href: `/admin/${tenantSlug}/qr`,
      icon: QrCode,
      color: 'text-amber-500 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/60',
    },
    {
      title: 'Sorteos & Concursos',
      desc: 'Premios virales y fidelización activa',
      href: `/admin/${tenantSlug}/raffles`,
      icon: Trophy,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/60',
    },
    {
      title: 'Estudio de IA Gastronómica',
      desc: 'OCR de cartas y copys automáticos',
      href: `/admin/${tenantSlug}/ai`,
      icon: Sparkles,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-900/60',
    },
    {
      title: 'Configuración General',
      desc: 'Mercado Pago, cobros y suscripción',
      href: `/admin/${tenantSlug}/settings`,
      icon: Settings,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60',
    },
    {
      title: 'Ver Carta Digital',
      desc: 'Vista previa pública en tiempo real',
      href: `/c/${tenantSlug}`,
      icon: ExternalLink,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60',
      targetBlank: true,
    },
  ];

  return (
    <>
      {/* 1. BARRA INFERIOR FLOTANTE CON GLASSMORFISMO */}
      <nav
        aria-label="Navegación móvil"
        className="fixed bottom-3 left-3 right-3 sm:left-10 sm:right-10 max-w-md mx-auto lg:hidden z-40 pointer-events-none"
      >
        <div className="pointer-events-auto backdrop-blur-2xl bg-white/95 dark:bg-[#0e131f]/95 border border-slate-200/90 dark:border-[#222d46] shadow-xl shadow-slate-900/10 dark:shadow-black/60 rounded-full px-3 py-1.5 flex items-center justify-between">
          {/* 1. Inicio (Dashboard) */}
          <Link
            id="tour-mobile-dashboard"
            href={`/admin/${tenantSlug}/dashboard`}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 active:scale-95 ${
              isDashboardActive ? 'text-[#1d64f2] dark:text-[#60a5fa]' : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Home className={`w-5 h-5 ${isDashboardActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {isDashboardActive ? (
              <span className="w-1.5 h-1.5 rounded-full bg-[#1d64f2] dark:bg-[#60a5fa] mt-1" />
            ) : (
              <span className="w-1.5 h-1.5 mt-1" />
            )}
          </Link>

          {/* 2. Clientes (CRM) */}
          <Link
            id="tour-mobile-customers"
            href={`/admin/${tenantSlug}/customers`}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 active:scale-95 ${
              isCustomersActive ? 'text-[#1d64f2] dark:text-[#60a5fa]' : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className={`w-5 h-5 ${isCustomersActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {isCustomersActive ? (
              <span className="w-1.5 h-1.5 rounded-full bg-[#1d64f2] dark:bg-[#60a5fa] mt-1" />
            ) : (
              <span className="w-1.5 h-1.5 mt-1" />
            )}
          </Link>

          {/* 3. BOTÓN CENTRAL DESTACADO: Cocina KDS */}
          <div className="flex-1 flex justify-center -mt-6">
            <Link
              id="tour-mobile-orders"
              href={`/admin/${tenantSlug}/orders`}
              className="relative w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#1d64f2] via-[#2563eb] to-[#38bdf8] text-white flex items-center justify-center font-black shadow-lg shadow-[#1d64f2]/35 active:scale-90 transition-transform border-[3px] border-[#f0f4fc] dark:border-[#0a0d14]"
              title="Comandera de Cocina"
            >
              <Flame className="w-6 h-6 fill-current stroke-1" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse shadow-md">
                  {pendingCount}
                </span>
              )}
            </Link>
          </div>

          {/* 4. Diseño Visual */}
          <Link
            id="tour-mobile-theme"
            href={`/admin/${tenantSlug}/theme`}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 active:scale-95 ${
              isThemeActive ? 'text-[#1d64f2] dark:text-[#60a5fa]' : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Palette className={`w-5 h-5 ${isThemeActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {isThemeActive ? (
              <span className="w-1.5 h-1.5 rounded-full bg-[#1d64f2] dark:bg-[#60a5fa] mt-1" />
            ) : (
              <span className="w-1.5 h-1.5 mt-1" />
            )}
          </Link>

          {/* 5. Botón MÁS */}
          <button
            id="tour-mobile-more"
            type="button"
            onClick={() => setShowMoreModal(true)}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 active:scale-95 ${
              isMoreActive || showMoreModal ? 'text-[#1d64f2] dark:text-[#60a5fa]' : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MoreHorizontal className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[9px] font-black mt-0.5 leading-none">Más</span>
            {isMoreActive || showMoreModal ? (
              <span className="w-1.5 h-1.5 rounded-full bg-[#1d64f2] dark:bg-[#60a5fa] mt-1" />
            ) : (
              <span className="w-1.5 h-1.5 mt-1" />
            )}
          </button>
        </div>
      </nav>

      {/* 2. MODAL CENTRADO "MÁS OPCIONES" CON ANIMACIONES SMOOTH */}
      {showMoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:hidden">
          {/* Fondo desenfocado con fade */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity animate-fade-overlay"
            onClick={() => setShowMoreModal(false)}
          />

          {/* Contenedor del Modal Centrado */}
          <div className="relative z-10 w-full max-w-sm sm:max-w-md backdrop-blur-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl transition-all duration-300 animate-modal-pop max-h-[85vh] flex flex-col space-y-4">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Más Opciones</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Acceso rápido a herramientas del sistema</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-all duration-150 active:scale-95 hover:bg-slate-200 dark:hover:bg-slate-700"
                aria-label="Cerrar modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Listado de Opciones Adicionales */}
            <div className="grid grid-cols-1 gap-2.5 overflow-y-auto no-scrollbar pr-0.5 pt-0.5">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    target={item.targetBlank ? '_blank' : undefined}
                    onClick={() => setShowMoreModal(false)}
                    className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-500 flex items-center justify-between transition-all duration-200 group active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${item.bgColor} ${item.color} flex items-center justify-center font-black shrink-0 transition-transform duration-200 group-hover:scale-105`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all duration-200 group-hover:translate-x-0.5">
                      →
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
