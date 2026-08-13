import { NextResponse, type NextRequest } from 'next/server';

import { destroySession, SESSION_COOKIE } from '@/lib/auth';

/**
 * Sign out.
 *
 * A POST route rather than a link, so a prefetch or an image tag cannot log a learner out.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ locale: string }> }) {
  const { locale } = await context.params;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  await destroySession(token);

  const response = NextResponse.redirect(new URL(`/${locale === 'en' ? 'en' : 'vi'}`, request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
