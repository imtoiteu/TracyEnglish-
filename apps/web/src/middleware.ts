import { NextResponse, type NextRequest } from 'next/server';

/**
 * Locale routing.
 *
 * Every page lives under `/vi` or `/en`. A request without a locale prefix is redirected,
 * defaulting to Vietnamese — this is a product for Vietnamese learners, so a visitor who
 * expresses no preference gets Vietnamese, not English.
 *
 * A previously chosen locale is remembered in a cookie, and only then is Accept-Language
 * consulted.
 */

const LOCALES = ['vi', 'en'] as const;
const DEFAULT_LOCALE = 'vi';
const COOKIE = 'tracy_locale';

const SKIP = /^\/(?:_next|api|media|favicon|robots|sitemap|icon|apple-icon|manifest)/;

function preferredLocale(request: NextRequest): string {
  const saved = request.cookies.get(COOKIE)?.value;
  if (saved && (LOCALES as readonly string[]).includes(saved)) return saved;

  const header = request.headers.get('accept-language') ?? '';
  // Only switch to English if the visitor asks for English ahead of Vietnamese.
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { tag: tag.split('-')[0].toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  const first = ranked.find((entry) => entry.tag === 'vi' || entry.tag === 'en');
  return first?.tag === 'en' ? 'en' : DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (SKIP.test(pathname)) return NextResponse.next();

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length && (LOCALES as readonly string[]).includes(segments[0])) {
    const response = NextResponse.next();
    // Keep the cookie in step with what the visitor is actually reading.
    if (request.cookies.get(COOKIE)?.value !== segments[0]) {
      response.cookies.set(COOKIE, segments[0], { path: '/', maxAge: 60 * 60 * 24 * 365 });
    }
    return response;
  }

  const locale = preferredLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|media|favicon.ico).*)'],
};
