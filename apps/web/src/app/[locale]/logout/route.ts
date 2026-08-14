import { NextResponse, type NextRequest } from 'next/server';

import { destroySession, SESSION_COOKIE } from '@/lib/auth';

/**
 * Sign out.
 *
 * A POST route rather than a link, so a prefetch or an image tag cannot log a learner out.
 *
 * Two details matter in the response, and both were wrong before:
 *
 * 1. **303, not 307.** `NextResponse.redirect` defaults to 307, which preserves the method —
 *    the browser would re-POST to the home page instead of fetching it. 303 is the status that
 *    exists precisely to turn a POST into a follow-up GET.
 * 2. **A relative `Location`.** Building an absolute URL from `request.url` uses the address the
 *    server is bound to, not the host the visitor actually asked for, so a deployment behind a
 *    public address sent people to `http://0.0.0.0:3888/` or to their own `localhost`. A
 *    relative location is resolved by the browser against the address it is already on, which
 *    is correct under any bind address, port or reverse proxy.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ locale: string }> }) {
  const { locale } = await context.params;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  await destroySession(token);

  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: `/${locale === 'en' ? 'en' : 'vi'}` },
  });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
