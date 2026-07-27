import { defineConfig, env } from "prisma/config";

// Prisma CLI nu mai încarcă .env automat (Prisma 7). Local citim .env cu
// loadEnvFile (Node 21.7+); în CI/producție variabilele vin din mediu.
try {
  process.loadEnvFile();
} catch {
  // .env inexistent — ok, mediul e deja configurat
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
