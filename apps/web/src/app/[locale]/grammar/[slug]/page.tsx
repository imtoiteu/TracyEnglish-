import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, Lightbulb, Quote, Table2 } from 'lucide-react';

import { translate } from '@tracy/localization';
import { Badge, ButtonLink, Card, Eyebrow, LevelBadge, SectionHeading } from '@tracy/ui';

import { ExercisePlayer } from '@/components/learn/exercise-player';
import { Prose } from '@/components/learn/prose';
import { db } from '@/lib/db';
import { toClientExercises } from '@/lib/exercises';
import { parseArray } from '@/lib/json';
import { resolveLocale } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = await db.grammarTopic.findUnique({ where: { slug } });
  if (!topic) return { title: 'Ngữ pháp' };
  return { title: topic.titleVi, description: topic.summaryVi };
}

export default async function GrammarTopicPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const resolved = await params;
  const locale = await resolveLocale(params);
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const topic = await db.grammarTopic.findUnique({
    where: { slug: resolved.slug },
    include: {
      exercises: { where: { status: 'PUBLISHED' }, orderBy: { displayOrder: 'asc' } },
      reading: { select: { slug: true, titleVi: true, audioUrl: true, readingMinutes: true } },
      source: true,
      lessons: { select: { slug: true, titleVi: true }, take: 3 },
    },
  });
  if (!topic || topic.status !== 'PUBLISHED') notFound();

  const [previous, next] = await Promise.all([
    db.grammarTopic.findFirst({
      where: { status: 'PUBLISHED', displayOrder: { lt: topic.displayOrder } },
      orderBy: { displayOrder: 'desc' },
      select: { slug: true, titleVi: true },
    }),
    db.grammarTopic.findFirst({
      where: { status: 'PUBLISHED', displayOrder: { gt: topic.displayOrder } },
      orderBy: { displayOrder: 'asc' },
      select: { slug: true, titleVi: true },
    }),
  ]);

  const patterns = parseArray<{ form: string; example: string; vi: string }>(topic.patterns);
  const examples = parseArray<{ en: string; vi: string; level: string; credit: string }>(topic.examples);
  const pitfalls = parseArray<string>(topic.pitfallsVi);
  const tips = parseArray<string>(topic.tipsVi);
  const criterial = parseArray<{ code: string; item: string; sentenceType: string; cefr: string }>(
    topic.attribution,
  );
  const exercises = toClientExercises(topic.exercises);

  return (
    <div className="py-10">
      <div className="container-page">
        <Link
          href={href('/grammar')}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-500 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('nav.grammar')}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="space-y-8">
            <header>
              <div className="flex flex-wrap items-center gap-2">
                <LevelBadge level={topic.cefr} />
                <Badge accent="ink">{topic.category}</Badge>
              </div>
              <h1 className="mt-4 text-3xl sm:text-4xl">{topic.titleVi}</h1>
              <p className="mt-1 text-base font-semibold text-ink-400">{topic.titleEn}</p>
              <p className="mt-4 text-lg leading-relaxed text-ink-700">{topic.summaryVi}</p>
            </header>

            {/* ---------------------------------------------------------- theory */}
            <Card>
              <h2 className="flex items-center gap-2 text-xl">
                <BookOpen className="h-5 w-5 text-brand-600" />
                {t('grammar.theory')}
              </h2>
              <div className="mt-4">
                <Prose text={topic.theoryVi} />
              </div>
              <p className="mt-5 rounded-2xl bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-500">
                Phần giải thích này do giáo viên Tracy English biên soạn cho người học Việt Nam.
                Trình độ CEFR của chủ điểm được neo theo CEFR-J Grammar Profile (CC BY-SA 4.0).
              </p>
            </Card>

            {/* -------------------------------------------------------- patterns */}
            {patterns.length ? (
              <Card>
                <h2 className="flex items-center gap-2 text-xl">
                  <Table2 className="h-5 w-5 text-teal-600" />
                  {t('grammar.patterns')}
                </h2>
                <div className="scroll-x mt-4">
                  <table className="w-full min-w-[34rem] text-left text-sm">
                    <thead>
                      <tr className="border-b-2 border-ink-100">
                        <th scope="col" className="pb-2 pr-4 font-bold text-ink-500">Công thức</th>
                        <th scope="col" className="pb-2 pr-4 font-bold text-ink-500">Ví dụ</th>
                        <th scope="col" className="pb-2 font-bold text-ink-500">Nghĩa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {patterns.map((pattern, index) => (
                        <tr key={index}>
                          <td className="py-3 pr-4 font-mono text-xs font-bold text-brand-700">
                            {pattern.form}
                          </td>
                          <td className="py-3 pr-4 font-semibold text-ink-900">{pattern.example}</td>
                          <td className="py-3 text-ink-600">{pattern.vi}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : null}

            {/* -------------------------------------------------------- examples */}
            {examples.length ? (
              <Card>
                <h2 className="flex items-center gap-2 text-xl">
                  <Quote className="h-5 w-5 text-coral-500" />
                  {t('grammar.examples')}
                </h2>
                <p className="mt-1 text-sm text-ink-500">
                  Câu thật từ kho ngữ liệu Tatoeba, kèm bản dịch và tên người đóng góp.
                </p>
                <ul className="mt-4 space-y-3">
                  {examples.map((example, index) => (
                    <li key={index} className="rounded-2xl bg-ink-50 p-4">
                      <p className="text-[0.95rem] font-semibold leading-relaxed text-ink-900">
                        {example.en}
                      </p>
                      <p className="mt-1 text-sm text-teal-800">{example.vi}</p>
                      <p className="mt-2 flex items-center gap-2 text-[0.7rem] text-ink-400">
                        <LevelBadge level={example.level} />
                        tatoeba.org — {example.credit} (CC BY 2.0 FR)
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {/* -------------------------------------------------------- pitfalls */}
            {pitfalls.length ? (
              <Card className="border-rose-200 bg-rose-50/50">
                <h2 className="flex items-center gap-2 text-xl">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                  {t('grammar.pitfalls')}
                </h2>
                <ul className="mt-4 space-y-3">
                  {pitfalls.map((pitfall, index) => (
                    <li key={index} className="rounded-2xl bg-white p-4">
                      <Prose text={pitfall} compact />
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {/* ------------------------------------------------------------ tips */}
            {tips.length ? (
              <Card className="border-sun-200 bg-sun-50/60">
                <h2 className="flex items-center gap-2 text-xl">
                  <Lightbulb className="h-5 w-5 text-sun-600" />
                  {t('grammar.tips')}
                </h2>
                <ul className="mt-4 space-y-2">
                  {tips.map((tip, index) => (
                    <li key={index} className="flex gap-2 text-sm leading-relaxed text-ink-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sun-500" aria-hidden="true" />
                      <Prose text={tip} compact />
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {/* -------------------------------------------------------- practice */}
            <div id="practice">
              <SectionHeading
                eyebrow={t('nav.practice')}
                title={t('grammar.practice')}
                lead="Mỗi câu hỏi dựng từ chính những câu ví dụ ở trên, nên bạn gặp lại cấu trúc trong ngữ cảnh thật."
              />
              <div className="mt-6">
                <ExercisePlayer
                  exercises={exercises}
                  contextLabel={topic.titleVi}
                  onFinishHref={next ? `/grammar/${next.slug}` : '/grammar'}
                />
              </div>
            </div>

            {/* ------------------------------------------------------ navigation */}
            <nav className="grid gap-3 sm:grid-cols-2" aria-label="Chủ điểm khác">
              {previous ? (
                <Link
                  href={href(`/grammar/${previous.slug}`)}
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
                  href={href(`/grammar/${next.slug}`)}
                  className="flex items-center justify-end gap-2 rounded-2xl border-2 border-ink-200 bg-white px-4 py-3 text-sm font-bold text-ink-700 hover:border-brand-300"
                >
                  <span className="truncate">{next.titleVi}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              ) : null}
            </nav>
          </div>

          {/* -------------------------------------------------------------- aside */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            <Card className="bg-brand-50">
              <h2 className="text-base">Học điểm này ở đâu nữa</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {topic.reading ? (
                  <li>
                    <Link
                      href={href(`/reading/${topic.reading.slug}`)}
                      className="flex flex-col gap-0.5 rounded-2xl bg-white px-3 py-2.5 hover:text-brand-700"
                    >
                      <span className="font-bold">Bài đọc của VOA về chủ điểm này</span>
                      <span className="text-xs text-ink-500">
                        {topic.reading.titleVi.slice(0, 70)}
                        {topic.reading.audioUrl ? ' · có audio' : ''}
                      </span>
                    </Link>
                  </li>
                ) : null}
                {topic.lessons.map((lesson) => (
                  <li key={lesson.slug}>
                    <Link
                      href={href(`/lessons/${lesson.slug}`)}
                      className="flex flex-col gap-0.5 rounded-2xl bg-white px-3 py-2.5 hover:text-brand-700"
                    >
                      <span className="font-bold">Bài học trong khoá</span>
                      <span className="text-xs text-ink-500">{lesson.titleVi}</span>
                    </Link>
                  </li>
                ))}
                {!topic.reading && !topic.lessons.length ? (
                  <li className="text-ink-500">
                    Chủ điểm này chưa được gắn với bài đọc hoặc bài học nào.
                  </li>
                ) : null}
              </ul>
            </Card>

            {criterial.length ? (
              <Card>
                <h2 className="text-base">Cấu trúc tiêu biểu ở trình độ này</h2>
                <p className="mt-1 text-xs text-ink-500">
                  Trích từ CEFR-J Grammar Profile (CC BY-SA 4.0).
                </p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {criterial.slice(0, 10).map((feature) => (
                    <li
                      key={feature.code}
                      className="rounded-xl bg-ink-100 px-2 py-1 font-mono text-[0.7rem] font-semibold text-ink-700"
                      title={`${feature.item} · ${feature.sentenceType}`}
                    >
                      {feature.item || feature.code}
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            <Card>
              <h2 className="text-base">Cần người chữa bài?</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                Bài tập tự chấm giúp bạn phát hiện lỗi, nhưng viết một đoạn văn thì cần người đọc.
                Trung tâm có lớp và buổi kèm 1–1 cho phần này.
              </p>
              <ButtonLink href={href('/classes')} size="sm" variant="secondary" className="mt-3">
                {t('nav.classes')}
              </ButtonLink>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
