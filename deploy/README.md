# La Cannelle on your own server (Docker)

Runs everything on one Linux server (e.g. a STRATO V-Server): website, API, PostgreSQL and automatic HTTPS (Caddy).

```
Internet → Caddy (80/443, HTTPS) ─┬→ frontend (Next.js :3000) → backend (API :3001) → db (PostgreSQL)
                                  └→ backend /api/uploads/* (photos)
```

Only Caddy is reachable from outside. The database and the API are internal.

## First start
1. Server: Ubuntu 22.04/24.04 LTS, ≥ 2 vCPU, ≥ 4 GB RAM (building the website needs memory; add 2 GB swap if less), Docker + Compose plugin installed.
2. DNS: `A` record of your domain (and `www`) → server IP.
3. `cp env.example .env`, fill it in (`chmod 600 .env`).
4. `docker compose up -d --build` — first build takes a few minutes. The API container applies database migrations, creates the owner account and first-run content on every start.
5. Check `https://YOUR-DOMAIN/api/menus` and `/login`.

## Operations
- Logs: `docker compose logs -f backend` (or `frontend`, `caddy`, `db`)
- Update after replacing the code: `sh update.sh`
- Backup: `sh backup.sh` (database dump + photos, keeps 14 days). Cron example (daily 03:15): `15 3 * * * cd /opt/la-cannelle/deploy && sh backup.sh >> /var/log/lacannelle-backup.log 2>&1`
- Restore database: `docker compose exec -T db pg_restore -U lacannelle -d lacannelle --clean --if-exists < db_YYYY-MM-DD_HHMMSS.dump`
- Restore photos: `docker compose exec -T backend tar xzf - -C /data < uploads_YYYY-MM-DD_HHMMSS.tgz`
- Reset the owner password (emergency): set `ADMIN_FORCE_PASSWORD=reset:NewPassword` in `.env`, `docker compose up -d`, then set it back to `disabled`.

## Notes
- `NEXT_PUBLIC_*` values (legal notice etc.) are compiled into the site: after changing them run `docker compose up -d --build`.
- Photos live in the `uploads` Docker volume, the database in `db_data`. Back both up.
- Rate limits count per visitor IP; Caddy forwards the real address. Do not expose ports 3000/3001/5432 to the internet (the compose file does not).
