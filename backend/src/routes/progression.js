import { Router } from "express";
import { query } from "../db.js";

const router = Router();

router.get("/:year", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT team_name, furthest_stage, furthest_stage_rank
       FROM tournament_progression
       WHERE tournament_year = $1
       ORDER BY furthest_stage_rank DESC, team_name`,
      [req.params.year]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
