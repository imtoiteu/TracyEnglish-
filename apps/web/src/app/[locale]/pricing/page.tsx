import type { Metadata } from 'next';
import { CheckCircle2, Sparkles } from 'lucide-react';

import { formatPrice, translate } from '@tracy/localization';
import { Badge, ButtonLink, Card, Eyebrow, SectionHeading, accentStyles, cn } from '@tracy/ui';

import { db } from '@/lib/db';
import { parseArray } from '@/lib/json';
import { resolveLocale } from '@/lib/session';

export const metadata: Metadata = { title: 'Học phí' };
export const dynamic = 'force-dynamic';

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const [products, faqs] = await Promise.all([
    db.product.findMany({ where: { status: 'PUBLISHED' }, orderBy: { displayOrder: 'asc' } }),
    db.faqItem.findMany({ where: { status: 'PUBLISHED', category: 'payment' }, orderBy: { displayOrder: 'asc' } }),
  ]);

  return (
    <>
      <section className="border-b-2 border-ink-100 bg-lavender py-12">
        <div className="container-page text-center">
          <Eyebrow accent="coral">
            <Sparkles className="h-3.5 w-3.5" />
            {t('nav.pricing')}
          </Eyebrow>
          <h1 className="mt-4 text-4xl">Học phí minh bạch</h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-ink-600">
            Phần tự học miễn phí và không giới hạn. Bạn chỉ trả tiền khi cần một người kèm — chữa
            bài viết, sửa phát âm, và giữ bạn đi đúng lộ trình.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-page grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const features = parseArray<string>(product.features);
            const styles = accentStyles(product.accent);
            return (
              <Card
                key={product.id}
                className={cn('flex h-full flex-col', product.isPopular && 'border-brand-400 shadow-lift')}
              >
                {product.isPopular ? (
                  <Badge accent="brand" className="self-start">
                    {t('common.popular')}
                  </Badge>
                ) : null}
                <h2 className="mt-2 text-xl">{product.titleVi}</h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-600">{product.descriptionVi}</p>

                <p className={cn('mt-4 font-display text-3xl font-extrabold', styles.text)}>
                  {formatPrice(product.priceVnd, locale)}
                </p>
                {product.comparePriceVnd ? (
                  <p className="text-sm text-ink-400 line-through">
                    {formatPrice(product.comparePriceVnd, locale)}
                  </p>
                ) : null}
                {product.quantity > 1 ? (
                  <p className="mt-1 text-xs font-semibold text-ink-500">
                    {product.quantity} buổi · còn hiệu lực {product.durationDays} ngày
                  </p>
                ) : null}

                <ul className="mt-4 flex-1 space-y-2">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-ink-700">
                      <CheckCircle2 className={cn('mt-0.5 h-4 w-4 shrink-0', styles.text)} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <ButtonLink
                  href={product.priceVnd === 0 ? href('/register') : href('/contact')}
                  variant={product.isPopular ? 'primary' : 'outline'}
                  className="mt-5 w-full"
                >
                  {product.priceVnd === 0 ? t('action.startFree') : t('action.consult')}
                </ButtonLink>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="border-t-2 border-ink-100 bg-white py-12">
        <div className="container-page grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading eyebrow="Thanh toán" title="Câu hỏi về học phí" accent="teal" />
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.id} className="rounded-3xl border-2 border-ink-100 bg-white p-5 shadow-soft">
                <summary className="cursor-pointer list-none font-display font-extrabold text-ink-900">
                  {faq.questionVi}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">{faq.answerVi}</p>
              </details>
            ))}
            <p className="rounded-2xl bg-ink-50 px-4 py-3 text-sm leading-relaxed text-ink-600">
              Hiện trung tâm nhận chuyển khoản ngân hàng và tiền mặt tại quầy. Hệ thống đã dựng sẵn
              phần đơn hàng và thanh toán để nối cổng trực tuyến khi hoàn tất thủ tục — chưa bật
              nên chưa hiển thị.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
