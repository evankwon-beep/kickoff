import Link from "next/link";
import { PlayerPhoto } from "./PlayerPhoto";
import {
  fetchAllLeagueAwards,
  type AwardEntry,
  type LeagueAwards,
} from "@/lib/leagueAwards";
import type { LeagueCode } from "@/lib/dataSource/types";
import { TOP4_LEAGUES } from "@/lib/dataSource/types";
import { koreanCountry } from "@/lib/i18n";
import { LEAGUE_LOGOS } from "@/lib/leagueLogos";

function AwardRow({ entry, rank }: { entry: AwardEntry; rank: number }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="w-5 text-center text-xs font-extrabold text-[var(--color-gold)]">
        {rank}
      </span>
      <PlayerPhoto name={entry.name} photoUrl={entry.photoUrl} size={32} />
      <Link
        href={`/team/${entry.teamId}`}
        className="min-w-0 flex-1 hover:text-[var(--color-accent)] transition-colors"
      >
        <p className="text-sm font-semibold leading-tight break-keep truncate">
          {entry.name}
        </p>
        <p className="text-[11px] text-[var(--color-muted)] flex items-center gap-1 mt-0.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={entry.crestUrl}
            alt=""
            className="w-3.5 h-3.5 object-contain shrink-0"
            loading="lazy"
          />
          <span className="truncate">
            {entry.teamName}
            {entry.nationality ? ` · ${koreanCountry(entry.nationality)}` : ""}
          </span>
        </p>
      </Link>
      <span className="text-xs font-bold text-[var(--color-gold)] whitespace-nowrap tabular-nums">
        {entry.value}
        {entry.unit}
      </span>
    </li>
  );
}

function SubSection({
  icon,
  title,
  entries,
}: {
  icon: string;
  title: string;
  entries: AwardEntry[];
}) {
  return (
    <div>
      <h4 className="text-xs font-bold text-[var(--color-muted)] mb-1.5 flex items-center gap-1">
        <span aria-hidden>{icon}</span>
        <span>{title}</span>
      </h4>
      {entries.length === 0 ? (
        <p className="text-[var(--color-muted)] text-xs py-1">데이터 준비 중.</p>
      ) : (
        <ol className="space-y-1.5">
          {entries.map((e, idx) => (
            <AwardRow key={`${e.teamId}-${e.name}-${idx}`} entry={e} rank={idx + 1} />
          ))}
        </ol>
      )}
    </div>
  );
}

function LeagueAwardCard({
  code,
  nameKr,
  awards,
}: {
  code: LeagueCode;
  nameKr: string;
  awards: LeagueAwards | undefined;
}) {
  return (
    <div className="kickoff-card p-4 space-y-3">
      <h3 className="font-extrabold text-base flex items-center gap-2">
        {LEAGUE_LOGOS[code] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={LEAGUE_LOGOS[code]}
            alt=""
            className="w-6 h-6 object-contain shrink-0 bg-white rounded p-0.5"
            loading="lazy"
          />
        )}
        <span>{nameKr} 시즌 어워드</span>
      </h3>
      <SubSection icon="⚽" title="득점왕" entries={awards?.scorers ?? []} />
      <SubSection icon="🎯" title="도움왕" entries={awards?.assists ?? []} />
      <SubSection
        icon="🛡️"
        title="수비왕 (실점 최저)"
        entries={awards?.defense ?? []}
      />
    </div>
  );
}

export async function LeagueAwardsSection() {
  const codes = TOP4_LEAGUES.map((l) => l.code);
  const result = await fetchAllLeagueAwards(codes, 3).catch(
    () => ({}) as Partial<Record<LeagueCode, LeagueAwards>>
  );

  return (
    <section>
      <h2 className="section-title text-xl mb-3">
        리그별 득점왕/도움왕/수비왕 TOP 3
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {TOP4_LEAGUES.map((l) => (
          <LeagueAwardCard
            key={l.code}
            code={l.code}
            nameKr={l.nameKr}
            awards={result[l.code]}
          />
        ))}
      </div>
    </section>
  );
}
