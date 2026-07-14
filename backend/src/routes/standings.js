import { Router } from "express";
import { query } from "../db.js";

const router = Router();

// Group-stage standings table for a tournament year
router.get("/:year", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT group_name, team_name, played, won, drawn, lost,
              goals_for, goals_against, goal_diff, points, group_rank
       FROM group_standings
       WHERE tournament_year = $1
       ORDER BY group_name, group_rank`,
      [req.params.year]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
