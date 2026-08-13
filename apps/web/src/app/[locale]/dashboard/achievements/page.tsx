import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Lock, Trophy } from 'lucide-react';

import { translate } from '@tracy/localization';
import { Card, Eyebrow, ProgressBar, accentStyles, cn } from '@tracy/ui';

import { db } from '@/lib/db';
import { requireUser, resolveLocale } from '@/lib/session';

export const metadata: Metadata = { title: 'Thành tích' };
export const dynamic = 'force-dynamic';

export default async function AchievementsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const user = await requireUser(locale, `/${locale}/dashboard/achievements`);
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const [achievements, held, profile, lessons, words, exercises] = await Promise.all([
    db.achievement.findMany({ orderBy: { displayOrder: 'asc' } }),
    db.userAchievement.findMany({ where: { userId: user.id } }),
    db.studentProfile.findUnique({ where: { userId: user.id } }),
    db.lessonProgress.count({ where: { userId: user.id, status: 'COMPLETED' } }),
    db.vocabularyProgress.count({ where: { userId: user.id, box: { gte: 5 } } }),
    db.exerciseAttempt.count({ where: { userId: user.id, isCorrect: true } }),
  ]);

  const heldIds = new Set(held.map((row) => row.achievementId));
  const value = (metric: string) => {
    switch (metric) {
      case 'LESSONS':
        return lessons;
      case 'WORDS':
        return words;
      case 'STREAK':
        return profile?.streakLongest ?? 0;
      case 'XP':
        return profile?.totalXp ?? 0;
      case 'EXERCISES':
        return exercises;
      default:
        return 0;
    }
  };

  return (
    <div className="py-10">
      <div className="container-page">
        <Link href={href('/dashboard')} className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-500 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" />
          {t('nav.dashboard')}
        </Link>

        <Eyebrow accent="sun" className="mt-6">
          <Trophy className="h-3.5 w-3.5" />
          {t('nav.achievements')}
        </Eyebrow>
        <h1 className="mt-4 text-4xl">Thành tích</h1>
        <p className="mt-2 text-sm text-ink-600">
          Đã mở {heldIds.size}/{achievements.length} thành tích.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((achievement) => {
            const unlocked = heldIds.has(achievement.id);
            const current = value(achievement.metric);
            const percent = Math.min(100, Math.round((current / achievement.threshold) * 100));
            const styles = accentStyles(achievement.accent);
            return (
              <Card
                key={achievement.id}
                className={cn('h-full', !unlocked && 'opacity-70')}
              >
                <span
                  className={cn(
                    'inline-flex h-12 w-12 items-center justify-center rounded-2xl',
                    unlocked ? cn(styles.bg, styles.text) : 'bg-ink-100 text-ink-400',
                  )}
                >
                  {unlocked ? <Trophy className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                </span>
                <h2 className="mt-3 text-base">{achievement.titleVi}</h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-600">
                  {achievement.descriptionVi}
                </p>
                {!unlocked ? (
                  <div className="mt-4">
                    <ProgressBar value={percent} accent={achievement.accent as never} />
                    <p className="mt-1.5 text-xs text-ink-500">
                      {current}/{achievement.threshold}
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-xs font-bold text-teal-700">Đã mở</p>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
