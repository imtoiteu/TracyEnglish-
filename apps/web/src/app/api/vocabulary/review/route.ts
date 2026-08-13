import { NextResponse, type NextRequest } from 'next/server';

import { nextDueDate, scheduleReview, type ReviewState } from '@tracy/exercise-engine';

import { db } from '@/lib/db';
import { recordActivity, XP } from '@/lib/progress';
import { getCurrentUser } from '@/lib/session';

/**
 * Record the outcome of one flashcard review.
 *
 * The scheduling itself lives in the exercise engine and is unit-tested there; this route
 * is the thin layer that reads the current state, advances it and writes it back.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  let body: { vocabularyId?: string; quality?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const vocabularyId = String(body.vocabularyId ?? '');
  const quality = body.quality;
  if (!vocabularyId || !['again', 'hard', 'good', 'easy'].includes(String(quality))) {
    return NextResponse.json({ error: 'vocabularyId and quality required' }, { status: 400 });
  }

  const existing = await db.vocabularyProgress.findUnique({
    where: { userId_vocabularyId: { userId: user.id, vocabularyId } },
  });

  const current: ReviewState = existing
    ? {
        box: existing.box,
        ease: existing.ease,
        intervalDays: existing.intervalDays,
        reviews: existing.reviews,
        correct: existing.correct,
        lapses: existing.lapses,
      }
    : { box: 0, ease: 2.5, intervalDays: 0, reviews: 0, correct: 0, lapses: 0 };

  const advanced = scheduleReview(current, quality as 'again' | 'hard' | 'good' | 'easy');
  const dueAt = nextDueDate(advanced);

  const data = {
    box: advanced.box,
    ease: advanced.ease,
    intervalDays: advanced.intervalDays,
    reviews: advanced.reviews,
    correct: advanced.correct,
    lapses: advanced.lapses,
    dueAt,
    lastReviewed: new Date(),
  };

  const row = existing
    ? await db.vocabularyProgress.update({ where: { id: existing.id }, data })
    : await db.vocabularyProgress.create({ data: { ...data, userId: user.id, vocabularyId } });

  const becameMastered = advanced.box >= 5 && current.box < 5;
  await recordActivity(user.id, {
    words: 1,
    minutes: 1,
    xp: becameMastered ? XP.wordMastered : quality === 'again' ? 1 : XP.wordLearned,
  });

  return NextResponse.json({
    box: row.box,
    intervalDays: row.intervalDays,
    dueAt: row.dueAt,
    mastered: row.box >= 5,
  });
}
