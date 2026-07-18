import { useState } from "react";
import { useApi } from "../useApi.js";
import { api } from "../api.js";
import TeamBadge from "../TeamBadge.jsx";

export default function HeadToHead() {
  const { data: teams } = useApi(() => api.teams(), []);
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");

  const { data, error, loading } = useApi(
    () => (teamA && teamB && teamA !== teamB ? api.headToHead(teamA, teamB) : Promise.resolve(null)),
    [teamA, teamB]
  );

  return (
    <div>
      <h2>Head-to-Head</h2>
      <div className="filters">
        <select value={teamA} onChange={(e) => setTeamA(e.target.value)}>
          <option value="">Team A&hellip;</option>
          {teams && teams.map((t) => <option key={t.team_id} value={t.name}>{t.name}</option>)}
        </select>
        <span className="vs">vs</span>
        <select value={teamB} onChange={(e) => setTeamB(e.target.value)}>
          <option value="">Team B&hellip;</option>
          {teams && teams.map((t) => <option key={t.team_id} value={t.name}>{t.name}</option>)}
        </select>
      </div>

      {loading && <p className="status">Loading&hellip;</p>}
      {error && <p className="status error">Error: {error}</p>}

      {data && (
        <>
          <div className="h2h-summary">
            <div className="h2h-stat"><span className="big">{data.summary.team_a_wins}</span><span>{data.team_a} wins</span></div>
            <div className="h2h-stat"><span className="big">{data.summary.draws}</span><span>Draws</span></div>
            <div className="h2h-stat"><span className="big">{data.summary.team_b_wins}</span><span>{data.team_b} wins</span></div>
          </div>
          <p className="muted">
            {data.summary.matches_played} meeting{data.summary.matches_played !== 1 ? "s" : ""} in the dataset &middot;
            {" "}goals: {data.summary.team_a_goals}&ndash;{data.summary.team_b_goals}
          </p>

          <table className="data-table">
            <thead><tr><th>Year</th><th>Stage</th><th>Home</th><th>Score</th><th>Away</th></tr></thead>
            <tbody>
              {data.matches.map((m) => (
                <tr key={m.match_id}>
                  <td>{m.tournament_year}</td>
                  <td>{m.stage}</td>
                  <td className="team-cell"><TeamBadge name={m.home_team} />{m.home_team}</td>
                  <td className="score-cell">{m.home_score}&ndash;{m.away_score}</td>
                  <td className="team-cell"><TeamBadge name={m.away_team} />{m.away_team}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
