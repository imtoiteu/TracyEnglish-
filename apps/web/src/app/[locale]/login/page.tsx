import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { translate } from '@tracy/localization';
import { Card, DottedGrid, HeroGlow, Logo } from '@tracy/ui';

import { LoginForm } from '@/components/auth/auth-forms';
import { getCurrentUser, resolveLocale } from '@/lib/session';

export const metadata: Metadata = { title: 'Đăng nhập' };
export const dynamic = 'force-dynamic';

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const locale = await resolveLocale(params);
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(`/${locale}/dashboard`);

  const t = (key: string) => translate(locale, key);

  return (
    <div className="relative overflow-hidden py-16 lg:py-24">
      <HeroGlow />
      <DottedGrid className="opacity-30" />
      <div className="container-page relative flex justify-center">
        <Card className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="flex justify-center">
              <Logo />
            </div>
            <h1 className="mt-5 text-2xl">{t('auth.loginTitle')}</h1>
            <p className="mt-2 text-sm text-ink-600">{t('auth.loginLead')}</p>
          </div>
          <LoginForm next={next} />
        </Card>
      </div>
    </div>
  );
}
