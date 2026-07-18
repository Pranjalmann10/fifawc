import { NavLink, Route, Routes } from "react-router-dom";
import Overview from "./pages/Overview.jsx";
import MatchExplorer from "./pages/MatchExplorer.jsx";
import TopScorers from "./pages/TopScorers.jsx";
import Standings from "./pages/Standings.jsx";
import TeamForm from "./pages/TeamForm.jsx";
import HeadToHead from "./pages/HeadToHead.jsx";
import { useTheme } from "./useTheme.jsx";

const links = [
  { to: "/", label: "Overview", end: true, icon: "🏠" },
  { to: "/matches", label: "Match Explorer", icon: "🗓️" },
  { to: "/standings", label: "Group Standings", icon: "📊" },
  { to: "/top-scorers", label: "Top Scorers", icon: "🥇" },
  { to: "/form", label: "Team Form", icon: "📈" },
  { to: "/head-to-head", label: "Head-to-Head", icon: "🤝" },
];

export default function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">⚽</span>
          <div>
            <h1>WC Analytics</h1>
            <p>2002&ndash;2022 historical data</p>
          </div>
        </div>

        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? "active" : "")}>
              <span className="icon">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="theme-toggle" onClick={toggleTheme}>
          {theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode"}
        </button>
      </aside>

      <div>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/matches" element={<MatchExplorer />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/top-scorers" element={<TopScorers />} />
            <Route path="/form" element={<TeamForm />} />
            <Route path="/head-to-head" element={<HeadToHead />} />
          </Routes>
        </main>

        <footer className="app-footer">
          Built by Pranjal Mann &mdash; data pipeline: Python ETL &rarr; PostgreSQL &rarr; Node/Express API &rarr; React
        </footer>
      </div>
    </div>
  );
}
