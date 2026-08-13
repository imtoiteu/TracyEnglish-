import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Headphones,
  Info,
  Lightbulb,
  ListChecks,
  Sparkles,
  Target,
} from 'lucide-react';

import { LESSON_STAGES } from '@tracy/curriculum';
import { pick, translate } from '@tracy/localization';
import { Badge, ButtonLink, Card, LevelBadge, cn } from '@tracy/ui';

import { LessonAudioPlayer } from '@/components/learn/audio';
import { CompleteLessonButton } from '@/components/learn/complete-lesson';
import { ExercisePlayer } from '@/components/learn/exercise-player';
import { Prose } from '@/components/learn/prose';
import { ReadingPassage } from '@/components/learn/reading-passage';
import { Transcript } from '@/components/learn/transcript';
import { VocabularyCard } from '@/components/learn/vocabulary-card';
import type {
  GrammarTopic,
  Lesson,
  ListeningItem,
  ReadingItem,
  VocabularyItem,
  VocabularyList,
  VocabularyListItem,
} from '@prisma/client';

import { db } from '@/lib/db';
import { toClientExercises } from '@/lib/exercises';
import { parseArray, parseJson } from '@/lib/json';
import type { LessonBlock } from '@/lib/lesson-blocks';
import { getCurrentUser, resolveLocale } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lesson = await db.lesson.findUnique({ where: { slug } });
  return { title: lesson?.titleVi ?? 'Bài học', description: lesson?.objectiveVi };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const resolved = await params;
  const locale = await resolveLocale(params);
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const lesson = await db.lesson.findUnique({
    where: { slug: resolved.slug },
    include: {
      module: { include: { course: { include: { track: true } } } },
      exercises: { where: { status: 'PUBLISHED' }, orderBy: { displayOrder: 'asc' } },
      grammarTopic: true,
      listening: true,
      reading: true,
      vocabularyList: {
        include: {
          items: {
            orderBy: { displayOrder: 'asc' },
            take: 24,
            include: { vocabulary: true },
          },
          exercises: { where: { status: 'PUBLISHED' }, orderBy: { displayOrder: 'asc' }, take: 10 },
        },
      },
    },
  });
  if (!lesson || lesson.status !== 'PUBLISHED') notFound();

  const user = await getCurrentUser();
  const [progress, siblings] = await Promise.all([
    user
      ? db.lessonProgress.findUnique({
          where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
        })
      : Promise.resolve(null),
    db.lesson.findMany({
      where: { module: { courseId: lesson.module.courseId }, status: 'PUBLISHED' },
      orderBy: [{ module: { displayOrder: 'asc' } }, { displayOrder: 'asc' }],
      select: { id: true, slug: true, titleVi: true },
    }),
  ]);

  const position = siblings.findIndex((row) => row.id === lesson.id);
  const previous = position > 0 ? siblings[position - 1] : null;
  const next = position >= 0 && position < siblings.length - 1 ? siblings[position + 1] : null;

  const blocks = parseJson<LessonBlock[]>(lesson.blocks, []);
  // The lesson's own exercises, or — for a lesson built around a word list — that list's.
  const exercises = toClientExercises(
    lesson.exercises.length
      ? lesson.exercises
      : lesson.grammarTopic
        ? await db.exercise.findMany({
            where: { grammarTopicId: lesson.grammarTopic.id, status: 'PUBLISHED' },
            orderBy: { displayOrder: 'asc' },
          })
        : lesson.listening
          ? await db.exercise.findMany({
              where: { listeningId: lesson.listening.id, status: 'PUBLISHED' },
              orderBy: { displayOrder: 'asc' },
            })
          : lesson.reading
            ? await db.exercise.findMany({
                where: { readingId: lesson.reading.id, status: 'PUBLISHED' },
                orderBy: { displayOrder: 'asc' },
              })
            : (lesson.vocabularyList?.exercises ?? []),
  );

  return (
    <div className="py-8">
      <div className="container-page">
        {/* ------------------------------------------------------- breadcrumbs */}
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-ink-500" aria-label="Đường dẫn">
          <Link href={href('/courses')} className="font-semibold hover:text-brand-700">
            {t('nav.courses')}
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={href(`/courses/${lesson.module.course.slug}`)}
            className="font-semibold hover:text-brand-700"
          >
            {lesson.module.course.titleVi}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="truncate">{lesson.module.titleVi}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.65fr_1fr] lg:items-start">
          <article className="space-y-8">
            <header>
              <div className="flex flex-wrap items-center gap-2">
                <LevelBadge level={lesson.cefr} />
                <Badge accent="ink">{lesson.kind}</Badge>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500">
                  <Clock className="h-3.5 w-3.5" />
                  {lesson.estimatedMinutes} {t('common.minutes')}
                </span>
                {progress?.status === 'COMPLETED' ? (
                  <Badge accent="teal">
                    <CheckCircle2 className="h-3 w-3" />
                    {t('lesson.completed')}
                  </Badge>
                ) : null}
              </div>
              <h1 className="mt-4 text-3xl sm:text-4xl">
                {pick(locale, lesson.titleVi, lesson.titleEn)}
              </h1>
            </header>

            {blocks.map((block, index) => (
              <BlockRenderer
                key={index}
                block={block}
                lesson={lesson}
                exercises={exercises}
                locale={locale}
                href={href}
                t={t}
              />
            ))}

            {/* Fallback: a lesson with no blocks still shows its objective and practice. */}
            {!blocks.length ? (
              <>
                <ObjectiveBlock vi={lesson.objectiveVi} t={t} />
                {exercises.length ? (
                  <PracticeBlock exercises={exercises} title={lesson.titleVi} t={t} />
                ) : null}
              </>
            ) : null}

            {/* ---------------------------------------------------- completion */}
            <Card className="border-teal-200 bg-teal-50/60">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg">{t('lesson.markComplete')}</h2>
                  <p className="mt-1 text-sm text-ink-600">
                    Đánh dấu khi bạn đã làm hết phần luyện tập — tiến độ khoá học sẽ cập nhật theo.
                  </p>
                </div>
                <CompleteLessonButton
                  lessonId={lesson.id}
                  courseSlug={lesson.module.course.slug}
                  signedIn={Boolean(user)}
                  completed={progress?.status === 'COMPLETED'}
                  nextHref={next ? `/lessons/${next.slug}` : `/courses/${lesson.module.course.slug}`}
                />
              </div>
            </Card>

            <nav className="grid gap-3 sm:grid-cols-2" aria-label="Bài khác">
              {previous ? (
                <Link
                  href={href(`/lessons/${previous.slug}`)}
                  className="flex items-center gap-2 rounded-2xl border-2 border-ink-200 bg-white px-4 py-3 text-sm font-bold text-ink-700 hover:border-brand-300"
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" />
                  <span className="truncate">{previous.titleVi}</span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  href={href(`/lessons/${next.slug}`)}
                  className="flex items-center justify-end gap-2 rounded-2xl border-2 border-ink-200 bg-white px-4 py-3 text-sm font-bold text-ink-700 hover:border-brand-300"
                >
                  <span className="truncate">{next.titleVi}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              ) : null}
            </nav>
          </article>

          {/* ------------------------------------------------------------- aside */}
          <aside className="space-y-5 lg:sticky lg:top-24">
            <Card>
              <h2 className="text-base">Bài học này gồm</h2>
              <ol className="mt-3 space-y-1.5 text-sm">
                {LESSON_STAGES.map((stage) => {
                  const present =
                    stage.key === 'objective' ||
                    stage.key === 'practice' ||
                    blocks.some((block) =>
                      stage.key === 'explanation'
                        ? block.type === 'prose' || block.type === 'grammar'
                        : stage.key === 'examples'
                          ? block.type === 'examples' || block.type === 'table'
                          : stage.key === 'summary'
                            ? block.type === 'summary'
                            : stage.key === 'nextStep'
                              ? block.type === 'nextStep'
                              : false,
                    );
                  return (
                    <li
                      key={stage.key}
                      className={cn('flex items-center gap-2', present ? 'text-ink-700' : 'text-ink-300')}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      {pick(locale, stage.titleVi, stage.titleEn)}
                    </li>
                  );
                })}
              </ol>
            </Card>

            <Card>
              <h2 className="text-base">Trong khoá</h2>
              <p className="mt-1 text-xs text-ink-500">{lesson.module.course.titleVi}</p>
              <ol className="mt-3 max-h-80 space-y-1 overflow-y-auto pr-1 text-sm">
                {siblings.map((row, index) => (
                  <li key={row.id}>
                    <Link
                      href={href(`/lessons/${row.slug}`)}
                      className={cn(
                        'block truncate rounded-xl px-2.5 py-1.5',
                        row.id === lesson.id
                          ? 'bg-brand-100 font-bold text-brand-800'
                          : 'text-ink-600 hover:bg-ink-50',
                      )}
                    >
                      {index + 1}. {row.titleVi}
                    </Link>
                  </li>
                ))}
              </ol>
              <ButtonLink
                href={href(`/courses/${lesson.module.course.slug}`)}
                variant="outline"
                size="sm"
                className="mt-4 w-full"
              >
                {t('action.viewCourse')}
              </ButtonLink>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

function ObjectiveBlock({ vi, en, t }: { vi: string; en?: string; t: (key: string) => string }) {
  return (
    <Card className="border-brand-200 bg-brand-50">
      <h2 className="flex items-center gap-2 text-lg">
        <Target className="h-5 w-5 text-brand-600" />
        {t('lesson.objective')}
      </h2>
      <p className="mt-2 text-[1.0625rem] leading-relaxed text-ink-800">{vi}</p>
      {en ? <p className="mt-1 text-sm italic text-ink-500">{en}</p> : null}
    </Card>
  );
}

function PracticeBlock({
  exercises,
  title,
  introVi,
  t,
}: {
  exercises: ReturnType<typeof toClientExercises>;
  title: string;
  introVi?: string;
  t: (key: string) => string;
}) {
  return (
    <section id="practice">
      <h2 className="flex items-center gap-2 text-2xl">
        <ListChecks className="h-6 w-6 text-coral-500" />
        {t('lesson.practice')}
      </h2>
      {introVi ? <p className="mt-2 text-sm leading-relaxed text-ink-600">{introVi}</p> : null}
      <div className="mt-5">
        <ExercisePlayer exercises={exercises} contextLabel={title} />
      </div>
    </section>
  );
}

/**
 * The subset of a lesson a block renderer needs: the lesson's own fields plus whichever
 * piece of ingested content it was built around.
 */
type LessonWithContent = Lesson & {
  grammarTopic: GrammarTopic | null;
  listening: ListeningItem | null;
  reading: ReadingItem | null;
  vocabularyList:
    | (VocabularyList & { items: (VocabularyListItem & { vocabulary: VocabularyItem })[] })
    | null;
};

type BlockProps = {
  block: LessonBlock;
  lesson: LessonWithContent;
  exercises: ReturnType<typeof toClientExercises>;
  locale: 'vi' | 'en';
  href: (path: string) => string;
  t: (key: string) => string;
};

function BlockRenderer({ block, lesson, exercises, locale, href, t }: BlockProps) {
  switch (block.type) {
    case 'objective':
      return <ObjectiveBlock vi={block.vi} en={block.en} t={t} />;

    case 'prose':
      return (
        <section>
          <Prose text={block.vi} />
        </section>
      );

    case 'tip':
      return (
        <Card
          className={cn(
            block.tone === 'warning'
              ? 'border-rose-200 bg-rose-50/60'
              : block.tone === 'note'
                ? 'border-ink-200 bg-ink-50'
                : 'border-sun-200 bg-sun-50/60',
          )}
        >
          <h3 className="flex items-center gap-2 text-base">
            {block.tone === 'warning' ? (
              <Info className="h-4 w-4 text-rose-600" />
            ) : (
              <Lightbulb className="h-4 w-4 text-sun-600" />
            )}
            {block.titleVi ?? 'Ghi chú'}
          </h3>
          <div className="mt-2">
            <Prose text={block.vi} compact />
          </div>
        </Card>
      );

    case 'examples':
      return (
        <Card>
          <h3 className="text-lg">{block.titleVi ?? t('lesson.examples')}</h3>
          <ul className="mt-4 space-y-3">
            {block.items.map((item, index) => (
              <li key={index} className="rounded-2xl bg-ink-50 p-4">
                <p className="text-[0.95rem] font-semibold text-ink-900">{item.en}</p>
                <p className="mt-1 text-sm text-teal-800">{item.vi}</p>
                {item.note ? <p className="mt-1 text-xs text-ink-500">{item.note}</p> : null}
              </li>
            ))}
          </ul>
        </Card>
      );

    case 'table':
      return (
        <Card>
          {block.titleVi ? <h3 className="text-lg">{block.titleVi}</h3> : null}
          <div className="scroll-x mt-4">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead>
                <tr className="border-b-2 border-ink-100">
                  {block.headers.map((header) => (
                    <th key={header} scope="col" className="pb-2 pr-4 font-bold text-ink-500">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {block.rows.map((row, index) => (
                  <tr key={index}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="py-2.5 pr-4 text-ink-800">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      );

    case 'grammar': {
      const topic = lesson.grammarTopic;
      if (!topic) return null;
      const patterns = parseArray<{ form: string; example: string; vi: string }>(topic.patterns);
      const pitfalls = parseArray<string>(topic.pitfallsVi);
      const tips = parseArray<string>(topic.tipsVi);
      const sections = block.sections ?? ['theory', 'patterns', 'pitfalls', 'tips'];
      return (
        <section className="space-y-5">
          {sections.includes('theory') ? (
            <Card>
              <h2 className="flex items-center gap-2 text-xl">
                <BookOpen className="h-5 w-5 text-brand-600" />
                {t('lesson.explanation')}
              </h2>
              <div className="mt-4">
                <Prose text={topic.theoryVi} />
              </div>
            </Card>
          ) : null}

          {sections.includes('patterns') && patterns.length ? (
            <Card>
              <h3 className="text-lg">{t('grammar.patterns')}</h3>
              <div className="scroll-x mt-4">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <tbody className="divide-y divide-ink-100">
                    {patterns.map((pattern, index) => (
                      <tr key={index}>
                        <td className="py-2.5 pr-4 font-mono text-xs font-bold text-brand-700">
                          {pattern.form}
                        </td>
                        <td className="py-2.5 pr-4 font-semibold text-ink-900">{pattern.example}</td>
                        <td className="py-2.5 text-ink-600">{pattern.vi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}

          {sections.includes('pitfalls') && pitfalls.length ? (
            <Card className="border-rose-200 bg-rose-50/50">
              <h3 className="text-lg">{t('grammar.pitfalls')}</h3>
              <ul className="mt-3 space-y-2">
                {pitfalls.map((pitfall, index) => (
                  <li key={index} className="rounded-2xl bg-white p-3">
                    <Prose text={pitfall} compact />
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {sections.includes('tips') && tips.length ? (
            <Card className="border-sun-200 bg-sun-50/60">
              <h3 className="text-lg">{t('grammar.tips')}</h3>
              <ul className="mt-3 space-y-2">
                {tips.map((tip, index) => (
                  <li key={index}>
                    <Prose text={tip} compact />
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <p className="text-sm">
            <Link href={href(`/grammar/${topic.slug}`)} className="font-bold text-brand-600 hover:underline">
              Xem đầy đủ chủ điểm “{topic.titleVi}” →
            </Link>
          </p>
        </section>
      );
    }

    case 'vocabList': {
      const list = lesson.vocabularyList;
      if (!list) return null;
      return (
        <section>
          <h2 className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-rose-500" />
            {block.titleVi ?? list.titleVi}
          </h2>
          <p className="mt-2 text-sm text-ink-600">{list.summaryVi}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {list.items.slice(0, block.limit ?? 12).map((item) => (
              <VocabularyCard
                key={item.id}
                compact
                item={{
                  word: item.vocabulary.word,
                  cefr: item.vocabulary.cefr,
                  ipaUk: item.vocabulary.ipaUk,
                  ipaUs: item.vocabulary.ipaUs,
                  audioPath: item.vocabulary.audioPath,
                  audioCredit: item.vocabulary.audioCredit,
                  meaningVi: item.vocabulary.meaningVi,
                  partsOfSpeech: parseArray<string>(item.vocabulary.partsOfSpeech),
                }}
              />
            ))}
          </div>
          <p className="mt-4 text-sm">
            <Link
              href={href(`/vocabulary/lists/${list.slug}`)}
              className="font-bold text-brand-600 hover:underline"
            >
              Xem toàn bộ danh sách →
            </Link>
          </p>
        </section>
      );
    }

    case 'listening': {
      const item = lesson.listening;
      if (!item) return null;
      const transcript = parseArray<string>(item.transcript);
      const glossary = parseArray<{ word: string; pos: string; definition: string }>(item.glossary);
      return (
        <section className="space-y-5">
          <h2 className="flex items-center gap-2 text-2xl">
            <Headphones className="h-6 w-6 text-sky-500" />
            {item.titleVi}
          </h2>
          {block.taskVi ? (
            <p className="rounded-2xl bg-sky-50 px-4 py-3 text-sm leading-relaxed text-sky-900">
              {block.taskVi}
            </p>
          ) : null}
          <LessonAudioPlayer src={item.audioUrl} title={item.titleVi} attribution={item.attribution} />
          {transcript.length ? (
            <Transcript paragraphs={transcript} glossary={glossary.map((entry) => entry.word)} />
          ) : null}
          <p className="text-sm">
            <Link href={href(`/listening/${item.slug}`)} className="font-bold text-brand-600 hover:underline">
              Mở bài nghe đầy đủ (có từ vựng và câu hỏi) →
            </Link>
          </p>
        </section>
      );
    }

    case 'reading': {
      const item = lesson.reading;
      if (!item) return null;
      const paragraphs = parseArray<string>(item.body);
      const glossary = parseArray<{ word: string; pos: string; definition: string }>(item.glossary);
      return (
        <section className="space-y-5">
          <h2 className="flex items-center gap-2 text-2xl">
            <BookOpen className="h-6 w-6 text-teal-500" />
            {item.titleVi}
          </h2>
          {block.taskVi ? (
            <p className="rounded-2xl bg-teal-50 px-4 py-3 text-sm leading-relaxed text-teal-900">
              {block.taskVi}
            </p>
          ) : null}
          <ReadingPassage paragraphs={paragraphs} glossary={glossary} />
          <p className="text-sm">
            <Link href={href(`/reading/${item.slug}`)} className="font-bold text-brand-600 hover:underline">
              Mở bài đọc đầy đủ (có từ vựng và câu hỏi) →
            </Link>
          </p>
        </section>
      );
    }

    case 'practice':
      if (!exercises.length) return null;
      return (
        <PracticeBlock
          exercises={exercises}
          title={lesson.titleVi}
          introVi={block.introVi}
          t={t}
        />
      );

    case 'summary':
      return (
        <Card className="border-brand-200 bg-lavender">
          <h2 className="text-lg">{t('lesson.summary')}</h2>
          <div className="mt-2">
            <Prose text={block.vi} compact />
          </div>
          {block.points?.length ? (
            <ul className="mt-3 space-y-1.5">
              {block.points.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm text-ink-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  {point}
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      );

    case 'nextStep':
      return (
        <Card className="border-coral-200 bg-coral-50/60">
          <h2 className="text-lg">{t('lesson.nextStep')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">{block.vi}</p>
          {block.href ? (
            <ButtonLink href={href(block.href)} size="sm" variant="secondary" className="mt-3">
              {block.labelVi ?? t('action.next')}
            </ButtonLink>
          ) : null}
        </Card>
      );

    default:
      return null;
  }
}
