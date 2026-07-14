import { Router } from "express";
import { query } from "../db.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { year, limit = 20 } = req.query;
    const params = [];
    let sql = `
      SELECT player_id, full_name, team_name, tournament_year, goals, is_golden_boot, tournament_rank
      FROM top_scorers_leaderboard
    `;
    if (year) {
      params.push(year);
      sql += ` WHERE tournament_year = $${params.length}`;
    }
    params.push(Number(limit));
    sql += ` ORDER BY tournament_year DESC, goals DESC LIMIT $${params.length}`;

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
