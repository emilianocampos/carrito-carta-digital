'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Languages,
  Sun,
  Moon,
  LayoutGrid,
  Bell,
  User,
  Settings,
  CreditCard,
  DollarSign,
  HelpCircle,
  LogOut,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AdminNavbarProps {
  tenantSlug: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  pendingCount?: number;
}

export function AdminNavbar({
  tenantSlug,
  userName = 'John Doe',
  userEmail = 'admin@vuexy.com',
  userRole = 'Admin',
  pendingCount = 0,
}: AdminNavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown si se hace click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 px-4 sm:px-6 pt-3 pb-1">
        <div className="bg-white/90 backdrop-blur-md rounded-xl border border-[#ebe9f1] shadow-[0_2px_9px_0_rgba(47,43,61,0.06)] px-4 py-2.5 flex items-center justify-between transition-all">
          {/* 1. IZQUIERDA: BUSCADOR [CTRL + K] */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2.5 text-[#82808b] hover:text-[#2f2b3d] text-sm w-full py-1 text-left transition-colors group cursor-pointer"
            >
              <Search className="w-4 h-4 text-[#82808b] group-hover:text-[#7367f0] transition-colors" />
              <span className="text-xs sm:text-sm font-normal text-[#a5a3ae]">
                Search [CTRL + K]
              </span>
            </button>
          </div>

          {/* 2. DERECHA: ICONOS DE ACCIÓN Y PERFIL */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Selector de idioma */}
            <button
              type="button"
              aria-label="Language selector"
              className="p-2 rounded-lg text-[#6f6b7d] hover:text-[#7367f0] hover:bg-[#f4f3fe] transition-colors relative"
              title="Idioma: Español / English"
            >
              <Languages className="w-[18px] h-[18px]" />
            </button>

            {/* Selector de Tema (Modo Claro / Oscuro) */}
            <ThemeToggle className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" />

            {/* Accesos rápidos (Apps Grid) */}
            <button
              type="button"
              aria-label="Apps shortcuts"
              className="p-2 rounded-lg text-[#6f6b7d] hover:text-[#7367f0] hover:bg-[#f4f3fe] transition-colors"
              title="Accesos rápidos"
            >
              <LayoutGrid className="w-[18px] h-[18px]" />
            </button>

            {/* Campanita de Notificaciones con Badge */}
            <Link
              href={`/admin/${tenantSlug}/orders`}
              aria-label="Notificaciones de pedidos"
              className="p-2 rounded-lg text-[#6f6b7d] hover:text-[#7367f0] hover:bg-[#f4f3fe] transition-colors relative"
              title="Pedidos pendientes"
            >
              <Bell className="w-[18px] h-[18px]" />
              {pendingCount > 0 ? (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ea5455] ring-2 ring-white animate-pulse" />
              ) : (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ea5455] ring-2 ring-white" />
              )}
            </Link>

            {/* AVATAR DE USUARIO CON STATUS ONLINE Y DROPDOWN EXACTO A VUEXY */}
            <div className="relative ml-1 sm:ml-2" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="relative flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-[#7367f0] focus:ring-offset-2 transition-all cursor-pointer"
                aria-expanded={isDropdownOpen}
                aria-label="Menú de usuario"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border border-[#ebe9f1] bg-slate-100 relative">
                  <Image
                    src="/images/vuexy-admin-avatar.jpg"
                    alt="John Doe"
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
                {/* Punto Verde de Estado Online */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#28c76f] rounded-full ring-2 ring-white" />
              </button>

              {/* DROPDOWN POPOVER (IDÉNTICO A LA CAPTURA VUEXY) */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-60 bg-white rounded-xl shadow-[0_5px_25px_0_rgba(47,43,61,0.16)] border border-[#ebe9f1] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Encabezado del Perfil */}
                  <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#ebe9f1]">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-[#ebe9f1] bg-slate-100">
                        <Image
                          src="/images/vuexy-admin-avatar.jpg"
                          alt="John Doe"
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#28c76f] rounded-full ring-2 ring-white" />
                    </div>
                    <div className="truncate">
                      <h4 className="text-sm font-bold text-[#2f2b3d] leading-snug truncate">
                        {userName}
                      </h4>
                      <p className="text-xs text-[#a5a3ae] font-medium leading-none truncate">
                        {userRole}
                      </p>
                    </div>
                  </div>

                  {/* Lista de enlaces del Menú */}
                  <div className="py-1">
                    <Link
                      href={`/admin/${tenantSlug}/settings/billing`}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-[#6f6b7d] hover:bg-[#f8f7fa] hover:text-[#7367f0] transition-colors"
                    >
                      <User className="w-4 h-4 text-[#a5a3ae]" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      href={`/admin/${tenantSlug}/settings/billing`}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-[#6f6b7d] hover:bg-[#f8f7fa] hover:text-[#7367f0] transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[#a5a3ae]" />
                      <span>Settings</span>
                    </Link>

                    <Link
                      href={`/admin/${tenantSlug}/settings/billing`}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center justify-between px-4 py-2 text-xs font-semibold text-[#6f6b7d] hover:bg-[#f8f7fa] hover:text-[#7367f0] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-4 h-4 text-[#a5a3ae]" />
                        <span>Billing</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#ea5455] text-white text-[10px] font-bold">
                        4
                      </span>
                    </Link>

                    <Link
                      href={`/admin/${tenantSlug}/settings/billing`}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-[#6f6b7d] hover:bg-[#f8f7fa] hover:text-[#7367f0] transition-colors"
                    >
                      <DollarSign className="w-4 h-4 text-[#a5a3ae]" />
                      <span>Pricing</span>
                    </Link>

                    <Link
                      href={`/admin/${tenantSlug}/dashboard`}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-[#6f6b7d] hover:bg-[#f8f7fa] hover:text-[#7367f0] transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 text-[#a5a3ae]" />
                      <span>FAQ</span>
                    </Link>
                  </div>

                  {/* Separador y Botón Rojo de Logout */}
                  <div className="pt-1 px-3 border-t border-[#ebe9f1] mt-1">
                    <form action="/auth/signout" method="post">
                      <button
                        type="submit"
                        className="w-full py-2 px-3 rounded-lg bg-[#ff4c51] hover:bg-[#e03d3e] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-red-500/25 transition-all cursor-pointer"
                      >
                        <span>Logout</span>
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MODAL DE BUSCADOR RÁPIDO (CTRL+K) */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-800">
            <div className="flex items-center px-4 border-b border-slate-100 py-3.5 gap-3 bg-slate-50/70">
              <Search className="w-5 h-5 text-indigo-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar pedidos, productos, mesas, configuración..."
                className="w-full text-xs sm:text-sm outline-none bg-transparent text-slate-800 placeholder-slate-400 font-medium"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-xs bg-slate-200/70 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-xl border border-slate-300/60 font-semibold cursor-pointer"
              >
                ESC
              </button>
            </div>
            <div className="p-3 text-xs text-slate-500 space-y-1">
              <p className="px-2 py-1 font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                Navegación Rápida
              </p>
              <Link
                href={`/admin/${tenantSlug}/dashboard`}
                onClick={() => setIsSearchOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100/80 hover:text-slate-900 font-medium transition-colors"
              >
                <span>Analytics Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                href={`/admin/${tenantSlug}/orders`}
                onClick={() => setIsSearchOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100/80 hover:text-slate-900 font-medium transition-colors"
              >
                <span>Comandera & Pedidos</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                href={`/admin/${tenantSlug}/menu`}
                onClick={() => setIsSearchOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100/80 hover:text-slate-900 font-medium transition-colors"
              >
                <span>Productos & Carta</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* BOTÓN FLOTANTE PÚRPURA DE CUSTOMIZER EN EL BORDE DERECHO (ESTILO VUEXY) */}
      <button
        type="button"
        aria-label="Abrir customizer de tema"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-[#7367f0] hover:bg-[#5f52e6] text-white p-2.5 rounded-l-xl shadow-lg shadow-purple-500/30 cursor-pointer hidden sm:flex items-center justify-center transition-all group"
        title="Vuexy Customizer"
      >
        <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </>
  );
}
