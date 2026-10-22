'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ArrowLeft,
  Phone,
  Flame,
  Check,
  Bell,
  BellRing,
  Volume2,
  Smartphone,
  MessageCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import type { OrderStatus, PaymentStatus } from '@/types/database';

export interface OrderItemSnapshot {
  id: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  optionsSnapshot: {
    options?: Array<{ name: string; extraPrice: number }>;
    notes?: string;
  };
}

export interface OrderTrackingData {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  orderType: 'takeaway' | 'pickup_scheduled';
  scheduledFor: string | null;
  estimatedReadyAt: string | null;
  subtotal: number;
  discount: number;
  total: number;
  notes: string | null;
  createdAt: string;
  tenant: {
    name: string;
    slug: string;
    whatsappPhone: string | null;
    currency: string;
  };
  items: OrderItemSnapshot[];
}

interface OrderTrackingViewProps {
  initialOrder: OrderTrackingData;
}

// Generador de sonido festivo de pedido listo usando Web Audio API (Sin descargas)
function playCelebrationChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Arpegio festivo armónico: Do5 (523Hz), Mi5 (659Hz), Sol5 (784Hz), Do6 (1046Hz)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.25, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.6);
    });
  } catch {
    // Si el navegador bloquea audio antes de interacción
  }
}

// Disparador de Notificación del Navegador / Service Worker
async function sendBrowserNotification(title: string, body: string, url: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'order-status-ready',
          data: { url },
        });
        return;
      }
    }
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: 'order-status-ready',
    });
  } catch (err) {
    console.error('Error enviando notificación nativa:', err);
  }
}

export function OrderTrackingView({ initialOrder }: OrderTrackingViewProps) {
  const [order, setOrder] = useState<OrderTrackingData>(initialOrder);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const supabase = createClient();

  // Registro del Service Worker y verificación de permisos
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
      } else {
        setNotificationPermission('unsupported');
      }

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }
    }
  }, []);

  // Parpadeo del título de la pestaña si el pedido está listo
  useEffect(() => {
    if (order.orderStatus === 'ready') {
      let toggle = false;
      const interval = setInterval(() => {
        document.title = toggle
          ? `🔔 ¡PEDIDO #${order.orderNumber} LISTO!`
          : `🍔 Retirar en ${order.tenant.name}`;
        toggle = !toggle;
      }, 1200);

      return () => {
        clearInterval(interval);
        document.title = `Pedido #${order.orderNumber} - ${order.tenant.name}`;
      };
    } else {
      document.title = `Pedido #${order.orderNumber} - ${order.tenant.name}`;
    }
  }, [order.orderStatus, order.orderNumber, order.tenant.name]);

  // Suscripción en tiempo real a cambios de este pedido
  useEffect(() => {
    const channel = supabase
      .channel(`order_track_${order.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          const updated = payload.new as {
            order_status: OrderStatus;
            payment_status: PaymentStatus;
            estimated_ready_at: string | null;
          };

          setOrder((prev) => ({
            ...prev,
            orderStatus: updated.order_status,
            paymentStatus: updated.payment_status,
            estimatedReadyAt: updated.estimated_ready_at,
          }));

          // Alertas multi-canal cuando el pedido pasa a LISTO:
          if (updated.order_status === 'ready') {
            // 1. Vibración táctil en el celular
            if (typeof window !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate([300, 150, 300, 150, 500]);
            }

            // 2. Sonido festivo con Web Audio API
            playCelebrationChime();

            // 3. Notificación nativa del celular
            sendBrowserNotification(
              `🍔 ¡Tu pedido #${order.orderNumber} está listo!`,
              `Pasa a retirarlo por la ventanilla de ${order.tenant.name}. ¡Que lo disfrutes!`,
              window.location.href
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, order.orderNumber, order.tenant.name, supabase]);

  // Pedir permiso para notificaciones nativas
  const handleRequestNotification = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Tu navegador no admite notificaciones emergentes.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        playCelebrationChime();
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
        sendBrowserNotification(
          '🔔 Notificaciones activadas',
          `Te avisaremos con sonido y vibración cuando tu pedido #${order.orderNumber} esté listo.`,
          window.location.href
        );
      }
    } catch (err) {
      console.error('Error al pedir permisos:', err);
    }
  };

  // Test rápido de sonido y vibración para el cliente
  const handleTestAlerts = () => {
    playCelebrationChime();
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    sendBrowserNotification(
      '🔔 Prueba de sonido y vibración',
      '¡Así te avisaremos cuando tu pedido esté listo para retirar!',
      window.location.href
    );
  };

  // Formatear hora estimada
  const estimatedTimeFormatted = order.estimatedReadyAt
    ? new Date(order.estimatedReadyAt).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const isReady = order.orderStatus === 'ready';
  const isPreparing = order.orderStatus === 'preparing' || order.orderStatus === 'accepted';
  const isPending = order.orderStatus === 'pending';
  const isPickedUp = order.orderStatus === 'picked_up';
  const isCancelled = order.orderStatus === 'cancelled';

  return (
    <div className="min-h-screen bg-[#f0f4fc] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 p-4 sm:p-6 pb-24 max-w-xl mx-auto flex flex-col justify-between antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      <div className="space-y-6">
        {/* Barra superior de navegación */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <Link
            href={`/c/${order.tenant.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{order.tenant.name}</span>
          </Link>

          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/60 px-3 py-1 rounded-full">
            Pedido #{order.orderNumber}
          </span>
        </div>

        {/* 1. BANNER DE NOTIFICACIONES NATIVAS EN EL CELULAR */}
        {!isPickedUp && !isCancelled && notificationPermission !== 'unsupported' && (
          <div>
            {notificationPermission !== 'granted' ? (
              <div className="p-4 rounded-3xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 flex items-center justify-between gap-3 shadow-sm animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                    <Bell className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      ¿Querés que te avisemos al celular?
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Con sonido y vibración aunque bloquees el teléfono
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRequestNotification}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  Activar
                </button>
              </div>
            ) : (
              <div className="p-3 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between gap-2 text-emerald-800 dark:text-emerald-300 text-xs">
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-semibold text-[11px]">Notificaciones activadas en este dispositivo</span>
                </div>
                <button
                  type="button"
                  onClick={handleTestAlerts}
                  className="text-[10.5px] font-bold underline hover:text-emerald-950 dark:hover:text-emerald-200 shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Probar sonido</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Card de Estado Principal */}
        <div
          className={`p-6 sm:p-8 rounded-3xl border text-center space-y-4 transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.03)] ${
            isReady
              ? 'bg-white dark:bg-[#111827] border-emerald-500 shadow-emerald-500/10'
              : isPreparing
              ? 'bg-white dark:bg-[#111827] border-amber-500 shadow-amber-500/10'
              : isCancelled
              ? 'bg-white dark:bg-[#111827] border-rose-300 dark:border-rose-900'
              : 'bg-white dark:bg-[#111827] border-slate-200/80 dark:border-slate-800'
          }`}
        >
          {/* Icono de Estado */}
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center">
            {isReady && (
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
            )}
            {isPreparing && (
              <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900 flex items-center justify-center">
                <Flame className="w-8 h-8" />
              </div>
            )}
            {isPending && (
              <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>
            )}
            {isPickedUp && (
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            )}
            {isCancelled && (
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Título de Estado */}
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isReady && '¡TU PEDIDO ESTÁ LISTO!'}
              {isPreparing && 'Cocinando tu pedido'}
              {isPending && 'Pedido recibido'}
              {isPickedUp && 'Pedido entregado'}
              {isCancelled && 'Pedido cancelado'}
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs mx-auto font-medium">
              {isReady && 'Podés acercarte al mostrador con tu número de pedido.'}
              {isPreparing && 'El carrito está preparando tus platos con dedicación.'}
              {isPending && 'Esperando que cocina acepte tu comanda.'}
              {isPickedUp && '¡Gracias por tu compra! Que lo disfrutes.'}
              {isCancelled && 'El negocio no pudo procesar tu pedido.'}
            </p>
          </div>

          {/* Tiempo Estimado (ETA) */}
          {estimatedTimeFormatted && !isPickedUp && !isCancelled && (
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-xs font-bold text-amber-700 dark:text-amber-400 shadow-sm">
                <Clock className="w-3.5 h-3.5" />
                <span>Listo aprox. a las {estimatedTimeFormatted} hs</span>
              </span>
            </div>
          )}
        </div>

        {/* Barra de Pasos Visual (Timeline) */}
        {!isCancelled && (
          <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="space-y-1.5">
                <div
                  className={`h-2 rounded-full ${
                    isPending || isPreparing || isReady || isPickedUp
                      ? 'bg-indigo-600'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                />
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Recibido</span>
              </div>
              <div className="space-y-1.5">
                <div
                  className={`h-2 rounded-full ${
                    isPreparing || isReady || isPickedUp ? 'bg-amber-400' : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                />
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Cocina</span>
              </div>
              <div className="space-y-1.5">
                <div
                  className={`h-2 rounded-full ${
                    isReady || isPickedUp ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                />
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Listo</span>
              </div>
              <div className="space-y-1.5">
                <div
                  className={`h-2 rounded-full ${
                    isPickedUp ? 'bg-slate-400' : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                />
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Entregado</span>
              </div>
            </div>
          </div>
        )}

        {/* Resumen del Pedido */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Detalle del pedido</span>
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {item.quantity}x {item.productName}
                  </span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white font-mono">
                    {formatCurrency(item.subtotal, order.tenant.currency)}
                  </span>
                </div>

                {item.optionsSnapshot?.options && item.optionsSnapshot.options.length > 0 && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-4 space-y-0.5 mt-1">
                    {item.optionsSnapshot.options.map((opt, i) => (
                      <p key={i}>+ {opt.name}</p>
                    ))}
                  </div>
                )}

                {item.optionsSnapshot?.notes && (
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 italic pl-4 mt-1">
                    &ldquo;{item.optionsSnapshot.notes}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total a abonar</span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">
              {formatCurrency(order.total, order.tenant.currency)}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 flex items-center justify-between">
            <span>Forma de pago:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {order.paymentStatus === 'cash_on_pickup'
                ? 'Efectivo / Transferencia al retirar'
                : order.paymentStatus === 'approved'
                ? '✓ Pagado online'
                : 'Mercado Pago (Pendiente)'}
            </span>
          </div>

          {/* Botón de Pagar Online si está pendiente */}
          {order.paymentStatus === 'pending' && !isCancelled && (
            <div className="pt-2">
              <button
                type="button"
                onClick={async () => {
                  const { createPaymentPreferenceAction } = await import(
                    '@/features/payments/actions'
                  );
                  const res = await createPaymentPreferenceAction(order.id);
                  if (res.success && res.data.initPoint) {
                    window.location.href = res.data.initPoint;
                  } else {
                    const err = !res.success ? res.error : 'Error al iniciar pago.';
                    alert(err);
                  }
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Pagar con Mercado Pago</span>
              </button>
            </div>
          )}

          {order.paymentStatus === 'approved' && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-bold text-center">
              ✓ Pago acreditado correctamente
            </div>
          )}
        </div>
      </div>

      {/* Botón de Contacto por WhatsApp si el carrito tiene número */}
      {order.tenant.whatsappPhone && (
        <div className="pt-5">
          <a
            href={`https://wa.me/${order.tenant.whatsappPhone.replace(/[^0-9]/g, '')}?text=Hola!%20Tengo%20una%20consulta%20sobre%20mi%20pedido%20%23${order.orderNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Consultar al carrito por WhatsApp</span>
          </a>
        </div>
      )}
    </div>
  );
}
