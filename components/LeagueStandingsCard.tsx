import Link from "next/link";
import { TeamBadge } from "./TeamBadge";
import { computeTitleRace } from "@/lib/leagueTitleRace";
import { LEAGUE_LOGOS } from "@/lib/leagueLogos";
import type { Standings, LeagueCode } from "@/lib/dataSource/types";

interface Props {
  standings: Standings;
  topN?: number;
  /** When true, the header (league name + season) is suppressed because the parent renders it. */
  hideHeader?: boolean;
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

export function LeagueStandingsCard({ standings, topN = 6, hideHeader = false }: Props) {
  const title = nameByCode[standings.leagueCode] ?? standings.leagueCode;
  const race = computeTitleRace(standings);
  const totalTeams = standings.rows.length;

  let raceBadge: { label: string; tone: string } | null = null;
  if (race.leader.kind === "clinched") raceBadge = { label: "🏆 우승 확정", tone: "text-[var(--color-gold)]" };
  else if (race.leader.kind === "magic") raceBadge = { label: `🏆 매직 ${race.leader.magicNumber}`, tone: "text-[var(--color-gold)]" };

  return (
    <div className="kickoff-card p-4 min-w-[220px]">
      {!hideHeader && (
        <>
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {LEAGUE_LOGOS[standings.leagueCode] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={LEAGUE_LOGOS[standings.leagueCode]}
                  alt=""
                  className="w-7 h-7 object-contain shrink-0 bg-white rounded p-0.5"
                  loading="lazy"
                />
              )}
              <h3 className="font-extrabold text-lg tracking-tight truncate">{title}</h3>
            </div>
            <span className="text-[10px] uppercase text-[var(--color-muted)] tracking-widest shrink-0">{standings.season}</span>
          </div>
          {raceBadge ? (
            <p className={`text-[11px] font-bold mb-3 ${raceBadge.tone}`}>{raceBadge.label}</p>
          ) : (
            <div className="mb-3" />
          )}
        </>
      )}
      <ol className="space-y-1.5">
        {standings.rows.slice(0, topN).map((r) => (
          <li key={r.team.id} className="flex items-center gap-2 text-sm group/row">
            <span className={`w-6 tabular-nums font-extrabold ${positionAccent(r.position, totalTeams)}`}>{r.position}</span>
            <Link
              href={`/team/${r.team.id}`}
              className="flex-1 min-w-0 hover:text-[var(--color-accent)] transition-colors"
            >
              <TeamBadge team={r.team} size={20} />
            </Link>
            <span className="ml-auto tabular-nums font-mono text-[var(--color-text)] font-bold">{r.points}</span>
          </li>
        ))}
      </ol>
      {!hideHeader && totalTeams > topN && (
        <Link
          href={`/competition/${standings.leagueCode}`}
          className="block mt-3 text-center text-xs font-bold py-2 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)]/60 hover:text-[var(--color-accent)] transition-colors"
        >
          전체 순위 보기 ({totalTeams}팀) ↗
        </Link>
      )}
    </div>
  );
}
