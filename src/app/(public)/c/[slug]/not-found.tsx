import Link from 'next/link';
import { Store, ArrowLeft } from 'lucide-react';

export default function TenantNotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4 bg-slate-900/60 border border-slate-800 p-8 rounded-3xl shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <Store className="w-8 h-8" />
        </div>

        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
          Carrito no encontrado
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          El carrito gastronómico que estás buscando no existe, ha cambiado su enlace o se encuentra temporalmente inactivo.
        </p>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al inicio</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
