import Link from 'next/link';
import { CalendarDays, GraduationCap, TrendingUp, Users } from 'lucide-react';

import { formatDate, translate } from '@tracy/localization';
import { Badge, ButtonLink, Card, DataTable, EmptyState, ProgressBar, Stat, Td } from '@tracy/ui';

import { db } from '@/lib/db';
import { requireRole, resolveLocale } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * The teacher area.
 *
 * A teacher needs three things and nothing else: who is in my classes, when am I teaching,
 * and who is falling behind. This page answers all three above the fold.
 */
export default async function TeacherHome({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const user = await requireRole(locale, 'TEACHER', `/${locale}/teacher`);
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const profile = await db.teacherProfile.findUnique({
    where: { userId: user.id },
    include: {
      classGroups: {
        include: {
          course: { select: { titleVi: true, slug: true } },
          enrollments: { include: { student: { select: { id: true, name: true, email: true } } } },
          sessions: { where: { startsAt: { gte: new Date() } }, orderBy: { startsAt: 'asc' }, take: 3 },
        },
      },
      courses: { select: { id: true, slug: true, titleVi: true } },
    },
  });

  // An administrator can open this page too; they simply have no teaching profile.
  if (!profile) {
    return (
      <div className="container-page py-12">
        <EmptyState
          title="Tài khoản này chưa gắn với hồ sơ giáo viên"
          description="Quản trị viên có thể tạo hồ sơ giáo viên trong mục Giáo viên của bảng quản trị."
          action={
            user.role === 'ADMIN' ? (
              <ButtonLink href={href('/admin/teachers')}>{t('admin.teachers')}</ButtonLink>
            ) : undefined
          }
        />
      </div>
    );
  }

  const studentIds = profile.classGroups.flatMap((group) =>
    group.enrollments.map((enrollment) => enrollment.studentId),
  );
  const courseIds = profile.courses.map((course) => course.id);

  const [progressRows, upcoming, attempts] = await Promise.all([
    courseIds.length && studentIds.length
      ? db.enrollment.findMany({
          where: { userId: { in: studentIds }, courseId: { in: courseIds } },
          include: {
            user: { select: { name: true, email: true } },
            course: { select: { titleVi: true } },
          },
          orderBy: { progress: 'asc' },
          take: 20,
        })
      : Promise.resolve([]),
    db.classSession.findMany({
      where: { classGroup: { teacherId: profile.id }, startsAt: { gte: new Date() } },
      orderBy: { startsAt: 'asc' },
      take: 8,
      include: { classGroup: { select: { code: true, titleVi: true, mode: true } } },
    }),
    studentIds.length
      ? db.exerciseAttempt.groupBy({
          by: ['userId'],
          where: { userId: { in: studentIds } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);

  const totalStudents = new Set(studentIds).size;
  const attemptsByUser = new Map(attempts.map((row) => [row.userId, row._count._all]));

  return (
    <div className="py-10">
      <div className="container-page space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
              {t('nav.teacherArea')}
            </p>
            <h1 className="mt-1 text-3xl">{user.name}</h1>
            <p className="mt-1 text-sm text-ink-500">{profile.headlineVi}</p>
          </div>
          <ButtonLink href={href(`/teachers/${profile.slug}`)} variant="outline">
            Xem hồ sơ công khai
          </ButtonLink>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat accent="brand" icon={<Users className="h-5 w-5" />} value={totalStudents} label="học viên" />
          <Stat accent="coral" icon={<GraduationCap className="h-5 w-5" />} value={profile.classGroups.length} label="lớp phụ trách" />
          <Stat accent="teal" icon={<CalendarDays className="h-5 w-5" />} value={upcoming.length} label="buổi sắp tới" />
          <Stat accent="sun" icon={<TrendingUp className="h-5 w-5" />} value={profile.courses.length} label="khoá phụ trách" />
        </div>

        <section>
          <h2 className="text-2xl">Lịch dạy sắp tới</h2>
          {upcoming.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {upcoming.map((session) => (
                <Card key={session.id}>
                  <Badge accent="brand">{t(`mode.${session.classGroup.mode}`)}</Badge>
                  <p className="mt-2 font-bold text-ink-900">{session.classGroup.code}</p>
                  <p className="mt-0.5 text-sm text-ink-600">{session.topicVi || session.classGroup.titleVi}</p>
                  <p className="mt-2 text-xs font-semibold text-ink-500">
                    {formatDate(session.startsAt, locale)} ·{' '}
                    {new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(session.startsAt)}
                  </p>
                  {session.meetingUrl ? (
                    <a
                      href={session.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs font-bold text-brand-600 hover:underline"
                    >
                      Vào lớp trực tuyến
                    </a>
                  ) : null}
                </Card>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-500">Chưa có buổi học nào được xếp lịch.</p>
          )}
        </section>

        <section>
          <h2 className="text-2xl">Lớp của tôi</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {profile.classGroups.map((group) => (
              <Card key={group.id}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg">{group.code}</h3>
                  <Badge accent={group.status === 'OPEN' ? 'teal' : 'ink'}>{group.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-ink-600">{group.course.titleVi}</p>
                <p className="mt-1 text-xs text-ink-400">{group.scheduleVi}</p>
                <p className="mt-3 text-sm font-bold text-ink-700">
                  {group.enrollments.length}/{group.capacity} học viên
                </p>
                {group.enrollments.length ? (
                  <ul className="mt-2 space-y-1 text-sm text-ink-600">
                    {group.enrollments.slice(0, 6).map((enrollment) => (
                      <li key={enrollment.id} className="truncate">
                        {enrollment.student.name}
                      </li>
                    ))}
                    {group.enrollments.length > 6 ? (
                      <li className="text-xs text-ink-400">…và {group.enrollments.length - 6} người khác</li>
                    ) : null}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-ink-400">Chưa có học viên ghi danh.</p>
                )}
              </Card>
            ))}
            {!profile.classGroups.length ? (
              <p className="text-sm text-ink-500">Bạn chưa được phân lớp nào.</p>
            ) : null}
          </div>
        </section>

        <section>
          <h2 className="text-2xl">Học viên cần chú ý</h2>
          <p className="mt-1 text-sm text-ink-500">
            Sắp theo tiến độ thấp nhất — đây là những người nên được nhắc trước.
          </p>
          {progressRows.length ? (
            <div className="mt-5">
              <DataTable caption="Tiến độ học viên" columns={['Học viên', 'Khoá', 'Tiến độ', 'Số câu đã làm']}>
                {progressRows.map((row) => (
                  <tr key={row.id}>
                    <Td>
                      <span className="block font-bold text-ink-900">{row.user.name}</span>
                      <span className="text-xs text-ink-400">{row.user.email}</span>
                    </Td>
                    <Td className="text-sm">{row.course.titleVi}</Td>
                    <Td className="w-48">
                      <ProgressBar value={row.progress} accent={row.progress < 30 ? 'sun' : 'teal'} />
                    </Td>
                    <Td className="text-sm">{attemptsByUser.get(row.userId) ?? 0}</Td>
                  </tr>
                ))}
              </DataTable>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-500">
              Chưa có học viên nào ghi danh vào khoá bạn phụ trách.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
