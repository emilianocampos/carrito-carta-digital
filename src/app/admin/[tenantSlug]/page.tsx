import { redirect } from 'next/navigation';

interface AdminTenantPageProps {
  params: Promise<{
    tenantSlug: string;
  }>;
}

export default async function AdminTenantPage({ params }: AdminTenantPageProps) {
  const { tenantSlug } = await params;
  redirect(`/admin/${tenantSlug}/dashboard`);
}
