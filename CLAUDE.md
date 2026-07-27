# CLAUDE.md — reguli pentru agentul AI

Acest fișier e citit automat de agentul AI (Claude Code / Cursor) la începutul lucrului. **Respectă-l strict.** Context complet în [STANDARD.md](STANDARD.md); bootstrap în [SETUP.md](SETUP.md).

## Context proiect
<!-- Completează la pornirea unui proiect nou: ce face aplicația, cine o folosește, integrări specifice. -->

## Stack (FIX — nu schimba)
TypeScript (strict) · Node.js (LTS) · Next.js (App Router) · PostgreSQL · Prisma · Zod · pg-boss · better-auth · Playwright + Vitest · Docker/Compose · GitHub.
- NU schimba stack-ul. NU adăuga librării noi fără motiv real — iar dacă o faci, notează motivul într-un ADR (`docs/adr/`).
- Nu tot proiectul are nevoie de toate modulele: Next.js doar dacă are UI; Postgres+Prisma doar dacă are date relaționale; pg-boss doar dacă are task-uri pe fundal; better-auth doar dacă are autentificare.

## Hartă foldere
- `src/app/` — pagini + API (Next.js)
- `src/lib/` — logică de business
- `src/components/` — componente UI
- `src/jobs/` — task-uri pe cron (pg-boss)
- `prisma/schema.prisma` — modelul de date (sursa structurii DB)
- `tests/unit/` (Vitest) · `tests/e2e/` (Playwright)
- `docs/` — `architecture.md` (incl. reguli de domeniu), `adr/`, `runbook.md`, `GLOSSARY.md`, `AGENT_RUNBOOK.md`, `CLAUDE_PICKUP.md`, `TROUBLESHOOTING.md`, `INCIDENTS.md` (+ `CODE_REVIEW_*`, `SECURITY_AUDIT_*`, `HANDOVER_*` datate)

## Comenzi
- `npm run dev` — pornește local
- `npm test` — unit (Vitest)
- `npm run test:e2e` — E2E (Playwright)
- `npm run typecheck` — verifică tipurile
- `npm run db:migrate` — migrare Prisma
- `docker compose up` — app + Postgres

## Cum lucrezi (workflow per task)
1. **Înțelege** cerința. Dacă e ambiguă sau lipsește context, **întreabă** înainte să implementezi.
2. **Plan scurt** pentru orice task ne-trivial.
3. **Implementează minimal**, conform stack-ului — fără funcționalități/abstracții peste ce cere task-ul.
4. **Scrie testele** (E2E pe drumul principal + unit pe logica critică).
5. **Actualizează documentația** (`docs/`) și **statusul task-ului** (GitHub Projects). La final de sesiune: actualizează `docs/CLAUDE_PICKUP.md` (unde ai rămas) + un `docs/HANDOVER_YYYY-MM-DD.md` dacă a fost o sesiune importantă.
6. Verifică **Definition of Done** înainte să marchezi „gata".

## Reguli (obligatorii)
1. **Validare la granițe:** orice input extern (formular, API, JSON din surse externe) se validează cu **Zod**. TypeScript NU validează date de runtime — el verifică doar la compilare.
2. **Teste:** orice feature → E2E pe drumul principal + edge case-uri cheie; unit pe logica critică. CI trebuie să fie verde.
3. **Documentație vie:** la fiecare schimbare relevantă, actualizează `docs/`. Decizii de arhitectură → un ADR scurt în `docs/adr/`.
4. **Migrări DB:** orice schimbare de model → migrare Prisma inclusă în același PR.
5. **Securitate:** nu comite secrete (`.env`). Validează/escapează la granițe. Nu introduce vulnerabilități (injection, XSS, etc.). Citește secretele din variabile de mediu.
6. **Fără zgomot:** nume bune + tipuri în loc de comentarii pe fiecare linie; detaliul explicativ stă în `docs/`. Un comentariu doar când *de ce*-ul nu e evident.

## Convenții de cod
- TypeScript **strict**; evită `any` (folosește `unknown` + validare).
- Nume descriptive; funcții mici, cu o singură responsabilitate.
- **Fără cod mort** și fără abstracții premature — 3 linii repetate sunt ok, nu inventa un helper „pentru viitor".
- **Fără shim-uri de compatibilitate** inutile — dacă ceva nu mai e folosit, șterge-l.
- Tratează erorile la granițe (input extern, API-uri terțe); nu împrăștia try/catch peste tot.

## Git / PR
- Branch per feature → Pull Request → merge în `main` doar după **CI verde + review**.
- `main` mereu deployabil.
- **Conventional commits:** `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`. Mesaje **curate** — descriu schimbarea; **FĂRĂ** „Co-Authored-By", „made by AI/Claude" sau orice atribuire de tool.
- PR cu descriere clară a ce s-a făcut și de ce. **Audit** = descrierea PR + istoric git + `docs/adr/` (nu ștampile în commit).

## Definition of Done (nu marca „gata" fără astea)
- [ ] cod scris + review trecut
- [ ] teste verzi în CI (E2E golden path + unit pe logica critică)
- [ ] migrare DB inclusă dacă s-a schimbat schema
- [ ] documentația actualizată (architecture / ADR / runbook, după caz)
- [ ] status task actualizat în GitHub Projects
