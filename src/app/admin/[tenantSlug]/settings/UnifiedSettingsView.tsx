'use client';

import React, { useState, useTransition } from 'react';
import {
  CreditCard,
  Banknote,
  ShieldCheck,
  Check,
  Loader2,
  AlertCircle,
  HelpCircle,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  Settings,
  Sparkle,
} from 'lucide-react';
import {
  updateTenantPaymentSettingsAction,
  type PaymentSettingsInput,
} from '@/features/payments/actions';
import { formatCurrency } from '@/lib/utils';

interface Plan {
  id: string;
  code: string;
  name: string;
  price: number;
  description?: string;
}

interface UnifiedSettingsViewProps {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  initialTab?: 'payments' | 'billing';
  initialPaymentSettings: PaymentSettingsInput;
  subscription: {
    status: string;
    current_period_end: string | null;
    plans: {
      id: string;
      code: string;
      name: string;
      price: number;
    } | null;
  } | null;
  plans: Plan[];
}

export function UnifiedSettingsView({
  tenantId,
  tenantSlug,
  tenantName,
  initialTab = 'payments',
  initialPaymentSettings,
  subscription,
  plans,
}: UnifiedSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'payments' | 'billing'>(initialTab);

  // Estados de Pagos y Mercado Pago
  const [acceptsCash, setAcceptsCash] = useState<boolean>(initialPaymentSettings.acceptsCash);
  const [acceptsMercadoPago, setAcceptsMercadoPago] = useState<boolean>(
    initialPaymentSettings.acceptsMercadoPago
  );
  const [accessToken, setAccessToken] = useState<string>(
    initialPaymentSettings.mercadopagoAccessToken || ''
  );
  const [publicKey, setPublicKey] = useState<string>(
    initialPaymentSettings.mercadopagoPublicKey || ''
  );
  const [sandboxMode, setSandboxMode] = useState<boolean>(
    initialPaymentSettings.mercadopagoSandboxMode
  );
  const [showToken, setShowToken] = useState<boolean>(false);

  const [isPending, startTransition] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSavePayments = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccess(false);

    if (!acceptsCash && !acceptsMercadoPago) {
      setErrorMessage('Debes habilitar al menos un método de pago.');
      return;
    }

    startTransition(async () => {
      const res = await updateTenantPaymentSettingsAction(tenantId, {
        acceptsCash,
        acceptsMercadoPago,
        mercadopagoAccessToken: accessToken,
        mercadopagoPublicKey: publicKey,
        mercadopagoSandboxMode: sandboxMode,
      });

      if (!res.success) {
        setErrorMessage(res.error);
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    });
  };

  // Cálculos de la prueba gratis
  const isTrial = !subscription || subscription.status === 'trialing';
  const trialEndDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  const now = new Date();
  const trialDaysLeft = trialEndDate
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 7;
  const isTrialExpired = isTrial && trialDaysLeft <= 0;

  const currentPlan = subscription?.plans;

  return (
    <div className="min-h-screen bg-[#f0f4fc] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 pb-32 max-w-7xl mx-auto w-full antialiased space-y-7 selection:bg-[#5865F2] selection:text-white transition-colors duration-200">
      {/* Header Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
              Administración
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Configuración</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Configurá tus credenciales de Mercado Pago, métodos de cobro y gestioná tu plan de suscripción.
          </p>
        </div>

        {activeTab === 'payments' && (
          <button
            type="submit"
            form="payment-settings-form"
            disabled={isPending}
            className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-200 dark:shadow-none active:scale-95 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>¡Cambios Guardados!</span>
              </>
            ) : (
              <span>Guardar Cambios</span>
            )}
          </button>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-white dark:bg-[#111827] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-800'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Cobros & Mercado Pago</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'billing'
              ? 'bg-white dark:bg-[#111827] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-800'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Planes & Facturación</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: COBROS & MERCADO PAGO                                              */}
      {/* ========================================================================= */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
              <Check className="w-5 h-5 text-emerald-600 stroke-[3] shrink-0" />
              <span>Configuración guardada correctamente. Tu carrito cobrará con estos datos.</span>
            </div>
          )}

          <form id="payment-settings-form" onSubmit={handleSavePayments} className="space-y-6">
            {/* 1. MÉTODOS DE PAGO HABILITADOS */}
            <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none space-y-5 transition-all">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Métodos de Pago Activos en el Checkout
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Elegí las opciones que verán tus clientes al confirmar su pedido.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Efectivo */}
                <label
                  className={`flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer ${
                    acceptsCash
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-700 shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-800'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Efectivo al Retirar</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Pago presencial al mostrador</p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={acceptsCash}
                    onChange={(e) => setAcceptsCash(e.target.checked)}
                    className="w-5 h-5 rounded-lg accent-indigo-600 text-indigo-600 focus:ring-0 cursor-pointer shrink-0"
                  />
                </label>

                {/* Mercado Pago */}
                <label
                  className={`flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer ${
                    acceptsMercadoPago
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-700 shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-800'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Mercado Pago Checkout Pro</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Tarjetas, débito y dinero en cuenta</p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={acceptsMercadoPago}
                    onChange={(e) => setAcceptsMercadoPago(e.target.checked)}
                    className="w-5 h-5 rounded-lg accent-indigo-600 text-indigo-600 focus:ring-0 cursor-pointer shrink-0"
                  />
                </label>
              </div>
            </div>

            {/* 2. CREDENCIALES DE MERCADO PAGO */}
            {acceptsMercadoPago && (
              <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none space-y-5 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span>Conectar Llaves de Mercado Pago (Checkout Pro)</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Conexión dinámica directa por negocio para acreditar el dinero en tu cuenta bancaria.
                    </p>
                  </div>

                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800/60">
                    Dinámico por Local
                  </span>
                </div>

                <div className="space-y-4 pt-1">
                  {/* Access Token */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        Access Token *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showToken ? 'Ocultar' : 'Mostrar'}</span>
                      </button>
                    </div>
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="APP_USR-0000000000000000-000000-..."
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-100 font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                    />
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      El Access Token permite a la plataforma generar preferencias de pago en tu nombre.
                    </p>
                  </div>

                  {/* Public Key */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Public Key (opcional)
                    </label>
                    <input
                      type="text"
                      value={publicKey}
                      onChange={(e) => setPublicKey(e.target.value)}
                      placeholder="APP_USR-..."
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-100 font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                    />
                  </div>

                  {/* Modo Sandbox Switch */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-xs text-slate-900 dark:text-white font-bold block">
                        Modo de Conexión
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Usá Sandbox para probar sin dinero real, o Producción para empezar a cobrar a clientes.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSandboxMode((s) => !s)}
                      className={`text-[10px] font-black uppercase px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        sandboxMode
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {sandboxMode ? 'Sandbox (Pruebas)' : 'Producción (En Vivo)'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. GUÍA DE OBTENCIÓN DE CREDENCIALES */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <HelpCircle className="w-3.5 h-3.5" />
                </div>
                <span>¿Cómo obtener tus credenciales de Mercado Pago?</span>
              </h4>
              <ol className="list-decimal pl-5 text-slate-500 dark:text-slate-400 space-y-1.5 text-xs leading-relaxed">
                <li>
                  Ingresá a tu cuenta de Mercado Pago en{' '}
                  <a
                    href="https://www.mercadopago.com.ar/developers/panel"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-indigo-600 dark:text-indigo-400 underline"
                  >
                    mercadopago.com.ar/developers/panel
                  </a>.
                </li>
                <li>Hacé clic en &ldquo;Tus integraciones&rdquo; y creá o seleccioná tu aplicación.</li>
                <li>Andá a la pestaña &ldquo;Credenciales de producción&rdquo;.</li>
                <li>Copiá el &ldquo;Access Token&rdquo; y pegalo en el campo superior.</li>
                <li>¡Listo! Los pagos realizados con Checkout Pro se transferirán inmediatamente a tu cuenta de Mercado Pago.</li>
              </ol>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PLANES & FACTURACIÓN                                               */}
      {/* ========================================================================= */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Estado Actual de la Suscripción */}
          {isTrial && (
            <div
              className={`p-6 sm:p-7 rounded-2xl border ${
                isTrialExpired
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 shadow-sm'
                  : 'bg-white dark:bg-[#111827] border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none'
              } space-y-3`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl ${
                      isTrialExpired
                        ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400'
                        : 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400'
                    } flex items-center justify-center font-black shadow-sm shrink-0`}
                  >
                    {isTrialExpired ? (
                      <AlertTriangle className="w-6 h-6" />
                    ) : (
                      <Clock className="w-6 h-6 stroke-[2.5]" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {isTrialExpired
                          ? 'Período de prueba finalizado'
                          : 'Período de Prueba Gratuita (7 Días)'}
                      </h2>
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          isTrialExpired
                            ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 shadow-sm'
                        }`}
                      >
                        {isTrialExpired ? 'Expirada' : `${trialDaysLeft} días restantes`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                      {isTrialExpired
                        ? 'Tus 7 días de prueba gratis han concluido. Elegí tu plan para seguir recibiendo pedidos online sin interrupciones.'
                        : 'Tenés acceso completo a todas las funcionalidades. Al cumplirse los 7 días de prueba, podrás activar tu plan mensual preferido.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isTrial && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-emerald-200 dark:border-emerald-800/60 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Suscripción Activa: Plan {currentPlan?.name || 'Básico'}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    Tu negocio está operando con todas las herramientas habilitadas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Grid de Planes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            {/* Plan Básico */}
            <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 hover:shadow-md dark:shadow-none shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-6 transition-all">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Para Empezar
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">Plan Básico</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Ideal para carritos y food trucks que dan sus primeros pasos digitales.
                  </p>
                </div>

                <div className="pt-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">$45.000</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold ml-1">/mes</span>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Hasta <strong>50 productos</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Hasta <strong>5 categorías</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Carta digital móvil con QR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Comandera KDS en tiempo real</span>
                  </div>
                </div>
              </div>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `¡Hola! Quiero activar el Plan Básico para mi local "${tenantName}" (/c/${tenantSlug}) en Carrito Take-Away.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs transition-colors flex items-center justify-center gap-2 text-center"
              >
                <span>Elegir Plan Básico</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Plan Profesional (Destacado) */}
            <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#111827] border-2 border-indigo-600 flex flex-col justify-between space-y-6 relative shadow-lg shadow-indigo-100 dark:shadow-none">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-600 text-white font-black text-[10px] uppercase tracking-wider shadow-sm">
                ⭐ Más Popular
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    Crecimiento y Ventas
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">Plan Profesional</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Para locales en marcha que buscan fidelizar clientes y automatizar cobros online.
                  </p>
                </div>

                <div className="pt-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">$85.000</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold ml-1">/mes</span>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Hasta <strong>200 productos</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Hasta <strong>15 categorías</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span><strong>Cupones de descuento</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span><strong>Pedidos programados</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Cobro online con Mercado Pago</span>
                  </div>
                </div>
              </div>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `¡Hola! Quiero activar el Plan Profesional para mi local "${tenantName}" (/c/${tenantSlug}) en Carrito Take-Away.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide transition-all shadow-sm shadow-indigo-200 dark:shadow-none active:scale-95 flex items-center justify-center gap-2 text-center"
              >
                <span>Elegir Plan Profesional</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </a>
            </div>

            {/* Plan Premium Gastronómico */}
            <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 hover:shadow-md dark:shadow-none shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-6 transition-all">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
                    Alta Demanda & IA
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">Plan Premium</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Todo el poder de la Inteligencia Artificial y capacidad de catálogo ilimitada.
                  </p>
                </div>

                <div className="pt-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">$140.000</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold ml-1">/mes</span>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span><strong>Productos y categorías ilimitadas</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span><strong>Descripciones persuasivas con IA</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span><strong>OCR e importación de cartas con IA</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>Personalización visual avanzada</span>
                  </div>
                </div>
              </div>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `¡Hola! Quiero activar el Plan Premium para mi local "${tenantName}" (/c/${tenantSlug}) en Carrito Take-Away.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 text-center shadow-sm shadow-purple-200 dark:shadow-none"
              >
                <span>Elegir Plan Premium</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
