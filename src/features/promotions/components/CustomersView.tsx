'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Users,
  Award,
  Ticket,
  Search,
  Phone,
  Plus,
  Trash2,
  Check,
  X,
  ArrowLeft,
  Loader2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { createCouponAction, toggleCouponAction, deleteCouponAction } from '../actions';
import type { CouponInput } from '../schemas';

export interface CustomerData {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  pointsBalance: number;
  lastOrderAt: string | null;
  createdAt: string;
}

export interface CouponData {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  maxUses: number | null;
  currentUses: number;
  validUntil: string | null;
  isActive: boolean;
}

interface CustomersViewProps {
  tenantId: string;
  tenantSlug: string;
  currency: string;
  initialCustomers: CustomerData[];
  initialCoupons: CouponData[];
}

export function CustomersView({
  tenantId,
  tenantSlug,
  currency,
  initialCustomers,
  initialCoupons,
}: CustomersViewProps) {
  const [customers] = useState<CustomerData[]>(initialCustomers);
  const [coupons, setCoupons] = useState<CouponData[]>(initialCoupons);
  const [activeTab, setActiveTab] = useState<'customers' | 'coupons'>('customers');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal Crear Cupón
  const [showCreateCouponModal, setShowCreateCouponModal] = useState<boolean>(false);
  const [code, setCode] = useState<string>('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [maxUses, setMaxUses] = useState<number | ''>('');
  const [modalError, setModalError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Filtrado de clientes
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const totalPointsCirculating = customers.reduce((sum, c) => sum + (c.pointsBalance || 0), 0);
  const activeCouponsCount = coupons.filter((c) => c.isActive).length;

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const payload: CouponInput = {
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxUses: maxUses ? Number(maxUses) : null,
      validFrom: new Date().toISOString(),
      validUntil: null,
    };

    startTransition(async () => {
      const res = await createCouponAction(tenantId, payload);
      if (!res.success) {
        setModalError(res.error);
      } else {
        setCoupons((prev) => [
          {
            id: res.data.couponId,
            code: payload.code,
            discountType: payload.discountType,
            discountValue: payload.discountValue,
            minOrderAmount: payload.minOrderAmount,
            maxDiscountAmount: null,
            maxUses: payload.maxUses || null,
            currentUses: 0,
            validUntil: null,
            isActive: true,
          },
          ...prev,
        ]);
        setShowCreateCouponModal(false);
        setCode('');
      }
    });
  };

  const handleToggleCoupon = (couponId: string, currentActive: boolean) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === couponId ? { ...c, isActive: !currentActive } : c))
    );

    startTransition(async () => {
      await toggleCouponAction(tenantId, couponId, !currentActive);
    });
  };

  const handleDeleteCoupon = (couponId: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== couponId));

    startTransition(async () => {
      await deleteCouponAction(tenantId, couponId);
    });
  };

  return (
    <div className="min-h-screen bg-[#f0f4fc] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 pb-32 max-w-7xl mx-auto space-y-7 antialiased selection:bg-[#5865F2] selection:text-white transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <Link
            href={`/admin/${tenantSlug}/dashboard`}
            className="w-10 h-10 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Clientes & Fidelización</span>
              </h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">CRM de compradores, puntos acumulados y cupones</p>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Top con Tarjetas Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-md transition-all flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Clientes Totales</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{customers.length}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-md transition-all flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Puntos en Circulación</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{totalPointsCirculating}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-md transition-all flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Cupones Activos</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{activeCouponsCount}</span>
        </div>
      </div>

      {/* Tabs Clientes vs Cupones */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 max-w-md shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'customers'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Base de Clientes ({customers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('coupons')}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'coupons'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Cupones ({coupons.length})</span>
        </button>
      </div>

      {/* CONTENIDO SEGÚN TAB */}
      {activeTab === 'customers' ? (
        <div className="space-y-4">
          {/* Barra de Búsqueda */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 shadow-sm transition-colors"
            />
          </div>

          {/* Listado de Clientes */}
          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <Users className="w-8 h-8 mx-auto opacity-40 text-slate-400 dark:text-slate-500 mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No se encontraron clientes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCustomers.map((c) => {
                const isVip = c.totalOrders >= 5;
                return (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 hover:shadow-md dark:shadow-none flex items-center justify-between gap-3 shadow-sm transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</h4>
                        {isVip && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                            VIP
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        <span>{c.totalOrders} pedidos</span>
                        <span>Total: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{formatCurrency(c.totalSpent, currency)}</strong></span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" />
                          {c.pointsBalance} pts
                        </span>
                      </div>
                    </div>

                    <a
                      href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shrink-0"
                      title="Enviar WhatsApp"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* TAB CUPONES */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Cupones de Descuento
            </h3>

            <button
              type="button"
              onClick={() => setShowCreateCouponModal(true)}
              className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide shadow-sm shadow-indigo-200 dark:shadow-none active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Cupón</span>
            </button>
          </div>

          {coupons.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <Ticket className="w-8 h-8 mx-auto opacity-40 text-indigo-500" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Aún no creaste cupones</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Creá tu primer código promocional para atraer pedidos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 hover:shadow-md dark:shadow-none flex items-center justify-between gap-3 shadow-sm transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-xl border border-indigo-100 dark:border-indigo-800">
                        {coupon.code}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}% OFF`
                          : `${formatCurrency(coupon.discountValue, currency)} OFF`}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {coupon.minOrderAmount > 0
                        ? `Mínimo: ${formatCurrency(coupon.minOrderAmount, currency)} • `
                        : ''}
                      Canjes: <strong className="text-slate-800 dark:text-slate-200">{coupon.currentUses}</strong>
                      {coupon.maxUses ? ` / ${coupon.maxUses}` : ' (Ilimitados)'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleCoupon(coupon.id, coupon.isActive)}
                      className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border transition-colors ${
                        coupon.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {coupon.isActive ? 'Activo' : 'Pausado'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Eliminar cupón"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL CREAR CUPÓN */}
      {showCreateCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Ticket className="w-4 h-4" />
                </div>
                <span>Crear Cupón Promocional</span>
              </h3>
              <button
                onClick={() => setShowCreateCouponModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-3.5">
              {/* Código */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Código del Cupón *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ej: BURGER15"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 uppercase font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                />
              </div>

              {/* Tipo de Descuento */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Tipo de Descuento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percentage')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      discountType === 'percentage'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    % Porcentaje
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('fixed_amount')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      discountType === 'fixed_amount'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    $ Monto Fijo
                  </button>
                </div>
              </div>

              {/* Valor */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Valor del Descuento ({discountType === 'percentage' ? '%' : '$'}) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={discountType === 'percentage' ? 100 : undefined}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                />
              </div>

              {/* Compra mínima */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Compra Mínima ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                  placeholder="0 (Sin mínimo)"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                />
              </div>

              {/* Límite de canjes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Límite de Canjes (opcional)
                </label>
                <input
                  type="number"
                  min={1}
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Dejar vacío si es ilimitado"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide shadow-sm shadow-indigo-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Crear Cupón</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
