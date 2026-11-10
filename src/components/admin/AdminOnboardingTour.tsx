'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Flame,
  UtensilsCrossed,
  Users,
  CreditCard,
  Palette,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';

interface TourStep {
  id: string;
  targetId: string;
  badge: string;
  category: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  description: string;
  tip: string;
  actionUrl?: string;
  actionText?: string;
}

interface AdminOnboardingTourProps {
  tenantSlug: string;
  tenantName: string;
}

export function AdminOnboardingTour({ tenantSlug, tenantName }: AdminOnboardingTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  const storageKey = `takeaway_admin_tour_${tenantSlug}`;

  const steps: TourStep[] = [
    {
      id: 'overview',
      targetId: 'tour-nav-dashboard',
      badge: 'Inicio & Analítica',
      category: 'DASHBOARDS',
      title: 'Panel de Control (Overview)',
      subtitle: 'El pulso de tu negocio en tiempo real',
      icon: LayoutDashboard,
      iconColor: 'text-[#00dc82]',
      iconBg: 'bg-[#00dc82]/15 border-[#00dc82]/30',
      description:
        'Tu pantalla de bienvenida diaria. Aquí consultás las ventas acumuladas de hoy, el ticket promedio, la cantidad de clientes fidelizados y el estado de la cocina en vivo.',
      tip: 'Monitoreá el indicador de Meta Diaria para ver el porcentaje de pedidos entregados a tiempo.',
      actionUrl: `/admin/${tenantSlug}/dashboard`,
      actionText: 'Ir a Overview',
    },
    {
      id: 'orders',
      targetId: 'tour-nav-orders',
      badge: 'El Corazón de la Cocina',
      category: 'OPERACIONES',
      title: 'Comandera en Vivo',
      subtitle: 'Gestión instantánea de pedidos entrantes',
      icon: Flame,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-400/15 border-amber-400/30',
      description:
        'Cuando un cliente hace un pedido en tu carta web, entra directamente aquí con alerta sonora y visual. Con un solo toque cambiás el estado del plato: Nuevo → En Preparación → Listo para retirar.',
      tip: 'Tené esta pantalla abierta en una tablet o monitor en la cocina para que el equipo despache al instante.',
      actionUrl: `/admin/${tenantSlug}/orders`,
      actionText: 'Abrir Comandera',
    },
    {
      id: 'menu',
      targetId: 'tour-nav-menu',
      badge: 'Gestión Gastronómica',
      category: 'CARTA & PLATOS',
      title: 'Productos & Categorías',
      subtitle: 'Creación manual de tu carta y variantes',
      icon: UtensilsCrossed,
      iconColor: 'text-[#00dc82]',
      iconBg: 'bg-[#00dc82]/15 border-[#00dc82]/30',
      description:
        'Cargá y editá tus platos, fotos, categorías y precios. Creá variantes como puntos de carne, salsas, o extras con cargo. ¿Te quedaste sin stock de algún plato? Podés pausarlo en 1 click sin borrarlo.',
      tip: 'Podés duplicar productos con un botón para crear promociones o combos rápidamente.',
      actionUrl: `/admin/${tenantSlug}/menu`,
      actionText: 'Administrar Carta',
    },
    {
      id: 'customers',
      targetId: 'tour-nav-customers',
      badge: 'Fidelización',
      category: 'CLIENTES',
      title: 'Clientes CRM & Puntos',
      subtitle: 'Convertí compradores casuales en habituales',
      icon: Users,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/15 border-emerald-500/30',
      description:
        'Registrá automáticamente a los compradores con su teléfono o email. El sistema acumula puntos por cada compra completada y te permite premiarlos con cupones de descuento.',
      tip: 'Los clientes con puntos vuelven hasta un 40% más seguido a comprar en tu carrito.',
      actionUrl: `/admin/${tenantSlug}/customers`,
      actionText: 'Ver Clientes',
    },
    {
      id: 'payments',
      targetId: 'tour-nav-payments',
      badge: 'Finanzas & Caja',
      category: 'COBRANZAS',
      title: 'Métodos de Pago & Mercado Pago',
      subtitle: 'Cobrá como más te convenga',
      icon: CreditCard,
      iconColor: 'text-sky-400',
      iconBg: 'bg-sky-500/15 border-sky-500/30',
      description:
        'Habilitá efectivo al retirar, transferencias inmediatas (con tu CBU/Alias bancario) o pagos online con tarjeta y dinero en cuenta mediante Mercado Pago.',
      tip: 'El dinero de Mercado Pago ingresa directamente a tu propia cuenta de Mercado Pago sin intermediarios.',
      actionUrl: `/admin/${tenantSlug}/settings/payments`,
      actionText: 'Configurar Pagos',
    },
    {
      id: 'theme',
      targetId: 'tour-nav-theme',
      badge: 'Imagen de Marca',
      category: 'PERSONALIZACIÓN',
      title: 'Diseño Visual & Tu Carta Online',
      subtitle: 'Tu identidad y tu link público',
      icon: Palette,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/15 border-purple-500/30',
      description:
        'Elegí el preset visual de tu menú digital, colores y tipografías. En la esquina superior tenés siempre a mano el botón "Ver Carta" para copiar tu enlace web y compartirlo en tu Instagram o WhatsApp.',
      tip: 'Pegá el link de tu carta en la biografía de Instagram y en las respuestas rápidas de WhatsApp Business.',
      actionUrl: `/c/${tenantSlug}`,
      actionText: 'Ver Carta Digital',
    },
  ];

  // Verificar en localStorage si ya se completó el tour
  useEffect(() => {
    setMounted(true);
    try {
      const hasCompletedTour = localStorage.getItem(storageKey);
      if (!hasCompletedTour) {
        // Demora suave para que la página cargue primero
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignorar si localStorage no está disponible
    }
  }, [storageKey]);

  // Listener global para reabrir el tour bajo demanda (ej: botón de ayuda)
  useEffect(() => {
    const handleReopenTour = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };

    window.addEventListener('open-admin-tour', handleReopenTour);
    return () => window.removeEventListener('open-admin-tour', handleReopenTour);
  }, []);

  // Resaltar elemento del sidebar si existe
  useEffect(() => {
    if (!isOpen) return;

    const step = steps[currentStep];
    if (!step) return;

    const targetEl = document.getElementById(step.targetId);
    if (targetEl) {
      targetEl.classList.add('ring-2', 'ring-[#5865F2]', 'ring-offset-2', 'ring-offset-[#070709]');
    }

    return () => {
      if (targetEl) {
        targetEl.classList.remove(
          'ring-2',
          'ring-[#5865F2]',
          'ring-offset-2',
          'ring-offset-[#070709]'
        );
      }
    };
  }, [isOpen, currentStep, steps]);

  const markTourAsCompleted = useCallback(() => {
    try {
      localStorage.setItem(storageKey, 'completed');
    } catch {
      // fallback
    }
    setIsOpen(false);
  }, [storageKey]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      markTourAsCompleted();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    markTourAsCompleted();
  };

  // Atajos de teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  if (!mounted || !isOpen) return null;

  const current = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const StepIcon = current.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tour guiado del panel de administración"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Cabecera con barra de progreso superior */}
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-[#5865F2] to-indigo-400 transition-all duration-300 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Encabezado del modal */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[#111827]">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
              {current.category}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Paso {currentStep + 1} de {steps.length}
            </span>
          </div>

          <button
            onClick={handleSkip}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar y omitir tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo del Paso */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Tarjeta Visual Destacada del Módulo */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/70 dark:border-slate-800">
            <div
              className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 border ${current.iconBg} ${current.iconColor}`}
            >
              <StepIcon className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {current.badge}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {current.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{current.subtitle}</p>
            </div>
          </div>

          {/* Explicación en lenguaje claro */}
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {current.description}
          </p>

          {/* Tip operativo */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100/80 dark:border-indigo-900/60 flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="font-bold text-indigo-600 dark:text-indigo-400 block">Consejo Pro:</strong>
              <p className="text-slate-600 dark:text-slate-300 leading-normal">{current.tip}</p>
            </div>
          </div>

          {/* Indicadores de bolitas de pasos */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-6 bg-[#5865F2]'
                    : idx < currentStep
                    ? 'w-2 bg-[#5865F2]/50'
                    : 'w-2 bg-slate-200 dark:bg-slate-700'
                }`}
                title={`Ir al paso ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer con los botones */}
        <div className="p-5 sm:p-6 pt-3 bg-slate-50/60 dark:bg-[#111827] border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          {/* Botón 1: Omitir Tutorial */}
          <button
            type="button"
            onClick={handleSkip}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-center cursor-pointer"
          >
            Omitir tutorial
          </button>

          {/* Botones de navegación (Anterior + Siguiente) */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
            )}

            {/* Botón 2: Siguiente */}
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#5865F2]/25 active:scale-95 transition-all cursor-pointer"
            >
              <span>{isLastStep ? '¡Comenzar ahora!' : 'Siguiente'}</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Función auxiliar para abrir el tour desde cualquier botón o enlace
 */
export function triggerAdminTour() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-admin-tour'));
  }
}

/**
 * Botón interactivo para volver a abrir el tour cuando el usuario lo desee
 */
export function TourTriggerButton({
  className,
  label = 'Tour Guiado',
}: {
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={triggerAdminTour}
      className={
        className ||
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer'
      }
      title="Ver tour interactivo por el menú del panel"
    >
      <HelpCircle className="w-3.5 h-3.5 text-[#5865F2]" />
      <span>{label}</span>
    </button>
  );
}

