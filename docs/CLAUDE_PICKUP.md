# Claude pickup — starea curentă

> Actualizează la sfârșitul fiecărei sesiuni, ca următoarea (AI sau om) să reia rapid.

## Unde am rămas
**Task 1.2 Model canonic — implementat, pe branch `feat/m1-canonical-model`.** (2026-07-27)
- Modele `Profile`/`Address` (1:1 cu User) + migrare `canonical_profile`.
- `src/lib/profile/repository.ts`: upsert/get cu criptare per-câmp (AAD=`userId:field`), update parțial (absent=neschimbat, ""=șters). Validare Zod cu CNP checksum + IBAN mod-97 (`src/lib/validation/`).
- API `/api/profile` (GET/PUT, guard requireUser, fără PII în erori). Pagină `/dashboard/profil` cu mascare CNP/IBAN.
- **Test integrare pe DB reală** (`tests/integration/`, config + script `test:integration`): dovedește CNP/IBAN criptat în DB — completează partea rămasă din 0.3.
- Verificat local: 53 unit + 5 integrare + 2 e2e (auth + profil round-trip) — verzi.
- **Următorul:** 1.3 seif documente + upload CI + OCR → pre-completare profil.


**Task 1.1 Auth — implementat, pe branch `feat/m1-auth`.** (2026-07-27)
- better-auth (email+parolă) + Prisma 7 cu `@prisma/adapter-pg`; client singleton `src/lib/db/prisma.ts`.
- Modele `user/session/account/verification` + `role`; migrare `init_auth`.
- RBAC pur `src/lib/auth/rbac.ts` + guard-uri `session.ts` (`requireUser`/`requireRole`).
- Pagini: `/signup`, `/login`, `/dashboard` (protejat), logout. Home refăcut.
- E2E pe **build de producție** (`next build && next start`) — evită cursa de hidratare din dev; secrete de test generate la runtime în CI.
- Verificat local: lint, typecheck, 43 unit, e2e golden path — verzi.
- **Rămas la 1.2:** model canonic „cetățean" cu câmpuri criptate (folosește ADR 0005 + AAD=user context) + test pe DB reală că CNP nu e în clar.


**M0 — fundația de securitate: implementată, pe branch `feat/m0-security-foundation`.** (2026-07-27)
- 0.2: config validat Zod (`src/lib/config/env.ts`), gitleaks în CI, actions bump v5 (ADR 0004).
- 0.4: threat model (`docs/threat-model.md`) + logger cu redactare PII (`src/lib/log/`).
- 0.3: envelope encryption (`src/lib/crypto/field-encryption.ts`, ADR 0005) — AES-256-GCM, DEK împachetat cu KEK.
- 20 teste unit verzi; lint (max-warnings 0) + typecheck curate; gitleaks local: no leaks.
- **Rămas la 1.2:** integrarea criptării în Prisma + test pe Postgres real că valoarea stocată nu e în clar.

**Task 0.1 Bootstrap — gata: PR #1, mers în main.** (2026-07-27)
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
