// ─── Prisma Client Singleton ──────────────────────────────────────────────────
// A single instance is reused across the server process.
// ──────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";

declare global {
  // Prevent TypeScript errors on globalThis augmentation
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
