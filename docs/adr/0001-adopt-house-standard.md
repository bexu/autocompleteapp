# ADR 0001 — Adoptăm standardul de casă

- Status: acceptat
- Data: <completează>

## Context
Avem nevoie de un stack și de reguli consistente pentru aplicații vibe-coded interne — nu „ce sugerează random unealta AI".

## Decizie
Adoptăm standardul de casă: TypeScript · Node · Next.js · PostgreSQL · Prisma · Zod · pg-boss · Playwright/Vitest · Docker/Compose · GitHub. Detalii în [../../STANDARD.md](../../STANDARD.md).

## Consecințe
- Cod scris bine de AI + ușor de întreținut.
- Nu schimbăm stack-ul de la proiect la proiect.
- Module incluse după nevoie (Next dacă are UI, Prisma dacă are DB, pg-boss dacă are task-uri pe fundal).
