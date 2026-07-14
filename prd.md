# Product Requirements Document
## FIFA World Cup 2026 Analytics Dashboard

**Author:** Pranjal Mann
**Role:** Data Analyst / Project Owner
**Status:** Phase 1 & 2 Complete — live end-to-end build shipped
**Last Updated:** July 2026

> **Stack update (2026-07-14):** the BI layer shipped as a custom React
> dashboard (Node/Express API over PostgreSQL) instead of Power BI, and the
> whole stack is deployed live (Supabase + Vercel) rather than
> staying a local desktop artifact. Rationale: a live, shareable link is more
> resume/interview-friendly than a Power BI file that requires the reviewer
> to have Power BI Desktop installed, and it demonstrates full-stack skills
> (API design, React) alongside the data modeling/SQL work. The PostgreSQL
> schema, Python ETL pipeline, and advanced SQL (window functions/CTEs) are
> unchanged from the original design — see Section 6 and `README.md` for the
> as-built stack.

---

## 1. Overview

The FIFA World Cup 2026 Analytics Dashboard is an end-to-end data analytics project that ingests, models, and visualizes football data (teams, players, matches, historical results) to surface insights and predictive signals ahead of and during the 2026 World Cup. The project is built as a portfolio piece to demonstrate data engineering, SQL modeling, and BI visualization skills for data analyst and cloud/security-adjacent roles.

## 2. Problem Statement

Football fans, analysts, and fantasy-league players lack a single, well-structured, queryable view of historical and current World Cup data that combines team form, player statistics, and head-to-head trends in one interactive dashboard. Most public sources are fragmented across news sites, stat portals, and spreadsheets with no unified schema.

## 3. Goals & Objectives

- Build a normalized relational database of historical FIFA World Cup data (teams, matches, players, tournaments).
- Provide an interactive BI dashboard for exploring team performance, match trends, and player statistics.
- Demonstrate a full data pipeline: ingestion → cleaning → storage → transformation → visualization.
- Produce a project with clear phase-based delivery suitable for a resume/portfolio showcase and interview walkthrough.

## 4. Non-Goals

- Real-time live match score streaming (out of scope for Phase 1–2).
- Predictive ML modeling of match outcomes (handled in a separate, parallel ML ensemble project using XGBoost/LSTM/River ML).
- Public multi-user hosting/authentication (single-user analyst tool for now).

## 5. Target Users

| User | Need |
|---|---|
| Recruiters/Interviewers | Quickly assess data modeling, SQL, and BI skill depth |
| Football analysts/fans | Explore historical trends and team comparisons |
| Pranjal (self) | Portfolio artifact demonstrating analyst + engineering skills |

## 6. Tech Stack

| Layer | Technology |
|---|---|
| Database | PostgreSQL (hosted on Supabase) |
| Data Processing / ETL | Python (pandas, psycopg2/SQLAlchemy) |
| API | Node.js + Express (REST) |
| Visualization | React (Vite) + Recharts, deployed on Vercel |
| Hosting | Supabase (DB) + Vercel (serverless API + frontend) |
| Version Control | Git/GitHub |
| Data Sources | Public FIFA/World Cup historical results (2002-2022), compiled from training knowledge and documented in `README.md` |

## 7. System Architecture

```
[ Raw Data Sources ]
   (CSV / API / scraped stats)
          |
          v
[ Python ETL Scripts ]
   - cleaning, validation
   - normalization
          |
          v
[ PostgreSQL Database (Supabase) ]
   - Teams, Matches, Players,
     Tournaments, Stats tables
   - Analytical views: rolling form,
     standings, head-to-head, top scorers
          |
          v
[ Node/Express REST API (Vercel serverless function) ]
   - Parameterized queries over the
     analytical views
          |
          v
[ React Dashboard (Vercel) ]
   - Match explorer, group standings,
     top scorers, team form trends,
     head-to-head
```

## 8. Data Model (Core Entities)

- **Teams** — team_id, name, confederation, FIFA ranking history
- **Tournaments** — tournament_id, year, host country, format
- **Matches** — match_id, tournament_id, home_team, away_team, score, stage, date
- **Players** — player_id, team_id, position, appearances, goals
- **Match_Stats** — possession, shots, cards, per-match granular stats

## 9. Features by Phase

### Phase 1 — Complete ✅
- PostgreSQL schema design and normalization (teams, matches, tournaments, players)
- Historical World Cup data ingestion pipeline in Python (World Cups 2002-2022)
- Data cleaning/validation in the ETL (score sanity checks, unresolved-team checks, idempotent reload)
- Base SQL queries for team performance, historical head-to-heads
- Live match results explorer (React, replacing the originally planned Power BI baseline dashboard)

### Phase 2 — Complete ✅
- Expanded dashboard views: top scorers leaderboard, group-stage standings, team form trends (rolling 5-match window)
- Advanced SQL: window functions for rolling form (`team_rolling_form`), CTEs for group standings and tournament progression
- Dashboard filters: confederation, tournament year, stage, team search; dedicated head-to-head page
- Live deployment: Supabase (DB) + Vercel (serverless API + frontend) — see `DEPLOY.md`

### Phase 2.5 — Follow-up (not yet done)
- Group-stage match-by-match data for 2002/2006/2010/2014 (currently knockout-stage only for those years; schema/ETL already support it)
- Data refresh automation for 2026 tournament fixtures as results become available

### Phase 3 — Planned
- Integration checkpoint with the parallel ML ensemble project (optional: surface model predictions as a dashboard layer)
- Export/report generation (PDF snapshots of dashboard views)
- Performance tuning for larger historical dataset (indexing, query optimization)

## 10. Success Metrics

- Schema supports 90+ years of World Cup history without redesign
- Dashboard load time under 3 seconds per view
- At least 4 distinct interactive dashboard pages (team explorer, top scorers, standings, head-to-head)
- Project is demo-able end-to-end in under 5 minutes for interviews

## 11. Risks & Constraints

| Risk | Mitigation |
|---|---|
| Inconsistent historical data across sources | Standardize via ETL validation layer, manual reconciliation for edge cases |
| Free-tier hosting cold starts/limits (Vercel/Supabase) | Acceptable for a portfolio demo; core value stays in the portable PostgreSQL + SQL layer regardless of host |
| Scope creep into ML territory | Keep prediction work in the separate ML ensemble project |

## 12. Resume-Ready Summary

> **FIFA World Cup 2026 Analytics Dashboard** — Designed and built a normalized PostgreSQL data model for historical World Cup data (2002&ndash;2022); developed Python ETL pipelines for ingestion, validation, and loading; wrote advanced SQL (window functions, CTEs) for rolling team form, group standings, and head-to-head analytics; built a Node/Express REST API and a live React dashboard surfacing team performance, top scorers, standings, and head-to-head trends — deployed end-to-end on Supabase and Vercel, demonstrating the full data analyst + full-stack workflow from raw data to a shareable, production-hosted product.

---

*This PRD is a living document and will be updated as Phase 2 and Phase 3 features are completed.*