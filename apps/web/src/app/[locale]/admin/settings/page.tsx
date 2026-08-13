import { translate } from '@tracy/localization';
import { Alert } from '@tracy/ui';

import { SettingsForm } from '@/components/admin/settings-form';
import { db } from '@/lib/db';
import { resolveLocale } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const locale = await resolveLocale(params);
  const query = await searchParams;
  const t = (key: string) => translate(locale, key);

  const settings = await db.siteSetting.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-ink-900">{t('admin.settings')}</h2>
        <p className="mt-1 text-sm text-ink-500">
          Những giá trị này xuất hiện ở chân trang, trang liên hệ và thanh thông báo.
        </p>
      </div>

      {query.saved ? <Alert tone="success">{t('admin.saved')}</Alert> : null}

      <SettingsForm
        settings={settings.map((row) => ({
          key: row.key,
          group: row.group,
          label: row.label,
          valueVi: row.valueVi,
          valueEn: row.valueEn,
        }))}
        locale={locale}
      />
    </div>
  );
}
