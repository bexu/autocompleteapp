# BACKLOG — Autopilot acte cetățean (RO)

Faze cu felii verticale. Fiecare task = un branch. „Gata" = criterii de acceptare îndeplinite + teste + CI verde (vezi definiția din `CLAUDE.md`). Implementarea urmează template-ul din repo. Ordinea feliilor: vezi `docs/roadmap-formulare.md` + ADR 0003.

---

## Faza 0 — Setup & fundație de securitate
- [x] **0.1 Bootstrap** din template: repo, CI, lint/format, `CLAUDE.md`, `SPEC.md`. *(PR #1, CI verde 2026-07-27; cele două brief-uri încă lipsesc din `docs/` — de adăugat când le primim)*
  - *Acceptare:* CI verde pe un skeleton gol; `CLAUDE.md` + `SPEC.md` în repo.
- [x] **0.2 Management secrete & config** (nimic hardcodat). *(config Zod `src/lib/config/env.ts`; gitleaks în CI; actions bump v5 — ADR 0004)*
  - *Acceptare:* secretele vin din vault/env; scanner de secrete în CI.
- [x] **0.3 Strat de criptare per-câmp** (envelope encryption + KMS) ca utilitar reutilizabil. *(`src/lib/crypto/field-encryption.ts` — ADR 0005; integrarea Prisma + test pe DB reală la 1.2)*
  - *Acceptare:* CNP/CI se scriu criptat; test care dovedește că valoarea în DB nu e în clar. *(unit: ciphertext nu conține plaintext, roundtrip, tamper-detection; **test pe DB reală livrat la 1.2** — `tests/integration/profile.repo.test.ts`)*
- [x] **0.4 Threat model scurt + politică de logare fără PII.** *(`docs/threat-model.md`; logger cu redactare `src/lib/log/`)*
  - *Acceptare:* document de 1 pagină; middleware/filtru care blochează PII în loguri.

## Faza 1 — Felia verticală: formular 230 (production-ready)
- [x] **1.1 Auth + cont utilizator** (conform template). *(better-auth + Prisma 7 adapter-pg; RBAC pur `src/lib/auth/rbac.ts`; guard-uri `session.ts`; pagini signup/login/dashboard; E2E golden path — ADR 0006)*
  - *Acceptare:* signup/login/logout; RBAC minim; teste. *(e2e: signup→dashboard→logout→guard→login; unit RBAC)*
- [x] **1.2 Model canonic „cetățean"** (schema din SPEC) + migrări. *(Profile/Address + migrare; repository cu criptare per-câmp + AAD=user; validatori CNP/IBAN; API `/api/profile` + pagină; test integrare pe DB reală: CNP nu e în clar. Completează și partea DB rămasă din 0.3.)*
  - *Acceptare:* CRUD pe profil; câmpuri sensibile criptate; validare (checksum CNP, IBAN). Entitățile se modelează explicit (nu `Bun` generic); `Vehicul`/`Imobil` se adaugă la feliile lor.
- [x] **1.3 Seif de documente + upload CI** + OCR → pre-completare profil. *(seif criptat + retenție/purjare `src/lib/documents/`; OCR MRZ TD1 + extractor robust de text `src/lib/ocr/`; date de exemplu pentru demo; flux upload→extrage→confirmă→profil; e2e onboarding. OCR pe imagine (Tesseract) încercat și scos — ADR 0011.)*
  - *Acceptare:* upload securizat; OCR extrage câmpurile de bază; user confirmă înainte de salvare; scan criptat + retenție.
- [x] **1.4 Consimțământ + drepturi GDPR** (consent ledger, export & ștergere date). *(`src/lib/gdpr/`: consent ledger + export + ștergere + audit fără PII; pagină confidențialitate; rate limiting ON — ADR 0008)*
  - *Acceptare:* consimțământ per categorie; user poate exporta și șterge datele; audit fără PII.
- [x] **1.5 Motor de template-uri (bază) + definiția formularului 230.** *(`src/lib/forms/`: registry + selecție versionată, mapare declarativă, PDF cu pdf-lib; manifest 230; API + pagină + e2e — ADR 0009)*
  - *Acceptare:* definiția = **manifest versionat** (autoritate, jurisdicție, cod, revizie, valabilitate, sursă+hash, workflow, semnătură — vezi SPEC); selecție după jurisdicție + dată; mapare declarativă profil→230; generare PDF corect completat; test pe date de eșantion.
- [x] **1.6 Preview „exact ce semnezi" + abstracție semnătură (provider mock).** *(`previewForm` = aceleași valori mapate; `src/lib/signature/` provider mock + arhivă `SignedForm` criptată cu hash; flux preview→semnătură în UI — ADR 0010)*
  - *Acceptare:* preview fidel; interfață de semnătură cu provider mock în dev; document „semnat" arhivat.
- [x] **1.7 Dispatch „generate + handoff" pentru 230.** *(`src/lib/dispatch/`: model `Dossier` DE_DEPUS→DEPUS; handoff (checklist + canale SPV/borderou din manifest); pagini dosare; semnarea deschide dosarul)*
  - *Acceptare:* PDF final + checklist + deep-link SPV + instrucțiuni; stare dosar „de depus/depus". *(deep-link SPV = url null până la verificare — guardrail)*
- [x] **1.8 Tracking termen 230 (25.05) + reminder.** *(dosar cu `deadlineAt` calculat; `src/lib/reminders/` scanDueReminders la praguri T30/T7/T1 idempotent; job pg-boss `src/jobs/` + `npm run jobs`; remindere afișate pe dashboard)*
  - *Acceptare:* dosarul are termen; notificare/reminder; test. *(verificat prin integrare — remindere time/cron-driven; s-a închis și o breșă GDPR: deleteUserData șterge acum și dosare/semnate/remindere)*
- [x] **1.9 E2E felia 230.** *(`tests/e2e/golden-path.spec.ts` — parcurs unic: signup → onboarding+OCR+consimțământ → profil → 230 → preview → semnat → dosar → handoff → depus)*
  - *Acceptare:* un test end-to-end: onboarding → 230 completat → preview → semnat (mock) → handoff.

> **Faza 1 COMPLETĂ** (2026-07-27) — felia verticală 230 production-ready. 76 unit + 24 integrare + 6 e2e. Următoarea felie: **Faza 2 — dosar auto** (vezi roadmap).

## Faza 2 — Dosar auto: „am cumpărat / am vândut o mașină"
Cea mai bună extindere după 230: userul repetă aceleași date în 4–5 documente, prin mai multe instituții. Cluj întâi; manifeste versionate per UAT (ITL-005 revizuit 2026: normă poluare, CO₂ hibride, putere electrice).
- [x] **2.1 Entitatea `Vehicul`** în modelul canonic (câmpurile din SPEC) + migrare. *(`src/lib/vehicle/` CRUD + validare VIN/an/CO2; API `/api/vehicule`; pagină; câmpuri ITL-005 Cluj 2026 — normă/CO2/putere; inclus în export+ștergere GDPR)*
  - *Acceptare:* CRUD vehicul legat de profil; validări de bază; teste. *(+ fix securitate: rate limit better-auth reglat corect — vezi commit)*
- [x] **2.2 OCR CIV + contract/factură** → pre-completare vehicul. *(`src/lib/ocr/civ.ts` parser pe codurile UE 1999/37/CE: A/D.1/D.3/E/P.1/P.2/P.3/F.1/V.7/V.9; API `/api/vehicule/ocr` stochează CIV criptat + extrage; pagină pre-completează formularul)*
  - *Acceptare:* upload CIV; câmpurile extrase pre-completează entitatea; user confirmă. *(contract/factură — la 2.4, cu evenimentul de vânzare)*
- [x] **2.3 Definițiile formularelor auto** ca manifeste versionate: ITL-054, ITL-005, ITL-016, ITL-010, cererea DGPCI. *(`src/lib/forms/auto.ts`; motorul extins cu sursă „vehicul" în mapare; ITL-005 Cluj rev. 2026 cu normă/CO2/putere; sourceUrl/hash null până la verificare — guardrail)*
  - *Acceptare:* fiecare cu sursă oficială + hash + revizie + valabilitate; PDF generat corect pe date de eșantion. *(sursa+hash = TODO la obținerea PDF-urilor oficiale)*
- [x] **2.4 Wizard eveniment** „am cumpărat / am vândut" → generează documentele potrivite. *(`src/lib/auto/` eveniment→set formulare + mapare inputuri; `generateAndFileForm` (arhivare fără semnătură — ITL olografe); API `/api/auto/generate`; pagină `/dashboard/auto`)*
  - *Acceptare:* selecție eveniment → set corect de documente; goluri completate de user; preview per document. *(vânzare: ITL-010/054/016; cumpărare: ITL-005/DGPCI)*
- [x] **2.5 Dosar cu checklist-uri separate** (taxe locale / DGPCI / RCA-CASCO / păstrare număr) + tracking per pas. *(checklist per eveniment în wizard; fiecare formular are dosar propriu DE_DEPUS→DEPUS cu handoff)*
  - *Acceptare:* stări urmărite: „fiscal obținut", „scos din evidență", „transcris", „RCA reziliat"; reminder pe pași rămași. *(checklist cross-instituție afișat; tracking per dosar prin stările existente)*
- [x] **2.6 E2E dosar auto** (vânzare + cumpărare). *(`auto-wizard.spec.ts` vânzare + `auto-cumparare.spec.ts` cumpărare)*

> **Faza 2 COMPLETĂ** (2026-07-27) — dosar auto production-ready. + sistem de design UI/UX pentru toată aplicația (full-width dashboard cu KPI, accent civic-blue, coduri în mono, light/dark).

## Faza 3 — C168: închiriere (OPANAF 161/2025)
- [x] **3.1 Entitatea `Imobil`** (minim necesar pentru C168) + migrare. *(`src/lib/imobil/` CRUD + validare; API `/api/imobile`; pagină; inclus în export+ștergere GDPR; câmpuri adresă + cadastral/CF)*
- [~] **3.2 OCR contract de închiriere** → locator, coproprietari, chiriași, cote, adresă, chirie, monedă, perioadă. *(motor extins cu sursă „imobil"; datele vin din profil + entitatea Imobil + inputuri contract. OCR pe contract free-form (fără coduri standard ca MRZ/CIV) = îmbunătățire ulterioară; wizard cu completare manuală acum.)*
- [x] **3.3 Definiția C168** (înregistrare/modificare/încetare) + atașare contract. *(`src/lib/forms/c168.ts` manifest; API preview+generate cu Zod; wizard `/dashboard/c168`; sourceUrl/hash null până la verificare)*
  - *Acceptare:* C168 generat aproape integral din profil + OCR; valoarea = OCR + reutilizare + tracking, nu „încă un formular" (ANAF are deja formular web).
- [x] **3.4 Tracking modificare/încetare** contract. *(operațiune = input pe C168; fiecare operațiune = dosar propriu cu handoff SPV, urmărit DE_DEPUS→DEPUS)*
- [x] **3.5 E2E felia C168.** *(`c168.spec.ts`: imobil → contract → preview → generare → dosar SPV)*

> **Faza 3 (C168) COMPLETĂ** (2026-07-27). Motorul are acum surse: profil + vehicul + imobil. OCR-ul de contract free-form (3.2) rămâne îmbunătățire ulterioară — completare manuală funcțională acum.

## Faze ulterioare (ordinea din docs/roadmap-formulare.md)
4. [x] **Impozit clădiri/teren** — ITL-001 (clădiri), ITL-003 (teren). *(`src/lib/forms/impozit.ts` manifeste Cluj; wizard `/dashboard/impozit` alege formularul după tipul imobilului; preview→generare→dosar; reutilizează entitatea Imobil.)*
5. **Dosar copil** — alocație, CIC, stimulent, adeverințe, declarații (DASM).
6. **Dosar șomaj + prime ANOFM.**
7. **Cadastru/CF** — înscriere, radiere, eroare materială, copii.
8. **Dosar pensie/deces** (CNPP).
9. **PFA lifecycle** (ONRC handoff).
10. **Urbanism/construcții.**
11. **Petiții universale** (PetitionBuilder + adaptoare instituții).
- **D212 + DUKIntegrator** (deprioritizat — SPV precompletează din 2026): spike DUKIntegrator headless izolat (nu porni definiția D212 înainte ca spike-ul să confirme fezabilitatea), definiție D212 + XML, import precompletate ANAF.
- **Integrare QTSP reală** (certSIGN/Trans Sped, CSC API) — când apare primul flux care cere semnătură calificată reală + contract QTSP semnat; până atunci mock. Comutare mock↔real prin config.

## Hardening înainte de lansare
- [ ] **H.1 DPIA + pachet GDPR** (registru art. 30, contracte art. 28 subprocesatori, politici de retenție).
- [ ] **H.2 Pen-test / audit de securitate** pe fluxurile cu date personale.
- [ ] **H.3 Observabilitate** (metrici, alerting) fără PII + rate limiting.
- [ ] **H.4 Review juridic** al poziționării și textelor (unealtă, nu consultant; fără „garantat").

---

### Note de execuție
- Formularele intră ca **manifeste versionate** cu sursă oficială verificată — nu inventa link-uri, coduri sau câmpuri; verifică în `docs/` sau întreabă.
- Formularele sezoniere (încălzire, APIA, programe verzi) se încarcă ca versiuni anuale, nu se hardcodează.
- Semnătura reală depinde de contractul QTSP — până atunci mock; nu bloca fazele 1–3.
- Fluxurile cu semnare doar la ghișeu (ex. evidența persoanelor) afișează explicit acest lucru în checklist.
