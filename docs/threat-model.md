# Threat model (v1) — Autopilot acte cetățean

> Data: 2026-07-27. Document viu, actualizat la fiecare felie care atinge date personale. O pagină — nu înlocuiește DPIA (task H.1).

## Ce protejăm (active)
- **PII de risc înalt:** CNP, serie/nr CI, scanuri CI/CIV/contracte, date de venit, IBAN.
- **Documente generate și semnate** (dosare oficiale).
- **Credențiale și secrete:** parole/sesiuni utilizatori, `ENCRYPTION_MASTER_KEY`, secrete QTSP/OCR.
- **Integritatea manifestelor de formular** (o definiție coruptă → acte nevalabile).

## Cine / de ce (actori de amenințare)
- Atacator extern (furt de bază de date, injection, XSS, acces la backup-uri).
- Insider / operator cu acces la infrastructură.
- Terți subprocesatori (OCR, email, QTSP) — scurgere sau procesare abuzivă.
- Utilizator rău-intenționat (acces la datele altui utilizator, escaladare de privilegii).

## Amenințări principale și contramăsuri
| # | Amenințare | Contramăsură | Task |
|---|---|---|---|
| T1 | Furt DB → CNP/CI în clar | **Criptare per-câmp** (envelope, AES-256-GCM); cheia master separat de DB | 0.3 |
| T2 | PII scurs în loguri / mesaje de eroare | Logger cu **redactare PII** obligatorie; fără `console.*` pe fluxuri cu date | 0.4 |
| T3 | Secrete în cod / în git | Config validat din env; **scanner de secrete (gitleaks) în CI**; `.env` gitignored | 0.2 |
| T4 | Acces la datele altui utilizator | **RBAC** + verificare de proprietate pe fiecare resursă; sesiuni sigure | 1.1 |
| T5 | Input malițios (injection, XSS) | **Validare Zod la granițe**; Prisma parametrizat; escaping la output | toate |
| T6 | Reținere excesivă a scanurilor | **Retenție definită** + ștergere automată după utilizare | 1.3, 1.4 |
| T7 | Subprocesator scurge PII | Minimizare; contracte art. 28; procesare în RO/UE; OCR on-prem preferat | decizii tehnice |
| T8 | Formular expirat → act nevalabil | **Manifeste versionate** cu sursă oficială + hash; alertă la schimbarea hash-ului | 1.5, 2.3 |
| T9 | Compromiterea cheii master | KEK separat de date; rotație prin re-wrapping DEK; drum de migrare spre KMS | 0.3 / ADR 0005 |
| T10 | CSRF / fixare sesiune | Protecții better-auth; cookie-uri `HttpOnly`/`SameSite`; rate limiting rute sensibile | 1.1, H.3 |

## Politica de logare (fără PII) — obligatorie
- Tot ce iese din proces trece prin `src/lib/log/logger.ts` (redactare automată).
- Interzis în loguri: CNP, nume/prenume, serie/nr CI, IBAN, email, telefon, venituri, conținut de scanuri.
- Permis: id-uri opace (dosar, user), coduri de formular, stări, coduri de eroare, durate.
- Audit log = cine/ce/când, **fără** PII (doar referințe opace).

## În afara scope-ului v1
- Auto-depunere / automatizare SPV (decizie de produs, nu doar securitate).
- Protecție împotriva unui atacator cu control total pe host la runtime (mitigat parțial prin secrete în vault).

## De reevaluat la fiecare felie nouă
Orice câmp/entitate nou cu PII → intră în lista de active + se verifică criptarea și redactarea.
