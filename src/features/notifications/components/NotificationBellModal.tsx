'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import {
  Bell,
  X,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Flame,
  ArrowRight,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCheck,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { soundManager } from '@/features/notifications';

export interface NotificationOrderSummary {
  id: string;
  orderNumber: number;
  customerName: string;
  orderStatus: string;
  paymentStatus?: string;
  total: number;
  createdAt: string;
}

interface NotificationBellModalProps {
  tenantId: string;
  tenantSlug: string;
  currency: string;
  initialOrders: NotificationOrderSummary[];
}

export function NotificationBellModal({
  tenantId,
  tenantSlug,
  currency,
  initialOrders,
}: NotificationBellModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [orders, setOrders] = useState<NotificationOrderSummary[]>(initialOrders);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const bellIconRef = useRef<SVGSVGElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Sincronizar initialOrders si cambian desde el server
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  // Cargar estado de sonido desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('takeaway_admin_sound_enabled');
    if (saved !== null) {
      setSoundEnabled(saved === 'true');
    }
  }, []);

  // Escucha en vivo de nuevos pedidos para actualizar la campanita en tiempo real
  useEffect(() => {
    const supabase = createClient();
    const channelId = Math.random().toString(36).substring(2, 9);

    const channel = supabase
      .channel(`bell_modal_${tenantId}_${channelId}`)
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
            const row = payload.new as {
              id: string;
              order_number: number;
              customer_name: string;
              order_status: string;
              payment_status?: string;
              total: number;
              created_at: string;
            };
            const newItem: NotificationOrderSummary = {
              id: row.id,
              orderNumber: row.order_number,
              customerName: row.customer_name,
              orderStatus: row.order_status,
              paymentStatus: row.payment_status,
              total: Number(row.total),
              createdAt: row.created_at,
            };
            setOrders((prev) => {
              if (prev.some((o) => o.id === newItem.id)) return prev;
              return [newItem, ...prev];
            });

            // Sacudir la campanita con GSAP cuando entra un pedido nuevo
            if (bellIconRef.current) {
              gsap.fromTo(
                bellIconRef.current,
                { rotation: -22, scale: 1.2 },
                {
                  rotation: 0,
                  scale: 1,
                  duration: 0.7,
                  ease: 'elastic.out(1.2, 0.3)',
                }
              );
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as {
              id: string;
              order_status: string;
              payment_status?: string;
            };
            setOrders((prev) =>
              prev.map((o) =>
                o.id === updated.id
                  ? {
                    ...o,
                    orderStatus: updated.order_status,
                    paymentStatus: updated.payment_status ?? o.paymentStatus,
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
  }, [tenantId]);

  const pendingOrders = orders.filter((o) => o.orderStatus === 'pending');
  const unreadPendingCount = pendingOrders.filter((o) => !readIds.has(o.id)).length;

  // Calcular vector de origen desde el botón hacia el modal
  const getDeltaFromButton = useCallback(() => {
    if (!buttonRef.current || !modalRef.current) {
      return { deltaX: 0, deltaY: -120 };
    }
    const btnRect = buttonRef.current.getBoundingClientRect();
    const modalRect = modalRef.current.getBoundingClientRect();

    const btnCenterX = btnRect.left + btnRect.width / 2;
    const btnCenterY = btnRect.top + btnRect.height / 2;

    const modalCenterX = modalRect.left + modalRect.width / 2;
    const modalCenterY = modalRect.top + modalRect.height / 2;

    return {
      deltaX: btnCenterX - modalCenterX,
      deltaY: btnCenterY - modalCenterY,
    };
  }, []);

  // Abrir Modal animando desde el botón con GSAP
  const handleOpen = () => {
    if (isClosing) return;

    // Animación elástica en el icono de la campanita al tocarlo
    if (bellIconRef.current) {
      gsap.fromTo(
        bellIconRef.current,
        { rotation: -20, scale: 0.82 },
        {
          rotation: 0,
          scale: 1,
          duration: 0.6,
          ease: 'elastic.out(1.2, 0.35)',
        }
      );
    }

    setIsOpen(true);
  };

  // Ejecutar animación GSAP de apertura cuando el modal se monta en el DOM
  useEffect(() => {
    if (!isOpen || isClosing) return;

    const ctx = gsap.context(() => {
      if (!modalRef.current || !backdropRef.current) return;

      // Asegurar que el modal esté en posición final un instante antes de medir
      gsap.set(modalRef.current, { x: 0, y: 0, scale: 1 });
      const { deltaX, deltaY } = getDeltaFromButton();

      const tl = gsap.timeline();

      // 1. Fade in del fondo desenfocado
      tl.fromTo(
        backdropRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.32,
          ease: 'power2.out',
        },
        0
      );

      // 2. Expansión morfing fluida desde las coordenadas exactas del botón
      tl.fromTo(
        modalRef.current,
        {
          x: deltaX,
          y: deltaY,
          scaleX: 0.06,
          scaleY: 0.06,
          opacity: 0,
          borderRadius: '999px',
        },
        {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          borderRadius: '24px',
          duration: 0.52,
          ease: 'expo.out',
        },
        0
      );

      // 3. Stagger fluido de los elementos internos del modal
      if (contentRef.current) {
        const children = contentRef.current.querySelectorAll('[data-gsap-item]');
        if (children.length > 0) {
          tl.fromTo(
            children,
            { y: 14, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.36,
              stagger: 0.045,
              ease: 'power3.out',
            },
            0.16
          );
        }
      }
    });

    return () => ctx.revert();
  }, [isOpen, isClosing, getDeltaFromButton]);

  // Cerrar Modal replegándose de vuelta hacia el botón con GSAP
  const handleClose = useCallback(() => {
    if (!isOpen || isClosing) return;
    setIsClosing(true);

    if (!modalRef.current || !backdropRef.current) {
      setIsOpen(false);
      setIsClosing(false);
      return;
    }

    const { deltaX, deltaY } = getDeltaFromButton();
    const tl = gsap.timeline({
      onComplete: () => {
        setIsOpen(false);
        setIsClosing(false);
      },
    });

    if (contentRef.current) {
      const children = contentRef.current.querySelectorAll('[data-gsap-item]');
      if (children.length > 0) {
        tl.to(
          children,
          {
            opacity: 0,
            y: -6,
            duration: 0.16,
            ease: 'power2.in',
          },
          0
        );
      }
    }

    tl.to(
      modalRef.current,
      {
        x: deltaX,
        y: deltaY,
        scaleX: 0.06,
        scaleY: 0.06,
        opacity: 0,
        borderRadius: '999px',
        duration: 0.38,
        ease: 'expo.inOut',
      },
      0.04
    );

    tl.to(
      backdropRef.current,
      {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.inOut',
      },
      0.08
    );
  }, [isOpen, isClosing, getDeltaFromButton]);

  // Cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('takeaway_admin_sound_enabled', String(next));
      if (next) {
        soundManager.playPaymentApproved();
      }
      return next;
    });
  };

  const handleMarkAllRead = () => {
    setReadIds(new Set(orders.map((o) => o.id)));
  };

  const formatTimeAgo = (isoDate: string) => {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const mins = Math.max(0, Math.floor(diffMs / 60000));
    if (mins < 1) return 'Hace instantes';
    if (mins === 1) return 'Hace 1 min';
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    return `Hace ${hours} h`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Nuevo en Cocina',
          className:
            'bg-[#1d64f2]/15 text-[#60a5fa] border-[#1d64f2]/35 dark:bg-[#1d64f2]/20 dark:text-[#60a5fa]',
          icon: Sparkles,
        };
      case 'accepted':
      case 'preparing':
        return {
          label: 'En Preparación',
          className:
            'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
          icon: Flame,
        };
      case 'ready':
        return {
          label: 'Listo para Retirar',
          className:
            'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          icon: CheckCircle2,
        };
      default:
        return {
          label: 'Entregado',
          className:
            'bg-slate-500/15 text-slate-500 dark:text-[#8b98b1] border-slate-500/25',
          icon: CheckCircle2,
        };
    }
  };

  return (
    <>
      {/* BOTÓN DE CAMPANITA DE NOTIFICACIONES */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        title={`${pendingOrders.length} pedidos pendientes en cocina`}
        aria-label="Abrir centro de notificaciones"
        className="relative p-2.5 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200/80 dark:border-[#222d46] text-slate-600 dark:text-[#d5deed] hover:text-[#1d64f2] dark:hover:text-[#60a5fa] hover:border-[#1d64f2]/50 shadow-sm transition-colors cursor-pointer active:scale-95"
      >
        <Bell ref={bellIconRef} className="w-4 h-4" />
        {unreadPendingCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#1d64f2] text-white text-[9px] font-black flex items-center justify-center shadow-[0_0_10px_rgba(29,100,242,0.7)] animate-pulse">
            {unreadPendingCount}
          </span>
        )}
      </button>

      {/* MODAL ANIMADO CON GSAP DESDE EL BOTÓN */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop con Blur */}
          <div
            ref={backdropRef}
            onClick={handleClose}
            className="fixed inset-0 bg-black/65 backdrop-blur-md cursor-pointer"
          />

          {/* Tarjeta del Modal (Diseño Antigravity Dark Azulado) */}
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Centro de Notificaciones"
            className="relative z-10 w-full max-w-lg bg-white dark:bg-[#121826] border border-slate-200/90 dark:border-[#24324f] rounded-3xl shadow-2xl dark:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.75),0_0_0_1px_rgba(59,130,246,0.12)] overflow-hidden text-slate-800 dark:text-[#edf2f7] flex flex-col max-h-[85vh] will-change-transform"
          >
            <div ref={contentRef} className="flex flex-col max-h-[85vh]">
              {/* Header del Modal */}
              <div
                data-gsap-item
                className="p-5 sm:p-6 border-b border-slate-100 dark:border-[#1e2942] bg-slate-50/60 dark:bg-[#0e131f] flex items-center justify-between gap-3 shrink-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#1d64f2]/15 border border-[#1d64f2]/30 text-[#1d64f2] dark:text-[#60a5fa] flex items-center justify-center shadow-inner shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                        Centro de Notificaciones
                      </h2>
                      {pendingOrders.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#1d64f2] text-white text-[10px] font-black shadow-xs">
                          {pendingOrders.length} pendientes
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-[#8b98b1] font-medium">
                      Actividad de pedidos y alertas de cocina en vivo
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Botón Sonido */}
                  <button
                    type="button"
                    onClick={toggleSound}
                    title={soundEnabled ? 'Silenciar alertas' : 'Activar alertas sonoras'}
                    className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${soundEnabled
                      ? 'bg-[#1d64f2]/15 border-[#1d64f2]/35 text-[#1d64f2] dark:text-[#60a5fa]'
                      : 'bg-slate-100 dark:bg-[#161e31] border-slate-200 dark:border-[#243049] text-slate-400 dark:text-[#6e7d99]'
                      }`}
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </button>

                  {/* Botón Cerrar (Replegar al botón) */}
                  <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Cerrar notificaciones"
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#161e31] hover:bg-slate-200 dark:hover:bg-[#1e2942] border border-slate-200 dark:border-[#243049] text-slate-500 dark:text-[#8b98b1] hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Barra rápida de acciones */}
              {orders.length > 0 && (
                <div
                  data-gsap-item
                  className="px-5 py-2.5 bg-white dark:bg-[#121826] border-b border-slate-100 dark:border-[#1c2539] flex items-center justify-between text-[11px]"
                >
                  <span className="font-semibold text-slate-500 dark:text-[#8b98b1]">
                    Mostrando últimos pedidos de hoy ({orders.length})
                  </span>
                  {unreadPendingCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[#1d64f2] dark:text-[#60a5fa] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Marcar como vistas</span>
                    </button>
                  )}
                </div>
              )}

              {/* Lista de Notificaciones */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1 no-scrollbar">
                {orders.length === 0 ? (
                  <div
                    data-gsap-item
                    className="py-12 px-4 text-center space-y-3 rounded-2xl bg-slate-50/70 dark:bg-[#0e131f]/80 border border-slate-200/60 dark:border-[#1e2942]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#1d64f2]/10 border border-[#1d64f2]/25 text-[#1d64f2] dark:text-[#60a5fa] flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-6 h-6 opacity-80" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">
                        No hay notificaciones pendientes hoy
                      </p>
                      <p className="text-xs text-slate-500 dark:text-[#8b98b1] max-w-xs mx-auto">
                        Cuando tus clientes envíen pedidos desde la carta QR, aparecerán acá en tiempo real.
                      </p>
                    </div>
                  </div>
                ) : (
                  orders.slice(0, 8).map((order) => {
                    const badge = getStatusBadge(order.orderStatus);
                    const StatusIcon = badge.icon;
                    const isUnread =
                      order.orderStatus === 'pending' && !readIds.has(order.id);

                    return (
                      <Link
                        key={order.id}
                        data-gsap-item
                        href={`/admin/${tenantSlug}/orders`}
                        onClick={handleClose}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 group ${isUnread
                          ? 'bg-blue-50/50 dark:bg-[#162038] border-[#1d64f2]/40 dark:border-[#2b4170] hover:border-[#1d64f2]'
                          : 'bg-slate-50/70 dark:bg-[#0e131f] border-slate-200/80 dark:border-[#1e2942] hover:border-slate-300 dark:hover:border-[#2e3e63]'
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border ${isUnread
                              ? 'bg-[#1d64f2] text-white border-[#3b82f6] shadow-md shadow-[#1d64f2]/25'
                              : 'bg-white dark:bg-[#151d2e] text-slate-700 dark:text-[#d5deed] border-slate-200 dark:border-[#24324f]'
                              }`}
                          >
                            #{order.orderNumber}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                {order.customerName}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.className}`}
                              >
                                <StatusIcon className="w-2.5 h-2.5" />
                                <span>{badge.label}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-[#8b98b1]">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(order.createdAt)}
                              </span>
                              <span>•</span>
                              <span className="font-mono font-bold text-slate-700 dark:text-[#60a5fa]">
                                {formatCurrency(order.total, currency)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <ArrowRight className="w-4 h-4 text-slate-400 dark:text-[#6e7d99] group-hover:text-[#1d64f2] dark:group-hover:text-[#60a5fa] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </Link>
                    );
                  })
                )}
              </div>

              {/* Footer del Modal con acceso directo a la Comandera KDS */}
              <div
                data-gsap-item
                className="p-4 sm:p-5 border-t border-slate-100 dark:border-[#1e2942] bg-slate-50/60 dark:bg-[#0e131f] flex items-center justify-between gap-3 shrink-0"
              >
                <button
                  type="button"
                  onClick={handleClose}
                  className="py-2.5 px-4 rounded-xl bg-white dark:bg-[#161e31] hover:bg-slate-100 dark:hover:bg-[#1e2942] border border-slate-200 dark:border-[#24324f] text-xs font-bold text-slate-600 dark:text-[#d5deed] transition-colors cursor-pointer"
                >
                  Cerrar
                </button>

                <Link
                  href={`/admin/${tenantSlug}/orders`}
                  onClick={handleClose}
                  className="flex-1 py-2.5 px-5 rounded-xl bg-[#1d64f2] hover:bg-[#1956d4] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#1d64f2]/30 active:scale-95 transition-all"
                >
                  <Flame className="w-4 h-4 fill-current" />
                  <span>Ir a Comandera</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

