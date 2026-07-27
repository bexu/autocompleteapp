# ADR 0002 — Adaptare la Prisma 7 (prisma.config.ts)

- Status: acceptat
- Data: 2026-07-27

## Context
Template-ul standardului a fost scris pe Prisma 6, unde conexiunea (`url = env("DATABASE_URL")`) stătea în `prisma/schema.prisma`. Bootstrap-ul a instalat Prisma 7, care nu mai acceptă `url` în schema: conexiunea pentru CLI/Migrate se mută în `prisma.config.ts`, iar clientul primește adapter la instanțiere.

## Decizie
- `prisma.config.ts` la root definește `datasource.url` din `DATABASE_URL`; local încarcă `.env` cu `process.loadEnvFile()` (Node 21.7+, fără dependență dotenv), în CI/prod variabilele vin din mediu.
- `prisma/schema.prisma` păstrează doar `provider = "postgresql"`.
- La primul cod care folosește DB (task 1.2): PrismaClient cu driver adapter Postgres, conform documentației Prisma 7.

## Consecințe
- `npx prisma generate` și migrările funcționează identic în local și CI.
- Deviere minimă de la template, documentată aici; restul convențiilor rămân.
