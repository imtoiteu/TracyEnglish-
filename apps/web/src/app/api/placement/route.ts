import { NextResponse, type NextRequest } from 'next/server';

import { CEFR_LEVELS } from '@tracy/curriculum';

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

/**
 * Store a placement result.
 *
 * Anonymous results are kept too — the centre wants to know what level walk-in traffic is
 * at, and a learner who registers later can be matched by email.
 */
export async function POST(request: NextRequest) {
  let body: {
    cefr?: string;
    score?: number;
    maxScore?: number;
    breakdown?: Record<string, number>;
    email?: string;
    name?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const cefr = String(body.cefr ?? 'A1');
  if (!(CEFR_LEVELS as readonly string[]).includes(cefr)) {
    return NextResponse.json({ error: 'invalid level' }, { status: 400 });
  }

  const user = await getCurrentUser();
  const result = await db.placementResult.create({
    data: {
      userId: user?.id ?? null,
      email: body.email ?? user?.email ?? null,
      name: body.name ?? user?.name ?? null,
      cefr,
      score: Math.max(0, Math.min(200, Number(body.score ?? 0))),
      maxScore: Math.max(1, Math.min(200, Number(body.maxScore ?? 20))),
      breakdown: JSON.stringify(body.breakdown ?? {}),
    },
  });

  // A signed-in learner's profile level follows their most recent placement.
  if (user) {
    await db.studentProfile.updateMany({ where: { userId: user.id }, data: { cefrLevel: cefr } });
  }

  return NextResponse.json({ id: result.id, cefr: result.cefr });
}
