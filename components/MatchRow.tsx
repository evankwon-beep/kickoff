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
    <div className="grid grid-cols-[170px_1fr_60px_1fr_auto] items-center gap-3 py-3 border-b border-[var(--color-border)] text-sm">
      <span className="text-[var(--color-muted)] tabular-nums whitespace-nowrap">{formatKST(fixture.utcKickoff, { withWeekday: true })}</span>
      <div className="flex items-center justify-end gap-2 min-w-0">
        <TeamBadge team={fixture.home} />
      </div>
      <div className="text-center font-mono">
        {isFinished ? (
          <span>
            <span>{fixture.score.home}</span> - <span>{fixture.score.away}</span>
          </span>
        ) : (
          <span className="text-[var(--color-muted)]">VS</span>
        )}
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <TeamBadge team={fixture.away} />
      </div>
      <div className="flex items-center gap-2">
        {fixture.hasKoreanPlayer && (
          <span aria-label="한국 선수 출전" title="한국 선수 출전" className="text-[var(--color-korean)]">🇰🇷</span>
        )}
        {fixture.highlightYoutubeId && (
          <Link
            href={`https://www.youtube.com/watch?v=${fixture.highlightYoutubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent)] hover:underline whitespace-nowrap"
          >
            ▶ 하이라이트
          </Link>
        )}
      </div>
    </div>
  );
}
