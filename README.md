# app-standard

Standardul de casă pentru aplicații **vibe-coded interne** (construite cu AI: Claude Code / Cursor).

Scop: un stack și un set de reguli **deliberate** — nu „ce ne sugerează random unealta AI" — optimizate pentru cod scris bine de AI, ușor de întreținut de echipă și deploy intern.

> Stack pe scurt: TypeScript · Node · Next.js · PostgreSQL · Prisma · Zod · pg-boss · Playwright/Vitest · GitHub · Docker/Compose.

## Conținut
- **[STANDARD.md](STANDARD.md)** — regulamentul complet: stack, structură repo, testare (E2E), documentație, agenți, task-uri/statusuri, deploy, Definition of Done.
- **[CLAUDE.md](CLAUDE.md)** — regulile pe care agentul AI le citește automat (stack fix, hartă foldere, comenzi, reguli, Definition of Done).

## Cum se folosește
1. „Use this template" / clonează acest repo.
2. Urmează [SETUP.md](SETUP.md) — o comandă pentru baza Next.js + instalare dependențe.
3. Agentul AI citește `CLAUDE.md` și respectă standardul din prima.

## Stare
- [x] `CLAUDE.md` — regulile pentru agent
- [x] Config standard: `Dockerfile`, `docker-compose.yml`, `.env.example`, `.gitignore`, `prisma/schema.prisma`
- [x] CI (`.github/workflows/ci.yml`)
- [x] Exemple: test E2E (Playwright) + test unit (Vitest) + ADR + template-uri `docs/`
- [x] `SETUP.md` — bootstrap pas cu pas
- [ ] **Singurul pas manual rămas:** baza Next.js — `npx create-next-app` (vezi [SETUP.md](SETUP.md))

> **De ce un singur pas manual:** baza Next.js se generează cu `create-next-app` (versiuni curente + lockfile garantat rulabil). Restul (CLAUDE.md, Docker, CI, docs, exemple) e independent de versiuni și e deja în repo.
