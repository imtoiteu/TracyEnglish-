import type { Metadata } from 'next';
import { HelpCircle } from 'lucide-react';

import { translate } from '@tracy/localization';
import { ButtonLink, Eyebrow } from '@tracy/ui';

import { db } from '@/lib/db';
import { resolveLocale } from '@/lib/session';

export const metadata: Metadata = { title: 'Câu hỏi thường gặp' };
export const dynamic = 'force-dynamic';

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Chung',
  learning: 'Việc học',
  classes: 'Lớp học',
  payment: 'Học phí',
};

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const faqs = await db.faqItem.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
  });

  const grouped = faqs.reduce<Record<string, typeof faqs>>((accumulator, faq) => {
    (accumulator[faq.category] ??= []).push(faq);
    return accumulator;
  }, {});

  return (
    <div className="py-12">
      <div className="container-prose">
        <Eyebrow accent="teal">
          <HelpCircle className="h-3.5 w-3.5" />
          {t('home.faq.title')}
        </Eyebrow>
        <h1 className="mt-4 text-4xl">Câu hỏi thường gặp</h1>

        <div className="mt-10 space-y-10">
          {Object.entries(grouped).map(([category, items]) => (
            <section key={category}>
              <h2 className="text-xl text-brand-700">{CATEGORY_LABELS[category] ?? category}</h2>
              <div className="mt-4 space-y-3">
                {items.map((faq) => (
                  <details
                    key={faq.id}
                    className="group rounded-3xl border-2 border-ink-100 bg-white p-5 shadow-soft open:border-brand-200"
                  >
                    <summary className="cursor-pointer list-none font-display text-base font-extrabold text-ink-900">
                      {faq.questionVi}
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-ink-600">{faq.answerVi}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-3xl bg-lavender p-8 text-center">
          <h2 className="text-2xl">Chưa tìm thấy câu trả lời?</h2>
          <p className="mt-2 text-sm text-ink-600">
            Để lại số điện thoại, giáo viên sẽ gọi lại và trả lời trực tiếp.
          </p>
          <ButtonLink href={href('/contact')} className="mt-5">
            {t('action.consult')}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
