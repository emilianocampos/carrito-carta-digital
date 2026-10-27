import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, PackageSearch } from 'lucide-react';
import { getPublicMenuBySlug } from '@/features/catalog/queries';
import { CustomerOrdersStandaloneView } from '@/features/orders/components/CustomerOrdersStandaloneView';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const menuData = await getPublicMenuBySlug(slug);

  if (!menuData) {
    return {
      title: 'Carrito no encontrado | Carrito Take-Away',
    };
  }

  return {
    title: `Mis Pedidos | ${menuData.tenant.name} — Estado en Tiempo Real`,
    description: `Consultá el estado de tu comanda en ${menuData.tenant.name} ingresando tu nombre y apellido.`,
  };
}

export default async function CustomerOrdersPage({ params }: PageProps) {
  const { slug } = await params;
  const menuData = await getPublicMenuBySlug(slug);

  if (!menuData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f0f4fc] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Navbar Superior */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Link
            href={`/c/${menuData.tenant.slug}`}
            className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Carta</span>
          </Link>

          <span className="font-extrabold text-sm text-slate-800 dark:text-white truncate">
            {menuData.tenant.name}
          </span>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <CustomerOrdersStandaloneView
          tenantId={menuData.tenant.id}
          tenantSlug={menuData.tenant.slug}
          tenantName={menuData.tenant.name}
          currency={menuData.settings.currency}
        />
      </main>
    </div>
  );
}
