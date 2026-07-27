# CLAUDE.md — Autopilot acte cetățean (RO)

> Dacă template-ul din repo are deja un `CLAUDE.md`, integrează secțiunile de mai jos în el (nu-l suprascrie).

## Ce construim
SaaS care ține un profil unic al utilizatorului (date + documente urcate o dată) și generează formulare/cereri oficiale pre-completate, validate, semnabile electronic, gata de descărcat și depus. Piață: România. Sursa de adevăr pentru scope și fezabilitate: `docs/acte-ro-brief.md` și `docs/acte-ro-verificare.md`. Spec v1: `SPEC.md`.

## Principiul #1 de arhitectură: „generate, don't submit"
Aplicația **generează dosarul perfect și duce userul până la butonul de trimitere**; userul depune cu propriile credențiale (SPV/certificat). Nu construim auto-depunere.

## Guardrails (reguli dure — nu le încălca)
- **Unealtă, nu consultant.** Fără opinii/optimizări fiscale sau juridice personalizate. Transformăm mecanic datele introduse de user în formular. (Consultanța fiscală fără drept e infracțiune — OG 71/2001 art. 25.)
- **Fără auto-submit ANAF prin API** — nu există API de depunere generică. Nu implementa asta.
- **Fără automatizare de browser pe SPV** în v1 (zonă gri ToS).
- **Fără CEI/ROeID pentru semnătură** în v1 (CEI = doar avansată, respinsă de ANAF; ROeID = doar autentificare). Semnătura calificată se face prin QTSP (CSC API).
- **Marketing/UX:** niciodată „100% corect", „garantat", „ca un avocat/contabil". Formularea corectă: userul verifică, semnează și depune pe propria răspundere.

## Reguli de date (GDPR — obligatorii)
- CNP + serie/nr CI + scanuri = date protejate (Legea 190/2018 art. 4). **Criptare per-câmp** (envelope encryption cu KMS), nu în clar în DB.
- **Nu loga niciodată PII** (CNP, nume, scanuri, venituri). Log-uri și mesaje de eroare fără date personale.
- **Minimizare** + temei legal explicit per categorie de date + **retenție definită** (ștergere scanuri după utilizare).
- **Consent ledger** + audit log (cine/ce/când), fără PII în audit.
- Rezidența datelor: RO/UE.

## Definiția „production-ready" pentru acest proiect
Un task nu e gata dacă nu are: teste (unit + un flux de integrare), tratare de erori, migrări versionate, fără secrete în cod, validare de input, RBAC pe rutele cu date personale, și CI verde. Fără TODO-uri lăsate pe fluxuri critice.

## Stack & convenții
Urmează stack-ul, structura, linter-ul și convențiile **template-ului existent din acest repo**. Nu introduce dependențe sau pattern-uri noi fără motiv clar. Comentarii în cod: minime, în engleză.

## Cum lucrăm cu Claude Code
- **Plan mode înainte de cod.** Citește `docs/` + `SPEC.md`, propune plan, așteaptă aprobare.
- **Felii verticale mici**, una per branch. Nu ataca mai multe module deodată.
- **Nu inventa** coduri de formulare, câmpuri, rute sau API-uri. Dacă un fapt lipsește, caută în `docs/` sau întreabă — nu presupune.
- Partea riscantă (ANAF/DUKIntegrator) se face în sesiune separată de spike, izolat.
