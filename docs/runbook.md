# Runbook

## Rulare locală
- `cp .env.example .env` și completează valorile
- `docker compose up` — pornește app + Postgres
- sau `npm run dev` (cu un Postgres pornit din compose)

## Migrări DB
- `npm run db:migrate`

## Deploy (intern)
- build imagine + `docker compose up -d` pe serverul intern
- (opțional) Coolify/Dokploy pentru deploy „git push → gata" din GitHub

## Monitorizare / troubleshooting
- loguri: `docker compose logs -f app`
- stare DB: `docker compose exec db pg_isready -U app`
- ...
