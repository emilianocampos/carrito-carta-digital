'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  MapPin,
  Gift,
  Box,
  Sparkles,
  Palette,
  QrCode,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Radio,
  ExternalLink,
} from 'lucide-react';

interface AdminSidebarProps {
  tenantSlug: string;
  tenantName: string;
  pendingCount?: number;
}

export function AdminSidebar({
  tenantSlug,
  tenantName,
  pendingCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [isDashboardsOpen, setIsDashboardsOpen] = useState(true);

  const isDashboardActive = pathname === `/admin/${tenantSlug}/dashboard` || pathname === `/admin/${tenantSlug}`;
  const isOrdersActive = pathname.startsWith(`/admin/${tenantSlug}/orders`);
  const isProductsActive = pathname === `/admin/${tenantSlug}/menu`;
  const isCustomersActive = pathname.startsWith(`/admin/${tenantSlug}/customers`);
  const isRafflesActive = pathname.startsWith(`/admin/${tenantSlug}/raffles`);
  const isAiActive = pathname.startsWith(`/admin/${tenantSlug}/ai`);
  const isThemeActive = pathname.startsWith(`/admin/${tenantSlug}/theme`);
  const isSettingsActive = pathname.startsWith(`/admin/${tenantSlug}/settings`);

  return (
    <aside className="hidden lg:flex flex-col w-[260px] bg-white border-r border-[#ebe9f1] shrink-0 sticky top-0 h-screen z-30 select-none shadow-[0_2px_14px_0_rgba(47,43,61,0.06)]">
      {/* 1. BRAND HEADER (Vuexy Stylized V Logo + Brand Name + Pin Dot) */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[#ebe9f1]/60">
        <Link href={`/admin/${tenantSlug}/dashboard`} className="flex items-center gap-3 group">
          {/* Vuexy Folded Ribbon V Logo */}
          <div className="w-8 h-8 shrink-0 flex items-center justify-center">
            <svg
              width="32"
              height="22"
              viewBox="0 0 32 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-sm group-hover:scale-105 transition-transform"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0.00172773 0V6.85398C0.00172773 6.85398 -0.133178 9.01207 1.98092 10.8388L13.6912 21.9964L19.7809 21.9181L18.8042 9.88248L16.4951 7.17289L9.23799 0H0.00172773Z"
                fill="#7367F0"
              />
              <path
                opacity="0.08"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.69824 16.4364L12.5199 3.23696L16.5541 7.25596L7.69824 16.4364Z"
                fill="#161616"
              />
              <path
                opacity="0.18"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.07751 15.9175L13.9419 4.63989L16.5849 7.28475L8.07751 15.9175Z"
                fill="#161616"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.77295 16.3566L23.6563 0H32V6.88383C32 6.88383 31.8262 9.17836 30.6591 10.4057L19.7824 22H13.6938L7.77295 16.3566Z"
                fill="#7367F0"
              />
            </svg>
          </div>

          <div className="truncate">
            <h1 className="font-bold text-[20px] text-[#2f2b3d] tracking-tight leading-tight">
              Vuexy
            </h1>
            <span className="text-[10px] text-[#a5a3ae] font-semibold truncate block">
              {tenantName}
            </span>
          </div>
        </Link>

        {/* Pin / Collapse Circle Icon */}
        <button
          type="button"
          aria-label="Toggle navigation pin"
          className="text-[#7367f0] hover:text-[#5f52e6] transition-colors p-1 rounded-full hover:bg-[#f4f3fe]"
        >
          <CircleDot className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* 2. MENU ITEMS (Organizado al estilo exacto de Vuexy) */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1 text-sm no-scrollbar">
        {/* GRUPO 1: DASHBOARDS (Con badge y subitems) */}
        <div>
          <button
            type="button"
            onClick={() => setIsDashboardsOpen(!isDashboardsOpen)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
              isDashboardActive
                ? 'text-[#2f2b3d] bg-[#f8f7fa]'
                : 'text-[#6f6b7d] hover:bg-[#f8f7fa] hover:text-[#2f2b3d]'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-[18px] h-[18px] text-[#7367f0]" />
              <span>Dashboards</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#ea5455] text-white text-[11px] font-bold leading-none shadow-sm shadow-red-500/20">
                5
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[#a5a3ae] transition-transform duration-200 ${
                  isDashboardsOpen ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </div>
          </button>

          {/* Subitems Dashboards */}
          {isDashboardsOpen && (
            <div className="mt-1 pl-4 space-y-1">
              {/* Analytics / Dashboard Principal (ACTIVO) */}
              <Link
                href={`/admin/${tenantSlug}/dashboard`}
                className={`flex items-center gap-3 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  isDashboardActive
                    ? 'bg-gradient-to-r from-[#7367f0] to-[#8f85f3] text-white shadow-[0_2px_6px_0_rgba(115,103,240,0.48)]'
                    : 'text-[#6f6b7d] hover:bg-[#f8f7fa] hover:text-[#7367f0]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full border ${
                    isDashboardActive ? 'border-white bg-white' : 'border-[#6f6b7d]'
                  }`}
                />
                <span>Analytics</span>
              </Link>

              {/* Subitems secundarios visuales de Vuexy para estética idéntica */}
              <Link
                href={`/admin/${tenantSlug}/dashboard`}
                className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-[13px] font-medium text-[#6f6b7d] hover:bg-[#f8f7fa] hover:text-[#7367f0] transition-all"
              >
                <span className="w-2 h-2 rounded-full border border-[#a5a3ae]" />
                <span>CRM</span>
              </Link>

              <Link
                href={`/admin/${tenantSlug}/dashboard`}
                className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-[13px] font-medium text-[#6f6b7d] hover:bg-[#f8f7fa] hover:text-[#7367f0] transition-all"
              >
                <span className="w-2 h-2 rounded-full border border-[#a5a3ae]" />
                <span>eCommerce</span>
              </Link>

              <Link
                href={`/admin/${tenantSlug}/dashboard`}
                className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-[13px] font-medium text-[#6f6b7d] hover:bg-[#f8f7fa] hover:text-[#7367f0] transition-all"
              >
                <span className="w-2 h-2 rounded-full border border-[#a5a3ae]" />
                <span>Logistics</span>
              </Link>

              <Link
                href={`/admin/${tenantSlug}/dashboard`}
                className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-[13px] font-medium text-[#6f6b7d] hover:bg-[#f8f7fa] hover:text-[#7367f0] transition-all"
              >
                <span className="w-2 h-2 rounded-full border border-[#a5a3ae]" />
                <span>Academy</span>
              </Link>
            </div>
          )}
        </div>

        {/* SECCIÓN: APPS & PAGES */}
        <div className="pt-3 pb-1">
          <span className="px-3 text-[11px] font-bold text-[#a5a3ae] tracking-wider uppercase block">
            APPS & PAGES
          </span>
        </div>

        {/* 1. Pedidos (Comandera KDS) */}
        <Link
          href={`/admin/${tenantSlug}/orders`}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
            isOrdersActive
              ? 'bg-gradient-to-r from-[#7367f0] to-[#8f85f3] text-white shadow-[0_2px_6px_0_rgba(115,103,240,0.48)]'
              : 'text-[#6f6b7d] hover:bg-[#f8f7fa] hover:text-[#2f2b3d]'
          }`}
        >
          <div className="flex items-center gap-3">
            <ShoppingBag className={`w-[18px] h-[18px] ${isOrdersActive ? 'text-white' : 'text-[#ff9f43]'}`} />
            <span>Pedidos (KDS)</span>
          </div>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#ea5455] text-white text-[11px] font-bold animate-pulse">
              {pendingCount}
            </span>
          )}
        </Link>

        {/* 2. Productos */}
        <Link
          href={`/admin/${tenantSlug}/menu`}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
            isProductsActive
              ? 'bg-gradient-to-r from-[#7367f0] to-[#8f85f3] text-white shadow-[0_2px_6px_0_rgba(115,103,240,0.48)]'
              : 'text-[#6f6b7d] hover:bg-[#f8f7fa] hover:text-[#2f2b3d]'
          }`}
        >
          <div className="flex items-center gap-3">
            <Package className={`w-[18px] h-[18px] ${isProductsActive ? 'text-white' : 'text-[#00cfe8]'}`} />
            <span>Productos</span>
          </div>
        </Link>

        {/* 3. Categorías */}
        <Link
          href={`/admin/${tenantSlug}/menu`}
          className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-semibold text-[#6f6b7d] hover:bg-[#f8f7fa] hover:text-[#2f2b3d] transition-all"
        >
          <div className="flex items-center gap-3">
            <Layers className="w-[18px] h-[18px] text-[#7367f0]" />
            <span>Categorías</span>
          </div>
        </Link>

        {/* 4. Mesas & Carteles (Customers/Tables) */}
        <Link
          href={`/admin/${tenantSlug}/customers`}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
            isCustomersActive
              ? 'bg-gradient-to-r from-[#7367f0] to-[#8f85f3] text-white shadow-[0_2px_6px_0_rgba(115,103,240,0.48)]'
              : 'text-[#6f6b7d] hover:bg-[#f8f7fa] hover:text-[#2f2b3d]'
          }`}
        >
          <div className="flex items-center gap-3">
            <MapPin className={`w-[18px] h-[18px] ${isCustomersActive ? 'text-white' : 'text-[#ff9f43]'}`} />
            <span>Mesas & Carteles</span>
          </div>
        </Link>

        {/* SECCIÓN: MARKETING & CREATIVIDAD */}
        <div className="pt-3 pb-1">
          <span className="px-3 text-[11px] font-bold text-[#a5a3ae] tracking-wider uppercase block">
            MARKETING & DISEÑO
          </span>
        </div>

        {/* 5. Fidelización & Sorteos */}
        <Link
          href={`/admin/${tenantSlug}/raffles`}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
            isRafflesActive
              ? 'bg-gradient-to-r from-[#7367f0] to-[#8f85f3] text-white shadow-[0_2px_6px_0_rgba(115,103,240,0.48)]'
              : 'text-[#6f6b7d] hover:bg-[#f8f7fa] hover:text-[#2f2b3d]'
          }`}
        >
          <div className="flex items-center gap-3">
            <Gift className={`w-[18px] h-[18px] ${isRafflesActive ? 'text-white' : 'text-[#ea5455]'}`} />
            <span>Fidelización</span>
          </div>
        </Link>


        {/* 7. Importar Carta (IA) */}
        <Link
          href={`/admin/${tenantSlug}/ai`}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
            isAiActive
              ? 'bg-gradient-to-r from-[#7367f0] to-[#8f85f3] text-white shadow-[0_2px_6px_0_rgba(115,103,240,0.48)]'
              : 'text-[#6f6b7d] hover:bg-[#f8f7fa] hover:text-[#2f2b3d]'
          }`}
        >
          <div className="flex items-center gap-3">
            <Sparkles className={`w-[18px] h-[18px] ${isAiActive ? 'text-white' : 'text-[#00cfe8]'}`} />
            <span>Importar Carta</span>
          </div>
        </Link>

        {/* 8. Personalización */}
        <Link
          href={`/admin/${tenantSlug}/theme`}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
            isThemeActive
              ? 'bg-gradient-to-r from-[#7367f0] to-[#8f85f3] text-white shadow-[0_2px_6px_0_rgba(115,103,240,0.48)]'
              : 'text-[#6f6b7d] hover:bg-[#f8f7fa] hover:text-[#2f2b3d]'
          }`}
        >
          <div className="flex items-center gap-3">
            <Palette className={`w-[18px] h-[18px] ${isThemeActive ? 'text-white' : 'text-[#ea5455]'}`} />
            <span>Personalización</span>
          </div>
        </Link>

        {/* 9. Código QR & Cartelería */}
        <Link
          href={`/admin/${tenantSlug}/qr`}
          className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-semibold text-[#6f6b7d] hover:bg-[#f8f7fa] hover:text-[#2f2b3d] transition-all"
        >
          <div className="flex items-center gap-3">
            <QrCode className="w-[18px] h-[18px] text-[#ff9f43]" />
            <span>Código QR & Cartel</span>
          </div>
        </Link>

        {/* SECCIÓN: CONFIGURACIÓN */}
        <div className="pt-3 pb-1">
          <span className="px-3 text-[11px] font-bold text-[#a5a3ae] tracking-wider uppercase block">
            SISTEMA
          </span>
        </div>

        {/* 10. Configuración */}
        <Link
          href={`/admin/${tenantSlug}/settings/billing`}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
            isSettingsActive
              ? 'bg-gradient-to-r from-[#7367f0] to-[#8f85f3] text-white shadow-[0_2px_6px_0_rgba(115,103,240,0.48)]'
              : 'text-[#6f6b7d] hover:bg-[#f8f7fa] hover:text-[#2f2b3d]'
          }`}
        >
          <div className="flex items-center gap-3">
            <Settings className={`w-[18px] h-[18px] ${isSettingsActive ? 'text-white' : 'text-[#6f6b7d]'}`} />
            <span>Configuración</span>
          </div>
        </Link>
      </div>

      {/* 3. FOOTER DEL SIDEBAR */}
      <div className="p-3 border-t border-[#ebe9f1] space-y-1 bg-[#fafafc]">
        <Link
          href={`/c/${tenantSlug}`}
          target="_blank"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#2f2b3d] hover:bg-white hover:shadow-sm transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-[#28c76f] animate-pulse" />
          <span>Ver carta pública</span>
        </Link>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#ea5455] hover:bg-red-50 transition-all text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
