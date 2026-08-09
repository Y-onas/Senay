# Senay Tela

Customer website + `/st-hq` admin + API + Telegram bot.

## Deploy

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full Railway checklist and env variables.

- Dockerfile: `server/Dockerfile`
- Config: `railway.toml` (repo root)

## Local

| Path | Role |
|------|------|
| `app/` | Website — local `app/.env` (Vite public vars) |
| `server/` | API — local `server/.env` (secrets) |
| `admin/` | Optional CMS source |

```bash
# create app/.env and server/.env yourself (not committed)
npm install --prefix app
npm install --prefix server
npm run db:generate --prefix server
npm run db:push --prefix server

npx concurrently -k -n api,web -c blue,green \
  "npm run dev --prefix server" \
  "npm run dev --prefix app"
```
