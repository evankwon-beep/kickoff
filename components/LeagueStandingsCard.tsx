import Link from "next/link";
import { TeamBadge } from "./TeamBadge";
import { computeTitleRace } from "@/lib/leagueTitleRace";
import type { Standings, LeagueCode } from "@/lib/dataSource/types";

interface Props {
  standings: Standings;
  topN?: number;
}

const nameByCode: Record<LeagueCode, string> = {
  PL: "EPL",
  PD: "라리가",
  BL1: "분데스리가",
  SA: "세리에A",
  CL: "챔피언스리그",
  FA: "FA컵",
  WC: "월드컵",
  EC: "유로",
};

function positionAccent(position: number, totalTeams: number): string {
  if (position === 1) return "text-[var(--color-gold)]";
  if (position >= 2 && position <= 4) return "text-[var(--color-accent)]";
  if (position > totalTeams - 3) return "text-[var(--color-korean)]";
  return "text-[var(--color-muted)]";
}

export function LeagueStandingsCard({ standings, topN = 6 }: Props) {
  const title = nameByCode[standings.leagueCode] ?? standings.leagueCode;
  const race = computeTitleRace(standings);
  const totalTeams = standings.rows.length;

  let raceBadge: { label: string; tone: string } | null = null;
  if (race.leader.kind === "clinched") raceBadge = { label: "🏆 우승 확정", tone: "text-[var(--color-gold)]" };
  else if (race.leader.kind === "magic") raceBadge = { label: `🏆 매직 ${race.leader.magicNumber}`, tone: "text-[var(--color-gold)]" };

  return (
    <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] min-w-[220px] hover:border-[var(--color-accent)]/40 transition-colors">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="font-bold text-base">{title}</h3>
        <span className="text-xs text-[var(--color-muted)]">{standings.season}</span>
      </div>
      {raceBadge && <p className={`text-xs font-semibold mb-3 ${raceBadge.tone}`}>{raceBadge.label}</p>}
      {!raceBadge && <div className="mb-3" />}
      <ol className="space-y-2">
        {standings.rows.slice(0, topN).map((r) => (
          <li key={r.team.id} className="flex items-center gap-2 text-sm group">
            <span className={`w-5 tabular-nums font-semibold ${positionAccent(r.position, totalTeams)}`}>{r.position}</span>
            <Link
              href={`/team/${r.team.id}`}
              className="flex-1 min-w-0 hover:text-[var(--color-accent)] transition-colors"
            >
              <TeamBadge team={r.team} size={20} />
            </Link>
            <span className="ml-auto tabular-nums font-mono">{r.points}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
