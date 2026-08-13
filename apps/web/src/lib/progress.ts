import { db } from './db';

/**
 * Progress, streaks and achievements.
 *
 * Everything here is written from the server after a learner does something real — finishes
 * a lesson, answers an exercise, reviews a word. Nothing is inferred from page views, so a
 * streak means the learner actually studied.
 *
 * Days are bucketed in Asia/Ho_Chi_Minh rather than UTC. A learner revising at 11pm in
 * Hanoi should not have that count as tomorrow.
 */

const TIMEZONE = 'Asia/Ho_Chi_Minh';

export function studyDay(date: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD, which sorts correctly as a string.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function previousDay(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  const stamp = new Date(Date.UTC(year, month - 1, date));
  stamp.setUTCDate(stamp.getUTCDate() - 1);
  return stamp.toISOString().slice(0, 10);
}

export type ActivityDelta = {
  minutes?: number;
  xp?: number;
  lessons?: number;
  words?: number;
  exercises?: number;
};

/**
 * Record activity for today and roll the streak forward.
 *
 * The streak only increments the first time a learner is active on a given day; further
 * activity the same day adds XP but does not double-count.
 */
export async function recordActivity(userId: string, delta: ActivityDelta): Promise<void> {
  const day = studyDay();
  const existing = await db.studyDay.findUnique({ where: { userId_day: { userId, day } } });

  await db.studyDay.upsert({
    where: { userId_day: { userId, day } },
    create: {
      userId,
      day,
      minutes: delta.minutes ?? 0,
      xp: delta.xp ?? 0,
      lessons: delta.lessons ?? 0,
      words: delta.words ?? 0,
      exercises: delta.exercises ?? 0,
    },
    update: {
      minutes: { increment: delta.minutes ?? 0 },
      xp: { increment: delta.xp ?? 0 },
      lessons: { increment: delta.lessons ?? 0 },
      words: { increment: delta.words ?? 0 },
      exercises: { increment: delta.exercises ?? 0 },
    },
  });

  const profile = await db.studentProfile.findUnique({ where: { userId } });
  if (!profile) {
    await db.user.update({ where: { id: userId }, data: { lastSeenAt: new Date() } });
    return;
  }

  let streak = profile.streakCurrent;
  if (!existing) {
    const yesterday = await db.studyDay.findUnique({
      where: { userId_day: { userId, day: previousDay(day) } },
    });
    streak = yesterday ? profile.streakCurrent + 1 : 1;
  }

  await db.studentProfile.update({
    where: { userId },
    data: {
      streakCurrent: streak,
      streakLongest: Math.max(streak, profile.streakLongest),
      totalXp: { increment: delta.xp ?? 0 },
      lastStudiedAt: new Date(),
    },
  });

  await awardAchievements(userId);
}

/** XP is small and legible: a learner should be able to reason about where it came from. */
export const XP = {
  exerciseCorrect: 2,
  exerciseAttempt: 1,
  lessonComplete: 20,
  wordLearned: 3,
  wordMastered: 8,
  listeningComplete: 15,
  readingComplete: 15,
} as const;

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

async function metricValue(userId: string, metric: string): Promise<number> {
  switch (metric) {
    case 'LESSONS':
      return db.lessonProgress.count({ where: { userId, status: 'COMPLETED' } });
    case 'WORDS':
      return db.vocabularyProgress.count({ where: { userId, box: { gte: 5 } } });
    case 'STREAK': {
      const profile = await db.studentProfile.findUnique({ where: { userId } });
      return profile?.streakLongest ?? 0;
    }
    case 'XP': {
      const profile = await db.studentProfile.findUnique({ where: { userId } });
      return profile?.totalXp ?? 0;
    }
    case 'EXERCISES':
      return db.exerciseAttempt.count({ where: { userId, isCorrect: true } });
    default:
      return 0;
  }
}

/**
 * Award every achievement the learner now qualifies for.
 *
 * Cheap enough to run after each activity: the metric queries are all indexed counts, and
 * already-awarded achievements are skipped by a unique constraint.
 */
export async function awardAchievements(userId: string): Promise<string[]> {
  const [achievements, held] = await Promise.all([
    db.achievement.findMany(),
    db.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
  ]);
  const heldIds = new Set(held.map((row) => row.achievementId));
  const pending = achievements.filter((a) => !heldIds.has(a.id));
  if (!pending.length) return [];

  const metrics = new Map<string, number>();
  const awarded: string[] = [];

  for (const achievement of pending) {
    if (!metrics.has(achievement.metric)) {
      metrics.set(achievement.metric, await metricValue(userId, achievement.metric));
    }
    if ((metrics.get(achievement.metric) ?? 0) >= achievement.threshold) {
      await db.userAchievement
        .create({ data: { userId, achievementId: achievement.id } })
        .then(() => awarded.push(achievement.code))
        .catch(() => undefined);
    }
  }
  return awarded;
}

// ---------------------------------------------------------------------------
// Course progress
// ---------------------------------------------------------------------------

/** Recompute an enrolment's percentage from completed lessons. */
export async function recalculateCourseProgress(userId: string, courseId: string): Promise<number> {
  const lessons = await db.lesson.findMany({
    where: { module: { courseId }, status: 'PUBLISHED' },
    select: { id: true },
  });
  if (!lessons.length) return 0;

  const completed = await db.lessonProgress.count({
    where: { userId, status: 'COMPLETED', lessonId: { in: lessons.map((l) => l.id) } },
  });
  const percent = Math.round((completed / lessons.length) * 100);

  await db.enrollment.updateMany({
    where: { userId, courseId },
    data: {
      progress: percent,
      status: percent >= 100 ? 'COMPLETED' : 'ACTIVE',
      completedAt: percent >= 100 ? new Date() : null,
    },
  });
  return percent;
}

// ---------------------------------------------------------------------------
// Dashboard summaries
// ---------------------------------------------------------------------------

export type StudySummary = {
  streak: number;
  longestStreak: number;
  xp: number;
  todayMinutes: number;
  todayGoal: number;
  goalMet: boolean;
  dueWords: number;
  wordsLearning: number;
  wordsMastered: number;
  lessonsCompleted: number;
  lastSevenDays: { day: string; minutes: number; xp: number }[];
};

export async function studySummary(userId: string): Promise<StudySummary> {
  const today = studyDay();
  const days: string[] = [today];
  for (let i = 1; i < 7; i += 1) days.push(previousDay(days[i - 1]));

  const [profile, todayRow, recent, dueWords, learning, mastered, lessons] = await Promise.all([
    db.studentProfile.findUnique({ where: { userId } }),
    db.studyDay.findUnique({ where: { userId_day: { userId, day: today } } }),
    db.studyDay.findMany({ where: { userId, day: { in: days } } }),
    db.vocabularyProgress.count({ where: { userId, dueAt: { lte: new Date() }, box: { lt: 6 } } }),
    db.vocabularyProgress.count({ where: { userId, box: { gt: 0, lt: 5 } } }),
    db.vocabularyProgress.count({ where: { userId, box: { gte: 5 } } }),
    db.lessonProgress.count({ where: { userId, status: 'COMPLETED' } }),
  ]);

  const byDay = new Map(recent.map((row) => [row.day, row]));
  const goal = profile?.dailyGoalMin ?? 15;
  const todayMinutes = todayRow?.minutes ?? 0;

  return {
    streak: profile?.streakCurrent ?? 0,
    longestStreak: profile?.streakLongest ?? 0,
    xp: profile?.totalXp ?? 0,
    todayMinutes,
    todayGoal: goal,
    goalMet: todayMinutes >= goal,
    dueWords,
    wordsLearning: learning,
    wordsMastered: mastered,
    lessonsCompleted: lessons,
    lastSevenDays: days
      .slice()
      .reverse()
      .map((day) => ({
        day,
        minutes: byDay.get(day)?.minutes ?? 0,
        xp: byDay.get(day)?.xp ?? 0,
      })),
  };
}
