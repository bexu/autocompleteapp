# SPEC v1 — Autopilot acte cetățean (RO)

Sursa de context: `docs/acte-ro-brief.md` (strategie) + `docs/acte-ro-verificare.md` (fezabilitate confirmată). Acest spec e orientat pe **comportament și domeniu**; implementarea urmează template-ul/stack-ul din repo.

> **Rev. 2026-07-27** — produs re-încadrat pe **„dosare pentru evenimente de viață"** (nu catalog de formulare), roadmap re-ordonat (dosar auto înaintea D212), model canonic extins (Vehicul, manifest versionat de formular). Vezi [ADR 0003](docs/adr/0003-dosare-evenimente-de-viata.md) și [docs/roadmap-formulare.md](docs/roadmap-formulare.md).

## Principiu de produs
Userul nu „completează un PDF" — spune **„am vândut mașina"**, iar aplicația știe toate documentele și instituțiile implicate. Fiecare flux are un mod:
- **FULL** — completare, validare, PDF, semnare, handoff.
- **DOSAR** — wizard, checklist, documente, precompletare.
- **LINK** — portalul oficial face deja treaba; noi pregătim dosarul și păstrăm rezultatul.

## Obiectiv v1
Un utilizator își completează profilul o dată și poate genera, valida și semna formulare oficiale, cu ghidaj clar de depunere. Livrăm o **felie verticală production-ready** (formular 230), pe o fundație extensibilă la alte formulare.

## Non-goals (explicit în afara v1)
- Auto-depunere prin API la ANAF (nu există) sau automatizare browser SPV.
- Taxe locale ca soluție unificată (fragmentat pe primării, fără API național).
- Semnătură prin CEI/ROeID; EUDI Wallet.
- Aplicație mobilă nativă.
- Orice funcție de „sfat" fiscal/juridic personalizat.
- Contracte juridice inventate de aplicație (excepție: modele oficiale, ex. ITL-054).
- D213/D214 (transferuri terenuri agricole / pachete de control) — prea nișate.
- Implementarea individuală a tuturor celor ~139 de cereri ale unei primării — catalog + deep-link, nu cod per cerere.

## Utilizatori
- **Persoană fizică** — redirecționare 3,5% (230), cereri administrative.
- **PFA / liber profesionist** — Declarația Unică (fază ulterioară).

## Module (v1)
1. **Seif de date (Vault)** — profil + documente; criptare per-câmp; consent ledger; retenție.
2. **Model canonic „cetățean"** — un singur model din care mapează orice formular.
3. **Motor de template-uri** — fiecare formular = **manifest versionat**: autoritate, jurisdicție (național sau UAT), cod formular, revizie, valabil de la/până la, sursă oficială + hash, workflow (pdf_overlay | dossier | deep_link), tip semnătură (none | qualified | counter), mapări de câmpuri, reguli de validare, atașamente, canale de depunere. Tipuri de generare: AcroForm (fill), PDF flat (overlay), PDF inteligent ANAF (via DUKIntegrator, faza D212). **Versionare per UAT și perioadă obligatorie** — ex. ITL-005 Cluj revizuit în 2026 (normă de poluare, emisii CO₂ pentru hibride, putere pentru electrice); un `ITL-005.pdf` nedatat nu e acceptabil — altfel la prima schimbare ANAF/UAT generăm acte nevalabile.
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
Vehicul[]  { vin, marca, model, nr_inmatriculare, civ_serie, serie_motor, cilindree_cm3,
             masa_maxima_kg, an_fabricatie, combustibil, norma_poluare, emisii_co2_g_km,
             putere_kw, data_dobandire }
Imobil[]   { tip, adresa_ref, detalii }   // de detaliat la felia impozit clădiri/teren + C168
Document[] { tip, fisier_ref, valabil_pana, extras_ocr }
Consimtamant[] { scop, data, versiune_politica, activ }
```
Câmpurile CNP/CI se stochează criptat per-câmp. Modelul e sursa unică; formularele nu au date proprii, doar mapare. Un `Bun { tip, detalii }` generic e insuficient — entitățile se modelează explicit. Entități viitoare, adăugate când feliile lor intră în lucru: `ActivitateIndependenta`, `Educatie`, `RezidentaFiscala`, `BeneficiuSocial`, `DosarAdministrativ`.

## Fluxuri cheie
1. **Onboarding** — user creează cont → urcă CI → OCR extrage câmpuri → pre-completează profilul → user confirmă. Consimțământ explicit pentru fiecare categorie de date.
2. **Completare** — alege **eveniment de viață** (ex. „am vândut mașina") sau formular direct → mapare din profil → user completează golurile → validare → preview „exact ce semnezi".
3. **Semnare** — dacă formularul cere, semnare calificată prin QTSP (redirect/flux CSC), sigiliu de timp, arhivare document semnat.
4. **Depunere (handoff)** — PDF + instrucțiuni + deep-link (ex. SPV pentru 230) + checklist documente. Userul face pasul final. Marcăm dosarul „de depus / depus" (declarat de user).

## Ordinea feliilor
| Ordine | Pachet / formular | Mod | Comportament |
|---|---|---|---|
| 1 (Felia 1) | **230** – redirecționare 3,5% | FULL | Un singur ecran; mapare din profil; PDF; handoff SPV sau borderou ONG; semnătură opțională (SEC dacă depune electronic). **Validează arhitectura.** |
| 2 | **Dosar auto** – „am cumpărat / am vândut mașina": ITL-054 (contract înstrăinare-dobândire), ITL-005 (declarare vehicul), ITL-016 (scoatere din evidență), ITL-010 (certificat atestare fiscală), cerere DGPCI (înmatriculare/transcriere/radiere/duplicat/provizorii/păstrare număr) | FULL | Upload CI + CIV + contract/factură → OCR extrage persoana și mașina → alege „am vândut/am cumpărat" → generează documentele potrivite → checklist separat taxe locale / DGPCI / RCA-CASCO / păstrare număr → tracking per pas: „fiscal obținut", „scos din evidență", „transcris", „RCA reziliat". Cluj întâi; manifeste versionate per UAT. |
| 3 | **C168** – înregistrare/modificare/încetare contract de locațiune (OPANAF 161/2025) | FULL | OCR contract → reutilizare proprietar + imobil → generare C168 aproape integral (locator, coproprietari, chiriași, cote, adresă, chirie, monedă, perioadă) → atașare contract → tracking modificare/încetare → pregătește terenul pentru D212. |

Continuarea (impozit clădiri/teren ITL-001/ITL-003, dosar copil, șomaj/ANOFM, cadastru/CF, pensie/deces, PFA lifecycle, urbanism, petiții universale) — în [docs/roadmap-formulare.md](docs/roadmap-formulare.md). **D212 rămâne în roadmap, dar deprioritizat:** ANAF are precompletare în SPV din 2026, deci diferențiatorul nostru e mai mic decât la dosarele care traversează 2–3 instituții.

## Cerințe non-funcționale
- **Securitate:** criptare per-câmp pentru date sensibile, RBAC, audit log fără PII, secrete în vault, rate limiting pe rutele sensibile.
- **GDPR:** consent ledger, export & ștergere date (drepturile persoanei), retenție scanuri, registru de prelucrări.
- **Calitate:** teste (unit + un flux e2e per felie), CI verde, migrări versionate.
- **UX:** limba română, accesibilitate de bază, preview obligatoriu înainte de semnare.
- **Observabilitate:** logging și metrici fără date personale.

## Dependențe externe & riscuri
- **DUKIntegrator** (JAR Java) rulat headless pe server — necesită runtime Java + spike dedicat (faza D212, deprioritizată).
- **Versionarea formularelor** — UAT-urile și ANAF revizuiesc formularele (ex. ITL-005 Cluj 2026); manifestele versionate + verificarea sursei oficiale sunt apărarea, altfel generăm acte nevalabile.
- **Contract QTSP** (certSIGN sau Trans Sped) pentru semnare reală — CSC API, condiții RA, identificare video; până atunci provider mock.
- **Fragmentarea primăriilor** — fiecare UAT cu propriul canal; abordare per-primărie, nu unificat.
- **Aviz juridic** pe granița software vs. consultanță — de obținut înainte de lansare.
