# ADR 0010 — Preview „exact ce semnezi" + abstracție de semnătură

- Status: acceptat
- Data: 2026-07-27

## Context
Task 1.6: preview fidel înainte de semnare + interfață de semnătură cu provider mock în dev, document semnat arhivat. Guardrail: semnătura calificată se face prin QTSP (CSC API); nu pretindem că mock-ul e semnătură reală.

## Decizie
- **Preview** (`previewForm`): întoarce ACELEAȘI valori mapate care intră în PDF (`fields`), afișate ca „exact ce semnezi" înainte de semnare. Fără PDF separat → zero divergență preview↔document.
- **Abstracție `SignatureProvider`** (`src/lib/signature/provider.ts`): `sign(pdf, ctx, now) → { signedPdf, provider, status, signedAt, contentHash }`.
  - **MockSignatureProvider** (dev/test): ștampilează vizibil „SEMNAT ELECTRONIC (mock - dev)" + timestamp, calculează sha256. Clar etichetat ca NEcalificat.
  - QTSP real (certSIGN/Trans Sped, CSC API) se comută prin config, în spatele aceleiași interfețe, când contractul există (task 2.x).
- **Arhivare** (`SignedForm` + `src/lib/signature/repository.ts`): PDF-ul semnat stocat **criptat** (envelope, AAD=user) cu `contentHash` de integritate + metadate (provider, status, signedAt). Acces cu verificare de proprietate.
- `signerLabel` din context e **neutru** (id opac, fără PII).

## Consecințe
- Comutarea mock↔QTSP nu atinge motorul de formulare, UI-ul sau arhiva — doar factory-ul providerului.
- `contentHash` permite verificarea integrității documentului arhivat.
- Handoff-ul (task 1.7) folosește documentul semnat arhivat + checklist + deep-link.
- Pentru 230, semnătura e opțională (SEC doar la depunere electronică); fluxul o oferă, nu o impune.
