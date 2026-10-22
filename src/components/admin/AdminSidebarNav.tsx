'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Users,
  Gift,
  Box,
  Sparkles,
  Palette,
  CreditCard,
  Settings,
  ChevronRight,
  QrCode,
} from 'lucide-react';

interface AdminSidebarNavProps {
  tenantSlug: string;
  pendingCount?: number;
}

export function AdminSidebarNav({ tenantSlug, pendingCount = 0 }: AdminSidebarNavProps) {
  const pathname = usePathname() || '';

  const navItems = [
    {
      title: 'Dashboard',
      href: `/admin/${tenantSlug}/dashboard`,
      icon: LayoutDashboard,
      iconColor: 'text-[#818cf8]',
      isActive: pathname.endsWith('/dashboard'),
    },
    {
      title: 'Pedidos (KDS)',
      href: `/admin/${tenantSlug}/orders`,
      icon: ShoppingBag,
      iconColor: 'text-amber-400',
      isActive: pathname.includes('/orders'),
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      title: 'Productos',
      href: `/admin/${tenantSlug}/menu`,
      icon: Package,
      iconColor: 'text-sky-400',
      isActive: pathname.includes('/menu') && !pathname.includes('categories'),
    },
    {
      title: 'Categorías',
      href: `/admin/${tenantSlug}/menu?tab=categories`,
      icon: Layers,
      iconColor: 'text-purple-400',
      isActive: false,
    },
    {
      title: 'Clientes & Cupones',
      href: `/admin/${tenantSlug}/customers`,
      icon: Users,
      iconColor: 'text-emerald-400',
      isActive: pathname.includes('/customers'),
    },
    {
      title: 'Sorteos & Premios',
      href: `/admin/${tenantSlug}/raffles`,
      icon: Gift,
      iconColor: 'text-amber-500',
      isActive: pathname.includes('/raffles'),
    },
    {
      title: 'Personalización & Marca',
      href: `/admin/${tenantSlug}/theme`,
      icon: Palette,
      iconColor: 'text-purple-400',
      isActive: pathname.includes('/theme'),
    },
    {
      title: 'Estudio de IA',
      href: `/admin/${tenantSlug}/ai`,
      icon: Sparkles,
      iconColor: 'text-teal-400',
      isActive: pathname.includes('/ai'),
    },
    {
      title: 'Código QR & Cartel',
      href: `/admin/${tenantSlug}/qr`,
      icon: QrCode,
      iconColor: 'text-amber-500',
      isActive: pathname.includes('/qr'),
    },
    {
      title: 'Configuración',
      href: `/admin/${tenantSlug}/settings`,
      icon: Settings,
      iconColor: 'text-slate-400',
      isActive: pathname.includes('/settings'),
    },
  ];

  return (
    <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar pt-1" aria-label="Navegación principal">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.isActive;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
              active
                ? 'text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-[0_2px_8px_rgba(0,0,0,0.05)]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/80 dark:hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                  active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                }`}
              />
              <span className={active ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}>
                {item.title}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {item.badge && (
                <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200/60 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-[10px] font-black animate-pulse">
                  {item.badge}
                </span>
              )}
              {active && <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
