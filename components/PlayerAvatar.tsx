interface Props {
  name: string;
  size?: number;
}

// Deterministic background color from the name hash.
const PALETTE = [
  "#1f6feb", "#7c3aed", "#db2777", "#ea580c", "#f59e0b",
  "#16a34a", "#0891b2", "#4f46e5", "#9333ea", "#dc2626",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  // Korean name (2-3 hangul) → first char
  if (/[가-힯]/.test(trimmed)) return trimmed[0];
  // Latin: take first letter of first 2 words
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PlayerAvatar({ name, size = 40 }: Props) {
  const bg = PALETTE[hash(name) % PALETTE.length];
  const fontSize = Math.round(size * 0.42);
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white select-none"
      style={{ width: size, height: size, backgroundColor: bg, fontSize }}
    >
      {initials(name)}
    </span>
  );
}
