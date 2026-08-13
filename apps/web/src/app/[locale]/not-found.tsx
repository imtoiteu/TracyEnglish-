import Link from 'next/link';

import { ButtonLink, Card, DottedGrid, HeroGlow } from '@tracy/ui';

/**
 * 404.
 *
 * Rather than a dead end, this offers the four places a lost visitor most often actually
 * wanted: the dictionary, grammar, listening, or the course catalogue.
 */
export default function NotFound() {
  return (
    <div className="relative overflow-hidden py-20">
      <HeroGlow />
      <DottedGrid className="opacity-30" />
      <div className="container-page relative flex justify-center">
        <Card className="max-w-lg text-center">
          <p className="font-display text-6xl font-extrabold text-brand-300">404</p>
          <h1 className="mt-4 text-2xl">Không tìm thấy trang này</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-600">
            Có thể đường dẫn đã thay đổi, hoặc nội dung đã được gỡ. Dưới đây là những nơi hay được
            tìm nhất.
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <ButtonLink href="/vi/vocabulary" variant="outline">
              Từ vựng
            </ButtonLink>
            <ButtonLink href="/vi/grammar" variant="outline">
              Ngữ pháp
            </ButtonLink>
            <ButtonLink href="/vi/listening" variant="outline">
              Luyện nghe
            </ButtonLink>
            <ButtonLink href="/vi/courses" variant="outline">
              Khoá học
            </ButtonLink>
          </div>
          <p className="mt-6 text-sm">
            <Link href="/vi" className="font-bold text-brand-600 hover:underline">
              ← Về trang chủ
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
