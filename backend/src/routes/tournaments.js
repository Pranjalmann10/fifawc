import { Router } from "express";
import { query } from "../db.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT tr.tournament_id, tr.year, tr.host_country, tr.format, tr.num_teams,
             w.name AS winner, ru.name AS runner_up, tp.name AS third_place, fp.name AS fourth_place,
             tr.golden_boot_player, tr.golden_boot_goals, tr.start_date, tr.end_date
      FROM tournaments tr
      LEFT JOIN teams w ON w.team_id = tr.winner_team_id
      LEFT JOIN teams ru ON ru.team_id = tr.runner_up_team_id
      LEFT JOIN teams tp ON tp.team_id = tr.third_place_team_id
      LEFT JOIN teams fp ON fp.team_id = tr.fourth_place_team_id
      ORDER BY tr.year
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/:year", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT tr.tournament_id, tr.year, tr.host_country, tr.format, tr.num_teams,
              w.name AS winner, ru.name AS runner_up, tp.name AS third_place, fp.name AS fourth_place,
              tr.golden_boot_player, tr.golden_boot_goals, tr.start_date, tr.end_date
       FROM tournaments tr
       LEFT JOIN teams w ON w.team_id = tr.winner_team_id
       LEFT JOIN teams ru ON ru.team_id = tr.runner_up_team_id
       LEFT JOIN teams tp ON tp.team_id = tr.third_place_team_id
       LEFT JOIN teams fp ON fp.team_id = tr.fourth_place_team_id
       WHERE tr.year = $1`,
      [req.params.year]
    );
    if (!rows.length) return res.status(404).json({ error: "Tournament not found" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
