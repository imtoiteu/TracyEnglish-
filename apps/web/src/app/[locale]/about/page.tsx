import { redirect } from 'next/navigation';

import { resolveLocale } from '@/lib/session';

/** The About page is administrator-managed content, served from /pages/about. */
export default async function AboutRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  redirect(`/${locale}/pages/about`);
}
