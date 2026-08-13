import { translate } from '@tracy/localization';
import { Badge, DataTable, EmptyState, Td } from '@tracy/ui';

import { db } from '@/lib/db';
import { resolveLocale } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Every write made through the admin panel, newest first. */
export default async function AuditPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = (key: string) => translate(locale, key);

  const entries = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-ink-900">{t('admin.audit')}</h2>
        <p className="mt-1 text-sm text-ink-500">
          200 thay đổi gần nhất. Mỗi thao tác tạo, sửa, xoá hay đổi trạng thái đều được ghi lại.
        </p>
      </div>

      {entries.length ? (
        <DataTable caption="Nhật ký" columns={['Thời gian', 'Người thực hiện', 'Thao tác', 'Đối tượng', 'Nội dung']}>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <Td className="whitespace-nowrap text-xs text-ink-500">
                {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(entry.createdAt)}
              </Td>
              <Td className="text-sm">{entry.user?.name ?? 'hệ thống'}</Td>
              <Td>
                <Badge accent="ink">{entry.action}</Badge>
              </Td>
              <Td className="font-mono text-xs text-ink-500">{entry.entity}</Td>
              <Td className="text-sm">{entry.summary}</Td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="Chưa có thay đổi nào được ghi lại" />
      )}
    </div>
  );
}
