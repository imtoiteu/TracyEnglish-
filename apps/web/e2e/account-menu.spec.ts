import { expect, test } from '@playwright/test';

import {
  ACCOUNTS,
  LOCALES,
  MENU_LABELS,
  VISIBLE_ITEMS,
  accountPanel,
  login,
  openAccountMenu,
  type RoleName,
} from './helpers';

/**
 * The account menu.
 *
 * The bug these cover: the header's dismiss-on-outside-press handler was scoped to the wrong
 * container, so pressing an item in the account panel counted as "outside", the panel unmounted
 * on `mousedown`, and because the element no longer existed at `mouseup` the browser never
 * produced a `click`. Nothing threw and the console stayed clean — the menu simply did nothing.
 *
 * That failure mode is invisible to a jsdom test, which dispatches a synthetic `click` directly
 * at the element and so never exercises the press/release sequence that broke. These use a real
 * browser and real mouse input for that reason.
 */

const ROLES: RoleName[] = ['ADMIN', 'TEACHER', 'STUDENT'];

for (const locale of LOCALES) {
  for (const role of ROLES) {
    test.describe(`${locale} · ${role}`, () => {
      test('shows exactly the items the role is entitled to', async ({ page }) => {
        await login(page, role, locale);
        await page.goto(`/${locale}/courses`, { waitUntil: 'domcontentloaded' });
        await openAccountMenu(page);

        const labels = MENU_LABELS[locale];
        const entitled = VISIBLE_ITEMS[role];
        const panel = accountPanel(page);

        await expect(panel.getByText(labels.dashboard, { exact: true })).toBeVisible();
        await expect(panel.getByText(labels.logout, { exact: true })).toBeVisible();

        // Teacher area and Admin appear only for the roles that may use them.
        for (const [key, label] of [['teacher', labels.teacher], ['admin', labels.admin]] as const) {
          const locator = panel.getByText(label, { exact: true });
          if (entitled.includes(key as 'teacher' | 'admin')) {
            await expect(locator).toBeVisible();
          } else {
            await expect(locator).toHaveCount(0);
          }
        }

        // The account belongs to the person who signed in.
        await expect(panel).toContainText(ACCOUNTS[role].email);
      });

      test('every item navigates on a real mouse press', async ({ page }) => {
        await login(page, role, locale);
        const labels = MENU_LABELS[locale];
        const targets: Record<string, string> = {
          dashboard: `/${locale}/dashboard`,
          teacher: `/${locale}/teacher`,
          admin: `/${locale}/admin`,
        };

        for (const key of VISIBLE_ITEMS[role]) {
          // Start somewhere other than the destination, so a passing assertion means the
          // navigation actually happened rather than the page never having moved.
          await page.goto(`/${locale}/courses`, { waitUntil: 'domcontentloaded' });
          await openAccountMenu(page);

          const item = accountPanel(page).getByText(labels[key], { exact: true });
          const box = await item.boundingBox();
          expect(box, `${key} should be laid out`).not.toBeNull();

          // Press and release as a user would, rather than dispatching a synthetic click:
          // the original bug lived precisely in the gap between mousedown and mouseup.
          await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
          await page.mouse.down();
          await page.mouse.up();

          await page.waitForURL(`**${targets[key]}`, { timeout: 20_000 });
          expect(new URL(page.url()).pathname).toBe(targets[key]);
        }
      });

      test('the panel closes when pressing outside it', async ({ page }) => {
        await login(page, role, locale);
        await page.goto(`/${locale}/courses`, { waitUntil: 'domcontentloaded' });
        await openAccountMenu(page);
        await page.mouse.click(12, 400); // far from any menu
        await expect(accountPanel(page)).toHaveCount(0);
      });

      test('logging out ends the session and returns to the home page', async ({ page }) => {
        await login(page, role, locale);
        await page.goto(`/${locale}/dashboard`, { waitUntil: 'domcontentloaded' });
        await openAccountMenu(page);

        await accountPanel(page).locator('button[type="submit"]').click();

        // A 303 turns the POST into a GET of the localised home page — a 307 would re-POST.
        await page.waitForURL(`**/${locale}`, { timeout: 20_000 });
        expect(new URL(page.url()).pathname).toBe(`/${locale}`);

        // And the session is genuinely gone, not merely hidden.
        await expect(page.locator(`header a[href="/${locale}/login"]`).first()).toBeVisible();
        await page.goto(`/${locale}/dashboard`, { waitUntil: 'domcontentloaded' });
        await page.waitForURL(/\/login/, { timeout: 20_000 });
      });
    });
  }
}
