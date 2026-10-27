'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Clock,
  Banknote,
  CreditCard,
  ChevronLeft,
  ArrowRight,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCurrency, toTitleCase } from '@/lib/utils';
import { createOrderAction } from '../actions';
import { createPaymentPreferenceAction } from '@/features/payments/actions';
import { getStoredCustomerProfile, saveCustomerProfile } from '@/features/raffles/client';
import { validateCouponAction } from '@/features/promotions/actions';
import { createClient } from '@/lib/supabase/client';

interface CartDrawerProps {
  tenantId: string;
  tenantSlug: string;
  currency: string;
  acceptsCash?: boolean;
  acceptsMercadoPago?: boolean;
  currentPrepTimeMinutes?: number;
}

export function CartDrawer({
  tenantId,
  tenantSlug,
  currency,
  acceptsCash = true,
  acceptsMercadoPago = false,
  currentPrepTimeMinutes = 15,
}: CartDrawerProps) {
  const router = useRouter();
  const {
    items,
    totalCount,
    totalAmount,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Formulario de Checkout
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderType, setOrderType] = useState<'takeaway' | 'pickup_scheduled'>('takeaway');
  const [scheduledTime, setScheduledTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_pickup' | 'mercadopago'>('cash_on_pickup');

  // Cupones de descuento
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    description?: string;
  } | null>(null);
  const [couponMessage, setCouponMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Cargar datos del cliente si existen en localStorage
  useEffect(() => {
    if (isCartOpen) {
      const stored = getStoredCustomerProfile(tenantSlug);
      if (stored) {
        if (!customerName) setCustomerName(stored.name);
        if (!customerPhone && stored.phone) setCustomerPhone(stored.phone);
      }
      setErrorMessage(null);
    }
  }, [isCartOpen, tenantSlug]);

  if (!isCartOpen) return null;

  const finalPayableTotal = Math.max(
    0,
    totalAmount - (appliedCoupon?.discountAmount || 0)
  );

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) return;

    setIsValidatingCoupon(true);
    setCouponMessage(null);

    const res = await validateCouponAction({
      tenantSlug,
      code: couponCodeInput.trim(),
      subtotal: totalAmount,
    });

    setIsValidatingCoupon(false);

    if (res.success && res.data.valid) {
      setAppliedCoupon({
        code: res.data.code,
        discountAmount: res.data.discountAmount,
        description: res.data.message || `Descuento de ${formatCurrency(res.data.discountAmount, currency)}`,
      });
      setCouponMessage({
        type: 'success',
        text: `¡Cupón ${res.data.code} aplicado! Descuento: -${formatCurrency(
          res.data.discountAmount,
          currency
        )}`,
      });
    } else {
      setAppliedCoupon(null);
      setCouponMessage({
        type: 'error',
        text: (!res.success ? res.error : res.data?.message) || 'Cupón inválido o vencido.',
      });
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Por favor completá tu nombre y teléfono.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Tu carrito está vacío.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Guardar perfil para futuros pedidos
      saveCustomerProfile(tenantSlug, {
        name: customerName.trim(),
        email: getStoredCustomerProfile(tenantSlug)?.email || `${customerPhone.trim()}@takeaway.local`,
        phone: customerPhone.trim(),
      });

      // Crear el pedido en Supabase
      const res = await createOrderAction({
        tenantId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        orderType,
        scheduledFor:
          orderType === 'pickup_scheduled' && scheduledTime
            ? new Date(scheduledTime).toISOString()
            : null,
        paymentMethod: paymentMethod === 'mercadopago' ? 'mercadopago' : 'cash_on_pickup',
        notes: orderNotes.trim() || null,
        couponCode: appliedCoupon?.code || null,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          selectedOptionIds: i.selectedOptions.map((opt) => opt.optionId),
          notes: i.notes || undefined,
        })),
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Error al procesar el pedido. Intentá de nuevo.');
        setIsSubmitting(false);
        return;
      }

      const createdOrderId = res.data.orderId;

      // 1. Emitir broadcast en tiempo real por WebSocket a la comandera (Cocina KDS)
      try {
        const supabase = createClient();
        const broadcastChannel = supabase.channel(`kds_broadcast_${tenantId}`);
        broadcastChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            broadcastChannel
              .send({
                type: 'broadcast',
                event: 'new_order',
                payload: {
                  id: res.data.orderId,
                  orderNumber: res.data.orderNumber,
                  customerName: res.data.customerName,
                  customerPhone: res.data.customerPhone,
                  orderStatus: 'pending',
                  paymentStatus: res.data.paymentStatus,
                  orderType: res.data.orderType,
                  scheduledFor: res.data.scheduledFor,
                  estimatedReadyAt: res.data.estimatedReadyAt,
                  total: res.data.total,
                  notes: res.data.notes,
                  createdAt: res.data.createdAt,
                  items: res.data.items,
                },
              })
              .then(() => {
                supabase.removeChannel(broadcastChannel);
              })
              .catch(() => {});
          }
        });
      } catch (e) {
        console.warn('Realtime broadcast warning:', e);
      }

      // Limpiar carrito y cerrar modal
      clearCart();
      setIsCartOpen(false);

      // Si pagó con Mercado Pago y hay preferencia, redirigir
      if (paymentMethod === 'mercadopago') {
        const prefRes = await createPaymentPreferenceAction(createdOrderId);
        if (prefRes.success && prefRes.data.initPoint) {
          window.location.href = prefRes.data.initPoint;
          return;
        }
      }

      // Redirigir a la pantalla de seguimiento en vivo
      router.push(`/c/${tenantSlug}/track/${createdOrderId}`);
    } catch {
      setErrorMessage('Ocurrió un error inesperado al procesar el pedido.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Fondo clickeable para cerrar */}
      <div
        className="fixed inset-0 cursor-pointer"
        onClick={() => {
          if (step === 'checkout') {
            setStep('cart');
          } else {
            setIsCartOpen(false);
          }
        }}
      />

      {/* Panel Lateral Drawer (Idéntico a Imagen 3) */}
      <div className="relative z-10 w-full max-w-md h-full bg-white dark:bg-[#111827] shadow-2xl flex flex-col text-slate-800 dark:text-slate-100 border-l border-slate-200/80 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {step === 'cart' ? (
            <div className="flex items-center gap-2">
              <ShoppingBag
                className="w-5 h-5 stroke-[2.2]"
                style={{ color: 'var(--theme-primary, #5865F2)' }}
              />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Tu Pedido
              </h2>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setStep('cart')}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Volver a Tu Pedido</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (step === 'checkout') {
                setStep('cart');
              } else {
                setIsCartOpen(false);
              }
            }}
            aria-label="Cerrar pedido"
            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido según el Paso */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {step === 'cart' ? (
            /* PASO 1: LISTADO DE PRODUCTOS EN EL CARRITO (Idéntico a Imagen 3) */
            items.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <ShoppingBag className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">El carrito está vacío</p>
                <p className="text-xs text-slate-400">Elegí platos de la carta para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 shadow-xs flex items-center gap-3"
                  >
                    {/* Thumbnail del producto */}
                    {item.product.imageUrl ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-100 dark:border-slate-800">
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                        <ShoppingBag className="w-6 h-6 opacity-30" />
                      </div>
                    )}

                    {/* Contenido Card: Nombre, notas, precio y contador */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {item.product.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-slate-400 hover:text-rose-500 p-0.5 transition-colors cursor-pointer shrink-0"
                          title="Eliminar plato"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Detalles o notas adicionales */}
                      {(item.selectedOptions.length > 0 || item.notes) && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate -mt-0.5">
                          {item.selectedOptions.map((o) => o.name).join(', ')}
                          {item.notes ? (item.selectedOptions.length ? ` • ${item.notes}` : item.notes) : ''}
                        </p>
                      )}

                      {/* Precio y Contador [- 1 +] */}
                      <div className="flex items-center justify-between mt-1">
                        <span
                          className="text-sm font-bold font-mono"
                          style={{ color: 'var(--theme-primary, #5865F2)' }}
                        >
                          {formatCurrency(item.subtotal, currency)}
                        </span>

                        <div className="flex items-center gap-2.5 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2 py-0.5 bg-white dark:bg-slate-800 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-slate-900 dark:text-white min-w-3 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* PASO 2: CHECKOUT FORM */
            <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tu Nombre y Apellido *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(toTitleCase(e.target.value))}
                  placeholder="Ej: Martín Rodríguez"
                  className="w-full bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                />
              </div>

              {/* Teléfono / WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  WhatsApp / Teléfono *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ej: 11 2345 6789"
                  className="w-full bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Te avisaremos por aquí cuando tu pedido esté listo para retirar.
                </p>
              </div>

              {/* Tipo de Retiro */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Momento de Retiro
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setOrderType('takeaway')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      orderType === 'takeaway'
                        ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>En el momento</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ~{currentPrepTimeMinutes} min
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderType('pickup_scheduled')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      orderType === 'pickup_scheduled'
                        ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-sky-500" />
                    <span>Programar</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Elegir horario
                    </span>
                  </button>
                </div>

                {orderType === 'pickup_scheduled' && (
                  <div className="mt-2.5">
                    <input
                      type="datetime-local"
                      required={orderType === 'pickup_scheduled'}
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-400"
                    />
                  </div>
                )}
              </div>

              {/* Forma de Pago */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Forma de Pago
                </label>
                <div className="space-y-2">
                  {acceptsCash && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash_on_pickup')}
                      className={`w-full p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        paymentMethod === 'cash_on_pickup'
                          ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        <span>Efectivo / Transferencia al retirar</span>
                      </div>
                      <span className="text-[10px] text-slate-400">En mostrador</span>
                    </button>
                  )}

                  {acceptsMercadoPago && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mercadopago')}
                      className={`w-full p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        paymentMethod === 'mercadopago'
                          ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-4 h-4 text-sky-500" />
                        <span>Mercado Pago (Tarjeta / Débito)</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Online</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Cupón de Descuento */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ¿Tenés un cupón de descuento?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    placeholder="Ej: BIENVENIDA10"
                    maxLength={20}
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white uppercase focus:outline-none focus:border-slate-400 font-mono"
                  />
                  <button
                    type="button"
                    disabled={isValidatingCoupon || !couponCodeInput.trim()}
                    onClick={handleApplyCoupon}
                    style={{ backgroundColor: 'var(--theme-primary, #5865F2)' }}
                    className="px-4 py-2 rounded-xl text-white font-bold text-xs disabled:opacity-40 transition-colors cursor-pointer hover:brightness-110"
                  >
                    {isValidatingCoupon ? '...' : 'Aplicar'}
                  </button>
                </div>

                {couponMessage && (
                  <p
                    className={`text-[11px] font-bold mt-1.5 ${
                      couponMessage.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {couponMessage.text}
                  </p>
                )}
              </div>

              {/* Aclaraciones generales del pedido */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Notas para el pedido (opcional)
                </label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Ej: Traer servilletas extra, avisar por WhatsApp..."
                  maxLength={200}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-400"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer (Idéntico a Imagen 3) */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-white dark:bg-[#111827] border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total</span>
              {appliedCoupon ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {formatCurrency(finalPayableTotal, currency)}
                  </span>
                  <span className="text-xs text-slate-400 line-through font-mono">
                    {formatCurrency(totalAmount, currency)}
                  </span>
                </div>
              ) : (
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {formatCurrency(totalAmount, currency)}
                </span>
              )}
            </div>

            {step === 'cart' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                style={{ backgroundColor: 'var(--theme-primary, #5865F2)' }}
                className="w-full py-3.5 px-5 rounded-xl hover:brightness-110 text-white font-bold text-sm tracking-wide shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enviar Pedido</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                style={{ backgroundColor: 'var(--theme-primary, #5865F2)' }}
                className="w-full py-3.5 px-6 rounded-xl hover:brightness-110 text-white font-bold text-sm tracking-wide shadow-md active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando Pedido...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar Pedido</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
