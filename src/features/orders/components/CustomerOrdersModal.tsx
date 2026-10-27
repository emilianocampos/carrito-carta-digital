'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  PackageSearch,
  X,
  Search,
  Clock,
  Flame,
  CheckCircle,
  ExternalLink,
  ShoppingBag,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  User,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { searchCustomerOrdersAction, type CustomerOrderSummary } from '../actions';
import { getStoredCustomerProfile } from '@/features/raffles/client';
import { formatCurrency } from '@/lib/utils';
import type { OrderStatus } from '@/types/database';

interface CustomerOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  currency: string;
}

export function CustomerOrdersModal({
  isOpen,
  onClose,
  tenantId,
  tenantSlug,
  tenantName,
  currency,
}: CustomerOrdersModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Auto-completar nombre con perfil guardado al abrir el modal
  useEffect(() => {
    if (isOpen) {
      const stored = getStoredCustomerProfile(tenantSlug);
      if (stored?.name && !customerName) {
        setCustomerName(stored.name);
        // Buscar automáticamente los pedidos del cliente guardado
        performSearch(stored.name);
      }
    }
  }, [isOpen, tenantSlug]);

  // Suscripción Realtime a las órdenes encontradas mientras el modal está abierto
  useEffect(() => {
    if (!isOpen || orders.length === 0) return;

    const supabase = createClient();
    const orderIds = orders.map((o) => o.id);

    const channel = supabase
      .channel(`customer_modal_orders_${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const updated = payload.new as {
            id: string;
            order_status: OrderStatus;
            payment_status: string;
            estimated_ready_at: string | null;
          };

          if (orderIds.includes(updated.id)) {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === updated.id
                  ? {
                      ...o,
                      orderStatus: updated.order_status,
                      paymentStatus: updated.payment_status,
                      estimatedReadyAt: updated.estimated_ready_at,
                    }
                  : o
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, orders, tenantId]);

  const performSearch = (nameToSearch: string) => {
    const trimmed = nameToSearch.trim();
    if (!trimmed || trimmed.length < 2) {
      setErrorMessage('Ingresá al menos 2 letras de tu nombre para buscar.');
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      const res = await searchCustomerOrdersAction(tenantId, trimmed);
      setHasSearched(true);
      if (res.success) {
        setOrders(res.data);
      } else {
        setErrorMessage(res.error || 'No se pudieron obtener los pedidos.');
      }
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(customerName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Fondo clickeable para cerrar */}
      <div className="fixed inset-0 cursor-pointer" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#111827] rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: 'var(--theme-primary, #5865F2)' }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md shadow-[#5865F2]/25"
            >
              <PackageSearch className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Mis Pedidos en Vivo
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Consultá el estado de tu comanda en {tenantName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario de Búsqueda por Nombre y Apellido */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#111827]">
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Ingresá tu Nombre y Apellido:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isPending || !customerName.trim()}
                style={{ backgroundColor: 'var(--theme-primary, #5865F2)' }}
                className="px-5 py-2.5 rounded-2xl text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#5865F2]/25 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 stroke-[2.5]" />
                )}
                <span>Buscar</span>
              </button>
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-500 font-medium flex items-center gap-1.5 pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </p>
            )}
          </form>
        </div>

        {/* Contenido / Listado de Pedidos */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3.5 flex-1 max-h-[55vh]">
          {!hasSearched && !isPending && (
            <div className="py-10 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Escribí tu nombre tal como lo ingresaste al pedir
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                El sistema buscará automáticamente tus pedidos recientes y te mostrará el avance en vivo de la cocina.
              </p>
            </div>
          )}

          {isPending && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#5865F2]" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Buscando comandas en {tenantName}...
              </p>
            </div>
          )}

          {hasSearched && !isPending && orders.length === 0 && (
            <div className="py-10 text-center space-y-2.5">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
                No encontramos pedidos para &quot;{customerName}&quot;
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Asegurate de escribir el mismo nombre y apellido con el que confirmaste tu compra en el carrito.
              </p>
            </div>
          )}

          {hasSearched && !isPending && orders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                <span>Pedidos encontrados ({orders.length})</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Actualización en vivo
                </span>
              </div>

              {orders.map((order) => {
                const isReady = order.orderStatus === 'ready';
                const isPreparing = order.orderStatus === 'preparing';
                const isPending = order.orderStatus === 'pending';
                const isPickedUp = order.orderStatus === 'picked_up';

                return (
                  <div
                    key={order.id}
                    className={`p-4 rounded-3xl border transition-all space-y-3 ${
                      isReady
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-600/50 shadow-md shadow-emerald-500/10'
                        : isPreparing
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/50'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-700 shadow-xs'
                    }`}
                  >
                    {/* Fila Superior: Número de Pedido y Badge de Estado */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-base text-slate-900 dark:text-white">
                          #{order.orderNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Badge Estado */}
                      <div>
                        {isReady && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white font-black text-[11px] tracking-wide animate-pulse shadow-sm shadow-emerald-500/30">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>¡LISTO PARA RETIRAR!</span>
                          </span>
                        )}
                        {isPreparing && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white font-bold text-[11px] tracking-wide">
                            <Flame className="w-3.5 h-3.5" />
                            <span>EN PREPARACIÓN</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>RECIBIDO</span>
                          </span>
                        )}
                        {isPickedUp && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-[11px]">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span>ENTREGADO</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Resumen de Productos */}
                    <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold line-clamp-2">
                      {order.itemsSummary || `${order.itemsCount} producto(s)`}
                    </p>

                    {/* Total y Botón de Seguimiento */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Total</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {formatCurrency(order.total, currency)}
                        </span>
                      </div>

                      <Link
                        href={`/c/${tenantSlug}/track/${order.id}`}
                        onClick={onClose}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-xs ${
                          isReady
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
                        }`}
                      >
                        <span>Seguir en Vivo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
