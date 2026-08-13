import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Award, CalendarDays, GraduationCap, Lightbulb, Star, Trophy } from 'lucide-react';

import { formatPrice, translate } from '@tracy/localization';
import { Badge, ButtonLink, Card, LevelBadge } from '@tracy/ui';

import { db } from '@/lib/db';
import { parseArray } from '@/lib/json';
import { resolveLocale } from '@/lib/session';

export const dynamic = 'force-dynamic';

const WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const formatMinutes = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const teacher = await db.teacherProfile.findUnique({
    where: { slug },
    include: { user: { select: { name: true } } },
  });
  if (!teacher) return { title: 'Giáo viên' };
  return { title: teacher.user.name, description: teacher.headlineVi };
}

export default async function TeacherPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const resolved = await params;
  const locale = await resolveLocale(params);
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const teacher = await db.teacherProfile.findUnique({
    where: { slug: resolved.slug },
    include: {
      user: { select: { name: true } },
      courses: { where: { status: 'PUBLISHED' }, orderBy: { displayOrder: 'asc' } },
      availability: { orderBy: [{ weekday: 'asc' }, { startMin: 'asc' }] },
      classGroups: {
        where: { status: { in: ['OPEN', 'RUNNING'] } },
        include: { course: { select: { titleVi: true, slug: true } } },
      },
    },
  });
  if (!teacher || teacher.status !== 'PUBLISHED') notFound();

  const education = parseArray<{ qualification: string; institution: string; year: string }>(
    teacher.educationVi,
  );
  const certificates = parseArray<{ name: string; issuer: string; year: string }>(
    teacher.certificatesVi,
  );
  const achievements = parseArray<string>(teacher.achievementsVi);
  const methods = parseArray<string>(teacher.methodsVi);
  const specialties = parseArray<string>(teacher.specialties);

  return (
    <div className="py-10">
      <div className="container-page">
        <Link
          href={href('/teachers')}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-500 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('nav.teachers')}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="space-y-6">
            <header className="flex flex-wrap items-start gap-5">
              <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-blob bg-gradient-to-br from-brand-400 to-coral-400 font-display text-3xl font-extrabold text-white">
                {teacher.user.name.split(' ').slice(-1)[0].slice(0, 1)}
              </span>
              <div className="min-w-0">
                <h1 className="text-3xl sm:text-4xl">{teacher.user.name}</h1>
                <p className="mt-1 text-base font-semibold text-brand-600">{teacher.headlineVi}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-ink-500">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-sun-400 text-sun-400" />
                    {teacher.rating.toFixed(1)} · {teacher.reviewCount} đánh giá
                  </span>
                  <span>{teacher.yearsExperience} năm kinh nghiệm</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {specialties.map((tag) => (
                    <Badge key={tag} accent="coral">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </header>

            <Card>
              <h2 className="text-xl">Giới thiệu</h2>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-ink-700">{teacher.bioVi}</p>
            </Card>

            {methods.length ? (
              <Card className="border-brand-200 bg-brand-50/60">
                <h2 className="flex items-center gap-2 text-xl">
                  <Lightbulb className="h-5 w-5 text-brand-600" />
                  Cách dạy
                </h2>
                <ul className="mt-4 space-y-2">
                  {methods.map((method) => (
                    <li key={method} className="flex items-start gap-2 text-sm leading-relaxed text-ink-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                      {method}
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            <div className="grid gap-5 sm:grid-cols-2">
              {education.length ? (
                <Card>
                  <h2 className="flex items-center gap-2 text-base">
                    <GraduationCap className="h-4 w-4 text-teal-600" />
                    Học vấn
                  </h2>
                  <ul className="mt-3 space-y-3">
                    {education.map((row) => (
                      <li key={row.qualification} className="text-sm">
                        <p className="font-bold text-ink-900">{row.qualification}</p>
                        <p className="text-ink-500">
                          {row.institution} · {row.year}
                        </p>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}

              {certificates.length ? (
                <Card>
                  <h2 className="flex items-center gap-2 text-base">
                    <Award className="h-4 w-4 text-sun-600" />
                    Chứng chỉ
                  </h2>
                  <ul className="mt-3 space-y-3">
                    {certificates.map((row) => (
                      <li key={row.name} className="text-sm">
                        <p className="font-bold text-ink-900">{row.name}</p>
                        <p className="text-ink-500">
                          {row.issuer} · {row.year}
                        </p>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </div>

            {achievements.length ? (
              <Card className="border-sun-200 bg-sun-50/60">
                <h2 className="flex items-center gap-2 text-base">
                  <Trophy className="h-4 w-4 text-sun-600" />
                  Thành tích
                </h2>
                <ul className="mt-3 space-y-2">
                  {achievements.map((row) => (
                    <li key={row} className="flex items-start gap-2 text-sm text-ink-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sun-500" aria-hidden="true" />
                      {row}
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {teacher.courses.length ? (
              <div>
                <h2 className="text-2xl">Khoá học phụ trách</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {teacher.courses.map((course) => (
                    <Link key={course.id} href={href(`/courses/${course.slug}`)}>
                      <Card interactive>
                        <div className="flex items-center gap-2">
                          <LevelBadge level={course.cefrFrom} />
                          <span className="text-ink-300">→</span>
                          <LevelBadge level={course.cefrTo} />
                        </div>
                        <h3 className="mt-2 text-base leading-snug">{course.titleVi}</h3>
                        <p className="mt-2 text-sm font-bold text-coral-600">
                          {formatPrice(course.priceVnd, locale)}
                        </p>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <Card>
              <h2 className="text-base">Đặt buổi học</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                Buổi đầu tiên là buổi kiểm tra trình độ và thiết kế lộ trình — miễn phí, không ràng
                buộc.
              </p>
              <ButtonLink
                href={href(`/contact?teacher=${teacher.slug}`)}
                size="lg"
                className="mt-4 w-full"
              >
                {t('action.bookTrial')}
              </ButtonLink>
            </Card>

            {teacher.availability.length ? (
              <Card>
                <h2 className="flex items-center gap-2 text-base">
                  <CalendarDays className="h-4 w-4 text-brand-500" />
                  Lịch rảnh hằng tuần
                </h2>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {teacher.availability.map((slot) => (
                    <li key={slot.id} className="flex items-center justify-between gap-2 rounded-xl bg-ink-50 px-3 py-1.5">
                      <span className="font-semibold text-ink-700">{WEEKDAYS[slot.weekday]}</span>
                      <span className="font-mono text-xs text-ink-500">
                        {formatMinutes(slot.startMin)}–{formatMinutes(slot.endMin)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-ink-400">
                  Ngoài các khung trên vẫn có thể sắp xếp — hãy ghi thời gian bạn rảnh khi đăng ký
                  tư vấn.
                </p>
              </Card>
            ) : null}

            {teacher.classGroups.length ? (
              <Card>
                <h2 className="text-base">Lớp đang dạy</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {teacher.classGroups.map((group) => (
                    <li key={group.id} className="rounded-2xl bg-ink-50 px-3 py-2">
                      <Link href={href(`/courses/${group.course.slug}`)} className="font-bold text-ink-800 hover:text-brand-700">
                        {group.course.titleVi}
                      </Link>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {group.code} · {group.scheduleVi}
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
