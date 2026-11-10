'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Bell,
  Volume2,
  VolumeX,
  CreditCard,
  ShoppingBag,
  ArrowRight,
  X,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  soundManager,
  triggerKitchenAlertVibration,
  sendDesktopNotification,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
} from '@/features/notifications';

interface AdminNotificationListenerProps {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
}

interface AlertToast {
  id: string;
  type: 'new_order' | 'payment_approved';
  title: string;
  subtitle: string;
  orderNumber: number;
  orderId: string;
  amount?: number;
  createdAt: number;
}

export function AdminNotificationListener({
  tenantId,
  tenantSlug,
  tenantName,
}: AdminNotificationListenerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [activeAlert, setActiveAlert] = useState<AlertToast | null>(null);

  // Mantener referencias actualizadas para no reiniciar el canal al alternar sonido o ruta
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const isOrdersPage = pathname?.endsWith('/orders') || pathname?.includes('/orders/');
  const isOrdersPageRef = useRef(isOrdersPage);
  useEffect(() => {
    isOrdersPageRef.current = isOrdersPage;
  }, [isOrdersPage]);

  // Cargar preferencia de sonido desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('takeaway_admin_sound_enabled');
    if (saved !== null) {
      setSoundEnabled(saved === 'true');
    }
    setPermission(getBrowserNotificationPermission());

    // Desbloquear AudioContext en el primer click de usuario
    const unlock = () => {
      soundManager.unlockAudio();
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);

    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('takeaway_admin_sound_enabled', String(next));
      if (next) {
        soundManager.playPaymentApproved();
      }
      return next;
    });
  }, []);

  const handleRequestPermission = async () => {
    const res = await requestBrowserNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      await sendDesktopNotification({
        title: `🔔 Notificaciones activadas en ${tenantName}`,
        body: 'Te avisaremos al instante cada vez que ingrese un nuevo pedido o se apruebe un pago.',
        url: `/admin/${tenantSlug}/orders`,
      });
    }
  };

  // Suscripción Realtime a Órdenes del Carrito
  useEffect(() => {
    const supabase = createClient();
    const ordersUrl = `/admin/${tenantSlug}/orders`;

    // 1. Canal de Broadcast (solo eventos 'broadcast' para evitar colisiones de subscripción)
    const broadcastChannel = supabase
      .channel(`kds_broadcast_${tenantId}`)
      .on('broadcast', { event: 'new_order' }, ({ payload }) => {
        const newOrder = payload as {
          id: string;
          orderNumber: number;
          customerName: string;
          total: number;
        };

        // Si ya está en la comandera (/orders), KitchenKDSView gestiona su propio sonido
        if (!isOrdersPageRef.current) {
          if (soundEnabledRef.current) {
            soundManager.playNewOrderKitchen();
          }
          triggerKitchenAlertVibration();
          sendDesktopNotification({
            title: `🍔 ¡Nuevo Pedido #${newOrder.orderNumber}!`,
            body: `${newOrder.customerName} • Total: $${Number(newOrder.total).toLocaleString('es-AR')}`,
            url: ordersUrl,
            tag: `order-${newOrder.id}`,
          });
          setActiveAlert({
            id: newOrder.id,
            type: 'new_order',
            title: `¡Nuevo Pedido #${newOrder.orderNumber}!`,
            subtitle: `${newOrder.customerName} por $${Number(newOrder.total).toLocaleString('es-AR')}`,
            orderNumber: newOrder.orderNumber,
            orderId: newOrder.id,
            amount: Number(newOrder.total),
            createdAt: Date.now(),
          });
        }
        router.refresh();
      })
      .subscribe();

    // 2. Canal de Base de Datos (con identificador único para jamás colisionar con otros componentes ni hot-reload)
    const dbChannelId = Math.random().toString(36).substring(2, 9);
    const dbChannel = supabase
      .channel(`admin_notify_${tenantId}_${dbChannelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as {
              id: string;
              order_number: number;
              customer_name: string;
              total: number;
              payment_status: string;
            };

            // Solo reproducir toast/sonido global si no está ya en la comandera
            if (!isOrdersPageRef.current) {
              if (soundEnabledRef.current) {
                soundManager.playNewOrderKitchen();
              }
              triggerKitchenAlertVibration();
              sendDesktopNotification({
                title: `🍔 ¡Nuevo Pedido #${newOrder.order_number}!`,
                body: `${newOrder.customer_name} • Total: $${Number(newOrder.total).toLocaleString('es-AR')}`,
                url: ordersUrl,
                tag: `order-${newOrder.id}`,
              });
              setActiveAlert({
                id: newOrder.id,
                type: 'new_order',
                title: `¡Nuevo Pedido #${newOrder.order_number}!`,
                subtitle: `${newOrder.customer_name} por $${Number(newOrder.total).toLocaleString('es-AR')}`,
                orderNumber: newOrder.order_number,
                orderId: newOrder.id,
                amount: Number(newOrder.total),
                createdAt: Date.now(),
              });
            }
            router.refresh();
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as {
              id: string;
              order_number: number;
              customer_name: string;
              payment_status: string;
              total: number;
            };
            const old = payload.old as {
              payment_status?: string;
            } | null;

            // Si el estado de pago pasa a 'approved'
            const wasApproved = old?.payment_status === 'approved';
            const isApproved = updated.payment_status === 'approved';

            if (isApproved && !wasApproved) {
              if (soundEnabledRef.current) {
                soundManager.playPaymentApproved();
              }
              triggerKitchenAlertVibration();
              sendDesktopNotification({
                title: `💳 ¡Pago Aprobado #${updated.order_number}!`,
                body: `Cobro confirmado de ${updated.customer_name} ($${Number(updated.total).toLocaleString('es-AR')})`,
                url: ordersUrl,
                tag: `payment-${updated.id}`,
              });
              setActiveAlert({
                id: updated.id,
                type: 'payment_approved',
                title: `¡Pago Aprobado #${updated.order_number}!`,
                subtitle: `Cobro acreditado de ${updated.customer_name}`,
                orderNumber: updated.order_number,
                orderId: updated.id,
                amount: Number(updated.total),
                createdAt: Date.now(),
              });
              router.refresh();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(dbChannel);
    };
  }, [tenantId, tenantSlug, tenantName, router]);

  // Auto-ocultar toast después de 9 segundos
  useEffect(() => {
    if (!activeAlert) return;
    const timer = setTimeout(() => {
      setActiveAlert(null);
    }, 9000);
    return () => clearTimeout(timer);
  }, [activeAlert]);

  return (
    <>
      {/* Botón flotante para activar sonido y notificaciones en el panel Admin */}
      <aside aria-label="Controles de audio y notificaciones" className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2">
        {permission === 'default' && (
          <button
            type="button"
            onClick={handleRequestPermission}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 active:scale-95 transition-all animate-bounce"
            title="Activar notificaciones de escritorio para nuevos pedidos y pagos"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Activar Notificaciones</span>
          </button>
        )}

        <button
          type="button"
          onClick={toggleSound}
          className={`p-2.5 rounded-2xl border shadow-md backdrop-blur-md active:scale-95 transition-all ${
            soundEnabled
              ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-400 text-white shadow-emerald-500/20'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
          title={soundEnabled ? 'Sonido de alertas activado (clic para silenciar)' : 'Sonido silenciado (clic para activar)'}
          aria-label={soundEnabled ? 'Silenciar alertas' : 'Activar sonido de alertas'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>
      </aside>

      {/* TOAST FLOTANTE INTERACTIVO DE NUEVO PEDIDO / PAGO */}
      {activeAlert && (
        <div className="fixed top-5 right-4 sm:right-6 z-50 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
          <div
            className={`p-4 rounded-3xl shadow-2xl border backdrop-blur-xl flex flex-col gap-3 ${
              activeAlert.type === 'payment_approved'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-900/30'
                : 'bg-indigo-950/90 border-indigo-500/40 text-indigo-100 shadow-indigo-900/30'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shrink-0 ${
                    activeAlert.type === 'payment_approved'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                      : 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                  }`}
                >
                  {activeAlert.type === 'payment_approved' ? (
                    <CreditCard className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-white tracking-tight">
                      {activeAlert.title}
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                  </div>
                  <p className="text-xs text-slate-300 font-medium">
                    {activeAlert.subtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveAlert(null)}
                aria-label="Cerrar notificación"
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
              <Link
                href={`/admin/${tenantSlug}/orders`}
                onClick={() => setActiveAlert(null)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs shadow-sm active:scale-95 transition-all"
              >
                <span>Ver en Cocina</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
