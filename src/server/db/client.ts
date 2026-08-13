import "server-only";
import { PrismaClient } from "@nexora/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var prisma: PrismaClient | undefined;
  var prismaAdapter: PrismaPg | undefined;
}

const adapter =
  global.prismaAdapter ??
  new PrismaPg({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  global.prismaAdapter = adapter;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;