'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Banknote,
  ShieldCheck,
  Check,
  Loader2,
  AlertCircle,
  HelpCircle,
  Sparkle,
} from 'lucide-react';
import { updateTenantPaymentSettingsAction, type PaymentSettingsInput } from '../actions';

interface PaymentSettingsViewProps {
  tenantId: string;
  tenantSlug: string;
  initialSettings: PaymentSettingsInput;
}

export function PaymentSettingsView({
  tenantId,
  tenantSlug,
  initialSettings,
}: PaymentSettingsViewProps) {
  const [acceptsCash, setAcceptsCash] = useState<boolean>(initialSettings.acceptsCash);
  const [acceptsMercadoPago, setAcceptsMercadoPago] = useState<boolean>(
    initialSettings.acceptsMercadoPago
  );
  const [accessToken, setAccessToken] = useState<string>(
    initialSettings.mercadopagoAccessToken || ''
  );
  const [publicKey, setPublicKey] = useState<string>(
    initialSettings.mercadopagoPublicKey || ''
  );
  const [sandboxMode, setSandboxMode] = useState<boolean>(
    initialSettings.mercadopagoSandboxMode
  );

  const [isPending, startTransition] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
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

  return (
    <div className="min-h-screen bg-[#f0f4fc] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 pb-32 max-w-7xl mx-auto w-full antialiased space-y-7 selection:bg-[#5865F2] selection:text-white transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
              Checkout & Cobros
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Configuración de Pagos</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Controlá cómo abonan tus clientes: efectivo en mostrador o cobro online inmediato con Mercado Pago.
          </p>
        </div>

        <button
          type="submit"
          form="payment-settings-form"
          disabled={isPending}
          className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-200 dark:shadow-none active:scale-95 transition-all disabled:opacity-50 shrink-0"
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
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form id="payment-settings-form" onSubmit={handleSave} className="space-y-6">
        {/* 1. MÉTODOS DE PAGO HABILITADOS */}
        <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-md space-y-5 transition-all">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Métodos de Pago Activos en el Checkout
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Marcá las opciones que verán tus clientes al confirmar su comanda.
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
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Mercado Pago Online</p>
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
          <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-md space-y-5 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span>Credenciales de Mercado Pago</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Conexión directa vía Checkout Pro para acreditar fondos en tu cuenta bancaria.
                </p>
              </div>

              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800/60">
                Checkout Pro
              </span>
            </div>

            <div className="space-y-4 pt-1">
              {/* Access Token */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  Access Token de Producción *
                </label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="APP_USR-..."
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-100 font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                />
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
                  <span className="text-xs text-slate-900 dark:text-white font-bold block">Entorno Operativo</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Activá sandbox para hacer cobros ficticios de prueba.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSandboxMode((s) => !s)}
                  className={`text-[10px] font-black uppercase px-3.5 py-1.5 rounded-xl border transition-all ${
                    sandboxMode
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {sandboxMode ? 'Sandbox (Pruebas)' : 'Producción (Real)'}
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
            <span>¿Dónde obtengo mis credenciales de Mercado Pago?</span>
          </h4>
          <ol className="list-decimal pl-5 text-slate-500 dark:text-slate-400 space-y-1.5 text-xs leading-relaxed">
            <li>Ingresá a tu cuenta en <strong className="text-slate-800 dark:text-slate-200">developers.mercadopago.com</strong>.</li>
            <li>Hacé clic en &ldquo;Tus integraciones&rdquo; y seleccioná tu aplicación.</li>
            <li>Copiá el &ldquo;Access Token&rdquo; de producción y pegalo arriba.</li>
            <li>El dinero de cada venta se acreditará directamente en tu cuenta bancaria o billetera virtual.</li>
          </ol>
        </div>
      </form>
    </div>
  );
}
