# Standard de casă — aplicații vibe-coded interne

> Versiune: 2026-05-20 · Reutilizabil pentru orice aplicație internă construită cu AI (Claude Code / Cursor)
> Scop: un stack și un set de reguli **deliberate**, nu „ce ne sugerează random unealta AI". Optimizate pentru: cod scris bine de AI, ușor de întreținut de echipă, deploy intern.

---

## Principiul de bază

> **Cel mai bun stack pentru vibe-coding = cel mai mainstream/convențional stack.**

Două motive tehnice:
1. **Calitatea codului generat de AI** crește cu densitatea exemplelor din datele de training — pe tehnologii mainstream modelul produce cod idiomatic și corect, cu mai puține halucinații (API-uri inexistente, pattern-uri greșite).
2. **Mentenabilitate** — tehnologiile mainstream au API-uri stabile, ecosistem și tooling matur și documentație abundentă: mai puține surprize la upgrade și depanare mai rapidă.

JS/TS în loc de Python pentru că Next.js dă **un singur limbaj end-to-end** (frontend + backend) — un toolchain, plus tipuri și scheme de validare (Zod) partajate între client și server, fără cost de context-switch.

---

## 1. Tech stack ✅

| Strat | Standard | Notă |
|---|---|---|
| Limbaj | **TypeScript** (strict) | type-safety prinde greșelile AI la compilare |
| Runtime | **Node.js** (LTS) | cel mai mainstream JS |
| Framework | **Next.js** (App Router) | full-stack (front + back într-un codebase) |
| Bază de date | **PostgreSQL** | default pentru relațional |
| ORM | **Prisma** | modelul de date într-un fișier citibil; AI-friendly |
| Validare | **Zod** | la granițele aplicației (input extern) |
| Jobs / cron | **pg-boss** | rulează pe Postgres — un serviciu mai puțin |
| Auth | **better-auth** | TS-first; email+parolă, 2FA, organizații din cutie; + SSO/OIDC dacă e cazul |
| Testare E2E | **Playwright** | teste ca un utilizator real |
| Testare unit | **Vitest** | logica critică |
| Cod & CI | **GitHub** + GitHub Actions | repo + rulare automată teste |
| Împachetare | **Docker** | aceeași „cutie" rulează identic oriunde |
| Orchestrare | **Docker Compose** | pornește app + Postgres cu o comandă |
| Deploy | **Server intern** (dev → shared), via Docker | opțional Coolify/Dokploy pentru deploy „git push → gata" |

Regulă: **nu schimbi stack-ul de la proiect la proiect** și nu adaugi librării noi fără motiv real. Nu tot proiectul are nevoie de toate modulele: Next.js doar dacă are UI; Postgres+Prisma doar dacă are date relaționale; pg-boss doar dacă are task-uri pe fundal; better-auth doar dacă are autentificare.

---

## 2. Structura repo (template starter)

Fiecare aplicație nouă clonează acest schelet:

```
/
├─ CLAUDE.md              # regulile pe care agentul AI le citește și le respectă
├─ README.md             # cum pornești / rulezi
├─ Dockerfile
├─ docker-compose.yml     # app + Postgres
├─ .env.example
├─ prisma/
│  └─ schema.prisma       # modelul de date (sursa de adevăr a structurii DB)
├─ src/
│  ├─ app/               # pagini + API (Next.js)
│  ├─ lib/               # logica de business
│  ├─ components/        # componente UI
│  └─ jobs/              # task-uri pe cron (pg-boss)
├─ tests/
│  ├─ unit/              # Vitest
│  └─ e2e/               # Playwright
├─ docs/
│  ├─ architecture.md    # arhitectură, fluxuri, model de date, reguli de domeniu
│  ├─ adr/               # decizii (1 fișier scurt per decizie)
│  ├─ runbook.md         # operare: deploy, monitorizare, troubleshooting
│  ├─ GLOSSARY.md        # termeni & acronime
│  ├─ AGENT_RUNBOOK.md   # cum lucrează agenții AI pe repo
│  ├─ CLAUDE_PICKUP.md   # starea curentă (continuitate AI)
│  ├─ TROUBLESHOOTING.md # probleme frecvente
│  └─ INCIDENTS.md       # jurnal incidente
│                        # + CODE_REVIEW_*, SECURITY_AUDIT_*, HANDOVER_* (datate, în timp)
└─ .github/
   └─ workflows/ci.yml    # rulează testele la fiecare push
```

---

## 3. Testare (regulă)

- **E2E (Playwright):** orice feature vine cu test pe drumul principal + edge case-urile cheie.
- **Unit (Vitest):** pentru logica critică (calcule, validări — acolo testele sunt scut de răspundere).
- **CI:** testele rulează automat la fiecare push (GitHub Actions). Dacă pică, nu se merge în `main`.
- Rol dublu: testele verifică munca AI-ului **acum** și prind regresiile când AI-ul modifică **mai târziu**.

---

## 4. Documentație (regulă)

Documentație detaliată **în locurile potrivite** — nu comentarii pe fiecare linie. Codul bun se explică prin nume + tipuri; documentația explică *de ce*, arhitectura, domeniul, contractele. **Vie:** se actualizează *pe măsură ce* se implementează (vezi Definition of Done).

**Core (în orice proiect):**
| Document | Conține |
|---|---|
| `README.md` | setup + rulare |
| `docs/architecture.md` | arhitectură, fluxuri, model de date, reguli de domeniu |
| `docs/adr/` | **ADR** = Architecture Decision Record — de ce am ales X |
| `docs/runbook.md` | deploy, monitorizare, ce faci când pică |
| `docs/GLOSSARY.md` | termeni, acronime, denumiri din domeniu |
| `prisma/schema.prisma` | modelul de date (auto-documentat) |
| API (OpenAPI) | contractul endpoint-urilor |

**Continuitate AI (pentru vibe-coding):**
| Document | Conține |
|---|---|
| `docs/AGENT_RUNBOOK.md` | cum lucrează agenții pe repo (convenții, comenzi, capcane) |
| `docs/CLAUDE_PICKUP.md` | unde a rămas treaba — starea curentă, ca AI-ul să reia rapid |
| `docs/HANDOVER_YYYY-MM-DD.md` | predare la sfârșit de sesiune importantă |

**Operare & calitate (pe măsură ce proiectul crește):**
| Document | Conține |
|---|---|
| `docs/TROUBLESHOOTING.md` | probleme frecvente + soluții |
| `docs/INCIDENTS.md` | jurnal de incidente (ce, când, cauză, remediere) |
| `docs/CODE_REVIEW_YYYY-MM-DD.md` | note de review datate |
| `docs/SECURITY_AUDIT_YYYY-MM-DD.md` | audit de securitate datat |

Convenție: documentele recurente se **datează** (`_YYYY-MM-DD`). Adaugi doar ce e relevant proiectului — nu forța documente goale.

---

## 5. Agenți AI — `CLAUDE.md`

`CLAUDE.md` din fiecare repo = **regulamentul pe care agentul îl citește automat**. Așa standardul se aplică singur, nu speri că AI-ul ghicește. Conține:
- stack-ul exact (din secțiunea 1) + „nu schimba stack-ul, nu adăuga librării fără motiv"
- harta de foldere (unde stă fiecare lucru)
- regula de testare (orice feature → E2E + unit)
- regula de documentație (actualizează docs la fiecare schimbare)
- Definition of Done
- convenții de commit / PR
- comenzile uzuale (cum rulezi, cum testezi, cum deployezi)

Munca agentului se auditează prin **descrierea PR-ului + istoricul git + `docs/`** — NU prin atribuire în titlul commit-ului (commit-urile rămân curate, fără „made by …").

---

## 6. Task-uri și statusuri (regulă)

- **GitHub Issues + Projects** — fiecare task cu status clar: `To do` → `In progress` → `In review` → `Done`.
- Statusul se actualizează **pe măsură ce** se lucrează, nu la final.
- Fiecare task → branch → Pull Request → merge în `main` după CI verde + review.

---

## 7. Convenții

- **Commits:** conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`). **Curate** — descriu schimbarea; **FĂRĂ** atribuire de tool/AI (fără „Co-Authored-By", fără „made by …").
- **Branches:** feature branch → PR → `main` (main mereu deployabil).
- **PR:** descriere clară a ce s-a făcut și de ce.
- **Audit:** orice schimbare e trasabilă prin **descrierea PR-ului + istoricul git + `docs/`** (deciziile importante în `docs/adr/`) — NU prin ștampile în titlul commit-ului.
- **TypeScript strict** peste tot; **Zod** la intrările externe.

---

## 8. Deploy (intern)

- **Docker** împachetează aplicația; **Compose** rulează app + Postgres.
- Dev pe serverul intern acum → shared mai târziu: aceeași imagine, doar muți compose-ul (zero reconfigurare).
- Sursa deploy-ului = **GitHub** (push → CI → deploy).
- Opțional: **Coolify / Dokploy** pe server pentru „git push → deploy" fără pași manuali. (Pornim cu Compose direct; adăugăm dacă vrem confort.)

---

## 9. Definition of Done (definiția lui „gata")

Un task e gata DOAR când:
- [ ] cod scris + review trecut
- [ ] teste: E2E pe golden path (+ unit pe logica critică), **toate verzi în CI**
- [ ] migrare DB inclusă dacă s-a schimbat schema (Prisma)
- [ ] documentația actualizată (architecture / ADR / runbook, după caz)
- [ ] status task actualizat în GitHub Projects

---

## 10. Mecanismul de enforcement

Toate regulile de mai sus se bagă **o singură dată** în repo-ul template de pe GitHub (cu `CLAUDE.md`, structura de foldere, CI, exemple de teste/docs). Orice aplicație nouă **clonează template-ul** → moștenește automat regulile → agentul AI le respectă din prima.

> Așa „standardul as a rule" devine real, nu o intenție.

---

*Notă: acest standard e general (reutilizabil pentru orice aplicație internă). Lucruri specifice unei aplicații NU intră în standard — sunt per-proiect. Logica de domeniu se documentează în `architecture.md`; dacă e substanțială sau reglementată (ex. cu trimiteri la lege, ca la o aplicație de achiziții), proiectul adaugă un `docs/domain/` propriu — dar asta rămâne per-proiect.*
