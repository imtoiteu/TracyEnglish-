import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Headphones, Mic, PenLine, Target } from 'lucide-react';

import { EXAMS } from '@tracy/curriculum';
import { formatPrice, translate } from '@tracy/localization';
import { Badge, ButtonLink, Card, Eyebrow, LevelBadge, SectionHeading, accentStyles, cn } from '@tracy/ui';

import { db } from '@/lib/db';
import { resolveLocale } from '@/lib/session';

export const metadata: Metadata = { title: 'Luyện thi' };
export const dynamic = 'force-dynamic';

const SKILL_ICON = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenLine,
  speaking: Mic,
} as const;

export default async function ExamsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const courses = await db.course.findMany({
    where: { status: 'PUBLISHED', track: { slug: 'exam-preparation' } },
    orderBy: { displayOrder: 'asc' },
    include: { teacher: { include: { user: { select: { name: true } } } } },
  });

  // Content a candidate can practise on today, per skill.
  const [listeningCount, readingCount, b2Reading] = await Promise.all([
    db.listeningItem.count({ where: { status: 'PUBLISHED', cefr: { in: ['B1', 'B2'] } } }),
    db.readingItem.count({ where: { status: 'PUBLISHED', cefr: { in: ['B1', 'B2'] } } }),
    db.readingItem.findMany({
      where: { status: 'PUBLISHED', cefr: 'B2' },
      take: 4,
      orderBy: { wordCount: 'desc' },
      select: { slug: true, titleVi: true, wordCount: true, readingMinutes: true },
    }),
  ]);

  return (
    <>
      <section className="border-b-2 border-ink-100 bg-lavender py-12">
        <div className="container-page">
          <Eyebrow accent="rose">
            <Target className="h-3.5 w-3.5" />
            {t('nav.exams')}
          </Eyebrow>
          <h1 className="mt-4 text-4xl">{t('exam.title')}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-600">{t('exam.lead')}</p>
          <p className="mt-4 max-w-3xl rounded-2xl bg-white/70 px-4 py-3 text-sm leading-relaxed text-ink-600">
            Nền tảng không bán đề thi thật — điều đó vi phạm bản quyền của các tổ chức khảo thí. Thay
            vào đó, phần luyện thi ở đây xây trên hai thứ hợp pháp và hiệu quả: nền ngữ pháp – từ
            vựng đúng trình độ, và {listeningCount + readingCount} bài nghe – bài đọc thật ở mức
            B1–B2, cùng dạng chủ đề với đề thi.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-page">
          <SectionHeading eyebrow="Các kỳ thi" title="Chọn kỳ thi bạn cần" accent="rose" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EXAMS.map((exam) => {
              const styles = accentStyles(exam.accent);
              return (
                <Card key={exam.slug} className="flex h-full flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className={cn('text-xl', styles.text)}>{exam.name}</h2>
                    <Badge accent={exam.accent as never}>{exam.slug.toUpperCase()}</Badge>
                  </div>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{exam.summaryVi}</p>
                  <p className="mt-3 rounded-2xl bg-ink-50 px-3 py-2 text-xs font-semibold text-ink-600">
                    {exam.bandVi}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {exam.skills.map((skill) => {
                      const Icon = SKILL_ICON[skill as keyof typeof SKILL_ICON] ?? BookOpen;
                      return (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-[0.7rem] font-semibold text-ink-600"
                        >
                          <Icon className="h-3 w-3" />
                          {t(`skill.${skill}`)}
                        </span>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y-2 border-ink-100 bg-white py-12">
        <div className="container-page">
          <SectionHeading
            eyebrow={t('nav.courses')}
            title="Khoá luyện thi đang mở"
            lead="Mỗi khoá đi từ nền tảng ngữ pháp lên chiến lược làm bài, không nhảy thẳng vào luyện đề."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link key={course.id} href={href(`/courses/${course.slug}`)} className="group">
                <Card interactive className="flex h-full flex-col">
                  <div className="flex items-center gap-2">
                    <LevelBadge level={course.cefrFrom} />
                    <span className="text-ink-300">→</span>
                    <LevelBadge level={course.cefrTo} />
                  </div>
                  <h3 className="mt-3 text-lg leading-snug">{course.titleVi}</h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-600">
                    {course.subtitleVi || course.descriptionVi}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm font-bold">
                    <span className="text-coral-600">{formatPrice(course.priceVnd, locale)}</span>
                    <ArrowRight className="h-4 w-4 text-brand-500 transition-transform group-hover:translate-x-1" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Luyện đọc học thuật"
              title="Bài đọc dài, đúng dạng chủ đề đề thi"
              accent="teal"
            />
            <ul className="mt-6 space-y-3">
              {b2Reading.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={href(`/reading/${item.slug}`)}
                    className="flex items-center justify-between gap-3 rounded-2xl border-2 border-ink-100 bg-white px-4 py-3 hover:border-teal-300"
                  >
                    <span className="line-clamp-2 text-sm font-semibold text-ink-800">
                      {item.titleVi}
                    </span>
                    <span className="shrink-0 text-xs font-bold text-ink-400">
                      {item.wordCount} từ · {item.readingMinutes}′
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <Card className="bg-ink-900 text-cream">
            <h2 className="text-2xl text-cream">Cần chấm bài Writing và luyện Speaking?</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-200">
              Hai kỹ năng này không tự chấm được. Bài viết cần người đọc và chỉ ra chỗ nào là lỗi
              dịch từ tiếng Việt; phần nói cần người nghe và sửa trọng âm. Trung tâm có lớp và buổi
              kèm 1–1 riêng cho hai phần đó.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={href('/classes')} variant="pop">
                {t('nav.classes')}
              </ButtonLink>
              <ButtonLink
                href={href('/contact')}
                className="border-2 border-cream/30 bg-transparent text-cream hover:bg-cream/10"
              >
                {t('action.consult')}
              </ButtonLink>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}
