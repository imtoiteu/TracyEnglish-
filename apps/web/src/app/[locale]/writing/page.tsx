import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, PenLine } from 'lucide-react';

import { translate } from '@tracy/localization';
import { ButtonLink, Card, Eyebrow, LevelBadge, SectionHeading } from '@tracy/ui';

import { db } from '@/lib/db';
import { resolveLocale } from '@/lib/session';

export const metadata: Metadata = { title: 'Luyện viết' };
export const dynamic = 'force-dynamic';

/**
 * The writing hub.
 *
 * Writing is the skill this platform is most honest about: automatic essay grading is not
 * good enough to be worth pretending, so instead of a fake score this page routes a learner
 * to the two things that genuinely help — the sentence-level grammar that most Vietnamese
 * writing errors come from, and a teacher who will read the whole piece.
 */
export default async function WritingPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const [writingGrammar, translationExercises, courses] = await Promise.all([
    db.grammarTopic.findMany({
      where: {
        status: 'PUBLISHED',
        slug: {
          in: [
            'linking-words',
            'relative-clauses',
            'passive-voice',
            'conditionals-0-1-2',
            'hedging-academic',
            'inversion',
            'cleft-sentences',
            'reported-speech',
          ],
        },
      },
      orderBy: { cefr: 'asc' },
    }),
    db.exercise.count({ where: { type: 'TRANSLATION', status: 'PUBLISHED' } }),
    db.course.findMany({
      where: { status: 'PUBLISHED', skills: { contains: 'writing' } },
      orderBy: { displayOrder: 'asc' },
      take: 4,
    }),
  ]);

  const STAGES = [
    {
      titleVi: 'Bước 1 · Câu đúng',
      bodyVi:
        'Phần lớn lỗi viết của người Việt là lỗi câu, không phải lỗi ý: thiếu động từ to be, quên -s, sai mạo từ, sai thì. Chữa xong tầng này thì bài viết đã dễ đọc hơn hẳn.',
      href: '/grammar?level=A1',
      labelVi: 'Ôn ngữ pháp nền',
    },
    {
      titleVi: 'Bước 2 · Câu phức',
      bodyVi:
        'Nối ý bằng mệnh đề quan hệ và từ nối thay vì nối bằng "and" mãi. Đây là chỗ giám khảo IELTS và VSTEP nhìn vào để phân biệt band 5.5 với band 6.5.',
      href: '/grammar/relative-clauses',
      labelVi: 'Học mệnh đề quan hệ',
    },
    {
      titleVi: 'Bước 3 · Dịch ngược',
      bodyVi: `Luyện dịch từ tiếng Việt sang tiếng Anh với ${translationExercises} câu thật lấy từ kho Tatoeba. Cách này bộc lộ đúng những chỗ bạn quen dịch từng chữ.`,
      href: '/grammar',
      labelVi: 'Làm bài dịch',
    },
    {
      titleVi: 'Bước 4 · Người chữa bài',
      bodyVi:
        'Đến đây thì cần người đọc. Máy chấm được chính tả và ngữ pháp, nhưng không nói được vì sao đoạn văn của bạn lạc đề hay vì sao câu này nghe không tự nhiên.',
      href: '/classes',
      labelVi: 'Xem lớp có chấm bài',
    },
  ];

  return (
    <>
      <section className="border-b-2 border-ink-100 bg-lavender py-12">
        <div className="container-page">
          <Eyebrow accent="sun">
            <PenLine className="h-3.5 w-3.5" />
            {t('nav.writing')}
          </Eyebrow>
          <h1 className="mt-4 text-4xl">Luyện viết</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-600">
            Viết là kỹ năng khó tự học nhất, và cũng là kỹ năng mà chúng tôi thẳng thắn nhất: nền
            tảng không chấm bài luận tự động. Chấm tự động cho điểm nhưng không dạy được gì. Thay
            vào đó, đây là lộ trình bốn bước — ba bước đầu bạn tự làm được, bước cuối cần người đọc.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-page grid gap-4 md:grid-cols-2">
          {STAGES.map((stage, index) => (
            <Card key={stage.titleVi} className="flex h-full flex-col">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sun-100 font-display text-base font-extrabold text-sun-700">
                {index + 1}
              </span>
              <h2 className="mt-3 text-lg">{stage.titleVi}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{stage.bodyVi}</p>
              <ButtonLink href={href(stage.href)} variant="outline" size="sm" className="mt-4 self-start">
                {stage.labelVi}
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y-2 border-ink-100 bg-white py-12">
        <div className="container-page">
          <SectionHeading
            eyebrow={t('nav.grammar')}
            title="Những chủ điểm quyết định chất lượng bài viết"
            lead="Đây là các cấu trúc mà người chấm tìm trong một bài viết ở mức B2 trở lên."
            accent="sun"
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {writingGrammar.map((topic) => (
              <Link key={topic.id} href={href(`/grammar/${topic.slug}`)} className="group">
                <Card interactive className="h-full">
                  <LevelBadge level={topic.cefr} />
                  <h3 className="mt-2 text-base leading-snug">{topic.titleVi}</h3>
                  <p className="mt-1.5 line-clamp-3 text-sm text-ink-600">{topic.summaryVi}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          <Card className="bg-sun-50">
            <h2 className="text-2xl">Vì sao chúng tôi không chấm luận tự động</h2>
            <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-ink-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sun-600" />
                Máy cho điểm cao một bài rỗng ý nhưng đúng ngữ pháp, và cho điểm thấp một bài có ý
                hay nhưng viết vụng — đúng ngược với điều người học cần nghe.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sun-600" />
                Lỗi đặc trưng của người Việt (dịch từng chữ, thiếu mạo từ, thừa “the”) cần người
                biết tiếng Việt mới giải thích được nguyên nhân.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sun-600" />
                Một điểm số không nói cho bạn biết phải sửa gì. Một dòng ghi chú bên lề thì có.
              </li>
            </ul>
          </Card>

          <div>
            <SectionHeading eyebrow={t('nav.courses')} title="Khoá có phần viết" accent="coral" />
            <div className="mt-6 grid gap-3">
              {courses.map((course) => (
                <Link key={course.id} href={href(`/courses/${course.slug}`)}>
                  <Card interactive>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base leading-snug">{course.titleVi}</h3>
                        <p className="mt-1 text-xs text-ink-500">{course.subtitleVi}</p>
                      </div>
                      <LevelBadge level={course.cefrTo} />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
