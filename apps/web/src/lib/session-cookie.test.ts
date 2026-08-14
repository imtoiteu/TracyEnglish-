import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * How the session cookie decides on its `Secure` flag.
 *
 * This is the unit-level guard for the bug that logged everybody out on a plain-HTTP
 * deployment: the flag was derived from `NODE_ENV`, which `next start` always sets to
 * `production`, so the cookie was marked `Secure` even when the site was served over HTTP.
 * Browsers discard such a cookie, so sign-in silently failed to stick.
 *
 * The browser-level counterpart lives in `e2e/session.spec.ts`; this one covers the decision
 * table directly, including the case a browser test cannot easily reach — a request arriving
 * through a TLS-terminating proxy.
 */

const headerMock = vi.fn();
vi.mock('next/headers', () => ({
  headers: async () => ({ get: (name: string) => headerMock(name) }),
}));

async function optionsWith({
  forwardedProto,
  origin,
  override,
}: {
  forwardedProto?: string;
  origin?: string;
  override?: string;
}) {
  headerMock.mockImplementation((name: string) =>
    name === 'x-forwarded-proto' ? (forwardedProto ?? null) : null,
  );
  if (origin === undefined) delete process.env.APP_ORIGIN;
  else process.env.APP_ORIGIN = origin;
  if (override === undefined) delete process.env.SESSION_COOKIE_SECURE;
  else process.env.SESSION_COOKIE_SECURE = override;

  const { sessionCookieOptions } = await import('./auth');
  return sessionCookieOptions();
}

afterEach(() => {
  delete process.env.APP_ORIGIN;
  delete process.env.SESSION_COOKIE_SECURE;
  vi.resetModules();
});

describe('sessionCookieOptions', () => {
  it('marks the cookie Secure behind a proxy that terminated TLS', async () => {
    expect((await optionsWith({ forwardedProto: 'https' })).secure).toBe(true);
  });

  it('reads only the first hop of a chained x-forwarded-proto', async () => {
    expect((await optionsWith({ forwardedProto: 'https, http' })).secure).toBe(true);
    expect((await optionsWith({ forwardedProto: 'http, https' })).secure).toBe(false);
  });

  it('does not mark the cookie Secure when the request arrived over plain HTTP', async () => {
    // The regression: a Secure cookie here is dropped by the browser, so the user is
    // silently signed out on the very next request.
    expect((await optionsWith({ forwardedProto: 'http' })).secure).toBe(false);
  });

  it('falls back to the configured origin when no proxy header is present', async () => {
    expect((await optionsWith({ origin: 'https://tracyenglish.vn' })).secure).toBe(true);
    expect((await optionsWith({ origin: 'http://80.241.217.122:3888' })).secure).toBe(false);
  });

  it('defaults to not Secure when nothing indicates HTTPS', async () => {
    expect((await optionsWith({})).secure).toBe(false);
  });

  it('lets an explicit override win over everything else', async () => {
    expect((await optionsWith({ forwardedProto: 'http', override: 'true' })).secure).toBe(true);
    expect((await optionsWith({ forwardedProto: 'https', override: 'false' })).secure).toBe(false);
  });

  it('is ignored when the override is not a recognised value', async () => {
    expect((await optionsWith({ forwardedProto: 'https', override: 'yes' })).secure).toBe(true);
  });

  it('always keeps the cookie httpOnly, lax and site-wide', async () => {
    const options = await optionsWith({ forwardedProto: 'https' });
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe('lax');
    expect(options.path).toBe('/');
    expect(options.maxAge).toBe(30 * 24 * 60 * 60);
  });
});
