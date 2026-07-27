# Claude pickup — starea curentă

> Actualizează la sfârșitul fiecărei sesiuni, ca următoarea (AI sau om) să reia rapid.

## Unde am rămas
**Task 0.1 Bootstrap — implementat local, neîmpins încă.** (2026-07-27)
- Baza Next.js 16 generată (`create-next-app` — TS, ESLint, App Router, `src/`, fără Tailwind) peste template.
- Dependențe standard instalate: Prisma 7, Zod 4, pg-boss, Vitest 4, Playwright. Scripturi + configuri (`vitest.config.ts`, `playwright.config.ts`, `output: "standalone"`).
- Adaptare Prisma 7: `prisma.config.ts` la root, `url` scos din schema (vezi ADR 0002).
- `CLAUDE.md` completat cu contextul proiectului (guardrails + GDPR din `instructions/CLAUDE.md`); `SPEC.md` copiat la root; `docs/architecture.md` + ADR 0001 completate.
- Verificat local: `prisma generate` ✓, `typecheck` ✓, unit ✓, E2E ✓, `next build` ✓.

**Decizie de produs integrată (2026-07-27):** „dosare pentru evenimente de viață" + manifest versionat de formular + roadmap re-ordonat (dosar auto înaintea D212). Actualizate: `SPEC.md`, `instructions/BACKLOG.md` (Faza 2 = auto, Faza 3 = C168), `docs/roadmap-formulare.md` (nou), ADR 0003 (nou), `CLAUDE.md`, `docs/architecture.md`.

## Ce urmează
- Commit pe branch + PR + CI verde pe GitHub → bifează 0.1 în `instructions/BACKLOG.md`.
- Task 0.2: management secrete & config (scanner de secrete în CI).
- Lipsesc `docs/acte-ro-brief.md` și `docs/acte-ro-verificare.md` (sursa de adevăr citată de SPEC) — de obținut de la Cristi.
- De adăugat în `docs/roadmap-formulare.md`: link-urile oficiale (s-au pierdut la paste) — se verifică la implementarea fiecărui manifest.

## Decizii deschise / blocaje
- Tailwind nu e instalat (stack-ul FIX nu-l include); dacă UI-ul o cere, ADR întâi.
- better-auth se instalează la taskul 1.1 (auth), nu acum.
