'use client';

import React, { useState, useTransition, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  UtensilsCrossed,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  ChevronLeft,
} from 'lucide-react';
import { loginAction } from '@/features/auth/actions';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await loginAction(formData, redirectParam);

      if (!result.success) {
        setErrorMsg(result.error || 'Ocurrió un error al iniciar sesión.');
        return;
      }

      if (result.redirectUrl) {
        router.push(result.redirectUrl);
        router.refresh();
      } else {
        router.push('/');
        router.refresh();
      }
    });
  };

  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-[#15222b] border border-[#1f3240] shadow-2xl relative z-10">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 items-center justify-center font-black shadow-lg shadow-emerald-500/25 mb-2">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Iniciar Sesión
        </h1>
        <p className="text-xs text-slate-400">
          Ingresá a tu panel de administración gastronómica
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">
            Correo Electrónico
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              name="email"
              required
              placeholder="dueño@tucarrito.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0c151b] border border-[#1a2b37] focus:border-[#00dc82] focus:ring-1 focus:ring-[#00dc82] text-xs text-white placeholder:text-slate-600 outline-none transition-all"
            />
          </div>
        </div>

        {/* Contraseña */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300">
              Contraseña
            </label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#0c151b] border border-[#1a2b37] focus:border-[#00dc82] focus:ring-1 focus:ring-[#00dc82] text-xs text-white placeholder:text-slate-600 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Botón de Enviar */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 px-4 rounded-xl bg-[#00dc82] hover:bg-[#05f08f] text-slate-950 font-black text-xs transition-all shadow-lg shadow-[#00dc82]/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-6"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Iniciando sesión...</span>
            </>
          ) : (
            <>
              <span>Ingresar al Panel</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </>
          )}
        </button>
      </form>

      {/* Footer del card */}
      <div className="mt-8 pt-6 border-t border-[#1a2b37] text-center space-y-3">
        <p className="text-xs text-slate-400">
          ¿Aún no tenés tu carrito registrado?{' '}
          <Link
            href="/register"
            className="text-[#00dc82] font-bold hover:underline"
          >
            Crear Usuario
          </Link>
        </p>

        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            <span>Volver al inicio</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0b1318] flex flex-col items-center justify-center p-4 relative antialiased selection:bg-[#00dc82] selection:text-slate-950">
      {/* Glow de Fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl h-96 bg-gradient-to-br from-[#00dc82]/10 via-[#00dc82]/5 to-transparent blur-3xl pointer-events-none -z-0" />

      <Suspense
        fallback={
          <div className="w-full max-w-md p-8 rounded-3xl bg-[#15222b] border border-[#1f3240] flex items-center justify-center text-[#00dc82]">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
