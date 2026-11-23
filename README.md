# DS Style E-commerce

| Folder      | What it is                                    | Local URL             | Production URL                            |
| ----------- | --------------------------------------------- | --------------------- | ----------------------------------------- |
| `backend/`  | Express API + MongoDB (Docker) + Telegram bot | http://localhost:3040 | https://api-dsstyle.endmartaddis.com      |
| `frontend/` | Customer storefront (Vite + React)            | http://localhost:5173 | https://dsstyle.endmartaddis.com          |
| `admin/`    | Admin dashboard (Vite + React)                | http://localhost:5174 | https://admin-dsstyle.endmartaddis.com    |
| `apks/`     | Android builds (.apk)                         | -                     | -                                         |

## Run locally

```bash
# 1. Backend + MongoDB (MongoDB is reachable on localhost:3043 for Compass)
cd backend
docker compose up -d --build
docker compose exec backend node scripts/seed.js   # DS Style products (only if DB is empty; --force to replace)

# 2. Storefront
cd ../frontend && npm install && npm run dev

# 3. Admin
cd ../admin && npm install && npm run dev
```

The local container bind-mounts the source, so after editing backend code run
`docker compose restart backend`. Product images are served from `backend/uploads/products/`.

## Deploy to production

### 1. DNS (Vercel → Domains → endmartaddis.com → DNS Records)

Type only the sub-name in **Name**; Vercel appends `.endmartaddis.com`.

| Name            | Type  | Value                  |
| --------------- | ----- | ---------------------- |
| `dsstyle`       | CNAME | `cname.vercel-dns.com` |
| `admin-dsstyle` | CNAME | `cname.vercel-dns.com` |
| `api-dsstyle`   | A     | `72.61.203.11`         |

### 2. Storefront and admin (Vercel)

Create two Vercel projects from this repo:

| Project    | Root Directory | Domain (Settings → Domains)        |
| ---------- | -------------- | ---------------------------------- |
| storefront | `frontend`     | `dsstyle.endmartaddis.com`         |
| admin      | `admin`        | `admin-dsstyle.endmartaddis.com`   |

Vite is detected automatically. All production values are in `frontend/.env.production` and
`admin/.env.production` (public `VITE_*` values only), so no Vercel environment variables are needed.

### 3. Backend (server 72.61.203.11)

```bash
# copy the backend folder to the server (code + uploads/products photos), then:
cd backend
# upload your secrets file as backend/.env.production (it is git- and docker-ignored)
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend node scripts/seed.js   # first time only
curl http://127.0.0.1:3040/health

# nginx + HTTPS
sudo cp deploy/nginx-dsstyle.conf /etc/nginx/sites-available/dsstyle-api.conf
sudo ln -s /etc/nginx/sites-available/dsstyle-api.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api-dsstyle.endmartaddis.com
```

Production differences from local: the API port is bound to `127.0.0.1` (reachable only via nginx),
MongoDB is not published, and the code is baked into the image (rebuild with `up -d --build` after changes).

Only one copy of the Telegram bot can run per token: stop the local backend (`docker compose down`)
while the production one is running.

## Environment files

| File                                       | Used by                    | In git? |
| ------------------------------------------ | -------------------------- | ------- |
| `backend/.env`                             | local backend              | no      |
| `backend/.env.production`                  | production backend         | no      |
| `backend/.env.example`                     | template (no secrets)      | yes     |
| `frontend/.env`, `admin/.env`              | `npm run dev`              | no      |
| `frontend/.env.production`, `admin/.env.production` | `npm run build` / Vercel | yes (public values only) |
