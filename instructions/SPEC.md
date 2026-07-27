# SPEC v1 — Autopilot acte cetățean (RO)

Sursa de context: `docs/acte-ro-brief.md` (strategie) + `docs/acte-ro-verificare.md` (fezabilitate confirmată). Acest spec e orientat pe **comportament și domeniu**; implementarea urmează template-ul/stack-ul din repo.

## Obiectiv v1
Un utilizator își completează profilul o dată și poate genera, valida și semna formulare oficiale, cu ghidaj clar de depunere. Livrăm o **felie verticală production-ready** (formular 230), pe o fundație extensibilă la alte formulare.

## Non-goals (explicit în afara v1)
- Auto-depunere prin API la ANAF (nu există) sau automatizare browser SPV.
- Taxe locale ca soluție unificată (fragmentat pe primării, fără API național).
- Semnătură prin CEI/ROeID; EUDI Wallet.
- Aplicație mobilă nativă.
- Orice funcție de „sfat" fiscal/juridic personalizat.

## Utilizatori
- **Persoană fizică** — redirecționare 3,5% (230), cereri administrative.
- **PFA / liber profesionist** — Declarația Unică (fază 2).

## Module (v1)
1. **Seif de date (Vault)** — profil + documente; criptare per-câmp; consent ledger; retenție.
2. **Model canonic „cetățean"** — un singur model din care mapează orice formular.
3. **Motor de template-uri** — definiție declarativă per formular → output PDF. Tipuri: AcroForm (fill), PDF flat (overlay), PDF inteligent ANAF (via DUKIntegrator, fază 2).
4. **Validare** — checksum CNP, IBAN, coerență; validatoare oficiale unde există.
5. **Semnătură** — abstracție peste QTSP (semnare calificată la distanță, CSC API). Provider mock în dev, real (certSIGN/Trans Sped) în prod, în spatele aceleiași interfețe.
6. **Dispatch „generate + handoff"** — PDF final + checklist + deep-link către canalul corect + instrucțiuni pas-cu-pas.
7. **Tracking & reminders** — stare dosar, termene (ex. 25.05 pentru 230/D212).

## Model canonic de date (propunere — de rafinat, nu final)
```
Persoana   { nume, prenume, cnp, ci_serie, ci_nr, ci_emitent, ci_exp, sex, data_nasterii }
Adresa     { tip(domiciliu|resedinta), strada, nr, localitate, uat, judet, cod_postal }
Contact    { email, telefon, iban }
Familie[]  { relatie, persoana_ref, in_intretinere }
Venit[]    { tip, sursa, suma, moneda, perioada }
Angajare[] { angajator, cui, functie, de_la, pana_la }
Bun[]      { tip(imobil|vehicul), detalii }
Document[] { tip, fisier_ref, valabil_pana, extras_ocr }
Consimtamant[] { scop, data, versiune_politica, activ }
```
Câmpurile CNP/CI se stochează criptat per-câmp. Modelul e sursa unică; formularele nu au date proprii, doar mapare.

## Fluxuri cheie
1. **Onboarding** — user creează cont → urcă CI → OCR extrage câmpuri → pre-completează profilul → user confirmă. Consimțământ explicit pentru fiecare categorie de date.
2. **Completare formular** — alege formular → mapare din profil → user completează golurile → validare → preview „exact ce semnezi".
3. **Semnare** — dacă formularul cere, semnare calificată prin QTSP (redirect/flux CSC), sigiliu de timp, arhivare document semnat.
4. **Depunere (handoff)** — PDF + instrucțiuni + deep-link (ex. SPV pentru 230) + checklist documente. Userul face pasul final. Marcăm dosarul „de depus / depus" (declarat de user).

## Formulare în v1 și ordine
| Ordine | Formular | Sursă/comportament | Semnătură |
|---|---|---|---|
| 1 (Felia 1) | **230** – redirecționare 3,5% | Un singur ecran; mapare din profil; PDF; handoff SPV sau borderou ONG | Opțională (SEC dacă depune electronic) |
| 2 | **D212** – Declarația Unică | PDF inteligent via DUKIntegrator; import date precompletate ANAF | SEC |
| 3 | 1–2 cereri primărie (ex. ajutor încălzire) | PDF fill/overlay; handoff per-UAT | De regulă olografă/simplă |

## Cerințe non-funcționale
- **Securitate:** criptare per-câmp pentru date sensibile, RBAC, audit log fără PII, secrete în vault, rate limiting pe rutele sensibile.
- **GDPR:** consent ledger, export & ștergere date (drepturile persoanei), retenție scanuri, registru de prelucrări.
- **Calitate:** teste (unit + un flux e2e per felie), CI verde, migrări versionate.
- **UX:** limba română, accesibilitate de bază, preview obligatoriu înainte de semnare.
- **Observabilitate:** logging și metrici fără date personale.

## Dependențe externe & riscuri
- **DUKIntegrator** (JAR Java) rulat headless pe server — necesită runtime Java + spike dedicat (fază 2).
- **Contract QTSP** (certSIGN sau Trans Sped) pentru semnare reală — CSC API, condiții RA, identificare video; până atunci provider mock.
- **Fragmentarea primăriilor** — fiecare UAT cu propriul canal; abordare per-primărie, nu unificat.
- **Aviz juridic** pe granița software vs. consultanță — de obținut înainte de lansare.
