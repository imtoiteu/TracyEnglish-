import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Headphones, ScrollText, Search as SearchIcon, Sparkles } from 'lucide-react';

import { translate } from '@tracy/localization';
import { Card, EmptyState, Eyebrow, Input, LevelBadge } from '@tracy/ui';

import { db } from '@/lib/db';
import { resolveLocale } from '@/lib/session';

export const metadata: Metadata = { title: 'Tìm kiếm' };
export const dynamic = 'force-dynamic';

/**
 * Site-wide search.
 *
 * SQLite `contains` is a plain substring match — no stemming, no ranking. For a dictionary
 * lookup, which is what most searches here are, that is exactly right and stays fast because
 * every searched column is indexed or small.
 */
export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const locale = await resolveLocale(params);
  const { q } = await searchParams;
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;
  const query = (q ?? '').trim();

  const [words, grammar, listening, reading, courses] = query
    ? await Promise.all([
        db.vocabularyItem.findMany({
          where: {
            status: 'PUBLISHED',
            OR: [{ word: { contains: query } }, { meaningVi: { contains: query } }],
          },
          take: 12,
          orderBy: { cefr: 'asc' },
        }),
        db.grammarTopic.findMany({
          where: {
            status: 'PUBLISHED',
            OR: [
              { titleVi: { contains: query } },
              { titleEn: { contains: query } },
              { summaryVi: { contains: query } },
            ],
          },
          take: 6,
        }),
        db.listeningItem.findMany({
          where: { status: 'PUBLISHED', titleVi: { contains: query } },
          take: 6,
        }),
        db.readingItem.findMany({
          where: { status: 'PUBLISHED', titleVi: { contains: query } },
          take: 6,
        }),
        db.course.findMany({
          where: {
            status: 'PUBLISHED',
            OR: [{ titleVi: { contains: query } }, { descriptionVi: { contains: query } }],
          },
          take: 6,
        }),
      ])
    : [[], [], [], [], []];

  const total = words.length + grammar.length + listening.length + reading.length + courses.length;

  return (
    <div className="py-12">
      <div className="container-page max-w-4xl">
        <Eyebrow>
          <SearchIcon className="h-3.5 w-3.5" />
          {t('action.search')}
        </Eyebrow>
        <h1 className="mt-4 text-4xl">Tìm kiếm</h1>

        <form action={href('/search')} method="get" className="mt-6 flex gap-2">
          <Input
            name="q"
            defaultValue={query}
            placeholder={t('common.search.placeholder')}
            aria-label={t('action.search')}
            autoFocus
          />
          <button
            type="submit"
            className="shrink-0 rounded-2xl bg-brand-600 px-6 py-2.5 font-bold text-white hover:bg-brand-700"
          >
            {t('action.search')}
          </button>
        </form>

        {query ? (
          <p className="mt-4 text-sm text-ink-500">
            {total} {t('common.results')} cho “{query}”
          </p>
        ) : null}

        {query && !total ? (
          <div className="mt-8">
            <EmptyState
              title="Không tìm thấy kết quả"
              description="Thử từ khoá ngắn hơn, hoặc tìm bằng nghĩa tiếng Việt."
            />
          </div>
        ) : null}

        <div className="mt-8 space-y-8">
          {words.length ? (
            <section>
              <h2 className="flex items-center gap-2 text-xl">
                <Sparkles className="h-5 w-5 text-rose-500" />
                {t('nav.vocabulary')}
              </h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {words.map((word) => (
                  <Link key={word.id} href={href(`/vocabulary/${encodeURIComponent(word.word)}`)}>
                    <Card interactive className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-base font-extrabold text-ink-900">
                          {word.word}
                        </span>
                        <LevelBadge level={word.cefr} />
                      </div>
                      <p className="mt-1 text-sm text-teal-800">{word.meaningVi}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {grammar.length ? (
            <section>
              <h2 className="flex items-center gap-2 text-xl">
                <ScrollText className="h-5 w-5 text-brand-500" />
                {t('nav.grammar')}
              </h2>
              <div className="mt-4 grid gap-2">
                {grammar.map((topic) => (
                  <Link key={topic.id} href={href(`/grammar/${topic.slug}`)}>
                    <Card interactive className="p-4">
                      <div className="flex items-center gap-2">
                        <LevelBadge level={topic.cefr} />
                        <span className="font-bold text-ink-900">{topic.titleVi}</span>
                      </div>
                      <p className="mt-1 text-sm text-ink-600">{topic.summaryVi}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {listening.length ? (
            <section>
              <h2 className="flex items-center gap-2 text-xl">
                <Headphones className="h-5 w-5 text-sky-500" />
                {t('nav.listening')}
              </h2>
              <div className="mt-4 grid gap-2">
                {listening.map((item) => (
                  <Link key={item.id} href={href(`/listening/${item.slug}`)}>
                    <Card interactive className="p-4">
                      <div className="flex items-center gap-2">
                        <LevelBadge level={item.cefr} />
                        <span className="line-clamp-1 font-bold text-ink-900">{item.titleVi}</span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {reading.length ? (
            <section>
              <h2 className="flex items-center gap-2 text-xl">
                <BookOpen className="h-5 w-5 text-teal-500" />
                {t('nav.reading')}
              </h2>
              <div className="mt-4 grid gap-2">
                {reading.map((item) => (
                  <Link key={item.id} href={href(`/reading/${item.slug}`)}>
                    <Card interactive className="p-4">
                      <div className="flex items-center gap-2">
                        <LevelBadge level={item.cefr} />
                        <span className="line-clamp-1 font-bold text-ink-900">{item.titleVi}</span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {courses.length ? (
            <section>
              <h2 className="text-xl">{t('nav.courses')}</h2>
              <div className="mt-4 grid gap-2">
                {courses.map((course) => (
                  <Link key={course.id} href={href(`/courses/${course.slug}`)}>
                    <Card interactive className="p-4">
                      <span className="font-bold text-ink-900">{course.titleVi}</span>
                      <p className="mt-1 text-sm text-ink-600">{course.subtitleVi}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
