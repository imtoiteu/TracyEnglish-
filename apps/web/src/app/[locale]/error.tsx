'use client';

import { useEffect } from 'react';

import { Button, ButtonLink, Card } from '@tracy/ui';

/**
 * The route error boundary.
 *
 * Shows a recoverable message rather than a stack trace, and offers a retry — most failures
 * here are a transient database or network hiccup, and reloading genuinely fixes them.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-20">
      <div className="container-page flex justify-center">
        <Card className="max-w-lg text-center">
          <h1 className="text-2xl">Trang này gặp lỗi</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-600">
            Đã có lỗi khi tải nội dung. Bạn thử tải lại xem sao — phần lớn trường hợp là do kết nối
            tạm thời.
          </p>
          {error.digest ? (
            <p className="mt-3 font-mono text-xs text-ink-400">Mã lỗi: {error.digest}</p>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={reset}>Thử lại</Button>
            <ButtonLink href="/vi" variant="outline">
              Về trang chủ
            </ButtonLink>
          </div>
        </Card>
      </div>
    </div>
  );
}
