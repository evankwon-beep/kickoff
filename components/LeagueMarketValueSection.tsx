import Link from "next/link";
import { PlayerPhoto } from "./PlayerPhoto";
import { topAllLeaguesByValue, type LeagueStarPlayer } from "@/lib/leagueStars";
import type { LeagueCode } from "@/lib/dataSource/types";
import { TOP4_LEAGUES } from "@/lib/dataSource/types";
import { koreanCountry } from "@/lib/i18n";
import { LEAGUE_LOGOS } from "@/lib/leagueLogos";

function fmt(billionWon: number): string {
  if (billionWon >= 10_000) return `${(billionWon / 10_000).toFixed(1)}조`;
  return `${billionWon.toLocaleString("ko-KR")}억`;
}

function StarRow({ p, rank }: { p: LeagueStarPlayer; rank: number }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="w-5 text-center text-xs font-extrabold text-[var(--color-gold)]">
        {rank}
      </span>
      <PlayerPhoto name={p.name} photoUrl={p.photoUrl} size={36} />
      <Link
        href={`/team/${p.teamId}`}
        className="min-w-0 flex-1 hover:text-[var(--color-accent)] transition-colors"
      >
        <p className="text-sm font-semibold leading-tight break-keep">{p.name}</p>
        <p className="text-[11px] text-[var(--color-muted)] flex items-center gap-1 mt-0.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.crestUrl}
            alt=""
            className="w-3.5 h-3.5 object-contain shrink-0"
            loading="lazy"
          />
          <span className="truncate">
            {p.teamName}
            {p.nationality ? ` · ${koreanCountry(p.nationality)}` : ""}
          </span>
        </p>
      </Link>
      <span className="text-xs font-bold text-[var(--color-gold)] whitespace-nowrap tabular-nums">
        {fmt(p.valueBillionWon)}
      </span>
    </li>
  );
}

function LeagueCard({
  code,
  nameKr,
  stars,
}: {
  code: LeagueCode;
  nameKr: string;
  stars: LeagueStarPlayer[];
}) {
  return (
    <div className="kickoff-card p-4">
      <h3 className="font-extrabold text-base mb-3 flex items-center gap-2">
        {LEAGUE_LOGOS[code] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={LEAGUE_LOGOS[code]}
            alt=""
            className="w-6 h-6 object-contain shrink-0 bg-white rounded p-0.5"
            loading="lazy"
          />
        )}
        <span>{nameKr} 몸값 TOP 5</span>
      </h3>
      {stars.length === 0 ? (
        <p className="text-[var(--color-muted)] text-sm py-3">데이터 준비 중.</p>
      ) : (
        <ol className="space-y-2">
          {stars.map((p, idx) => (
            <StarRow key={`${p.name}-${idx}`} p={p} rank={idx + 1} />
          ))}
        </ol>
      )}
    </div>
  );
}

export async function LeagueMarketValueSection() {
  // standings 무관: 매핑 JSON의 시장가치만 기준으로 리그별 top 5
  const result = await topAllLeaguesByValue(5).catch(
    () => ({} as Partial<Record<LeagueCode, LeagueStarPlayer[]>>)
  );

  return (
    <section>
      <h2 className="section-title text-xl mb-3">리그별 몸값 TOP 5</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {TOP4_LEAGUES.map((l) => (
          <LeagueCard
            key={l.code}
            code={l.code}
            nameKr={l.nameKr}
            stars={(result as Partial<Record<LeagueCode, LeagueStarPlayer[]>>)[l.code] ?? []}
          />
        ))}
      </div>
    </section>
  );
}
