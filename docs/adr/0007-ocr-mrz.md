# ADR 0007 — OCR: MRZ-first, imagine amânată, confirmare obligatorie

- Status: acceptat
- Data: 2026-07-27

## Context
Task 1.3 cere pre-completarea profilului din scanul CI. Guardrail-uri: PII nu pleacă la terți fără temei legal (OCR extern = subprocesator art. 28); SPEC recomandă MRZ ca sursă robustă. Nu inventăm câmpuri/formate.

## Decizie
- **Abstracție `OcrProvider`** (`src/lib/ocr/provider.ts`) — un singur contract, provider comutabil.
- **Calea MRZ (TD1, ISO/IEC 7501-1)** implementată acum, determinist, on-device (`src/lib/ocr/mrz.ts`): parsează cele 3 linii × 30, verifică check-digit-urile, extrage nr. document (→ serie/nr CI), naționalitate, expirare, nume/prenume.
- **CNP-ul** e detectat în câmpurile opționale ca secvență de 13 cifre care trece checksum-ul CNP; sexul și data nașterii se derivă **din CNP** (autoritativ), cu fallback pe MRZ.
- **OCR pe imagine** (foto → text) e amânat, în spatele aceleiași interfețe. Când se decide, dacă e serviciu extern → contract art. 28 + procesare UE; preferat on-prem (Tesseract).
- **Confirmare obligatorie**: extragerea NU scrie în profil. Userul revizuiește/corectează, apoi confirmă (PUT `/api/profile`). Scanul se stochează criptat (seif) cu retenție.

## Consecințe
- Fluxul e util imediat pentru CI cu MRZ lizibil; pentru imagini fără text → mesaj „completează manual", fără a bloca onboarding-ul.
- Zero PII la terți în v1 (procesare locală).
- Extinderea la CIV/contracte (task-uri auto/C168) refolosește abstracția, cu parsere proprii.
