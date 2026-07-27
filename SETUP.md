# Setup — pornirea unei aplicații noi din acest standard

Acest repo = standardul de casă (CLAUDE.md, Docker, CI, docs, exemple de teste). Baza Next.js o generezi **o dată**, ca să ai versiuni curente + lockfile garantat rulabil; restul fișierelor standard sunt deja aici.

## Pași

1. Folosește acest repo ca punct de plecare (clone / „Use this template" pe GitHub).

2. Generează baza Next.js în același folder:
   ```bash
   npx create-next-app@latest . --typescript --eslint --app --src-dir --use-npm
   ```

3. Instalează dependențele standard (după nevoie):
   ```bash
   npm install prisma @prisma/client zod pg-boss
   npm install -D vitest @playwright/test
   # doar dacă ai autentificare:
   npm install better-auth
   ```

4. Adaugă scripturile în `package.json`:
   ```json
   {
     "scripts": {
       "dev": "next dev",
       "build": "next build",
       "start": "next start",
       "typecheck": "tsc --noEmit",
       "test": "vitest run",
       "test:e2e": "playwright test",
       "db:migrate": "prisma migrate dev"
     }
   }
   ```

5. În `next.config` activează output standalone (pentru Docker):
   ```js
   const nextConfig = { output: "standalone" };
   ```

6. Pornește:
   ```bash
   cp .env.example .env   # completează valorile
   docker compose up      # app + Postgres
   ```

Gata — proiect conform standardului: `CLAUDE.md`, teste (Playwright/Vitest), CI, Docker, structură `docs/`.

## Înainte de primul commit real
- Completează `docs/architecture.md` și `docs/adr/0001-*` (data).
- Înlocuiește modelul `Example` din `prisma/schema.prisma`.
- Înlocuiește testele exemplu cu testele tale.
