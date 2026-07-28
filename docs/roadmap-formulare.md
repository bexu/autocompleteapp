# Roadmap formulare — harta pachetelor de viață

> Sursa: decizie de produs 2026-07-27 (vezi [adr/0003](adr/0003-dosare-evenimente-de-viata.md)). Există sute de tipizate posibile; selectăm **~40–50 de fluxuri cu valoare reală**, nu importăm toate PDF-urile orbește. Fiecare formular intră ca **manifest versionat** (vezi SPEC, „Motor de template-uri").
>
> **De completat:** link-urile către sursele oficiale citate mai jos (catalog Primăria Cluj, ANAF, DGPCI, ANCPI, DASM, ANOFM, CNPP, CNAS, ONRC, CNRED, MAI etc.) — se adaugă în manifestul fiecărui formular la implementare, cu `sourceUrl` + `sourceSha256` verificate. Nu inventa link-uri.

**Moduri:** FULL = completare, validare, PDF, semnare, handoff · DOSAR = wizard, checklist, documente, precompletare · LINK = portalul oficial face treaba; noi pregătim dosarul și păstrăm rezultatul.

## Harta

| Pachet de viață | Formulare | Mod / prioritate |
|---|---|---|
| Impozite persoane fizice | D230, D212, C168, 231, D020, D030, D070, Z03, Z05, Z015, Z017 | FULL pentru 230/C168/231; restul DOSAR |
| Cumpăr/vând mașină | ITL-054, ITL-005, ITL-016, ITL-010 (certificat fiscal), cererea DGPCI, RCA, act proprietate, declarație pierdere/furt | **FULL — cea mai bună extindere după 230** |
| Alte operațiuni auto | Înmatriculare, transcriere, radiere, duplicat talon/plăci, modificare date, număr preferențial/păstrat, autorizație provizorie, preschimbare permis străin | DOSAR + LINK (DGPCI are flux online pentru unele UAT-uri) |
| Impozit casă și teren | ITL-001 clădiri, ITL-003 teren, scoatere din evidență, certificat fiscal, situație debite/plăți, duplicat decizie, actualizare date, copii dosar fiscal | FULL, foarte reutilizabil între UAT-uri |
| Închiriez o proprietate | C168 (înregistrare/modificare/încetare), contract, inventar, dovada proprietății | FULL, flux compact |
| Cadastru și carte funciară | Intabulare, înscriere provizorie, notare, radiere, corectare eroare, extras CF, extras plan cadastral, copii certificate arhivă | FULL pentru cererea de înscriere; LINK pentru extrasele online |
| Construiesc/renovez | Certificat de urbanism, prelungire CU, autorizație construire/desființare, completare dosar, început/final lucrări, recepție, valoare reală, atestare edificare/radiere | DOSAR complex, valoros după entitatea `Imobil` |
| Mă mut/schimb domiciliul | CI, schimbare domiciliu din străinătate, reședință/flotant, declarație găzduitor, declarație prin mandatar, declarație proprie răspundere | FULL pentru pregătire; **unele se semnează doar la ghișeu — de afișat explicit** |
| Stare civilă | Certificate naștere/căsătorie/deces, duplicate, extrase multilingve, transcriere acte străine, deschidere procedură succesorală | DOSAR + LINK (MAI oferă certificate online) |
| Se naște un copil | Alocație de stat, indemnizație creștere copil, stimulent inserție, adeverință angajator, declarația celuilalt părinte, declarație PFA, anexă UE, tichete nou-născut | FULL — multe formulare reutilizează aceleași date |
| Ajutoare sociale | VMI, ajutor chirie, cantină, tichete sociale, încălzire, supliment energie, completare dosar, locuință socială | DOSAR; **formulare și praguri versionate anual/sezonier** |
| Dizabilitate și seniori | Anchetă socială adult/copil, card parcare, transport urban, indemnizație, suport copil, îngrijire la domiciliu, admitere cămin, centru de zi | DOSAR; reguli locale + date sensibile suplimentare |
| Pierd locul de muncă | Înregistrare solicitant, șomaj cu experiență, șomaj absolvent, mediere, consiliere, formare, declarații venit/pensie/sănătate | FULL pentru dosarul de șomaj (ANOFM) |
| Prime pentru angajare | Prima de activare, inserție, încadrare, instalare, relocare, completarea veniturilor salariale | DOSAR; aceeași bază de date ca șomajul |
| Istoricul de muncă | Extras REGES individual/centralizator, sesizare ITM, cerere informații publice | LINK pentru extras; FULL pentru sesizare |
| Pensie | Limită de vârstă, anticipată, invaliditate, urmaș, recalculare, schimbare plată, transfer dosar, contract asigurare, certificat de viață | DOSAR; pachet național stabil și bogat (CNPP) |
| Deces în familie | Ajutor de deces, pensie neîncasată, certificat deces, procedură succesorală, transfer loc de veci | DOSAR unificat — evită alergătura CNPP/stare civilă/primărie/notar |
| Sănătate | Card național duplicat, refuz card, CEASS, validare calitate asigurat, adeverință zile concediu medical | DOSAR + LINK; variază pe CAS județeană |
| Deschid/închid PFA | Rezervare denumire, înregistrare PFA/II/IF, anexă fiscală, declarație funcționare, schimbare sediu/CAEN, suspendare, reluare, radiere | DOSAR + handoff MyPortal ONRC |
| Studii în străinătate | Echivalare Bac/licență/master/doctorat, recunoaștere profesională, duplicat atestat, vizare acte pentru străinătate | DOSAR (CNRED); detectare traduceri/apostile necesare |
| Apostilă | Cerere apostilă, identificare instituție competentă, acte stare civilă, cazier, diplome | DOSAR + LINK (Hub MAI) |
| Instanțe | Cerere valoare redusă, răspunsul pârâtului, ajutor public judiciar, somație europeană de plată, copii dosar | FULL doar ca formular oficial asistat, **fără sfaturi juridice** |
| Reclamații și drepturi | ANPC, ITM, ANSPDCP/GDPR, CNCD, Avocatul Poporului, ANRE, cerere Legea 544, reclamație administrativă | Un PetitionBuilder comun + adaptoare pe instituție |
| Cetățenie și consular | Acordare/redobândire/renunțare cetățenie, pașaport, titlu călătorie, procuri, transcrieri, duplicate, cazier | DOSAR + LINK (eConsulat face depunerea) |
| Imigrare | Permis temporar/lungă ședere, rezidență UE, muncă, studii, reîntregire familie | Extensie ulterioară (rezidenți fără CNP românesc) |
| Agricultură | Cerere APIA, registru agricol, adeverință APIA, atestat producător, carnet comercializare, arendă/comodat, vânzare teren extravilan | DOSAR, nișat, versionat anual |
| Programe verzi | Rabla, Casa Verde, prosumator, adeverințe RePowerEU | LINK + pregătirea anexelor; sesiuni/reguli volatile |
| Alegeri | Registrul Electoral străinătate, vot corespondență, liste speciale, adeverință alegător | DOSAR sezonier |
| Servicii locale | Parcări, duplicat card, schimb loc, arbori, fose septice, moped/utilaj lent, abonamente, locuințe, manifestări publice | FULL doar pentru UAT-urile suportate |
| Formulare naționale simple | 231 (adeverință venit — quick win), Z03 (rezidență fiscală PF), Z05 (rezidență PFA), D020/D070 (versiuni 2026, mai târziu), CEASS (LINK), CNPP | După prioritate în tabel |

## Ordinea de implementare

1. **230** ✅ — validează arhitectura (Felia 1, livrată).
2. **Dosar auto complet** ✅ — ITL-054 + ITL-005 + ITL-016 + ITL-010 + cererea DGPCI.
3. **C168** ✅ — închiriere (înregistrare/modificare/încetare).
4. **Impozit clădire și teren** ✅ — ITL-001, ITL-003.
5. **Dosar copil** ✅ — alocație de stat + indemnizație creștere copil (datele copilului/angajatorului ca inputuri, nu persistăm CNP-ul copilului). Stimulentul/adeverințele/declarațiile suplimentare rămân extindere ulterioară.
6. **Petiții universale** ✅ — PetitionBuilder comun (OG 27/2002) cu instituție + subiect + conținut + solicitare; petentul din profil.
7. **Dosar șomaj (ANOFM)** ✅ — înregistrare ca persoană în căutarea unui loc de muncă (fișa PCLM, Anexa 1) + cerere indemnizație de șomaj (Anexa 3), Legea 76/2002. Solicitantul din profil; restul ca inputuri, cu validare de format (dată, enum plată). Primele ANOFM rămân extindere ulterioară.
8. **Cadastru/CF** ✅ — cerere de înscriere în cartea funciară (Anexa 5, Legea 7/1996, ODG ANCPI 600/2023): intabulare/notare/radiere/înscriere provizorie/actualizare/îndreptare eroare ca enum + act justificativ; reutilizează entitatea Imobil. Extras CF = pas de tip dosar/link către portalul ANCPI (ePay/MyEterra).
9. **Dosar deces în familie (CNPP)** ✅ — ajutor de deces (Anexa 11) + pensie de urmaș (Anexa 7), Legea 360/2023. Solicitantul (membrul supraviețuitor) din profil; datele decedatului ca inputuri (nu le persistăm). Fără evaluare de eligibilitate/cuantum. Pensia CNPP (limită de vârstă etc.) rămâne extindere ulterioară.
10. **PFA lifecycle (ONRC)** ✅ — eveniment „înființare" (rezervare denumire + înregistrare, formulare 11-10-181/180) sau „mențiune" (schimbare sediu / modificare CAEN / suspendare / reluare / radiere), OUG 44/2008. Titularul din profil; CAEN validat ca 4 cifre.
11. **Urbanism/construcții** ✅ — eveniment „certificat de urbanism" (F.1) sau „autorizație de construire/desființare" (F.8), Legea 50/1991. Solicitantul din profil, imobilul din entitatea Imobil; valoarea lucrărilor validată numeric.

**Roadmap-ul de formulare (1–11) e complet.** Generarea seturilor de formulare e **atomică** (motorul: `generateAndFileForms` → validează tot, apoi `prisma.$transaction`). Următorii pași sunt hardening (H.1 DPIA, H.2 pen-test, H.3 rate-limit distribuit/observability, H.4 review juridic) și extinderi opționale (D212, șomaj prime, alte UAT-uri, pensie limită de vârstă, cadastru avansat).

**D212** rămâne în roadmap, fără a-i dedica toate resursele: SPV are precompletare din 2026, deci diferențiatorul e mai mic decât la dosarele multi-instituție.

## Ce NU băgăm acum
- **D213 și D214** — prea nișate (terenuri agricole / pachete de control).
- **Ajutorul de încălzire** — util, dar formular + plafoane sezoniere; se încarcă la momentul potrivit ca versiune anuală, nu hardcodat.
- **Toate cele ~139 de cereri ale Primăriei Cluj** — catalog + deep-link, nu implementare individuală.
- **Pașaport, cazier, certificat de domiciliu** — portalurile oficiale rezolvă deja mare parte din flux (LINK).
- **Contracte juridice inventate de aplicație** — excepție: modele oficiale (ITL-054).
