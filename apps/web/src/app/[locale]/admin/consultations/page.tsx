import Link from 'next/link';
import { Phone } from 'lucide-react';

import { translate } from '@tracy/localization';
import { Badge, Card, DataTable, EmptyState, StatusBadge, Td, cn } from '@tracy/ui';

import { ConsultationEditor } from '@/components/admin/consultation-editor';
import { db } from '@/lib/db';
import { requireRole, resolveLocale } from '@/lib/session';

export const dynamic = 'force-dynamic';

const STATUSES = ['NEW', 'CONTACTED', 'SCHEDULED', 'ENROLLED', 'CLOSED'] as const;

/**
 * The consultation pipeline.
 *
 * This is the page the centre actually lives in, so it is a work queue rather than a table:
 * filter by status, open a lead inline, record what happened, move it along. Every change is
 * written to the audit log so a handover between staff has a paper trail.
 */
export default async function ConsultationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; id?: string }>;
}) {
  const locale = await resolveLocale(params);
  // Authorisation is enforced here, not only in the layout: a layout redirect does
  // not stop this page from rendering, so the check has to precede every query.
  await requireRole(locale, 'ADMIN', `/${locale}/admin/consultations`);
  const query = await searchParams;
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const status = STATUSES.includes(query.status as never) ? query.status : undefined;

  const [rows, counts, staff, selected] = await Promise.all([
    db.consultationRequest.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { assignedTo: { select: { name: true } } },
    }),
    Promise.all(
      STATUSES.map(async (value) => ({
        status: value,
        count: await db.consultationRequest.count({ where: { status: value } }),
      })),
    ),
    db.user.findMany({ where: { role: { in: ['TEACHER', 'ADMIN'] } }, select: { id: true, name: true } }),
    query.id
      ? db.consultationRequest.findUnique({ where: { id: query.id } })
      : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-ink-900">{t('admin.consultations')}</h2>
        <p className="mt-1 text-sm text-ink-500">
          Mỗi dòng là một người đã để lại số điện thoại. Gọi lại trong 24 giờ là cam kết ghi trên
          website.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={href('/admin/consultations')}
          className={cn(
            'rounded-full border-2 px-3 py-1 text-xs font-bold',
            !status ? 'border-brand-400 bg-brand-100 text-brand-800' : 'border-ink-200 bg-white text-ink-600',
          )}
        >
          Tất cả ({counts.reduce((sum, row) => sum + row.count, 0)})
        </Link>
        {counts.map((row) => (
          <Link
            key={row.status}
            href={href(`/admin/consultations?status=${row.status}`)}
            className={cn(
              'rounded-full border-2 px-3 py-1 text-xs font-bold',
              status === row.status
                ? 'border-brand-400 bg-brand-100 text-brand-800'
                : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300',
            )}
          >
            {t(`status.${row.status}`)} ({row.count})
          </Link>
        ))}
      </div>

      {selected ? (
        <ConsultationEditor
          request={{
            id: selected.id,
            name: selected.name,
            phone: selected.phone,
            email: selected.email,
            goal: selected.goal,
            currentLevel: selected.currentLevel,
            segment: selected.segment,
            preferredMode: selected.preferredMode,
            preferredTime: selected.preferredTime,
            message: selected.message,
            courseSlug: selected.courseSlug,
            source: selected.source,
            status: selected.status,
            internalNotes: selected.internalNotes,
            assignedToId: selected.assignedToId ?? '',
          }}
          staff={staff}
          locale={locale}
        />
      ) : null}

      {rows.length ? (
        <DataTable
          caption="Yêu cầu tư vấn"
          columns={['Người liên hệ', 'Mục tiêu', 'Hình thức', 'Phụ trách', 'Trạng thái', '']}
        >
          {rows.map((row) => (
            <tr key={row.id} className={cn('hover:bg-brand-50/50', query.id === row.id && 'bg-brand-50')}>
              <Td>
                <span className="block font-bold text-ink-900">{row.name}</span>
                <a
                  href={`tel:${row.phone}`}
                  className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  {row.phone}
                </a>
                {row.email ? <span className="block text-xs text-ink-400">{row.email}</span> : null}
              </Td>
              <Td>
                <span className="block text-sm">{row.goal || '—'}</span>
                <span className="text-xs text-ink-400">
                  {row.currentLevel ? `Trình độ: ${row.currentLevel}` : ''}
                  {row.courseSlug ? ` · ${row.courseSlug}` : ''}
                </span>
              </Td>
              <Td>
                <Badge accent="ink">{t(`mode.${row.preferredMode}`)}</Badge>
                {row.preferredTime ? (
                  <span className="mt-1 block text-xs text-ink-400">{row.preferredTime}</span>
                ) : null}
              </Td>
              <Td className="text-sm text-ink-600">{row.assignedTo?.name ?? '—'}</Td>
              <Td>
                <StatusBadge status={row.status} label={t(`status.${row.status}`)} />
              </Td>
              <Td className="text-right">
                <Link
                  href={href(`/admin/consultations?id=${row.id}${status ? `&status=${status}` : ''}`)}
                  className="rounded-xl bg-ink-100 px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-brand-100"
                >
                  Mở
                </Link>
              </Td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="Không có yêu cầu nào ở trạng thái này" />
      )}
    </div>
  );
}
