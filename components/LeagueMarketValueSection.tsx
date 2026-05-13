import Link from "next/link";
import { PlayerAvatar } from "./PlayerAvatar";
import { topByLeague } from "@/lib/leagueStars";
import type { LeagueCode } from "@/lib/dataSource/types";
import { TOP4_LEAGUES } from "@/lib/dataSource/types";

function fmt(billionWon: number): string {
  if (billionWon >= 10_000) return `${(billionWon / 10_000).toFixed(1)}조`;
  return `${billionWon.toLocaleString("ko-KR")}억`;
}

function LeagueCard({ code, nameKr }: { code: LeagueCode; nameKr: string }) {
  const stars = topByLeague(code, 5);
  return (
    <div className="kickoff-card p-4">
      <h3 className="font-extrabold text-base mb-3">💰 {nameKr} 몸값 TOP 5</h3>
      {stars.length === 0 ? (
        <p className="text-[var(--color-muted)] text-sm py-3">데이터 준비 중.</p>
      ) : (
        <ol className="space-y-2">
          {stars.map((p, idx) => (
            <li key={`${p.name}-${idx}`} className="flex items-center gap-2.5">
              <span className="w-5 text-center text-xs font-extrabold text-[var(--color-gold)]">
                {idx + 1}
              </span>
              <PlayerAvatar name={p.name} size={32} />
              <Link
                href={`/team/${p.teamId}`}
                className="min-w-0 flex-1 hover:text-[var(--color-accent)] transition-colors"
              >
                <p className="text-sm font-semibold truncate leading-tight">{p.name}</p>
                <p className="text-[11px] text-[var(--color-muted)] flex items-center gap-1 mt-0.5">
                  {/* 엠블럼은 일반 img (외부 도메인 등록은 next.config.ts에 이미 있음) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.crestUrl}
                    alt=""
                    className="w-3.5 h-3.5 object-contain"
                    loading="lazy"
                  />
                  <span className="truncate">{p.teamName}</span>
                </p>
              </Link>
              <span className="text-xs font-bold text-[var(--color-gold)] whitespace-nowrap tabular-nums">
                {fmt(p.valueBillionWon)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function LeagueMarketValueSection() {
  return (
    <section>
      <h2 className="section-title text-xl mb-3">리그별 몸값 TOP 5</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TOP4_LEAGUES.map((l) => (
          <LeagueCard key={l.code} code={l.code} nameKr={l.nameKr} />
        ))}
      </div>
    </section>
  );
}
