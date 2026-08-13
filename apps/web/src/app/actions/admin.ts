'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { db } from '@/lib/db';
import { findResource, type AdminField } from '@/lib/admin/resources';
import { getCurrentUser } from '@/lib/session';

/**
 * Admin write operations.
 *
 * One save/delete/duplicate path serves every resource, driven by the field declarations in
 * `resources.ts`. Two rules make that safe:
 *
 *   1.  Only fields declared for the resource are ever written. A crafted form post cannot
 *       set `role: ADMIN` on a course, or a column the registry does not list.
 *   2.  Every mutation is checked against the signed-in user's role and written to the
 *       audit log, so "who changed this lesson" always has an answer.
 */

export type AdminState = { ok?: boolean; error?: string } | null;

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') throw new Error('unauthorised');
  return user;
}

/** Convert one submitted form value into the shape the column expects. */
function coerce(field: AdminField, formData: FormData): unknown {
  const raw = formData.get(field.name);

  switch (field.type) {
    case 'boolean':
      return formData.get(field.name) === 'on' || raw === 'true';

    case 'number': {
      const value = Number(raw ?? 0);
      return Number.isFinite(value) ? value : 0;
    }

    case 'multiselect': {
      const values = formData.getAll(field.name).map(String).filter(Boolean);
      return JSON.stringify(values);
    }

    case 'jsonList': {
      // Authored as one item per line, stored as a JSON array.
      const lines = String(raw ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      return JSON.stringify(lines);
    }

    case 'json':
    case 'blocks': {
      const text = String(raw ?? '').trim();
      if (!text) return field.type === 'blocks' ? '[]' : '{}';
      try {
        // Round-trip so malformed JSON is rejected before it reaches the database.
        return JSON.stringify(JSON.parse(text));
      } catch {
        throw new Error(`Trường “${field.label}” không phải JSON hợp lệ.`);
      }
    }

    case 'date': {
      const text = String(raw ?? '').trim();
      return text ? new Date(text) : null;
    }

    case 'relation': {
      const text = String(raw ?? '').trim();
      return text || null;
    }

    default:
      return String(raw ?? '');
  }
}

export async function saveResource(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  let locale = 'vi';
  let resourceKey = '';
  try {
    const user = await requireAdmin();
    locale = String(formData.get('__locale') ?? 'vi');
    resourceKey = String(formData.get('__resource') ?? '');
    const id = String(formData.get('__id') ?? '');

    const resource = findResource(resourceKey);
    if (!resource) return { error: 'Không tìm thấy loại nội dung.' };

    const data: Record<string, unknown> = {};
    for (const field of resource.fields) {
      if (field.readOnly) continue;
      data[field.name] = coerce(field, formData);
    }

    for (const field of resource.fields) {
      if (field.required && !String(data[field.name] ?? '').trim()) {
        return { error: `Trường “${field.label}” là bắt buộc.` };
      }
    }

    const model = (db as unknown as Record<string, { create: Function; update: Function }>)[
      resource.model
    ];

    if (id && id !== 'new') {
      await model.update({ where: { id }, data });
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          entity: resource.model,
          entityId: id,
          summary: `Cập nhật ${resource.labelVi}`,
        },
      });
    } else {
      const created = (await model.create({ data })) as { id: string };
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          entity: resource.model,
          entityId: created.id,
          summary: `Tạo ${resource.labelVi}`,
        },
      });
      revalidatePath(`/${locale}/admin/${resourceKey}`);
      redirect(`/${locale}/admin/${resourceKey}/${created.id}?saved=1`);
    }
  } catch (error) {
    // `redirect` throws by design; let it through.
    if (error && typeof error === 'object' && 'digest' in error) throw error;
    return { error: error instanceof Error ? error.message : 'Có lỗi xảy ra.' };
  }

  revalidatePath(`/${locale}/admin/${resourceKey}`);
  return { ok: true };
}

export async function deleteResource(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const locale = String(formData.get('__locale') ?? 'vi');
  const resourceKey = String(formData.get('__resource') ?? '');
  const id = String(formData.get('__id') ?? '');

  const resource = findResource(resourceKey);
  if (!resource || !resource.deletable || !id) redirect(`/${locale}/admin/${resourceKey}`);

  const model = (db as unknown as Record<string, { delete: Function }>)[resource.model];
  await model.delete({ where: { id } });
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: 'DELETE',
      entity: resource.model,
      entityId: id,
      summary: `Xoá ${resource.labelVi}`,
    },
  });

  revalidatePath(`/${locale}/admin/${resourceKey}`);
  redirect(`/${locale}/admin/${resourceKey}`);
}

export async function duplicateResource(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const locale = String(formData.get('__locale') ?? 'vi');
  const resourceKey = String(formData.get('__resource') ?? '');
  const id = String(formData.get('__id') ?? '');

  const resource = findResource(resourceKey);
  if (!resource || !resource.duplicable || !id) redirect(`/${locale}/admin/${resourceKey}`);

  const model = (db as unknown as Record<string, { findUnique: Function; create: Function }>)[
    resource.model
  ];
  const original = (await model.findUnique({ where: { id } })) as Record<string, unknown> | null;
  if (!original) redirect(`/${locale}/admin/${resourceKey}`);

  const copy: Record<string, unknown> = { ...original };
  delete copy.id;
  delete copy.createdAt;
  delete copy.updatedAt;
  // A duplicate must not collide on unique columns, and must not go live by accident.
  if (typeof copy.slug === 'string') copy.slug = `${copy.slug}-copy-${Date.now().toString(36)}`;
  if (typeof copy.code === 'string') copy.code = `${copy.code}-COPY`;
  if (typeof copy.sku === 'string') copy.sku = `${copy.sku}-COPY`;
  if ('status' in copy) copy.status = 'DRAFT';
  if (typeof copy.titleVi === 'string') copy.titleVi = `${copy.titleVi} (bản sao)`;

  const created = (await model.create({ data: copy })) as { id: string };
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: 'DUPLICATE',
      entity: resource.model,
      entityId: created.id,
      summary: `Nhân bản ${resource.labelVi}`,
    },
  });

  redirect(`/${locale}/admin/${resourceKey}/${created.id}`);
}

/** Publish, unpublish or archive without opening the full form. */
export async function setStatus(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const locale = String(formData.get('__locale') ?? 'vi');
  const resourceKey = String(formData.get('__resource') ?? '');
  const id = String(formData.get('__id') ?? '');
  const status = String(formData.get('__status') ?? 'PUBLISHED');

  const resource = findResource(resourceKey);
  if (!resource || !id) redirect(`/${locale}/admin/${resourceKey}`);

  const model = (db as unknown as Record<string, { update: Function }>)[resource.model];
  await model.update({ where: { id }, data: { status } });
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: 'STATUS',
      entity: resource.model,
      entityId: id,
      summary: `Đổi trạng thái sang ${status}`,
    },
  });

  revalidatePath(`/${locale}/admin/${resourceKey}`);
  redirect(`/${locale}/admin/${resourceKey}`);
}

/** Consultation workflow: move a lead along and keep an internal note. */
export async function updateConsultation(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const locale = String(formData.get('__locale') ?? 'vi');
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? 'NEW');
  const internalNotes = String(formData.get('internalNotes') ?? '');
  const assignedToId = String(formData.get('assignedToId') ?? '');

  await db.consultationRequest.update({
    where: { id },
    data: { status, internalNotes, assignedToId: assignedToId || null },
  });
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: 'UPDATE',
      entity: 'consultationRequest',
      entityId: id,
      summary: `Yêu cầu tư vấn → ${status}`,
    },
  });

  revalidatePath(`/${locale}/admin/consultations`);
  redirect(`/${locale}/admin/consultations`);
}

/** Site settings are a flat key/value list, edited all at once. */
export async function saveSettings(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const locale = String(formData.get('__locale') ?? 'vi');

  const keys = formData.getAll('__keys').map(String);
  for (const key of keys) {
    await db.siteSetting.update({
      where: { key },
      data: {
        valueVi: String(formData.get(`vi:${key}`) ?? ''),
        valueEn: String(formData.get(`en:${key}`) ?? ''),
      },
    });
  }
  await db.auditLog.create({
    data: { userId: user.id, action: 'UPDATE', entity: 'siteSetting', summary: 'Cập nhật cài đặt' },
  });

  revalidatePath(`/${locale}/admin/settings`);
  redirect(`/${locale}/admin/settings?saved=1`);
}
