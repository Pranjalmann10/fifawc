# FIFA World Cup Analytics Dashboard

An end-to-end data analytics project: a normalized PostgreSQL data model of
World Cup history (2002&ndash;2022), a Python ETL pipeline, a SQL layer with
window-function/CTE-based analytics, a Node/Express REST API, and a React
dashboard for exploring it all.

**Live:** [fifawc-ten.vercel.app](https://fifawc-ten.vercel.app) &middot; API: [fifawc-api.vercel.app/api/health](https://fifawc-api.vercel.app/api/health)

See [`prd.md`](prd.md) for the full product requirements.

## Stack

| Layer | Technology |
|---|---|
| Database | PostgreSQL (hosted on [Supabase](https://supabase.com)) |
| ETL | Python (pandas, SQLAlchemy, psycopg2) |
| API | Node.js + Express |
| Frontend | React (Vite) + Recharts |
| Hosting | Supabase (DB) + Vercel (serverless API + frontend) |

## Project layout

```
db/
  schema.sql      normalized schema: teams, tournaments, matches, players, etc.
  views.sql       analytical views: rolling form, standings, head-to-head, top scorers
  seed/*.csv      seed data: World Cups 2002-2022 (+2026 metadata)
etl/
  load.py         cleans + loads seed CSVs into Postgres, applies schema/views
backend/
  src/            Express REST API (routes per resource)
frontend/
  src/            React dashboard (Vite)
```

## Local development

### 1. Database

Create a free [Supabase](https://supabase.com) project (or point at any Postgres
14+ instance), then copy `.env.example` to `.env` and fill in `DATABASE_URL`.

### 2. ETL — load the data

```bash
python -m venv .venv
.venv/Scripts/pip install -r etl/requirements.txt   # .venv/bin/pip on macOS/Linux
.venv/Scripts/python etl/load.py                    # applies schema.sql + views.sql, loads all seed data
```

Re-run any time you change `db/schema.sql`, `db/views.sql`, or the seed CSVs
(it truncates and reloads all tables).

### 3. Backend API

```bash
cd backend
npm install
npm start        # http://localhost:4000
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

## Data notes

- Full match-by-match data (all 64 matches, group stage through final) is
  seeded for **2018 and 2022**.
- **2002, 2006, 2010, 2014** are seeded with full group-stage team lineups
  plus complete knockout-stage results (Round of 16 through Final) &mdash;
  group-stage match-by-match scorelines for those years aren't in the seed
  data yet (the schema/ETL fully support adding them; see `db/seed/matches.csv`).
- Exact calendar dates for matches are approximated from each tournament's
  known start/end window and stage (see `_match_date` in `etl/load.py`) rather
  than sourced from an authoritative fixture list &mdash; stage and score are
  accurate, calendar date is a reasonable approximation for chronological sorting.
- 2026 is seeded as tournament metadata only (host, format) since the
  tournament's results aren't final at the time of writing.

## Deployment

See [`DEPLOY.md`](DEPLOY.md) for the full guide to going live on
Supabase + Vercel.
