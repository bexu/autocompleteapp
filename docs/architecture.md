# Arhitectură

> Reguli în [../CLAUDE.md](../CLAUDE.md) și [../STANDARD.md](../STANDARD.md). Spec v1: [../SPEC.md](../SPEC.md).

## Context
**Autopilot acte cetățean (RO).** Utilizatorul își completează profilul o dată (date + documente) și generează formulare oficiale pre-completate, validate, semnabile electronic, cu ghidaj de depunere. Principiu: **„generate, don't submit"** — userul depune singur, cu propriile credențiale (SPV). V1 = felia verticală formular 230.

Produsul e organizat pe **„dosare pentru evenimente de viață"** (ex. „am vândut mașina"), nu catalog de formulare; fiecare formular e un **manifest versionat** per autoritate/jurisdicție/perioadă (vezi [adr/0003](adr/0003-dosare-evenimente-de-viata.md) și [roadmap-formulare.md](roadmap-formulare.md)).

## Componente
- Frontend (Next.js): onboarding, profil, completare formular, preview „exact ce semnezi", handoff. Auth: pagini signup/login/dashboard (better-auth).
- API (Next.js route handlers): auth (`/api/auth/[...all]`, better-auth), CRUD profil, generare PDF, validare, semnătură (abstracție QTSP, mock în dev). Guard-uri `requireUser`/`requireRole` (RBAC) pe rutele cu date personale.
- Bază de date (Postgres + Prisma): model canonic „cetățean" (`Profile`/`Address`, 1:1 cu `User`); câmpurile tari (CNP, serie/nr CI, IBAN) criptate per-câmp (envelope encryption, AAD = context user), accesate doar prin `src/lib/profile/repository.ts`. Validare CNP (checksum) + IBAN (mod-97). Consent ledger + audit log fără PII.
- Task-uri pe fundal (pg-boss): reminders de termene (ex. 25.05 pentru 230), retenție/ștergere scanuri.

## Fluxuri principale
1. **Onboarding:** cont → upload CI (seif criptat + retenție, `src/lib/documents/`) → OCR MRZ (`src/lib/ocr/`) → pre-completare profil → confirmare user + consimțământ per categorie.
2. **Completare formular:** alegere formular → motor `src/lib/forms/` (manifest versionat `selectManifest` → mapare declarativă profil→câmpuri → generare PDF cu pdf-lib) → validare → preview. Formular 230 livrat (felia 1).
3. **Semnare:** semnare calificată prin QTSP (CSC API; provider mock în dev), arhivare document semnat.
4. **Depunere (handoff):** PDF + checklist + deep-link (ex. SPV) + instrucțiuni; stare dosar „de depus/depus".

## Reguli de domeniu / business
Vezi guardrails în [../CLAUDE.md](../CLAUDE.md): unealtă nu consultant (OG 71/2001 art. 25), fără auto-submit ANAF, fără automatizare SPV, semnătură doar prin QTSP. Date protejate conform Legii 190/2018 art. 4 — criptare per-câmp, zero PII în loguri. Sursa de scope: [../SPEC.md](../SPEC.md).

## Model de date
Vezi `prisma/schema.prisma` (model canonic „cetățean" — propunerea din SPEC, de rafinat la taskul 1.2).

## Decizii
Vezi `docs/adr/`.
