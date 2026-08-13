import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, ExternalLink, ListChecks } from 'lucide-react';

import { formatDate, translate } from '@tracy/localization';
import { Badge, Card, LevelBadge, SectionHeading } from '@tracy/ui';

import { LessonAudioPlayer } from '@/components/learn/audio';
import { ExercisePlayer } from '@/components/learn/exercise-player';
import { ReadingPassage } from '@/components/learn/reading-passage';
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
  const item = await db.readingItem.findUnique({ where: { slug } });
  return { title: item?.titleVi ?? 'Bài đọc', description: item?.summaryVi };
}

export default async function ReadingItemPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const resolved = await params;
  const locale = await resolveLocale(params);
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const item = await db.readingItem.findUnique({
    where: { slug: resolved.slug },
    include: {
      exercises: { where: { status: 'PUBLISHED' }, orderBy: { displayOrder: 'asc' } },
      grammar: { select: { slug: true, titleVi: true, cefr: true } },
    },
  });
  if (!item || item.status !== 'PUBLISHED') notFound();

  const paragraphs = parseArray<string>(item.body);
  const glossary = parseArray<{ word: string; pos: string; definition: string }>(item.glossary);
  const exercises = toClientExercises(item.exercises);

  const glossaryWords = glossary.map((entry) => entry.word.toLowerCase());
  const [known, related] = await Promise.all([
    glossaryWords.length
      ? db.vocabularyItem.findMany({
          where: { word: { in: glossaryWords } },
          select: { word: true, meaningVi: true, cefr: true },
        })
      : Promise.resolve([]),
    db.readingItem.findMany({
      where: { status: 'PUBLISHED', series: item.series, id: { not: item.id } },
      orderBy: { publishedAt: 'desc' },
      take: 4,
      select: { slug: true, titleVi: true, cefr: true, readingMinutes: true },
    }),
  ]);
  const knownByWord = new Map(known.map((row) => [row.word, row]));

  return (
    <div className="py-10">
      <div className="container-page">
        <Link
          href={href('/reading')}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-500 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('nav.reading')}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="space-y-8">
            <header>
              <div className="flex flex-wrap items-center gap-2">
                <LevelBadge level={item.cefr} />
                <Badge accent="teal">{item.series}</Badge>
                {item.publishedAt ? (
                  <span className="text-xs font-semibold text-ink-400">
                    {formatDate(item.publishedAt, locale)}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-4 text-3xl leading-tight sm:text-4xl">{item.titleVi}</h1>
              {item.summaryVi ? (
                <p className="mt-3 text-base leading-relaxed text-ink-600">{item.summaryVi}</p>
              ) : null}
              <p className="mt-4 flex flex-wrap items-center gap-4 text-sm font-semibold text-ink-500">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {item.readingMinutes} {t('common.minutes')}
                </span>
                <span>
                  {item.wordCount} {t('common.words')}
                </span>
                <span>{glossary.length} từ khoá</span>
              </p>
            </header>

            <Card className="border-teal-200 bg-teal-50/60">
              <h2 className="text-base">Cách đọc bài này</h2>
              <ol className="mt-3 space-y-2 text-sm leading-relaxed text-ink-700">
                <li>
                  <strong>1.</strong> Đọc hết một lượt, không tra từ. Mục tiêu là nắm ý chính.
                </li>
                <li>
                  <strong>2.</strong> Đọc lại và chú ý những từ được tô sáng — đó là từ khoá của bài.
                </li>
                <li>
                  <strong>3.</strong> Làm câu hỏi bên dưới, rồi mới đối chiếu phần từ vựng.
                </li>
                {item.audioUrl ? (
                  <li>
                    <strong>4.</strong> Nghe bản thu để nối chữ viết với âm thanh.
                  </li>
                ) : null}
              </ol>
            </Card>

            <ReadingPassage paragraphs={paragraphs} glossary={glossary} />

            {item.audioUrl ? (
              <LessonAudioPlayer
                src={item.audioUrl}
                title={`Nghe lại: ${item.titleVi}`}
                attribution={item.attribution}
              />
            ) : null}

            {exercises.length ? (
              <div>
                <SectionHeading
                  eyebrow={t('nav.practice')}
                  title="Câu hỏi về bài đọc"
                  lead="Mỗi câu hỏi kiểm tra một chi tiết có thật trong bài, không phải kiến thức bên ngoài."
                  accent="teal"
                />
                <div className="mt-6">
                  <ExercisePlayer exercises={exercises} contextLabel={item.titleVi} onFinishHref="/reading" />
                </div>
              </div>
            ) : null}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24">
            {glossary.length ? (
              <Card>
                <h2 className="flex items-center gap-2 text-base">
                  <ListChecks className="h-4 w-4 text-teal-600" />
                  {t('reading.glossary')}
                </h2>
                <ul className="mt-3 space-y-2.5">
                  {glossary.map((entry) => {
                    const dictionary = knownByWord.get(entry.word.toLowerCase());
                    return (
                      <li key={entry.word} className="rounded-2xl bg-ink-50 p-3">
                        <div className="flex flex-wrap items-baseline gap-2">
                          {dictionary ? (
                            <Link
                              href={href(`/vocabulary/${encodeURIComponent(entry.word)}`)}
                              className="font-display text-sm font-extrabold text-brand-700 hover:underline"
                            >
                              {entry.word}
                            </Link>
                          ) : (
                            <span className="font-display text-sm font-extrabold text-ink-900">
                              {entry.word}
                            </span>
                          )}
                          {entry.pos ? (
                            <span className="text-[0.7rem] font-semibold uppercase text-ink-400">
                              {entry.pos}
                            </span>
                          ) : null}
                          {dictionary ? <LevelBadge level={dictionary.cefr} /> : null}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-ink-600">{entry.definition}</p>
                        {dictionary?.meaningVi ? (
                          <p className="mt-1 text-xs font-semibold text-teal-800">{dictionary.meaningVi}</p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ) : null}

            {item.grammar.length ? (
              <Card className="bg-brand-50">
                <h2 className="text-base">Chủ điểm ngữ pháp liên quan</h2>
                <ul className="mt-3 space-y-2">
                  {item.grammar.map((topic) => (
                    <li key={topic.slug}>
                      <Link
                        href={href(`/grammar/${topic.slug}`)}
                        className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-ink-700 hover:text-brand-700"
                      >
                        <LevelBadge level={topic.cefr} />
                        {topic.titleVi}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {related.length ? (
              <Card>
                <h2 className="text-base">Cùng chuyên mục</h2>
                <ul className="mt-3 space-y-2">
                  {related.map((row) => (
                    <li key={row.slug}>
                      <Link
                        href={href(`/reading/${row.slug}`)}
                        className="flex items-start gap-2 rounded-2xl bg-ink-50 px-3 py-2 text-sm hover:bg-brand-50"
                      >
                        <LevelBadge level={row.cefr} />
                        <span className="line-clamp-2 font-semibold text-ink-700">{row.titleVi}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            <Card className="bg-ink-50">
              <h2 className="text-base">{t('common.source')}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{item.attribution}</p>
              {item.sourceUrl ? (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:underline"
                >
                  Bài gốc trên VOA
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
