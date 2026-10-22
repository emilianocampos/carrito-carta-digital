'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  X,
  CreditCard,
  Banknote,
  Loader2,
  Check,
  ChevronDown,
} from 'lucide-react';
import { getSalesReportAction, type SalesReportData } from '../actions';
import { formatCurrency } from '@/lib/utils';

interface SalesReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantSlug: string;
}

export function SalesReportModal({
  isOpen,
  onClose,
  tenantId,
  tenantSlug,
}: SalesReportModalProps) {
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('today');
  const [report, setReport] = useState<SalesReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Cargar datos al abrir o cambiar de período
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    startTransition(async () => {
      const res = await getSalesReportAction(tenantId, period);
      if (!isMounted) return;

      if (res.success && res.data) {
        setReport(res.data);
      } else {
        setError(res.error || 'Error al obtener reporte');
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, tenantId, period]);

  if (!isOpen) return null;

  // Función para exportar archivo CSV 100% compatible con Microsoft Excel y Google Sheets
  const handleDownloadExcel = () => {
    if (!report) return;

    const currency = report.currency;
    const lines: string[] = [];

    // Encabezado del reporte
    lines.push(`"REPORTE DE VENTAS - ${report.tenantName.toUpperCase()}"`);
    lines.push(`"Período:";"${report.periodLabel}"`);
    lines.push(`"Fecha de Emisión:";"${new Date().toLocaleString('es-AR')}"`);
    lines.push('');

    // Resumen Ejecutivo
    lines.push('"RESUMEN FINANCIERO"');
    lines.push(`"Total Facturado:";"${formatCurrency(report.totalRevenue, currency)}"`);
    lines.push(`"Cantidad de Pedidos:";"${report.totalOrdersCount}"`);
    lines.push(`"Ticket Promedio:";"${formatCurrency(report.averageTicket, currency)}"`);
    lines.push(`"Cobrado en Efectivo:";"${formatCurrency(report.paymentBreakdown.cashTotal, currency)} (${report.paymentBreakdown.cashCount} pedidos)"`);
    lines.push(`"Cobrado Online / MP:";"${formatCurrency(report.paymentBreakdown.onlineTotal, currency)} (${report.paymentBreakdown.onlineCount} pedidos)"`);
    lines.push('');

    // Tabla de Productos Vendidos
    lines.push('"PRODUCTOS VENDIDOS Y RECAUDACIÓN"');
    lines.push('"Producto";"Cantidad Vendida";"Precio Unitario";"Total Recaudado";"% del Total"');
    report.productsSummary.forEach((p) => {
      const percent = report.totalRevenue > 0
        ? ((p.totalAmount / report.totalRevenue) * 100).toFixed(1) + '%'
        : '0%';
      lines.push(
        `"${p.productName.replace(/"/g, '""')}";"${p.quantity}";"${formatCurrency(p.unitPrice, currency)}";"${formatCurrency(p.totalAmount, currency)}";"${percent}"`
      );
    });
    lines.push('');

    // Registro cronológico de Pedidos
    lines.push('"REGISTRO DETALLADO DE PEDIDOS"');
    lines.push('"N° Pedido";"Fecha";"Hora";"Cliente";"Teléfono";"Platos incluidos";"Medio de Pago";"Estado";"Total"');
    report.ordersList.forEach((o) => {
      const d = new Date(o.createdAt);
      const dateStr = d.toLocaleDateString('es-AR');
      const timeStr = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      const payStr = o.paymentStatus === 'cash_on_pickup' ? 'Efectivo al retirar' : 'Mercado Pago / Online';
      const statusStr = o.orderStatus === 'picked_up' ? 'Entregado' : o.orderStatus === 'ready' ? 'Listo' : 'En proceso';

      lines.push(
        `"#${o.orderNumber}";"${dateStr}";"${timeStr}";"${o.customerName.replace(/"/g, '""')}";"${o.customerPhone}";"${o.itemsSummary.replace(/"/g, '""')}";"${payStr}";"${statusStr}";"${formatCurrency(o.total, currency)}"`
      );
    });

    // Agregar BOM UTF-8 (\uFEFF) para que Excel en Windows reconozca caracteres y tildes correctamente
    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ventas_${tenantSlug}_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Función para imprimir reporte en PDF
  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-md animate-in fade-in duration-200">
      {/* Fondo clickeable para cerrar */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Contenedor */}
      <div className="relative z-10 w-full max-w-4xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-200">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Reportes y Cierres de Ventas
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Resumen de recaudación, productos vendidos y exportación a Excel / PDF
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de Filtro de Período y Botones de Acción */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Píldoras de rango */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'today', label: 'Hoy (Turno)' },
              { id: 'yesterday', label: 'Ayer' },
              { id: 'week', label: 'Últimos 7 días' },
              { id: 'month', label: 'Este Mes' },
              { id: 'all', label: 'Todo' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPeriod(tab.id as typeof period)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  period === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Botones de Descarga */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isLoading || !report || report.totalOrdersCount === 0}
              onClick={handleDownloadExcel}
              className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Descargar archivo .csv para abrir directamente en Microsoft Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Descargar Excel (.csv)</span>
            </button>

            <button
              type="button"
              disabled={isLoading || !report || report.totalOrdersCount === 0}
              onClick={handlePrintPdf}
              className="py-2 px-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Imprimir reporte o guardar como PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Contenido Scrolleable del Reporte */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 no-scrollbar flex-1 print:p-0">
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Calculando ventas y recaudación...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs text-center font-bold">
              {error}
            </div>
          ) : !report || report.totalOrdersCount === 0 ? (
            <div className="py-16 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
              <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No hay ventas registradas en este período
              </p>
              <p className="text-xs text-slate-400">
                Probá seleccionando &ldquo;Este Mes&rdquo; o &ldquo;Todo&rdquo; en los filtros superiores.
              </p>
            </div>
          ) : (
            <div className="space-y-6 print:space-y-4">
              {/* 1. Tarjetas de Resumen Financiero */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Total Facturado
                  </span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-mono block">
                    {formatCurrency(report.totalRevenue, report.currency)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Pedidos Completados
                  </span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-mono block">
                    {report.totalOrdersCount}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Ticket Promedio
                  </span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-mono block">
                    {formatCurrency(report.averageTicket, report.currency)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Medios de Cobro
                  </span>
                  <div className="text-xs space-y-0.5">
                    <p className="flex items-center justify-between font-medium">
                      <span>Efectivo:</span>
                      <span className="font-bold">{formatCurrency(report.paymentBreakdown.cashTotal, report.currency)}</span>
                    </p>
                    <p className="flex items-center justify-between font-medium">
                      <span>Online / MP:</span>
                      <span className="font-bold">{formatCurrency(report.paymentBreakdown.onlineTotal, report.currency)}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Tabla de Productos Vendidos y Cantidades */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Platos y Productos más Vendidos
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    {report.productsSummary.length} productos con ventas
                  </span>
                </div>

                <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#111827]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">Producto</th>
                        <th className="py-2.5 px-3 text-center">Unidades</th>
                        <th className="py-2.5 px-4 text-right">Precio Promedio</th>
                        <th className="py-2.5 px-4 text-right">Total Recaudado</th>
                        <th className="py-2.5 px-3 text-right">% Venta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {report.productsSummary.map((p, idx) => {
                        const percent = report.totalRevenue > 0
                          ? Math.round((p.totalAmount / report.totalRevenue) * 100)
                          : 0;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                              {p.productName}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold font-mono">
                              {p.quantity}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-500 dark:text-slate-400">
                              {formatCurrency(p.unitPrice, report.currency)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-black font-mono text-slate-900 dark:text-white">
                              {formatCurrency(p.totalAmount, report.currency)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-500 dark:text-slate-400">
                              {percent}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Registro Cronológico de Tickets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Historial de Tickets ({report.ordersList.length} pedidos)
                  </h3>
                </div>

                <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#111827]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Pedido</th>
                        <th className="py-2.5 px-3">Hora</th>
                        <th className="py-2.5 px-3">Cliente</th>
                        <th className="py-2.5 px-3">Platos</th>
                        <th className="py-2.5 px-3">Pago</th>
                        <th className="py-2.5 px-4 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {report.ordersList.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 font-black text-indigo-600 dark:text-indigo-400 font-mono">
                            #{o.orderNumber}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {new Date(o.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                            {o.customerName}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-600 dark:text-slate-400 max-w-xs truncate">
                            {o.itemsSummary}
                          </td>
                          <td className="py-2.5 px-3 text-[11px]">
                            {o.paymentStatus === 'cash_on_pickup' ? (
                              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold">
                                <Banknote className="w-3 h-3" /> Efectivo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                <CreditCard className="w-3 h-3" /> Mercado Pago
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right font-black font-mono text-slate-900 dark:text-white whitespace-nowrap">
                            {formatCurrency(o.total, report.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
