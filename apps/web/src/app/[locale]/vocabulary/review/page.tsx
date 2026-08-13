import type { Metadata } from 'next';
import { Repeat } from 'lucide-react';

import { translate } from '@tracy/localization';
import { Eyebrow } from '@tracy/ui';

import { ReviewSession, type ReviewCard } from '@/components/learn/review-session';
import { db } from '@/lib/db';
import { requireUser, resolveLocale } from '@/lib/session';

export const metadata: Metadata = { title: 'Ôn từ vựng' };
export const dynamic = 'force-dynamic';

const SESSION_SIZE = 20;

export default async function ReviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const user = await requireUser(locale, `/${locale}/vocabulary/review`);
  const t = (key: string) => translate(locale, key);

  // Due first, then the oldest-scheduled — a learner who has been away for a week should
  // meet the words they have gone longest without seeing.
  const due = await db.vocabularyProgress.findMany({
    where: { userId: user.id, dueAt: { lte: new Date() }, box: { lt: 6 } },
    orderBy: [{ dueAt: 'asc' }, { box: 'asc' }],
    take: SESSION_SIZE,
    include: {
      vocabulary: {
        include: { examples: { orderBy: { displayOrder: 'asc' }, take: 1 } },
      },
    },
  });

  const cards: ReviewCard[] = due.map((row) => ({
    id: row.id,
    vocabularyId: row.vocabularyId,
    word: row.vocabulary.word,
    cefr: row.vocabulary.cefr,
    ipaUk: row.vocabulary.ipaUk,
    ipaUs: row.vocabulary.ipaUs,
    audioPath: row.vocabulary.audioPath,
    audioCredit: row.vocabulary.audioCredit,
    meaningVi: row.vocabulary.meaningVi,
    explanationVi: row.vocabulary.explanationVi.slice(0, 220),
    example: row.vocabulary.examples[0]
      ? { en: row.vocabulary.examples[0].textEn, vi: row.vocabulary.examples[0].textVi }
      : null,
    box: row.box,
  }));

  const [totalTracked, mastered] = await Promise.all([
    db.vocabularyProgress.count({ where: { userId: user.id } }),
    db.vocabularyProgress.count({ where: { userId: user.id, box: { gte: 5 } } }),
  ]);

  return (
    <div className="py-10">
      <div className="container-page max-w-3xl">
        <Eyebrow accent="rose">
          <Repeat className="h-3.5 w-3.5" />
          {t('vocab.review')}
        </Eyebrow>
        <h1 className="mt-4 text-3xl">Ôn tập theo giãn cách</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          Bạn đang theo dõi {totalTracked} từ, trong đó {mastered} từ đã ở mức thuộc. Hệ thống chỉ
          hỏi lại những từ sắp đến ngưỡng quên, nên phiên ôn luôn ngắn.
        </p>

        <div className="mt-8">
          <ReviewSession cards={cards} />
        </div>
      </div>
    </div>
  );
}
