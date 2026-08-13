import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Tests run against the development database. Prisma resolves a relative sqlite path from
// the schema directory, so an absolute URL here keeps the runner and the app in step no
// matter which directory vitest was invoked from.
process.env.DATABASE_URL ??= `file:${fileURLToPath(new URL('./prisma/tracy.db', import.meta.url))}`;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@tracy/ui': fileURLToPath(new URL('../../packages/ui/src/index.ts', import.meta.url)),
      '@tracy/localization': fileURLToPath(new URL('../../packages/localization/src/index.ts', import.meta.url)),
      '@tracy/curriculum': fileURLToPath(new URL('../../packages/curriculum/src/index.ts', import.meta.url)),
      '@tracy/exercise-engine': fileURLToPath(new URL('../../packages/exercise-engine/src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // The journey test touches a single sqlite file; parallel workers would contend on it.
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    include: ['src/**/*.test.{ts,tsx}', '../../packages/**/*.test.{ts,tsx}'],
  },
});
