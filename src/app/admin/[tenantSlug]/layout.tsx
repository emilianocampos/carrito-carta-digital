import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, Search, ExternalLink, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireTenantMembership } from '@/features/auth/server';
import { AdminBottomNav } from '@/components/admin/AdminBottomNav';
import { AdminSidebarNav } from '@/components/admin/AdminSidebarNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AdminNotificationListener } from '@/features/notifications/components/AdminNotificationListener';

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    tenantSlug: string;
  }>;
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { tenantSlug } = await params;
  const supabase = await createClient();

  // 1. Validar Tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name, slug, status, logo_url')
    .eq('slug', tenantSlug)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  // 2. Validar autenticación y membresía mínima (staff)
  try {
    await requireTenantMembership(tenant.id, 'staff');
  } catch {
    redirect(`/login?redirect=/admin/${tenantSlug}/dashboard`);
  }

  // 3. Pedidos pendientes de hoy
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count: pendingOrdersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)
    .eq('order_status', 'pending')
    .gte('created_at', startOfDay.toISOString());

  const pendingCount = pendingOrdersCount ?? 0;

  return (
    <div className="min-h-screen bg-[#f0f4fc] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 flex antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* 1. SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[#e8edf5] dark:border-slate-800 bg-white dark:bg-[#0c1322] p-5 space-y-4 shrink-0 sticky top-0 h-screen shadow-[0_0_20px_rgba(0,0,0,0.02)] transition-colors">
        {/* Profile Header (Avatar circular + Nombre + Rol) */}
        <div className="flex items-center gap-3 px-1 pt-1 pb-1">
          {tenant.logo_url ? (
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
              <Image
                src={tenant.logo_url}
                alt={tenant.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200 dark:shadow-none">
              {tenant.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="truncate">
            <h2 className="font-bold text-slate-800 dark:text-white text-sm tracking-tight truncate">
              {tenant.name}
            </h2>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate block">
              Administrador
            </span>
          </div>
        </div>

        {/* Input Buscador estilo Píldora */}
        <div className="relative px-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search here"
            readOnly
            className="w-full bg-[#f8fafc] dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 rounded-full pl-9 pr-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 transition cursor-default"
          />
        </div>

        {/* Links de Navegación Sidebar */}
        <AdminSidebarNav tenantSlug={tenant.slug} pendingCount={pendingCount} />

        {/* Footer Sidebar (ThemeToggle + Ver carta pública + Cerrar sesión) */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between px-1 py-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Modo de Vista</span>
            <ThemeToggle className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 text-xs" />
          </div>

          <Link
            href={`/c/${tenant.slug}`}
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all border border-slate-200/50 dark:border-slate-700/50"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ver carta pública</span>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50/60 transition-all text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar sesión</span>
            </button>
          </form>
        </div>
      </aside>

      {/* 2. CONTENEDOR PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <main className="flex-1 w-full">{children}</main>
      </div>

      {/* Bottom Nav para Móviles */}
      <AdminBottomNav tenantSlug={tenant.slug} pendingCount={pendingCount} />

      {/* Escucha global de notificaciones multicanal (Sonido, Háptica y Push) */}
      <AdminNotificationListener
        tenantId={tenant.id}
        tenantSlug={tenant.slug}
        tenantName={tenant.name}
      />
    </div>
  );
}
