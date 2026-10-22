import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAdminCatalogData } from '@/features/catalog/queries';
import { AdminCatalogView } from '@/features/catalog/components/AdminCatalogView';

export const metadata: Metadata = {
  title: 'Productos & Categorías | Panel Admin',
  description: 'Gestión manual completa de platos, precios, categorías y adicionales.',
};

interface AdminMenuPageProps {
  params: Promise<{
    tenantSlug: string;
  }>;
}

export default async function AdminMenuPage({ params }: AdminMenuPageProps) {
  const { tenantSlug } = await params;
  const catalogData = await getAdminCatalogData(tenantSlug);

  if (!catalogData) {
    notFound();
  }

  return <AdminCatalogView initialData={catalogData} />;
}
