import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Client Prisma cu driver adapter Postgres (Prisma 7 — conexiunea nu mai stă
// în schema, ci se dă la instanțiere). Singleton ca să nu deschidem pool-uri
// multiple la hot-reload în dev. Vezi docs/adr/0002-prisma-7-config.md.

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL lipsește — clientul Prisma nu poate porni.");
}

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
