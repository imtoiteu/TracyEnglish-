'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { CheckCircle2 } from 'lucide-react';

import { CEFR_LEVELS, LEARNING_FORMATS, SEGMENTS } from '@tracy/curriculum';
import { Alert, Button, Card, Field, Input, Select, Textarea } from '@tracy/ui';

import { submitConsultation, type ConsultationState } from '@/app/actions/consultation';
import { useI18n } from '@/lib/i18n';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Đang gửi…' : label}
    </Button>
  );
}

/**
 * The enquiry form.
 *
 * Only two fields are required — name and phone — because every extra required field costs
 * conversions, and the centre can ask the rest on the call. Everything else is optional but
 * offered, since a lead who tells you their goal and level up front saves a call.
 */
export function ConsultationForm({
  courseSlug,
  teacherSlug,
  source = 'website',
}: {
  courseSlug?: string;
  teacherSlug?: string;
  source?: string;
}) {
  const { t } = useI18n();
  const [state, action] = useActionState<ConsultationState, FormData>(submitConsultation, null);

  if (state?.ok) {
    return (
      <Card className="border-teal-200 bg-teal-50 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-500 text-white">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h3 className="mt-4 text-xl">{t('consult.submitted')}</h3>
        <p className="mt-2 text-sm text-teal-800">
          Giáo viên sẽ gọi trong vòng 24 giờ làm việc. Nếu gấp, bạn có thể gọi trực tiếp số hotline
          ở chân trang.
        </p>
      </Card>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="source" value={source} />
      {courseSlug ? <input type="hidden" name="courseSlug" value={courseSlug} /> : null}
      {teacherSlug ? <input type="hidden" name="message" value={`Quan tâm giáo viên: ${teacherSlug}`} /> : null}

      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('common.name')} htmlFor="c-name" required>
          <Input id="c-name" name="name" required autoComplete="name" placeholder="Nguyễn Văn A" />
        </Field>
        <Field label={t('common.phone')} htmlFor="c-phone" required hint="Dùng để gọi lại tư vấn.">
          <Input id="c-phone" name="phone" type="tel" required autoComplete="tel" placeholder="0912 345 678" />
        </Field>
      </div>

      <Field label={t('common.email')} htmlFor="c-email">
        <Input id="c-email" name="email" type="email" autoComplete="email" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('auth.segment')} htmlFor="c-segment">
          <Select id="c-segment" name="segment" defaultValue="ADULT">
            {SEGMENTS.map((segment) => (
              <option key={segment} value={segment}>
                {t(`segment.${segment}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('consult.currentLevel')} htmlFor="c-level">
          <Select id="c-level" name="currentLevel" defaultValue="">
            <option value="">Chưa rõ</option>
            <option value="Mất gốc">Mất gốc</option>
            {CEFR_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label={t('consult.goal')} htmlFor="c-goal">
        <Input id="c-goal" name="goal" placeholder="Ví dụ: IELTS 6.5 để du học" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('consult.preferredMode')} htmlFor="c-mode">
          <Select id="c-mode" name="preferredMode" defaultValue="ONLINE">
            {LEARNING_FORMATS.filter((format) => format.mode !== 'SELF_STUDY').map((format) => (
              <option key={format.mode} value={format.mode}>
                {format.titleVi}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('consult.preferredTime')} htmlFor="c-time">
          <Input id="c-time" name="preferredTime" placeholder="Ví dụ: tối thứ 3, 5" />
        </Field>
      </div>

      {!teacherSlug ? (
        <Field label={t('consult.message')} htmlFor="c-message">
          <Textarea id="c-message" name="message" rows={4} />
        </Field>
      ) : null}

      <Submit label={t('action.consult')} />

      <p className="text-center text-xs leading-relaxed text-ink-500">
        Thông tin của bạn chỉ dùng để tư vấn lộ trình học và không chia sẻ cho bên thứ ba.
      </p>
    </form>
  );
}
