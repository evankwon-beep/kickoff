import Link from "next/link";
import { TeamBadge } from "./TeamBadge";
import { formatKST } from "@/lib/time";
import type { Fixture } from "@/lib/dataSource/types";

interface Props {
  fixture: Fixture;
}

export function MatchRow({ fixture }: Props) {
  const isFinished = fixture.status === "FINISHED";
  return (
    <div className="grid grid-cols-[170px_1fr_64px_1fr_auto] items-center gap-3 py-3 border-b border-[var(--color-border)] last:border-b-0 text-sm hover:bg-[var(--color-surface-2)]/40 -mx-2 px-2 rounded transition-colors">
      <span className="text-[var(--color-muted)] tabular-nums whitespace-nowrap text-xs">
        {formatKST(fixture.utcKickoff, { withWeekday: true })}
      </span>
      <Link href={`/team/${fixture.home.id}`} className="flex items-center justify-end gap-2 min-w-0 hover:text-[var(--color-accent)] transition-colors">
        <TeamBadge team={fixture.home} size={22} />
      </Link>
      <div className="text-center font-mono">
        {isFinished ? (
          <span className="text-base font-bold tabular-nums">
            <span>{fixture.score.home}</span>
            <span className="mx-1 text-[var(--color-muted)]">:</span>
            <span>{fixture.score.away}</span>
          </span>
        ) : (
          <span className="text-[var(--color-muted)] text-xs font-semibold tracking-widest">VS</span>
        )}
      </div>
      <Link href={`/team/${fixture.away.id}`} className="flex items-center gap-2 min-w-0 hover:text-[var(--color-accent)] transition-colors">
        <TeamBadge team={fixture.away} size={22} />
      </Link>
      <div className="flex items-center gap-2">
        {fixture.hasKoreanPlayer && (
          <span
            aria-label="한국 선수 출전"
            title="한국 선수 출전"
            className="text-[var(--color-korean)] text-base"
          >
            🇰🇷
          </span>
        )}
        {fixture.highlightYoutubeId && (
          <Link
            href={`https://www.youtube.com/watch?v=${fixture.highlightYoutubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent)] hover:text-[var(--color-gold)] hover:underline whitespace-nowrap text-xs font-semibold"
          >
            ▶ 하이라이트
          </Link>
        )}
      </div>
    </div>
  );
}
