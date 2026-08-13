import Link from 'next/link';
import { AlertTriangle, ArrowRight, MessageSquare, TrendingUp, Users, Volume2 } from 'lucide-react';

import { formatNumber, translate } from '@tracy/localization';
import { Badge, ButtonLink, Card, DataTable, ProgressBar, Stat, StatusBadge, Td } from '@tracy/ui';

import { db } from '@/lib/db';
import { studyDay } from '@/lib/progress';
import { resolveLocale } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function AdminOverview({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;
  const today = studyDay();

  const [
    students,
    teachers,
    newLeads,
    activeToday,
    words,
    wordsWithAudio,
    wordsWithMeaning,
    listening,
    reading,
    exercises,
    lessons,
    draftLessons,
    recentLeads,
    recentAudit,
    enrollments,
    classes,
  ] = await Promise.all([
    db.user.count({ where: { role: 'STUDENT' } }),
    db.user.count({ where: { role: 'TEACHER' } }),
    db.consultationRequest.count({ where: { status: 'NEW' } }),
    db.studyDay.count({ where: { day: today } }),
    db.vocabularyItem.count(),
    db.vocabularyItem.count({ where: { audioPath: { not: '' } } }),
    db.vocabularyItem.count({ where: { meaningVi: { not: '' } } }),
    db.listeningItem.count(),
    db.readingItem.count(),
    db.exercise.count(),
    db.lesson.count(),
    db.lesson.count({ where: { status: 'DRAFT' } }),
    db.consultationRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 6 }),
    db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { user: { select: { name: true } } },
    }),
    db.enrollment.count(),
    db.classGroup.count({ where: { status: { in: ['OPEN', 'RUNNING'] } } }),
  ]);

  // Coverage gaps worth an administrator's attention, stated plainly rather than hidden.
  const gaps = [
    {
      label: 'Từ chưa có bản thu của người thật',
      value: words - wordsWithAudio,
      total: words,
      hintVi: 'Chạy lại giai đoạn 5 của quy trình nhập liệu để lấy thêm bản thu từ Wikimedia Commons.',
      tone: 'warning' as const,
    },
    {
      label: 'Từ chưa có nghĩa tiếng Việt',
      value: words - wordsWithMeaning,
      total: words,
      hintVi: 'Những từ này chỉ có định nghĩa tiếng Anh. Có thể bổ sung tay trong mục Từ vựng.',
      tone: 'warning' as const,
    },
    {
      label: 'Bài học đang ở bản nháp',
      value: draftLessons,
      total: lessons,
      hintVi: 'Bản nháp không hiển thị cho học viên.',
      tone: 'info' as const,
    },
  ].filter((gap) => gap.value > 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat accent="brand" icon={<Users className="h-5 w-5" />} value={formatNumber(students, locale)} label="học viên" />
        <Stat accent="coral" icon={<MessageSquare className="h-5 w-5" />} value={newLeads} label="yêu cầu tư vấn mới" />
        <Stat accent="teal" icon={<TrendingUp className="h-5 w-5" />} value={activeToday} label="học viên học hôm nay" />
        <Stat accent="sun" icon={<Volume2 className="h-5 w-5" />} value={formatNumber(wordsWithAudio, locale)} label="từ có bản thu" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-400">Từ vựng</p>
          <p className="mt-1 font-display text-2xl font-extrabold">{formatNumber(words, locale)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-400">Bài nghe / đọc</p>
          <p className="mt-1 font-display text-2xl font-extrabold">
            {formatNumber(listening, locale)} / {formatNumber(reading, locale)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-400">Bài tập</p>
          <p className="mt-1 font-display text-2xl font-extrabold">{formatNumber(exercises, locale)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-400">Ghi danh / lớp mở</p>
          <p className="mt-1 font-display text-2xl font-extrabold">
            {enrollments} / {classes}
          </p>
        </Card>
      </div>

      {gaps.length ? (
        <Card>
          <h2 className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-sun-600" />
            Chỗ còn thiếu
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Những con số này được hiển thị thẳng thay vì giấu đi — biết chỗ nào mỏng thì mới bổ sung
            được.
          </p>
          <div className="mt-5 space-y-4">
            {gaps.map((gap) => (
              <div key={gap.label}>
                <ProgressBar
                  value={100 - (gap.value / Math.max(gap.total, 1)) * 100}
                  accent={gap.tone === 'warning' ? 'sun' : 'brand'}
                  label={`${gap.label}: ${formatNumber(gap.value, locale)}`}
                />
                <p className="mt-1 text-xs text-ink-500">{gap.hintVi}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg">Yêu cầu tư vấn gần đây</h2>
            <Link href={href('/admin/consultations')} className="text-sm font-bold text-brand-600 hover:underline">
              {t('action.viewAll')}
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href={href(`/admin/consultations?id=${lead.id}`)}
                className="flex items-center justify-between gap-3 rounded-2xl bg-ink-50 px-3 py-2.5 hover:bg-brand-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-ink-900">{lead.name}</span>
                  <span className="block truncate text-xs text-ink-500">
                    {lead.phone} · {lead.goal || 'chưa ghi mục tiêu'}
                  </span>
                </span>
                <StatusBadge status={lead.status} label={t(`status.${lead.status}`)} />
              </Link>
            ))}
            {!recentLeads.length ? (
              <p className="text-sm text-ink-500">Chưa có yêu cầu nào.</p>
            ) : null}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg">Thay đổi gần đây</h2>
            <Link href={href('/admin/audit')} className="text-sm font-bold text-brand-600 hover:underline">
              {t('action.viewAll')}
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {recentAudit.map((entry) => (
              <li key={entry.id} className="flex items-start gap-2 text-sm">
                <Badge accent="ink">{entry.action}</Badge>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-ink-700">{entry.summary}</span>
                  <span className="text-xs text-ink-400">
                    {entry.user?.name ?? 'hệ thống'} ·{' '}
                    {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(entry.createdAt)}
                  </span>
                </span>
              </li>
            ))}
            {!recentAudit.length ? <li className="text-sm text-ink-500">Chưa có thay đổi nào.</li> : null}
          </ul>
        </Card>
      </div>

      <Card className="bg-brand-50">
        <h2 className="text-lg">Bắt đầu từ đâu</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ButtonLink href={href('/admin/consultations')} variant="outline">
            Xử lý yêu cầu tư vấn
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href={href('/admin/lessons')} variant="outline">
            Soạn bài học
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href={href('/admin/import')} variant="outline">
            Nhập dữ liệu hàng loạt
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
