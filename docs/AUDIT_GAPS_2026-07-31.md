# Audit „ce lipsește” — 2026-07-31

> Audit adversarial multi-agent (4 dimensiuni: promisiuni-vs-cod, fundături/inaccesibil, fluxuri reale de user, securitate), cu verificare adversarială per constatare. **32 confirmate**: 10 high, 13 medium, 9 low. Unele constatări sunt raportate de mai mulți agenți (duplicate) — vezi titlurile similare.

Declanșator: pagina dosarului cerea „Descarcă PDF-ul generat” fără să existe rută de download (reparat în PR #34).

## Constatări

### 1. [HIGH] Adresa de domiciliu nu poate fi introdusă niciunde în UI, deși 11 manifeste o mapează din profil

**Fișier:** `src/app/dashboard/profil/profile-form.tsx:23`

Unsprezece manifeste mapează câmpuri de adresă din `profile.addresses.0.*` (f230.ts:28-31 judet/localitate/strada/nr; auto.ts:16-19; somaj.ts:19-20; deces.ts:44-45; cadastru.ts:36-37; pfa.ts:32-33; urbanism.ts:32-33; impozit.ts:14; petitii.ts:23). `ProfileInput` acceptă `addresses` (src/lib/profile/schema.ts:49), `upsertProfile` le scrie (profile/repository.ts:92-96) și `getProfile` le sortează special ca `addresses.0` să fie domiciliul (repository.ts:113-120). DAR niciun formular din UI nu trimite vreodată `addresses`: `ProfileForm` construiește payload-ul doar din nume/prenume/telefon/cnp/iban (profile-form.tsx:23-31) și pagina nu are câmpuri de adresă; onboarding-ul trimite doar nume/prenume/cnp/ciSerie/ciNr/sex/dataNasterii/ciExp (onboarding-upload.tsx:97). Niciun câmp de adresă nu e `required: true`, deci maparea nu dă eroare — trece silențios cu string gol (mapping.ts:65-79). Toate

**Scenariu:** User nou: parcurge onboarding-ul (buletin → confirmă → salvează), completează Profilul meu (nume, prenume, telefon, CNP, IBAN), apoi Formular 230 → Previzualizează. În tabelul „Exact ce semnezi" apare Județ „—", Localitate „—", Stradă „—", Număr „—". Semnează → descarcă `formular-230-semnat.pdf` cu adresa fiscală goală. Cererea 230 fără adresa contribuabilului e respinsă la ANAF/ONG. Identic pentru ITL-005/ITL-016/ITL-010/DGPCI (auto), ANOFM, CNPP, ONRC, ANCPI, petiții — nu există NICIO cale în 

### 2. [HIGH] Retragerea consimțământului nu oprește nicio prelucrare — `hasConsent` nu e apelat nicăieri

**Fișier:** `src/lib/gdpr/consent.ts:26`

`hasConsent(userId, category)` e exportat dar nu are niciun consumator în afara `grantConsent` (grep pe tot `src/`: singurele referințe la consimțământ în afara modulului sunt `getConsentStatus` în export.ts:67 și `deleteMany` în delete.ts:19). Nicio rută nu verifică consimțământul înainte de prelucrare: POST /api/documents (route.ts:32) salvează scanul fără să ceară DOCUMENTE, PUT /api/profile (route.ts:20) salvează CNP/CI fără IDENTITATE, PUT-ul de IBAN/telefon fără CONTACT, iar rutele de generare citesc profilul decriptat indiferent de stare. Totuși pagina de confidențialitate afirmă „Controlezi ce prelucrăm și îți poți lua sau șterge datele oricând" (privacy-panel.tsx:60) și expune un toggle per categorie (privacy-panel.tsx:66-77), iar DPIA-2026-07-28.md:79 declară temeiul legal al scanurilor ca „art. 6(1)(a) — consimțământ (consent ledger, retragibil)". Retragerea scrie doar `withdr

**Scenariu:** User urcă buletinul în onboarding (se acordă IDENTITATE + DOCUMENTE), apoi merge la Confidențialitate și debifează „Documente încărcate (scanuri)". Bifa se stinge, apare acordul retras în ledger — dar scanul CI criptat rămâne în `document` până la purge-ul de retenție (până la 30 de zile), GET /api/documents îl întoarce în continuare, exportul GDPR îl decriptează și îl livrează base64 (export.ts:74), iar dacă userul urcă alt document POST /api/documents îl acceptă fără să verifice nimic. Identic

### 3. [HIGH] Adresa de domiciliu nu poate fi introdusă din UI, deși 21 de câmpuri din 10 familii de formulare o mapează

**Fișier:** `src/app/dashboard/profil/profile-form.tsx:23`

Modelul `Address` (prisma/schema.prisma), `AddressInput` (src/lib/profile/schema.ts:17), câmpul `addresses` acceptat de PUT /api/profile (src/lib/profile/schema.ts:49) și scrierea tranzacțională din `upsertProfile` (src/lib/profile/repository.ts:88-96) există și funcționează — dar NICIO pagină nu trimite vreodată `addresses`: `grep -rn "addresses" --include="*.tsx" src/` returnează zero rezultate. Formularul de profil trimite doar nume/prenume/telefon/cnp/iban (profile-form.tsx:23-31), iar onboarding-ul trimite doar câmpurile de identitate (onboarding-upload.tsx:98-100). Între timp 21 de FieldDef din 10 fișiere de manifest citesc `profile.addresses.0.*` (f230.ts:28-31, auto.ts:16-19, cadastru.ts:36-37, somaj.ts:19-20, deces.ts:44-45, urbanism.ts:32-33, pfa.ts:32-33, impozit.ts:14, petitii.ts:23). Niciunul nu are `required: true`, deci `mapForm` (src/lib/forms/mapping.ts:70) NU produce er

**Scenariu:** User nou → onboarding → completează profilul din UI → Formular 230 → preview arată „Județ: —, Localitate: —, Stradă: —, Număr: —” → semnează și descarcă. PDF-ul 230 depus la ANAF are adresa contribuabilului goală → cerere respinsă. Singura cale de a popula adresa e un apel manual `PUT /api/profile` cu `{addresses:[...]}` din afara aplicației.

### 4. [HIGH] Consimțământul retras nu are niciun efect — `hasConsent` nu e apelat de nicio rută

**Fișier:** `src/lib/gdpr/consent.ts:26`

`hasConsent(userId, category)` e exportat, testat (tests/integration/gdpr.test.ts:46) și nefolosit în producție: nicio rută sau pagină nu îl importă (singurii consumatori ai modulului sunt `getConsentStatus` în export/UI și `grantConsent`/`withdrawConsent` în /api/gdpr/consent). Panoul din src/app/dashboard/confidentialitate/privacy-panel.tsx:70-84 lasă userul să retragă „DOCUMENTE” sau „IDENTITATE”, scrie corect `withdrawnAt` în ledger — dar POST /api/documents, POST /api/vehicule/ocr, PUT /api/profile și rutele de generare nu verifică nimic. Ledgerul de consimțământ e doar contabilitate, nu poartă de acces.

**Scenariu:** Userul retrage consimțământul pentru categoria DOCUMENTE din pagina Confidențialitate, apoi urcă un CIV la /dashboard/vehicule: fișierul se stochează criptat exact ca înainte. Aplicația prelucrează date pentru care ledgerul propriu spune că temeiul a fost retras.

### 5. [HIGH] Nu există nicio cale de a șterge sau reface un dosar greșit — singura scăpare e ștergerea tuturor datelor

**Fișier:** `src/app/dashboard/dosare/page.tsx:25`

Nu există `DELETE /api/dossiers/[id]` (singurele rute DELETE din aplicație sunt src/app/api/vehicule/[id]/route.ts:19 și src/app/api/imobile/[id]/route.ts:19) și nici funcție `deleteDossier` în src/lib/dispatch/repository.ts (are doar create/list/get/markSubmitted). Lista (src/app/dashboard/dosare/page.tsx:25-45) și pagina de detaliu (src/app/dashboard/dosare/[id]/page.tsx) nu au buton de ștergere sau „regenerează". Singurul mecanism care șterge dosare e `deleteUserData` (src/lib/gdpr/delete.ts:10-21), care șterge simultan profilul, documentele, vehiculele, imobilele, TOATE dosarele și consimțămintele. Fluxurile multi-formular agravează: `generateAutoCase` creează 2-3 dosare deodată (src/lib/auto/service.ts:35), la fel deces/copil/pfa/somaj.

**Scenariu:** Userul greșește CNP-ul cumpărătorului în „Dosar auto", generează dosarul (2 dosare + 2 PDF-uri arhivate), observă greșeala și regenerează corect. Rămâne permanent cu 4 dosare „De depus" în listă, dintre care 2 greșite și imposibil de distins (vezi și lipsa titlului/datei). Ca să scape de ele trebuie să apese „Șterge datele personale", care îi șterge și profilul, scanul CI și vehiculele — adică tot ce a construit.

### 6. [HIGH] Remindere de termen care nu se sting niciodată — alarma „Termene apropiate" rămâne pe dashboard permanent

**Fișier:** `src/lib/reminders/service.ts:57`

`listReminders` (src/lib/reminders/service.ts:57-68) întoarce TOATE rândurile `Reminder` ale userului, fără filtru pe statusul dosarului sau pe `deadlineAt < now`. Nimic nu le șterge vreodată: `markSubmitted` (src/lib/dispatch/repository.ts:66-78) doar setează statusul, jobul de retenție (src/jobs/retention.ts:12-16) curăță doar documente și ferestre de rate-limit, iar `scanDueReminders` (src/lib/reminders/service.ts:15-48) doar creează (`createMany` cu `skipDuplicates`). Singura ștergere e în `deleteUserData` (src/lib/gdpr/delete.ts:12). Testul de integrare acoperă doar „nu creează remindere noi pentru dosare depuse" (tests/integration/reminders.test.ts, testul „nu creează remindere pentru dosare deja depuse") — nu verifică deloc stingerea celor existente. Dashboard-ul le afișează ca stat „critical" (src/app/dashboard/page.tsx:27) și ca banner ⏰ (src/app/dashboard/page.tsx:99-121), fără

**Scenariu:** Userul semnează formularul 230, primește remindere T30 și T7 pe măsură ce se apropie 25 mai, depune formularul și apasă „Marchează ca depus". Bannerul roșu „⏰ Termene apropiate — Formular 230, termen 2026-05-25" rămâne pe dashboard și după depunere, și după 25 mai, la nesfârșit, alături de contorul „Termene apropiate: 2" colorat critic. Userul nu are niciun buton de a-l închide, deci încetează să mai creadă alarma — exact funcția pentru care s-a construit sistemul de termene.

### 7. [HIGH] Nu există politică de confidențialitate / informare art. 13-14 GDPR, deși codul referă o „versiune de politică" și DPIA o listează ca lacună

**Fișier:** `src/lib/gdpr/consent.ts:12`

`CURRENT_POLICY_VERSION = "2026-07-27"` (src/lib/gdpr/consent.ts:12) e stocat în consent ledger la fiecare `grantConsent` (src/lib/gdpr/consent.ts:47) — dar politica cu acea versiune nu există nicăieri în aplicație. Nu există rută publică (`src/app/` conține doar `page.tsx`, `login/`, `signup/`, `dashboard/`, `api/`); `/dashboard/confidentialitate` (src/app/dashboard/confidentialitate/page.tsx:6-10) e un panou de consimțământ+export+ștergere, accesibil DOAR după autentificare, și nu conține text informativ (scopuri, temei legal, destinatari, retenție, DPO, dreptul de plângere la ANSPDCP). Landing page-ul (src/app/page.tsx) nu are footer și niciun link; signup-ul (src/app/signup/page.tsx:44-75) colectează nume+email fără nicio informare; caseta de consimțământ de la onboarding — „Sunt de acord cu procesarea datelor de identitate și a scanului" (src/app/dashboard/onboarding/onboarding-uplo

**Scenariu:** Un utilizator real bifează „Sunt de acord cu procesarea datelor de identitate și a scanului" înainte de a-și încărca CNP-ul și buletinul. Nicăieri, nici înainte nici după, nu poate afla cine e operatorul, cât timp se păstrează scanul (30 de zile — știe doar codul), cui se transmite (QTSP, KMS, hosting), sau unde se plânge. La un control ANSPDCP consimțământul e invalid și tot temeiul prelucrării CNP-ului (Legea 190/2018 art. 4) cade.

### 8. [HIGH] GET /api/gdpr/export decriptează în memorie TOATE documentele + PDF-urile și le serializează într-un singur string → OOM / DoS pe tot procesul

**Fișier:** `src/lib/gdpr/export.ts:71`

`exportUserData` încarcă toate documentele (până la 8 MB fiecare) și toate formularele semnate, le decriptează, le convertește în base64 (+33%) și abia apoi ruta face `JSON.stringify(data, null, 2)` peste agregatul complet (src/app/api/gdpr/export/route.ts:9-10). Nu există streaming, nici cotă pe număr de documente per user, nici rate-limit pe rută (spre deosebire de rutele de generare, care apelează `guardGeneration`). Amplificarea este: N × 8 MB → ×1.33 (base64) → ×2 (copia string-ului din JSON.stringify) → ×2 (Buffer-ul de răspuns). Verificat pe serverul de dev: ruta întoarce 200 și construiește tot payload-ul în memorie.

**Scenariu:** Un user autentificat (înregistrarea e liberă) urcă 60 de scanuri de 8 MB prin POST /api/documents (nelimitat — vezi finding-ul separat), apoi apelează în buclă GET /api/gdpr/export. Fiecare cerere alocă ~1,3 GB heap; 2-3 cereri concurente depășesc heap-ul default al Node → proces OOM → indisponibilitate pentru toți utilizatorii, nu doar pentru atacator.

### 9. [HIGH] Limita de 8 MB la upload e verificată DUPĂ ce tot corpul cererii a fost bufferizat în memorie

**Fișier:** `src/app/api/documents/route.ts:42`

`await req.formData()` (linia 35) și `Buffer.from(await file.arrayBuffer())` (linia 42) citesc integral corpul cererii în memorie; abia la linia 44 se compară cu `MAX_DOCUMENT_BYTES`. Route handler-ele App Router din Next.js NU au limită implicită de corp (`bodyParser.sizeLimit` e doar pentru Pages API). Aceeași problemă în src/app/api/vehicule/ocr/route.ts:11-19. Verificat empiric: un POST de 60 MB (7,5× peste limită) e acceptat, bufferizat complet și abia apoi respins cu 413 în 2,4 s — deci nu există niciun plafon upstream.

**Scenariu:** Un user autentificat trimite POST /api/documents cu un fișier de câțiva GB (sau câteva cereri paralele de 500 MB). Serverul alocă corpul integral în heap înainte de a-l respinge → OOM / degradare severă. Costul pentru atacator e doar lățime de bandă; niciun rate-limit nu îl încetinește.

### 10. [HIGH] Rutele de upload (/api/documents, /api/vehicule/ocr) nu au niciun rate-limit, deși toate rutele de generare au

**Fișier:** `src/app/api/documents/route.ts:32`

Toate rutele de generare apelează `guardGeneration(user.id)` (30/min, distribuit prin Postgres — src/lib/http/rate-limit.ts:62). Rutele care scriu cel mai mult în DB — upload-ul de scanuri (src/app/api/documents/route.ts:32) și OCR-ul CIV (src/app/api/vehicule/ocr/route.ts:8) — nu îl apelează deloc, iar `saveDocument` nu impune nicio cotă per user (src/lib/documents/repository.ts:243). Verificat empiric: 35 de upload-uri consecutive de la același user au întors toate 200, niciun 429. La fel, rutele de preview (src/app/api/forms/230/preview/route.ts:13, c168/preview, impozit/preview) nu au rate-limit, deși decriptează profilul la fiecare apel.

**Scenariu:** Un user autentificat rulează un script care urcă în buclă fișiere de 8 MB: fiecare devine un blob criptat (~11 MB text) în tabela `document`, cu retenție 30 de zile. În câteva ore umple stocarea Postgres → scrierile eșuează pentru toți utilizatorii. Rate-limitul distribuit există deja în cod și nu e aplicat aici.

### 11. [MEDIUM] Reminderele nu se sting după „Marchează dosarul ca depus" — dashboard-ul alarmează la infinit

**Fișier:** `src/lib/reminders/service.ts:57`

Checklist-ul de handoff cere explicit „Marchează dosarul ca depus după ce l-ai trimis" (src/lib/dispatch/handoff.ts:33) și butonul există (dosare/[id]/submit-button.tsx:30 → POST /api/dossiers/[id]/submit). Dar `markSubmitted` (dispatch/repository.ts:66-78) doar setează status/submittedAt; nu atinge tabela `reminder`. Iar `listReminders` (reminders/service.ts:57-68) întoarce TOATE rândurile userului — fără filtru pe statusul dosarului și fără filtru pe termen trecut (`Reminder` nici măcar nu are FK către `Dossier`, prisma/schema.prisma:Reminder). Singurul loc care șterge remindere e ștergerea GDPR (gdpr/delete.ts:12). `scanDueReminders` filtrează corect la CREARE (`status: "DE_DEPUS"`, service.ts:17), iar testul acoperă exact și numai asta („nu creează remindere pentru dosare deja depuse", tests/integration/reminders.test.ts:71-81) — deci reminderele create ÎNAINTE de depunere nu sunt te

**Scenariu:** User semnează Formularul 230 pe 20 aprilie 2026 → dosar DE_DEPUS cu deadlineAt 2026-05-25. Jobul de la 06:00 rulează pe 25 aprilie și creează reminderul T30. Pe 2 mai userul depune în SPV și apasă „Marchează ca depus" — dosarul devine DEPUS. Pe dashboard, cardul „Termene apropiate" arată în continuare 1 și blocul ⏰ afișează „Formular 230 — termen 2026-05-25" (dashboard/page.tsx:27 și 99-114). Alarma rămâne și după 25 mai, și în 2027, pentru un dosar deja depus — exact acțiunea pe care aplicația 

### 12. [MEDIUM] „Documentele într-un singur loc" — niciun ecran care să listeze/șteargă documentele urcate; GET /api/documents nu e consumat

**Fișier:** `src/app/api/documents/route.ts:21`

Landing page-ul promite „Îți ții datele și documentele într-un singur loc" (src/app/page.tsx:35-37) și onboarding-ul chiar stochează scanul CI criptat (onboarding-upload.tsx:55 → POST /api/documents → saveDocument). Dar în tot `src/app/dashboard/**` nu există nicio pagină de documente: grupul „Cont & date" din dashboard/page.tsx:64-69 are un singur item (Confidențialitate), iar singura referință la /api/documents din UI e POST-ul din onboarding. `GET /api/documents` (route.ts:21-30) nu e apelat de nicio componentă — exact tiparul lacunei deja reparate (rută/consumator lipsă, doar exportul GDPR mai citește datele: gdpr/export.ts:63). La fel, `deleteDocument` (lib/documents/repository.ts:90-95) nu are niciun apelant în `src/` — doar în tests/integration/documents.repo.test.ts:65.

**Scenariu:** User urcă buletinul la onboarding. O săptămână mai târziu vrea să vadă ce scanuri sunt stocate sau să șteargă doar buletinul (păstrând profilul). Nu există nicio pagină, niciun link, niciun buton — singura opțiune e „Șterge datele personale" din Confidențialitate, care șterge tot (profil, dosare, vehicule, imobile — gdpr/delete.ts:11-20). În plus, după 30 de zile jobul de retenție îi șterge scanul (jobs/retention.ts:13) fără ca userul să fi putut vreodată vedea că exista sau când expiră (`retain

### 13. [MEDIUM] UI-ul anunță „Semnat" deși providerul de semnătură e mock necondiționat, fără comutator de configurare

**Fișier:** `src/lib/signature/provider.ts:54`

`getSignatureProvider()` întoarce mereu `new MockSignatureProvider()` (provider.ts:54-58) — nu există nicio variabilă de mediu sau ramură de config care să comute pe QTSP (nimic legat de semnătură în src/lib/config/env.ts). Fișierul își impune singur regula: „NICIODATĂ nu pretindem că mock-ul e semnătură calificată reală" (provider.ts:7), iar ștampila din PDF spune „SEMNAT ELECTRONIC (mock - dev)" cu font 8, gri (provider.ts:38-44). Dar UI-ul nu transmite nimic din asta: butonul e „Semnează și arhivează" (formulare/230/form-230.tsx:106-108), mesajul de succes e „Semnat, arhivat și descărcat." (form-230.tsx:112), fișierul descărcat se numește `formular-230-semnat.pdf` (form-230.tsx:77) și `SignedForm.status` se persistă ca „SIGNED" (provider.ts:50). Încalcă și guardrail-ul de marketing din CLAUDE.md (nu promite ce nu livrezi).

**Scenariu:** User completează 230, apasă „Semnează și arhivează", vede „Semnat, arhivat și descărcat." și primește `formular-230-semnat.pdf`. Îl trimite ONG-ului sau îl încarcă în SPV convins că poartă o semnătură electronică. Documentul nu are nicio semnătură criptografică — doar un text gri „(mock - dev)" în josul primei pagini. Aplicația nu îi spune nicăieri, nici pe pagina dosarului, că semnătura calificată încă nu e disponibilă și că formularul trebuie semnat olograf.

### 14. [MEDIUM] ITL-005 „Data dobândirii" și „Masă maximă" nu pot fi completate din nicio pagină a aplicației

**Fișier:** `src/app/dashboard/vehicule/vehicule-panel.tsx:13`

Manifestul ITL-005 Cluj 2026 mapează `dataDobandire` din vehicul (forms/auto.ts:62) și `masaMaximaKg` (auto.ts:35, marcat în comentariu drept câmp „cerut de ITL-005 Cluj rev. 2026", auto.ts:33). `VehiculInput` acceptă ambele plus `serieMotor`, `anFabricatie`, `civSerie` (vehicle/schema.ts:39-56) și POST /api/vehicule le-ar salva. Dar `Draft` din panoul Vehicule are doar marca/model/nrInmatriculare/vin/normaPoluare/emisiiCo2GKm/putereKw/cilindreeCm3/combustibil (vehicule-panel.tsx:13-23) — niciun câmp pentru dataDobandire/masaMaximaKg/serieMotor/anFabricatie, și nu există ecran de editare (PUT /api/vehicule/[id] nu e apelat din UI). Nici wizardul auto nu acoperă golul: câmpul „Data tranzacției" e randat DOAR pentru VANZARE (auto-wizard.tsx:143-166), iar `buildInputs` pentru ITL-005 întoarce `{}` cu comentariul „datele vin din vehicul + profil" (auto/event.ts:95). Câmpurile nu sunt `requir

**Scenariu:** User adaugă vehiculul (inclusiv prin OCR CIV — extractorul nici el nu întoarce dataDobandire), apoi Dosar auto → „Am cumpărat o mașină" → Generează dosarul. Wizardul nu îi cere nicio dată. ITL-005 se generează cu „Data dobândirii" goală, „Masă maximă (kg)" goală, „Serie motor" goală, „An fabricație" gol. Checklist-ul îi spune „Declară vehiculul la taxe locale (ITL-005), cu contractul primit" (auto/event.ts:85), dar declarația fără data dobândirii e respinsă la DITL — și e chiar data care declanș

### 15. [MEDIUM] Documentele încărcate (seif) nu pot fi listate, descărcate sau șterse din aplicație

**Fișier:** `src/lib/documents/repository.ts:90`

Documentele se creează din două locuri (POST /api/documents pentru CI — src/app/api/documents/route.ts:36, și POST /api/vehicule/ocr pentru CIV — src/app/api/vehicule/ocr/route.ts:22), stocate criptat cu retenție de 30 de zile. Dar: (1) nu există nicio rută `/api/documents/[id]` — deci `getDocumentContent` (repository.ts:80) și `deleteDocument` (repository.ts:90) nu sunt apelate de nicio rută/pagină; singurul consumator al lui `getDocumentContent` e exportul GDPR (src/lib/gdpr/export.ts:74) — fix situația PDF-ului dinainte de reparație; `deleteDocument` e apelat DOAR din teste (tests/integration/documents.repo.test.ts:65). (2) `GET /api/documents` (src/app/api/documents/route.ts:20-24) există și întoarce lista, dar nicio componentă nu îl apelează — singurul fetch către `/api/documents` din UI e POST-ul de upload (onboarding-upload.tsx:55). (3) Nu există pagină `/dashboard/documente` și n

**Scenariu:** User urcă din greșeală scanul buletinului altcuiva la onboarding. Nu are unde să îl vadă (nicio listă), nu îl poate descărca și nu îl poate șterge individual. Scanul rămâne criptat în DB până la purjarea automată de la 30 de zile — singura alternativă e ștergerea completă a contului/datelor.

### 16. [MEDIUM] Reminderele nu se șterg niciodată după depunere sau după trecerea termenului

**Fișier:** `src/lib/reminders/service.ts:57`

`scanDueReminders` doar creează rânduri (service.ts:46). Singurul `reminder.deleteMany` din tot codul e în src/lib/gdpr/delete.ts:12 (ștergerea globală de date). `markSubmitted` (src/lib/dispatch/repository.ts:66) trece dosarul în DEPUS dar nu atinge reminderele, iar `listReminders` (service.ts:57) nu filtrează nici după starea dosarului, nici după `deadlineAt > now`. Dashboard-ul afișează necondiționat contorul „Termene apropiate” (src/app/dashboard/page.tsx:27) și secțiunea de alertă (page.tsx:99). În plus `ReminderView` nu expune `dossierId`, deci reminderul afișat nu poate duce la dosarul lui — linkul stat-card merge generic la /dashboard/dosare.

**Scenariu:** User generează 230 în ianuarie (termen 25 mai) → jobul creează reminder T30 → userul depune și apasă „Am depus” → dosarul e DEPUS, dar dashboard-ul continuă să afișeze „Termene apropiate: 1” și alerta ⏰ pentru 230, la nesfârșit, inclusiv după 25 mai. Nu există niciun mod de a le închide.

### 17. [MEDIUM] Dosarele și PDF-urile arhivate nu pot fi șterse individual și nu au retenție

**Fișier:** `src/lib/dispatch/repository.ts:51`

Fiecare apăsare de „Generează” creează atomic un SignedForm criptat + un Dossier (src/lib/forms/engine.ts:172-212). Repository-ul de dosare expune create/list/get/markSubmitted — nicio funcție de ștergere; `src/lib/signature/repository.ts` are doar archive/list/get. Nu există rută DELETE /api/dossiers/[id], iar pagina dosarului (src/app/dashboard/dosare/[id]/page.tsx) oferă doar descărcare + „am depus”. Spre deosebire de `Document` (care are `retainUntil` + purjare în src/jobs/retention.ts), `SignedForm` și `Dossier` n-au niciun câmp de retenție și niciun job — deși PDF-urile conțin PII (CNP, adresă, date de copil/deces). Un dosar marcat DEPUS nici nu poate fi readus la DE_DEPUS (markSubmitted e unidirecțional, fără rută inversă).

**Scenariu:** User apasă din greșeală de trei ori „Generează dosarul” în wizardul auto → 3× N dosare duplicate în „Dosarele mele”, fiecare cu PDF criptat cu CNP-ul lui. Nu are niciun buton de ștergere pentru vreunul; lista rămâne murdară permanent, iar blobs-urile PII se păstrează la infinit. Singura curățare e „Șterge toate datele personale”, care distruge și dosarele valide.

### 18. [MEDIUM] Erorile de validare afișează chei tehnice („imobilJudet") deși mesajul în română există deja și e aruncat la graniță

**Fișier:** `src/lib/forms/mapping.ts:68`

`FieldError` are DOUĂ câmpuri: `key` (tehnic) și `message` (română, gata de afișat — `${def.label} e obligatoriu` / `${def.label} invalid`, ex. „Imobil — județ e obligatoriu", src/lib/forms/mapping.ts:24-27, 68-76). TOATE rutele de generare aruncă `message` și trimit doar `key`: `fields: e.errors.map((x) => x.key)` — src/app/api/cadastru/generate/route.ts:36, src/app/api/urbanism/generate/route.ts:36, src/app/api/copil/generate/route.ts:36, src/app/api/somaj/generate/route.ts:36, src/app/api/deces/generate/route.ts:36, src/app/api/pfa/generate/route.ts:36, src/app/api/petitii/generate/route.ts:36, src/app/api/auto/generate/route.ts:36, src/app/api/forms/c168/{generate,preview}/route.ts:40/29, src/app/api/forms/impozit/{generate,preview}/route.ts:37/26, src/app/api/forms/230/{sign,preview}/route.ts:46/32. La fel pentru ZodError: `i.path.join(".")` (src/app/api/profile/route.ts:37, /api/im

**Scenariu:** Un user completează wizardul „Urbanism" fără să fi pus județul la imobil. Serverul are mesajul „Imobil — județ e obligatoriu", dar răspunde `{error:"validare", fields:["imobilJudet","imobilLocalitate"]}` și pagina afișează „Verifică profilul, imobilul și câmpurile obligatorii: imobilJudet, imobilLocalitate". Câmpurile respective nu există în formularul de pe ecran (vin din „Imobilele mele"), deci userul nu are cum să deducă unde să se ducă și rămâne blocat.

### 19. [MEDIUM] Documentele încărcate sunt invizibile în UI și nu pot fi șterse — backend complet, zero consumatori

**Fișier:** `src/lib/documents/repository.ts:71`

Exact aceeași clasă de lacună ca PDF-ul de dosar. `listDocuments` (src/lib/documents/repository.ts:71) și `GET /api/documents` (src/app/api/documents/route.ts:21-30) nu sunt apelate din nicio pagină — singurul consum al modulului din UI e `POST /api/documents` la onboarding (src/app/dashboard/onboarding/onboarding-upload.tsx:55). Nu există `/dashboard/documente` (vezi src/app/dashboard/*). `deleteDocument` (src/lib/documents/repository.ts:90-95) nu are rută API deloc și e apelat doar din teste (tests/integration/documents.repo.test.ts:65) — cod mort, contrar regulii „fără cod mort" din CLAUDE.md. `getDocumentContent` e folosit exclusiv de exportul GDPR (src/lib/gdpr/export.ts:74). Scanurile se șterg automat la 30 zile (`DEFAULT_RETENTION_DAYS`, src/lib/documents/repository.ts:16) fără ca userul să fie vreodată informat sau să poată vedea ce expiră.

**Scenariu:** Userul își încarcă buletinul la onboarding, OCR-ul citește greșit și el încarcă din nou o poză mai bună. Acum are 2 scanuri de CI stocate criptat, nu vede niciunul, nu știe câte sunt, nu poate șterge scanul greșit și nu poate verifica dacă fișierul urcat era cel bun. Singura modalitate de a-și vedea propriile scanuri e să descarce exportul GDPR JSON și să decodeze base64-ul manual; singura modalitate de a le șterge e „Șterge datele personale", care îi șterge și profilul și dosarele.

### 20. [MEDIUM] Butonul „Înapoi" din pasul de previzualizare șterge tot ce a completat userul

**Fișier:** `src/app/dashboard/c168/c168-form.tsx:119`

În fluxurile cu preview în 2 pași, pasul 1 e un `<form>` necontrolat (input-uri fără `defaultValue`), iar „Înapoi" face `setPreview(null)`, ceea ce demontează și remontează formularul gol. Datele completate SUNT salvate în state (`setBody(data)` / `setInputs(data)`) dar nu sunt folosite niciodată pentru repopulare. Locuri: src/app/dashboard/c168/c168-form.tsx:119 (buton) vs. :56 (`setBody`) și câmpurile :170,:174,:180,:193,:197,:202; src/app/dashboard/impozit/impozit-form.tsx:132 vs. :69 și câmpurile :182,:186,:192,:197; src/app/dashboard/formulare/230/form-230.tsx:103 vs. :54 și câmpurile :141,:146,:150,:154. Fix minim: `defaultValue={body?.chiriasNume as string ?? ""}` etc., datele fiind deja în state.

**Scenariu:** Userul completează C168: imobil, tip operațiune, nume chiriaș, CNP chiriaș, chirie, monedă, dată start, dată sfârșit, dată contract (9 câmpuri). Vede previzualizarea, observă că a greșit o cifră din CNP-ul chiriașului și apasă „Înapoi" — exact butonul pus acolo pentru corecturi. Formularul revine complet gol și trebuie retastat integral, inclusiv cele 3 date calendaristice.

### 21. [MEDIUM] Lista de dosare arată doar codul formularului — fără titlu și fără dată, dosarele identice sunt indistingibile

**Fișier:** `src/app/dashboard/dosare/page.tsx:34`

Lista randează `<span className="mono">{d.formCode}</span>` (src/app/dashboard/dosare/page.tsx:34) — adică „ITL-016", „DGPCI-CI", „ITL-005". Titlul lizibil există și e deja folosit în altă parte: `getManifestById(dossier.manifestId)` → `manifest.title` (src/app/dashboard/dosare/[id]/page.tsx:20, src/lib/auto/service.ts:41 unde wizardul afișează `f.manifest.title`). `DossierMeta.createdAt` există și e populat (src/lib/dispatch/repository.ts:23, :100) dar nu e afișat nicăieri, deși lista e sortată `createdAt desc` (:54). Nici link direct de descărcare din listă — trebuie intrat în fiecare dosar. Combinat cu fluxurile care creează 2-3 dosare simultan (src/lib/auto/service.ts:35) și cu imposibilitatea de a șterge, lista devine ilizibilă rapid.

**Scenariu:** Userul care a vândut o mașină în martie și a cumpărat alta în iulie deschide „Dosarele mele" și vede patru rânduri: „ITL-016", „DGPCI-CI", „ITL-016", „DGPCI-CI", toate cu același status. Nu poate spune care aparține cărei tranzacții, nu vede când a fost generat fiecare și trebuie să deschidă și să descarce fiecare PDF pe rând ca să afle.

### 22. [MEDIUM] Răspunsurile cu PII decriptat nu au Cache-Control: no-store (doar noua rută de PDF îl are)

**Fișier:** `src/app/api/gdpr/export/route.ts:10`

Verificat pe server (curl cu sesiune validă): GET /api/gdpr/export (export complet: CNP, IBAN, serie/nr CI + base64-ul scanurilor de buletin), GET /api/profile (CNP și IBAN în clar), POST /api/forms/230/sign, /api/forms/c168/generate și /api/forms/impozit/generate (PDF-uri cu CNP + nume) întorc răspunsul FĂRĂ niciun antet `Cache-Control`. Singura rută care îl setează este cea nou-adăugată, src/app/api/dossiers/[id]/pdf/route.ts:33 (`private, no-store`) — deci intenția e clară, dar nu e aplicată consecvent. Next.js nu adaugă nimic de la sine: `sendResponse` (node_modules/next/dist/server/send-response.js:35-54) copiază verbatim antetele obiectului `Response`, iar `Cache-Control` implicit se setează doar pentru pagini, nu pentru route handlers. Fără antet, un proxy intermediar/CDN poate stoca euristic răspunsul, iar browserul îl poate păstra în cache-ul de disc și în bfcache.

**Scenariu:** Utilizator pe rețea corporativă cu proxy de cache: descarcă /api/gdpr/export (JSON cu CNP + scanul CI în base64). Răspunsul, lipsit de directive de cache, e stocat de proxy; un alt utilizator din aceeași rețea care nimerește aceeași cheie de cache, sau un administrator care inspectează cache-ul, obține datele de identitate complete ale primului utilizator.

### 23. [MEDIUM] Consent ledger-ul nu e niciodată verificat înainte de prelucrarea datelor de identitate sau a scanurilor

**Fișier:** `src/lib/gdpr/consent.ts:26`

`hasConsent(userId, category)` e exportată dar singurul apelant din tot `src/` este `grantConsent` (linia 45), pentru idempotență. Nicio rută nu o consultă: POST /api/documents salvează scanuri fără a verifica `DOCUMENTE`, PUT /api/profile stochează CNP/serie CI fără a verifica `IDENTITATE`, iar retragerea consimțământului (`withdrawConsent`) nu are niciun efect asupra prelucrării ulterioare — datele rămân în DB și continuă să fie folosite la generarea formularelor. Ledger-ul e, funcțional, decorativ.

**Scenariu:** Un utilizator retrage consimțământul pentru categoria DOCUMENTE din /dashboard/confidentialitate. Aplicația confirmă retragerea, dar scanurile rămân stocate, sunt în continuare incluse în export și pot fi urcate altele noi — prelucrare fără temei, contrar a ceea ce UI-ul îi comunică utilizatorului și a regulii „consent ledger" din CLAUDE.md.

### 24. [LOW] PUT /api/vehicule/[id] și PUT /api/imobile/[id] declarate dar neconsumate — fără UI de editare

**Fișier:** `src/app/api/vehicule/[id]/route.ts:6`

Ambele rute de update există și validează cu Zod (api/vehicule/[id]/route.ts:6, api/imobile/[id]/route.ts:6), dar UI-ul apelează exclusiv DELETE: vehicule-panel.tsx:106 (`/api/vehicule/${id}`, method DELETE) și imobile-panel.tsx:67 (`/api/imobile/${id}`, method DELETE). Listele randează doar un buton „șterge" (vehicule-panel.tsx:133, imobile-panel.tsx:92) — nu există „editează", nici formular pre-completat.

**Scenariu:** User greșește VIN-ul sau numărul cadastral la adăugare. Singura reparație în aplicație e ștergerea și re-adăugarea de la zero a tuturor câmpurilor. Pentru un imobil deja folosit la C168/ITL-001 asta rupe și legătura conceptuală cu dosarele generate (dosarele păstrează doar PDF-ul arhivat).

### 25. [LOW] `attachments` din manifest nu e populat de niciun formular și nu e randat pe pagina dosarului, deși checklist-urile cer atașamente

**Fișier:** `src/lib/forms/manifest.ts:64`

`FormManifest.attachments?: string[]` e declarat (manifest.ts:64) dar nu apare în niciun alt fișier — grep pe tot `src/` întoarce exclusiv linia de declarație: niciun manifest nu îl setează, nicio componentă nu îl citește. Pagina dosarului randează doar checklist-ul și canalele (dashboard/dosare/[id]/page.tsx:53-83). Între timp checklist-urile cer explicit atașamente concrete: „Atașează actul justificativ în original sau copie legalizată" + „Atașează dovada plății tarifului ANCPI și copia actului de identitate" (lib/cadastru/service.ts:30-31), „Atașează: act de identitate (copie certificată), dovada dreptului de folosință a sediului, declarația-tip" (lib/pfa/service.ts:29).

**Scenariu:** User deschide dosarul EXTRAS-CF/CERERE-INSCRIERE-CF, citește „Atașează actul justificativ..." și „Atașează dovada plății tarifului ANCPI" — dar pagina dosarului nu îi arată nicio listă structurată de atașamente necesare, nu îi permite să bifeze/încarce nimic, iar câmpul din manifest care ar fi trebuit să poarte acea listă e gol în toate cele 20 de manifeste înregistrate.

### 26. [LOW] PUT /api/vehicule/[id] și PUT /api/imobile/[id] nu sunt apelate din UI — nu există editare

**Fișier:** `src/app/api/vehicule/[id]/route.ts:6`

Ambele rute PUT există și validează corect (`updateVehicul` — src/lib/vehicle/repository.ts, `updateImobil` — src/lib/imobil/repository.ts:62). Panourile UI apelează doar POST (creare) și DELETE: src/app/dashboard/vehicule/vehicule-panel.tsx:87,106 și src/app/dashboard/imobile/imobile-panel.tsx:49,67. Nu există niciun buton „Editează”. La fel, `GET /api/vehicule` (route.ts:6), `GET /api/imobile` (route.ts:6) și `GET /api/documents` n-au niciun consumator — listele vin din server components.

**Scenariu:** User tastează greșit VIN-ul unui vehicul (sau normă de poluare citită greșit din CIV). În UI nu poate corecta câmpul: trebuie să șteargă vehiculul și să îl reintroducă în întregime, deși endpoint-ul de update există și funcționează.

### 27. [LOW] `requireRole` / `ForbiddenError` nu sunt folosite de nicio rută — RBAC-ul pe roluri e neconectat

**Fișier:** `src/lib/auth/session.ts:33`

`User.role` există în schemă, `hasRole`/`isRole` (src/lib/auth/rbac.ts) sunt testate unitar, iar `requireRole` e implementat — dar niciun handler de rută nu îl apelează (toate folosesc `requireUser`). Consecință secundară: `ForbiddenError` (session.ts:16) nu e prins în niciun `catch` din rute — dacă cineva conectează `requireRole` fără să adauge handling, eroarea cade în ramura de 500 generică din src/lib/http/observe.ts în loc de 403. Rolul e afișat cosmetic în dashboard (src/app/dashboard/page.tsx:23) fără să dea sau să restrângă vreun acces.

**Scenariu:** Un viitor endpoint de administrare se protejează cu `requireRole("admin")`; primul user non-admin care îl atinge primește 500 „eroare internă” în loc de 403, fiindcă niciun catch existent nu tratează ForbiddenError.

### 28. [LOW] Exporturi moarte în src/lib: `deadlineForManifest`, `allManifests`, `checkRateLimit`

**Fișier:** `src/lib/reminders/deadline.ts:25`

`deadlineForManifest` (deadline.ts:25) nu e apelat nicăieri — nici în src/, nici în teste; e doar re-exportat mecanic prin src/lib/reminders/service.ts:9. `allManifests` (src/lib/forms/manifest.ts:79) e doar re-exportat prin src/lib/forms/registered.ts:31 și niciodată apelat — nu există pagină care să listeze formularele disponibile. `checkRateLimit` (varianta in-memory, src/lib/http/rate-limit.ts:10) e folosit exclusiv din tests/unit/http/rate-limit.test.ts; calea de producție e `checkRateLimitDb` prin `guardGeneration`, iar comentariul „folosită în teste + ca fallback” descrie un fallback care nu există în cod. `isEncrypted` (src/lib/crypto/field-encryption.ts:137) — la fel, doar teste. CLAUDE.md interzice explicit codul mort și shim-urile de compatibilitate.

**Scenariu:** Nu produce bug la runtime, dar induce în eroare: un dezvoltator care vede `checkRateLimit` documentat drept „fallback” presupune că există degradare grațioasă dacă Postgres pică, când de fapt `guardGeneration` aruncă și ruta de generare întoarce 500.

### 29. [LOW] „Marchează ca depus" e ireversibil — un click greșit blochează dosarul definitiv în starea DEPUS

**Fișier:** `src/app/dashboard/dosare/[id]/submit-button.tsx:21`

`POST /api/dossiers/[id]/submit` (src/app/api/dossiers/[id]/submit/route.ts:13) apelează `markSubmitted`, care setează hard `status: "DEPUS", submittedAt` (src/lib/dispatch/repository.ts:73-76). Nu există rută sau funcție inversă. Butonul nu cere confirmare (src/app/dashboard/dosare/[id]/submit-button.tsx:30) și, odată apăsat, se înlocuiește permanent cu textul „Dosar marcat ca depus." (:21-27), fără opțiune de revenire. Consecință secundară: `scanDueReminders` filtrează pe `status: "DE_DEPUS"` (src/lib/reminders/service.ts:17), deci dosarul marcat greșit nu mai primește niciun reminder de termen. Panoul de confidențialitate folosește `confirm()` pentru acțiuni distructive (src/app/dashboard/confidentialitate/privacy-panel.tsx:39) — aici lipsește.

**Scenariu:** Userul are 3 dosare în listă, deschide din greșeală ITL-016 în loc de ITL-005 și apasă „Marchează ca depus". Dosarul apare pentru totdeauna ca „Depus", nu mai generează remindere pentru termenul de 30 de zile de la înstrăinare, iar userul nu are cum să corecteze — decât ștergând toate datele personale (singura cale, vezi lacuna cu ștergerea dosarelor).

### 30. [LOW] Lipsesc not-found.tsx și error.tsx — un link expirat de dosar dă pagina 404 implicită Next.js, în engleză, fără drum înapoi

**Fișier:** `src/app/dashboard/dosare/[id]/page.tsx:18`

`if (!dossier) notFound()` (src/app/dashboard/dosare/[id]/page.tsx:18), dar nu există niciun `not-found.tsx`, `error.tsx` sau `global-error.tsx` în tot `src/app/` (verificat prin find). Rezultatul e ecranul implicit Next.js („404 — This page could not be found"), în engleză, fără header-ul aplicației (layout-ul de dashboard nu se aplică), fără link către /dashboard și fără mesaj util. Același lucru pentru orice excepție de server într-un Server Component (ex. `decryptField` care eșuează după rotația KEK în src/lib/signature/repository.ts:64 sau DB indisponibil) → „Application error: a server-side exception has occurred". Rutele API au deja o graniță curată cu requestId (src/lib/http/observe.ts:62-65); paginile nu au niciuna.

**Scenariu:** Userul își pune bookmark pe /dashboard/dosare/<id> ca să revină la pașii de depunere, apoi apasă „Șterge datele personale" (care șterge toate dosarele, src/lib/gdpr/delete.ts:13). Peste o săptămână deschide bookmark-ul și primește o pagină albă în engleză „404 This page could not be found", fără niciun link — într-o aplicație altfel integral în română, pentru cetățeni. Nu are cum să navigheze înapoi decât editând manual URL-ul.

### 31. [LOW] Sesiune expirată sau rate-limit în mijlocul unui wizard lung: mesaj tehnic sau generic și tot formularul pierdut

**Fișier:** `src/app/dashboard/deces/deces-wizard.tsx:53`

Wizardele afișează literal codul de eroare al serverului: `"Generare eșuată: " + (b.error ?? "")` → „Generare eșuată: neautentificat" (401, src/lib/auth/session.ts prin requireUser) sau „Generare eșuată: prea multe cereri" (429, src/lib/http/rate-limit.ts:79). Locuri: src/app/dashboard/deces/deces-wizard.tsx:53, pfa-wizard.tsx:64, cadastru-wizard.tsx:57, urbanism-wizard.tsx:42, copil-wizard.tsx:47, somaj-wizard.tsx:45, petitii-wizard.tsx:44, auto-wizard.tsx:52. În pașii de generare finală mesajul e chiar mai sărac — un simplu „Generare eșuată." / „Semnare eșuată." indiferent de cauză: src/app/dashboard/c168/c168-form.tsx:71, impozit-form.tsx:84, form-230.tsx:69. Nicăieri nu există redirect către /login cu păstrarea datelor, nici mesaj de tipul „sesiunea a expirat, autentifică-te din nou".

**Scenariu:** Userul completează wizardul „Deces în familie" — 15 câmpuri, inclusiv date din certificatul de deces și dosarul de pensie al decedatului. Între timp sesiunea expiră. La apăsarea butonului primește „Generare eșuată: neautentificat", rămâne pe pagină, nu înțelege ce s-a întâmplat; dacă navighează la /login pentru a se reautentifica, pierde toate cele 15 câmpuri și trebuie să reia totul, într-un context deja stresant.

### 32. [LOW] Nicio protecție anti-framing (X-Frame-Options / CSP frame-ancestors) și nicio CSP pe aplicație

**Fișier:** `next.config.ts:3`

`next.config.ts` nu declară `headers()`, nu există `src/middleware.ts`, iar verificarea pe server confirmă că paginile din /dashboard se servesc fără `X-Frame-Options`, fără `Content-Security-Policy` și fără `Strict-Transport-Security`. Pentru o aplicație care ține CNP, serie/nr CI și scanuri de buletin, lipsa `frame-ancestors 'none'` permite încadrarea în iframe a paginilor autentificate, iar lipsa CSP înseamnă că orice XSS viitor are exfiltrare nelimitată către orice origine.

**Scenariu:** Un site controlat de atacator încadrează invizibil /dashboard/confidentialitate peste un joc/captcha și suprapune butoanele: victima logată bifează/debifează consimțămintele (`toggle` din privacy-panel.tsx:22 e one-click, fără confirmare) fără să știe. Ștergerea contului e protejată accidental de `confirm()` (linia 39), dar consimțămintele nu sunt.
