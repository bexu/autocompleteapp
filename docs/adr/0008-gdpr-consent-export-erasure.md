# ADR 0008 — GDPR: consent ledger, export, ștergere, audit fără PII

- Status: acceptat
- Data: 2026-07-27

## Context
Task 1.4 + CLAUDE.md „Reguli de date": consimțământ per categorie, drepturile persoanei (acces/portabilitate + ștergere), audit fără PII.

## Decizie
- **Consent ledger** (`Consent`): o înregistrare per acordare, cu `policyVersion`; retragerea setează `withdrawnAt`. Activ = cea mai recentă acordare pe versiunea curentă, fără retragere. Categorii: `IDENTITATE`, `DOCUMENTE`, `CONTACT`. `grantConsent` idempotent. La schimbarea politicii → reacordare (istoricul rămâne).
- **Audit log** (`AuditLog`) **fără PII și fără FK** către user → supraviețuiește ștergerii contului (dovadă de conformitate). Conține id opac + acțiune + detaliu neutru (categoria). `detail` nu primește niciodată nume/CNP.
- **Export** (art. 15/20): `exportUserData` întoarce cont + profil **decriptat** (datele proprii) + metadate documente + consimțăminte, ca JSON descărcabil.
- **Ștergere** (art. 17), două nivele: `deleteUserData` (șterge profil/adrese/documente/consimțăminte, păstrează contul) și `deleteAccount` (cascadă pe tot). Auditul de ștergere se scrie înainte.
- **Rate limiting** activ implicit (better-auth) — securitate (T10); dezactivat doar în suita e2e (`AUTH_RATE_LIMIT=off`). Reglarea pragurilor pe rute sensibile = task H.3.
- Onboarding-ul cere **consimțământ explicit** (bifă) înainte de a salva date de identitate + scanul.

## Consecințe
- DPIA (task H.1) se va sprijini pe consent ledger + audit.
- Ștergerea scanurilor se face și prin retenția din seif (task 1.3), independent de ștergerea manuală.
- `exportUserData` include date decriptate → doar peste sesiune autentificată, niciodată logat.
