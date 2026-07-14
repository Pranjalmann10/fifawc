# Deployment Guide

**Live URLs (already deployed):**
- Frontend: https://fifawc-ten.vercel.app
- API: https://fifawc-api.vercel.app/api (health check: `/api/health`)

Stack: **Supabase** (Postgres) &rarr; **Vercel serverless function** (Node/Express API) &rarr; **Vercel** (React frontend, static).
Both the API and frontend are separate Vercel projects (`fifawc-api` and `fifawc`) in the
`pranjalmann10s-projects` scope, both deployed from this same repo via the Vercel CLI.

## 1. Database — Supabase (done)

Schema, views, and seed data are loaded into Supabase via `etl/load.py`. To reload/refresh:

```bash
.venv/Scripts/python etl/load.py
```

The Supabase connection string lives in the repo-root `.env` (gitignored, never committed).

## 2. Backend API — Vercel serverless (done)

The Express app (`backend/src/app.js`) is wrapped as a single serverless function
(`backend/api/index.js`), with `backend/vercel.json` rewriting all paths to it so
Express's own router (`/api/tournaments`, `/api/matches`, etc.) still works unmodified.

```bash
cd backend
vercel link --yes --project fifawc-api      # one-time
vercel env add DATABASE_URL production      # paste the Supabase connection string
vercel --prod                               # deploy
```

## 3. Frontend — Vercel (done)

```bash
cd frontend
vercel link --yes --project fifawc          # one-time
vercel env add VITE_API_URL production      # https://fifawc-api.vercel.app/api
vercel --prod                               # deploy
```

## Updating after changes

- **Schema/data changes:** edit `db/schema.sql`, `db/views.sql`, or `db/seed/*.csv`, then rerun
  `python etl/load.py` locally against the Supabase `DATABASE_URL`.
- **Backend changes:** `cd backend && vercel --prod`
- **Frontend changes:** `cd frontend && vercel --prod`
- Both projects can also be connected to GitHub (Vercel dashboard &rarr; project &rarr; Settings &rarr;
  Git) to get automatic deploys on every push to `master` instead of running `vercel --prod` by hand.

## Alternative: Render instead of Vercel for the API

If you'd rather run the API as a normal long-lived Node server (e.g. to avoid
serverless cold starts), `backend/src/index.js` is still a standard Express
entrypoint (`npm start`) that works unchanged on Render, Railway, Fly.io, etc.
Point `DATABASE_URL` at the same Supabase instance and set `VITE_API_URL` on
the frontend to wherever that host serves `/api`.
