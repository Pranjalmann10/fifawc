import express from "express";
import cors from "cors";
import { pool } from "./db.js";

import tournamentsRouter from "./routes/tournaments.js";
import teamsRouter from "./routes/teams.js";
import matchesRouter from "./routes/matches.js";
import standingsRouter from "./routes/standings.js";
import topScorersRouter from "./routes/topScorers.js";
import formRouter from "./routes/form.js";
import headToHeadRouter from "./routes/headToHead.js";
import progressionRouter from "./routes/progression.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "disconnected", message: err.message });
  }
});

app.use("/api/tournaments", tournamentsRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/matches", matchesRouter);
app.use("/api/standings", standingsRouter);
app.use("/api/top-scorers", topScorersRouter);
app.use("/api/form", formRouter);
app.use("/api/head-to-head", headToHeadRouter);
app.use("/api/progression", progressionRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

export default app;
