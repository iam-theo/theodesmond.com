# Self-hosting theodesmond.com (no Vercel, no Supabase)

One VPS runs everything: Postgres + the Node server (API + static site),
behind nginx with a Let's Encrypt cert. Prerendered SEO pages keep working
— the server serves `dist/` first and falls back to the SPA shell
(including `/admin`).

## 1. VPS prep

Docker + nginx + certbot (already present on srv1961262):

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx
```

## 2. Deploy the app

```bash
cd ~/theodesmond.com
cp .env.example .env
# edit .env: DB_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET, SMTP_*
docker compose up -d --build

# seed posts / products / content from src/data.js (safe to re-run)
docker compose exec -T app npm run server:seed
```

The first boot also creates the staff admin from `ADMIN_EMAIL` /
`ADMIN_PASSWORD`. **Change that password after first login** (it was shared
in plain text during setup).

## 3. Domain + HTTPS (nginx + certbot)

`/etc/nginx/sites-available/theodesmond.com` (symlinked into
`sites-enabled/`):

```nginx
server {
    server_name theodesmond.com www.theodesmond.com;
    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 80;
    listen [::]:80;
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d theodesmond.com -d www.theodesmond.com \
  --non-interactive --agree-tos --redirect -m hello@theodesmond.com
```

Then point DNS (`theodesmond.com`, `www`) at the VPS IP and remove the
Vercel project when ready. Certbot renews automatically via its timer
(`certbot certificates` to check).

## 4. Admin

Sign in at `https://theodesmond.com/admin`. Tabs: Overview, Posts,
Products, Content, Messages, Subscribers, Comments, Visits. Edits are live
immediately; brand-new posts/products need `docker compose up -d --build`
again so prerendered SEO HTML picks them up.

## 5. Local dev

```bash
# terminal 1 — needs a Postgres (docker-compose db, or local)
npm run server          # API on :3001 (needs DATABASE_URL in .env)
# terminal 2
npm run dev             # Vite on :5173, /api proxied to :3001
```

## 6. Aurex tab (calls the standalone aurex-saas-model backend)

Admin → ⚡ Aurex chats with your Aurex backend, which runs agent tasks with
`/root/theodesmond.com` as its working directory (host mode). No OpenRouter
key needed on this side — the model layer lives in Aurex.

One-time setup (already done on srv1961262, documented for rebuilds):

```bash
# 1. Service user in the Aurex DB (scrypt hash per apps/api/src/passwords.ts),
#    then login at :4010/api/auth/login and create project "theodesmond.com".
# 2. Legacy workspace row for that project with path=/root/theodesmond.com
#    so runs execute in the site folder (checked: runDirectory = workspace.path).
# 3. Env in theodesmond .env:
#      AUREX_API=http://host.docker.internal:4010
#      AUREX_SERVICE_EMAIL=theodesmond-svc@theodesmond.com
#      AUREX_SERVICE_PASS=<generated>
#      AUREX_PROJECT_ID=<aurex project id>
```

The app container reaches the host via `host.docker.internal` (compose
`extra_hosts`) plus a UFW rule — UFW is active on this host:

```bash
docker network inspect theodesmondcom_default --format '{{(index .IPAM.Config 0).Subnet}}'
ufw allow from <that-subnet> to any port 4010
```

If the Aurex API moves ports/hosts, update `AUREX_API` and `docker compose up -d`.

## Notes

- Backups: `docker compose exec db pg_dump -U theo theodesmond > backup.sql`
- Logs: `docker compose logs -f app`
- The old `supabase/` edge functions are replaced by `server/` routes:
  `send-mail` → `POST /api/contact` + `/api/subscribe`,
  `track-visit` → `POST /api/track`, `record-view` → `POST /api/views/:slug`,
  `notify-reply` → `POST /api/comments/notify`.
