# Claude pickup — starea curentă

> Actualizează la sfârșitul fiecărei sesiuni, ca următoarea (AI sau om) să reia rapid.

## Unde am rămas
**Faza 3 C168 — implementat, pe branch `feat/m3-c168`.** (2026-07-27)
- Motor extins cu sursă „imobil" (FieldSource + mapForm + engine `opts.imobilId`).
- `src/lib/forms/c168.ts`: manifest C168 (locator din profil + imobil + contract inputuri) + Zod la graniță.
- API `/api/forms/c168/{preview,generate}`; wizard `/dashboard/c168` (preview→generare→dosar SPV).
- Operațiune (înregistrare/modificare/încetare) = input; fiecare = dosar propriu (tracking 3.4).
- **3.2 OCR contract** = îmbunătățire ulterioară (contractul e free-form, fără coduri standard); completare manuală acum.
- Review adversarial Faza 2: 6 bug-uri reparate (atomicitate auto-case, trim mapForm, CIV fals-pozitiv/hibrid/B, Zod la /api/auto).
- Verificat: 97 unit + 40 integrare + 12 e2e — verzi.
- **Următorul (roadmap): impozit clădiri/teren (ITL-001/003, reutilizează Imobil), dosar copil, șomaj; SAU hardening (H.1–H.4). Recomand review adversarial pe C168 înainte.**


**Task 2.4 + 2.5 Wizard auto — implementat, pe branch `feat/m2-auto-wizard`.** (2026-07-27)
- `src/lib/auto/event.ts`: eveniment (VANZARE/CUMPARARE) → set de formulare + mapare inputuri + checklist per instituție.
- `generateAndFileForm` (engine): generează + arhivează FĂRĂ semnătură (ITL se semnează olograf; provider "none", status "GENERATED") + dosar DE_DEPUS.
- `src/lib/auto/service.ts` `generateAutoCase`; API `/api/auto/generate`; pagină wizard `/dashboard/auto`.
- Vânzare: ITL-010/054/016. Cumpărare: ITL-005/DGPCI (contractul îl primește de la vânzător).
- Verificat: 88 unit + 34 integrare + 9 e2e — verzi.
- **Următorul: 2.6 e2e dosar auto (deja acoperit parțial de auto-wizard.spec.ts; de adăugat și cumpărare) → apoi Faza 2 completă. Recomand review adversarial pe Faza 2 înainte de a merge mai departe.**


**Task 2.3 Manifeste auto — implementat, pe branch `feat/m2-auto-manifests`.** (2026-07-27)
- Motor extins: `FieldSource` are sursă „vehicle"; `mapForm(manifest, {profile, vehicle}, inputs)`; engine încarcă vehiculul (`opts.vehicleId`).
- `src/lib/forms/auto.ts`: ITL-005 Cluj 2026 (cu normă/CO2/putere), ITL-016, ITL-010, ITL-054 (contract, cumpărător ca input), DGPCI. Înregistrate în `registered.ts`.
- `sanitize` PDF întărit (subscript CO₂, em-dash, fallback non-Latin1).
- Verificat: 83 unit + 32 integrare + 8 e2e — verzi.
- **Următorul: 2.4 wizard eveniment „am cumpărat/vândut" → generează setul corect de documente; apoi 2.5 checklist-uri dosar, 2.6 e2e.**


**Task 2.2 OCR CIV — implementat, pe branch `feat/m2-ocr-civ`.** (2026-07-27)
- `src/lib/ocr/civ.ts`: parser pe codurile armonizate UE (Directiva 1999/37/CE) + provider + factory.
- API `/api/vehicule/ocr` (stochează CIV criptat în seif + extrage câmpuri); pagină vehicule pre-completează formularul din CIV.
- Verificat: 79 unit + 29 integrare + 8 e2e — verzi.
- **Următorul: 2.3 manifeste auto (ITL-054/005/016/010 + cerere DGPCI) ca manifeste versionate; apoi 2.4 wizard eveniment, 2.5 checklist-uri dosar, 2.6 e2e.**


**Faza 2 pornită — Task 2.1 Vehicul, pe branch `feat/m2-vehicle-entity`.** (2026-07-27)
- Entitate `Vehicul` (câmpurile SPEC + ITL-005 Cluj: normaPoluare/emisiiCo2GKm/putereKw) + migrare.
- `src/lib/vehicle/` (schema Zod cu validare VIN/an, repository CRUD cu verificare proprietate); API `/api/vehicule` + `[id]`; pagină `/dashboard/vehicule`.
- Inclus în export + ștergere GDPR (parita­te menținută).
- **Fix securitate:** rate limit better-auth — default-ul strict (~3/fereastră pe /sign-up) pica e2e; NU se poate comuta prin env (Next inline-ază process.env la build). Soluție: `customRules` explicite 100/60s pe rutele de auth (protectiv, testabil).
- Verificat: 76 unit + 29 integrare + 7 e2e — verzi.
- **Următorul: 2.2 OCR CIV + contract → pre-completare vehicul; apoi 2.3 manifeste auto (ITL-054/005/016/010 + DGPCI), 2.4 wizard eveniment, 2.5 checklist-uri dosar, 2.6 e2e.**


**FAZA 1 COMPLETĂ — felia verticală 230 production-ready.** (2026-07-27)
- Toate taskurile 1.1–1.9 gata, fiecare pe PR separat cu CI verde.
- 1.9: `tests/e2e/golden-path.spec.ts` leagă tot parcursul într-un singur test.
- Acoperire totală: **76 unit + 24 integrare (DB reală) + 6 e2e**.
- Fluxul demonstrabil: cont → încarcă buletin (OCR MRZ) → consimțământ → profil criptat → 230 → preview → semnătură (mock) → dosar → handoff (checklist + SPV) → marchează depus; + export/ștergere GDPR; + remindere de termen (pg-boss).
- **Următorul: Faza 2 — dosar auto** („am cumpărat/vândut mașina"): entitate Vehicul, OCR CIV, manifeste ITL-054/005/016/010 + DGPCI, wizard eveniment, checklist-uri + tracking. Motorul de formulare e deja versionat (jurisdicție+dată) — manifestele auto se adaugă ca date.


**Task 1.8 Tracking termen + remindere — implementat, pe branch `feat/m1-reminders`.** (2026-07-27)
- `Dossier.deadlineAt` calculat din regula manifestului (25 mai pentru 230).
- `src/lib/reminders/`: `deadline.ts` (pur, calcul termen) + `service.ts` (scanDueReminders idempotent la praguri T30/T7/T1, listReminders).
- Job pg-boss: `src/jobs/worker.ts` (entry încarcă .env → dynamic import worker-main) + `npm run jobs`, cron zilnic 06:00.
- Remindere afișate pe dashboard. **Închis breșă GDPR:** `deleteUserData` șterge acum și dosare/formulare semnate/remindere.
- Verificat: 75 unit + 24 integrare + 5 e2e — verzi. (1.8 verificat prin integrare — e time/cron-driven.)
- **Ultimul din M1: 1.9 e2e complet al feliei 230 (onboarding→230→preview→semnat→handoff într-un singur test).**


**Task 1.7 Dispatch + handoff — implementat, pe branch `feat/m1-dispatch-handoff`.** (2026-07-27)
- Model `Dossier` (DE_DEPUS→DEPUS); `src/lib/dispatch/` (repository + handoff din manifest).
- Manifest cu `channels` structurate (SPV/borderou, url null până la verificare) + `deadline`.
- `signForm` deschide dosar; pagini `/dashboard/dosare` + `[id]` (checklist + canale + marchează depus).
- **Notă importantă:** manifestele se citesc prin `@/lib/forms/registered` (auto-înregistrare) — în build de producție bundle-urile separate au registry propriu; importul direct din `manifest.ts` dă registry gol.
- Verificat: 72 unit + 21 integrare + 5 e2e — verzi.
- **Următorul: 1.8 tracking termen 230 (25.05) + reminder (pg-boss). Apoi 1.9 e2e complet al feliei.**


**Task 1.6 Preview + semnătură — implementat, pe branch `feat/m1-preview-signature`.** (2026-07-27)
- `previewForm` (aceleași valori mapate ca PDF-ul) → UI „exact ce semnezi".
- `src/lib/signature/`: `SignatureProvider` + MockSignatureProvider (ștampilă + sha256); arhivă `SignedForm` criptată (AAD=user) cu hash de integritate — ADR 0010.
- Motor: `signForm` (generează → semnează → arhivează). API `/api/forms/230/{preview,sign}`.
- QTSP real (CSC) se comută prin factory-ul providerului, fără a atinge restul.
- Verificat: 70 unit + 17 integrare + 5 e2e — verzi.
- **Următorul: 1.7 dispatch „generate + handoff" pentru 230 (PDF + checklist + deep-link SPV + stare dosar).**


**Task 1.5 Motor formulare + 230 — implementat, pe branch `feat/m1-form-engine-230`.** (2026-07-27)
- `src/lib/forms/`: registry + `selectManifest` (jurisdicție+dată), mapare declarativă (`mapping.ts`), PDF cu pdf-lib (`pdf.ts`), motor (`engine.ts`), manifest 230 (`f230.ts`).
- API `/api/forms/230` (POST → PDF sau 400 validare); pagină `/dashboard/formulare/230`.
- 230 workflow „generated" până la PDF-ul oficial ANAF (sourceUrl/hash = null, de completat) — ADR 0009.
- Verificat: 68 unit + 15 integrare + 5 e2e (auth, profil, onboarding, gdpr, form230) — verzi.
- **Următorul: 1.6 preview „exact ce semnezi" + abstracție semnătură (provider mock).**


**Task 1.4 GDPR — implementat, pe branch `feat/m1-gdpr`.** (2026-07-27)
- `src/lib/gdpr/`: consent ledger (per categorie, versionat), export (JSON), ștergere (date/cont), audit fără PII.
- API `/api/gdpr/{consent,export,delete}`; pagină `/dashboard/confidentialitate`; consimțământ în onboarding.
- Rate limiting better-auth ON implicit (off doar în e2e). Modele `Consent` + `AuditLog` (fără FK, supraviețuiește ștergerii).
- Verificat: 59 unit + 13 integrare + 4 e2e (auth, profil, onboarding, gdpr) — verzi.
- **Următorul (miezul produsului): 1.5 motor de template-uri (manifest versionat) + formularul 230.**


**Task 1.3 Seif documente + OCR — implementat, pe branch `feat/m1-document-vault`.** (2026-07-27)
- Seif criptat `src/lib/documents/repository.ts`: bytes criptați (envelope, AAD=user), retenție + `purgeExpiredDocuments` (job pg-boss vine la 1.8), verificare de proprietate.
- OCR MRZ TD1 `src/lib/ocr/` (mrz.ts + provider.ts, ADR 0007): parsează CI, derivă CNP + sex + dată; imagine-OCR amânat în spatele interfeței.
- Flux: `/api/documents` (upload+OCR) → `/dashboard/onboarding` (upload→confirmă) → PUT `/api/profile`.
- Verificat: 59 unit + 9 integrare + 3 e2e (auth, profil, onboarding) — verzi.
- **Următorul:** 1.4 consimțământ + drepturi GDPR (consent ledger, export & ștergere).


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
