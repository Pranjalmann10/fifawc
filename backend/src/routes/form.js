import { Router } from "express";
import { query } from "../db.js";

const router = Router();

// Rolling form (last-5-match window) for a team, most recent matches
router.get("/:teamId", async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const { rows } = await query(
      `SELECT match_id, team_id, team_name, tournament_year, match_date, stage, result,
              goals_for, goals_against, match_points, points_last_5,
              avg_goals_for_last_5, avg_goals_against_last_5, match_seq
       FROM team_rolling_form
       WHERE team_id = $1
       ORDER BY match_date DESC
       LIMIT $2`,
      [req.params.teamId, Number(limit)]
    );
    res.json(rows.reverse());
  } catch (err) {
    next(err);
  }
});

export default router;
