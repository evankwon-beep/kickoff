import Link from "next/link";
import { TeamBadge } from "./TeamBadge";
import { formatKST } from "@/lib/time";
import type { Fixture } from "@/lib/dataSource/types";

interface Props {
  fixture: Fixture;
}

export function MatchRow({ fixture }: Props) {
  const isFinished = fixture.status === "FINISHED";
  const timeText = formatKST(fixture.utcKickoff, { withWeekday: true });

  const scoreEl = isFinished ? (
    <span className="inline-flex items-baseline gap-1 px-2.5 py-1 rounded-md bg-[var(--color-bg)]/60 border border-[var(--color-border)] shrink-0">
      <span className="text-base font-extrabold tabular-nums font-mono">{fixture.score.home}</span>
      <span className="text-xs text-[var(--color-muted)]">:</span>
      <span className="text-base font-extrabold tabular-nums font-mono">{fixture.score.away}</span>
    </span>
  ) : (
    <span className="text-[var(--color-muted)] text-[11px] font-bold tracking-[0.2em] shrink-0 px-1">VS</span>
  );

  const extrasEl = (
    <>
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
    </>
  );

  return (
    <div className="py-3 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-2)]/40 -mx-2 px-2 rounded transition-colors">
      {/* Mobile: 2-line card (시간 위, 팀+스코어 아래) */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-[var(--color-muted)] tabular-nums whitespace-nowrap font-semibold">
            {timeText}
          </span>
          <div className="flex items-center gap-2">{extrasEl}</div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/team/${fixture.home.id}`}
            className="flex-1 min-w-0 hover:text-[var(--color-accent)] transition-colors"
          >
            <TeamBadge team={fixture.home} size={24} />
          </Link>
          {scoreEl}
          <Link
            href={`/team/${fixture.away.id}`}
            className="flex-1 min-w-0 hover:text-[var(--color-accent)] transition-colors flex justify-end"
          >
            <span className="flex-row-reverse flex">
              <TeamBadge team={fixture.away} size={24} />
            </span>
          </Link>
        </div>
      </div>

      {/* Desktop: single-row grid */}
      <div className="hidden sm:grid grid-cols-[170px_1fr_64px_1fr_auto] items-center gap-3 text-sm">
        <span className="text-[var(--color-muted)] tabular-nums whitespace-nowrap text-xs">
          {timeText}
        </span>
        <Link
          href={`/team/${fixture.home.id}`}
          className="flex items-center justify-end gap-2 min-w-0 hover:text-[var(--color-accent)] transition-colors"
        >
          <TeamBadge team={fixture.home} size={22} />
        </Link>
        <div className="text-center">{scoreEl}</div>
        <Link
          href={`/team/${fixture.away.id}`}
          className="flex items-center gap-2 min-w-0 hover:text-[var(--color-accent)] transition-colors"
        >
          <TeamBadge team={fixture.away} size={22} />
        </Link>
        <div className="flex items-center gap-2">{extrasEl}</div>
      </div>
    </div>
  );
}
