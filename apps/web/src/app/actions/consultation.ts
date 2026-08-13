'use server';

import { revalidatePath } from 'next/cache';

import { isValidEmail, isValidPhone, normalisePhone } from '@/lib/auth';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

/**
 * Consultation requests.
 *
 * The one flow on the site that must never lose data: someone typing their phone number
 * into a form is the centre's actual lead pipeline. Validation is therefore forgiving about
 * formatting (0912 345 678, +84912345678 and 0912-345-678 all pass) and strict about the
 * two fields that matter — a name and a reachable number.
 */

export type ConsultationState = { ok?: boolean; error?: string; field?: string } | null;

export async function submitConsultation(
  _prev: ConsultationState,
  formData: FormData,
): Promise<ConsultationState> {
  const name = String(formData.get('name') ?? '').trim();
  const phoneRaw = String(formData.get('phone') ?? '');
  const email = String(formData.get('email') ?? '').trim();

  if (name.length < 2) return { error: 'Vui lòng nhập họ tên.', field: 'name' };
  if (!isValidPhone(phoneRaw)) {
    return { error: 'Số điện thoại chưa đúng định dạng (ví dụ: 0912 345 678).', field: 'phone' };
  }
  if (email && !isValidEmail(email)) return { error: 'Email chưa đúng định dạng.', field: 'email' };

  const user = await getCurrentUser();

  await db.consultationRequest.create({
    data: {
      name,
      phone: normalisePhone(phoneRaw),
      email,
      goal: String(formData.get('goal') ?? '').slice(0, 200),
      currentLevel: String(formData.get('currentLevel') ?? '').slice(0, 40),
      segment: String(formData.get('segment') ?? 'ADULT'),
      preferredMode: String(formData.get('preferredMode') ?? 'ONLINE'),
      preferredTime: String(formData.get('preferredTime') ?? '').slice(0, 160),
      message: String(formData.get('message') ?? '').slice(0, 2000),
      courseSlug: String(formData.get('courseSlug') ?? '').slice(0, 120),
      source: String(formData.get('source') ?? 'website').slice(0, 60),
      userId: user?.id ?? null,
    },
  });

  revalidatePath('/[locale]/admin/consultations', 'page');
  return { ok: true };
}
