const PALETTE = ["#2E7D32", "#1A237E", "#D32F2F", "#B8860B", "#00695C", "#4527A0", "#AD1457", "#00838F"];

function hashHue(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name) {
  if (!name) return "?";
  const parts = name.replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function TeamBadge({ name, size = 22 }) {
  return (
    <span
      className="team-badge"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: hashHue(name || ""),
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
