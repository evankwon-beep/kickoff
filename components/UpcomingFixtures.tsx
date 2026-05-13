import { MatchRow } from "./MatchRow";
import type { Fixture } from "@/lib/dataSource/types";

interface Props {
  fixtures: Fixture[];
}

export function UpcomingFixtures({ fixtures }: Props) {
  const sorted = [...fixtures].sort((a, b) => a.utcKickoff.localeCompare(b.utcKickoff));
  return (
    <section className="kickoff-card p-5">
      <h2 className="section-title text-xl mb-2">
        오늘 & 다가오는 경기 <span className="text-[var(--color-muted)] text-sm font-normal ml-1">KST</span>
      </h2>
      {sorted.length === 0 ? (
        <p className="text-[var(--color-muted)] py-4">예정된 경기가 없어요.</p>
      ) : (
        <div>{sorted.slice(0, 12).map((f) => <MatchRow key={f.id} fixture={f} />)}</div>
      )}
    </section>
  );
}
