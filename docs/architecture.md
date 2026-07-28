# Arhitectură

> Reguli în [../CLAUDE.md](../CLAUDE.md) și [../STANDARD.md](../STANDARD.md). Spec v1: [../SPEC.md](../SPEC.md).

## Context
**Autopilot acte cetățean (RO).** Utilizatorul își completează profilul o dată (date + documente) și generează formulare oficiale pre-completate, validate, semnabile electronic, cu ghidaj de depunere. Principiu: **„generate, don't submit"** — userul depune singur, cu propriile credențiale (SPV). V1 = felia verticală formular 230.

Produsul e organizat pe **„dosare pentru evenimente de viață"** (ex. „am vândut mașina"), nu catalog de formulare; fiecare formular e un **manifest versionat** per autoritate/jurisdicție/perioadă (vezi [adr/0003](adr/0003-dosare-evenimente-de-viata.md) și [roadmap-formulare.md](roadmap-formulare.md)).

## Componente
- Frontend (Next.js): onboarding, profil, completare formular, preview „exact ce semnezi", handoff. Auth: pagini signup/login/dashboard (better-auth).
- API (Next.js route handlers): auth (`/api/auth/[...all]`, better-auth), CRUD profil, generare PDF, validare, semnătură (abstracție QTSP, mock în dev). Guard-uri `requireUser`/`requireRole` (RBAC) pe rutele cu date personale.
- Bază de date (Postgres + Prisma): model canonic „cetățean" (`Profile`/`Address`, 1:1 cu `User`); câmpurile tari (CNP, serie/nr CI, IBAN) criptate per-câmp (envelope encryption, AAD = context user), accesate doar prin `src/lib/profile/repository.ts`. Validare CNP (checksum) + IBAN (mod-97). Consent ledger + audit log fără PII.
- Task-uri pe fundal (pg-boss): worker separat `src/jobs/` (`npm run jobs`) — scanează zilnic dosarele „de depus" cu termen apropiat și creează remindere (praguri T30/T7/T1). Termenul dosarului (`deadlineAt`) se calculează din regula manifestului (25.05 pentru 230). Retenție/ștergere scanuri.

## Fluxuri principale
1. **Onboarding:** cont → upload CI (seif criptat + retenție, `src/lib/documents/`) → OCR MRZ text + extractor robust (`src/lib/ocr/`) SAU **date de exemplu** (demo) → pre-completare profil → confirmare user + consimțământ per categorie. (OCR pe imagine cu Tesseract încercat și scos — nefiabil pe poze reale, ADR 0011.)
2. **Completare formular:** alegere formular → motor `src/lib/forms/` (manifest versionat `selectManifest` → mapare declarativă profil→câmpuri → generare PDF cu pdf-lib) → validare → preview. Pachete livrate: **230** (felia 1), **dosar auto** (ITL-010/054/016/005 + DGPCI), **C168**, **impozit imobil** (ITL-001/003), **dosar copil** (alocație de stat + indemnizație creștere copil — datele copilului ca inputuri, fără a persista CNP-ul copilului), **petiții universale** (PetitionBuilder, OG 27/2002), **dosar șomaj** (înregistrare ANOFM + indemnizație, Legea 76/2002), **cadastru/CF** (cerere de înscriere în cartea funciară + extras, ANCPI, Legea 7/1996) și **deces în familie** (ajutor de deces + pensie de urmaș, CNPP, Legea 360/2023 — datele decedatului ca inputuri, nepersistate). Un pachet nou = un manifest înregistrat în `src/lib/forms/registered.ts`, fără cod de business nou în motor. Validarea inputurilor: Zod la granița rutei (format/enum) + reguli `validate` pe câmpuri în motor (`cnp`/`iban`/`date`).
3. **Semnare:** semnare calificată prin QTSP (CSC API; provider mock în dev), arhivare document semnat.
4. **Depunere (handoff):** motor `src/lib/dispatch/` — semnarea deschide un `Dossier` (DE_DEPUS→DEPUS); handoff (checklist + canale SPV/borderou + termen) derivat din manifest. PDF + checklist + deep-link + instrucțiuni; userul marchează „depus" (nu depunem noi).

## Reguli de domeniu / business
Vezi guardrails în [../CLAUDE.md](../CLAUDE.md): unealtă nu consultant (OG 71/2001 art. 25), fără auto-submit ANAF, fără automatizare SPV, semnătură doar prin QTSP. Date protejate conform Legii 190/2018 art. 4 — criptare per-câmp, zero PII în loguri. Sursa de scope: [../SPEC.md](../SPEC.md).

## Model de date
Vezi `prisma/schema.prisma` (model canonic „cetățean" — propunerea din SPEC, de rafinat la taskul 1.2).

## Decizii
Vezi `docs/adr/`.
