import type { Metadata } from 'next';
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';

import { translate } from '@tracy/localization';
import { Card, Eyebrow } from '@tracy/ui';

import { ConsultationForm } from '@/components/site/consultation-form';
import { db } from '@/lib/db';
import { resolveLocale } from '@/lib/session';

export const metadata: Metadata = { title: 'Liên hệ & tư vấn' };
export const dynamic = 'force-dynamic';

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ course?: string; teacher?: string }>;
}) {
  const locale = await resolveLocale(params);
  const query = await searchParams;
  const t = (key: string) => translate(locale, key);

  const settingRows = await db.siteSetting.findMany({ where: { group: 'contact' } });
  const settings = Object.fromEntries(settingRows.map((row) => [row.key, row.valueVi]));

  const contact = [
    { icon: MapPin, label: 'Địa chỉ', value: settings['contact.address'] ?? 'Hà Nội' },
    { icon: Phone, label: 'Hotline tư vấn', value: settings['contact.hotline'] ?? '' },
    { icon: Phone, label: 'Điện thoại', value: settings['contact.phone'] ?? '' },
    { icon: Mail, label: 'Email', value: settings['contact.email'] ?? '' },
    { icon: Clock, label: 'Giờ làm việc', value: settings['contact.hours'] ?? '' },
  ].filter((row) => row.value);

  return (
    <div className="py-12">
      <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        <div>
          <Eyebrow accent="coral">
            <MessageCircle className="h-3.5 w-3.5" />
            {t('nav.contact')}
          </Eyebrow>
          <h1 className="mt-4 text-4xl">{t('consult.title')}</h1>
          <p className="mt-3 text-base leading-relaxed text-ink-600">{t('consult.lead')}</p>

          <div className="mt-8 space-y-3">
            {contact.map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.label} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-soft">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-ink-400">{row.label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-ink-800">{row.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <Card className="mt-6 bg-lavender">
            <h2 className="text-base">Bạn muốn tự học trước?</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Không cần chờ tư vấn. Toàn bộ phần tự học đã mở sẵn và miễn phí — bạn có thể bắt đầu
              ngay hôm nay rồi đăng ký lớp sau nếu thấy cần người kèm.
            </p>
          </Card>
        </div>

        <Card>
          <ConsultationForm
            courseSlug={query.course}
            teacherSlug={query.teacher}
            source={query.teacher ? 'teacher-profile' : query.course ? 'course-page' : 'contact-page'}
          />
        </Card>
      </div>
    </div>
  );
}
