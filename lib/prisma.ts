import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
  prismaAdapter?: PrismaPg;
  prismaPool?: Pool;
};

export function getPrisma() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  const pool =
    globalForPrisma.prismaPool ??
    new Pool({
      connectionString,
      idleTimeoutMillis: 10_000,
      max: 1,
    });

  const adapter =
    globalForPrisma.prismaAdapter ??
    new PrismaPg(pool, { disposeExternalPool: false });

  const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({ adapter });

  globalForPrisma.prismaAdapter = adapter;
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaPool = pool;

  return prisma;
}
