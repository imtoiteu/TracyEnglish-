import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Layers } from 'lucide-react';

import { translate } from '@tracy/localization';
import { ButtonLink, Card, Eyebrow, LevelBadge, SectionHeading } from '@tracy/ui';

import { ExercisePlayer } from '@/components/learn/exercise-player';
import { VocabularyCard } from '@/components/learn/vocabulary-card';
import { db } from '@/lib/db';
import { toClientExercises } from '@/lib/exercises';
import { parseArray } from '@/lib/json';
import { getCurrentUser, resolveLocale } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const list = await db.vocabularyList.findUnique({ where: { slug } });
  return { title: list?.titleVi ?? 'Danh sách từ vựng' };
}

export default async function VocabularyListPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const resolved = await params;
  const locale = await resolveLocale(params);
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const list = await db.vocabularyList.findUnique({
    where: { slug: resolved.slug },
    include: {
      items: {
        orderBy: { displayOrder: 'asc' },
        include: { vocabulary: true },
      },
      exercises: { where: { status: 'PUBLISHED' }, orderBy: { displayOrder: 'asc' } },
    },
  });
  if (!list || list.status !== 'PUBLISHED') notFound();

  const user = await getCurrentUser();
  const progress = user
    ? await db.vocabularyProgress.findMany({
        where: {
          userId: user.id,
          vocabularyId: { in: list.items.map((item) => item.vocabularyId) },
        },
      })
    : [];
  const progressById = new Map(progress.map((row) => [row.vocabularyId, row]));

  const withAudio = list.items.filter((item) => item.vocabulary.audioPath).length;
  const exercises = toClientExercises(list.exercises);

  return (
    <div className="py-10">
      <div className="container-page">
        <Link
          href={href('/vocabulary')}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-500 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('nav.vocabulary')}
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <Eyebrow accent="rose">
              <Layers className="h-3.5 w-3.5" />
              {t('vocab.lists')}
            </Eyebrow>
            <h1 className="mt-4 text-3xl sm:text-4xl">
              {locale === 'en' ? list.titleEn : list.titleVi}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-ink-600">{list.summaryVi}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-ink-500">
              <LevelBadge level={list.cefr} />
              <span>{list.items.length} từ</span>
              <span className="text-ink-300">·</span>
              <span>{withAudio} từ có bản thu của người thật</span>
            </div>
          </div>
          <ButtonLink href={href('/vocabulary/review')} variant="secondary">
            {t('vocab.review')}
          </ButtonLink>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.items.map((item) => (
            <VocabularyCard
              key={item.id}
              item={{
                word: item.vocabulary.word,
                cefr: item.vocabulary.cefr,
                ipaUk: item.vocabulary.ipaUk,
                ipaUs: item.vocabulary.ipaUs,
                audioPath: item.vocabulary.audioPath,
                audioCredit: item.vocabulary.audioCredit,
                meaningVi: item.vocabulary.meaningVi,
                partsOfSpeech: parseArray<string>(item.vocabulary.partsOfSpeech),
                progress: progressById.get(item.vocabularyId)
                  ? {
                      box: progressById.get(item.vocabularyId)!.box,
                      isFavourite: progressById.get(item.vocabularyId)!.isFavourite,
                    }
                  : null,
              }}
            />
          ))}
        </div>

        {exercises.length ? (
          <div className="mt-14">
            <SectionHeading
              eyebrow={t('nav.practice')}
              title="Kiểm tra danh sách này"
              lead="Bài tập dùng chính những từ ở trên, cùng câu ví dụ thật của chúng."
              accent="rose"
            />
            <div className="mt-8 max-w-3xl">
              <ExercisePlayer exercises={exercises} contextLabel={list.titleVi} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
