import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useApi } from "../useApi.js";
import { api } from "../api.js";
import TeamBadge from "../TeamBadge.jsx";

const YEARS = [2002, 2006, 2010, 2014, 2018, 2022];

export default function TopScorers() {
  const [year, setYear] = useState("");
  const { data: scorers, error, loading } = useApi(() => api.topScorers({ year, limit: 50 }), [year]);

  const chartData = (scorers || [])
    .slice(0, 10)
    .map((s) => ({ name: `${s.full_name} (${s.tournament_year})`, goals: s.goals }));

  return (
    <div>
      <h2>Top Scorers</h2>
      <div className="filters">
        <select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">All tournaments</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading && <p className="status">Loading&hellip;</p>}
      {error && <p className="status error">Error: {error}</p>}

      {scorers && scorers.length > 0 && (
        <div className="chart-card">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--text-dim)" />
              <YAxis type="category" dataKey="name" width={180} stroke="var(--text-dim)" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="goals" fill="#2e7d32" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {scorers && (
        <table className="data-table">
          <thead>
            <tr><th>Player</th><th>Team</th><th>Year</th><th>Goals</th><th>Golden Boot</th></tr>
          </thead>
          <tbody>
            {scorers.map((s) => (
              <tr key={`${s.player_id}-${s.tournament_year}`}>
                <td>{s.full_name}</td>
                <td className="team-cell"><TeamBadge name={s.team_name} size={18} />{s.team_name}</td>
                <td>{s.tournament_year}</td>
                <td>{s.goals}</td>
                <td>{s.is_golden_boot ? "🥇" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
