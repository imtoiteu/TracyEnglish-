import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

import { translate } from '@tracy/localization';
import { ButtonLink, EmptyState, Eyebrow, Stat, cn } from '@tracy/ui';

import { VocabularyCard } from '@/components/learn/vocabulary-card';
import { db } from '@/lib/db';
import { parseArray } from '@/lib/json';
import { requireUser, resolveLocale } from '@/lib/session';

export const metadata: Metadata = { title: 'Từ vựng của tôi' };
export const dynamic = 'force-dynamic';

const FILTERS = [
  { key: 'all', labelVi: 'Tất cả' },
  { key: 'due', labelVi: 'Đến hạn ôn' },
  { key: 'learning', labelVi: 'Đang học' },
  { key: 'mastered', labelVi: 'Đã thuộc' },
  { key: 'favourite', labelVi: 'Yêu thích' },
] as const;

export default async function MyVocabularyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const locale = await resolveLocale(params);
  const user = await requireUser(locale, `/${locale}/dashboard/vocabulary`);
  const query = await searchParams;
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;
  const filter = query.filter ?? 'all';

  const where = {
    userId: user.id,
    ...(filter === 'due' ? { dueAt: { lte: new Date() }, box: { lt: 6 } } : {}),
    ...(filter === 'learning' ? { box: { gt: 0, lt: 5 } } : {}),
    ...(filter === 'mastered' ? { box: { gte: 5 } } : {}),
    ...(filter === 'favourite' ? { isFavourite: true } : {}),
  };

  const [rows, counts] = await Promise.all([
    db.vocabularyProgress.findMany({
      where,
      orderBy: [{ dueAt: 'asc' }],
      take: 120,
      include: { vocabulary: true },
    }),
    Promise.all([
      db.vocabularyProgress.count({ where: { userId: user.id } }),
      db.vocabularyProgress.count({ where: { userId: user.id, dueAt: { lte: new Date() }, box: { lt: 6 } } }),
      db.vocabularyProgress.count({ where: { userId: user.id, box: { gte: 5 } } }),
      db.vocabularyProgress.count({ where: { userId: user.id, isFavourite: true } }),
    ]),
  ]);

  const [total, due, mastered, favourite] = counts;

  return (
    <div className="py-10">
      <div className="container-page">
        <Link href={href('/dashboard')} className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-500 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" />
          {t('nav.dashboard')}
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow accent="rose">
              <Sparkles className="h-3.5 w-3.5" />
              {t('nav.vocabulary')}
            </Eyebrow>
            <h1 className="mt-4 text-4xl">Từ vựng của tôi</h1>
          </div>
          <ButtonLink href={href('/vocabulary/review')} variant="secondary">
            {t('vocab.review')} {due ? `(${due})` : ''}
          </ButtonLink>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat accent="brand" value={total} label="từ đang theo dõi" />
          <Stat accent="rose" value={due} label={t('vocab.dueToday')} />
          <Stat accent="teal" value={mastered} label={t('vocab.mastered')} />
          <Stat accent="sun" value={favourite} label={t('action.favourite')} />
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {FILTERS.map((option) => (
            <Link
              key={option.key}
              href={option.key === 'all' ? href('/dashboard/vocabulary') : href(`/dashboard/vocabulary?filter=${option.key}`)}
              className={cn(
                'rounded-full border-2 px-3 py-1 text-xs font-bold transition-colors',
                filter === option.key
                  ? 'border-brand-400 bg-brand-100 text-brand-800'
                  : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300',
              )}
            >
              {option.labelVi}
            </Link>
          ))}
        </div>

        {rows.length ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => (
              <VocabularyCard
                key={row.id}
                item={{
                  word: row.vocabulary.word,
                  cefr: row.vocabulary.cefr,
                  ipaUk: row.vocabulary.ipaUk,
                  ipaUs: row.vocabulary.ipaUs,
                  audioPath: row.vocabulary.audioPath,
                  audioCredit: row.vocabulary.audioCredit,
                  meaningVi: row.vocabulary.meaningVi,
                  partsOfSpeech: parseArray<string>(row.vocabulary.partsOfSpeech),
                  progress: { box: row.box, isFavourite: row.isFavourite },
                }}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              title="Chưa có từ nào ở mục này"
              description="Mở một từ bất kỳ trong từ điển và bấm “Thêm vào danh sách ôn”."
              action={<ButtonLink href={href('/vocabulary')}>{t('nav.vocabulary')}</ButtonLink>}
            />
          </div>
        )}
      </div>
    </div>
  );
}
