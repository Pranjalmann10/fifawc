import { useState } from "react";
import { useApi } from "../useApi.js";
import { api } from "../api.js";

const YEARS = [2018, 2022]; // full group-stage data available for these tournaments

export default function Standings() {
  const [year, setYear] = useState(2022);
  const { data: standings, error, loading } = useApi(() => api.standings(year), [year]);

  const grouped = {};
  if (standings) {
    for (const row of standings) {
      grouped[row.group_name] = grouped[row.group_name] || [];
      grouped[row.group_name].push(row);
    }
  }

  return (
    <div>
      <h2>Group-Stage Standings</h2>
      <div className="filters">
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <p className="muted">Full group-by-group match data is seeded for 2018 and 2022.</p>

      {loading && <p className="status">Loading&hellip;</p>}
      {error && <p className="status error">Error: {error}</p>}

      <div className="grid">
        {Object.entries(grouped).sort().map(([groupName, rows]) => (
          <div className="card" key={groupName}>
            <h3>Group {groupName}</h3>
            <table className="mini-table">
              <thead>
                <tr><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.team_name} className={r.group_rank <= 2 ? "advances" : ""}>
                    <td>{r.team_name}</td>
                    <td>{r.played}</td>
                    <td>{r.won}</td>
                    <td>{r.drawn}</td>
                    <td>{r.lost}</td>
                    <td>{r.goal_diff}</td>
                    <td><strong>{r.points}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
