import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock, Volume2 } from 'lucide-react';

import { CEFR_LEVELS } from '@tracy/curriculum';
import { formatNumber, translate } from '@tracy/localization';
import { Badge, Card, EmptyState, Eyebrow, LevelBadge, cn } from '@tracy/ui';

import { db } from '@/lib/db';
import { parseArray } from '@/lib/json';
import { resolveLocale } from '@/lib/session';

export const metadata: Metadata = { title: 'Luyện đọc' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 24;

const KIND_LABELS: Record<string, string> = {
  ARTICLE: 'Bài báo',
  STORY: 'Truyện',
  DIALOGUE: 'Hội thoại',
  EXAM_PASSAGE: 'Bài đọc luyện thi',
};

export default async function ReadingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ level?: string; series?: string; kind?: string; page?: string }>;
}) {
  const locale = await resolveLocale(params);
  const query = await searchParams;
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const level = CEFR_LEVELS.includes(query.level as never) ? query.level : undefined;
  const series = query.series;
  const page = Math.max(1, Number(query.page ?? '1') || 1);

  const where = {
    status: 'PUBLISHED',
    ...(level ? { cefr: level } : {}),
    ...(series ? { series } : {}),
  };

  const [total, items, allSeries, totalWords] = await Promise.all([
    db.readingItem.count({ where }),
    db.readingItem.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { exercises: true } } },
    }),
    db.readingItem.groupBy({
      by: ['series'],
      where: { status: 'PUBLISHED' },
      _count: { _all: true },
    }),
    db.readingItem.aggregate({ _sum: { wordCount: true } }),
  ]);

  const pages = Math.ceil(total / PAGE_SIZE);
  const build = (next: Record<string, string | undefined>) => {
    const merged = new URLSearchParams();
    const combined = { level, series, page: String(page), ...next };
    for (const [key, value] of Object.entries(combined)) if (value) merged.set(key, value);
    return `${href('/reading')}?${merged.toString()}`;
  };

  return (
    <>
      <section className="border-b-2 border-ink-100 bg-lavender py-12">
        <div className="container-page">
          <Eyebrow accent="teal">
            <BookOpen className="h-3.5 w-3.5" />
            {t('nav.reading')}
          </Eyebrow>
          <h1 className="mt-4 text-4xl">{t('reading.title')}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-600">{t('reading.lead')}</p>
          <p className="mt-4 max-w-3xl rounded-2xl bg-white/70 px-4 py-3 text-sm leading-relaxed text-ink-600">
            {formatNumber(total, locale)} bài đọc, tổng cộng{' '}
            {formatNumber(totalWords._sum.wordCount ?? 0, locale)} từ, tất cả từ VOA Learning
            English — viết bằng tiếng Anh phân cấp, phần lớn có kèm bản thu để nghe lại sau khi đọc.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Link
              href={href('/reading')}
              className={cn(
                'rounded-full border-2 px-3 py-1 text-xs font-bold',
                !level && !series ? 'border-teal-400 bg-teal-100 text-teal-800' : 'border-ink-200 bg-white text-ink-600',
              )}
            >
              {t('common.all')}
            </Link>
            {CEFR_LEVELS.slice(0, 5).map((value) => (
              <Link
                key={value}
                href={build({ level: value, page: '1' })}
                className={cn(
                  'rounded-full border-2 px-3 py-1 font-mono text-xs font-bold',
                  level === value ? 'border-teal-400 bg-teal-100 text-teal-800' : 'border-ink-200 bg-white text-ink-600',
                )}
              >
                {value}
              </Link>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {allSeries.map((row) => (
              <Link
                key={row.series}
                href={build({ series: series === row.series ? undefined : row.series, page: '1' })}
                className={cn(
                  'rounded-full border-2 px-3 py-1 text-xs font-semibold',
                  series === row.series
                    ? 'border-brand-400 bg-brand-100 text-brand-800'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300',
                )}
              >
                {row.series} ({row._count._all})
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-page">
          {items.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const glossary = parseArray<{ word: string }>(item.glossary);
                return (
                  <Link key={item.id} href={href(`/reading/${item.slug}`)} className="group">
                    <Card interactive className="flex h-full flex-col">
                      <div className="flex flex-wrap items-center gap-2">
                        <LevelBadge level={item.cefr} />
                        <Badge accent="ink">{KIND_LABELS[item.kind] ?? item.kind}</Badge>
                        {item.audioUrl ? (
                          <Badge accent="sky">
                            <Volume2 className="h-3 w-3" />
                          </Badge>
                        ) : null}
                      </div>
                      <h2 className="mt-3 line-clamp-2 text-base leading-snug">{item.titleVi}</h2>
                      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-600">
                        {item.summaryVi}
                      </p>
                      <div className="mt-4 flex items-center justify-between text-xs font-semibold text-ink-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {item.readingMinutes} {t('common.minutes')} · {item.wordCount}{' '}
                          {t('common.words')} · {glossary.length} từ khoá
                        </span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Chưa có bài đọc nào khớp bộ lọc" description="Thử chọn trình độ khác." />
          )}

          {pages > 1 ? (
            <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Phân trang">
              {page > 1 ? (
                <Link href={build({ page: String(page - 1) })} className="rounded-2xl border-2 border-ink-200 bg-white px-4 py-2 text-sm font-bold">
                  {t('action.previous')}
                </Link>
              ) : null}
              <span className="text-sm font-semibold text-ink-500">
                {page} {t('common.of')} {pages}
              </span>
              {page < pages ? (
                <Link href={build({ page: String(page + 1) })} className="rounded-2xl border-2 border-ink-200 bg-white px-4 py-2 text-sm font-bold">
                  {t('action.next')}
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
      </section>
    </>
  );
}
