import Link from "next/link";
import { MatchRow } from "./MatchRow";
import type { Fixture } from "@/lib/dataSource/types";

interface Props {
  fixtures: Fixture[];
}

export function EuropeanCompetitionPreview({ fixtures }: Props) {
  const upcoming = [...fixtures]
    .filter((f) => f.status !== "FINISHED" || true) // keep all; rely on default sort
    .sort((a, b) => a.utcKickoff.localeCompare(b.utcKickoff))
    .slice(0, 6);

  return (
    <section className="bg-gradient-to-br from-[var(--color-surface)] to-[#1a1530] rounded-xl p-4 border border-[var(--color-border)]">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-bold text-xl">🏆 유럽 대회 — 챔피언스리그</h2>
        <Link
          href="/competition/CL"
          className="text-sm text-[var(--color-accent)] hover:underline"
        >
          전체 보기 →
        </Link>
      </div>
      {upcoming.length === 0 ? (
        <p className="text-[var(--color-muted)] py-4">현재 진행 중인 챔스 경기가 없어요.</p>
      ) : (
        <div>{upcoming.map((f) => <MatchRow key={f.id} fixture={f} />)}</div>
      )}
    </section>
  );
}
