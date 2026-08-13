import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Bookmark } from 'lucide-react';

import { translate } from '@tracy/localization';
import { ButtonLink, Card, EmptyState, Eyebrow, LevelBadge } from '@tracy/ui';

import { db } from '@/lib/db';
import { requireUser, resolveLocale } from '@/lib/session';

export const metadata: Metadata = { title: 'Đã lưu' };
export const dynamic = 'force-dynamic';

const TYPE_LABELS: Record<string, string> = {
  course: 'Khoá học',
  lesson: 'Bài học',
  grammar: 'Ngữ pháp',
  listening: 'Bài nghe',
  reading: 'Bài đọc',
  vocabulary: 'Từ vựng',
};

/**
 * Saved items.
 *
 * Bookmarks store an entity type and a slug rather than a foreign key, because a learner
 * saves things across six different content types and a polymorphic join table would be
 * six nullable columns for no benefit. The trade-off is that resolution happens here.
 */
export default async function BookmarksPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const user = await requireUser(locale, `/${locale}/dashboard/bookmarks`);
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const bookmarks = await db.bookmark.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  const byType = (type: string) => bookmarks.filter((row) => row.entityType === type).map((row) => row.entityId);

  const [courses, grammar, listening, reading] = await Promise.all([
    db.course.findMany({ where: { slug: { in: byType('course') } } }),
    db.grammarTopic.findMany({ where: { slug: { in: byType('grammar') } } }),
    db.listeningItem.findMany({ where: { slug: { in: byType('listening') } } }),
    db.readingItem.findMany({ where: { slug: { in: byType('reading') } } }),
  ]);

  const resolved = [
    ...courses.map((row) => ({ type: 'course', slug: row.slug, title: row.titleVi, cefr: row.cefrFrom, path: `/courses/${row.slug}` })),
    ...grammar.map((row) => ({ type: 'grammar', slug: row.slug, title: row.titleVi, cefr: row.cefr, path: `/grammar/${row.slug}` })),
    ...listening.map((row) => ({ type: 'listening', slug: row.slug, title: row.titleVi, cefr: row.cefr, path: `/listening/${row.slug}` })),
    ...reading.map((row) => ({ type: 'reading', slug: row.slug, title: row.titleVi, cefr: row.cefr, path: `/reading/${row.slug}` })),
  ];

  return (
    <div className="py-10">
      <div className="container-page">
        <Link href={href('/dashboard')} className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-500 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" />
          {t('nav.dashboard')}
        </Link>

        <Eyebrow className="mt-6">
          <Bookmark className="h-3.5 w-3.5" />
          {t('nav.bookmarks')}
        </Eyebrow>
        <h1 className="mt-4 text-4xl">Đã lưu</h1>

        {resolved.length ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resolved.map((item) => (
              <Link key={`${item.type}-${item.slug}`} href={href(item.path)}>
                <Card interactive className="h-full">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-ink-400">
                      {TYPE_LABELS[item.type] ?? item.type}
                    </span>
                    <LevelBadge level={item.cefr} />
                  </div>
                  <h2 className="mt-2 line-clamp-2 text-base leading-snug">{item.title}</h2>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              title="Bạn chưa lưu mục nào"
              description="Bấm “Lưu lại” trên một bài học hoặc chủ điểm để tìm lại nhanh sau này."
              action={<ButtonLink href={href('/courses')}>{t('nav.courses')}</ButtonLink>}
            />
          </div>
        )}
      </div>
    </div>
  );
}
