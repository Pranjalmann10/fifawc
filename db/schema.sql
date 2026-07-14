-- FIFA World Cup Analytics Dashboard — Normalized Schema
-- Target: PostgreSQL 14+ (Supabase-compatible)

CREATE TABLE IF NOT EXISTS confederations (
    confederation_id    SMALLSERIAL PRIMARY KEY,
    code                 VARCHAR(10) NOT NULL UNIQUE,   -- UEFA, CONMEBOL, CONCACAF, CAF, AFC, OFC
    name                 VARCHAR(120) NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
    team_id              SERIAL PRIMARY KEY,
    name                 VARCHAR(80) NOT NULL UNIQUE,
    iso_code             CHAR(3),
    confederation_id     SMALLINT REFERENCES confederations(confederation_id)
);

CREATE TABLE IF NOT EXISTS team_rankings (
    ranking_id           SERIAL PRIMARY KEY,
    team_id              INTEGER NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    ranking_date         DATE NOT NULL,
    fifa_points          NUMERIC(8,2),
    rank_position         SMALLINT,
    UNIQUE (team_id, ranking_date)
);

CREATE TABLE IF NOT EXISTS tournaments (
    tournament_id        SERIAL PRIMARY KEY,
    year                 SMALLINT NOT NULL UNIQUE,
    host_country          VARCHAR(80) NOT NULL,
    format                VARCHAR(120),          -- e.g. "32 teams, 8 groups of 4 + knockout"
    num_teams             SMALLINT NOT NULL DEFAULT 32,
    winner_team_id         INTEGER REFERENCES teams(team_id),
    runner_up_team_id      INTEGER REFERENCES teams(team_id),
    third_place_team_id    INTEGER REFERENCES teams(team_id),
    fourth_place_team_id   INTEGER REFERENCES teams(team_id),
    golden_boot_player     VARCHAR(100),
    golden_boot_goals      SMALLINT,
    start_date            DATE,
    end_date              DATE
);

CREATE TABLE IF NOT EXISTS tournament_groups (
    group_id             SERIAL PRIMARY KEY,
    tournament_id         INTEGER NOT NULL REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
    group_name            VARCHAR(5) NOT NULL,     -- 'A', 'B', ...
    UNIQUE (tournament_id, group_name)
);

CREATE TABLE IF NOT EXISTS tournament_group_teams (
    group_id             INTEGER NOT NULL REFERENCES tournament_groups(group_id) ON DELETE CASCADE,
    team_id              INTEGER NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, team_id)
);

CREATE TABLE IF NOT EXISTS players (
    player_id            SERIAL PRIMARY KEY,
    team_id              INTEGER REFERENCES teams(team_id),
    full_name             VARCHAR(120) NOT NULL,
    position              VARCHAR(20),             -- GK, DF, MF, FW
    date_of_birth          DATE,
    UNIQUE (full_name, team_id)
);

CREATE TABLE IF NOT EXISTS matches (
    match_id             SERIAL PRIMARY KEY,
    tournament_id         INTEGER NOT NULL REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
    group_id              INTEGER REFERENCES tournament_groups(group_id),
    stage                 VARCHAR(30) NOT NULL,   -- 'Group', 'Round of 16', 'Quarter-final', 'Semi-final', 'Third place', 'Final'
    match_date            DATE NOT NULL,
    venue                 VARCHAR(120),
    home_team_id           INTEGER NOT NULL REFERENCES teams(team_id),
    away_team_id           INTEGER NOT NULL REFERENCES teams(team_id),
    home_score             SMALLINT NOT NULL,
    away_score             SMALLINT NOT NULL,
    home_score_et           SMALLINT,               -- score after extra time, if applicable
    away_score_et           SMALLINT,
    home_penalties          SMALLINT,
    away_penalties          SMALLINT,
    went_to_extra_time      BOOLEAN NOT NULL DEFAULT FALSE,
    went_to_penalties       BOOLEAN NOT NULL DEFAULT FALSE,
    CHECK (home_team_id <> away_team_id)
);

CREATE TABLE IF NOT EXISTS match_stats (
    match_stat_id         SERIAL PRIMARY KEY,
    match_id              INTEGER NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    team_id               INTEGER NOT NULL REFERENCES teams(team_id),
    possession_pct         NUMERIC(4,1),
    shots                  SMALLINT,
    shots_on_target          SMALLINT,
    fouls                   SMALLINT,
    yellow_cards             SMALLINT DEFAULT 0,
    red_cards                SMALLINT DEFAULT 0,
    corners                 SMALLINT,
    UNIQUE (match_id, team_id)
);

-- Aggregate per-tournament player stats (used for top-scorer leaderboards
-- when granular per-goal/per-minute data isn't available for older tournaments)
CREATE TABLE IF NOT EXISTS player_tournament_stats (
    stat_id               SERIAL PRIMARY KEY,
    player_id             INTEGER NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    tournament_id          INTEGER NOT NULL REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
    goals                  SMALLINT NOT NULL DEFAULT 0,
    appearances             SMALLINT,
    is_golden_boot           BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (player_id, tournament_id)
);

CREATE TABLE IF NOT EXISTS goals (
    goal_id               SERIAL PRIMARY KEY,
    match_id              INTEGER NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    team_id               INTEGER NOT NULL REFERENCES teams(team_id),
    player_id             INTEGER REFERENCES players(player_id),
    minute                 SMALLINT,
    is_penalty              BOOLEAN NOT NULL DEFAULT FALSE,
    is_own_goal             BOOLEAN NOT NULL DEFAULT FALSE
);

-- === Indexes for common query patterns ===
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_stage ON matches(stage);
CREATE INDEX IF NOT EXISTS idx_goals_match ON goals(match_id);
CREATE INDEX IF NOT EXISTS idx_goals_player ON goals(player_id);
CREATE INDEX IF NOT EXISTS idx_goals_team ON goals(team_id);
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_match_stats_match ON match_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_pts_tournament ON player_tournament_stats(tournament_id);
CREATE INDEX IF NOT EXISTS idx_pts_player ON player_tournament_stats(player_id);

-- Convenience view: one row per team per match (both home & away perspectives)
CREATE OR REPLACE VIEW team_match_results AS
SELECT
    m.match_id,
    m.tournament_id,
    t.year AS tournament_year,
    m.stage,
    m.match_date,
    m.home_team_id AS team_id,
    m.away_team_id AS opponent_id,
    m.home_score AS goals_for,
    m.away_score AS goals_against,
    CASE WHEN m.home_score > m.away_score THEN 'W'
         WHEN m.home_score < m.away_score THEN 'L'
         ELSE 'D' END AS result,
    TRUE AS is_home
FROM matches m
JOIN tournaments t ON t.tournament_id = m.tournament_id
UNION ALL
SELECT
    m.match_id,
    m.tournament_id,
    t.year,
    m.stage,
    m.match_date,
    m.away_team_id AS team_id,
    m.home_team_id AS opponent_id,
    m.away_score AS goals_for,
    m.home_score AS goals_against,
    CASE WHEN m.away_score > m.home_score THEN 'W'
         WHEN m.away_score < m.home_score THEN 'L'
         ELSE 'D' END AS result,
    FALSE AS is_home
FROM matches m
JOIN tournaments t ON t.tournament_id = m.tournament_id;
