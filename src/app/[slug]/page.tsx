import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface RootSlugProps {
  params: Promise<{ slug: string }>;
}

export default async function RootSlugRedirectPage({ params }: RootSlugProps) {
  const { slug } = await params;

  // Evitar interceptar rutas reservadas si por alguna razón no coincidieran
  const reserved = ['admin', 'api', 'login', 'register', 'c', 'favicon.ico'];
  if (reserved.includes(slug.toLowerCase())) {
    notFound();
  }

  try {
    const supabase = await createClient();
    const { data: tenant } = await supabase
      .from('tenants')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();

    if (tenant) {
      redirect(`/c/${tenant.slug}`);
    }
  } catch {
    // Si falla supabase, cae a 404
  }

  notFound();
}
