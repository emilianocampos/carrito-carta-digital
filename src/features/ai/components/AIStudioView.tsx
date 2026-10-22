'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Camera,
  FileText,
  Megaphone,
  Loader2,
  Check,
  Copy,
  Plus,
  QrCode,
  AlertCircle,
  Upload,
} from 'lucide-react';
import {
  extractMenuFromImageAction,
  importParsedMenuAction,
  generateProductDescriptionAction,
  generateMarketingCopyAction,
} from '../actions';
import type { ParsedMenuResult, MarketingCopyResult } from '../types';
import { formatCurrency } from '@/lib/utils';

interface AIStudioViewProps {
  tenantId: string;
  tenantSlug: string;
  currency: string;
}

export function AIStudioView({ tenantId, tenantSlug, currency }: AIStudioViewProps) {
  const [activeTab, setActiveTab] = useState<'ocr' | 'descriptions' | 'marketing'>('ocr');

  // Tab 1: OCR
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [parsedMenu, setParsedMenu] = useState<ParsedMenuResult | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Tab 2: Descripciones
  const [descProductName, setDescProductName] = useState<string>('');
  const [descCategory, setDescCategory] = useState<string>('Hamburguesas');
  const [descIngredients, setDescIngredients] = useState<string>('');
  const [generatedDescriptions, setGeneratedDescriptions] = useState<string[]>([]);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Tab 3: Marketing
  const [marketingSpecialty, setMarketingSpecialty] = useState<string>('Hamburguesas smash artesanales');
  const [marketingTone, setMarketingTone] = useState<'fun' | 'serious' | 'promotional'>('fun');
  const [marketingResult, setMarketingResult] = useState<MarketingCopyResult | null>(null);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState<boolean>(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handler para subir foto en OCR
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageBase64(reader.result as string);
      setParsedMenu(null);
      setImportSuccessMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleScanMenu = async () => {
    if (!selectedImageBase64) return;
    setIsScanning(true);
    setErrorMessage(null);

    const res = await extractMenuFromImageAction(tenantId, selectedImageBase64);
    setIsScanning(false);

    if (res.success) {
      setParsedMenu(res.data);
    } else {
      setErrorMessage(res.error);
    }
  };

  const handleImportMenu = async () => {
    if (!parsedMenu) return;
    setIsImporting(true);
    setErrorMessage(null);

    const res = await importParsedMenuAction(tenantId, parsedMenu);
    setIsImporting(false);

    if (res.success) {
      setImportSuccessMessage(
        `¡Se importaron con éxito ${res.data.importedCategoriesCount} categorías y ${res.data.importedProductsCount} productos a tu carta!`
      );
    } else {
      setErrorMessage(res.error);
    }
  };

  // Handler para generar descripciones
  const handleGenerateDescriptions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descProductName.trim()) return;

    setIsGeneratingDesc(true);
    setErrorMessage(null);

    const res = await generateProductDescriptionAction(
      tenantId,
      descProductName.trim(),
      descCategory.trim(),
      descIngredients.trim()
    );

    setIsGeneratingDesc(false);

    if (res.success) {
      setGeneratedDescriptions(res.data.descriptions);
    } else {
      setErrorMessage(res.error);
    }
  };

  // Handler para generar copy QR
  const handleGenerateMarketing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingCopy(true);
    setErrorMessage(null);

    const res = await generateMarketingCopyAction(tenantId, marketingSpecialty, marketingTone);
    setIsGeneratingCopy(false);

    if (res.success) {
      setMarketingResult(res.data);
    } else {
      setErrorMessage(res.error);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f0f4fc] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 pb-32 max-w-7xl mx-auto w-full antialiased space-y-7 selection:bg-[#5865F2] selection:text-white transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
              Gastronomía Digital + IA
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Estudio de IA Gastronómica</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Reconocimiento óptico (OCR) de cartas físicas, redacción persuasiva de platos y copys de marketing.
          </p>
        </div>

        <span className="self-start sm:self-auto text-[10px] font-black uppercase px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
          PRO / PREMIUM ACTIVO
        </span>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Selector de Pestañas */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 max-w-xl shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('ocr')}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'ocr'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Escanear Carta</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('descriptions')}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'descriptions'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Descripciones</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('marketing')}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'marketing'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Carteles QR</span>
        </button>
      </div>

      {/* PESTAÑA 1: OCR MENÚ */}
      {activeTab === 'ocr' && (
        <div className="space-y-4">
          <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-md space-y-5 transition-all">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Camera className="w-4 h-4" />
                </div>
                <span>Importar Carta desde Foto o Pizarra</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Sacale una foto a tu pizarra de precios, folleto o carta de papel. La Inteligencia Artificial extraerá los
                nombres, descripciones y valores automáticamente para guardarlos en tu carta digital.
              </p>
            </div>

            {/* Input de archivo */}
            <div>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-2xl p-8 cursor-pointer bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition-all group">
                <Upload className="w-9 h-9 text-indigo-600 dark:text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Subir o sacar foto del menú</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">JPG, PNG o WEBP hasta 10MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {selectedImageBase64 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-800 dark:text-slate-200 font-bold">Foto cargada y lista para procesar</span>
                  <button
                    type="button"
                    onClick={handleScanMenu}
                    disabled={isScanning}
                    className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide flex items-center gap-2 shadow-sm shadow-indigo-200 dark:shadow-none active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analizando con Visión IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Escanear Carta</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Resultado del OCR */}
          {parsedMenu && (
            <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-md space-y-5 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Productos detectados con éxito</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Revisá la lista antes de importarla automáticamente a tu catálogo de productos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleImportMenu}
                  disabled={isImporting}
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50 shrink-0"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Importando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Guardar en mi Carta</span>
                    </>
                  )}
                </button>
              </div>

              {importSuccessMessage && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  {importSuccessMessage}
                </div>
              )}

              <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                {parsedMenu.categories.map((cat, idx) => (
                  <div key={idx} className="pt-4 first:pt-0 space-y-2.5">
                    <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                      {cat.name} ({cat.products.length})
                    </h4>
                    <div className="space-y-2">
                      {cat.products.map((p, pIdx) => (
                        <div
                          key={pIdx}
                          className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                            {p.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{p.description}</p>
                            )}
                          </div>
                          <span className="font-extrabold text-slate-900 dark:text-white shrink-0 ml-3">
                            {formatCurrency(p.price, currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: REDACTOR DE DESCRIPCIONES */}
      {activeTab === 'descriptions' && (
        <div className="space-y-5">
          <form
            onSubmit={handleGenerateDescriptions}
            className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-md space-y-5 transition-all"
          >
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span>Redactor de Descripciones Apetitosas</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                Ingresá los ingredientes o detalles de tu plato y la IA generará 3 variantes atractivas para tu menú.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Nombre del Producto *
              </label>
              <input
                type="text"
                required
                value={descProductName}
                onChange={(e) => setDescProductName(e.target.value)}
                placeholder="Ej: Hamburguesa Oklahoma Smash"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">Categoría</label>
              <input
                type="text"
                value={descCategory}
                onChange={(e) => setDescCategory(e.target.value)}
                placeholder="Ej: Hamburguesas"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Ingredientes clave o detalles de cocción
              </label>
              <input
                type="text"
                value={descIngredients}
                onChange={(e) => setDescIngredients(e.target.value)}
                placeholder="Ej: Cebolla ultrafina caramelizada en plancha, queso cheddar americano, pan de papa"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isGeneratingDesc}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm shadow-indigo-200 dark:shadow-none active:scale-[0.99] transition-all"
            >
              {isGeneratingDesc ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Redactando con IA gastronómica...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generar 3 Opciones Apetitosas</span>
                </>
              )}
            </button>
          </form>

          {/* Opciones generadas */}
          {generatedDescriptions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Propuestas generadas
              </h4>

              {generatedDescriptions.map((desc, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-md space-y-2 flex items-start justify-between gap-4 transition-all"
                >
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                    &ldquo;{desc}&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(desc, idx)}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors shrink-0"
                    title="Copiar al portapapeles"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 3: COPYS PARA CARTEL QR */}
      {activeTab === 'marketing' && (
        <div className="space-y-5">
          <form
            onSubmit={handleGenerateMarketing}
            className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-md space-y-5 transition-all"
          >
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Megaphone className="w-4 h-4" />
                </div>
                <span>Generador de Copys para Cartelería QR</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                Textos llamativos para incentivar a que la gente escanee el código QR en el mostrador o mesas.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Especialidad de tu Food Truck
              </label>
              <input
                type="text"
                required
                value={marketingSpecialty}
                onChange={(e) => setMarketingSpecialty(e.target.value)}
                placeholder="Ej: Hamburguesas smash artesanales y papas con cheddar"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">Tono del Mensaje</label>
              <div className="grid grid-cols-3 gap-2">
                {(['fun', 'promotional', 'serious'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setMarketingTone(t)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      marketingTone === t
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {t === 'fun' ? 'Divertido' : t === 'promotional' ? 'Promocional' : 'Clásico'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isGeneratingCopy}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm shadow-indigo-200 dark:shadow-none active:scale-[0.99] transition-all"
            >
              {isGeneratingCopy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creando copy de cartel...</span>
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  <span>Generar Cartel para Mostrador</span>
                </>
              )}
            </button>
          </form>

          {/* Cartel maqueta generado */}
          {marketingResult && (
            <div className="p-8 sm:p-10 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 space-y-5 text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center mx-auto shadow-sm">
                <QrCode className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{marketingResult.headline}</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
                  {marketingResult.body}
                </p>
              </div>

              <div className="pt-2">
                <span className="inline-block py-2.5 px-6 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider shadow-sm">
                  {marketingResult.callToAction}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
