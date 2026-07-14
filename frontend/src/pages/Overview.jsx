import { useApi } from "../useApi.js";
import { api } from "../api.js";
import { Link } from "react-router-dom";

export default function Overview() {
  const { data: tournaments, error, loading } = useApi(() => api.tournaments(), []);

  if (loading) return <p className="status">Loading tournaments&hellip;</p>;
  if (error) return <p className="status error">Error: {error}</p>;

  return (
    <div>
      <section className="hero-card">
        <h2>Historical World Cup Explorer</h2>
        <p>
          Normalized PostgreSQL data model covering every World Cup from 2002&ndash;2022, plus 2026
          tournament metadata. Explore match results, group standings, top scorers, rolling team form,
          and head-to-head records.
        </p>
        <div className="hero-links">
          <Link to="/matches" className="btn">Browse Matches</Link>
          <Link to="/standings" className="btn secondary">View Standings</Link>
        </div>
      </section>

      <div className="grid">
        {tournaments.map((t) => (
          <div className="card" key={t.tournament_id}>
            <h3>{t.year}</h3>
            <p className="muted">{t.host_country}</p>
            {t.winner ? (
              <>
                <p><strong>Winner:</strong> {t.winner}</p>
                <p><strong>Runner-up:</strong> {t.runner_up}</p>
                <p><strong>Golden Boot:</strong> {t.golden_boot_player} ({t.golden_boot_goals})</p>
              </>
            ) : (
              <p className="muted">Tournament upcoming / in progress</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
