'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  User,
  X,
  Mail,
  Phone,
  Trophy,
  Gift,
  CheckCircle,
  Calendar,
  Sparkles,
  AlertCircle,
  Loader2,
  Edit2,
} from 'lucide-react';
import type { Raffle } from '@/features/raffles/types';
import {
  getStoredCustomerProfile,
  saveCustomerProfile,
  participateInRaffle,
  CustomerProfile,
} from '@/features/raffles/client';
import { toTitleCase } from '@/lib/utils';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantSlug: string;
  tenantName: string;
  raffles: Raffle[];
}

export function CustomerProfileModal({
  isOpen,
  onClose,
  tenantSlug,
  tenantName,
  raffles,
}: CustomerProfileModalProps) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Campos de formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Estados de acción
  const [enteringRaffleId, setEnteringRaffleId] = useState<string | null>(null);
  const [enteredRaffles, setEnteredRaffles] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cargar perfil guardado en localStorage al abrir
  useEffect(() => {
    if (isOpen) {
      const stored = getStoredCustomerProfile(tenantSlug);
      if (stored) {
        setProfile(stored);
        setName(stored.name);
        setEmail(stored.email);
        setPhone(stored.phone || '');
        setIsEditing(false);
      } else {
        setIsEditing(true);
      }
      setFormError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, tenantSlug]);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !email.trim()) {
      setFormError('Por favor completá tu nombre y correo electrónico.');
      return;
    }

    const newProfile: CustomerProfile = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
    };

    saveCustomerProfile(tenantSlug, newProfile);
    setProfile(newProfile);
    setIsEditing(false);
    setSuccessMsg('¡Tus datos han sido guardados con éxito!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleEnterRaffle = async (raffle: Raffle) => {
    if (!profile || !profile.email) {
      setIsEditing(true);
      setFormError('Completá tu nombre y correo para poder participar del sorteo.');
      return;
    }

    setEnteringRaffleId(raffle.id);
    setFormError(null);

    const res = await participateInRaffle(tenantSlug, raffle.id, profile);
    setEnteringRaffleId(null);

    if (res.success) {
      setEnteredRaffles((prev) => ({ ...prev, [raffle.id]: true }));
      setSuccessMsg('¡Ya estás participando! Mucha suerte 🎉');
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setFormError(res.error || 'Error al inscribirse en el sorteo');
    }
  };

  const activeRaffles = raffles.filter((r) => r.status === 'active');
  const finishedRaffles = raffles.filter((r) => r.status === 'completed');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl my-6 max-h-[90vh] overflow-y-auto text-slate-800 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Mi Perfil & Sorteos</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60">
                  {tenantName}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Participá de sorteos exclusivos y recibí promociones en tu correo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alertas */}
        {formError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 stroke-[2.5] text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. SECCIÓN DE PERFIL / SUSCRIPCIÓN */}
        {!isEditing && profile ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">{profile.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{profile.email}</p>
                {profile.phone && (
                  <p className="text-[11px] text-slate-400">{profile.phone}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>Editar</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-3.5 p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Completá tus Datos</span>
              </span>
              {profile && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Nombre Completo *</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(toTitleCase(e.target.value))}
                  placeholder="Ej: Sofía Martinez"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Correo Electrónico (para notificarte si ganas) *
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                WhatsApp / Teléfono (opcional)
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="11 2345 6789"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all cursor-pointer"
            >
              Guardar Mi Perfil
            </button>
          </form>
        )}

        {/* 2. SECCIÓN DE SORTEOS ACTIVOS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Sorteos Activos ({activeRaffles.length})</span>
            </h4>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">100% Gratis</span>
          </div>

          {activeRaffles.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-2">
              <Gift className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No hay sorteos activos en este momento
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Dejando tu correo guardado, te enviaremos una notificación cuando {tenantName} lance su próximo sorteo.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeRaffles.map((raffle) => {
                const isEntered = enteredRaffles[raffle.id];
                const isPendingThis = enteringRaffleId === raffle.id;

                return (
                  <div
                    key={raffle.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm"
                  >
                    {raffle.imageUrl && (
                      <div className="relative h-32 w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <Image
                          src={raffle.imageUrl}
                          alt={raffle.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="text-sm font-extrabold text-slate-900 dark:text-white">{raffle.title}</h5>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 shrink-0">
                          Sorteo
                        </span>
                      </div>

                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5" />
                        <span>Premio: {raffle.prize}</span>
                      </p>

                      {raffle.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {raffle.description}
                        </p>
                      )}

                      {raffle.endDate && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Finaliza:{' '}
                            {new Date(raffle.endDate).toLocaleDateString('es-AR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                      {isEntered ? (
                        <div className="py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                          <span>¡Ya estás participando de este sorteo!</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isPendingThis}
                          onClick={() => handleEnterRaffle(raffle)}
                          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          {isPendingThis ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trophy className="w-4 h-4" />
                          )}
                          <span>Participar en 1 Clic con mi Correo</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sorteos Finalizados con Ganadores */}
          {finishedRaffles.length > 0 && (
            <div className="pt-2 space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 block">
                Últimos Ganadores
              </span>
              <div className="space-y-1.5">
                {finishedRaffles.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{r.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Premio: {r.prize}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                        Ganador/a
                      </span>
                      <span className="font-extrabold text-amber-600 dark:text-amber-400">
                        {r.winnerName || 'Sorteado'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
