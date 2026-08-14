import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Plus, Search } from 'lucide-react';

import { formatDate, formatNumber, translate } from '@tracy/localization';
import {
  Alert,
  Badge,
  ButtonLink,
  Card,
  DataTable,
  EmptyState,
  Input,
  LevelBadge,
  StatusBadge,
  Td,
  cn,
} from '@tracy/ui';

import { db } from '@/lib/db';
import { findResource, RESOURCES, type AdminColumn } from '@/lib/admin/resources';
import { requireRole, resolveLocale } from '@/lib/session';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;

export function generateStaticParams() {
  return RESOURCES.map((resource) => ({ resource: resource.key }));
}

/**
 * The generic resource list.
 *
 * Reads the column set from the registry and queries the matching Prisma model by name. The
 * model name comes from the registry, never from the URL, so `/admin/../../` cannot reach a
 * table that was not declared.
 */
export default async function AdminListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; resource: string }>;
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  const resolved = await params;
  const locale = await resolveLocale(params);
  // Authorisation is enforced here, not only in the layout: a layout redirect does
  // not stop this page from rendering, so the check has to precede every query.
  await requireRole(locale, 'ADMIN', `/${locale}/admin/${resolved.resource}`);
  const query = await searchParams;
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const resource = findResource(resolved.resource);
  if (!resource) notFound();

  const search = (query.q ?? '').trim();
  const page = Math.max(1, Number(query.page ?? '1') || 1);

  const where: Record<string, unknown> = {};
  if (search && resource.searchFields.length) {
    where.OR = resource.searchFields.map((field) => ({ [field]: { contains: search } }));
  }
  // Not every model has a status column — filtering `user` by status would throw.
  const hasStatus = resource.fields.some((field) => field.name === 'status');
  if (query.status && hasStatus) where.status = query.status;

  const model = db[resource.model as keyof typeof db] as unknown as {
    findMany: (args: unknown) => Promise<Record<string, unknown>[]>;
    count: (args: unknown) => Promise<number>;
  };

  const orderBy = resource.defaultOrder
    ? { [resource.defaultOrder.field]: resource.defaultOrder.direction }
    : undefined;

  const [rows, total] = await Promise.all([
    model.findMany({ where, orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    model.count({ where }),
  ]);

  const pages = Math.ceil(total / PAGE_SIZE);
  const buildHref = (next: Record<string, string | undefined>) => {
    const merged = new URLSearchParams();
    const combined = { q: search, status: query.status, page: String(page), ...next };
    for (const [key, value] of Object.entries(combined)) if (value) merged.set(key, value);
    const suffix = merged.toString();
    return `${href(`/admin/${resource.key}`)}${suffix ? `?${suffix}` : ''}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-ink-900">
            {resource.labelPluralVi}
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            {formatNumber(total, locale)} bản ghi
            {search ? ` khớp với “${search}”` : ''}
          </p>
        </div>
        {resource.creatable ? (
          <ButtonLink href={href(`/admin/${resource.key}/new`)}>
            <Plus className="h-4 w-4" />
            {t('action.create')}
          </ButtonLink>
        ) : null}
      </div>

      {resource.noteVi ? <Alert tone="info">{resource.noteVi}</Alert> : null}

      {resource.searchFields.length ? (
        <form action={href(`/admin/${resource.key}`)} method="get" className="flex flex-wrap gap-2">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input name="q" defaultValue={search} placeholder="Tìm kiếm…" className="pl-11" aria-label={t('action.search')} />
          </div>
          <button type="submit" className="rounded-2xl bg-brand-600 px-5 py-2.5 font-bold text-white hover:bg-brand-700">
            {t('action.search')}
          </button>
          {search ? (
            <Link
              href={href(`/admin/${resource.key}`)}
              className="rounded-2xl border-2 border-ink-200 bg-white px-4 py-2.5 font-bold text-ink-600"
            >
              {t('action.reset')}
            </Link>
          ) : null}
        </form>
      ) : null}

      {rows.length ? (
        <DataTable
          caption={resource.labelPluralVi}
          columns={[...resource.columns.map((column) => column.label), '']}
        >
          {rows.map((row) => (
            <tr key={String(row.id)} className="transition-colors hover:bg-brand-50/50">
              {resource.columns.map((column) => (
                <Td key={column.name} className={column.width ? `w-[${column.width}]` : undefined}>
                  <Cell column={column} value={row[column.name]} locale={locale} t={t} />
                </Td>
              ))}
              <Td className="text-right">
                <Link
                  href={href(`/admin/${resource.key}/${String(row.id)}`)}
                  className="rounded-xl bg-ink-100 px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-brand-100 hover:text-brand-800"
                >
                  {t('action.edit')}
                </Link>
              </Td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState
          title="Chưa có bản ghi nào"
          description={
            search
              ? 'Không có kết quả khớp. Thử từ khoá khác.'
              : 'Tạo bản ghi đầu tiên, hoặc nhập dữ liệu hàng loạt từ mục Nhập dữ liệu.'
          }
          action={
            resource.creatable ? (
              <ButtonLink href={href(`/admin/${resource.key}/new`)}>{t('action.create')}</ButtonLink>
            ) : undefined
          }
        />
      )}

      {pages > 1 ? (
        <nav className="flex items-center justify-center gap-3" aria-label="Phân trang">
          {page > 1 ? (
            <Link href={buildHref({ page: String(page - 1) })} className="rounded-2xl border-2 border-ink-200 bg-white px-4 py-2 text-sm font-bold">
              {t('action.previous')}
            </Link>
          ) : null}
          <span className="text-sm font-semibold text-ink-500">
            {page} {t('common.of')} {pages}
          </span>
          {page < pages ? (
            <Link href={buildHref({ page: String(page + 1) })} className="rounded-2xl border-2 border-ink-200 bg-white px-4 py-2 text-sm font-bold">
              {t('action.next')}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}

function Cell({
  column,
  value,
  locale,
  t,
}: {
  column: AdminColumn;
  value: unknown;
  locale: 'vi' | 'en';
  t: (key: string) => string;
}) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-ink-300">—</span>;
  }

  switch (column.kind) {
    case 'level':
      return <LevelBadge level={String(value)} />;
    case 'status':
      return <StatusBadge status={String(value)} label={t(`status.${String(value)}`)} />;
    case 'badge':
      return <Badge accent="ink">{String(value)}</Badge>;
    case 'boolean':
      return (
        <span
          className={cn(
            'inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.7rem] font-extrabold',
            value ? 'bg-teal-100 text-teal-700' : 'bg-ink-100 text-ink-400',
          )}
        >
          {value ? '✓' : '–'}
        </span>
      );
    case 'number':
      return <span className="font-mono text-sm">{formatNumber(Number(value), locale)}</span>;
    case 'date':
      return <span className="text-sm text-ink-500">{formatDate(value as Date, locale)}</span>;
    default: {
      const text = String(value);
      return <span className="line-clamp-2">{text.length > 110 ? `${text.slice(0, 110)}…` : text}</span>;
    }
  }
}
