# Audit de securitate — 2026-07-28

Audit adversarial (multi-agent) pe întreaga aplicație, cu verificare adversarială
per finding (fiecare suspiciune re-testată de un agent independent care a încercat
să o INFIRME). Dimensiuni: auth/RBAC, cripto/PII, validare/injecție, GDPR
export/ștergere, corectitudinea codului nou (copil/petiții).

**Rezultat:** 6 constatări confirmate (1 high, 3 medium, 2 low). Toate reparate în
acest PR, cu teste de regresie. Nu s-au găsit: IDOR/ownership lipsă, injecție
SQL/XSS exploatabilă (Zod la granițe + auto-escaping React), scurgeri de PII prin
mesaje de eroare, folosire greșită a AES-GCM (auth tag 16B + AAD per câmp OK).

## Constatări și remedieri

| # | Sev | Constatare | Remediere |
|---|-----|-----------|-----------|
| 1 | high | `purgeExpiredDocuments()` exista dar **nu era programat nicăieri** → scanurile CI (CNP + serie/nr) rămâneau în DB la nesfârșit, peste retenția declarată (30 zile). Încălcare GDPR art. 5(1)(e) + guardrail propriu. | Job `retention-purge` pe pg-boss, cron zilnic 03:30 ([src/jobs/retention.ts](../src/jobs/retention.ts), wireup în [worker-main.ts](../src/jobs/worker-main.ts)). Test integrare de regresie. |
| 2 | medium | Rate-limit auth relaxat la 100/min/IP pe `/sign-in` și `/sign-up` (setat ca să nu pice e2e) → brute-force/credential-stuffing fără lockout. | Praguri stricte în producție: login 10/min, signup 20/min, global 60/min. Relaxare doar în e2e prin `AUTH_RATE_LIMIT_RELAXED` (setat în `playwright.config.ts`, citit runtime server-side). ([auth.ts](../src/lib/auth/auth.ts)) |
| 3 | medium | Ruta `230/sign` (și `230/preview`) primea JSON brut **fără Zod** (unica rută-formular fără validare) → text nemărginit în PDF/DB (resource-exhaustion). | `F230BodySchema` (plafon lungimi) aplicat pe preview + sign. ([f230.ts](../src/lib/forms/f230.ts)) |
| 4 | medium | Export GDPR întorcea doar **metadate** pentru `signedForms`/`documents` → CNP-ul copilului (din PDF-ul de alocație) și corpul petiției, stocate doar în `contentEnc`, erau inaccesibile petentului (breșă art. 15). | Export include acum conținutul decriptat (base64) pentru scanuri și formulare semnate. ([export.ts](../src/lib/gdpr/export.ts)) |
| 5 | low | Rutele autentificate de generare nu aveau throttle → un cont putea umfla DB/stocarea cu blob-uri criptate + dosare. | Limitator per-user (fereastră glisantă, 30/min) pe toate rutele de generare/semnare. Limitare: in-memory, per-instanță (mutare pe store partajat = H.3). ([rate-limit.ts](../src/lib/http/rate-limit.ts)) |
| 6 | low | `redact()` nu redacta `dataNasterii`/`ciExp` (denylist avea `nascut`/`data_nasterii`, dar câmpul real e camelCase) → data nașterii putea ajunge în loguri. | Adăugate fragmente de cheie: `nasterii`, `nastere`, `ciexp`, `birth`, `expira`. Test de regresie. ([redact.ts](../src/lib/log/redact.ts)) |

## Rezidual (hardening ulterior)
- **Rate-limit distribuit** (Redis/Postgres) în locul celui in-memory — necesar la
  scalare orizontală (H.3). Rutele de upload (`documents`, `vehicule/ocr`) au deja
  plafon de dimensiune + retenție programată; throttle dedicat la nevoie.
- Restul planului de hardening: H.1 DPIA, H.2 pen-test extern, H.4 review juridic.

## Metodă
Workflow adversarial: 5 agenți de audit (câte o dimensiune) → fiecare finding
verificat de un agent independent instruit să-l infirme (default „nu e real" dacă
nu se poate construi un scenariu concret). Doar constatările care au supraviețuit
verificării apar mai sus.
