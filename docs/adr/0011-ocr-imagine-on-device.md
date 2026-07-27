# ADR 0011 — OCR pe imagine, on-device (Tesseract)

- Status: acceptat
- Data: 2026-07-27

## Context
ADR 0007 a amânat OCR-ul pe imagine: parsam doar text (MRZ / coduri CIV). Pentru un user real asta e insuficient — nimeni nu tastează MRZ-ul; oamenii urcă o poză a buletinului/CIV-ului. Fără OCR pe imagine, onboarding-ul afișa câmpuri goale („completează manual") = percepție că funcția nu merge.

## Decizie
- **OCR pe imagine cu `tesseract.js` (WASM), rulat ON-DEVICE** pe server (`src/lib/ocr/image.ts`). Imaginea NU pleacă la niciun terț — se procesează local; doar modelul lingvistic (`eng.traineddata`) se descarcă o dată (nu e PII → GDPR OK).
- `documentToText(bytes, mime)`: dacă e imagine (magic bytes PNG/JPEG sau `image/*`) → OCR; altfel → text utf8. Parserele existente (MRZ TD1, coduri CIV) primesc mereu text.
- **Robustețe la zgomotul de OCR** (`extractIdentityFromText`): OCR-ul poate strica o linie MRZ (parserul strict cere 3×30). Dacă MRZ nu iese curat, cădem pe **scanarea directă a textului după un CNP valid** (checksum) + serie/nr (2 litere + 6 cifre). Sursa devine `mrz` (MRZ curat, check-digits OK), `ocr` (CNP recuperat din text) sau `none`.
- Confirmarea manuală rămâne obligatorie (userul verifică înainte de salvare).

## Consecințe
- O poză clară a buletinului (mai ales zona MRZ) sau a CIV-ului pre-completează acum profilul/vehiculul.
- Costul: cerere mai lentă la OCR (secunde) — acceptabil la onboarding. `tesseract.js` = dependență nouă justificată (ADR).
- E2e rămân pe text MRZ/CIV (rapide, deterministe); calea imagine e testată separat. Pentru offline strict, `eng.traineddata` se poate împacheta local (langPath) — de făcut la deploy.
- Fiabilitatea pe poze de telefon slabe rămâne limitată; fallback-ul manual acoperă cazurile.
