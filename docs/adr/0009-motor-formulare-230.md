# ADR 0009 — Motor de formulare (manifest → PDF) + formularul 230

- Status: acceptat
- Data: 2026-07-27

## Context
Task 1.5: motor de template-uri (bază) + definiția 230. ADR 0003 a stabilit manifestul versionat; acum îl implementăm și generăm primul PDF.

## Decizie
- **Registry de manifeste** (`src/lib/forms/manifest.ts`): înregistrare + `selectManifest(cod, jurisdicție, dată)` — preferă jurisdicția exactă peste `national`, alege revizia cu `validFrom` cel mai recent valid. Două revizii coexistă (pregătit pentru ITL-005 Cluj 2026).
- **Mapare declarativă** (`mapping.ts`): manifest + profil + inputuri → valori de câmp + erori. Sursă câmp: `profile` (cale), `input` (specific formularului) sau `const`. Validare per câmp (CNP/IBAN) reutilizează validatorii.
- **Generare PDF** cu **pdf-lib** (pur JS, fără servicii externe — decizia din plan). Workflow `"generated"`: producem un document lizibil din valorile mapate.
- **230** (`f230.ts`): manifest cu identitate contribuabil (din profil) + entitate beneficiară (input) + opțiunea 2 ani. `sourceUrl`/`sourceSha256` = `null` până la obținerea PDF-ului oficial ANAF (guardrail: nu inventăm sursa/hash).

## De ce workflow „generated" acum
Nu avem încă PDF-ul oficial ANAF (cu AcroForm) în repo. Manifestul are deja `sourceUrl`/`sourceSha256`; la obținerea + verificarea template-ului oficial, workflow-ul trece la `acroform_fill`/`pdf_overlay` folosind ACELEAȘI valori mapate — restul motorului nu se schimbă.

## Consecințe
- Preview „exact ce semnezi" (task 1.6) folosește aceleași `fields` mapate.
- Adăugarea altor formulare (auto ITL, C168) = manifest nou + eventual parser propriu, fără cod nou în motor.
- Semnătura 230 e opțională (SEC doar la depunere electronică) — abstracția de semnătură vine la 1.6.
