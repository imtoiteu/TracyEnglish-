import type { Metadata, Viewport } from 'next';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tracyenglish.vn'),
  title: {
    default: 'Tracy English — Học tiếng Anh có lộ trình',
    template: '%s · Tracy English',
  },
  description:
    'Nền tảng học tiếng Anh cho người Việt: từ vựng có phát âm của người thật, ngữ pháp giải thích bằng tiếng Việt, bài nghe và bài đọc từ nguồn học liệu mở.',
  applicationName: 'Tracy English',
  authors: [{ name: 'Tracy English' }],
  openGraph: {
    type: 'website',
    siteName: 'Tracy English',
    locale: 'vi_VN',
  },
  icons: {
    icon: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#6D4AFF',
  width: 'device-width',
  initialScale: 1,
};

/**
 * The document shell.
 *
 * Fonts are loaded from Google Fonts with `display=swap` and a preconnect, so text is
 * readable immediately on a slow Vietnamese mobile connection rather than invisible until
 * the webfont lands. Charis SIL is included because IPA transcriptions render as empty
 * boxes in many default system fonts.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Charis+SIL:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
