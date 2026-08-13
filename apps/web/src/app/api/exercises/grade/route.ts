import { NextResponse, type NextRequest } from 'next/server';

import { grade, type ExercisePayload, type ExerciseType } from '@tracy/exercise-engine';

import { db } from '@/lib/db';
import { parseJson } from '@/lib/json';
import { recordActivity, XP } from '@/lib/progress';
import { getCurrentUser } from '@/lib/session';

/**
 * Grade one answer.
 *
 * The answer key never leaves the server until the learner has committed to a response —
 * this route reads the exercise fresh from the database, grades, and returns the model
 * answer alongside the verdict.
 *
 * Attempts are recorded for signed-in learners so the dashboard and the recommender have
 * something real to work from. Anonymous learners can still practise; they simply do not
 * accumulate a history.
 */
export async function POST(request: NextRequest) {
  let body: { exerciseId?: string; response?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const exerciseId = String(body.exerciseId ?? '');
  const response = String(body.response ?? '');
  if (!exerciseId) return NextResponse.json({ error: 'exerciseId required' }, { status: 400 });

  const exercise = await db.exercise.findUnique({ where: { id: exerciseId } });
  if (!exercise || exercise.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const payload = parseJson<ExercisePayload>(exercise.payload, {});
  const result = grade(
    {
      id: exercise.id,
      type: exercise.type as ExerciseType,
      answer: exercise.answer,
      payload,
      points: exercise.points,
    },
    response,
  );

  const user = await getCurrentUser();
  if (user) {
    await db.exerciseAttempt.create({
      data: {
        userId: user.id,
        exerciseId: exercise.id,
        response: response.slice(0, 500),
        isCorrect: result.correct,
        score: result.score,
      },
    });
    await recordActivity(user.id, {
      exercises: 1,
      xp: result.correct ? XP.exerciseCorrect : XP.exerciseAttempt,
      minutes: 1,
    });
  }

  return NextResponse.json({
    correct: result.correct,
    score: result.score,
    expected: result.expected,
    detail: result.detail,
    explanationVi: exercise.explanationVi,
  });
}
