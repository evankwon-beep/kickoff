import { TeamBadge } from "./TeamBadge";
import type { Standings, LeagueCode } from "@/lib/dataSource/types";
import { TOP4_LEAGUES } from "@/lib/dataSource/types";

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

void TOP4_LEAGUES; // re-export side-effect import keeps source intact even if unused here

export function LeagueStandingsCard({ standings, topN = 6 }: Props) {
  const title = nameByCode[standings.leagueCode] ?? standings.leagueCode;
  return (
    <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] min-w-[220px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-base">{title}</h3>
        <span className="text-xs text-[var(--color-muted)]">{standings.season}</span>
      </div>
      <ol className="space-y-2">
        {standings.rows.slice(0, topN).map((r) => (
          <li key={r.team.id} className="flex items-center gap-2 text-sm">
            <span className="w-5 text-[var(--color-muted)] tabular-nums">{r.position}</span>
            <TeamBadge team={r.team} size={18} />
            <span className="ml-auto tabular-nums font-mono">{r.points}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
