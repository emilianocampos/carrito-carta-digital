import { redirect } from 'next/navigation';

export default async function PaymentsRedirectPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  redirect(`/admin/${tenantSlug}/settings?tab=payments`);
}
