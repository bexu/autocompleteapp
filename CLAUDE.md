# CLAUDE.md — reguli pentru agentul AI

Acest fișier e citit automat de agentul AI (Claude Code / Cursor) la începutul lucrului. **Respectă-l strict.** Context complet în [STANDARD.md](STANDARD.md); bootstrap în [SETUP.md](SETUP.md).

## Context proiect
**Autopilot acte cetățean (RO).** SaaS care ține un profil unic al utilizatorului (date + documente urcate o dată) și generează formulare/cereri oficiale pre-completate, validate, semnabile electronic, gata de descărcat și depus. Piață: România. Spec v1: [SPEC.md](SPEC.md); backlog: [instructions/BACKLOG.md](instructions/BACKLOG.md). Sursa de adevăr pentru scope și fezabilitate: `docs/acte-ro-brief.md` și `docs/acte-ro-verificare.md` (de adăugat în `docs/` — până atunci, SPEC.md).

**Principiul #1 de arhitectură: „generate, don't submit".** Aplicația generează dosarul perfect și duce userul până la butonul de trimitere; userul depune cu propriile credențiale (SPV/certificat). Nu construim auto-depunere.

**Principiul #2 de produs: „dosare pentru evenimente de viață".** Userul spune „am vândut mașina", nu „vreau ITL-016". Fiecare formular intră ca **manifest versionat** (autoritate, jurisdicție, revizie, valabilitate, sursă+hash) — niciodată un PDF nedatat. Roadmap după 230: dosar auto → C168 → clădiri/teren → copil (D212 deprioritizat) — vezi `docs/roadmap-formulare.md` + ADR 0003.

## Guardrails proiect (reguli dure — nu le încălca)
- **Unealtă, nu consultant.** Fără opinii/optimizări fiscale sau juridice personalizate. Transformăm mecanic datele introduse de user în formular. (Consultanța fiscală fără drept e infracțiune — OG 71/2001 art. 25.)
- **Fără auto-submit ANAF prin API** — nu există API de depunere generică. Nu implementa asta.
- **Fără automatizare de browser pe SPV** în v1 (zonă gri ToS).
- **Fără CEI/ROeID pentru semnătură** în v1 (CEI = doar avansată, respinsă de ANAF; ROeID = doar autentificare). Semnătura calificată se face prin QTSP (CSC API).
- **Marketing/UX:** niciodată „100% corect", „garantat", „ca un avocat/contabil". Formularea corectă: userul verifică, semnează și depune pe propria răspundere.
- **Nu inventa** coduri de formulare, câmpuri, rute sau API-uri. Dacă un fapt lipsește, caută în `docs/` sau întreabă — nu presupune.
- Partea riscantă (ANAF/DUKIntegrator) se face în sesiune separată de spike, izolat.

## Reguli de date (GDPR — obligatorii)
- CNP + serie/nr CI + scanuri = date protejate (Legea 190/2018 art. 4). **Criptare per-câmp** (envelope encryption cu KMS), nu în clar în DB.
- **Nu loga niciodată PII** (CNP, nume, scanuri, venituri). Log-uri și mesaje de eroare fără date personale.
- **Minimizare** + temei legal explicit per categorie de date + **retenție definită** (ștergere scanuri după utilizare).
- **Consent ledger** + audit log (cine/ce/când), fără PII în audit.
- Rezidența datelor: RO/UE.

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

Specific proiectului (production-ready): tratare de erori, validare de input (Zod), RBAC pe rutele cu date personale, fără secrete în cod, fără TODO-uri lăsate pe fluxuri critice. Felii verticale mici, una per branch — nu ataca mai multe module deodată.
