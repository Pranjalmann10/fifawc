-- FIFA World Cup Analytics Dashboard — analytical views
-- Advanced SQL: window functions for rolling form, CTEs for standings/progression.
-- Run after schema.sql and after the ETL has loaded data.

-- ============================================================
-- Group standings (points table) per tournament + group, CTE-based
-- ============================================================
CREATE OR REPLACE VIEW group_standings AS
WITH group_matches AS (
    SELECT m.tournament_id, m.group_id, m.home_team_id AS team_id,
           m.home_score AS gf, m.away_score AS ga
    FROM matches m WHERE m.stage = 'Group'
    UNION ALL
    SELECT m.tournament_id, m.group_id, m.away_team_id AS team_id,
           m.away_score AS gf, m.home_score AS ga
    FROM matches m WHERE m.stage = 'Group'
),
scored AS (
    SELECT
        tournament_id, group_id, team_id,
        COUNT(*) AS played,
        SUM((gf > ga)::int) AS won,
        SUM((gf = ga)::int) AS drawn,
        SUM((gf < ga)::int) AS lost,
        SUM(gf) AS goals_for,
        SUM(ga) AS goals_against,
        SUM(gf - ga) AS goal_diff,
        SUM(CASE WHEN gf > ga THEN 3 WHEN gf = ga THEN 1 ELSE 0 END) AS points
    FROM group_matches
    GROUP BY tournament_id, group_id, team_id
)
SELECT
    s.*,
    tm.name AS team_name,
    g.group_name,
    tr.year AS tournament_year,
    RANK() OVER (PARTITION BY s.group_id ORDER BY s.points DESC, s.goal_diff DESC, s.goals_for DESC) AS group_rank
FROM scored s
JOIN teams tm ON tm.team_id = s.team_id
JOIN tournament_groups g ON g.group_id = s.group_id
JOIN tournaments tr ON tr.tournament_id = s.tournament_id;

-- ============================================================
-- Rolling team form: points/goals over a trailing 5-match window
-- (window functions: SUM/AVG/ROW_NUMBER OVER ... ROWS BETWEEN)
-- ============================================================
CREATE OR REPLACE VIEW team_rolling_form AS
SELECT
    team_id,
    team_name,
    match_id,
    tournament_year,
    match_date,
    stage,
    result,
    goals_for,
    goals_against,
    CASE result WHEN 'W' THEN 3 WHEN 'D' THEN 1 ELSE 0 END AS match_points,
    SUM(CASE result WHEN 'W' THEN 3 WHEN 'D' THEN 1 ELSE 0 END) OVER (
        PARTITION BY team_id ORDER BY match_date
        ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
    ) AS points_last_5,
    ROUND(AVG(goals_for) OVER (
        PARTITION BY team_id ORDER BY match_date
        ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
    ), 2) AS avg_goals_for_last_5,
    ROUND(AVG(goals_against) OVER (
        PARTITION BY team_id ORDER BY match_date
        ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
    ), 2) AS avg_goals_against_last_5,
    ROW_NUMBER() OVER (PARTITION BY team_id ORDER BY match_date) AS match_seq
FROM (
    SELECT tmr.*, t.name AS team_name
    FROM team_match_results tmr
    JOIN teams t ON t.team_id = tmr.team_id
) x;

-- ============================================================
-- Head-to-head aggregate for any unordered pair of teams
-- ============================================================
CREATE OR REPLACE VIEW head_to_head AS
SELECT
    LEAST(home_team_id, away_team_id) AS team_a_id,
    GREATEST(home_team_id, away_team_id) AS team_b_id,
    COUNT(*) AS matches_played,
    SUM(CASE
        WHEN home_team_id = LEAST(home_team_id, away_team_id) AND home_score > away_score THEN 1
        WHEN away_team_id = LEAST(home_team_id, away_team_id) AND away_score > home_score THEN 1
        ELSE 0 END) AS team_a_wins,
    SUM(CASE
        WHEN home_team_id = GREATEST(home_team_id, away_team_id) AND home_score > away_score THEN 1
        WHEN away_team_id = GREATEST(home_team_id, away_team_id) AND away_score > home_score THEN 1
        ELSE 0 END) AS team_b_wins,
    SUM((home_score = away_score)::int) AS draws,
    SUM(CASE WHEN home_team_id = LEAST(home_team_id, away_team_id) THEN home_score ELSE away_score END) AS team_a_goals,
    SUM(CASE WHEN home_team_id = GREATEST(home_team_id, away_team_id) THEN home_score ELSE away_score END) AS team_b_goals
FROM matches
GROUP BY LEAST(home_team_id, away_team_id), GREATEST(home_team_id, away_team_id);

-- ============================================================
-- Top scorers leaderboard (per tournament rank + running total across dataset)
-- ============================================================
CREATE OR REPLACE VIEW top_scorers_leaderboard AS
SELECT
    p.player_id,
    p.full_name,
    tm.name AS team_name,
    tr.year AS tournament_year,
    pts.goals,
    pts.is_golden_boot,
    RANK() OVER (PARTITION BY tr.year ORDER BY pts.goals DESC) AS tournament_rank,
    SUM(pts.goals) OVER (PARTITION BY p.player_id) AS goals_in_dataset
FROM player_tournament_stats pts
JOIN players p ON p.player_id = pts.player_id
JOIN teams tm ON tm.team_id = p.team_id
JOIN tournaments tr ON tr.tournament_id = pts.tournament_id;

-- ============================================================
-- Tournament progression: furthest stage each team reached, per tournament
-- (CTE with a VALUES-based stage-ordering lookup)
-- ============================================================
CREATE OR REPLACE VIEW tournament_progression AS
WITH stage_rank(stage, rnk) AS (
    VALUES ('Group', 1), ('Round of 16', 2), ('Quarter-final', 3),
           ('Semi-final', 4), ('Third place', 5), ('Final', 6)
),
team_stage_matches AS (
    SELECT tournament_id, home_team_id AS team_id, stage FROM matches
    UNION ALL
    SELECT tournament_id, away_team_id AS team_id, stage FROM matches
)
SELECT
    tsm.tournament_id,
    tr.year AS tournament_year,
    tsm.team_id,
    t.name AS team_name,
    MAX(sr.rnk) AS furthest_stage_rank,
    (ARRAY_AGG(tsm.stage ORDER BY sr.rnk DESC))[1] AS furthest_stage
FROM team_stage_matches tsm
JOIN stage_rank sr ON sr.stage = tsm.stage
JOIN tournaments tr ON tr.tournament_id = tsm.tournament_id
JOIN teams t ON t.team_id = tsm.team_id
GROUP BY tsm.tournament_id, tr.year, tsm.team_id, t.name;
