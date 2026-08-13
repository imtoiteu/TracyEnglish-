import type { Metadata } from 'next';
import { ExternalLink, Scale } from 'lucide-react';

import { formatNumber, translate } from '@tracy/localization';
import { Badge, Card, Eyebrow, Stat } from '@tracy/ui';

import { db } from '@/lib/db';
import { resolveLocale } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Nguồn học liệu & giấy phép',
  description:
    'Mọi học liệu trên Tracy English đều đến từ nguồn mở có giấy phép rõ ràng. Trang này liệt kê đầy đủ từng nguồn, giấy phép và cách chúng tôi sử dụng.',
};
export const dynamic = 'force-dynamic';

export default async function CreditsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = (key: string) => translate(locale, key);

  const [sources, words, audio, listening, reading, examples, exercises] = await Promise.all([
    db.source.findMany({ orderBy: { name: 'asc' } }),
    db.vocabularyItem.count(),
    db.vocabularyItem.count({ where: { audioPath: { not: '' } } }),
    db.listeningItem.count(),
    db.readingItem.count(),
    db.vocabularyExample.count(),
    db.exercise.count(),
  ]);

  return (
    <div className="py-12">
      <div className="container-page">
        <Eyebrow>
          <Scale className="h-3.5 w-3.5" />
          {t('footer.credits')}
        </Eyebrow>
        <h1 className="mt-4 text-4xl">Học liệu đến từ đâu</h1>
        <p className="mt-4 max-w-3xl text-[1.0625rem] leading-relaxed text-ink-700">
          Nền tảng này không tự sinh nội dung học tập. Mọi từ vựng, câu ví dụ, bản thu phát âm, bài
          nghe và bài đọc đều lấy từ các kho học liệu mở có giấy phép cho phép sử dụng lại. Trang
          này liệt kê đầy đủ từng nguồn — vì giấy phép yêu cầu ghi công, và vì bạn có quyền biết
          mình đang học từ đâu.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-lavender px-4 py-3 text-sm leading-relaxed text-ink-700">
          <strong>Phần do Tracy English biên soạn:</strong> toàn bộ giải thích bằng tiếng Việt trong
          mục ngữ pháp, phần “lỗi người Việt hay mắc”, cấu trúc khoá học và các bài học. Không có tài
          liệu ngữ pháp tiếng Việt nào được cấp phép mở để dùng lại, và dịch máy một bài giảng tiếng
          Anh thì mất hết giá trị — nên phần đó do giáo viên của trung tâm viết.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat accent="brand" value={formatNumber(words, locale)} label="từ vựng" />
          <Stat accent="coral" value={formatNumber(audio, locale)} label="bản thu của người thật" />
          <Stat accent="sky" value={formatNumber(listening + reading, locale)} label="bài nghe và bài đọc" />
          <Stat accent="teal" value={formatNumber(examples, locale)} label="câu ví dụ song ngữ" />
        </div>

        <div className="mt-12 space-y-4">
          {sources.map((source) => (
            <Card key={source.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl">{source.name}</h2>
                  {source.publisher ? (
                    <p className="mt-1 text-sm text-ink-500">{source.publisher}</p>
                  ) : null}
                </div>
                <Badge accent={source.licence.includes('Public domain') ? 'teal' : 'brand'}>
                  {source.licence}
                </Badge>
              </div>

              {source.usedFor ? (
                <p className="mt-3 text-sm leading-relaxed text-ink-700">
                  <span className="font-bold">Dùng cho: </span>
                  {source.usedFor}
                </p>
              ) : null}

              <p className="mt-3 rounded-2xl bg-ink-50 px-4 py-3 text-sm leading-relaxed text-ink-600">
                {source.attribution}
              </p>

              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold text-brand-600 hover:underline"
                  >
                    Trang nguồn
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
                {source.licenceUrl ? (
                  <a
                    href={source.licenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold text-ink-500 hover:underline"
                  >
                    Toàn văn giấy phép
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-10 bg-ink-900 text-cream">
          <h2 className="text-xl text-cream">Về phát âm</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-200">
            Chúng tôi không dùng giọng đọc tổng hợp ở bất kỳ đâu trên nền tảng. Mỗi bản thu phát âm
            là giọng của một người thật, tải về từ Wikimedia Commons — phần lớn từ dự án Lingua
            Libre, nơi tình nguyện viên bản xứ thu âm từng từ. Các bài nghe dài là bản thu của phát
            thanh viên VOA. Khi một từ chưa có bản thu phù hợp, chúng tôi để trống thay vì tạo giọng
            máy: nghe sai một lần thì sửa rất lâu.
          </p>
          <p className="mt-3 text-sm text-ink-300">
            Hiện có {formatNumber(audio, locale)} trên {formatNumber(words, locale)} từ đã có bản thu.
            Số này tăng dần mỗi lần chạy lại quy trình nhập liệu.
          </p>
        </Card>

        <p className="mt-8 text-center text-sm text-ink-500">
          {formatNumber(exercises, locale)} bài tập trên nền tảng được dựng từ chính những nguồn ở
          trên — câu hỏi nào cũng truy được về câu gốc và người viết ra nó.
        </p>
      </div>
    </div>
  );
}
