import { expect, type Page } from '@playwright/test';

export const ACCOUNTS = {
  ADMIN: { email: 'admin@tracyenglish.vn', password: 'Admin@2026', name: 'Quản trị viên' },
  TEACHER: { email: 'tracy@tracyenglish.vn', password: 'Teacher@2026', name: 'Tracy' },
  STUDENT: { email: 'linh@example.com', password: 'Student@2026', name: 'Trần Khánh Linh' },
} as const;

export type RoleName = keyof typeof ACCOUNTS;

export const LOCALES = ['vi', 'en'] as const;
export type TestLocale = (typeof LOCALES)[number];

/** The labels each role should see in the account menu, per locale. */
export const MENU_LABELS: Record<TestLocale, { dashboard: string; teacher: string; admin: string; logout: string }> = {
  vi: { dashboard: 'Bảng học tập', teacher: 'Khu vực giáo viên', admin: 'Quản trị', logout: 'Đăng xuất' },
  en: { dashboard: 'Dashboard', teacher: 'Teacher area', admin: 'Admin', logout: 'Log out' },
};

export const VISIBLE_ITEMS: Record<RoleName, ('dashboard' | 'teacher' | 'admin')[]> = {
  STUDENT: ['dashboard'],
  TEACHER: ['dashboard', 'teacher'],
  ADMIN: ['dashboard', 'teacher', 'admin'],
};

export async function login(page: Page, role: RoleName, locale: TestLocale = 'vi') {
  const { email, password } = ACCOUNTS[role];
  await page.goto(`/${locale}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 30_000 }),
    page.click('button[type="submit"]'),
  ]);
}

/**
 * Sign out without going through the menu.
 *
 * The menu path is asserted in `account-menu.spec.ts`; using it for setup elsewhere would make
 * unrelated tests fail for the same reason. This posts to the same route the form does.
 */
export async function logout(page: Page, locale: TestLocale = 'vi') {
  await page.request.post(`/${locale}/logout`, { maxRedirects: 0 }).catch(() => undefined);
  await page.context().clearCookies({ name: 'tracy_session' }).catch(() => undefined);
  await page.goto(`/${locale}`, { waitUntil: 'domcontentloaded' });
}

/** The account button in the header, which only exists for a signed-in visitor. */
export function accountButton(page: Page) {
  return page.locator('header button[aria-expanded]').last();
}

export function accountPanel(page: Page) {
  return page.locator('header [data-menu-root] div.absolute').last();
}

export async function openAccountMenu(page: Page) {
  const button = accountButton(page);
  await expect(button).toBeVisible();
  await button.click();
  await expect(accountPanel(page)).toBeVisible();
}

/** True when the header is rendering the signed-in account rather than the login links. */
export async function headerShowsAccount(page: Page, name: string) {
  const header = page.locator('header');
  return (await header.innerText()).includes(name);
}

export async function isSignedOut(page: Page, locale: TestLocale = 'vi') {
  return page.locator(`header a[href="/${locale}/login"]`).count().then((n) => n > 0);
}
