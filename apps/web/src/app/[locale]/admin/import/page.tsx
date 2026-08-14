import { Upload } from 'lucide-react';

import { translate } from '@tracy/localization';
import { Alert } from '@tracy/ui';

import { ImportForm } from '@/components/admin/import-form';
import { requireRole, resolveLocale } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function ImportPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  // Authorisation is enforced here, not only in the layout: a layout redirect does
  // not stop this page from rendering, so the check has to precede every query.
  await requireRole(locale, 'ADMIN', `/${locale}/admin/import`);
  const t = (key: string) => translate(locale, key);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold text-ink-900">
          <Upload className="h-6 w-6 text-brand-600" />
          {t('admin.import')}
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Nhập hàng loạt từ vựng, ngân hàng câu hỏi, bài đọc hoặc câu hỏi thường gặp bằng CSV hoặc
          JSON. Mọi lần nhập đều chạy thử trước.
        </p>
      </div>

      <Alert tone="warning" title="Về bản quyền">
        Chỉ nhập nội dung mà trung tâm có quyền sử dụng: tài liệu tự biên soạn, hoặc học liệu có
        giấy phép mở. Nếu nội dung đến từ nguồn ngoài, hãy điền cột <code>attribution</code> để
        phần ghi công hiển thị đúng cho người học.
      </Alert>

      <ImportForm />

      <div className="rounded-3xl border-2 border-ink-100 bg-white p-5">
        <h3 className="text-base">Nhập từ PDF, DOCX hoặc ảnh</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          Trình nhập này nhận dữ liệu dạng bảng. Với tài liệu PDF hoặc Word, hãy chuyển sang bảng
          trước (mỗi dòng một mục, cột đúng tên như hướng dẫn ở trên) rồi dán vào đây. Với file
          âm thanh và ảnh, tải lên thư mục <code className="rounded bg-ink-100 px-1">public/media</code>{' '}
          của máy chủ rồi điền đường dẫn vào trường tương ứng.
        </p>
      </div>
    </div>
  );
}
