import { NavLink, Route, Routes } from "react-router-dom";
import Overview from "./pages/Overview.jsx";
import MatchExplorer from "./pages/MatchExplorer.jsx";
import TopScorers from "./pages/TopScorers.jsx";
import Standings from "./pages/Standings.jsx";
import TeamForm from "./pages/TeamForm.jsx";
import HeadToHead from "./pages/HeadToHead.jsx";

const links = [
  { to: "/", label: "Overview", end: true },
  { to: "/matches", label: "Match Explorer" },
  { to: "/standings", label: "Group Standings" },
  { to: "/top-scorers", label: "Top Scorers" },
  { to: "/form", label: "Team Form" },
  { to: "/head-to-head", label: "Head-to-Head" },
];

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">⚽</span>
          <div>
            <h1>FIFA World Cup Analytics</h1>
            <p>2002 &ndash; 2022 historical data, PostgreSQL + React</p>
          </div>
        </div>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? "active" : "")}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>

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
  );
}
