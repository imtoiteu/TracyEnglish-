'use client';

import { Card, Badge, Button, Field, Select, Textarea } from '@tracy/ui';

import { updateConsultation } from '@/app/actions/admin';
import { useI18n } from '@/lib/i18n';

type Request = {
  id: string;
  name: string;
  phone: string;
  email: string;
  goal: string;
  currentLevel: string;
  segment: string;
  preferredMode: string;
  preferredTime: string;
  message: string;
  courseSlug: string;
  source: string;
  status: string;
  internalNotes: string;
  assignedToId: string;
};

const STATUSES = ['NEW', 'CONTACTED', 'SCHEDULED', 'ENROLLED', 'CLOSED'];

/**
 * The lead detail panel.
 *
 * Opens inline above the queue rather than on its own page, so a staff member can work
 * through several leads in a row without losing the list they were filtering.
 */
export function ConsultationEditor({
  request,
  staff,
  locale,
}: {
  request: Request;
  staff: { id: string; name: string }[];
  locale: string;
}) {
  const { t } = useI18n();

  return (
    <Card className="border-brand-300">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl">{request.name}</h3>
          <p className="mt-1 text-sm text-ink-600">
            <a href={`tel:${request.phone}`} className="font-bold text-brand-600 hover:underline">
              {request.phone}
            </a>
            {request.email ? ` · ${request.email}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge accent="ink">{t(`segment.${request.segment}`)}</Badge>
          <Badge accent="brand">{t(`mode.${request.preferredMode}`)}</Badge>
          {request.currentLevel ? <Badge accent="teal">{request.currentLevel}</Badge> : null}
        </div>
      </div>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-bold uppercase tracking-widest text-ink-400">Mục tiêu</dt>
          <dd className="mt-0.5 text-ink-800">{request.goal || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-widest text-ink-400">Thời gian rảnh</dt>
          <dd className="mt-0.5 text-ink-800">{request.preferredTime || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-widest text-ink-400">Khoá quan tâm</dt>
          <dd className="mt-0.5 text-ink-800">{request.courseSlug || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-widest text-ink-400">Nguồn</dt>
          <dd className="mt-0.5 text-ink-800">{request.source}</dd>
        </div>
        {request.message ? (
          <div className="sm:col-span-2">
            <dt className="text-xs font-bold uppercase tracking-widest text-ink-400">Lời nhắn</dt>
            <dd className="mt-0.5 rounded-2xl bg-ink-50 px-3 py-2 leading-relaxed text-ink-700">
              {request.message}
            </dd>
          </div>
        ) : null}
      </dl>

      <form action={updateConsultation} className="mt-6 space-y-4 border-t-2 border-ink-100 pt-5">
        <input type="hidden" name="id" value={request.id} />
        <input type="hidden" name="__locale" value={locale} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Trạng thái" htmlFor="status">
            <Select id="status" name="status" defaultValue={request.status}>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`status.${status}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Người phụ trách" htmlFor="assignedToId">
            <Select id="assignedToId" name="assignedToId" defaultValue={request.assignedToId}>
              <option value="">Chưa phân công</option>
              {staff.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Ghi chú nội bộ" htmlFor="internalNotes" hint="Học viên không nhìn thấy phần này.">
          <Textarea id="internalNotes" name="internalNotes" rows={4} defaultValue={request.internalNotes} />
        </Field>

        <Button type="submit">{t('action.save')}</Button>
      </form>
    </Card>
  );
}
