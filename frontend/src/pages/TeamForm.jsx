import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useApi } from "../useApi.js";
import { api } from "../api.js";

export default function TeamForm() {
  const [teamId, setTeamId] = useState("");
  const { data: teams } = useApi(() => api.teams(), []);
  const { data: form, error, loading } = useApi(
    () => (teamId ? api.form(teamId, { limit: 15 }) : Promise.resolve(null)),
    [teamId]
  );

  return (
    <div>
      <h2>Team Form Trends</h2>
      <p className="muted">Rolling points &amp; goals over a trailing 5-match window (SQL window functions).</p>
      <div className="filters">
        <select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
          <option value="">Select a team&hellip;</option>
          {teams && teams.map((t) => <option key={t.team_id} value={t.team_id}>{t.name}</option>)}
        </select>
      </div>

      {loading && <p className="status">Loading&hellip;</p>}
      {error && <p className="status error">Error: {error}</p>}

      {form && form.length === 0 && <p className="status">No match data for this team in the dataset.</p>}

      {form && form.length > 0 && (
        <>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={form}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
                <XAxis dataKey="match_seq" stroke="#9aa4b2" label={{ value: "Match #", position: "insideBottom", offset: -5, fill: "#9aa4b2" }} />
                <YAxis stroke="#9aa4b2" />
                <Tooltip contentStyle={{ background: "#1a1e27", border: "1px solid #2a2f3a" }} />
                <Line type="monotone" dataKey="points_last_5" stroke="#4fd1c5" strokeWidth={2} name="Points (last 5)" dot />
                <Line type="monotone" dataKey="avg_goals_for_last_5" stroke="#f6ad55" strokeWidth={2} name="Avg goals for (last 5)" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <table className="data-table">
            <thead>
              <tr><th>Year</th><th>Stage</th><th>Result</th><th>Score</th><th>Pts (last 5)</th></tr>
            </thead>
            <tbody>
              {form.map((f) => (
                <tr key={f.match_id}>
                  <td>{f.tournament_year}</td>
                  <td>{f.stage}</td>
                  <td><span className={`badge ${f.result.toLowerCase()}`}>{f.result}</span></td>
                  <td>{f.goals_for}&ndash;{f.goals_against}</td>
                  <td>{f.points_last_5}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
