import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Flame,
  Headphones,
  Repeat,
  ScrollText,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';

import { formatNumber, translate } from '@tracy/localization';
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  LevelBadge,
  ProgressBar,
  ProgressRing,
  SectionHeading,
  Stat,
  cn,
} from '@tracy/ui';

import { db } from '@/lib/db';
import { studySummary } from '@/lib/progress';
import { requireUser, resolveLocale } from '@/lib/session';

export const metadata: Metadata = { title: 'Bảng học tập' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const user = await requireUser(locale, `/${locale}/dashboard`);
  const t = (key: string, values?: Record<string, string | number>) => translate(locale, key, values);
  const href = (path: string) => `/${locale}${path}`;

  const [summary, enrollments, recentAttempts, achievements, notifications, profile] =
    await Promise.all([
      studySummary(user.id),
      db.enrollment.findMany({
        where: { userId: user.id },
        orderBy: { startedAt: 'desc' },
        include: {
          course: {
            include: {
              modules: {
                orderBy: { displayOrder: 'asc' },
                include: {
                  lessons: { where: { status: 'PUBLISHED' }, orderBy: { displayOrder: 'asc' } },
                },
              },
            },
          },
        },
      }),
      db.exerciseAttempt.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          exercise: {
            select: {
              promptEn: true,
              skill: true,
              cefr: true,
              grammarTopic: { select: { slug: true, titleVi: true } },
              listening: { select: { slug: true, titleVi: true } },
              reading: { select: { slug: true, titleVi: true } },
            },
          },
        },
      }),
      db.userAchievement.findMany({
        where: { userId: user.id },
        orderBy: { awardedAt: 'desc' },
        take: 6,
        include: { achievement: true },
      }),
      db.notification.findMany({
        where: { userId: user.id, readAt: null },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      db.studentProfile.findUnique({ where: { userId: user.id } }),
    ]);

  const completedLessonIds = new Set(
    (
      await db.lessonProgress.findMany({
        where: { userId: user.id, status: 'COMPLETED' },
        select: { lessonId: true },
      })
    ).map((row) => row.lessonId),
  );

  // Recommendations, in priority order: due words, unfinished course, then level-matched
  // listening and reading. Nothing is recommended that the learner has already finished.
  const level = profile?.cefrLevel ?? 'A1';
  const [suggestedListening, suggestedReading, suggestedGrammar] = await Promise.all([
    db.listeningItem.findFirst({ where: { status: 'PUBLISHED', cefr: level }, orderBy: { displayOrder: 'asc' } }),
    db.readingItem.findFirst({ where: { status: 'PUBLISHED', cefr: level }, orderBy: { displayOrder: 'asc' } }),
    db.grammarTopic.findFirst({ where: { status: 'PUBLISHED', cefr: level }, orderBy: { displayOrder: 'asc' } }),
  ]);

  const inProgress = enrollments
    .map((enrollment) => {
      const lessons = enrollment.course.modules.flatMap((module) => module.lessons);
      const next = lessons.find((lesson) => !completedLessonIds.has(lesson.id));
      const done = lessons.filter((lesson) => completedLessonIds.has(lesson.id)).length;
      return {
        enrollment,
        lessons,
        next,
        done,
        percent: lessons.length ? Math.round((done / lessons.length) * 100) : 0,
      };
    })
    .sort((a, b) => b.percent - a.percent);

  const goalPercent = Math.min(100, Math.round((summary.todayMinutes / summary.todayGoal) * 100));
  const maxMinutes = Math.max(...summary.lastSevenDays.map((day) => day.minutes), 1);

  return (
    <div className="py-10">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl">{t('dash.welcome', { name: user.name.split(' ').slice(-1)[0] })}</h1>
            <p className="mt-2 text-sm text-ink-600">
              Trình độ hiện tại: <LevelBadge level={level} /> ·{' '}
              <Link href={href('/placement')} className="font-semibold text-brand-600 hover:underline">
                kiểm tra lại
              </Link>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={href('/vocabulary/review')} variant="secondary">
              <Repeat className="h-4 w-4" />
              {t('vocab.review')}
              {summary.dueWords ? ` (${summary.dueWords})` : ''}
            </ButtonLink>
            <ButtonLink href={href('/dashboard/progress')} variant="outline">
              {t('nav.progress')}
            </ButtonLink>
          </div>
        </div>

        {notifications.length ? (
          <div className="mt-6 space-y-2">
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                href={href(notification.href || '/dashboard')}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-brand-200 bg-brand-50 px-4 py-3 text-sm hover:border-brand-300"
              >
                <span>
                  <span className="font-bold text-ink-900">{notification.titleVi}</span>
                  {notification.bodyVi ? (
                    <span className="ml-2 text-ink-600">{notification.bodyVi}</span>
                  ) : null}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-brand-500" />
              </Link>
            ))}
          </div>
        ) : null}

        {/* -------------------------------------------------------------- today */}
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
          <Card className="flex items-center gap-5">
            <ProgressRing value={goalPercent} size={92} accent={summary.goalMet ? 'teal' : 'brand'}>
              <span className="text-center text-xs font-extrabold leading-tight">
                {summary.todayMinutes}
                <span className="block text-[0.65rem] font-semibold text-ink-400">phút</span>
              </span>
            </ProgressRing>
            <div>
              <h2 className="text-lg">{t('dash.today')}</h2>
              <p className="mt-1 text-sm text-ink-600">
                {summary.goalMet
                  ? t('dash.goalMet')
                  : `Còn ${Math.max(0, summary.todayGoal - summary.todayMinutes)} phút nữa là đạt mục tiêu.`}
              </p>
              <p className="mt-2 text-xs text-ink-400">
                {t('dash.goal')}: {summary.todayGoal} {t('common.minutes')}
              </p>
            </div>
          </Card>

          <Stat
            accent="coral"
            icon={<Flame className="h-5 w-5" />}
            value={summary.streak}
            label={t('dash.streakDays', { count: summary.streak })}
          />
          <Stat
            accent="sun"
            icon={<Zap className="h-5 w-5" />}
            value={formatNumber(summary.xp, locale)}
            label={t('dash.xp')}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat accent="rose" icon={<Repeat className="h-5 w-5" />} value={summary.dueWords} label={t('dash.dueWords')} />
          <Stat accent="brand" icon={<Sparkles className="h-5 w-5" />} value={summary.wordsLearning} label={t('vocab.learning')} />
          <Stat accent="teal" icon={<Trophy className="h-5 w-5" />} value={summary.wordsMastered} label={t('vocab.mastered')} />
          <Stat accent="sky" icon={<BookOpen className="h-5 w-5" />} value={summary.lessonsCompleted} label={t('common.lessons')} />
        </div>

        {/* ------------------------------------------------------------ courses */}
        <section className="mt-12">
          <SectionHeading
            eyebrow={t('dash.myCourses')}
            title={t('dash.continueLearning')}
            action={
              <ButtonLink href={href('/courses')} variant="outline" size="sm">
                {t('action.viewAll')}
              </ButtonLink>
            }
          />

          {inProgress.length ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {inProgress.map(({ enrollment, next, done, lessons, percent }) => (
                <Card key={enrollment.id} className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg leading-snug">
                      <Link href={href(`/courses/${enrollment.course.slug}`)} className="hover:text-brand-700">
                        {enrollment.course.titleVi}
                      </Link>
                    </h3>
                    <Badge accent={percent >= 100 ? 'teal' : 'brand'}>{percent}%</Badge>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={percent} accent={percent >= 100 ? 'teal' : 'brand'} />
                    <p className="mt-1.5 text-xs text-ink-500">
                      {done}/{lessons.length} bài đã hoàn thành
                    </p>
                  </div>
                  <div className="mt-auto pt-4">
                    {next ? (
                      <ButtonLink href={href(`/lessons/${next.slug}`)} size="sm" className="w-full">
                        {t('action.continue')}: {next.titleVi.slice(0, 40)}
                      </ButtonLink>
                    ) : (
                      <p className="rounded-2xl bg-teal-50 px-3 py-2 text-center text-sm font-bold text-teal-800">
                        Đã hoàn thành khoá này
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState
                title={t('dash.noCourses')}
                description="Chọn một lộ trình để hệ thống bắt đầu theo dõi tiến độ của bạn."
                action={<ButtonLink href={href('/courses')}>{t('nav.courses')}</ButtonLink>}
              />
            </div>
          )}
        </section>

        {/* -------------------------------------------------------- suggestions */}
        <section className="mt-12">
          <SectionHeading eyebrow="Gợi ý" title={t('dash.recommended')} accent="coral" />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {summary.dueWords > 0 ? (
              <Link href={href('/vocabulary/review')}>
                <Card interactive className="h-full">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                    <Repeat className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 text-base">Ôn {summary.dueWords} từ đến hạn</h3>
                  <p className="mt-1 text-sm text-ink-600">
                    Ôn đúng lúc sắp quên là cách rẻ nhất để giữ từ vựng.
                  </p>
                </Card>
              </Link>
            ) : null}
            {suggestedGrammar ? (
              <Link href={href(`/grammar/${suggestedGrammar.slug}`)}>
                <Card interactive className="h-full">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                    <ScrollText className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 text-base">{suggestedGrammar.titleVi}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-600">{suggestedGrammar.summaryVi}</p>
                </Card>
              </Link>
            ) : null}
            {suggestedListening ? (
              <Link href={href(`/listening/${suggestedListening.slug}`)}>
                <Card interactive className="h-full">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                    <Headphones className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 line-clamp-2 text-base">{suggestedListening.titleVi}</h3>
                  <p className="mt-1 text-sm text-ink-600">Bài nghe đúng trình độ {level} của bạn.</p>
                </Card>
              </Link>
            ) : null}
            {suggestedReading ? (
              <Link href={href(`/reading/${suggestedReading.slug}`)}>
                <Card interactive className="h-full">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 line-clamp-2 text-base">{suggestedReading.titleVi}</h3>
                  <p className="mt-1 text-sm text-ink-600">
                    {suggestedReading.wordCount} từ · {suggestedReading.readingMinutes} phút đọc
                  </p>
                </Card>
              </Link>
            ) : null}
          </div>
        </section>

        {/* ------------------------------------------------------------ 7 days */}
        <section className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card>
            <h2 className="text-xl">Bảy ngày gần đây</h2>
            <div className="mt-6 flex h-40 items-end justify-between gap-2">
              {summary.lastSevenDays.map((day) => (
                <div key={day.day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className={cn(
                        'w-full rounded-t-xl transition-all',
                        day.minutes >= summary.todayGoal ? 'bg-teal-400' : day.minutes ? 'bg-brand-300' : 'bg-ink-100',
                      )}
                      style={{ height: `${Math.max(4, (day.minutes / maxMinutes) * 100)}%` }}
                      title={`${day.minutes} phút`}
                    />
                  </div>
                  <span className="text-[0.65rem] font-bold text-ink-400">{day.day.slice(8)}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-ink-500">
              Cột xanh lá là ngày đạt mục tiêu {summary.todayGoal} phút. Chuỗi dài nhất của bạn:{' '}
              {summary.longestStreak} ngày.
            </p>
          </Card>

          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between">
                <h2 className="text-xl">{t('nav.achievements')}</h2>
                <Link href={href('/dashboard/achievements')} className="text-sm font-bold text-brand-600 hover:underline">
                  {t('action.viewAll')}
                </Link>
              </div>
              {achievements.length ? (
                <ul className="mt-4 space-y-2">
                  {achievements.map((row) => (
                    <li key={row.id} className="flex items-center gap-3 rounded-2xl bg-sun-50 px-3 py-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sun-400 text-white">
                        <Trophy className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-ink-900">
                          {row.achievement.titleVi}
                        </span>
                        <span className="block truncate text-xs text-ink-500">
                          {row.achievement.descriptionVi}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-ink-500">
                  Chưa có thành tích nào. Hoàn thành bài học đầu tiên để mở thành tích đầu tiên.
                </p>
              )}
            </Card>

            <Card>
              <h2 className="text-xl">{t('dash.recentActivity')}</h2>
              {recentAttempts.length ? (
                <ul className="mt-4 space-y-2">
                  {recentAttempts.map((attempt) => {
                    const target =
                      attempt.exercise.grammarTopic ??
                      attempt.exercise.listening ??
                      attempt.exercise.reading;
                    return (
                      <li key={attempt.id} className="flex items-start gap-2 text-sm">
                        <span
                          className={cn(
                            'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                            attempt.isCorrect ? 'bg-teal-500' : 'bg-rose-400',
                          )}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-ink-700">
                            {target?.titleVi ?? attempt.exercise.promptEn.slice(0, 60)}
                          </span>
                          <span className="text-xs text-ink-400">
                            {t(`skill.${attempt.exercise.skill}`)} · {attempt.exercise.cefr}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-ink-500">Chưa có hoạt động nào.</p>
              )}
            </Card>
          </div>
        </section>

        <div className="mt-12 grid gap-3 sm:grid-cols-3">
          <ButtonLink href={href('/dashboard/vocabulary')} variant="outline">
            <Sparkles className="h-4 w-4" />
            Từ vựng của tôi
          </ButtonLink>
          <ButtonLink href={href('/dashboard/bookmarks')} variant="outline">
            <BookOpen className="h-4 w-4" />
            {t('nav.bookmarks')}
          </ButtonLink>
          <ButtonLink href={href('/dashboard/progress')} variant="outline">
            <Target className="h-4 w-4" />
            {t('nav.progress')}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
