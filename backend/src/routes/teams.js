import { Router } from "express";
import { query } from "../db.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { confederation, year } = req.query;
    const conditions = [];
    const params = [];

    let sql = `
      SELECT DISTINCT t.team_id, t.name, t.iso_code, c.code AS confederation
      FROM teams t
      LEFT JOIN confederations c ON c.confederation_id = t.confederation_id
    `;

    if (year) {
      sql += `
        JOIN tournament_group_teams tgt ON tgt.team_id = t.team_id
        JOIN tournament_groups tg ON tg.group_id = tgt.group_id
        JOIN tournaments tr ON tr.tournament_id = tg.tournament_id
      `;
      params.push(year);
      conditions.push(`tr.year = $${params.length}`);
    }
    if (confederation) {
      params.push(confederation);
      conditions.push(`c.code = $${params.length}`);
    }
    if (conditions.length) sql += ` WHERE ${conditions.join(" AND ")}`;
    sql += " ORDER BY t.name";

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT t.team_id, t.name, t.iso_code, c.code AS confederation
       FROM teams t LEFT JOIN confederations c ON c.confederation_id = t.confederation_id
       WHERE t.team_id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Team not found" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
