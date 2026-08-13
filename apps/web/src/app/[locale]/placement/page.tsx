import type { Metadata } from 'next';
import { Target } from 'lucide-react';

import { CEFR_LEVELS } from '@tracy/curriculum';
import { translate } from '@tracy/localization';
import { Card, Eyebrow } from '@tracy/ui';

import { PlacementTest } from '@/components/learn/placement-test';
import { db } from '@/lib/db';
import { toClientExercises } from '@/lib/exercises';
import { resolveLocale } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Kiểm tra trình độ',
  description: 'Bài kiểm tra 20 câu để xác định trình độ CEFR hiện tại và lộ trình phù hợp.',
};
export const dynamic = 'force-dynamic';

const PER_LEVEL = 4;

/**
 * The placement test.
 *
 * Twenty questions, four at each level from A1 to C1, drawn from the same graded exercise
 * bank the lessons use. That is what makes the result meaningful: the questions are the
 * real thing, and a learner who places at B1 has demonstrably answered B1 items.
 *
 * Questions are picked deterministically (ordered by id) so two people sitting the test get
 * a comparable paper, and so a result can be reproduced when someone queries it.
 */
export default async function PlacementPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = (key: string) => translate(locale, key);

  const levels = CEFR_LEVELS.slice(0, 5);
  const perLevel = await Promise.all(
    levels.map((level) =>
      db.exercise.findMany({
        where: {
          status: 'PUBLISHED',
          cefr: level,
          type: { in: ['MULTIPLE_CHOICE', 'GAP_FILL'] },
          skill: { in: ['grammar', 'vocabulary'] },
        },
        orderBy: { id: 'asc' },
        take: PER_LEVEL,
      }),
    ),
  );

  const questions = levels.flatMap((level, index) =>
    toClientExercises(perLevel[index]).map((exercise) => ({ ...exercise, cefr: level })),
  );

  return (
    <div className="py-12">
      <div className="container-page max-w-3xl">
        <Eyebrow accent="rose">
          <Target className="h-3.5 w-3.5" />
          {t('nav.placement')}
        </Eyebrow>
        <h1 className="mt-4 text-4xl">Bạn đang ở đâu?</h1>
        <p className="mt-3 text-base leading-relaxed text-ink-600">
          {questions.length} câu, khoảng 10 phút. Câu hỏi lấy từ chính ngân hàng bài tập của nền
          tảng, xếp từ A1 lên C1. Không có mẹo — cứ trả lời trung thực, kết quả sai thì lộ trình
          cũng sai.
        </p>

        <Card className="mt-6 bg-lavender">
          <p className="text-sm leading-relaxed text-ink-700">
            <strong>Cách chấm:</strong> mỗi câu thuộc một bậc CEFR. Trình độ của bạn là bậc cao nhất
            mà bạn trả lời đúng ít nhất ba trên bốn câu. Nếu không đạt ngưỡng ở bậc nào thì kết quả
            là A1 — và đó là điểm khởi đầu hoàn toàn bình thường.
          </p>
        </Card>

        <div className="mt-8">
          <PlacementTest questions={questions} perLevel={PER_LEVEL} />
        </div>
      </div>
    </div>
  );
}
