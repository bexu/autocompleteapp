# ADR 0003 — Dosare pe evenimente de viață + manifest versionat de formular

- Status: acceptat
- Data: 2026-07-27

## Context
Planul inițial (SPEC v1) punea D212 imediat după formularul 230. Între timp: (1) ANAF are precompletare D212 în SPV din 2026 — diferențiatorul nostru acolo scade; (2) durerea reală e la fluxurile care traversează 2–3 instituții cu aceleași date repetate în 4–5 documente (ex. vânzarea unei mașini: taxe locale + DGPCI + RCA); (3) formularele UAT se revizuiesc (ITL-005 Cluj actualizat în 2026 cu normă de poluare, CO₂ hibride, putere electrice) — un PDF nedatat generează acte nevalabile.

## Decizie
1. **Produsul = „dosare pentru evenimente de viață"**, nu catalog de formulare. Userul spune „am vândut mașina"; aplicația știe documentele și instituțiile. Moduri per flux: FULL / DOSAR / LINK (definite în SPEC).
2. **Roadmap re-ordonat:** 230 → dosar auto (ITL-054/005/016/010 + DGPCI) → C168 → impozit clădiri/teren → dosar copil → șomaj → cadastru → pensie/deces → PFA → urbanism → petiții. D212 rămâne în roadmap, deprioritizat. Harta completă: `docs/roadmap-formulare.md`.
3. **Fiecare formular = manifest versionat** (FormDefinition): autoritate, jurisdicție (național/UAT), cod, revizie, interval de valabilitate, sursă oficială + hash, workflow, tip semnătură, mapări, reguli, atașamente, canale de depunere. Adăugarea unui formular = date, nu cod nou de business.
4. **Model canonic cu entități explicite** în loc de `Bun { tip, detalii }` generic: `Vehicul` (cu câmpurile din SPEC), `Imobil`, apoi `ActivitateIndependenta`, `Educatie`, `RezidentaFiscala`, `BeneficiuSocial`, `DosarAdministrativ` — fiecare adăugată când felia ei intră în lucru.

## Consecințe
- Motorul de template-uri (task 1.5) se construiește **cu versionare de la început** — selecția definiției se face după jurisdicție + dată, două revizii ale aceluiași formular pot coexista.
- Schema DB anticipează entitățile noi fără a le crea prematur; migrări la fiecare felie.
- Selectăm ~40–50 de fluxuri cu valoare reală; restul = catalog + deep-link.
- Formularele sezoniere (încălzire, APIA, programe verzi) se încarcă ca versiuni anuale, nu se hardcodează.
