import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicMenuBySlug } from '@/features/catalog/queries';
import { getActivePublicRaffles } from '@/features/raffles/queries';
import { PublicMenuView } from '@/features/menu-engine/components/PublicMenuView';

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
      description: 'El negocio gastronómico solicitado no existe o se encuentra inactivo.',
    };
  }

  return {
    title: `${menuData.tenant.name} — Carta Digital & Pedidos`,
    description: `Hacé tu pedido online en ${menuData.tenant.name}. Retirá sin hacer fila. Tiempo estimado de preparación: ${menuData.settings.currentPreparationTimeMinutes} min.`,
    openGraph: {
      title: `${menuData.tenant.name} | Carta Digital`,
      description: `Pedí desde tu celular en ${menuData.tenant.name}.`,
      images: menuData.tenant.bannerUrl ? [menuData.tenant.bannerUrl] : [],
    },
  };
}

export default async function PublicMenuPage({ params }: PageProps) {
  const { slug } = await params;
  const menuData = await getPublicMenuBySlug(slug);

  if (!menuData) {
    notFound();
  }

  const activeRaffles = await getActivePublicRaffles(menuData.tenant.id);

  return <PublicMenuView menuData={menuData} initialRaffles={activeRaffles} />;
}
