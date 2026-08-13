import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { translate } from '@tracy/localization';
import { Alert } from '@tracy/ui';

import { ResourceForm } from '@/components/admin/resource-form';
import { db } from '@/lib/db';
import { findResource, type AdminField } from '@/lib/admin/resources';
import { resolveLocale } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * The generic edit form.
 *
 * `id === 'new'` renders an empty form. Relation fields are resolved here, on the server,
 * into option lists so the browser never queries the database for a dropdown.
 */
export default async function AdminEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; resource: string; id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const resolved = await params;
  const locale = await resolveLocale(params);
  const query = await searchParams;
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const resource = findResource(resolved.resource);
  if (!resource) notFound();

  const isNew = resolved.id === 'new';
  if (isNew && !resource.creatable) notFound();

  const model = db[resource.model as keyof typeof db] as unknown as {
    findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
  };

  const record = isNew ? null : await model.findUnique({ where: { id: resolved.id } });
  if (!isNew && !record) notFound();

  // Resolve the option list for every relation field in one pass.
  const relationOptions: Record<string, { value: string; label: string }[]> = {};
  for (const field of resource.fields) {
    if (field.type !== 'relation' || !field.relation) continue;
    const relatedModel = db[field.relation.model as keyof typeof db] as unknown as {
      findMany: (args: unknown) => Promise<Record<string, unknown>[]>;
    };
    const rows = await relatedModel.findMany({
      take: 400,
      orderBy: { [field.relation.labelField]: 'asc' },
      select: { id: true, [field.relation.labelField]: true },
    });
    relationOptions[field.name] = rows.map((row) => ({
      value: String(row.id),
      label: String(row[field.relation!.labelField] ?? row.id),
    }));
  }

  const values: Record<string, string> = {};
  for (const field of resource.fields) {
    values[field.name] = serialiseField(field, record?.[field.name]);
  }

  return (
    <div className="space-y-6">
      <Link
        href={href(`/admin/${resource.key}`)}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-500 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {resource.labelPluralVi}
      </Link>

      <div>
        <h2 className="font-display text-2xl font-extrabold text-ink-900">
          {isNew ? `Tạo ${resource.labelVi.toLowerCase()}` : `Sửa ${resource.labelVi.toLowerCase()}`}
        </h2>
        {record ? (
          <p className="mt-1 font-mono text-xs text-ink-400">{String(record.id)}</p>
        ) : null}
      </div>

      {query.saved ? <Alert tone="success">{t('admin.saved')}</Alert> : null}

      <ResourceForm
        resourceKey={resource.key}
        fields={resource.fields}
        values={values}
        relationOptions={relationOptions}
        recordId={isNew ? '' : resolved.id}
        deletable={Boolean(resource.deletable)}
        duplicable={Boolean(resource.duplicable)}
        locale={locale}
      />
    </div>
  );
}

/** Turn a stored column value into the string the form control expects. */
function serialiseField(field: AdminField, value: unknown): string {
  if (value === null || value === undefined) {
    return field.type === 'boolean' ? '' : field.type === 'number' ? '0' : '';
  }

  switch (field.type) {
    case 'boolean':
      return value ? 'on' : '';

    case 'multiselect':
    case 'jsonList': {
      let list: unknown = value;
      if (typeof value === 'string') {
        try {
          list = JSON.parse(value);
        } catch {
          list = [];
        }
      }
      const array = Array.isArray(list) ? list.map(String) : [];
      return field.type === 'jsonList' ? array.join('\n') : JSON.stringify(array);
    }

    case 'json':
    case 'blocks': {
      if (typeof value === 'string') {
        try {
          return JSON.stringify(JSON.parse(value), null, 2);
        } catch {
          return value;
        }
      }
      return JSON.stringify(value, null, 2);
    }

    case 'date':
      return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);

    default:
      return String(value);
  }
}
