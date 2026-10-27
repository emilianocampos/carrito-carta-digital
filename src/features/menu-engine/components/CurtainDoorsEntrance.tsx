'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { UtensilsCrossed, Sparkles } from 'lucide-react';

interface CurtainDoorsEntranceProps {
  tenantName: string;
  logoUrl?: string | null;
}

/**
 * CurtainDoorsEntrance
 * Implementación de la transición de cortinas tipo "Doors" (inspirada en https://motion.dev/docs/curtains#doors).
 * Dos puertas simétricas que se abren horizontalmente hacia los laterales (-100% y +100%)
 * con aceleración GPU (translate3d) y curva cinemática ultra-fluida al entrar a la carta digital.
 */
export function CurtainDoorsEntrance({ tenantName, logoUrl }: CurtainDoorsEntranceProps) {
  // Comienza cerrado (isOpen = false)
  const [isOpen, setIsOpen] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Breve pausa para apreciar la portada y el logo antes de iniciar la apertura cinemática
    const openTimer = setTimeout(() => {
      setIsOpen(true);
    }, 450);

    // Concluir la transición y desmontar del DOM una vez completada la animación
    const finishTimer = setTimeout(() => {
      setIsFinished(true);
    }, 1400);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  // Permitir al usuario hacer tap/click para acelerar o entrar de inmediato
  const handleSkip = () => {
    setIsOpen(true);
    setTimeout(() => setIsFinished(true), 350);
  };

  if (isFinished) return null;

  return (
    <div
      role="presentation"
      onClick={handleSkip}
      className={`motion-curtains fixed inset-0 z-[99999] overflow-hidden select-none ${
        isOpen ? 'pointer-events-none' : 'cursor-pointer'
      }`}
      aria-hidden="true"
    >
      {/* Puerta Izquierda (Left Door Panel) */}
      <div
        className="motion-curtain absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border-r border-amber-500/30 shadow-[20px_0_40px_rgba(0,0,0,0.85)] will-change-transform"
        style={{
          transform: isOpen ? 'translate3d(-100%, 0, 0)' : 'translate3d(0%, 0, 0)',
          transition: 'transform 0.95s cubic-bezier(0.77, 0, 0.175, 1)',
        }}
      >
        {/* Textura sutil y reflejo de luz ambiental */}
        <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent opacity-50" />
        <div className="absolute top-0 right-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-amber-400/60 to-transparent" />
      </div>

      {/* Puerta Derecha (Right Door Panel) */}
      <div
        className="motion-curtain absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-zinc-950 via-zinc-900 to-black border-l border-amber-500/30 shadow-[-20px_0_40px_rgba(0,0,0,0.85)] will-change-transform"
        style={{
          transform: isOpen ? 'translate3d(100%, 0, 0)' : 'translate3d(0%, 0, 0)',
          transition: 'transform 0.95s cubic-bezier(0.77, 0, 0.175, 1)',
        }}
      >
        {/* Textura sutil y reflejo de luz ambiental */}
        <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent opacity-50" />
        <div className="absolute top-0 left-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-amber-400/60 to-transparent" />
      </div>

      {/* Emblema Central (Medallón de bienvenida sobre la juntura de las puertas) */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center text-center px-4 will-change-transform pointer-events-none"
        style={{
          opacity: isOpen ? 0 : 1,
          transform: isOpen
            ? 'translate3d(-50%, -50%, 0) scale(0.85)'
            : 'translate3d(-50%, -50%, 0) scale(1)',
          transition: isOpen
            ? 'opacity 0.4s cubic-bezier(0.4, 0, 1, 1), transform 0.5s cubic-bezier(0.4, 0, 1, 1)'
            : 'opacity 0.3s ease-out, transform 0.3s ease-out',
        }}
      >
        {/* Logo o Icono Branded */}
        <div className="relative mb-3.5 group">
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-amber-500/40 via-amber-300/40 to-amber-500/40 blur-md animate-pulse" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-zinc-950 border-2 border-amber-400/70 p-1.5 shadow-2xl shadow-amber-500/30 flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={tenantName}
                width={96}
                height={96}
                className="w-full h-full object-cover rounded-full"
                priority
              />
            ) : (
              <UtensilsCrossed className="w-9 h-9 text-amber-400" />
            )}
          </div>
        </div>

        {/* Nombre del Restaurante */}
        <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight drop-shadow-lg">
          {tenantName}
        </h2>

        {/* Etiqueta elegante Carta Digital */}
        <div className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-[11px] font-bold tracking-wider text-amber-300 uppercase shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Carta Digital</span>
        </div>

        {/* Indicador sutil de toque */}
        <p className="mt-3.5 text-[10px] text-zinc-400 uppercase tracking-widest font-semibold animate-pulse">
          Tocá para entrar
        </p>
      </div>
    </div>
  );
}
