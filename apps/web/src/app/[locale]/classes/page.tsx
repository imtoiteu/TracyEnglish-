import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, CheckCircle2, GraduationCap, Users } from 'lucide-react';

import { LEARNING_FORMATS } from '@tracy/curriculum';
import { formatDate, formatPrice, translate } from '@tracy/localization';
import { Badge, ButtonLink, Card, Eyebrow, SectionHeading, accentStyles, cn } from '@tracy/ui';

import { ConsultationForm } from '@/components/site/consultation-form';
import { db } from '@/lib/db';
import { resolveLocale } from '@/lib/session';

export const metadata: Metadata = { title: 'Lớp học tại trung tâm và trực tuyến' };
export const dynamic = 'force-dynamic';

export default async function ClassesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const groups = await db.classGroup.findMany({
    where: { status: { in: ['OPEN', 'RUNNING'] } },
    orderBy: [{ status: 'asc' }, { startDate: 'asc' }],
    include: {
      course: { select: { slug: true, titleVi: true, cefrFrom: true, cefrTo: true } },
      teacher: { include: { user: { select: { name: true } } } },
      sessions: { orderBy: { startsAt: 'asc' }, take: 1 },
    },
  });

  return (
    <>
      <section className="border-b-2 border-ink-100 bg-lavender py-12">
        <div className="container-page">
          <Eyebrow accent="brand">
            <Users className="h-3.5 w-3.5" />
            {t('nav.classes')}
          </Eyebrow>
          <h1 className="mt-4 text-4xl">Học cùng giáo viên</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-600">
            Phần tự học trên nền tảng đã đủ để bạn tiến bộ về ngữ pháp, từ vựng, nghe và đọc. Lớp có
            giáo viên giải quyết đúng hai thứ mà tự học không làm được:{' '}
            <strong>chữa bài viết</strong> và <strong>sửa phát âm khi bạn nói</strong>.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-page">
          <SectionHeading eyebrow="Hình thức" title="Năm cách học" accent="brand" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {LEARNING_FORMATS.map((format) => {
              const styles = accentStyles(format.accent);
              return (
                <Card key={format.slug} className="flex h-full flex-col">
                  <span
                    className={cn(
                      'inline-flex h-10 w-10 items-center justify-center rounded-2xl',
                      styles.bg,
                      styles.text,
                    )}
                  >
                    <Users className="h-5 w-5" />
                  </span>
                  <h2 className="mt-3 text-base">{format.titleVi}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{format.summaryVi}</p>
                  <ul className="mt-3 space-y-1.5 text-xs text-ink-500">
                    {format.featuresVi.map((feature) => (
                      <li key={feature} className="flex items-start gap-1.5">
                        <CheckCircle2 className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', styles.text)} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y-2 border-ink-100 bg-white py-12">
        <div className="container-page">
          <SectionHeading
            eyebrow="Lịch khai giảng"
            title="Lớp đang mở"
            lead="Mỗi lớp có một buổi học thử miễn phí trước khi bạn quyết định."
            accent="coral"
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => {
              const full = group.enrolled >= group.capacity;
              return (
                <Card key={group.id} className="flex h-full flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge accent="brand">{t(`mode.${group.mode}`)}</Badge>
                    <Badge accent={group.format === 'ONE_TO_ONE' ? 'coral' : 'sun'}>
                      {t(`mode.${group.format}`)}
                    </Badge>
                    <Badge accent={full ? 'rose' : 'teal'}>
                      {group.enrolled}/{group.capacity} chỗ
                    </Badge>
                  </div>

                  <h3 className="mt-3 text-lg leading-snug">
                    <Link href={href(`/courses/${group.course.slug}`)} className="hover:text-brand-700">
                      {group.course.titleVi}
                    </Link>
                  </h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-widest text-ink-400">
                    {group.code} · {group.course.cefrFrom}–{group.course.cefrTo}
                  </p>

                  <ul className="mt-3 flex-1 space-y-1.5 text-sm text-ink-600">
                    <li className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-brand-500" />
                      {group.scheduleVi}
                    </li>
                    {group.teacher ? (
                      <li className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-brand-500" />
                        <Link
                          href={href(`/teachers/${group.teacher.slug}`)}
                          className="hover:text-brand-700"
                        >
                          {group.teacher.user.name}
                        </Link>
                      </li>
                    ) : null}
                    {group.room ? (
                      <li className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-brand-500" />
                        {group.room}
                      </li>
                    ) : null}
                    {group.sessions[0] ? (
                      <li className="text-xs text-ink-400">
                        Buổi đầu: {formatDate(group.sessions[0].startsAt, locale)}
                      </li>
                    ) : null}
                  </ul>

                  <p className="mt-4 text-lg font-extrabold text-coral-600">
                    {formatPrice(group.priceVnd, locale)}
                  </p>
                  <ButtonLink
                    href={href(`/contact?course=${group.course.slug}`)}
                    className="mt-3 w-full"
                    variant={full ? 'outline' : 'primary'}
                  >
                    {full ? 'Đăng ký danh sách chờ' : t('action.bookTrial')}
                  </ButtonLink>
                </Card>
              );
            })}
          </div>
          {!groups.length ? (
            <p className="mt-8 text-center text-sm text-ink-500">
              Hiện chưa có lớp nào đang mở. Hãy để lại thông tin để được báo khi có lớp mới.
            </p>
          ) : null}
        </div>
      </section>

      <section className="py-12">
        <div className="container-page grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow={t('action.consult')}
              title="Chưa biết chọn lớp nào?"
              lead="Để lại thông tin, giáo viên sẽ gọi lại trong 24 giờ, xếp trình độ và gợi ý lớp phù hợp."
              accent="teal"
            />
          </div>
          <Card>
            <ConsultationForm source="classes-page" />
          </Card>
        </div>
      </section>
    </>
  );
}
