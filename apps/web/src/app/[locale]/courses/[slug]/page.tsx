import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  Headphones,
  Layers,
  ListChecks,
  Lock,
  PlayCircle,
  ScrollText,
  Sparkles,
  Users,
} from 'lucide-react';

import { formatPrice, pick, translate } from '@tracy/localization';
import { Badge, ButtonLink, Card, LevelBadge, ProgressBar, cn } from '@tracy/ui';

import { EnrollButton } from '@/components/learn/enroll-button';
import { db } from '@/lib/db';
import { parseArray } from '@/lib/json';
import { getCurrentUser, resolveLocale } from '@/lib/session';

export const dynamic = 'force-dynamic';

const KIND_ICON: Record<string, typeof ScrollText> = {
  GRAMMAR: ScrollText,
  VOCABULARY: Sparkles,
  LISTENING: Headphones,
  READING: ListChecks,
  REVIEW: Layers,
  ASSESSMENT: CheckCircle2,
  PRONUNCIATION: PlayCircle,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await db.course.findUnique({ where: { slug } });
  if (!course) return { title: 'Khoá học' };
  return { title: course.titleVi, description: course.descriptionVi.slice(0, 160) };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const resolved = await params;
  const locale = await resolveLocale(params);
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const course = await db.course.findUnique({
    where: { slug: resolved.slug },
    include: {
      track: true,
      teacher: { include: { user: { select: { name: true } } } },
      modules: {
        where: { status: 'PUBLISHED' },
        orderBy: { displayOrder: 'asc' },
        include: {
          lessons: {
            where: { status: 'PUBLISHED' },
            orderBy: { displayOrder: 'asc' },
            select: {
              id: true,
              slug: true,
              titleVi: true,
              titleEn: true,
              kind: true,
              cefr: true,
              estimatedMinutes: true,
              objectiveVi: true,
            },
          },
        },
      },
      classGroups: {
        where: { status: { in: ['OPEN', 'RUNNING'] } },
        include: { teacher: { include: { user: { select: { name: true } } } } },
      },
    },
  });
  if (!course || course.status !== 'PUBLISHED') notFound();

  const user = await getCurrentUser();
  const [enrollment, completed] = await Promise.all([
    user
      ? db.enrollment.findUnique({
          where: { userId_courseId: { userId: user.id, courseId: course.id } },
        })
      : Promise.resolve(null),
    user
      ? db.lessonProgress.findMany({
          where: { userId: user.id, status: 'COMPLETED' },
          select: { lessonId: true },
        })
      : Promise.resolve([]),
  ]);
  const completedIds = new Set(completed.map((row) => row.lessonId));

  const outcomes = parseArray<string>(course.outcomesVi);
  const requirements = parseArray<string>(course.requirementsVi);
  const skills = parseArray<string>(course.skills);
  const modes = parseArray<string>(course.deliveryModes);
  const audience = parseArray<string>(course.audience);
  const allLessons = course.modules.flatMap((module) => module.lessons);
  const doneCount = allLessons.filter((lesson) => completedIds.has(lesson.id)).length;
  const percent = allLessons.length ? Math.round((doneCount / allLessons.length) * 100) : 0;
  const nextLesson = allLessons.find((lesson) => !completedIds.has(lesson.id)) ?? allLessons[0];

  return (
    <div className="py-10">
      <div className="container-page">
        <Link
          href={href('/courses')}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-500 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('nav.courses')}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="space-y-8">
            <header>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
                {pick(locale, course.track.titleVi, course.track.titleEn)}
              </p>
              <h1 className="mt-2 text-3xl sm:text-4xl">{pick(locale, course.titleVi, course.titleEn)}</h1>
              {course.subtitleVi ? (
                <p className="mt-2 text-lg text-ink-600">{course.subtitleVi}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <LevelBadge level={course.cefrFrom} />
                <span className="text-ink-300">→</span>
                <LevelBadge level={course.cefrTo} />
                {skills.map((skill) => (
                  <Badge key={skill} accent="ink">
                    {t(`skill.${skill}`)}
                  </Badge>
                ))}
              </div>

              <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-700">
                {pick(locale, course.descriptionVi, course.descriptionEn)}
              </p>
            </header>

            {outcomes.length ? (
              <Card className="border-teal-200 bg-teal-50/50">
                <h2 className="text-xl">Sau khoá học bạn sẽ làm được</h2>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {outcomes.map((outcome) => (
                    <li key={outcome} className="flex items-start gap-2 text-sm leading-relaxed text-ink-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                      {outcome}
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {/* -------------------------------------------------------- syllabus */}
            <div>
              <h2 className="text-2xl">Nội dung khoá học</h2>
              <p className="mt-1 text-sm text-ink-500">
                {course.modules.length} chương · {allLessons.length} bài học ·{' '}
                {course.estimatedHours} giờ
              </p>

              <div className="mt-6 space-y-4">
                {course.modules.map((module, moduleIndex) => (
                  <Card key={module.id} className="p-0">
                    <div className="border-b-2 border-ink-100 p-5">
                      <p className="text-xs font-bold uppercase tracking-widest text-ink-400">
                        Chương {moduleIndex + 1}
                      </p>
                      <h3 className="mt-1 text-lg">{pick(locale, module.titleVi, module.titleEn)}</h3>
                      {module.summaryVi ? (
                        <p className="mt-1 text-sm text-ink-600">{module.summaryVi}</p>
                      ) : null}
                    </div>
                    <ul className="divide-y divide-ink-100">
                      {module.lessons.map((lesson, lessonIndex) => {
                        const Icon = KIND_ICON[lesson.kind] ?? ScrollText;
                        const isDone = completedIds.has(lesson.id);
                        return (
                          <li key={lesson.id}>
                            <Link
                              href={href(`/lessons/${lesson.slug}`)}
                              className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-brand-50"
                            >
                              <span
                                className={cn(
                                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                                  isDone ? 'bg-teal-100 text-teal-600' : 'bg-ink-100 text-ink-500',
                                )}
                              >
                                {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-[0.95rem] font-bold text-ink-900">
                                  {lessonIndex + 1}. {pick(locale, lesson.titleVi, lesson.titleEn)}
                                </p>
                                <p className="mt-0.5 line-clamp-2 text-sm text-ink-500">
                                  {lesson.objectiveVi}
                                </p>
                              </div>
                              <span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-ink-400">
                                <LevelBadge level={lesson.cefr} />
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {lesson.estimatedMinutes}′
                                </span>
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                      {!module.lessons.length ? (
                        <li className="px-5 py-6 text-sm text-ink-400">
                          Chương này đang được biên soạn.
                        </li>
                      ) : null}
                    </ul>
                  </Card>
                ))}
              </div>
            </div>

            {/* --------------------------------------------------------- classes */}
            {course.classGroups.length ? (
              <div>
                <h2 className="text-2xl">Lớp đang mở cho khoá này</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {course.classGroups.map((group) => (
                    <Card key={group.id}>
                      <div className="flex items-center justify-between gap-2">
                        <Badge accent="brand">{t(`mode.${group.mode}`)}</Badge>
                        <Badge accent={group.status === 'OPEN' ? 'teal' : 'sun'}>
                          {group.enrolled}/{group.capacity}
                        </Badge>
                      </div>
                      <p className="mt-3 font-bold text-ink-900">{group.code}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-600">
                        <CalendarDays className="h-4 w-4" />
                        {group.scheduleVi}
                      </p>
                      {group.teacher ? (
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-600">
                          <GraduationCap className="h-4 w-4" />
                          {group.teacher.user.name}
                        </p>
                      ) : null}
                      <p className="mt-3 font-extrabold text-coral-600">
                        {formatPrice(group.priceVnd, locale)}
                      </p>
                      <ButtonLink href={href(`/contact?course=${course.slug}`)} size="sm" className="mt-3 w-full">
                        {t('action.consult')}
                      </ButtonLink>
                    </Card>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* -------------------------------------------------------------- aside */}
          <aside className="space-y-5 lg:sticky lg:top-24">
            <Card>
              <p className="text-3xl font-extrabold text-ink-900">
                {formatPrice(course.priceVnd, locale)}
              </p>
              {course.isFree ? (
                <p className="mt-1 text-sm text-teal-700">
                  Toàn bộ nội dung tự học của khoá này mở miễn phí.
                </p>
              ) : (
                <p className="mt-1 text-sm text-ink-500">
                  Học phí cho lớp có giáo viên. Phần tự học vẫn mở miễn phí.
                </p>
              )}

              {enrollment ? (
                <div className="mt-5">
                  <ProgressBar value={percent} accent="teal" label={t('nav.progress')} />
                  <p className="mt-2 text-xs text-ink-500">
                    {doneCount}/{allLessons.length} bài đã hoàn thành
                  </p>
                </div>
              ) : null}

              <div className="mt-5 space-y-2">
                {nextLesson ? (
                  <ButtonLink href={href(`/lessons/${nextLesson.slug}`)} size="lg" className="w-full">
                    <PlayCircle className="h-4 w-4" />
                    {enrollment ? t('action.continue') : t('action.start')}
                  </ButtonLink>
                ) : null}
                <EnrollButton
                  courseId={course.id}
                  courseSlug={course.slug}
                  signedIn={Boolean(user)}
                  enrolled={Boolean(enrollment)}
                />
                <ButtonLink
                  href={href(`/contact?course=${course.slug}`)}
                  variant="outline"
                  className="w-full"
                >
                  {t('action.consult')}
                </ButtonLink>
              </div>
            </Card>

            <Card>
              <h2 className="text-base">Khoá học này gồm</h2>
              <ul className="mt-3 space-y-2 text-sm text-ink-600">
                <li className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-brand-500" />
                  {course.modules.length} chương, {allLessons.length} bài học
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand-500" />
                  Khoảng {course.estimatedHours} giờ học
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-500" />
                  {modes.map((mode) => t(`mode.${mode}`)).join(' · ')}
                </li>
                {course.teacher ? (
                  <li className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-brand-500" />
                    Phụ trách: {course.teacher.user.name}
                  </li>
                ) : null}
              </ul>
            </Card>

            {requirements.length ? (
              <Card>
                <h2 className="text-base">Yêu cầu đầu vào</h2>
                <ul className="mt-3 space-y-2 text-sm text-ink-600">
                  {requirements.map((requirement) => (
                    <li key={requirement} className="flex items-start gap-2">
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
                      {requirement}
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {audience.length ? (
              <Card>
                <h2 className="text-base">Dành cho</h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {audience.map((segment) => (
                    <Badge key={segment} accent="coral">
                      {t(`segment.${segment}`)}
                    </Badge>
                  ))}
                </div>
              </Card>
            ) : null}

            {course.teacher ? (
              <Card>
                <h2 className="text-base">Giáo viên phụ trách</h2>
                <Link
                  href={href(`/teachers/${course.teacher.slug}`)}
                  className="mt-3 flex items-center gap-3 rounded-2xl p-2 hover:bg-brand-50"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-blob bg-gradient-to-br from-brand-400 to-coral-400 font-display text-lg font-extrabold text-white">
                    {course.teacher.user.name.split(' ').slice(-1)[0].slice(0, 1)}
                  </span>
                  <span>
                    <span className="block font-bold text-ink-900">{course.teacher.user.name}</span>
                    <span className="block text-xs text-ink-500">{course.teacher.headlineVi}</span>
                  </span>
                </Link>
              </Card>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
