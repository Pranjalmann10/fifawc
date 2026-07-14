"""
FIFA World Cup Analytics Dashboard — ETL pipeline.

Reads the CSV seed files in db/seed/, cleans and normalizes them, and loads
them into PostgreSQL according to db/schema.sql.

Usage:
    python etl/load.py                 # apply schema + full reload of seed data
    python etl/load.py --no-schema     # skip re-applying schema.sql
"""
import argparse
import os
from datetime import timedelta
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

ROOT = Path(__file__).resolve().parent.parent
SEED_DIR = ROOT / "db" / "seed"
SCHEMA_FILE = ROOT / "db" / "schema.sql"
VIEWS_FILE = ROOT / "db" / "views.sql"

load_dotenv(ROOT / ".env")

STAGE_ORDER = ["Group", "Round of 16", "Quarter-final", "Semi-final", "Third place", "Final"]


def get_engine():
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise SystemExit("DATABASE_URL is not set. Copy .env.example to .env and fill it in.")
    return create_engine(url)


def apply_schema(engine):
    sql = SCHEMA_FILE.read_text()
    with engine.begin() as conn:
        conn.execute(text(sql))
    print(f"[schema] applied {SCHEMA_FILE.relative_to(ROOT)}")


def apply_views(engine):
    sql = VIEWS_FILE.read_text()
    with engine.begin() as conn:
        conn.execute(text(sql))
    print(f"[views] applied {VIEWS_FILE.relative_to(ROOT)}")


def reset_data(engine):
    tables = [
        "goals",
        "player_tournament_stats",
        "match_stats",
        "matches",
        "players",
        "tournament_group_teams",
        "tournament_groups",
        "team_rankings",
        "tournaments",
        "teams",
        "confederations",
    ]
    with engine.begin() as conn:
        conn.execute(text(f"TRUNCATE {', '.join(tables)} RESTART IDENTITY CASCADE"))
    print("[reset] cleared existing rows from all tables")


def load_confederations(engine):
    df = pd.read_csv(SEED_DIR / "confederations.csv")
    df.to_sql("confederations", engine, if_exists="append", index=False)
    print(f"[confederations] loaded {len(df)} rows")


def load_teams(engine):
    df = pd.read_csv(SEED_DIR / "teams.csv")
    conf_map = pd.read_sql("SELECT confederation_id, code FROM confederations", engine)
    conf_lookup = dict(zip(conf_map["code"], conf_map["confederation_id"]))
    df["confederation_id"] = df["confederation_code"].map(conf_lookup)
    if df["confederation_id"].isna().any():
        missing = df[df["confederation_id"].isna()]["name"].tolist()
        raise ValueError(f"Unmapped confederation codes for teams: {missing}")
    out = df[["name", "iso_code", "confederation_id"]]
    out.to_sql("teams", engine, if_exists="append", index=False)
    print(f"[teams] loaded {len(out)} rows")


def load_tournaments(engine):
    df = pd.read_csv(SEED_DIR / "tournaments.csv")
    teams = pd.read_sql("SELECT team_id, name FROM teams", engine)
    team_lookup = dict(zip(teams["name"], teams["team_id"]))

    def resolve(name):
        if pd.isna(name) or name == "":
            return None
        if name not in team_lookup:
            raise ValueError(f"Unknown team in tournaments.csv: {name!r}")
        return team_lookup[name]

    df["winner_team_id"] = df["winner"].apply(resolve)
    df["runner_up_team_id"] = df["runner_up"].apply(resolve)
    df["third_place_team_id"] = df["third_place"].apply(resolve)
    df["fourth_place_team_id"] = df["fourth_place"].apply(resolve)
    out = df.rename(columns={
        "golden_boot_player": "golden_boot_player",
        "golden_boot_goals": "golden_boot_goals",
    })[[
        "year", "host_country", "format", "num_teams",
        "winner_team_id", "runner_up_team_id", "third_place_team_id", "fourth_place_team_id",
        "golden_boot_player", "golden_boot_goals", "start_date", "end_date",
    ]]
    out.to_sql("tournaments", engine, if_exists="append", index=False)
    print(f"[tournaments] loaded {len(out)} rows")


def load_groups(engine):
    df = pd.read_csv(SEED_DIR / "groups.csv")
    tournaments = pd.read_sql("SELECT tournament_id, year FROM tournaments", engine)
    year_lookup = dict(zip(tournaments["year"], tournaments["tournament_id"]))
    teams = pd.read_sql("SELECT team_id, name FROM teams", engine)
    team_lookup = dict(zip(teams["name"], teams["team_id"]))

    group_rows = df[["year", "group_name"]].drop_duplicates().reset_index(drop=True)
    group_rows["tournament_id"] = group_rows["year"].map(year_lookup)
    group_rows[["tournament_id", "group_name"]].to_sql(
        "tournament_groups", engine, if_exists="append", index=False
    )

    groups = pd.read_sql("SELECT group_id, tournament_id, group_name FROM tournament_groups", engine)
    groups = groups.merge(tournaments, on="tournament_id")
    group_lookup = {(r.year, r.group_name): r.group_id for r in groups.itertuples()}

    df["group_id"] = df.apply(lambda r: group_lookup[(r["year"], r["group_name"])], axis=1)
    df["team_id"] = df["team"].map(team_lookup)
    if df["team_id"].isna().any():
        missing = df[df["team_id"].isna()]["team"].unique().tolist()
        raise ValueError(f"Unknown team in groups.csv: {missing}")
    df[["group_id", "team_id"]].to_sql("tournament_group_teams", engine, if_exists="append", index=False)
    print(f"[groups] loaded {len(group_rows)} groups, {len(df)} group-team assignments")


def _match_date(start_date, end_date, stage, idx, total):
    """Approximate a chronological match date within the tournament window.

    Exact historical fixture dates aren't stored in the seed data (only
    stage + result); this spreads matches plausibly across the known
    tournament start/end window so time-series views (form trends, results
    over time) sort correctly. Final/Third-place/Semis are anchored close to
    the real end_date since those are well-documented.
    """
    if stage == "Final":
        return end_date
    if stage == "Third place":
        return end_date - timedelta(days=1)
    if stage == "Semi-final":
        return end_date - timedelta(days=4)
    if stage == "Quarter-final":
        return end_date - timedelta(days=7)
    if stage == "Round of 16":
        return end_date - timedelta(days=10)
    # Group stage: spread across the first portion of the tournament
    span_end = end_date - timedelta(days=13)
    span_days = max((span_end - start_date).days, 1)
    offset = int(span_days * (idx / max(total, 1)))
    return start_date + timedelta(days=offset)


def load_matches(engine):
    df = pd.read_csv(SEED_DIR / "matches.csv")

    # --- cleaning / validation ---
    df["group_name"] = df["group_name"].fillna("")
    df["venue"] = df["venue"].fillna("")
    for col in ["home_penalties", "away_penalties"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df["went_to_extra_time"] = df["went_to_extra_time"].astype(bool)
    df["went_to_penalties"] = df["went_to_penalties"].astype(bool)
    if (df["home_score"] < 0).any() or (df["away_score"] < 0).any():
        raise ValueError("Negative scores found in matches.csv")
    if (df["home_team"] == df["away_team"]).any():
        raise ValueError("A match has the same home and away team")

    tournaments = pd.read_sql(
        "SELECT tournament_id, year, start_date, end_date FROM tournaments", engine
    )
    t_lookup = {r.year: r for r in tournaments.itertuples()}
    teams = pd.read_sql("SELECT team_id, name FROM teams", engine)
    team_lookup = dict(zip(teams["name"], teams["team_id"]))
    groups = pd.read_sql("SELECT group_id, tournament_id, group_name FROM tournament_groups", engine)
    group_lookup = {(r.tournament_id, r.group_name): r.group_id for r in groups.itertuples()}

    for col in ["home_team", "away_team"]:
        unknown = sorted(set(df[col]) - set(team_lookup))
        if unknown:
            raise ValueError(f"Unknown team(s) in matches.csv column {col}: {unknown}")

    df["tournament_id"] = df["year"].map(lambda y: t_lookup[y].tournament_id)
    df["group_id"] = df.apply(
        lambda r: group_lookup.get((r["tournament_id"], r["group_name"])) if r["group_name"] else None,
        axis=1,
    )
    df["home_team_id"] = df["home_team"].map(team_lookup)
    df["away_team_id"] = df["away_team"].map(team_lookup)

    # assign approximate chronological dates, stable within (tournament, stage)
    df["_stage_rank"] = df["stage"].map({s: i for i, s in enumerate(STAGE_ORDER)})
    df = df.sort_values(["tournament_id", "_stage_rank"]).reset_index(drop=True)
    dates = []
    for (tid, stage), group_df in df.groupby(["tournament_id", "stage"], sort=False):
        t = t_lookup[df.loc[group_df.index[0], "year"]]
        total = len(group_df)
        for i, idx in enumerate(group_df.index):
            dates.append((idx, _match_date(t.start_date, t.end_date, stage, i, total)))
    date_map = dict(dates)
    df["match_date"] = df.index.map(date_map)

    out = df[[
        "tournament_id", "group_id", "stage", "match_date", "venue",
        "home_team_id", "away_team_id", "home_score", "away_score",
        "home_penalties", "away_penalties", "went_to_extra_time", "went_to_penalties",
    ]]
    out.to_sql("matches", engine, if_exists="append", index=False)
    print(f"[matches] loaded {len(out)} rows")


def load_top_scorers(engine):
    df = pd.read_csv(SEED_DIR / "top_scorers.csv")
    tournaments = pd.read_sql("SELECT tournament_id, year FROM tournaments", engine)
    year_lookup = dict(zip(tournaments["year"], tournaments["tournament_id"]))
    teams = pd.read_sql("SELECT team_id, name FROM teams", engine)
    team_lookup = dict(zip(teams["name"], teams["team_id"]))

    df["team_id"] = df["team"].map(team_lookup)
    if df["team_id"].isna().any():
        missing = df[df["team_id"].isna()]["team"].unique().tolist()
        raise ValueError(f"Unknown team in top_scorers.csv: {missing}")
    df["tournament_id"] = df["year"].map(year_lookup)

    players = df[["player_name", "team_id"]].drop_duplicates().rename(
        columns={"player_name": "full_name"}
    )
    players.to_sql("players", engine, if_exists="append", index=False)

    players_db = pd.read_sql("SELECT player_id, full_name, team_id FROM players", engine)
    player_lookup = {(r.full_name, r.team_id): r.player_id for r in players_db.itertuples()}
    df["player_id"] = df.apply(lambda r: player_lookup[(r["player_name"], r["team_id"])], axis=1)
    df["is_golden_boot"] = df["is_golden_boot"].astype(bool)

    out = df[["player_id", "tournament_id", "goals", "is_golden_boot"]]
    out.to_sql("player_tournament_stats", engine, if_exists="append", index=False)
    print(f"[top_scorers] loaded {len(players)} players, {len(out)} tournament stat rows")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-schema", action="store_true", help="skip applying schema.sql")
    parser.add_argument("--no-reset", action="store_true", help="skip truncating existing data")
    args = parser.parse_args()

    engine = get_engine()
    if not args.no_schema:
        apply_schema(engine)
    if not args.no_reset:
        reset_data(engine)

    load_confederations(engine)
    load_teams(engine)
    load_tournaments(engine)
    load_groups(engine)
    load_matches(engine)
    load_top_scorers(engine)
    apply_views(engine)
    print("\nETL complete.")


if __name__ == "__main__":
    main()
