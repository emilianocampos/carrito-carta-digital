'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Store,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  ExternalLink,
  Pause,
  Play,
  Zap,
  Layers,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  toggleTenantStatusAction,
  changeTenantPlanAction,
  setTenantFeatureOverrideAction,
  extendTenantTrialAction,
} from '../actions';
import type { TenantStatus } from '@/types/database';

export interface SuperAdminTenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  createdAt: string;
  planCode: string;
  planName: string;
  subscriptionStatus: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'suspended' | 'expired';
  trialEndsAt: string | null;
  daysRemainingInTrial: number;
  isTrialExpired: boolean;
  productsCount: number;
  ordersCount: number;
  totalSales: number;
}

export interface SuperAdminPlan {
  id: string;
  code: string;
  name: string;
  priceMonthly: number;
  featuresCount: number;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

interface SuperAdminViewProps {
  tenants: SuperAdminTenant[];
  plans: SuperAdminPlan[];
  auditLogs: AuditLogEntry[];
  totalCustomersCount: number;
}

export function SuperAdminView({
  tenants: initialTenants,
  plans,
  auditLogs,
  totalCustomersCount,
}: SuperAdminViewProps) {
  const [tenants, setTenants] = useState<SuperAdminTenant[]>(initialTenants);
  const [activeTab, setActiveTab] = useState<'tenants' | 'plans' | 'audit'>('tenants');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [trialFilter, setTrialFilter] = useState<'all' | 'expired' | 'trialing' | 'active'>('all');
  const [isPending, startTransition] = useTransition();

  // Métricas de Plataforma
  const activeTenantsCount = tenants.filter((t) => t.status === 'active').length;
  const platformGmv = tenants.reduce((sum, t) => sum + t.totalSales, 0);

  // Períodos de Prueba
  const expiredTrials = tenants.filter((t) => t.isTrialExpired);
  const activeTrials = tenants.filter((t) => !t.isTrialExpired && t.subscriptionStatus === 'trialing');
  const paidActive = tenants.filter((t) => t.subscriptionStatus === 'active');

  // Estimación de MRR según planes asignados (solo para carritos activos no vencidos)
  const planPriceMap: Record<string, number> = {
    basic: 45000,
    pro: 85000,
    premium: 140000,
  };
  const platformMrr = tenants
    .filter((t) => t.status === 'active' && t.subscriptionStatus === 'active')
    .reduce((sum, t) => sum + (planPriceMap[t.planCode] || 45000), 0);

  // Filtrado de tenants
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (trialFilter === 'expired') return t.isTrialExpired;
    if (trialFilter === 'trialing') return !t.isTrialExpired && t.subscriptionStatus === 'trialing';
    if (trialFilter === 'active') return t.subscriptionStatus === 'active';
    return true;
  });

  const handleToggleStatus = (tenantId: string, currentStatus: TenantStatus) => {
    const newStatus: TenantStatus = currentStatus === 'active' ? 'suspended' : 'active';

    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, status: newStatus } : t))
    );

    startTransition(async () => {
      await toggleTenantStatusAction(tenantId, newStatus);
    });
  };

  const handleChangePlan = (tenantId: string, newPlanCode: string) => {
    const targetPlan = plans.find((p) => p.code === newPlanCode);

    setTenants((prev) =>
      prev.map((t) =>
        t.id === tenantId
          ? {
              ...t,
              planCode: newPlanCode,
              planName: targetPlan?.name || newPlanCode,
              subscriptionStatus: 'active',
              isTrialExpired: false,
            }
          : t
      )
    );

    startTransition(async () => {
      await changeTenantPlanAction(tenantId, newPlanCode);
    });
  };

  const handleExtendTrial = (tenantId: string) => {
    setTenants((prev) =>
      prev.map((t) =>
        t.id === tenantId
          ? {
              ...t,
              subscriptionStatus: 'trialing',
              daysRemainingInTrial: t.daysRemainingInTrial + 7,
              isTrialExpired: false,
            }
          : t
      )
    );

    startTransition(async () => {
      await extendTenantTrialAction(tenantId, 7);
    });
  };

  const handleGrantUnlimitedProducts = (tenantId: string) => {
    startTransition(async () => {
      await setTenantFeatureOverrideAction(
        tenantId,
        'max_products',
        9999,
        'Override de cortesía ilimitada desde Super Admin'
      );
      alert('Override de productos ilimitados concedido al carrito.');
    });
  };

  return (
    <div className="min-h-screen bg-[#f0f4fc] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 pb-32 max-w-7xl mx-auto antialiased space-y-7 transition-colors">
      {/* Header del Super Admin */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#5865F2] text-white flex items-center justify-center font-black shadow-md shadow-[#5865F2]/25 shrink-0">
            <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Super Admin Global</h1>
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
                SaaS Owner
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Control maestro de carritos, suscripciones y métricas de plataforma</p>
          </div>
        </div>

        {isPending && (
          <div className="flex items-center gap-2 text-xs font-bold text-[#5865F2] bg-[#5865F2]/10 border border-[#5865F2]/20 px-3 py-1.5 rounded-xl animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Sincronizando...</span>
          </div>
        )}
      </div>

      {/* Métricas Globales de Plataforma (4 KPIs con el mismo diseño de Dashboard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Carritos Activos */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200/60 dark:border-sky-800/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
            <Store className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Carritos Activos</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{activeTenantsCount}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">/ {tenants.length} total</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Comensales */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200/60 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Comensales Registrados</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{totalCustomersCount}</span>
          </div>
        </div>

        {/* KPI 3: GMV Transaccionado */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">GMV Transaccionado</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight block truncate">
              {formatCurrency(platformGmv, 'ARS')}
            </span>
          </div>
        </div>

        {/* KPI 4: MRR Estimado */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 text-[#5865F2] dark:text-indigo-400 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">MRR Estimado</span>
            <span className="text-2xl sm:text-3xl font-black text-[#5865F2] dark:text-indigo-400 tracking-tight block truncate">
              {formatCurrency(platformMrr, 'ARS')}
            </span>
          </div>
        </div>
      </div>

      {/* ALERTA CRÍTICA: Carritos que cumplieron los 7 días de prueba */}
      {expiredTrials.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black shrink-0 animate-pulse shadow-md shadow-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-rose-900 dark:text-rose-200">
                  🚨 {expiredTrials.length} {expiredTrials.length === 1 ? 'Carrito cumplió' : 'Carritos cumplieron'} los 7 días de prueba
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-sm">
                  Definir Plan
                </span>
              </div>
              <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-0.5">
                Alcanzaron el límite de prueba gratuita. Es momento de asignarles un plan definitivo para continuar operando.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTrialFilter(trialFilter === 'expired' ? 'all' : 'expired')}
            className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shrink-0 transition-all shadow-md active:scale-95 text-center"
          >
            {trialFilter === 'expired' ? 'Ver Todos los Carritos' : `Ver Vencidos (${expiredTrials.length})`}
          </button>
        </div>
      )}

      {/* Selector de Pestañas */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-sm max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('tenants')}
          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'tenants'
              ? 'bg-[#5865F2] text-white shadow-sm font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Carritos ({tenants.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'plans'
              ? 'bg-[#5865F2] text-white shadow-sm font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Planes ({plans.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-[#5865F2] text-white shadow-sm font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Auditoría</span>
        </button>
      </div>

      {/* CONTENIDO SEGÚN PESTAÑA */}
      {activeTab === 'tenants' ? (
        <div className="space-y-4">
          {/* Buscador y Filtros Rápidos */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar carrito por nombre o slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#5865F2] shadow-sm transition-colors"
              />
            </div>

            {/* Chips de Filtro */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs">
              <button
                type="button"
                onClick={() => setTrialFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors shrink-0 ${
                  trialFilter === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-2xs'
                }`}
              >
                Todos ({tenants.length})
              </button>
              <button
                type="button"
                onClick={() => setTrialFilter('expired')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors shrink-0 flex items-center gap-1.5 ${
                  trialFilter === 'expired'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-white dark:bg-[#111827] border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 shadow-2xs'
                }`}
              >
                <span>Pruebas Vencidas</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-900/60 font-black">
                  {expiredTrials.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTrialFilter('trialing')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors shrink-0 flex items-center gap-1.5 ${
                  trialFilter === 'trialing'
                    ? 'bg-[#5865F2] text-white shadow-sm'
                    : 'bg-white dark:bg-[#111827] border border-indigo-200 dark:border-indigo-900/60 text-[#5865F2] dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 shadow-2xs'
                }`}
              >
                <span>⏳ En Prueba</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 font-black">
                  {activeTrials.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTrialFilter('active')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors shrink-0 ${
                  trialFilter === 'active'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-white dark:bg-[#111827] border border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shadow-2xs'
                }`}
              >
                ✅ Con Plan ({paidActive.length})
              </button>
            </div>
          </div>

          {/* Listado de Tenants */}
          <div className="space-y-3">
            {filteredTenants.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 shadow-sm">
                No se encontraron carritos con el criterio seleccionado.
              </div>
            ) : (
              filteredTenants.map((t) => {
                const isActive = t.status === 'active';
                return (
                  <div
                    key={t.id}
                    className={`p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111827] border ${
                      t.isTrialExpired
                        ? 'border-rose-300 dark:border-rose-800 ring-2 ring-rose-200/60 dark:ring-rose-900/40'
                        : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    } space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-md transition-all`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-black text-slate-900 dark:text-white">{t.name}</h3>
                          <span className="text-xs font-mono text-slate-400 dark:text-slate-500">/{t.slug}</span>

                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {isActive ? 'Activo' : 'Suspendido'}
                          </span>

                          {/* Badge de Suscripción / Prueba */}
                          {t.isTrialExpired ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-sm animate-pulse flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Prueba Vencida (7 días cumplidos)</span>
                            </span>
                          ) : t.subscriptionStatus === 'trialing' ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              ⏳ Prueba ({t.daysRemainingInTrial}d restantes)
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#5865F2]/10 dark:bg-[#5865F2]/20 text-[#5865F2] dark:text-indigo-400 border border-[#5865F2]/20 dark:border-[#5865F2]/30">
                              Plan {t.planName} Activo
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                          <span>{t.productsCount} productos</span>
                          <span>•</span>
                          <span>{t.ordersCount} pedidos</span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {formatCurrency(t.totalSales, 'ARS')} facturados
                          </span>
                        </div>
                      </div>

                      {/* Botonera de Acciones Rápidas */}
                      <div className="flex items-center gap-2 pt-2 sm:pt-0">
                        <Link
                          href={`/c/${t.slug}`}
                          target="_blank"
                          className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                          title="Ver carta pública"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        {/* Selector para asignar / activar Plan */}
                        <div className="relative">
                          <select
                            value={t.planCode}
                            onChange={(e) => handleChangePlan(t.id, e.target.value)}
                            className={`bg-slate-50 dark:bg-slate-800 border ${
                              t.isTrialExpired
                                ? 'border-rose-400 dark:border-rose-700 text-rose-700 dark:text-rose-400 animate-pulse'
                                : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                            } rounded-2xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#5865F2]`}
                            title="Asignar o activar plan comercial"
                          >
                            {plans.map((p) => (
                              <option key={p.code} value={p.code}>
                                Plan {p.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Extender prueba (+7 días) */}
                        <button
                          type="button"
                          onClick={() => handleExtendTrial(t.id)}
                          className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#5865F2] text-slate-600 dark:text-slate-300 hover:text-[#5865F2] dark:hover:text-[#5865F2] transition-colors text-xs font-bold cursor-pointer"
                          title="Extender 7 días adicionales de prueba gratuita"
                        >
                          +7d
                        </button>

                        {/* Switch Suspender / Reactivar */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(t.id, t.status)}
                          className={`p-2.5 rounded-2xl border text-xs font-bold transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/80'
                              : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/80'
                          }`}
                          title={isActive ? 'Suspender carrito' : 'Reactivar carrito'}
                        >
                          {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>

                        {/* Botón de Override */}
                        <button
                          type="button"
                          onClick={() => handleGrantUnlimitedProducts(t.id)}
                          className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/60 text-[#5865F2] dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition-colors cursor-pointer"
                          title="Conceder Override de Productos Ilimitados"
                        >
                          <Zap className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : activeTab === 'plans' ? (
        /* PESTAÑA DE PLANES */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((p) => (
            <div
              key={p.code}
              className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 space-y-4 flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#5865F2] dark:text-indigo-400">
                  Código: {p.code}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{p.name}</h3>
                <p className="text-3xl font-black text-slate-900 dark:text-white">
                  {formatCurrency(p.priceMonthly, 'ARS')}
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold ml-1.5">/mes</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{p.featuresCount} características y límites incluidos</p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Carta digital pública</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Comandera KDS en vivo</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Fidelización por puntos</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* PESTAÑA AUDITORÍA */
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Registro Maestro de Auditoría (Audit Logs)
          </h3>

          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">No hay registros de auditoría recientes.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-3 first:pt-0 last:pb-0 text-xs">
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-[#5865F2] dark:text-indigo-400 font-mono">{log.action}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {new Date(log.createdAt).toLocaleString('es-AR')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Entidad: {log.entityType} • {JSON.stringify(log.metadata)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
