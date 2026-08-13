import Link from 'next/link';

import { translate } from '@tracy/localization';

import { AdminNav } from '@/components/admin/admin-nav';
import { db } from '@/lib/db';
import { requireRole, resolveLocale } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * The admin shell.
 *
 * Everything under /admin requires the ADMIN role — checked here once, on the server, so no
 * child page can forget. The navigation counts are read here too, because a badge showing
 * "3 new enquiries" is the main reason an administrator opens this panel at all.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveLocale(params);
  const user = await requireRole(locale, 'ADMIN', `/${locale}/admin`);
  const t = (key: string) => translate(locale, key);

  const [newConsultations, draftCount] = await Promise.all([
    db.consultationRequest.count({ where: { status: 'NEW' } }),
    db.lesson.count({ where: { status: 'DRAFT' } }),
  ]);

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="container-page py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
              {t('admin.title')}
            </p>
            <h1 className="mt-1 font-display text-2xl font-extrabold text-ink-900">
              Bảng điều khiển Tracy English
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink-500">
              Đăng nhập với tư cách <strong className="text-ink-800">{user.name}</strong>
            </span>
            <Link
              href={`/${locale}`}
              className="rounded-2xl border-2 border-ink-200 bg-white px-3 py-1.5 font-bold text-ink-700 hover:border-brand-300"
            >
              Xem website
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[16rem_1fr] lg:items-start">
          <AdminNav newConsultations={newConsultations} draftCount={draftCount} />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
