'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BookmarkPlus, Check, Star } from 'lucide-react';

import { Button, ButtonLink, Card, ProgressBar, cn } from '@tracy/ui';

import { useI18n } from '@/lib/i18n';

/**
 * Save, favourite and review controls for a single word.
 *
 * "Add to review" creates the spaced-repetition record. The distinction from "favourite"
 * matters: favouriting is a bookmark, adding to review is a commitment to be asked about
 * this word again in two days, then four, then eight.
 */
export function WordActions({
  word,
  vocabularyId,
  signedIn,
  initialFavourite,
  box,
}: {
  word: string;
  vocabularyId: string;
  signedIn: boolean;
  initialFavourite: boolean;
  box: number | null;
}) {
  const { t, href } = useI18n();
  const [favourite, setFavourite] = useState(initialFavourite);
  const [tracked, setTracked] = useState(box !== null);
  const [busy, setBusy] = useState(false);

  const call = async (action: 'track' | 'favourite') => {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch('/api/vocabulary/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vocabularyId, action }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as { tracked: boolean; favourite: boolean };
      setTracked(data.tracked);
      setFavourite(data.favourite);
    } finally {
      setBusy(false);
    }
  };

  if (!signedIn) {
    return (
      <Card>
        <p className="text-sm leading-relaxed text-ink-700">
          Đăng nhập để lưu <span className="font-bold">{word}</span> vào danh sách ôn và theo dõi
          tiến độ.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink href={href('/login')} size="sm">
            {t('action.login')}
          </ButtonLink>
          <ButtonLink href={href('/register')} size="sm" variant="outline">
            {t('action.register')}
          </ButtonLink>
        </div>
      </Card>
    );
  }

  const mastery = box === null ? 0 : Math.min(100, Math.round((box / 6) * 100));

  return (
    <Card>
      {tracked ? (
        <div className="mb-4">
          <ProgressBar value={mastery} accent={mastery >= 84 ? 'teal' : 'brand'} label={t('dash.mastery')} />
          <p className="mt-2 text-xs text-ink-500">
            {mastery >= 84
              ? 'Từ này đã ở mức thuộc. Hệ thống sẽ hỏi lại thưa dần.'
              : 'Trả lời đúng ở mỗi lần ôn để đẩy từ này lên mức cao hơn.'}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button
          onClick={() => call('track')}
          disabled={busy}
          variant={tracked ? 'outline' : 'primary'}
          className="w-full"
        >
          {tracked ? <Check className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
          {tracked ? 'Đang trong danh sách ôn' : t('vocab.addToList')}
        </Button>

        <Button
          onClick={() => call('favourite')}
          disabled={busy}
          variant="ghost"
          className={cn('w-full', favourite && 'text-sun-700')}
        >
          <Star className={cn('h-4 w-4', favourite && 'fill-sun-400 text-sun-400')} />
          {favourite ? 'Đã yêu thích' : t('action.favourite')}
        </Button>

        <Link
          href={href('/vocabulary/review')}
          className="mt-1 text-center text-sm font-bold text-brand-600 hover:underline"
        >
          {t('vocab.review')} →
        </Link>
      </div>
    </Card>
  );
}
