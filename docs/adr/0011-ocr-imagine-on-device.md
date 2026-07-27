# ADR 0011 — OCR pe imagine, on-device (Tesseract) — RESPINS

- Status: **respins / scos** (încercat 2026-07-27, scos în aceeași zi)
- Data: 2026-07-27

## Context
OCR-ul citea datele doar din MRZ ca text; o poză reală de buletin ieșea goală. Am încercat OCR pe imagine cu `tesseract.js` (WASM), rulat on-device (poza nu pleacă la terți; doar modelul se descarcă o dată).

## Ce am încercat
- `documentToText`: imagine (PNG/JPEG) → Tesseract → text; text → utf8.
- `next.config: serverExternalPackages: ['tesseract.js']` (altfel worker-ul Node se strica: „Cannot find module .../worker-script/node").
- Pe o imagine curată (MRZ randat) mergea (CNP extras în ~0.6s).

## De ce l-am scos
Pe **poze reale de buletin** (telefon, diacritice, layout, calitate variabilă) Tesseract vanilla **nu citea fiabil** — rezultate goale/greșite. Un OCR care merge doar pe imagini perfecte dă o impresie mai proastă decât o completare manuală onestă. Decizia utilizatorului: scos.

## Ce rămâne
- **Parsare MRZ (text) + extractor robust de text** (`extractIdentityFromText`): dacă cineva furnizează zona MRZ ca text sau un export text, recuperăm CNP (checksum) + serie/nr + nume/prenume. Fiabil și testat.
- **Completare cu date de exemplu** în onboarding (demo) + completare manuală — vezi fluxul onboarding.
- OCR real pe imagine rămâne o integrare viitoare, dar cu un serviciu specializat pe acte RO (nu Tesseract generic), decisă separat. `sourceUrl`/model verificate atunci.
