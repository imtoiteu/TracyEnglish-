import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { DEFAULT_LOCALE, type Locale } from '@tracy/localization';

import { resolveSession, SESSION_COOKIE, roleAtLeast, type Role } from './auth';

/**
 * Server-side session access.
 *
 * Every one of these reads the cookie fresh, so a page never renders with a stale identity
 * after a login or logout in the same request cycle.
 */

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof resolveSession>>>['user'];

export async function getCurrentUser(): Promise<CurrentUser | null> {
  // Next 15 made the request-scoped stores async.
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = await resolveSession(token);
  return session?.user ?? null;
}

/**
 * Require a signed-in user, or bounce to the login page.
 *
 * The current path is passed through as `next` so the learner lands back where they were
 * instead of on a generic dashboard.
 */
export async function requireUser(locale: Locale, returnTo?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    const target = returnTo ? `?next=${encodeURIComponent(returnTo)}` : '';
    redirect(`/${locale}/login${target}`);
  }
  return user;
}

export async function requireRole(
  locale: Locale,
  role: Role,
  returnTo?: string,
): Promise<CurrentUser> {
  const user = await requireUser(locale, returnTo);
  if (!roleAtLeast(user.role, role)) {
    redirect(`/${locale}/dashboard`);
  }
  return user;
}

export function localeFromParams(params: { locale?: string } | undefined): Locale {
  const value = params?.locale;
  return value === 'en' || value === 'vi' ? value : DEFAULT_LOCALE;
}

/**
 * Route params and search params are promises in Next 15. Pages take them as such and
 * resolve through this helper so the locale is read in one place.
 */
export async function resolveLocale(
  params: Promise<{ locale?: string }> | { locale?: string },
): Promise<Locale> {
  const resolved = await params;
  return localeFromParams(resolved);
}
