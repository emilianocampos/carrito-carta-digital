'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  Trophy,
  Users,
  Plus,
  Calendar,
  Gift,
  Trash2,
  Dice5,
  CheckCircle2,
  Crown,
  AlertCircle,
  Loader2,
  X,
  ExternalLink,
} from 'lucide-react';
import type { AdminRafflesData, Raffle, RaffleEntry } from '../types';
import { createRaffleAction, drawRaffleWinnerAction, deleteRaffleAction } from '../actions';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';

interface AdminRafflesViewProps {
  data: AdminRafflesData;
}

export function AdminRafflesView({ data }: AdminRafflesViewProps) {
  const { tenant, isPremiumOrTrial } = data;
  const [raffles, setRaffles] = useState<Raffle[]>(data.raffles);
  const [entriesByRaffle, setEntriesByRaffle] = useState(data.entriesByRaffle);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [prize, setPrize] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [endDate, setEndDate] = useState('');

  const [selectedRaffleForEntries, setSelectedRaffleForEntries] = useState<Raffle | null>(null);
  const [drawingRaffle, setDrawingRaffle] = useState<Raffle | null>(null);
  const [winnerCelebration, setWinnerCelebration] = useState<{
    raffleTitle: string;
    winnerName: string;
    winnerEmail: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Crear Sorteo
  const handleCreateRaffle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !prize.trim()) {
      setErrorMessage('El título y el premio son obligatorios.');
      return;
    }

    startTransition(async () => {
      const res = await createRaffleAction(tenant.id, {
        title: title.trim(),
        prize: prize.trim(),
        description: description.trim() || null,
        imageUrl,
        endDate: endDate ? new Date(endDate).toISOString() : null,
      });

      if (res.success) {
        const newRaffle: Raffle = {
          id: res.data.id,
          tenantId: tenant.id,
          title: title.trim(),
          description: description.trim() || null,
          prize: prize.trim(),
          imageUrl,
          endDate: endDate || null,
          status: 'active',
          winnerName: null,
          winnerEmail: null,
          winnerDrawnAt: null,
          entriesCount: 0,
          createdAt: new Date().toISOString(),
        };

        setRaffles((prev) => [newRaffle, ...prev]);
        setIsCreateModalOpen(false);
        setTitle('');
        setPrize('');
        setDescription('');
        setImageUrl(null);
        setEndDate('');
        triggerToast('¡Sorteo creado con éxito! Los clientes ya pueden inscribirse desde la carta.');
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  // Sortear Ganador
  const handleDrawWinner = (raffle: Raffle) => {
    const entries = entriesByRaffle[raffle.id] || [];
    if (entries.length === 0) {
      alert('No hay clientes participantes registrados todavía en este sorteo.');
      return;
    }

    setDrawingRaffle(raffle);

    // Simulación de ruleta aleatoria durante 2.5 segundos para suspenso
    setTimeout(() => {
      startTransition(async () => {
        const res = await drawRaffleWinnerAction(tenant.id, raffle.id);
        setDrawingRaffle(null);

        if (res.success) {
          setRaffles((prev) =>
            prev.map((r) =>
              r.id === raffle.id
                ? {
                    ...r,
                    status: 'completed',
                    winnerName: res.data.winnerName,
                    winnerEmail: res.data.winnerEmail,
                    winnerDrawnAt: new Date().toISOString(),
                  }
                : r
            )
          );

          setWinnerCelebration({
            raffleTitle: raffle.title,
            winnerName: res.data.winnerName,
            winnerEmail: res.data.winnerEmail,
          });
        } else {
          alert(res.error);
        }
      });
    }, 2200);
  };

  // Eliminar Sorteo
  const handleDeleteRaffle = (raffleId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este sorteo?')) return;

    startTransition(async () => {
      const res = await deleteRaffleAction(tenant.id, raffleId);
      if (res.success) {
        setRaffles((prev) => prev.filter((r) => r.id !== raffleId));
        triggerToast('Sorteo eliminado.');
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#f0f4fc] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-7 pb-32 antialiased selection:bg-[#5865F2] selection:text-white transition-colors duration-200">
      {/* Toast Notificación */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-xl flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-md transition-all">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-500 dark:text-amber-400 flex items-center justify-center font-black shadow-sm shrink-0">
            <Trophy className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Sorteos & Concursos
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase flex items-center gap-1">
                <Crown className="w-3 h-3" />
                <span>Premium</span>
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Fidelizá a tus clientes sorteando combos o cenas desde la carta web
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setErrorMessage(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide transition-all shadow-sm shadow-indigo-200 dark:shadow-none active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Crear Nuevo Sorteo</span>
        </button>
      </div>

      {/* Banner de Feature si no está en Premium */}
      {!isPremiumOrTrial && (
        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-amber-950 dark:text-amber-100">Esta funcionalidad requiere Plan Premium</p>
              <p className="text-amber-700 dark:text-amber-300 text-[11px] mt-0.5">
                Los sorteos y captación de clientes por ruleta están reservados para el plan Premium.
              </p>
            </div>
          </div>
          <Link
            href={`/admin/${tenant.slug}/settings/billing`}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider text-center shrink-0 shadow-sm"
          >
            Ver Planes
          </Link>
        </div>
      )}

      {/* Listado de Sorteos */}
      {raffles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <Gift className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">No tenés sorteos activos</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Creá tu primer sorteo para que tus clientes puedan registrarse en tu carta web y participar por premios.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Sorteo Ahora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {raffles.map((raffle) => {
            const entries = entriesByRaffle[raffle.id] || [];
            const isCompleted = raffle.status === 'completed';

            return (
              <div
                key={raffle.id}
                className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 hover:shadow-md dark:shadow-none overflow-hidden flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all group"
              >
                <div>
                  {/* Foto o Banner del Sorteo */}
                  <div className="relative w-full h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {raffle.imageUrl ? (
                      <Image
                        src={raffle.imageUrl}
                        alt={raffle.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-1">
                        <Gift className="w-8 h-8 text-amber-400" />
                        <span className="text-[10px] font-bold">Premio Especial</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      {isCompleted ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase shadow-md flex items-center gap-1 backdrop-blur-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Finalizado</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase shadow-md flex items-center gap-1 backdrop-blur-sm">
                          <Sparkles className="w-3 h-3" />
                          <span>Activo</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detalles */}
                  <div className="p-6 space-y-3.5">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">{raffle.title}</h2>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-1 flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5" />
                        <span>{raffle.prize}</span>
                      </p>
                    </div>

                    {raffle.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {raffle.description}
                      </p>
                    )}

                    {/* Ganador si ya se sorteó */}
                    {isCompleted && raffle.winnerName && (
                      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-slate-800 dark:text-slate-200 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-black text-[11px] uppercase">
                          <Trophy className="w-3.5 h-3.5" />
                          <span>¡Ganador Seleccionado!</span>
                        </div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{raffle.winnerName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{raffle.winnerEmail}</p>
                      </div>
                    )}

                    {/* Cantidad de Participantes */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedRaffleForEntries(raffle)}
                        className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>{entries.length} participantes inscritos</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Acciones de Sorteo */}
                <div className="p-6 pt-0 flex items-center gap-2">
                  {!isCompleted ? (
                    <button
                      type="button"
                      disabled={isPending || entries.length === 0}
                      onClick={() => handleDrawWinner(raffle)}
                      className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                        entries.length > 0
                          ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 active:scale-95'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <Dice5 className="w-4 h-4" />
                      <span>¡Sortear Ganador!</span>
                    </button>
                  ) : (
                    <span className="flex-1 text-center py-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
                      Sorteo concluido
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteRaffle(raffle.id)}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    title="Eliminar sorteo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Crear Sorteo */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Nuevo Sorteo para Clientes</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRaffle} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Título del Sorteo *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Sorteo Fin de Mes: Cena para 2 personas"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Premio a Entregar *</label>
                <input
                  type="text"
                  required
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                  placeholder="Ej: 2 Hamburguesas Dobles + Papas Cheddar + 2 Bebidas"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Descripción o Bases (Opcional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Válido para retirar por el local durante todo el mes."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-colors"
                />
              </div>

              {/* Subida de Imagen a Supabase Storage */}
              <ImageUploadDropzone
                value={imageUrl}
                onChange={(url) => setImageUrl(url)}
                tenantId={tenant.id}
                folder="raffles"
                label="Foto del Premio (Subida a Supabase Storage)"
                aspectRatio="banner"
              />

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Fecha de Sorteo (Opcional)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide shadow-sm shadow-indigo-200 dark:shadow-none active:scale-95 transition-all flex items-center gap-1.5"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Publicar Sorteo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Ruleta de Animación al Sortear */}
      {drawingRaffle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="p-8 rounded-3xl bg-white dark:bg-[#111827] border border-amber-300 dark:border-amber-700 text-center max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 mx-auto flex items-center justify-center animate-bounce">
              <Dice5 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">¡Sorteando Ganador!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Girando la ruleta entre los {entriesByRaffle[drawingRaffle.id]?.length || 0} participantes inscritos...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Celebración de Ganador */}
      {winnerCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in zoom-in-95">
          <div className="p-7 rounded-3xl bg-white dark:bg-[#111827] border-2 border-emerald-500 text-center max-w-md w-full space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 mx-auto flex items-center justify-center shadow-md">
              <Trophy className="w-9 h-9 fill-current" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                🎉 ¡TENEMOS GANADOR! 🎉
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {winnerCelebration.winnerName}
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{winnerCelebration.winnerEmail}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              Sorteo: <span className="text-slate-900 dark:text-white font-bold">{winnerCelebration.raffleTitle}</span>
            </div>

            <button
              type="button"
              onClick={() => setWinnerCelebration(null)}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm active:scale-95"
            >
              ¡Excelente, felicitar al ganador!
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Ver Participantes */}
      {selectedRaffleForEntries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Participantes Registrados</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedRaffleForEntries.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRaffleForEntries(null)}
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {(entriesByRaffle[selectedRaffleForEntries.id] || []).length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  Aún no se ha inscrito ningún participante en este sorteo.
                </p>
              ) : (
                entriesByRaffle[selectedRaffleForEntries.id].map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{entry.customerName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{entry.customerEmail}</p>
                      </div>
                    </div>
                    {entry.customerPhone && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{entry.customerPhone}</span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRaffleForEntries(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
