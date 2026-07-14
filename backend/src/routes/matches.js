import { Router } from "express";
import { query } from "../db.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { year, team, stage, confederation } = req.query;
    const conditions = [];
    const params = [];

    let sql = `
      SELECT m.match_id, tr.year AS tournament_year, m.stage, tg.group_name, m.match_date, m.venue,
             ht.name AS home_team, at.name AS away_team,
             m.home_score, m.away_score, m.home_penalties, m.away_penalties,
             m.went_to_extra_time, m.went_to_penalties
      FROM matches m
      JOIN tournaments tr ON tr.tournament_id = m.tournament_id
      JOIN teams ht ON ht.team_id = m.home_team_id
      JOIN teams at ON at.team_id = m.away_team_id
      LEFT JOIN tournament_groups tg ON tg.group_id = m.group_id
      LEFT JOIN confederations hc ON hc.confederation_id = ht.confederation_id
      LEFT JOIN confederations ac ON ac.confederation_id = at.confederation_id
    `;

    if (year) {
      params.push(year);
      conditions.push(`tr.year = $${params.length}`);
    }
    if (stage) {
      params.push(stage);
      conditions.push(`m.stage = $${params.length}`);
    }
    if (team) {
      params.push(`%${team}%`);
      conditions.push(`(ht.name ILIKE $${params.length} OR at.name ILIKE $${params.length})`);
    }
    if (confederation) {
      params.push(confederation);
      conditions.push(`(hc.code = $${params.length} OR ac.code = $${params.length})`);
    }
    if (conditions.length) sql += ` WHERE ${conditions.join(" AND ")}`;
    sql += " ORDER BY m.match_date, m.match_id";

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
