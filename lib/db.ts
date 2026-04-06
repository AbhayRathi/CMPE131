/**
 * Database client singleton for Prisma.
 * Prevents multiple Prisma Client instances in development (hot reload).
 */

import { PrismaClient } from "@prisma/client";

// Extend globalThis to hold the Prisma client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Singleton Prisma client instance */
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// In development, store the client on globalThis to prevent multiple instances
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
