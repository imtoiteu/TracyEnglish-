import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import { db } from './db';

/**
 * Authentication.
 *
 * Passwords are hashed with scrypt from Node's own crypto module. That is a deliberate
 * choice over pulling in bcrypt: scrypt is memory-hard, it is in the standard library, and
 * it removes a native dependency that would need rebuilding on every deployment target.
 *
 * Sessions are opaque random tokens stored in an httpOnly cookie, with the hash — not the
 * token — kept in the database, so a database leak does not hand out live sessions.
 */

/**
 * `promisify`'s inferred type only covers the three-argument form of `scrypt`. The tuning
 * parameters are the whole point of using scrypt, so the options overload is declared here.
 */
const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const SCRYPT_KEYLEN = 64;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export const SESSION_COOKIE = 'tracy_session';
export const SESSION_DAYS = 30;

export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, SCRYPT_KEYLEN, SCRYPT_PARAMS);
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, digest] = (stored ?? '').split('$');
  if (scheme !== 'scrypt' || !salt || !digest) return false;
  const derived = await scryptAsync(password, salt, SCRYPT_KEYLEN, SCRYPT_PARAMS);
  const expected = Buffer.from(digest, 'hex');
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(derived, expected);
}

/** The value stored in the database — never the raw token. */
function tokenDigest(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export async function createSession(userId: string, userAgent?: string): Promise<string> {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({
    data: { token: tokenDigest(token), userId, expiresAt, userAgent: userAgent?.slice(0, 200) },
  });
  return token;
}

export async function resolveSession(token: string | undefined) {
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { token: tokenDigest(token) },
    include: {
      user: {
        include: { studentProfile: true, teacherProfile: true },
      },
    },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  if (!session.user.isActive) return null;
  return session;
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  await db.session.deleteMany({ where: { token: tokenDigest(token) } });
}

/** Housekeeping: drop sessions that expired. Called opportunistically on login. */
export async function pruneSessions(): Promise<void> {
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => undefined);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function passwordProblem(value: string): string | null {
  if (value.length < 8) return 'auth.passwordShort';
  return null;
}

/**
 * Vietnamese mobile numbers, in the formats people actually type them.
 *
 * Accepts 0xxxxxxxxx, +84xxxxxxxxx and 84xxxxxxxxx, with spaces, dots or dashes anywhere.
 */
export function normalisePhone(value: string): string {
  const digits = value.replace(/[\s.\-()]/g, '');
  if (/^\+?84\d{9}$/.test(digits)) return `0${digits.slice(-9)}`;
  if (/^0\d{9}$/.test(digits)) return digits;
  return value.trim();
}

export function isValidPhone(value: string): boolean {
  return /^0\d{9}$/.test(normalisePhone(value));
}

export function roleAtLeast(role: string, required: Role): boolean {
  const order: Role[] = ['STUDENT', 'TEACHER', 'ADMIN'];
  return order.indexOf(role as Role) >= order.indexOf(required);
}
