import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, Sparkles } from 'lucide-react';

import { CEFR_LEVELS } from '@tracy/curriculum';
import { formatNumber, translate } from '@tracy/localization';
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  Eyebrow,
  Input,
  LevelBadge,
  SectionHeading,
  cn,
} from '@tracy/ui';

import { VocabularyCard, VocabularyListCard } from '@/components/learn/vocabulary-card';
import { db } from '@/lib/db';
import { parseArray } from '@/lib/json';
import { getCurrentUser, resolveLocale } from '@/lib/session';

export const metadata: Metadata = { title: 'Từ vựng' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 36;

export default async function VocabularyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; level?: string; page?: string; audio?: string }>;
}) {
  const locale = await resolveLocale(params);
  const query = await searchParams;
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const search = (query.q ?? '').trim();
  const level = CEFR_LEVELS.includes(query.level as never) ? query.level : undefined;
  const audioOnly = query.audio === '1';
  const page = Math.max(1, Number(query.page ?? '1') || 1);

  const where = {
    status: 'PUBLISHED',
    ...(level ? { cefr: level } : {}),
    ...(audioOnly ? { audioPath: { not: '' } } : {}),
    ...(search
      ? {
          OR: [
            { word: { contains: search } },
            { meaningVi: { contains: search } },
          ],
        }
      : {}),
  };

  const [user, total, items, lists, audioCount] = await Promise.all([
    getCurrentUser(),
    db.vocabularyItem.count({ where }),
    db.vocabularyItem.findMany({
      where,
      orderBy: [{ cefr: 'asc' }, { word: 'asc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.vocabularyList.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { items: true } } },
    }),
    db.vocabularyItem.count({ where: { audioPath: { not: '' } } }),
  ]);

  const progress = user
    ? await db.vocabularyProgress.findMany({
        where: { userId: user.id, vocabularyId: { in: items.map((item) => item.id) } },
      })
    : [];
  const progressById = new Map(progress.map((row) => [row.vocabularyId, row]));

  const pages = Math.ceil(total / PAGE_SIZE);
  const buildHref = (next: Record<string, string | undefined>) => {
    const merged = new URLSearchParams();
    const combined = { q: search, level, audio: audioOnly ? '1' : undefined, page: String(page), ...next };
    for (const [key, value] of Object.entries(combined)) {
      if (value) merged.set(key, value);
    }
    return `${href('/vocabulary')}?${merged.toString()}`;
  };

  return (
    <>
      <section className="border-b-2 border-ink-100 bg-lavender py-12">
        <div className="container-page">
          <Eyebrow accent="rose">
            <Sparkles className="h-3.5 w-3.5" />
            {t('nav.vocabulary')}
          </Eyebrow>
          <h1 className="mt-4 text-4xl">{t('vocab.title')}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-600">{t('vocab.lead')}</p>

          <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-ink-600">
            <span>{formatNumber(total, locale)} từ đang hiển thị</span>
            <span className="text-ink-300">·</span>
            <span>{formatNumber(audioCount, locale)} từ có bản thu của người thật</span>
          </div>

          <form action={href('/vocabulary')} method="get" className="mt-6 flex flex-wrap gap-2">
            <div className="relative min-w-[16rem] flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <Input
                name="q"
                defaultValue={search}
                placeholder={t('vocab.searchPlaceholder')}
                className="pl-11"
                aria-label={t('action.search')}
              />
            </div>
            {level ? <input type="hidden" name="level" value={level} /> : null}
            {audioOnly ? <input type="hidden" name="audio" value="1" /> : null}
            <button
              type="submit"
              className="rounded-2xl bg-brand-600 px-6 py-2.5 font-bold text-white transition-colors hover:bg-brand-700"
            >
              {t('action.search')}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href={buildHref({ level: undefined, page: '1' })}
              className={cn(
                'rounded-full border-2 px-3 py-1 text-xs font-bold transition-colors',
                !level ? 'border-brand-400 bg-brand-100 text-brand-800' : 'border-ink-200 bg-white text-ink-600',
              )}
            >
              {t('common.all')}
            </Link>
            {CEFR_LEVELS.map((value) => (
              <Link
                key={value}
                href={buildHref({ level: value, page: '1' })}
                className={cn(
                  'rounded-full border-2 px-3 py-1 font-mono text-xs font-bold transition-colors',
                  level === value
                    ? 'border-brand-400 bg-brand-100 text-brand-800'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300',
                )}
              >
                {value}
              </Link>
            ))}
            <span className="mx-1 h-4 w-px bg-ink-200" aria-hidden="true" />
            <Link
              href={buildHref({ audio: audioOnly ? undefined : '1', page: '1' })}
              className={cn(
                'rounded-full border-2 px-3 py-1 text-xs font-bold transition-colors',
                audioOnly
                  ? 'border-sky-400 bg-sky-100 text-sky-800'
                  : 'border-ink-200 bg-white text-ink-600 hover:border-sky-300',
              )}
            >
              Chỉ hiện từ có audio
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-page">
          <SectionHeading
            eyebrow={t('vocab.lists')}
            title="Học theo danh sách"
            lead="Danh sách theo trình độ CEFR, và danh sách chủ đề lấy từ phần “Words in This Story” do biên tập viên VOA chọn."
            accent="rose"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <VocabularyListCard
                key={list.id}
                list={{
                  slug: list.slug,
                  titleVi: list.titleVi,
                  titleEn: list.titleEn,
                  summaryVi: list.summaryVi,
                  cefr: list.cefr,
                  accent: list.accent,
                  count: list._count.items,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t-2 border-ink-100 bg-white py-12">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl">Tra cứu từ điển</h2>
              <p className="mt-1 text-sm text-ink-600">
                {formatNumber(total, locale)} {t('common.results')}
                {level ? ` · trình độ ${level}` : ''}
                {search ? ` · “${search}”` : ''}
              </p>
            </div>
            {user ? (
              <ButtonLink href={href('/vocabulary/review')} variant="secondary">
                {t('vocab.review')}
              </ButtonLink>
            ) : null}
          </div>

          {items.length ? (
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <VocabularyCard
                  key={item.id}
                  item={{
                    word: item.word,
                    cefr: item.cefr,
                    ipaUk: item.ipaUk,
                    ipaUs: item.ipaUs,
                    audioPath: item.audioPath,
                    audioCredit: item.audioCredit,
                    meaningVi: item.meaningVi,
                    partsOfSpeech: parseArray<string>(item.partsOfSpeech),
                    progress: progressById.get(item.id)
                      ? {
                          box: progressById.get(item.id)!.box,
                          isFavourite: progressById.get(item.id)!.isFavourite,
                        }
                      : null,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState
                title="Không tìm thấy từ nào"
                description="Thử bỏ bớt bộ lọc, hoặc tìm bằng nghĩa tiếng Việt."
                action={
                  <ButtonLink href={href('/vocabulary')} variant="outline">
                    {t('action.reset')}
                  </ButtonLink>
                }
              />
            </div>
          )}

          {pages > 1 ? (
            <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Phân trang">
              {page > 1 ? (
                <Link
                  href={buildHref({ page: String(page - 1) })}
                  className="rounded-2xl border-2 border-ink-200 bg-white px-4 py-2 text-sm font-bold text-ink-700 hover:border-brand-300"
                >
                  {t('action.previous')}
                </Link>
              ) : null}
              <span className="px-3 text-sm font-semibold text-ink-500">
                {page} {t('common.of')} {pages}
              </span>
              {page < pages ? (
                <Link
                  href={buildHref({ page: String(page + 1) })}
                  className="rounded-2xl border-2 border-ink-200 bg-white px-4 py-2 text-sm font-bold text-ink-700 hover:border-brand-300"
                >
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
