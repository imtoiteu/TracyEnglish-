import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, TrendingUp } from 'lucide-react';

import { CEFR_LEVELS, SKILLS } from '@tracy/curriculum';
import { formatNumber, translate } from '@tracy/localization';
import { Card, Eyebrow, LevelBadge, ProgressBar, SectionHeading, Stat } from '@tracy/ui';

import { db } from '@/lib/db';
import { studySummary } from '@/lib/progress';
import { requireUser, resolveLocale } from '@/lib/session';

export const metadata: Metadata = { title: 'Tiến độ' };
export const dynamic = 'force-dynamic';

export default async function ProgressPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const user = await requireUser(locale, `/${locale}/dashboard/progress`);
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const [summary, attempts, wordsByLevel, enrollments, placements] = await Promise.all([
    studySummary(user.id),
    db.exerciseAttempt.findMany({
      where: { userId: user.id },
      select: { isCorrect: true, exercise: { select: { skill: true, cefr: true } } },
    }),
    db.vocabularyProgress.findMany({
      where: { userId: user.id },
      select: { box: true, vocabulary: { select: { cefr: true } } },
    }),
    db.enrollment.findMany({
      where: { userId: user.id },
      include: { course: { select: { titleVi: true, slug: true, cefrFrom: true, cefrTo: true } } },
    }),
    db.placementResult.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  // Accuracy per skill: the honest measure of where a learner is weak.
  const bySkill = SKILLS.map((skill) => {
    const rows = attempts.filter((row) => row.exercise.skill === skill);
    const correct = rows.filter((row) => row.isCorrect).length;
    return {
      skill,
      attempted: rows.length,
      correct,
      accuracy: rows.length ? Math.round((correct / rows.length) * 100) : 0,
    };
  }).filter((row) => row.attempted > 0);

  const byLevel = CEFR_LEVELS.map((level) => {
    const rows = wordsByLevel.filter((row) => row.vocabulary.cefr === level);
    return {
      level,
      tracked: rows.length,
      mastered: rows.filter((row) => row.box >= 5).length,
    };
  }).filter((row) => row.tracked > 0);

  const weakest = [...bySkill].sort((a, b) => a.accuracy - b.accuracy)[0];

  return (
    <div className="py-10">
      <div className="container-page">
        <Link href={href('/dashboard')} className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-500 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" />
          {t('nav.dashboard')}
        </Link>

        <Eyebrow className="mt-6">
          <TrendingUp className="h-3.5 w-3.5" />
          {t('nav.progress')}
        </Eyebrow>
        <h1 className="mt-4 text-4xl">Tiến độ của bạn</h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat accent="coral" value={summary.streak} label="ngày liên tiếp" />
          <Stat accent="sun" value={formatNumber(summary.xp, locale)} label={t('dash.xp')} />
          <Stat accent="teal" value={summary.wordsMastered} label={t('vocab.mastered')} />
          <Stat accent="brand" value={summary.lessonsCompleted} label={t('common.lessons')} />
        </div>

        {weakest ? (
          <Card className="mt-6 border-sun-200 bg-sun-50/60">
            <h2 className="text-lg">Phần bạn đang yếu nhất</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">
              Bạn trả lời đúng {weakest.accuracy}% ở phần <strong>{t(`skill.${weakest.skill}`)}</strong>{' '}
              ({weakest.correct}/{weakest.attempted} câu). Dành thêm thời gian cho phần này sẽ có tác
              động lớn hơn là học tiếp phần bạn đã làm tốt.
            </p>
          </Card>
        ) : null}

        <section className="mt-12">
          <SectionHeading eyebrow="Kỹ năng" title="Độ chính xác theo kỹ năng" />
          {bySkill.length ? (
            <div className="mt-6 space-y-4">
              {bySkill.map((row) => (
                <div key={row.skill}>
                  <ProgressBar
                    value={row.accuracy}
                    accent={row.accuracy >= 80 ? 'teal' : row.accuracy >= 60 ? 'brand' : 'sun'}
                    label={`${t(`skill.${row.skill}`)} — ${row.correct}/${row.attempted} câu`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-ink-500">
              Chưa có dữ liệu. Làm một vài bài tập để hệ thống bắt đầu đo.
            </p>
          )}
        </section>

        <section className="mt-12">
          <SectionHeading eyebrow={t('nav.vocabulary')} title="Từ vựng theo trình độ" accent="rose" />
          {byLevel.length ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {byLevel.map((row) => (
                <Card key={row.level}>
                  <div className="flex items-center justify-between">
                    <LevelBadge level={row.level} />
                    <span className="text-sm font-bold text-ink-500">
                      {row.mastered}/{row.tracked}
                    </span>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={(row.mastered / row.tracked) * 100} accent="rose" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-ink-500">Bạn chưa thêm từ nào vào danh sách ôn.</p>
          )}
        </section>

        <section className="mt-12">
          <SectionHeading eyebrow={t('dash.myCourses')} title="Khoá học" accent="teal" />
          <div className="mt-6 space-y-3">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Link href={href(`/courses/${enrollment.course.slug}`)} className="font-bold text-ink-900 hover:text-brand-700">
                    {enrollment.course.titleVi}
                  </Link>
                  <span className="text-sm font-bold text-ink-500">{enrollment.progress}%</span>
                </div>
                <div className="mt-3">
                  <ProgressBar value={enrollment.progress} accent="teal" />
                </div>
              </Card>
            ))}
            {!enrollments.length ? (
              <p className="text-sm text-ink-500">Bạn chưa ghi danh khoá nào.</p>
            ) : null}
          </div>
        </section>

        {placements.length ? (
          <section className="mt-12">
            <SectionHeading eyebrow={t('nav.placement')} title="Lịch sử kiểm tra trình độ" accent="coral" />
            <div className="mt-6 space-y-2">
              {placements.map((placement) => (
                <div key={placement.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-soft">
                  <span className="flex items-center gap-3">
                    <LevelBadge level={placement.cefr} />
                    <span className="text-sm text-ink-600">
                      {placement.score}/{placement.maxScore} câu đúng
                    </span>
                  </span>
                  <span className="text-xs text-ink-400">
                    {new Intl.DateTimeFormat('vi-VN').format(placement.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
