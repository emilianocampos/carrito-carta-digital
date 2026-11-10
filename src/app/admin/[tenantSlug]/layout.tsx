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
    <div className="min-h-screen bg-[#f0f4fc] dark:bg-[#0a0d14] text-slate-800 dark:text-[#edf2f7] flex antialiased selection:bg-[#1d64f2] selection:text-white transition-colors duration-200">
      {/* 1. SIDEBAR DESKTOP (Estilo Antigravity IDE Dark Azulado) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[#e8edf5] dark:border-[#1c2539] bg-white dark:bg-[#0d111a] p-5 space-y-4 shrink-0 sticky top-0 h-screen shadow-[0_0_20px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.4)] transition-colors">
        {/* Profile Header (Avatar circular + Nombre + Rol) */}
        <div className="flex items-center gap-3 px-1 pt-1 pb-1">
          {tenant.logo_url ? (
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-[#26324d] shrink-0">
              <Image
                src={tenant.logo_url}
                alt={tenant.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1d64f2] via-[#2563eb] to-[#3b82f6] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-[#1d64f2]/25">
              {tenant.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="truncate">
            <h2 className="font-bold text-slate-800 dark:text-white text-sm tracking-tight truncate">
              {tenant.name}
            </h2>
            <span className="text-[11px] text-slate-400 dark:text-[#7e8da8] font-medium truncate block">
              Administrador
            </span>
          </div>
        </div>

        {/* Input Buscador estilo Píldora Antigravity */}
        <div className="relative px-1">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-[#6e7d99] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar en el panel..."
            readOnly
            className="w-full bg-[#f8fafc] dark:bg-[#131926] border border-slate-200/90 dark:border-[#222c42] rounded-full pl-9 pr-3 py-1.5 text-xs text-slate-700 dark:text-[#d5deed] placeholder:text-slate-400 dark:placeholder:text-[#6e7d99] focus:outline-none focus:border-[#1d64f2] focus:bg-white dark:focus:bg-[#161e2e] transition cursor-default"
          />
        </div>

        {/* Links de Navegación Sidebar */}
        <AdminSidebarNav tenantSlug={tenant.slug} pendingCount={pendingCount} />

        {/* Footer Sidebar (ThemeToggle + Ver carta pública + Cerrar sesión) */}
        <div className="pt-3 border-t border-slate-100 dark:border-[#1c2539] space-y-1.5">
          <div className="flex items-center justify-between px-1 py-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-[#8b98b1]">Modo de Vista</span>
            <ThemeToggle className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#131926] text-slate-600 dark:text-[#d5deed] border border-slate-200 dark:border-[#243049] hover:border-[#1d64f2] text-xs" />
          </div>

          <Link
            href={`/c/${tenant.slug}`}
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#d5deed] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#161e30] transition-all border border-slate-200/50 dark:border-[#232f47]"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse shadow-[0_0_8px_#3b82f6]" />
              <span>Ver carta pública</span>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-400 dark:text-[#7e8da8]" />
          </Link>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-[#8b98b1] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 transition-all text-left"
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
