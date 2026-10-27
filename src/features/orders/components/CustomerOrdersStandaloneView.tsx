'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  PackageSearch,
  Search,
  Clock,
  Flame,
  CheckCircle,
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

interface CustomerOrdersStandaloneViewProps {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  currency: string;
}

export function CustomerOrdersStandaloneView({
  tenantId,
  tenantSlug,
  tenantName,
  currency,
}: CustomerOrdersStandaloneViewProps) {
  const [customerName, setCustomerName] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Auto-completar nombre con perfil guardado al montar
  useEffect(() => {
    const stored = getStoredCustomerProfile(tenantSlug);
    if (stored?.name && !customerName) {
      setCustomerName(stored.name);
      performSearch(stored.name);
    }
  }, [tenantSlug]);

  // Suscripción Realtime a las órdenes encontradas
  useEffect(() => {
    if (orders.length === 0) return;

    const supabase = createClient();
    const orderIds = orders.map((o) => o.id);

    const channel = supabase
      .channel(`customer_standalone_orders_${tenantId}`)
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
  }, [orders, tenantId]);

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

  return (
    <div className="space-y-6">
      {/* Tarjeta de Encabezado y Formulario */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center gap-4">
          <div
            style={{ backgroundColor: 'var(--theme-primary, #5865F2)' }}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#5865F2]/25 shrink-0"
          >
            <PackageSearch className="w-6 h-6 stroke-[2.3]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Mis Pedidos en Vivo
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Consultá el avance en cocina de tu pedido en {tenantName}
            </p>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Ingresá tu Nombre y Apellido:
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Ej: Juan Pérez"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isPending || !customerName.trim()}
              style={{ backgroundColor: 'var(--theme-primary, #5865F2)' }}
              className="px-6 py-3 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#5865F2]/25 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>Buscar Pedido</span>
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

      {/* Resultados de la Búsqueda */}
      <div className="space-y-4">
        {!hasSearched && !isPending && (
          <div className="py-12 text-center p-8 rounded-3xl bg-white/60 dark:bg-[#111827]/60 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
            <Clock className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Escribí tu nombre tal como lo indicaste en la comanda
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Te mostraremos el cronómetro, estado de preparación y te avisaremos cuando esté listo para retirar.
            </p>
          </div>
        )}

        {isPending && (
          <div className="py-16 text-center p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-3">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#5865F2]" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Consultando la cocina de {tenantName}...
            </p>
          </div>
        )}

        {hasSearched && !isPending && orders.length === 0 && (
          <div className="py-12 text-center p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
              No se encontraron pedidos para &quot;{customerName}&quot;
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Verificá si tu nombre tiene algún error tipográfico o consultale al operador del carrito.
            </p>
          </div>
        )}

        {hasSearched && !isPending && orders.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
              <span>{orders.length} pedido(s) encontrado(s)</span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Actualización en tiempo real
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
                  className={`p-5 sm:p-6 rounded-3xl border transition-all space-y-4 shadow-sm ${
                    isReady
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-600/50 shadow-emerald-500/10'
                      : isPreparing
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/50'
                      : 'bg-white dark:bg-[#111827] border-slate-200/90 dark:border-slate-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-lg sm:text-xl text-slate-900 dark:text-white">
                        #{order.orderNumber}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(order.createdAt).toLocaleDateString([], {
                          day: '2-digit',
                          month: 'short',
                        })}{' '}
                        •{' '}
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div>
                      {isReady && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500 text-white font-black text-xs tracking-wide animate-pulse shadow-md shadow-emerald-500/30">
                          <Sparkles className="w-4 h-4" />
                          <span>¡LISTO PARA RETIRAR!</span>
                        </span>
                      )}
                      {isPreparing && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white font-bold text-xs tracking-wide">
                          <Flame className="w-4 h-4" />
                          <span>EN PREPARACIÓN</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs">
                          <Clock className="w-4 h-4" />
                          <span>RECIBIDO EN COCINA</span>
                        </span>
                      )}
                      {isPickedUp && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span>ENTREGADO</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-800 dark:text-slate-200 font-semibold line-clamp-2">
                    {order.itemsSummary || `${order.itemsCount} producto(s)`}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Total del Pedido</span>
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        {formatCurrency(order.total, currency)}
                      </span>
                    </div>

                    <Link
                      href={`/c/${tenantSlug}/track/${order.id}`}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs active:scale-95 transition-all shadow-md ${
                        isReady
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                          : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-slate-900/10'
                      }`}
                    >
                      <span>Seguir en Tiempo Real</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
