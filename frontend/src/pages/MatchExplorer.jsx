import { useState } from "react";
import { useApi } from "../useApi.js";
import { api } from "../api.js";
import TeamBadge from "../TeamBadge.jsx";

const YEARS = [2002, 2006, 2010, 2014, 2018, 2022];
const STAGES = ["Group", "Round of 16", "Quarter-final", "Semi-final", "Third place", "Final"];
const CONFEDERATIONS = ["UEFA", "CONMEBOL", "CONCACAF", "CAF", "AFC", "OFC"];

export default function MatchExplorer() {
  const [year, setYear] = useState("");
  const [stage, setStage] = useState("");
  const [team, setTeam] = useState("");
  const [confederation, setConfederation] = useState("");

  const { data: matches, error, loading } = useApi(
    () => api.matches({ year, stage, team, confederation }),
    [year, stage, team, confederation]
  );

  return (
    <div>
      <h2>Match Explorer</h2>
      <div className="filters">
        <select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">All years</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="">All stages</option>
          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={confederation} onChange={(e) => setConfederation(e.target.value)}>
          <option value="">All confederations</option>
          {CONFEDERATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          placeholder="Search team..."
          value={team}
          onChange={(e) => setTeam(e.target.value)}
        />
      </div>

      {loading && <p className="status">Loading&hellip;</p>}
      {error && <p className="status error">Error: {error}</p>}
      {matches && (
        <>
          <p className="muted">{matches.length} match{matches.length !== 1 ? "es" : ""}</p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Year</th><th>Stage</th><th>Home</th><th></th><th>Away</th><th>Result</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.match_id}>
                  <td>{m.tournament_year}</td>
                  <td>{m.group_name ? `Group ${m.group_name}` : m.stage}</td>
                  <td className="team-cell"><TeamBadge name={m.home_team} />{m.home_team}</td>
                  <td className="score-cell">
                    {m.home_score}&ndash;{m.away_score}
                    {m.went_to_penalties ? ` (pens ${m.home_penalties}-${m.away_penalties})` : m.went_to_extra_time ? " (aet)" : ""}
                  </td>
                  <td className="team-cell"><TeamBadge name={m.away_team} />{m.away_team}</td>
                  <td className="muted">{m.venue || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
