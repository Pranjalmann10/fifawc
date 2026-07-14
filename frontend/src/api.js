const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function get(path, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, v);
  });
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await fetch(`${BASE_URL}${path}${suffix}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  health: () => get("/health"),
  tournaments: () => get("/tournaments"),
  tournament: (year) => get(`/tournaments/${year}`),
  teams: (params) => get("/teams", params),
  matches: (params) => get("/matches", params),
  standings: (year) => get(`/standings/${year}`),
  topScorers: (params) => get("/top-scorers", params),
  form: (teamId, params) => get(`/form/${teamId}`, params),
  headToHead: (teamA, teamB) => get("/head-to-head", { teamA, teamB }),
  progression: (year) => get(`/progression/${year}`),
};
