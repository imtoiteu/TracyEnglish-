'use client';

import Link from 'next/link';
import { BookMarked, ChevronRight, Star } from 'lucide-react';

import { Badge, Card, LevelBadge, cn } from '@tracy/ui';

import { useI18n } from '@/lib/i18n';

import { WordAudioButton } from './audio';

export type VocabularyCardData = {
  word: string;
  cefr: string;
  ipaUk: string;
  ipaUs: string;
  audioPath: string;
  audioCredit: string;
  meaningVi: string;
  partsOfSpeech: string[];
  progress?: { box: number; isFavourite: boolean } | null;
};

/**
 * A vocabulary card in a list.
 *
 * The layout is fixed on purpose: word, phonetics and audio on one line, Vietnamese meaning
 * beneath. A learner scanning fifty of these needs the same information in the same place
 * every time, so nothing here reflows based on which fields happen to be present.
 */
export function VocabularyCard({ item, compact = false }: { item: VocabularyCardData; compact?: boolean }) {
  const { t, href } = useI18n();
  const box = item.progress?.box ?? -1;
  const state =
    box >= 5 ? 'mastered' : box >= 1 ? 'learning' : box === 0 ? 'learning' : 'notStarted';

  return (
    <Card interactive className={cn('flex flex-col', compact ? 'p-4' : 'p-5')}>
      <div className="flex items-start gap-3">
        <WordAudioButton
          src={item.audioPath || null}
          word={item.word}
          credit={item.audioCredit}
          size={compact ? 'sm' : 'md'}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={href(`/vocabulary/${encodeURIComponent(item.word)}`)}
              className="font-display text-lg font-extrabold text-ink-900 hover:text-brand-700"
            >
              {item.word}
            </Link>
            <LevelBadge level={item.cefr} />
            {item.progress?.isFavourite ? (
              <Star className="h-3.5 w-3.5 fill-sun-400 text-sun-400" aria-label={t('action.favourite')} />
            ) : null}
          </div>
          {item.ipaUk || item.ipaUs ? (
            <p className="ipa mt-0.5 text-sm">
              {item.ipaUk ? <span title="Received Pronunciation">UK {item.ipaUk}</span> : null}
              {item.ipaUk && item.ipaUs ? <span className="mx-1.5 text-ink-300">·</span> : null}
              {item.ipaUs ? <span title="General American">US {item.ipaUs}</span> : null}
            </p>
          ) : null}
        </div>
      </div>

      <p className="mt-2.5 text-[0.95rem] font-semibold leading-snug text-teal-800">
        {item.meaningVi || <span className="text-ink-400">Chưa có nghĩa tiếng Việt</span>}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {item.partsOfSpeech.slice(0, 3).map((pos) => (
            <span key={pos} className="rounded-full bg-ink-100 px-2 py-0.5 text-[0.7rem] font-semibold text-ink-600">
              {pos}
            </span>
          ))}
        </div>
        {item.progress ? (
          <Badge accent={state === 'mastered' ? 'teal' : 'sun'}>{t(`vocab.${state}`)}</Badge>
        ) : null}
      </div>
    </Card>
  );
}

export function VocabularyListCard({
  list,
}: {
  list: {
    slug: string;
    titleVi: string;
    titleEn: string;
    summaryVi: string;
    cefr: string;
    accent: string;
    count: number;
  };
}) {
  const { href, locale } = useI18n();
  return (
    <Link href={href(`/vocabulary/lists/${list.slug}`)} className="group">
      <Card interactive className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg leading-snug">{locale === 'en' ? list.titleEn : list.titleVi}</h3>
          <LevelBadge level={list.cefr} />
        </div>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{list.summaryVi}</p>
        <div className="mt-4 flex items-center justify-between text-sm font-bold text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <BookMarked className="h-4 w-4" />
            {list.count} từ
          </span>
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </Card>
    </Link>
  );
}
