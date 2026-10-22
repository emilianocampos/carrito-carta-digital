import Link from 'next/link';
import type { Metadata } from 'next';
import {
  UtensilsCrossed,
  Smartphone,
  CreditCard,
  Clock,
  CheckCircle2,
  ChevronRight,
  LogIn,
  UserPlus,
  LogOut,
  Store,
  Sparkles,
} from 'lucide-react';
import { getCurrentUser, getUserTenant } from '@/features/auth/server';
import { logoutAction } from '@/features/auth/actions';
import { ThemeToggle } from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'Carrito Take-Away | SaaS para Carritos de Comida & Food Trucks',
  description:
    'Carta digital QR interactiva sin descargas, comandería táctil KDS en tiempo real con alertas sonoras, cobros con Mercado Pago y motor de IA.',
};

export default async function HomePage() {
  let user = null;
  let tenant = null;

  try {
    user = await getCurrentUser();
    if (user) {
      tenant = await getUserTenant(user.userId);
    }
  } catch {
    // Modo desconectado o sin sesión
  }

  return (
    <div className="min-h-screen bg-[#f0f4fc] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Sutil glow de fondo con gradiente suave */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] bg-gradient-to-b from-indigo-200/30 dark:from-indigo-600/10 via-sky-100/20 dark:via-sky-900/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 dark:bg-[#0c1322]/85 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo y Nombre de Marca */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight block leading-tight">
                Carrito Take-Away
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60">
                SaaS Multi-Tenant
              </span>
            </div>
          </Link>

          {/* Menú de Navegación y Botón de Modo Oscuro */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="#beneficios"
              className="hidden md:inline-block text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-2 py-1"
            >
              Beneficios
            </a>
            <a
              href="#planes"
              className="hidden md:inline-block text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-2 py-1"
            >
              Planes
            </a>

            {/* BOTÓN DE MODO OSCURO / CLARO */}
            <ThemeToggle showLabel={true} />

            {user ? (
              <div className="flex items-center gap-2 ml-1">
                {tenant && (
                  <Link
                    href={`/admin/${tenant.slug}/dashboard`}
                    className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-300 dark:shadow-none flex items-center gap-1.5 active:scale-95"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Mi Panel ({tenant.name})</span>
                  </Link>
                )}

                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200/90 dark:border-slate-700 hover:border-rose-200 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Salir</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Link
                  href="/login"
                  className="py-2 px-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-400" />
                  <span>Iniciar Sesión</span>
                </Link>

                <Link
                  href="/register"
                  className="py-2 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-95 flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Crear Usuario</span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-14 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Plataforma SaaS en Producción • Para Gastronomía Móvil</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] max-w-3xl mx-auto">
          El SaaS definitivo para{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 bg-clip-text text-transparent">
            Carritos de Comida & Food Trucks
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
          Carta digital móvil instantánea sin apps para tus comensales, comandería táctil con sonido en vivo para la plancha, pagos online con Mercado Pago y motor de IA gastronómica.
        </p>

        {/* BOTONERA PRINCIPAL */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          {user ? (
            <>
              {tenant ? (
                <Link
                  href={`/admin/${tenant.slug}/dashboard`}
                  className="py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
                >
                  <Store className="w-4 h-4" />
                  <span>Ingresar a Mi Panel ({tenant.name})</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
                >
                  <Store className="w-4 h-4" />
                  <span>Crear Mi Carrito</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </Link>
              )}

              <a
                href="#planes"
                className="py-3.5 px-5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>Ver Planes</span>
              </a>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className="py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Crear Usuario</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </Link>

              <Link
                href="/login"
                className="py-3.5 px-6 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm flex items-center gap-2 shadow-sm transition-all"
              >
                <LogIn className="w-4 h-4 text-indigo-500" />
                <span>Iniciar Sesión</span>
              </Link>

              <a
                href="#planes"
                className="py-3.5 px-5 rounded-2xl bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>Ver Planes</span>
              </a>
            </>
          )}
        </div>
      </section>

      {/* 3 PILARES CLAVE (CARDS CON EL ESTILO DEL DASHBOARD) */}
      <section id="beneficios" className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all space-y-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-sm">
            <Smartphone className="w-5 h-5 stroke-[2.2]" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">0% Fricción para el Cliente</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
            El comensal escanea el código QR en la mesa o mostrador y pide al instante sin tener que descargar aplicaciones pesadas ni crear contraseñas.
          </p>
        </div>

        {/* Card 2 */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all space-y-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-sm">
            <Clock className="w-5 h-5 stroke-[2.2]" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Cocina Sincronizada y Rápida</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
            Campana sonora por Web Audio API y WebSockets en vivo. El cocinero sabe exactamente qué marchar y avisa al celular del cliente cuando está listo.
          </p>
        </div>

        {/* Card 3 */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all space-y-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-sm">
            <CreditCard className="w-5 h-5 stroke-[2.2]" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Cobro Directo sin Intermediarios</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
            Cada food truck cobra en su propia cuenta de Mercado Pago o en efectivo al retirar. El SaaS no retiene tus fondos ni cobra comisiones ocultas.
          </p>
        </div>
      </section>

      {/* TABLA DE PLANES COMERCIALES (CON CARDS BLANCAS / OSCURAS DEL DASHBOARD) */}
      <section id="planes" className="max-w-5xl mx-auto px-4 py-16 border-t border-slate-200/80 dark:border-slate-800/80 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/60 inline-block">
            Modelo de Monetización SaaS
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Planes diseñados para cada etapa de tu negocio
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Plan 1: Básico */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md space-y-5 flex flex-col justify-between transition-all">
            <div className="space-y-3.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Plan Inicial
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Básico Food Truck</h3>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                $9.900 <span className="text-xs text-slate-400 font-semibold">/mes</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ideal para puestos callejeros y ferias gastronómicas que inician.
              </p>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Hasta 50 productos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Carta digital pública QR</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Comandera KDS estándar</span>
                </div>
              </div>
            </div>

            <Link
              href="/register"
              className="w-full py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs text-center transition-colors block shadow-sm"
            >
              Comenzar con Básico
            </Link>
          </div>

          {/* Plan 2: Profesional (Destacado) */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111827] border-2 border-indigo-600 dark:border-indigo-500 space-y-5 flex flex-col justify-between relative shadow-xl shadow-indigo-500/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-sm">
              Más Elegido
            </div>

            <div className="space-y-3.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Crecimiento
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Profesional</h3>
              <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
                $24.900 <span className="text-xs text-slate-400 font-semibold">/mes</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Para carritos consolidados con alta demanda y fidelización.
              </p>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Hasta 200 productos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Pagos online con Mercado Pago</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Fidelización por puntos & Cupones</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Temas personalizados de diseño</span>
                </div>
              </div>
            </div>

            <Link
              href="/register"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs text-center transition-all shadow-md shadow-indigo-600/20 block"
            >
              Comenzar con Profesional
            </Link>
          </div>

          {/* Plan 3: Premium IA */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md space-y-5 flex flex-col justify-between transition-all">
            <div className="space-y-3.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Potencia Total
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Premium IA</span>
                <Sparkles className="w-4 h-4 text-purple-500" />
              </h3>
              <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 tracking-tight">
                $49.900 <span className="text-xs text-slate-400 font-semibold">/mes</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Franquicias y marcas con automatización con Inteligencia Artificial.
              </p>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Productos ilimitados</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>OCR de Menús Físicos con IA</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Redactor de Descripciones IA</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Generador de Cartelería QR</span>
                </div>
              </div>
            </div>

            <Link
              href="/register"
              className="w-full py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs text-center transition-colors block shadow-sm"
            >
              Comenzar con Premium
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-8 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
        <p className="font-bold text-slate-600 dark:text-slate-400">Carrito Take-Away © 2026 — Plataforma Multi-Tenant para Gastronomía Móvil</p>
        <p className="text-[11px]">
          Desarrollado con Next.js (App Router), TypeScript, Tailwind CSS, Supabase PostgreSQL, Realtime & Web Audio API.
        </p>
      </footer>
    </div>
  );
}
