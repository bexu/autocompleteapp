# ADR 0006 — Autentificare cu better-auth + RBAC minim

- Status: acceptat
- Data: 2026-07-27

## Context
Stack-ul de casă prevede `better-auth`. Task 1.1 cere cont utilizator (signup/login/logout) + RBAC minim, ca fundație pentru rutele cu date personale (profil, dosare). Prisma 7 cere un driver adapter pentru client, deci setup-ul e diferit de Prisma 6.

## Decizie
- **better-auth** cu `emailAndPassword` (v1), `autoSignIn` la înregistrare. Provideri externi (OAuth) mai târziu, dacă apar.
- **Prisma 7 + driver adapter Postgres**: client singleton în `src/lib/db/prisma.ts` cu `@prisma/adapter-pg` (pool `pg`), conexiune din `DATABASE_URL`.
- Modelele better-auth (`user`, `session`, `account`, `verification`) în `prisma/schema.prisma`, cu câmp `role` pe user pentru **RBAC** (`user` ⊂ `admin`).
- **RBAC pur și testabil** în `src/lib/auth/rbac.ts` (fără dependențe de request); guard-uri `requireUser`/`requireRole` în `src/lib/auth/session.ts` care aruncă `Unauthorized`/`Forbidden`.
- Rolul e `input: false` — nu poate fi setat de client la signup (escaladare de privilegii). Ridicarea la `admin` se face controlat (seed/administrare), nu prin API public.

## E2E pe build de PRODUCȚIE
`next dev` servește SSR înainte ca hidratarea să atașeze handler-ele → Playwright poate declanșa submit nativ (cursă de hidratare la prima compilare Turbopack). E2E rulează pe `next build && next start` — elimină cursa și verifică și că build-ul trece. Secretele de test în CI se generează la runtime (openssl), nu se comit.

## Consecințe
- Rutele protejate folosesc `getSession`/`requireUser`; fără sesiune → redirect `/login`.
- Câmpurile sensibile de profil (task 1.2) se leagă de `user.id` și folosesc criptarea per-câmp (ADR 0005), cu AAD = context user.
- CI aplică migrările (`prisma migrate deploy`) înainte de teste.
