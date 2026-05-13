import Link from "next/link";
import type { ActiveTournament } from "@/lib/majorTournaments";

interface Props {
  tournaments: ActiveTournament[];
}

function timeLabel(t: ActiveTournament): string {
  if (t.state === "ongoing") return `진행 중 · D-${t.daysToEnd} 종료`;
  return `D-${t.daysToStart} 개막`;
}

function Card({ t }: { t: ActiveTournament }) {
  const inner = (
    <div className="group flex items-center gap-3 bg-gradient-to-r from-[#1a1530] to-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-gold)]/50 rounded-xl px-4 py-3 transition-colors">
      <span className="text-2xl" aria-hidden>{t.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold truncate">{t.nameKr}</p>
        <p className="text-xs text-[var(--color-muted)] mt-0.5">
          <span className={t.state === "ongoing" ? "text-[var(--color-accent)]" : "text-[var(--color-gold)]"}>
            {timeLabel(t)}
          </span>
        </p>
      </div>
      {t.code && (
        <span className="text-[var(--color-muted)] group-hover:text-[var(--color-text)] transition-colors">→</span>
      )}
    </div>
  );

  if (t.code) {
    return (
      <Link key={t.id} href={`/competition/${t.code}`} className="block flex-1 min-w-[260px]">
        {inner}
      </Link>
    );
  }
  return <div key={t.id} className="flex-1 min-w-[260px]">{inner}</div>;
}

export function MajorTournamentsBanner({ tournaments }: Props) {
  if (tournaments.length === 0) return null;
  return (
    <section>
      <div className="flex flex-wrap gap-3">
        {tournaments.map((t) => <Card key={t.id} t={t} />)}
      </div>
    </section>
  );
}
