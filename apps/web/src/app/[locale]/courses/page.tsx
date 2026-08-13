import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, GraduationCap } from 'lucide-react';

import { SEGMENTS } from '@tracy/curriculum';
import { formatPrice, pick, translate } from '@tracy/localization';
import { Badge, Card, EmptyState, Eyebrow, LevelBadge, SectionHeading, cn } from '@tracy/ui';

import { db } from '@/lib/db';
import { parseArray } from '@/lib/json';
import { resolveLocale } from '@/lib/session';

export const metadata: Metadata = { title: 'Khoá học' };
export const dynamic = 'force-dynamic';

export default async function CoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ track?: string; segment?: string; free?: string }>;
}) {
  const locale = await resolveLocale(params);
  const query = await searchParams;
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const [tracks, courses] = await Promise.all([
    db.track.findMany({ where: { status: 'PUBLISHED' }, orderBy: { displayOrder: 'asc' } }),
    db.course.findMany({
      where: {
        status: 'PUBLISHED',
        ...(query.track ? { track: { slug: query.track } } : {}),
        ...(query.free === '1' ? { isFree: true } : {}),
      },
      orderBy: { displayOrder: 'asc' },
      include: {
        track: true,
        teacher: { include: { user: { select: { name: true } } } },
        _count: { select: { modules: true } },
        modules: { select: { _count: { select: { lessons: true } } } },
      },
    }),
  ]);

  const filtered = query.segment
    ? courses.filter((course) => parseArray<string>(course.audience).includes(query.segment!))
    : courses;

  const build = (next: Record<string, string | undefined>) => {
    const merged = new URLSearchParams();
    const combined = { track: query.track, segment: query.segment, free: query.free, ...next };
    for (const [key, value] of Object.entries(combined)) if (value) merged.set(key, value);
    const search = merged.toString();
    return `${href('/courses')}${search ? `?${search}` : ''}`;
  };

  return (
    <>
      <section className="border-b-2 border-ink-100 bg-lavender py-12">
        <div className="container-page">
          <Eyebrow>
            <GraduationCap className="h-3.5 w-3.5" />
            {t('nav.courses')}
          </Eyebrow>
          <h1 className="mt-4 text-4xl">Lộ trình và khoá học</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-600">
            Mỗi khoá có mục tiêu đầu ra cụ thể và được xây từ học liệu thật. Khoá tự học miễn phí;
            khoá có giáo viên tính học phí theo buổi.
          </p>

          <div className="mt-6 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Link
                href={build({ track: undefined })}
                className={cn(
                  'rounded-full border-2 px-3 py-1 text-xs font-bold',
                  !query.track ? 'border-brand-400 bg-brand-100 text-brand-800' : 'border-ink-200 bg-white text-ink-600',
                )}
              >
                {t('common.all')}
              </Link>
              {tracks.map((track) => (
                <Link
                  key={track.slug}
                  href={build({ track: query.track === track.slug ? undefined : track.slug })}
                  className={cn(
                    'rounded-full border-2 px-3 py-1 text-xs font-semibold',
                    query.track === track.slug
                      ? 'border-brand-400 bg-brand-100 text-brand-800'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300',
                  )}
                >
                  {pick(locale, track.titleVi, track.titleEn)}
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {SEGMENTS.map((segment) => (
                <Link
                  key={segment}
                  href={build({ segment: query.segment === segment ? undefined : segment })}
                  className={cn(
                    'rounded-full border-2 px-3 py-1 text-xs font-semibold',
                    query.segment === segment
                      ? 'border-coral-400 bg-coral-100 text-coral-800'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-coral-300',
                  )}
                >
                  {t(`segment.${segment}`)}
                </Link>
              ))}
              <Link
                href={build({ free: query.free === '1' ? undefined : '1' })}
                className={cn(
                  'rounded-full border-2 px-3 py-1 text-xs font-bold',
                  query.free === '1'
                    ? 'border-teal-400 bg-teal-100 text-teal-800'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-teal-300',
                )}
              >
                Chỉ khoá miễn phí
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-page">
          {filtered.length ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((course) => {
                const lessons = course.modules.reduce((sum, module) => sum + module._count.lessons, 0);
                const skills = parseArray<string>(course.skills);
                const modes = parseArray<string>(course.deliveryModes);
                return (
                  <Link key={course.id} href={href(`/courses/${course.slug}`)} className="group">
                    <Card interactive className="flex h-full flex-col">
                      <div className="flex flex-wrap items-center gap-2">
                        <LevelBadge level={course.cefrFrom} />
                        {course.cefrTo !== course.cefrFrom ? (
                          <>
                            <span className="text-ink-300">→</span>
                            <LevelBadge level={course.cefrTo} />
                          </>
                        ) : null}
                        {course.isFree ? <Badge accent="teal">{t('common.free')}</Badge> : null}
                      </div>

                      <p className="mt-3 text-xs font-bold uppercase tracking-widest text-ink-400">
                        {pick(locale, course.track.titleVi, course.track.titleEn)}
                      </p>
                      <h2 className="mt-1 text-lg leading-snug">
                        {pick(locale, course.titleVi, course.titleEn)}
                      </h2>
                      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-600">
                        {course.subtitleVi || course.descriptionVi}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {skills.slice(0, 4).map((skill) => (
                          <span key={skill} className="rounded-full bg-ink-100 px-2 py-0.5 text-[0.7rem] font-semibold text-ink-600">
                            {t(`skill.${skill}`)}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 border-t-2 border-ink-100 pt-4 text-sm">
                        <div className="flex items-center justify-between font-semibold text-ink-500">
                          <span>
                            {course._count.modules} chương · {lessons} bài
                          </span>
                          <span className={cn('font-extrabold', course.isFree ? 'text-teal-700' : 'text-coral-600')}>
                            {formatPrice(course.priceVnd, locale)}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {modes.slice(0, 3).map((mode) => (
                            <span key={mode} className="rounded-full bg-brand-50 px-2 py-0.5 text-[0.68rem] font-semibold text-brand-700">
                              {t(`mode.${mode}`)}
                            </span>
                          ))}
                        </div>
                      </div>

                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-600">
                        {t('action.viewCourse')}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Không có khoá nào khớp bộ lọc"
              description="Thử bỏ bớt điều kiện lọc."
            />
          )}
        </div>
      </section>

      <section className="border-t-2 border-ink-100 bg-white py-12">
        <div className="container-page">
          <SectionHeading
            eyebrow="Lộ trình"
            title="Các nhánh của chương trình"
            lead="Chọn nhánh phù hợp với độ tuổi và mục tiêu của bạn."
            accent="coral"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tracks.map((track) => (
              <Link key={track.id} href={build({ track: track.slug })} className="group">
                <Card interactive className="h-full">
                  <h3 className="text-base leading-snug">{pick(locale, track.titleVi, track.titleEn)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">
                    {pick(locale, track.summaryVi, track.summaryEn)}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
