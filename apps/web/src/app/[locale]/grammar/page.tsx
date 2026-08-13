import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ScrollText } from 'lucide-react';

import { CEFR_LEVELS } from '@tracy/curriculum';
import { translate } from '@tracy/localization';
import { Badge, Card, Eyebrow, LevelBadge, SectionHeading, cn } from '@tracy/ui';

import { db } from '@/lib/db';
import { resolveLocale } from '@/lib/session';

export const metadata: Metadata = { title: 'Ngữ pháp' };
export const dynamic = 'force-dynamic';

const CATEGORY_LABELS: Record<string, string> = {
  tense: 'Thì',
  clause: 'Mệnh đề',
  modality: 'Tình thái',
  article: 'Mạo từ',
  preposition: 'Giới từ',
  'word-order': 'Trật tự từ',
  voice: 'Thể',
  conditional: 'Điều kiện',
  reported: 'Tường thuật',
  noun: 'Danh từ',
  adjective: 'Tính từ',
  discourse: 'Liên kết ý',
  'verb-pattern': 'Cấu trúc động từ',
  'vocabulary-grammar': 'Từ vựng – ngữ pháp',
};

export default async function GrammarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ level?: string }>;
}) {
  const locale = await resolveLocale(params);
  const query = await searchParams;
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;
  const level = CEFR_LEVELS.includes(query.level as never) ? query.level : undefined;

  const topics = await db.grammarTopic.findMany({
    where: { status: 'PUBLISHED', ...(level ? { cefr: level } : {}) },
    orderBy: [{ cefr: 'asc' }, { displayOrder: 'asc' }],
    include: { _count: { select: { exercises: true } } },
  });

  const byLevel = CEFR_LEVELS.map((value) => ({
    level: value,
    topics: topics.filter((topic) => topic.cefr === value),
  })).filter((group) => group.topics.length);

  const totalExercises = topics.reduce((sum, topic) => sum + topic._count.exercises, 0);

  return (
    <>
      <section className="border-b-2 border-ink-100 bg-lavender py-12">
        <div className="container-page">
          <Eyebrow>
            <ScrollText className="h-3.5 w-3.5" />
            {t('nav.grammar')}
          </Eyebrow>
          <h1 className="mt-4 text-4xl">{t('grammar.title')}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-600">{t('grammar.lead')}</p>
          <p className="mt-4 max-w-3xl rounded-2xl bg-white/70 px-4 py-3 text-sm leading-relaxed text-ink-600">
            Trình độ của mỗi chủ điểm được neo theo <strong>CEFR-J Grammar Profile</strong>, và câu
            ví dụ là câu thật do người dùng Tatoeba viết, có kèm bản dịch tiếng Việt và tên người
            đóng góp. Phần giải thích tiếng Việt do giáo viên của trung tâm biên soạn.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Link
              href={href('/grammar')}
              className={cn(
                'rounded-full border-2 px-3 py-1 text-xs font-bold transition-colors',
                !level ? 'border-brand-400 bg-brand-100 text-brand-800' : 'border-ink-200 bg-white text-ink-600',
              )}
            >
              {t('common.all')} ({topics.length})
            </Link>
            {CEFR_LEVELS.map((value) => (
              <Link
                key={value}
                href={href(`/grammar?level=${value}`)}
                className={cn(
                  'rounded-full border-2 px-3 py-1 font-mono text-xs font-bold transition-colors',
                  level === value
                    ? 'border-brand-400 bg-brand-100 text-brand-800'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300',
                )}
              >
                {value}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-page space-y-14">
          {byLevel.map((group) => (
            <div key={group.level}>
              <SectionHeading
                eyebrow={`Trình độ ${group.level}`}
                title={levelHeading(group.level)}
                accent={group.level === 'A1' || group.level === 'A2' ? 'teal' : group.level === 'B1' ? 'brand' : 'coral'}
              />
              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.topics.map((topic) => (
                  <Link key={topic.id} href={href(`/grammar/${topic.slug}`)} className="group">
                    <Card interactive className="flex h-full flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <LevelBadge level={topic.cefr} />
                        <Badge accent="ink">{CATEGORY_LABELS[topic.category] ?? topic.category}</Badge>
                      </div>
                      <h3 className="mt-3 text-lg leading-snug">{topic.titleVi}</h3>
                      <p className="mt-1 text-xs font-semibold text-ink-400">{topic.titleEn}</p>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">
                        {topic.summaryVi}
                      </p>
                      <div className="mt-4 flex items-center justify-between text-sm font-bold text-brand-600">
                        <span>{topic._count.exercises} bài tập</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <p className="text-center text-sm text-ink-500">
            {topics.length} chủ điểm · {totalExercises} bài tập có chữa chi tiết
          </p>
        </div>
      </section>
    </>
  );
}

function levelHeading(level: string): string {
  switch (level) {
    case 'A1':
      return 'Nền tảng — những gì tiếng Việt không có';
    case 'A2':
      return 'Kể được chuyện của mình';
    case 'B1':
      return 'Câu phức và các thì khó phân biệt';
    case 'B2':
      return 'Viết được lập luận';
    case 'C1':
      return 'Văn phong học thuật';
    default:
      return `Trình độ ${level}`;
  }
}
