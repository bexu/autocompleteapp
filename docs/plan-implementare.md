# Plan de implementare — până la production-ready

> Data: 2026-07-27. Document viu — se actualizează la fiecare milestone. Taskurile detaliate: `instructions/BACKLOG.md`; ordinea feliilor: `roadmap-formulare.md`; definiția „production-ready": `CLAUDE.md` (DoD + specific proiectului).

## Presupuneri
- Capacitate: 1 om (Cristi) + agenți AI (Claude Code), lucru susținut; o felie = un branch = un PR.
- Estimările sunt în săptămâni calendaristice cu această capacitate; se recalibrează după Faza 1 (prima felie măsoară viteza reală).
- Datele reale (PII) nu intră în sistem înainte de M0 (criptare) + decizia de hosting RO/UE.

## Sezonalitate & strategie
- **Termenul 230 e 25 mai** — campania utilă e feb–mai 2027. Până atunci: validare internă pe 230, valoare year-round din dosarul auto.
- **Lansare soft fără QTSP e posibilă:** 230 depus prin borderou ONG și formularele ITL olografe nu cer semnătură calificată. Contractul QTSP (extern, lent) nu blochează lansarea — semnarea calificată se activează când contractul există.

## Workstream-uri paralele
1. **Produs** — feliile verticale (backlog).
2. **Platformă** — securitate, criptare, observabilitate, CI/CD, hosting.
3. **Extern** (pornite ACUM, lead-time de luni):
   - Contract QTSP (certSIGN / Trans Sped, CSC API) — negociere din august.
   - Aviz juridic: granița software vs. consultanță (OG 71/2001) + textele de produs.
   - DPIA + pachet GDPR (registru art. 30, contracte art. 28) — început devreme, finalizat la hardening.
   - Cele două brief-uri (`acte-ro-brief.md`, `acte-ro-verificare.md`) — de adus în repo.
   - Decizie hosting RO/UE + KMS (vezi „Decizii tehnice").

## Calendar & milestones

| Milestone | Țintă | Conținut | Criteriu |
|---|---|---|---|
| **M0 — Fundație securitate** | mij. aug 2026 | 0.2 secrete + scanner CI · 0.3 criptare per-câmp (envelope + KMS) · 0.4 threat model + no-PII logging | test dovedește că CNP nu e în clar în DB; filtru PII pe loguri activ |
| **M1 — Felia 230 (intern)** | sf. sept – înc. oct 2026 | 1.1–1.9: auth · model canonic · vault documente + OCR CI · consimțământ/export/ștergere · motor template (manifest versionat) + definiția 230 · preview + semnătură mock · handoff SPV/borderou · reminder 25.05 · E2E | fluxul complet onboarding→230→preview→semnat(mock)→handoff trece E2E în CI; folosit intern pe date sintetice |
| **M2 — Dosar auto (beta Cluj)** | mij.–sf. nov 2026 | 2.1–2.6: entitate Vehicul · OCR CIV/contract · manifeste ITL-054/005/016/010 + DGPCI · wizard „am cumpărat/vândut" · checklist-uri + tracking pași · E2E | un dosar de vânzare real generat cap-coadă; manifeste cu sursă+hash verificate |
| **M3 — C168 închiriere** | mij. dec 2026 | 3.1–3.5: entitate Imobil · OCR contract · definiție C168 (înreg./modif./încetare) · tracking · E2E | C168 generat aproape integral din profil + OCR |
| **M4 — Hardening & lansare soft** | ian–feb 2027 | H.1 DPIA/GDPR · H.2 pen-test + remedieri · H.3 observabilitate fără PII + rate limiting · H.4 review juridic texte · backup/restore testat | go/no-go de mai jos; lansare înainte de campania 230 (feb 2027) |
| **M5 — Campania 230** | feb–25 mai 2027 | operare, suport, marketing campanie; QTSP real dacă contractul e semnat (comutare mock↔real prin config) | utilizatori reali; dosare „depus" |

### Post-lansare 2027 (ordinea din roadmap, recalibrată după M5)
- **feb–mar:** impozit clădiri/teren (ITL-001/003) — reutilizează masiv motorul + entitatea Imobil.
- **mar–apr:** dosar copil (DASM).
- **apr–mai:** dosar șomaj + prime ANOFM.
- **mai–iun:** spike DUKIntegrator (izolat) → decizie D212 pentru campania Declarației Unice 2028.
- **H2 2027:** cadastru/CF · pensie/deces · PFA lifecycle · urbanism · petiții universale.

## Detaliu pe faze (estimări)

### Faza 0 — rest (≈2 săpt., aug 2026)
| Task | Est. | Note |
|---|---|---|
| 0.2 Secrete & config | 2–3 zile | env + vault; gitleaks (sau echivalent) în CI; bump actions v4→v5/v6 |
| 0.4 Threat model + no-PII logging | 2–3 zile | 1 pagină + middleware filtru loguri; se face înainte de 0.3 ca să ghideze cripto |
| 0.3 Criptare per-câmp | 4–5 zile | envelope encryption, utilitar reutilizabil + test „nu e în clar în DB"; decizie KMS (ADR) |

### Faza 1 — felia 230 (≈7–8 săpt., aug–sept 2026)
| Task | Est. | Risc/dependență |
|---|---|---|
| 1.1 Auth (better-auth) + RBAC minim | 3–4 zile | — |
| 1.2 Model canonic + migrări + validări (checksum CNP, IBAN) | 4–5 zile | depinde de 0.3 |
| 1.3 Vault documente + upload CI + OCR → pre-completare | 1,5–2 săpt. | **cel mai riscant task al fazei**: decizie OCR (ADR — vezi mai jos); MRZ de pe CI e calea robustă |
| 1.4 Consimțământ + export + ștergere (GDPR) | 4–5 zile | consent ledger din 0.4 |
| 1.5 Motor template (manifest versionat) + definiția 230 | 1–1,5 săpt. | fundația întregului produs; versionare per jurisdicție+dată din prima zi |
| 1.6 Preview + abstracție semnătură (mock) | 3–4 zile | interfața CSC se definește acum, providerul real vine la M5 |
| 1.7 Handoff 230 (PDF + checklist + deep-link SPV/borderou) | 2–3 zile | — |
| 1.8 Reminder termen 25.05 (pg-boss) | 2–3 zile | prima folosire pg-boss |
| 1.9 E2E felia completă | 2–3 zile | golden path în CI |

### Faza 2 — dosar auto (≈5–6 săpt., oct–nov 2026)
2.1 Vehicul (3–4 zile) → 2.2 OCR CIV/contract (1–1,5 săpt.) → 2.3 cinci manifeste versionate, Cluj întâi (1,5 săpt. — include verificarea surselor oficiale + hash) → 2.4 wizard eveniment (4–5 zile) → 2.5 checklist-uri + tracking pași (4–5 zile) → 2.6 E2E vânzare + cumpărare (3 zile).

### Faza 3 — C168 (≈2–3 săpt., nov–dec 2026)
3.1 Imobil minim (2–3 zile) → 3.2 OCR contract închiriere (4–5 zile) → 3.3 definiție C168 (4–5 zile) → 3.4 tracking modif./încetare (2–3 zile) → 3.5 E2E (2 zile).

### Hardening (≈4 săpt. calendar, ian 2027 — parțial extern)
H.1 DPIA/GDPR (început din aug, finalizare acum) · H.2 pen-test extern + remedieri (programat din nov!) · H.3 metrici/alerting fără PII + rate limiting (3–4 zile) · H.4 review juridic texte (extern).

## Decizii tehnice de luat (fiecare = ADR scurt)
| Decizie | Când | Opțiuni de evaluat |
|---|---|---|
| KMS pentru envelope encryption | înainte de 0.3 | cloud KMS UE vs. cheie master în vault propriu (libsodium); rezidență RO/UE obligatorie |
| OCR pentru CI/CIV/contracte | înainte de 1.3 | on-prem (Tesseract + MRZ parser) vs. serviciu UE cu contract art. 28; **PII nu pleacă la terți fără temei** |
| Bibliotecă PDF (fill AcroForm + overlay) | înainte de 1.5 | pdf-lib sau echivalent — fără servicii externe |
| Storage scanuri | înainte de 1.3 | S3-compatibil UE / MinIO în Docker pentru dev |
| Hosting producție | înainte de M4 | RO/UE, Docker Compose pe VPS vs. altceva; backup criptat |
| Email tranzacțional (reminders) | înainte de 1.8 | furnizor cu procesare UE, art. 28 |

## Go/no-go pentru lansarea publică (M4)
- [ ] Aviz juridic obținut (unealtă vs. consultanță + textele de marketing).
- [ ] DPIA finalizat; registru art. 30; contracte art. 28 cu toți subprocesatorii.
- [ ] Pen-test executat, vulnerabilitățile critice/înalte remediate.
- [ ] Export + ștergere date funcționale end-to-end; retenție aplicată automat.
- [ ] Observabilitate fără PII + rate limiting + backup/restore testat.
- [ ] E2E verzi pe toate feliile lansate; zero TODO pe fluxuri critice.
- [ ] Texte fără „garantat/100% corect"; userul verifică, semnează, depune pe propria răspundere.

## Riscuri principale & mitigare
| Risc | Mitigare |
|---|---|
| OCR slab pe CI/CIV → onboarding frustrant | MRZ întâi (deterministic), OCR pe restul; userul confirmă tot; fallback manual complet |
| Contract QTSP întârzie | lansare soft fără semnătură calificată (borderou ONG, ITL olografe); interfața CSC definită din 1.6 |
| Formularele UAT se schimbă (ex. ITL-005 2026) | manifeste versionate + verificare sursă+hash la fiecare release; alertă la schimbare de hash |
| Estimările derapează | recalibrare la M1 (prima felie completă = viteza reală); feliile sunt independente — tăiem scope, nu calitate |
| Un singur om pe proiect | totul în repo (docs vii, CLAUDE_PICKUP la fiecare sesiune); agenții AI pot relua oricând |
