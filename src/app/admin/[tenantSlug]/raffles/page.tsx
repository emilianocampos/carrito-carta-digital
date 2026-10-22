import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { requireTenantMembership } from '@/features/auth/server';
import { getAdminRafflesData } from '@/features/raffles/queries';
import { AdminRafflesView } from '@/features/raffles/components/AdminRafflesView';

export const metadata: Metadata = {
  title: 'Sorteos & Concursos | Panel Admin',
  description: 'Gestión de sorteos exclusivos para captación y fidelización de clientes.',
};

interface AdminRafflesPageProps {
  params: Promise<{
    tenantSlug: string;
  }>;
}

export default async function AdminRafflesPage({ params }: AdminRafflesPageProps) {
  const { tenantSlug } = await params;
  const data = await getAdminRafflesData(tenantSlug);

  if (!data) {
    notFound();
  }

  try {
    await requireTenantMembership(data.tenant.id, 'staff');
  } catch {
    redirect(`/login?redirect=/admin/${tenantSlug}/raffles`);
  }

  return <AdminRafflesView data={data} />;
}
