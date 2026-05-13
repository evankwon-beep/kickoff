import Link from "next/link";
import { MatchRow } from "./MatchRow";
import type { Fixture } from "@/lib/dataSource/types";

interface Props {
  fixtures: Fixture[];
}

export function EuropeanCompetitionPreview({ fixtures }: Props) {
  const upcoming = [...fixtures]
    .sort((a, b) => a.utcKickoff.localeCompare(b.utcKickoff))
    .slice(0, 6);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] p-5 bg-gradient-to-br from-[#1a1530] via-[var(--color-surface)] to-[var(--color-surface)]">
      <div aria-hidden className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[var(--color-gold)]/10 blur-2xl pointer-events-none" />
      <div className="relative flex items-baseline justify-between mb-3">
        <h2 className="section-title text-xl">⭐ 유럽 대회 — 챔피언스리그</h2>
        <Link href="/competition/CL" className="text-sm font-semibold text-[var(--color-accent)] hover:text-[var(--color-gold)] transition-colors">
          전체 보기 →
        </Link>
      </div>
      {upcoming.length === 0 ? (
        <p className="text-[var(--color-muted)] py-4">현재 진행 중인 챔스 경기가 없어요.</p>
      ) : (
        <div className="relative">{upcoming.map((f) => <MatchRow key={f.id} fixture={f} />)}</div>
      )}
    </section>
  );
}
