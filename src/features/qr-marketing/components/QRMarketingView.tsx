'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Copy,
  Check,
  Printer,
  Download,
  ExternalLink,
  Share2,
  Sparkles,
  ShoppingBag,
  Clock,
  Smartphone,
  Eye,
  HelpCircle,
} from 'lucide-react';

interface QRMarketingViewProps {
  tenantSlug: string;
  tenantName: string;
  slogan?: string | null;
  currency: string;
  appUrl: string;
}

export function QRMarketingView({
  tenantSlug,
  tenantName,
  slogan,
  currency,
  appUrl,
}: QRMarketingViewProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedStoryText, setCopiedStoryText] = useState(false);

  const fullMenuUrl = `${appUrl}/c/${tenantSlug}`;
  // Generador de QR confiable y de alta definición (500x500px)
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=15&format=png&data=${encodeURIComponent(
    fullMenuUrl
  )}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullMenuUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyStoryText = () => {
    const text = `☀️ ¡Disfrutá en la plaza sin hacer filas! Pedí desde tu manta o banco y retirá cuando esté listo 👉 ${fullMenuUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedStoryText(true);
    setTimeout(() => setCopiedStoryText(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR-${tenantSlug}-menu.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      window.open(qrImageUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4fc] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 pb-32 max-w-7xl mx-auto w-full antialiased space-y-7 selection:bg-[#5865F2] selection:text-white transition-colors duration-200">
      {/* Header (Oculto al imprimir) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/60">
              Ventas en Plazas & Verano
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <QrCode className="w-7 h-7 text-amber-500" />
            <span>Código QR & Difusión</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Permite que tus clientes pidan desde el pasto o bancos en la plaza, sin amontonarse ni hacer filas al sol.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="py-2.5 px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs tracking-wide flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimir Cartel A4</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadQR}
            className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs tracking-wide flex items-center gap-1.5 shadow-sm shadow-amber-200 dark:shadow-none active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Descargar Imagen QR</span>
          </button>
        </div>
      </div>

      {/* Grid Superior: Link de Instagram + Código QR y Cartel */}
      <div className="print:hidden grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Estrategia de Instagram y Difusión */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Link en Bio de Instagram & Redes */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Link para la Bio de Instagram & TikTok
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tus seguidores pueden ver la carta y pedir directamente antes de llegar a la plaza.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-1">
              <div className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-800 dark:text-slate-200 truncate flex items-center">
                {fullMenuUrl}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? '¡Copiado!' : 'Copiar Link'}</span>
                </button>

                <Link
                  href={`/c/${tenantSlug}`}
                  target="_blank"
                  className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Probar</span>
                </Link>
              </div>
            </div>

            {/* Texto para Historia de Instagram */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white block">
                  💡 Texto sugerido para historias de Instagram:
                </span>
                <span className="text-slate-500 text-[11px]">
                  &ldquo;☀️ ¡Pedí desde tu manta o banco en la plaza sin hacer fila! Entrá al link de nuestra bio.&rdquo;
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyStoryText}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0 cursor-pointer self-start sm:self-auto"
              >
                {copiedStoryText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedStoryText ? 'Copiado para Instagram' : 'Copiar texto para historia'}</span>
              </button>
            </div>
          </div>

          {/* Card 2: Por qué este flujo duplica ventas en verano */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Cómo Funciona la Experiencia en la Plaza</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xs">
                  1
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Escaneo Instantáneo</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  El cliente escanea el QR desde su banco o lona. No instala nada; la carta abre de inmediato.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black text-xs">
                  2
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Pide y Paga sin Moverse</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Elige los platos, personaliza aderezos y paga con Mercado Pago o avisa que paga en efectivo.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs">
                  3
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Retiro Listo en Mano</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Ve el tiempo en vivo (~15 min). Solo camina al carrito cuando la pantalla le avisa que está listo.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Vista Previa del QR Rápido */}
        <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-col items-center text-center justify-between space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Escaneo Directo
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {tenantName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Probá apuntar con la cámara de tu celular
            </p>
          </div>

          {/* Contenedor del QR */}
          <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-sm flex items-center justify-center">
            <img
              src={qrImageUrl}
              alt={`QR de ${tenantName}`}
              className="w-48 h-48 object-contain"
            />
          </div>

          <div className="w-full space-y-2">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs tracking-wide transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Cartel para el Carrito</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadQR}
              className="w-full py-2 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Guardar Imagen PNG</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARTEL IMPRIMIBLE (Se ve en pantalla y se imprime en hoja A4 completa)      */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="print:hidden flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Vista Previa del Cartel de Plaza & Mostrador (Formato A4)
          </h2>
          <button
            type="button"
            onClick={handlePrint}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Mandar a Imprimir</span>
          </button>
        </div>

        {/* Hoja de Cartel */}
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-md max-w-2xl mx-auto text-slate-900 flex flex-col items-center text-center space-y-6 print:m-0 print:p-8 print:border-none print:shadow-none print:max-w-none print:w-full">
          {/* Badge superior */}
          <div className="px-4 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black uppercase tracking-widest">
            ☀️ Pedí Sin Esperar en la Fila
          </div>

          {/* Título del local */}
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 uppercase">
              {tenantName}
            </h1>
            <p className="text-sm font-semibold text-slate-600">
              {slogan || '¡Disfrutá en la plaza y retirá directo por el mostrador!'}
            </p>
          </div>

          {/* QR Gigante con marco */}
          <div className="p-5 bg-white border-4 border-slate-900 rounded-3xl shadow-sm flex items-center justify-center">
            <img
              src={qrImageUrl}
              alt={`QR ${tenantName}`}
              className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
            />
          </div>

          {/* Llamado a la acción */}
          <div className="space-y-1">
            <p className="text-xl font-black text-slate-900 tracking-tight">
              ESCANEA CON LA CÁMARA DE TU CELULAR
            </p>
            <p className="text-xs font-mono text-slate-500 font-bold">
              {fullMenuUrl}
            </p>
          </div>

          {/* 3 Pasos Ilustrados en el Cartel */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-slate-100 w-full text-left">
            <div className="space-y-1">
              <span className="text-xs font-black text-amber-600">PASO 1</span>
              <p className="text-xs font-bold text-slate-900">Mirá la Carta</p>
              <p className="text-[10px] text-slate-500 leading-tight">
                Fotos, opciones, combos y precios sin moverte de tu lugar.
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black text-amber-600">PASO 2</span>
              <p className="text-xs font-bold text-slate-900">Elegí y Pagá</p>
              <p className="text-[10px] text-slate-500 leading-tight">
                Aboná con Mercado Pago o en efectivo al retirar.
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black text-amber-600">PASO 3</span>
              <p className="text-xs font-bold text-slate-900">Retirá Listo</p>
              <p className="text-[10px] text-slate-500 leading-tight">
                Te avisamos en pantalla para que busques tu comida caliente.
              </p>
            </div>
          </div>

          {/* Pie de cartel */}
          <div className="pt-2 text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
            CARRITO TAKE-AWAY • SISTEMA INTELIGENTE DE PEDIDOS
          </div>
        </div>
      </div>
    </div>
  );
}
