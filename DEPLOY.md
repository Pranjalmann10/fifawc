# Deployment Guide

Stack: **Supabase (Postgres)** already live &rarr; **Render** (Node/Express API) &rarr; **Vercel** (React frontend).

## 1. Database — Supabase (done)

The schema, views, and seed data are already loaded into your Supabase project via
`etl/load.py`. To reload/refresh at any time:

```bash
.venv/Scripts/python etl/load.py
```

Your Supabase project's Postgres connection string lives in the repo-root `.env`
(gitignored, never committed). If you rotate the DB password, update it there.

## 2. Backend API — Render

1. Push this repo to GitHub (see step 0 below if not done yet).
2. Go to [render.com](https://render.com) &rarr; sign up/log in &rarr; **New +** &rarr; **Web Service**.
3. Connect your GitHub repo.
4. Configure:
   - **Root directory:** `backend`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free
5. Add environment variables (Render dashboard &rarr; Environment):
   - `DATABASE_URL` — the same Supabase connection string from your local `.env`
   - `PORT` — `4000` (Render overrides this with its own `PORT` env var automatically; the app already reads `process.env.PORT`)
6. Deploy. Note the public URL Render gives you, e.g. `https://fifawc-api.onrender.com`.
7. Verify: `curl https://fifawc-api.onrender.com/api/health` should return `{"status":"ok","db":"connected"}`.

Free-tier Render services spin down after inactivity and take ~30-60s to wake on
the first request — fine for a portfolio demo, mention it if timing matters in an interview.

## 3. Frontend — Vercel

1. Go to [vercel.com](https://vercel.com) &rarr; **Add New** &rarr; **Project** &rarr; import the same GitHub repo.
2. Configure:
   - **Root directory:** `frontend`
   - **Framework preset:** Vite
   - **Build command:** `npm run build` (default)
   - **Output directory:** `dist` (default)
3. Add environment variable:
   - `VITE_API_URL` = `https://fifawc-api.onrender.com/api` (your Render URL from step 2, with `/api` suffix)
4. Deploy. Vercel gives you a public URL, e.g. `https://fifawc.vercel.app` — that's your live, shareable link.

## 0. Push to GitHub (if not already)

```bash
git add -A
git commit -m "Initial commit: FIFA World Cup analytics dashboard"
git branch -M main
git remote add origin https://github.com/<your-username>/fifawc.git
git push -u origin main
```

## Updating after changes

- **Schema/data changes:** edit `db/schema.sql`, `db/views.sql`, or `db/seed/*.csv`, then rerun
  `python etl/load.py` locally against the Supabase `DATABASE_URL`.
- **Backend/frontend changes:** push to GitHub — both Render and Vercel auto-deploy on push to `main`.
