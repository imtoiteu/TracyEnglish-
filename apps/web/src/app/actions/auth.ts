'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { DEFAULT_LOCALE, isLocale, type Locale } from '@tracy/localization';

import {
  createSession,
  destroySession,
  hashPassword,
  isValidEmail,
  normalisePhone,
  passwordProblem,
  pruneSessions,
  SESSION_COOKIE,
  SESSION_DAYS,
  verifyPassword,
} from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * Sign-in, sign-up and sign-out.
 *
 * These are server actions rather than API routes so the forms work with JavaScript
 * disabled — which matters on a school computer or a cheap phone, and is the reason the
 * login form is a plain `<form action={…}>` with no client-side state.
 */

export type AuthState = { error?: string; field?: string } | null;

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_DAYS * 24 * 60 * 60,
};

function localeOf(value: FormDataEntryValue | null): Locale {
  const raw = String(value ?? '');
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

/** Only allow same-site relative redirects — never an absolute URL from a form field. */
function safeNext(value: FormDataEntryValue | null, locale: Locale): string {
  const raw = String(value ?? '');
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return `/${locale}/dashboard`;
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = localeOf(formData.get('locale'));
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) return { error: 'auth.invalid' };

  const user = await db.user.findUnique({ where: { email } });
  // Compare against a dummy hash when the account does not exist, so a wrong email and a
  // wrong password take the same amount of time to reject.
  const stored = user?.passwordHash ?? 'scrypt$0000$0000';
  const ok = await verifyPassword(password, stored);
  if (!user || !ok || !user.isActive) return { error: 'auth.invalid' };

  await pruneSessions();
  const token = await createSession(user.id);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, cookieOptions);
  await db.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });

  redirect(safeNext(formData.get('next'), locale));
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = localeOf(formData.get('locale'));
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const phone = normalisePhone(String(formData.get('phone') ?? ''));
  const segment = String(formData.get('segment') ?? 'ADULT');

  if (!name) return { error: 'common.required', field: 'name' };
  if (!isValidEmail(email)) return { error: 'common.required', field: 'email' };
  const problem = passwordProblem(password);
  if (problem) return { error: problem, field: 'password' };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: 'auth.emailTaken', field: 'email' };

  const user = await db.user.create({
    data: {
      email,
      name,
      phone: phone || null,
      passwordHash: await hashPassword(password),
      role: 'STUDENT',
      locale,
      studentProfile: {
        create: {
          segment,
          cefrLevel: 'A1',
          dailyGoalMin: 15,
        },
      },
    },
  });

  const token = await createSession(user.id);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, cookieOptions);

  redirect(safeNext(formData.get('next'), locale));
}

export async function logoutAction(formData: FormData): Promise<void> {
  const locale = localeOf(formData.get('locale'));
  const store = await cookies();
  await destroySession(store.get(SESSION_COOKIE)?.value);
  store.delete(SESSION_COOKIE);
  redirect(`/${locale}`);
}
