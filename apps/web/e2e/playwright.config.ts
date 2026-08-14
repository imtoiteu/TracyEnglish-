import { defineConfig } from '@playwright/test';

/**
 * Browser tests.
 *
 * These run against a real production build, because every bug they were written for only
 * appears there: the session cookie's `Secure` flag depends on how the app is served, and the
 * account menu's dismiss-on-outside-press behaviour depends on real mouse events, which no
 * amount of jsdom will reproduce.
 *
 * `E2E_BASE_URL` points them at an already-running deployment. Left unset, Playwright starts
 * one itself. Note that `127.0.0.1` is a *trustworthy origin* as far as a browser is concerned,
 * so a `Secure` cookie survives there even over plain HTTP — that is precisely why the session
 * bug was invisible locally. `session.spec.ts` asserts against the host's real address for that
 * reason.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3888';

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npx next start -p 3888 -H 0.0.0.0',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
