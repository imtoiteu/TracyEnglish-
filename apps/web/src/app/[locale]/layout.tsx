import { notFound } from 'next/navigation';

import { isLocale, type Locale } from '@tracy/localization';

import { SiteFooter } from '@/components/site/footer';
import { SiteHeader } from '@/components/site/header';
import { db } from '@/lib/db';
import { I18nProvider } from '@/lib/i18n';
import { getCurrentUser } from '@/lib/session';

export function generateStaticParams() {
  return [{ locale: 'vi' }, { locale: 'en' }];
}

/**
 * The locale shell.
 *
 * Header and footer are client components (they have menus and a language switch), but the
 * data they need — the signed-in user, the announcement bar, contact details — is read here
 * on the server and passed down, so no page ships a database query to the browser.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const [user, announcement, settingRows] = await Promise.all([
    getCurrentUser(),
    db.announcement.findFirst({ where: { status: 'PUBLISHED' }, orderBy: { id: 'desc' } }),
    db.siteSetting.findMany(),
  ]);

  const settings = Object.fromEntries(
    settingRows.map((row) => [row.key, locale === 'en' ? row.valueEn || row.valueVi : row.valueVi]),
  );

  return (
    <I18nProvider locale={locale}>
      <div className="flex min-h-screen flex-col">
        <a href="#main" className="skip-link">
          Chuyển tới nội dung chính
        </a>
        <SiteHeader
          user={user ? { name: user.name, role: user.role, email: user.email } : null}
          announcement={announcement?.titleVi}
        />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter settings={settings} />
      </div>
    </I18nProvider>
  );
}
