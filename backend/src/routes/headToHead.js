import { Router } from "express";
import { query } from "../db.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { teamA, teamB } = req.query;
    if (!teamA || !teamB) {
      return res.status(400).json({ error: "teamA and teamB query params are required (team names)" });
    }
    const teamRes = await query(
      `SELECT team_id, name FROM teams WHERE name ILIKE $1 OR name ILIKE $2`,
      [teamA, teamB]
    );
    const a = teamRes.rows.find((r) => r.name.toLowerCase() === teamA.toLowerCase());
    const b = teamRes.rows.find((r) => r.name.toLowerCase() === teamB.toLowerCase());
    if (!a || !b) return res.status(404).json({ error: "One or both teams not found" });

    const { rows } = await query(
      `SELECT * FROM head_to_head WHERE team_a_id = LEAST($1::int,$2::int) AND team_b_id = GREATEST($1::int,$2::int)`,
      [a.team_id, b.team_id]
    );

    const matches = await query(
      `SELECT m.match_id, tr.year AS tournament_year, m.stage, m.match_date,
              ht.name AS home_team, at.name AS away_team, m.home_score, m.away_score
       FROM matches m
       JOIN tournaments tr ON tr.tournament_id = m.tournament_id
       JOIN teams ht ON ht.team_id = m.home_team_id
       JOIN teams at ON at.team_id = m.away_team_id
       WHERE (m.home_team_id = $1 AND m.away_team_id = $2)
          OR (m.home_team_id = $2 AND m.away_team_id = $1)
       ORDER BY m.match_date`,
      [a.team_id, b.team_id]
    );

    res.json({
      team_a: a.name,
      team_b: b.name,
      summary: rows[0] || {
        matches_played: 0, team_a_wins: 0, team_b_wins: 0, draws: 0, team_a_goals: 0, team_b_goals: 0,
      },
      matches: matches.rows,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
