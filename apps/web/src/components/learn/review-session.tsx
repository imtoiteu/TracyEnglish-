'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Eye, PartyPopper, RotateCcw } from 'lucide-react';

import { Button, ButtonLink, Card, LevelBadge, ProgressBar, cn } from '@tracy/ui';

import { useI18n } from '@/lib/i18n';

import { WordAudioButton } from './audio';

export type ReviewCard = {
  id: string;
  vocabularyId: string;
  word: string;
  cefr: string;
  ipaUk: string;
  ipaUs: string;
  audioPath: string;
  audioCredit: string;
  meaningVi: string;
  explanationVi: string;
  example: { en: string; vi: string } | null;
  box: number;
};

const QUALITIES = [
  { key: 'again', labelVi: 'Quên rồi', accent: 'bg-rose-500 hover:bg-rose-600', hintVi: 'Gặp lại sau 10 phút' },
  { key: 'hard', labelVi: 'Khó', accent: 'bg-sun-500 hover:bg-sun-600', hintVi: 'Gặp lại sớm' },
  { key: 'good', labelVi: 'Nhớ được', accent: 'bg-teal-500 hover:bg-teal-600', hintVi: 'Giãn cách bình thường' },
  { key: 'easy', labelVi: 'Quá dễ', accent: 'bg-brand-500 hover:bg-brand-600', hintVi: 'Giãn cách xa hơn' },
] as const;

/**
 * The flashcard review session.
 *
 * A card shows the English word first and the Vietnamese meaning only after the learner
 * commits to remembering — showing both at once turns recall into recognition, which is a
 * far weaker form of practice.
 *
 * The four self-graded buttons feed the scheduler. Self-grading is deliberate: only the
 * learner knows whether they genuinely recalled the word or guessed it.
 */
export function ReviewSession({ cards }: { cards: ReviewCard[] }) {
  const { t, href } = useI18n();
  const [queue, setQueue] = useState(cards);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState<{ word: string; quality: string }[]>([]);
  const [busy, setBusy] = useState(false);

  const card = queue[index];
  const total = cards.length;

  const answer = async (quality: string) => {
    if (!card || busy) return;
    setBusy(true);
    try {
      await fetch('/api/vocabulary/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vocabularyId: card.vocabularyId, quality }),
      });
    } catch {
      // A failed write should not lose the learner's place; the card simply comes round
      // again in the next session.
    } finally {
      setDone((previous) => [...previous, { word: card.word, quality }]);
      // "Quên rồi" puts the card back at the end of this session, which is the whole point
      // of the Leitner box-zero interval.
      if (quality === 'again') {
        setQueue((previous) => [...previous, card]);
      }
      setIndex((value) => value + 1);
      setRevealed(false);
      setBusy(false);
    }
  };

  if (!total) {
    return (
      <Card className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-teal-600">
          <Check className="h-8 w-8" />
        </span>
        <h2 className="mt-4 text-2xl">Không có từ nào đến hạn ôn</h2>
        <p className="mt-2 text-ink-600">
          Hãy thêm từ mới vào danh sách ôn, hoặc quay lại vào ngày mai.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href={href('/vocabulary')}>{t('nav.vocabulary')}</ButtonLink>
        </div>
      </Card>
    );
  }

  if (!card) {
    const forgotten = done.filter((row) => row.quality === 'again').length;
    return (
      <Card className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sun-100 text-sun-700">
          <PartyPopper className="h-8 w-8" />
        </span>
        <h2 className="mt-4 text-2xl">Xong phiên ôn hôm nay</h2>
        <p className="mt-2 text-ink-600">
          Bạn đã ôn {done.length} lượt trên {total} từ
          {forgotten ? `, trong đó ${forgotten} lượt cần gặp lại sớm.` : '.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href={href('/vocabulary')} variant="outline">
            {t('nav.vocabulary')}
          </ButtonLink>
          <ButtonLink href={href('/dashboard')}>{t('nav.dashboard')}</ButtonLink>
        </div>
      </Card>
    );
  }

  const progress = Math.round((Math.min(index, total) / total) * 100);

  return (
    <div>
      <div className="mb-5">
        <ProgressBar value={progress} accent="rose" label={`${Math.min(index + 1, total)} / ${total}`} />
      </div>

      <Card className="min-h-[24rem]">
        <div className="flex items-start justify-between gap-3">
          <LevelBadge level={card.cefr} />
          <span className="text-xs font-semibold text-ink-400">Hộp ôn {card.box}/6</span>
        </div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-4xl sm:text-5xl">{card.word}</h2>
            <WordAudioButton
              src={card.audioPath || null}
              word={card.word}
              credit={card.audioCredit}
              size="lg"
            />
          </div>
          {card.ipaUk || card.ipaUs ? (
            <p className="ipa mt-2 text-lg">{card.ipaUk || card.ipaUs}</p>
          ) : null}
        </div>

        {revealed ? (
          <div className="mt-8 space-y-4 animate-fade-up">
            <div className="rounded-2xl border-2 border-teal-200 bg-teal-50 p-4 text-center">
              <p className="text-2xl font-extrabold text-teal-900">{card.meaningVi}</p>
              {card.explanationVi ? (
                <p className="mt-2 text-sm leading-relaxed text-teal-800">{card.explanationVi}</p>
              ) : null}
            </div>
            {card.example ? (
              <div className="rounded-2xl bg-ink-50 p-4">
                <p className="text-[0.95rem] font-semibold text-ink-900">{card.example.en}</p>
                <p className="mt-1 text-sm text-ink-600">{card.example.vi}</p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-3">
            <p className="text-sm text-ink-500">Bạn có nhớ nghĩa của từ này không?</p>
            <Button onClick={() => setRevealed(true)} size="lg" variant="outline">
              <Eye className="h-4 w-4" />
              {t('action.showAnswer')}
            </Button>
          </div>
        )}

        {revealed ? (
          <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {QUALITIES.map((quality) => (
              <button
                key={quality.key}
                type="button"
                disabled={busy}
                onClick={() => void answer(quality.key)}
                className={cn(
                  'rounded-2xl px-3 py-3 text-center text-white transition-colors disabled:opacity-60',
                  quality.accent,
                )}
              >
                <span className="block text-sm font-extrabold">{quality.labelVi}</span>
                <span className="mt-0.5 block text-[0.7rem] opacity-90">{quality.hintVi}</span>
              </button>
            ))}
          </div>
        ) : null}
      </Card>

      <div className="mt-4 flex items-center justify-between text-sm text-ink-500">
        <Link href={href('/vocabulary')} className="font-semibold hover:text-brand-700">
          ← {t('action.back')}
        </Link>
        <button
          type="button"
          onClick={() => {
            setIndex(0);
            setDone([]);
            setQueue(cards);
            setRevealed(false);
          }}
          className="inline-flex items-center gap-1.5 font-semibold hover:text-brand-700"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Bắt đầu lại
        </button>
      </div>
    </div>
  );
}
