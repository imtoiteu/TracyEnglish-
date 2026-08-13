import { NextResponse, type NextRequest } from 'next/server';

import { db } from '@/lib/db';
import { recalculateCourseProgress, recordActivity, XP } from '@/lib/progress';
import { getCurrentUser } from '@/lib/session';

/**
 * Mark a lesson complete and roll the course percentage forward.
 *
 * Completing a lesson also creates the enrolment if the learner did not have one, so a
 * learner who arrives from a search result and works through a lesson still ends up with
 * the course on their dashboard.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  let body: { lessonId?: string; seconds?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const lessonId = String(body.lessonId ?? '');
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { select: { courseId: true } } },
  });
  if (!lesson) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const already = await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
  });

  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: {
      userId: user.id,
      lessonId,
      status: 'COMPLETED',
      secondsSpent: Math.min(Number(body.seconds ?? 0), 7200),
      completedAt: new Date(),
    },
    update: { status: 'COMPLETED', completedAt: new Date() },
  });

  await db.enrollment.upsert({
    where: { userId_courseId: { userId: user.id, courseId: lesson.module.courseId } },
    create: { userId: user.id, courseId: lesson.module.courseId, lastLessonId: lessonId },
    update: { lastLessonId: lessonId },
  });

  const progress = await recalculateCourseProgress(user.id, lesson.module.courseId);

  // Only award XP the first time — otherwise re-marking a lesson would farm points.
  if (already?.status !== 'COMPLETED') {
    await recordActivity(user.id, {
      lessons: 1,
      xp: XP.lessonComplete,
      minutes: lesson.estimatedMinutes,
    });
  }

  return NextResponse.json({ completed: true, courseProgress: progress });
}
