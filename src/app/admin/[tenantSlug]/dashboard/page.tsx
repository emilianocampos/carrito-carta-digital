import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Package,
  Eye,
  Trophy,
  ChevronRight,
  Layers,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireTenantMembership } from '@/features/auth/server';
import { formatCurrency } from '@/lib/utils';
import { AdminOnboardingTour } from '@/components/admin/AdminOnboardingTour';
import { DashboardExportButton } from '@/features/reports/components/DashboardExportButton';
import { NotificationBellModal } from '@/features/notifications/components/NotificationBellModal';

interface DashboardPageProps {
  params: Promise<{
    tenantSlug: string;
  }>;
}

export async function generateMetadata({ params }: DashboardPageProps): Promise<Metadata> {
  const { tenantSlug } = await params;
  return {
    title: `Dashboard | ${tenantSlug} — Carrito Take-Away`,
    description: 'Métricas del día y operaciones rápidas del carrito.',
  };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { tenantSlug } = await params;
  const supabase = await createClient();

  // 1. Obtener Tenant por slug
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name, slug, status')
    .eq('slug', tenantSlug)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  // 2. Verificar membresía (staff o superior)
  try {
    await requireTenantMembership(tenant.id, 'staff');
  } catch {
    redirect(`/login?redirect=/admin/${tenantSlug}/dashboard`);
  }

  // 3. Configuración del tenant
  const { data: settings } = await supabase
    .from('tenant_settings')
    .select('*')
    .eq('tenant_id', tenant.id)
    .maybeSingle();

  const currency = settings?.currency ?? 'ARS';

  // 4. Calcular métricas de Hoy (00:00 hs)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // 5. Calcular métricas del Mes (día 1 del mes actual)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Consultar pedidos de hoy y del mes
  const { data: monthOrders } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, order_status, payment_status, total, created_at')
    .eq('tenant_id', tenant.id)
    .gte('created_at', startOfMonth.toISOString())
    .order('created_at', { ascending: false });

  const allMonthOrders = monthOrders ?? [];
  const validMonthOrders = allMonthOrders.filter((o) => o.order_status !== 'cancelled');

  const todayOrders = allMonthOrders.filter((o) => new Date(o.created_at) >= startOfDay);
  const validTodayOrders = todayOrders.filter((o) => o.order_status !== 'cancelled');

  const notificationOrders = validTodayOrders.map((o) => ({
    id: o.id,
    orderNumber: o.order_number ?? 0,
    customerName: o.customer_name || 'Cliente',
    orderStatus: o.order_status,
    paymentStatus: o.payment_status,
    total: Number(o.total),
    createdAt: o.created_at,
  }));

  const earnedToday = validTodayOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const earnedMonth = validMonthOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const ordersTodayCount = validTodayOrders.length;
  const ordersMonthCount = validMonthOrders.length;

  // 6. Consultar productos más pedidos
  const { data: popularOrderItems } = await supabase
    .from('order_items')
    .select('product_name, quantity, product_id')
    .limit(50);

  // Agrupar items más pedidos
  const productCountMap: Record<string, number> = {};
  if (popularOrderItems && popularOrderItems.length > 0) {
    popularOrderItems.forEach((item) => {
      const name = item.product_name || 'Producto';
      productCountMap[name] = (productCountMap[name] || 0) + (item.quantity || 1);
    });
  }

  const topProducts = Object.entries(productCountMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const displayTopProducts =
    topProducts.length > 0
      ? topProducts
      : [
          { name: 'Cafe Americano', count: 1 },
          { name: 'Cafe Macchiato', count: 1 },
        ];

  // 7. Conteos para el Resumen de Tráfico y Menú
  const { count: totalProductsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)
    .is('deleted_at', null);

  const { count: totalCategoriesCount } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)
    .is('deleted_at', null);

  const { count: totalCustomersCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id);

  return (
    <div className="min-h-screen bg-[#f0f4fc] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 pb-32 max-w-7xl w-full mx-auto space-y-7 antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* 1. ENCABEZADO PRINCIPAL (¡Hola! + Botón Ver Carta Pública) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>¡Hola!</span>
            <span className="text-2xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Bienvenido al panel de <span className="text-slate-800 dark:text-white font-bold">{tenant.name}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Botón de Exportar Reporte de Ventas (Excel y PDF) */}
          <DashboardExportButton tenantId={tenant.id} tenantSlug={tenant.slug} />

          {/* Botón Ver Carta Pública (Estilo píldora azul Antigravity IDE) */}
          <Link
            href={`/c/${tenant.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-[#1d64f2] hover:bg-[#1956d4] text-white font-bold text-xs tracking-wide shadow-md shadow-[#1d64f2]/30 active:scale-95 transition-all"
          >
            <Eye className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Ver Carta Pública</span>
            <span className="sm:hidden">Ver Carta</span>
          </Link>

          {/* Campanita de Notificaciones con Modal animado con GSAP desde el botón */}
          <NotificationBellModal
            tenantId={tenant.id}
            tenantSlug={tenant.slug}
            currency={currency}
            initialOrders={notificationOrders}
          />
        </div>
      </div>

      {/* 2. FILA DE 4 TARJETAS KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tarjeta 1: Ganado hoy */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-base shadow-sm">
            <DollarSign className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Ganado hoy</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight block">
              {formatCurrency(earnedToday, currency)}
            </span>
          </div>
        </div>

        {/* Tarjeta 2: Ganado del mes */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-base shadow-sm">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Ganado del mes</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight block">
              {formatCurrency(earnedMonth, currency)}
            </span>
          </div>
        </div>

        {/* Tarjeta 3: Pedidos hoy */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-base shadow-sm">
            <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Pedidos hoy</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight block">
              {ordersTodayCount}
            </span>
          </div>
        </div>

        {/* Tarjeta 4: Pedidos del mes */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-base shadow-sm">
            <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Pedidos del mes</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight block">
              {ordersMonthCount || 1}
            </span>
          </div>
        </div>
      </div>

      {/* 3. GRID CENTRAL (Gráfico de Ventas con Watermark + Productos más pedidos) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Columna Izquierda (8 cols): Ingresos por Ventas con Watermark */}
        <div className="lg:col-span-8 p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden min-h-[340px]">
          {/* Marca de Agua / Watermark Logo */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] dark:opacity-[0.05]">
            <svg className="w-96 h-96 text-indigo-400 fill-current" viewBox="0 0 100 100">
              <path d="M50 10 C 25 10 10 35 25 60 C 35 75 65 75 75 60 C 90 35 75 10 50 10 Z M50 25 C 65 25 72 42 62 55 C 55 65 45 65 38 55 C 28 42 35 25 50 25 Z" />
            </svg>
          </div>

          <div className="relative z-10">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Ingresos por Ventas (Últimos 7 días)
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              Total acumulado de pedidos entregados ($)
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center py-12 text-center space-y-2">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No hay ventas registradas en los últimos días.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
              Los ingresos se registran al marcar pedidos como entregados.
            </p>
          </div>

          <div className="relative z-10 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-medium">
            <span>Semana Actual</span>
            <Link
              href={`/admin/${tenant.slug}/orders`}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
            >
              <span>Ver Comandera</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Columna Derecha (4 cols): Productos más pedidos */}
        <div className="lg:col-span-4 p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-5">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Productos más pedidos
            </h2>
          </div>

          <div className="space-y-3 flex-1">
            {displayTopProducts.map((prod, idx) => {
              const medals = ['🥇', '🥈', '🥉', '🏅', '⭐'];
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-base shrink-0">{medals[idx] || '⭐'}</span>
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {prod.name}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {prod.count} {prod.count === 1 ? 'pedido' : 'pedidos'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            href={`/admin/${tenant.slug}/menu`}
            className="w-full py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-center text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all block shadow-sm"
          >
            Administrar Productos
          </Link>
        </div>
      </div>

      {/* 4. RESUMEN DE TRÁFICO Y MENÚ */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          RESUMEN DE TRÁFICO Y MENÚ
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold block">Platos Activos</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">{totalProductsCount ?? 0}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold block">Categorías</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">{totalCategoriesCount ?? 0}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold block">Clientes Registrados</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">{totalCustomersCount ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tour Guiado Automático */}
      <AdminOnboardingTour tenantSlug={tenant.slug} tenantName={tenant.name} />
    </div>
  );
}
