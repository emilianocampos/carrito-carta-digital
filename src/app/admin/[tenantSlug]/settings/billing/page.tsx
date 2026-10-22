import { redirect } from 'next/navigation';

export default async function BillingRedirectPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  redirect(`/admin/${tenantSlug}/settings?tab=billing`);
}
