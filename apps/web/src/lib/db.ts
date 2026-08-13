import { PrismaClient } from '@prisma/client';

/**
 * One Prisma client per process.
 *
 * Next.js reloads modules on every edit in development, which would otherwise open a new
 * SQLite connection each time until the process runs out of file handles.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
