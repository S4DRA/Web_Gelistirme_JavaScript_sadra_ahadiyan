import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
  prismaAdapter?: PrismaPg;
};

export function getPrisma() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  const adapter =
    globalForPrisma.prismaAdapter ??
    new PrismaPg({ connectionString });

  const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({ adapter });

  globalForPrisma.prismaAdapter = adapter;
  globalForPrisma.prisma = prisma;

  return prisma;
}
