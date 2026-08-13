import { NextResponse, type NextRequest } from 'next/server';

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

/**
 * Start tracking a word, or toggle its favourite flag.
 *
 * Adding a word creates its spaced-repetition record due immediately, so it appears in the
 * very next review session rather than at some point in the future — a learner who just
 * decided to learn a word expects to be asked about it soon.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  let body: { vocabularyId?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const vocabularyId = String(body.vocabularyId ?? '');
  const action = body.action === 'favourite' ? 'favourite' : 'track';
  if (!vocabularyId) return NextResponse.json({ error: 'vocabularyId required' }, { status: 400 });

  const word = await db.vocabularyItem.findUnique({ where: { id: vocabularyId }, select: { id: true } });
  if (!word) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const existing = await db.vocabularyProgress.findUnique({
    where: { userId_vocabularyId: { userId: user.id, vocabularyId } },
  });

  if (action === 'favourite') {
    const row = existing
      ? await db.vocabularyProgress.update({
          where: { id: existing.id },
          data: { isFavourite: !existing.isFavourite },
        })
      : await db.vocabularyProgress.create({
          data: { userId: user.id, vocabularyId, isFavourite: true, dueAt: new Date() },
        });
    return NextResponse.json({ tracked: true, favourite: row.isFavourite });
  }

  if (existing) {
    // Untracking removes the schedule but keeps nothing behind — the learner asked for it
    // to stop appearing.
    await db.vocabularyProgress.delete({ where: { id: existing.id } });
    return NextResponse.json({ tracked: false, favourite: false });
  }

  const created = await db.vocabularyProgress.create({
    data: { userId: user.id, vocabularyId, dueAt: new Date() },
  });
  return NextResponse.json({ tracked: true, favourite: created.isFavourite });
}
