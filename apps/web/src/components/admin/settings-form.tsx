'use client';

import { Button, Card, Field, Input } from '@tracy/ui';

import { saveSettings } from '@/app/actions/admin';
import { useI18n } from '@/lib/i18n';

const GROUP_LABELS: Record<string, string> = {
  contact: 'Thông tin liên hệ',
  social: 'Mạng xã hội',
  general: 'Chung',
};

/**
 * Site settings.
 *
 * Every setting has a Vietnamese and an English value. Where the English one is blank the
 * site falls back to Vietnamese, so an administrator only has to fill in the second column
 * for values that genuinely differ.
 */
export function SettingsForm({
  settings,
  locale,
}: {
  settings: { key: string; group: string; label: string; valueVi: string; valueEn: string }[];
  locale: string;
}) {
  const { t } = useI18n();

  const grouped = settings.reduce<Record<string, typeof settings>>((accumulator, setting) => {
    (accumulator[setting.group] ??= []).push(setting);
    return accumulator;
  }, {});

  return (
    <form action={saveSettings} className="space-y-5">
      <input type="hidden" name="__locale" value={locale} />
      {settings.map((setting) => (
        <input key={setting.key} type="hidden" name="__keys" value={setting.key} />
      ))}

      {Object.entries(grouped).map(([group, rows]) => (
        <Card key={group}>
          <h3 className="text-base">{GROUP_LABELS[group] ?? group}</h3>
          <div className="mt-4 space-y-4">
            {rows.map((setting) => (
              <div key={setting.key} className="grid gap-3 md:grid-cols-2">
                <Field label={`${setting.label || setting.key} (VI)`} htmlFor={`vi-${setting.key}`}>
                  <Input id={`vi-${setting.key}`} name={`vi:${setting.key}`} defaultValue={setting.valueVi} />
                </Field>
                <Field label={`${setting.label || setting.key} (EN)`} htmlFor={`en-${setting.key}`}>
                  <Input id={`en-${setting.key}`} name={`en:${setting.key}`} defaultValue={setting.valueEn} />
                </Field>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Button type="submit" size="lg">
        {t('action.save')}
      </Button>
    </form>
  );
}
