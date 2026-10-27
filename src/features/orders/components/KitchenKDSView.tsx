'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  Volume2,
  VolumeX,
  Clock,
  CheckCircle,
  Phone,
  Flame,
  Check,
  Pause,
  Play,
  Minus,
  Plus,
  AlertTriangle,
  Calendar,
  X,
  ArrowLeft,
  LayoutGrid,
  List,
  GripVertical,
  MessageCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { updateOrderStatusAction, fetchKitchenOrdersAction } from '../actions';
import { updatePreparationTimeAction, toggleOrderPauseAction } from '@/features/tenants/actions';
import { formatCurrency } from '@/lib/utils';
import type { OrderStatus } from '@/types/database';
import {
  soundManager,
  triggerKitchenAlertVibration,
  sendDesktopNotification,
  buildOrderReadyWhatsAppUrl,
} from '@/features/notifications';

export interface KitchenOrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  optionsSnapshot: {
    options?: Array<{ name: string; extraPrice: number }>;
    notes?: string;
  };
}

export interface KitchenOrder {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  orderStatus: OrderStatus;
  paymentStatus: string;
  orderType: 'takeaway' | 'pickup_scheduled';
  scheduledFor: string | null;
  estimatedReadyAt: string | null;
  total: number;
  notes: string | null;
  createdAt: string;
  items: KitchenOrderItem[];
}

interface KitchenKDSViewProps {
  tenantId: string;
  tenantSlug: string;
  currency: string;
  initialPreparationTimeMinutes: number;
  initialIsOrderingPaused: boolean;
  initialPauseReason?: string | null;
  initialOrders: KitchenOrder[];
}

const PAUSE_REASONS = [
  'Plancha saturada (alta demanda)',
  'Falta temporal de insumos',
  'Cambio de garrafa / gas',
  'Cierre imprevisto por clima',
  'Atención a evento privado',
];

const PREPARATION_PRESETS = [10, 15, 20, 25, 30, 40, 60];

export function KitchenKDSView({
  tenantId,
  tenantSlug,
  currency,
  initialPreparationTimeMinutes,
  initialIsOrderingPaused,
  initialPauseReason,
  initialOrders,
}: KitchenKDSViewProps) {
  const [orders, setOrders] = useState<KitchenOrder[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<'pending' | 'preparing' | 'ready' | 'completed' | 'scheduled'>('pending');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Estados Operativos de Cocina
  const [prepMinutes, setPrepMinutes] = useState<number>(initialPreparationTimeMinutes);
  const [isPaused, setIsPaused] = useState<boolean>(initialIsOrderingPaused);
  const [pauseReason, setPauseReason] = useState<string>(initialPauseReason || '');

  // Modales
  const [showPauseModal, setShowPauseModal] = useState<boolean>(false);
  const [showEtaModal, setShowEtaModal] = useState<boolean>(false);
  const [customPauseReason, setCustomPauseReason] = useState<string>('');

  const [isPendingTransition, startTransition] = useTransition();

  // Mantener referencia al estado de sonido para no recrear canales Realtime innecesariamente
  const soundEnabledRef = React.useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Suscripción Realtime a Órdenes
  useEffect(() => {
    const supabase = createClient();

    // 1. Canal exclusivo de Broadcast (mensajes WebSocket directos entre clientes)
    const broadcastChannel = supabase
      .channel(`kds_broadcast_${tenantId}`)
      .on('broadcast', { event: 'new_order' }, ({ payload }) => {
        const incoming = payload as KitchenOrder;
        setOrders((prev) => {
          if (prev.some((o) => o.id === incoming.id)) return prev;
          return [incoming, ...prev];
        });

        if (soundEnabledRef.current) {
          soundManager.playNewOrderKitchen();
        }
        triggerKitchenAlertVibration();
        sendDesktopNotification({
          title: `🍔 ¡Nuevo pedido #${incoming.orderNumber}!`,
          body: `${incoming.customerName} • Total: ${formatCurrency(incoming.total, currency)}`,
          url: `/admin/${tenantSlug}/orders`,
          tag: `order-${incoming.id}`,
        });
      })
      .on('broadcast', { event: 'order_status_updated' }, ({ payload }) => {
        const updated = payload as { orderId: string; newStatus: OrderStatus };
        setOrders((prev) =>
          prev.map((o) => (o.id === updated.orderId ? { ...o, orderStatus: updated.newStatus } : o))
        );
      })
      .subscribe();

    // 2. Canal exclusivo de Base de Datos (con ID único para evitar cualquier colisión)
    const dbChannelId = Math.random().toString(36).substring(2, 9);
    const dbChannel = supabase
      .channel(`kds_db_${tenantId}_${dbChannelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `tenant_id=eq.${tenantId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as {
              id: string;
              order_number: number;
              customer_name: string;
              customer_phone: string;
              order_status: OrderStatus;
              payment_status: string;
              order_type: 'takeaway' | 'pickup_scheduled';
              scheduled_for: string | null;
              estimated_ready_at: string | null;
              total: number;
              notes: string | null;
              created_at: string;
            };

            const { data: items } = await supabase
              .from('order_items')
              .select('id, product_name, unit_price, quantity, subtotal, options_snapshot')
              .eq('order_id', row.id);

            const newOrderWithItems: KitchenOrder = {
              id: row.id,
              orderNumber: row.order_number,
              customerName: row.customer_name,
              customerPhone: row.customer_phone,
              orderStatus: row.order_status,
              paymentStatus: row.payment_status,
              orderType: row.order_type,
              scheduledFor: row.scheduled_for,
              estimatedReadyAt: row.estimated_ready_at,
              total: Number(row.total),
              notes: row.notes,
              createdAt: row.created_at,
              items: (items ?? []).map((i) => ({
                id: i.id,
                productName: i.product_name,
                quantity: i.quantity,
                unitPrice: Number(i.unit_price),
                subtotal: Number(i.subtotal),
                optionsSnapshot:
                  (i.options_snapshot as unknown as KitchenOrderItem['optionsSnapshot']) ?? {},
              })),
            };

            setOrders((prev) => [newOrderWithItems, ...prev]);

            if (soundEnabledRef.current) {
              soundManager.playNewOrderKitchen();
            }
            triggerKitchenAlertVibration();
            sendDesktopNotification({
              title: `🍔 ¡Nuevo pedido #${row.order_number}!`,
              body: `${row.customer_name} • Total: ${formatCurrency(row.total, currency)}`,
              url: `/admin/${tenantSlug}/orders`,
              tag: `order-${row.id}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as {
              id: string;
              order_status: OrderStatus;
              payment_status: string;
            };
            setOrders((prev) => {
              const existing = prev.find((o) => o.id === updated.id);
              if (
                existing &&
                existing.paymentStatus !== 'approved' &&
                updated.payment_status === 'approved'
              ) {
                if (soundEnabledRef.current) {
                  soundManager.playPaymentApproved();
                }
                triggerKitchenAlertVibration();
                sendDesktopNotification({
                  title: `💳 ¡Pago Aprobado #${existing.orderNumber}!`,
                  body: `Pago confirmado de ${existing.customerName} (${formatCurrency(existing.total, currency)})`,
                  url: `/admin/${tenantSlug}/orders`,
                  tag: `payment-${existing.id}`,
                });
              }

              return prev.map((o) =>
                o.id === updated.id
                  ? {
                      ...o,
                      orderStatus: updated.order_status,
                      paymentStatus: updated.payment_status,
                    }
                  : o
              );
            });
          }
        }
      )
      .subscribe();

    // Sincronización continua de respaldo (polling cada 6 segundos)
    const pollInterval = setInterval(async () => {
      const res = await fetchKitchenOrdersAction(tenantId);
      if (res.success && res.data.length > 0) {
        setOrders((prev) => {
          const existingIds = new Set(prev.map((o) => o.id));
          const hasNew = res.data.some((o) => !existingIds.has(o.id));
          if (hasNew) {
            if (soundEnabledRef.current) soundManager.playNewOrderKitchen();
            triggerKitchenAlertVibration();
          }
          return res.data;
        });
      }
    }, 6000);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(dbChannel);
    };
  }, [tenantId, tenantSlug, currency]);

  // Cambiar estado de un pedido
  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
    );

    // Emitir broadcast a la pantalla de seguimiento del cliente
    try {
      const supabase = createClient();
      const trackChannel = supabase.channel(`order_track_${orderId}`);
      trackChannel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          trackChannel
            .send({
              type: 'broadcast',
              event: 'order_status_updated',
              payload: { orderId, newStatus },
            })
            .then(() => supabase.removeChannel(trackChannel))
            .catch(() => {});
        }
      });
    } catch {}

    startTransition(async () => {
      await updateOrderStatusAction(tenantId, orderId, newStatus);
    });
  };

  // Ajustar tiempo de preparación (ETA)
  const handleUpdateEta = (newMinutes: number) => {
    const valid = Math.min(Math.max(newMinutes, 5), 180);
    setPrepMinutes(valid);
    setShowEtaModal(false);

    startTransition(async () => {
      await updatePreparationTimeAction(tenantId, valid);
    });
  };

  // Confirmar Pausa de Pedidos
  const handleConfirmPause = (reason: string) => {
    setIsPaused(true);
    setPauseReason(reason);
    setShowPauseModal(false);

    startTransition(async () => {
      await toggleOrderPauseAction(tenantId, true, reason);
    });
  };

  // Reanudar Pedidos
  const handleResumeOrders = () => {
    setIsPaused(false);
    setPauseReason('');

    startTransition(async () => {
      await toggleOrderPauseAction(tenantId, false);
    });
  };

  // Separación y filtrado inteligente de pedidos
  const nowTime = new Date().getTime();

  const [desktopKanban, setDesktopKanban] = useState<boolean>(true);
  const [dragOverCol, setDragOverCol] = useState<OrderStatus | null>(null);
  const [draggingOrderId, setDraggingOrderId] = useState<string | null>(null);

  const handleDropOnColumn = (e: React.DragEvent, targetStatus: OrderStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const orderId = e.dataTransfer.getData('text/plain') || draggingOrderId;
    if (orderId) {
      handleStatusChange(orderId, targetStatus);
    }
    setDraggingOrderId(null);
  };

  // Pedidos Programados para el futuro (que aún no entraron en la ventana de preparación)
  const scheduledOrders = orders.filter((o) => {
    if (o.orderType !== 'pickup_scheduled' || !o.scheduledFor) return false;
    if (o.orderStatus === 'picked_up' || o.orderStatus === 'cancelled') return false;
    const scheduledTimestamp = new Date(o.scheduledFor).getTime();
    // Si falta más de prepMinutes para el retiro, permanece en 'scheduled'
    return scheduledTimestamp - nowTime > prepMinutes * 60000;
  });

  const pendingOrders = orders.filter((o) => {
    if (o.orderStatus !== 'pending') return false;
    // Si es programado pero ya entró en la ventana de preparación, aparece en nuevos
    if (o.orderType === 'pickup_scheduled' && o.scheduledFor) {
      const scheduledTimestamp = new Date(o.scheduledFor).getTime();
      return scheduledTimestamp - nowTime <= prepMinutes * 60000;
    }
    return true;
  });

  const preparingOrders = orders.filter(
    (o) => o.orderStatus === 'accepted' || o.orderStatus === 'preparing'
  );
  const readyOrders = orders.filter((o) => o.orderStatus === 'ready');
  const completedOrders = orders.filter(
    (o) => o.orderStatus === 'picked_up' || o.orderStatus === 'cancelled'
  );

  let currentList: KitchenOrder[] = [];
  if (activeTab === 'pending') currentList = pendingOrders;
  else if (activeTab === 'preparing') currentList = preparingOrders;
  else if (activeTab === 'ready') currentList = readyOrders;
  else if (activeTab === 'scheduled') currentList = scheduledOrders;
  else currentList = completedOrders;

  return (
    <div className="min-h-screen bg-[#f0f4fc] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 p-3 sm:p-5 lg:p-6 pb-32 max-w-7xl mx-auto w-full antialiased space-y-5 selection:bg-[#5865F2] selection:text-white transition-colors duration-200">
      {/* 1. BARRA SUPERIOR OPERATIVA */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none transition-all">
        {/* Navegación y Título */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-center justify-center text-[#5865F2] shrink-0 shadow-sm">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <span>Comandera KDS</span>
              </h1>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="En vivo" />
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider hidden sm:inline">
                Online
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Despacho en tiempo real para cocina y mostrador
            </p>
          </div>
        </div>

        {/* Controles de Cocina (ETA + Pausa + Sonido + Switch Kanban) */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
          {/* Selector de ETA */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleUpdateEta(prepMinutes - 5)}
              className="w-7 h-7 rounded-xl text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="-5 minutos"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setShowEtaModal(true)}
              className="px-2.5 py-1 rounded-xl text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-[#5865F2]" />
              <span>{prepMinutes} min</span>
            </button>

            <button
              type="button"
              onClick={() => handleUpdateEta(prepMinutes + 5)}
              className="w-7 h-7 rounded-xl text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="+5 minutos"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Switch de Pausa */}
          {isPaused ? (
            <button
              type="button"
              onClick={handleResumeOrders}
              className="px-3.5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Reanudar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowPauseModal(true)}
              className="px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800/60 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pausar</span>
            </button>
          )}

          {/* Botón de Sonido */}
          <button
            type="button"
            onClick={() => setSoundEnabled((s) => !s)}
            className={`p-2.5 rounded-2xl border text-xs font-bold transition-all ${
              soundEnabled
                ? 'bg-[#5865F2]/10 border-[#5865F2]/20 text-[#5865F2] shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Sonido activado' : 'Sonido silenciado'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Selector de Modo en Desktop: Kanban vs Solapas */}
          <div className="hidden md:flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 ml-1">
            <button
              type="button"
              onClick={() => setDesktopKanban(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                desktopKanban
                  ? 'bg-[#5865F2] text-white font-black shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Vista de 3 Columnas simultáneas para PC"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban PC</span>
            </button>
            <button
              type="button"
              onClick={() => setDesktopKanban(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                !desktopKanban
                  ? 'bg-[#5865F2] text-white font-black shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Vista por Pestañas individuales"
            >
              <List className="w-3.5 h-3.5" />
              <span>Solapas</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. ALERTA DESTACADA SI LOS PEDIDOS ESTÁN PAUSADOS */}
      {isPaused && (
        <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Recepción de pedidos pausada:</span>{' '}
              <span className="text-rose-700 dark:text-rose-300">{pauseReason || 'En pausa'}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResumeOrders}
            className="text-xs font-black uppercase px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shrink-0 active:scale-95 transition-all shadow-md shadow-rose-600/20"
          >
            Abrir Pedidos
          </button>
        </div>
      )}

      {/* 3. VISTA KANBAN RESPONSIVE PARA DESKTOP (3 Columnas en paralelo) */}
      {desktopKanban ? (
        <div className="space-y-4">
          {/* Pestañas de Acceso Rápido a Programados e Historial en modo Kanban */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Tablero Activo
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold shadow-2xs">
                {pendingOrders.length + preparingOrders.length + readyOrders.length} en curso
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setDesktopKanban(false);
                  setActiveTab('scheduled');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  scheduledOrders.length > 0
                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300'
                    : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-2xs'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Programados ({scheduledOrders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDesktopKanban(false);
                  setActiveTab('completed');
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-2xs transition-all flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Historial ({completedOrders.length})</span>
              </button>
            </div>
          </div>

          {/* Hint de Drag and Drop */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs shadow-2xs">
            <span className="text-[#5865F2] font-black">💡 Drag & Drop activo:</span>
            <span>Arrastrá las tarjetas de pedidos entre columnas para cambiar su estado en tiempo real.</span>
          </div>

          {/* 3 Columnas Kanban para PC */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-start">
            {/* Columna 1: Nuevos */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverCol !== 'pending') setDragOverCol('pending');
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverCol(null);
                }
              }}
              onDrop={(e) => handleDropOnColumn(e, 'pending')}
              className={`space-y-3 p-5 rounded-3xl border transition-all duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none ${
                dragOverCol === 'pending'
                  ? 'bg-indigo-50/40 dark:bg-[#5865F2]/10 border-[#5865F2] ring-2 ring-[#5865F2]/20 scale-[1.01]'
                  : 'bg-white dark:bg-[#111827] border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#5865F2]" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-[#5865F2]">
                    Nuevos / Por Preparar
                  </h2>
                </div>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#5865F2]/10 dark:bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/20 dark:border-[#5865F2]/40">
                  {pendingOrders.length}
                </span>
              </div>

              <div className="space-y-3">
                {pendingOrders.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-1">
                    <CheckCircle className="w-8 h-8 mx-auto opacity-30 text-slate-400 dark:text-slate-500" />
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Sin pedidos nuevos</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">Soltá un pedido aquí para marcarlo como nuevo</p>
                  </div>
                ) : (
                  pendingOrders.map((order) => (
                    <OrderCardItem
                      key={order.id}
                      order={order}
                      tenantSlug={tenantSlug}
                      nowTime={nowTime}
                      prepMinutes={prepMinutes}
                      currency={currency}
                      isPendingTransition={isPendingTransition}
                      handleStatusChange={handleStatusChange}
                      onDragStartItem={(id) => setDraggingOrderId(id)}
                      onDragEndItem={() => {
                        setDraggingOrderId(null);
                        setDragOverCol(null);
                      }}
                      isBeingDragged={draggingOrderId === order.id}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Columna 2: En Cocina */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverCol !== 'preparing') setDragOverCol('preparing');
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverCol(null);
                }
              }}
              onDrop={(e) => handleDropOnColumn(e, 'preparing')}
              className={`space-y-3 p-5 rounded-3xl border transition-all duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none ${
                dragOverCol === 'preparing'
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-400 ring-2 ring-amber-400/20 scale-[1.01]'
                  : 'bg-white dark:bg-[#111827] border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    En Cocina / Marchando
                  </h2>
                </div>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  {preparingOrders.length}
                </span>
              </div>

              <div className="space-y-3">
                {preparingOrders.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-1">
                    <Flame className="w-8 h-8 mx-auto opacity-30 text-slate-400 dark:text-slate-500" />
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Plancha despejada</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">Soltá un pedido aquí para empezar a cocinar</p>
                  </div>
                ) : (
                  preparingOrders.map((order) => (
                    <OrderCardItem
                      key={order.id}
                      order={order}
                      tenantSlug={tenantSlug}
                      nowTime={nowTime}
                      prepMinutes={prepMinutes}
                      currency={currency}
                      isPendingTransition={isPendingTransition}
                      handleStatusChange={handleStatusChange}
                      onDragStartItem={(id) => setDraggingOrderId(id)}
                      onDragEndItem={() => {
                        setDraggingOrderId(null);
                        setDragOverCol(null);
                      }}
                      isBeingDragged={draggingOrderId === order.id}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Columna 3: Listos */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverCol !== 'ready') setDragOverCol('ready');
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverCol(null);
                }
              }}
              onDrop={(e) => handleDropOnColumn(e, 'ready')}
              className={`space-y-3 p-5 rounded-3xl border transition-all duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none ${
                dragOverCol === 'ready'
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-400 ring-2 ring-emerald-400/20 scale-[1.01]'
                  : 'bg-white dark:bg-[#111827] border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Listos para Retiro
                  </h2>
                </div>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {readyOrders.length}
                </span>
              </div>

              <div className="space-y-3">
                {readyOrders.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-1">
                    <Check className="w-8 h-8 mx-auto opacity-30 text-slate-400 dark:text-slate-500" />
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Sin pedidos para entregar</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">Soltá un pedido aquí para avisar que está listo</p>
                  </div>
                ) : (
                  readyOrders.map((order) => (
                    <OrderCardItem
                      key={order.id}
                      order={order}
                      tenantSlug={tenantSlug}
                      nowTime={nowTime}
                      prepMinutes={prepMinutes}
                      currency={currency}
                      isPendingTransition={isPendingTransition}
                      handleStatusChange={handleStatusChange}
                      onDragStartItem={(id) => setDraggingOrderId(id)}
                      onDragEndItem={() => {
                        setDraggingOrderId(null);
                        setDragOverCol(null);
                      }}
                      isBeingDragged={draggingOrderId === order.id}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VISTA POR PESTAÑAS (Mobile-friendly y modo tab) */
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-sm max-w-xl mx-auto">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-0.5 ${
                activeTab === 'pending'
                  ? 'bg-[#5865F2] text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Nuevos</span>
              <span className="text-[10px] font-extrabold px-1.5 rounded-full bg-black/10 dark:bg-white/10">
                {pendingOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('preparing')}
              className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-0.5 ${
                activeTab === 'preparing'
                  ? 'bg-[#5865F2] text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Cocina</span>
              <span className="text-[10px] font-extrabold px-1.5 rounded-full bg-black/10 dark:bg-white/10">
                {preparingOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ready')}
              className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-0.5 ${
                activeTab === 'ready'
                  ? 'bg-[#5865F2] text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Listos</span>
              <span className="text-[10px] font-extrabold px-1.5 rounded-full bg-black/10 dark:bg-white/10">
                {readyOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('scheduled')}
              className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-0.5 ${
                activeTab === 'scheduled'
                  ? 'bg-[#5865F2] text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Prog.</span>
              <span className="text-[10px] font-extrabold px-1.5 rounded-full bg-black/10 dark:bg-white/10">
                {scheduledOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-0.5 ${
                activeTab === 'completed'
                  ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Hist.</span>
              <span className="text-[10px] font-extrabold px-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                {completedOrders.length}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentList.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500 space-y-1">
                <CheckCircle className="w-10 h-10 mx-auto opacity-30 text-slate-400 dark:text-slate-500" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No hay pedidos en esta sección</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Los nuevos pedidos ingresarán automáticamente</p>
              </div>
            ) : (
              currentList.map((order) => (
                <OrderCardItem
                  key={order.id}
                  order={order}
                  tenantSlug={tenantSlug}
                  nowTime={nowTime}
                  prepMinutes={prepMinutes}
                  currency={currency}
                  isPendingTransition={isPendingTransition}
                  handleStatusChange={handleStatusChange}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL PARA CAMBIAR TIEMPO ESTIMADO (ETA) */}
      {showEtaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-center justify-center text-[#5865F2]">
                  <Clock className="w-4 h-4" />
                </div>
                <span>Tiempo de cocina actual</span>
              </h3>
              <button
                onClick={() => setShowEtaModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Seleccioná los minutos promedio que tardan los nuevos pedidos en despacharse:
            </p>

            <div className="grid grid-cols-4 gap-2">
              {PREPARATION_PRESETS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleUpdateEta(mins)}
                  className={`py-2.5 rounded-xl text-xs font-black border transition-all ${
                    prepMinutes === mins
                      ? 'bg-[#5865F2] border-[#5865F2] text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA PAUSAR PEDIDOS */}
      {showPauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-500">
                  <Pause className="w-4 h-4" />
                </div>
                <span>Pausar recepción de pedidos</span>
              </h3>
              <button
                onClick={() => setShowPauseModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              La carta permanecerá visible, pero no se aceptarán nuevos pedidos. Elegí un motivo:
            </p>

            <div className="space-y-1.5">
              {PAUSE_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleConfirmPause(r)}
                  className="w-full text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <input
                type="text"
                placeholder="O escribir otro motivo..."
                value={customPauseReason}
                onChange={(e) => setCustomPauseReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#5865F2] mb-3 transition-colors"
              />
              <button
                type="button"
                disabled={!customPauseReason.trim()}
                onClick={() => handleConfirmPause(customPauseReason.trim())}
                className="w-full py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs disabled:opacity-40 shadow-md shadow-rose-600/20 active:scale-95 transition-all"
              >
                Confirmar Pausa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface OrderCardItemProps {
  order: KitchenOrder;
  tenantSlug: string;
  nowTime: number;
  prepMinutes: number;
  currency: string;
  isPendingTransition: boolean;
  handleStatusChange: (orderId: string, newStatus: OrderStatus) => void;
  onDragStartItem?: (orderId: string) => void;
  onDragEndItem?: () => void;
  isBeingDragged?: boolean;
}

function OrderCardItem({
  order,
  tenantSlug,
  nowTime,
  prepMinutes,
  currency,
  isPendingTransition,
  handleStatusChange,
  onDragStartItem,
  onDragEndItem,
  isBeingDragged = false,
}: OrderCardItemProps) {
  const timeAgo = Math.round(
    (new Date().getTime() - new Date(order.createdAt).getTime()) / 60000
  );

  // Alerta si el pedido programado debe empezar a cocinarse ya
  const isScheduledUrgent =
    order.orderType === 'pickup_scheduled' &&
    order.scheduledFor &&
    new Date(order.scheduledFor).getTime() - nowTime <= prepMinutes * 60000;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', order.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStartItem?.(order.id);
      }}
      onDragEnd={() => {
        onDragEndItem?.();
      }}
      className={`p-5 rounded-3xl bg-white dark:bg-[#111827] border space-y-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none cursor-grab active:cursor-grabbing transition-all select-none hover:shadow-md ${
        isBeingDragged ? 'opacity-30 scale-95 border-dashed border-[#5865F2]' : ''
      } ${
        isScheduledUrgent
          ? 'border-[#5865F2] ring-2 ring-[#5865F2]/20'
          : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Header de la comanda */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div
              title="Arrastrar comanda a otra columna"
              className="p-1 -ml-1 text-slate-400 hover:text-[#5865F2] transition-colors"
            >
              <GripVertical className="w-4 h-4" />
            </div>
            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              #{order.orderNumber}
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              {order.customerName}
            </span>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5 mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              <span suppressHydrationWarning>Hace {timeAgo} min</span>
            </span>

            {order.orderType === 'pickup_scheduled' && order.scheduledFor && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-bold text-[10px]">
                <Calendar className="w-3 h-3" />
                <span>
                  Retiro:{' '}
                  {new Date(order.scheduledFor).toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </span>
            )}
          </div>
        </div>

        <a
          href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shrink-0"
        >
          <Phone className="w-4 h-4" />
        </a>
      </div>

      {/* Ítems a preparar */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
        {order.items.map((item) => (
          <div key={item.id} className="text-xs">
            <div className="flex items-baseline justify-between font-bold text-slate-800 dark:text-slate-200">
              <span>
                <span className="text-[#5865F2] font-black mr-1.5 text-sm">
                  {item.quantity}x
                </span>{' '}
                {item.productName}
              </span>
            </div>

            {item.optionsSnapshot?.options && item.optionsSnapshot.options.length > 0 && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-4 space-y-0.5 mt-0.5">
                {item.optionsSnapshot.options.map((opt, i) => (
                  <p key={i}>+ {opt.name}</p>
                ))}
              </div>
            )}

            {item.optionsSnapshot?.notes && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium italic pl-4 mt-0.5">
                &ldquo;{item.optionsSnapshot.notes}&rdquo;
              </p>
            )}
          </div>
        ))}

        {order.notes && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-bold text-[#5865F2]">Nota general:</span> {order.notes}
          </div>
        )}
      </div>

      {/* Total y Estado de Pago */}
      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-slate-500 dark:text-slate-400 font-medium">Total: </span>
          <span className="font-black text-slate-900 dark:text-white">
            {formatCurrency(order.total, currency)}
          </span>
        </div>

        <span
          className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
        >
          {order.paymentStatus === 'cash_on_pickup'
            ? 'Cobrar en Efectivo'
            : 'Pagado Online'}
        </span>
      </div>

      {/* BOTONERA DE ACCIÓN RÁPIDA DE 1-TAP */}
      <div className="pt-1">
        {order.orderStatus === 'pending' && (
          <button
            type="button"
            disabled={isPendingTransition}
            onClick={() => handleStatusChange(order.id, 'preparing')}
            className="w-full py-3 px-4 rounded-2xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-black text-xs sm:text-sm tracking-wide shadow-md shadow-[#5865F2]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Flame className="w-4 h-4" />
            <span>ACEPTAR Y PREPARAR</span>
          </button>
        )}

        {(order.orderStatus === 'accepted' || order.orderStatus === 'preparing') && (
          <button
            type="button"
            disabled={isPendingTransition}
            onClick={() => handleStatusChange(order.id, 'ready')}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm tracking-wide shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>MARCAR LISTO PARA RETIRAR</span>
          </button>
        )}

        {order.orderStatus === 'ready' && (
          <div className="space-y-2">
            {order.customerPhone && (
              <button
                type="button"
                onClick={() => {
                  const trackingUrl = `${window.location.origin}/c/${tenantSlug}/track/${order.id}`;
                  const url = buildOrderReadyWhatsAppUrl({
                    phone: order.customerPhone!,
                    customerName: order.customerName,
                    orderNumber: order.orderNumber,
                    tenantName: tenantSlug,
                    trackingUrl,
                  });
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="w-full py-2.5 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white text-emerald-500" />
                <span>AVISAR POR WHATSAPP (1-TAP)</span>
              </button>
            )}

            <button
              type="button"
              disabled={isPendingTransition}
              onClick={() => handleStatusChange(order.id, 'picked_up')}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>MARCAR COMO ENTREGADO</span>
            </button>
          </div>
        )}

        {order.orderStatus === 'picked_up' && (
          <div className="w-full py-2 text-center text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Pedido completado</span>
          </div>
        )}
      </div>
    </div>
  );
}
