import { expect, test } from '@playwright/test';

import { ACCOUNTS, LOCALES, login, loginAs, logout, registerStudent } from './helpers';

/**
 * Session consistency, enrolment and lesson completion.
 *
 * The bug these cover: the session cookie was marked `Secure` whenever `NODE_ENV` was
 * `production` — which `next start` always sets — regardless of the scheme the site was served
 * over. A browser discards a `Secure` cookie that arrives over an untrusted origin, so on a
 * plain-HTTP deployment the cookie was never stored. Signing in appeared to work and the page
 * the sign-in rendered still showed the account, but every request after it was anonymous.
 *
 * The reason this survived local testing is worth stating: `localhost` and `127.0.0.1` are
 * *trustworthy origins*, so the browser keeps a `Secure` cookie there even over plain HTTP.
 * `keeps the session cookie on a non-trustworthy origin` below is the test that actually
 * catches it, and it only bites when `E2E_BASE_URL` points at a real address.
 */

const isTrustworthyOrigin = (() => {
  const base = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3888';
  const { hostname, protocol } = new URL(base);
  return protocol === 'https:' || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
})();

test.describe('session', () => {
  test('keeps the session cookie on a non-trustworthy origin', async ({ page, context }) => {
    test.skip(
      isTrustworthyOrigin,
      'Only meaningful against a real host address: 127.0.0.1 keeps Secure cookies over plain HTTP anyway.',
    );

    await login(page, 'STUDENT');
    const session = (await context.cookies()).find((c) => c.name === 'tracy_session');
    expect(session, 'the browser must have stored the session cookie').toBeTruthy();

    // Over plain HTTP the cookie must not claim Secure, or the browser drops it.
    if (new URL(page.url()).protocol === 'http:') expect(session!.secure).toBe(false);
  });

  for (const locale of LOCALES) {
    test(`header and page agree about who is signed in (${locale})`, async ({ page }) => {
      await login(page, 'STUDENT', locale);

      for (const path of [`/${locale}/dashboard`, `/${locale}/courses`, `/${locale}/vocabulary`]) {
        await page.goto(path, { waitUntil: 'domcontentloaded' });

        // The header knows the visitor…
        await expect(page.locator('header')).toContainText(ACCOUNTS.STUDENT.name);
        // …and no part of the page is still offering to sign them in.
        await expect(page.locator(`header a[href="/${locale}/login"]`)).toHaveCount(0);
      }
    });
  }
});

test.describe('student journey', () => {
  test('enrol, study, complete — and it all survives a refresh and a fresh sign-in', async ({ page }) => {
    // A new account every run, so there is always a course left to enrol in. See
    // `registerStudent` for why using the seeded student made this test skip itself.
    const student = await registerStudent(page, `journey-${process.env.E2E_RUN_ID ?? Date.now()}`);

    // --- find a course this student has not enrolled in yet
    await page.goto('/vi/courses', { waitUntil: 'domcontentloaded' });
    const courseLinks: string[] = await page
      .locator('a[href*="/vi/courses/"]')
      .evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute('href') ?? ''))].filter(Boolean));

    let target: string | null = null;
    for (const href of courseLinks) {
      await page.goto(href, { waitUntil: 'domcontentloaded' });
      if (await page.locator('main button', { hasText: 'Đăng ký học' }).count()) {
        target = href;
        break;
      }
    }
    expect(target, 'a newly registered student must have a course available to enrol in').toBeTruthy();

    // --- enrol
    const enrolButton = page.locator('main button', { hasText: 'Đăng ký học' }).first();
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/enrollments') && r.request().method() === 'POST'),
      enrolButton.click(),
    ]);
    expect(response.status()).toBe(200);

    // the button reflects the new state without a reload
    await expect(page.locator('main button', { hasText: 'Đã ghi danh' })).toBeVisible();

    // --- and it persists across a refresh
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('main button', { hasText: 'Đã ghi danh' })).toBeVisible();
    await expect(page.locator('main')).toContainText('Học tiếp');

    // --- and across navigating away and back
    await page.goto('/vi/dashboard', { waitUntil: 'domcontentloaded' });
    await page.goto(target!, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main button', { hasText: 'Đã ghi danh' })).toBeVisible();

    // --- enrolling again must not create a duplicate
    const before = await page.locator('main button', { hasText: 'Đã ghi danh' }).count();
    expect(before).toBe(1);
    await expect(page.locator('main button', { hasText: 'Đã ghi danh' })).toBeDisabled();

    // --- open a lesson and mark it complete
    const lesson = await page.locator('a[href*="/vi/lessons/"]').first().getAttribute('href');
    expect(lesson).toBeTruthy();
    await page.goto(lesson!, { waitUntil: 'domcontentloaded' });

    // the lesson page must recognise the same session — never offer a login button
    await expect(page.locator('main').getByRole('link', { name: 'Đăng nhập' })).toHaveCount(0);

    const complete = page.locator('main button', { hasText: 'Đánh dấu hoàn thành' });
    const alreadyDone = page.locator('main', { hasText: 'Đã hoàn thành' });

    // Wait for the completion control to settle into one state or the other before deciding
    // what to do. Counting it straight after `domcontentloaded` raced the render: the button
    // had not appeared yet, the click was skipped as though the lesson were already complete,
    // and the assertion after the reload then failed on a button that was there all along.
    await expect(complete.or(alreadyDone).first()).toBeVisible();

    if (await complete.count()) {
      const [done] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/api/lessons/complete') && r.request().method() === 'POST'),
        complete.first().click(),
      ]);
      expect(done.status()).toBe(200);
    }

    // --- completion survives a refresh
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('main button', { hasText: 'Đánh dấu hoàn thành' })).toHaveCount(0);

    // --- and survives signing out and back in
    await logout(page);
    await loginAs(page, student.email, student.password);
    await page.goto(lesson!, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main button', { hasText: 'Đánh dấu hoàn thành' })).toHaveCount(0);
  });
});

test.describe('authorisation', () => {
  test('the admin panel renders no admin data for anyone but an admin', async ({ browser }) => {
    // A layout-only guard did not stop the page beneath it from rendering, so the admin
    // overview — consultation leads, phone numbers, the audit trail — was streamed to
    // unauthorised visitors inside the RSC payload even though the visible page redirected.
    // Asserting on the response body rather than on what is displayed is the point: the
    // rendered page looked correct while the data sat in the payload behind it.
    const forbidden = /Thay đổi gần đây|0912345001/;

    // A separate context per identity: signing out mid-flight raced the redirect the guard
    // had already started, which aborted the next navigation.
    for (const role of ['STUDENT', 'TEACHER', null] as const) {
      const context = await browser.newContext();
      const page = await context.newPage();
      if (role) await login(page, role);

      const response = await page.goto('/vi/admin', { waitUntil: 'domcontentloaded' });
      expect(await response!.text(), `${role ?? 'anonymous'} must not receive admin data`).not.toMatch(forbidden);
      await context.close();
    }

    // …and an admin still gets the page.
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, 'ADMIN');
    const allowed = await page.goto('/vi/admin', { waitUntil: 'domcontentloaded' });
    expect(await allowed!.text()).toMatch(forbidden);
    await context.close();
  });

  test('a student cannot reach the teacher area by typing the URL', async ({ page }) => {
    await login(page, 'STUDENT');
    await page.goto('/vi/teacher', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
  });
});
