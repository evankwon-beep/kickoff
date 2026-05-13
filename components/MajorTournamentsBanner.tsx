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
  const accent = t.state === "ongoing" ? "var(--color-accent)" : "var(--color-gold)";
  const inner = (
    <div
      className="group relative flex items-center gap-4 rounded-2xl px-5 py-4 transition-all border border-[var(--color-border)] hover:border-[color-mix(in_oklab,var(--color-gold)_60%,var(--color-border))] overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in oklab, var(--color-pitch) 70%, var(--color-surface)) 0%, var(--color-surface) 60%)",
      }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: `linear-gradient(180deg, ${accent}, transparent)` }}
      />
      <span className="text-3xl pl-1" aria-hidden>{t.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-extrabold text-base tracking-tight truncate">{t.nameKr}</p>
        <p className="pitch-badge mt-1" style={{ background: `color-mix(in oklab, ${accent} 14%, transparent)`, color: accent, borderColor: `color-mix(in oklab, ${accent} 25%, transparent)` }}>
          {timeLabel(t)}
        </p>
      </div>
      {t.code && (
        <span className="text-[var(--color-muted)] group-hover:text-[var(--color-text)] transition-colors text-xl">→</span>
      )}
    </div>
  );

  if (t.code) {
    return (
      <Link key={t.id} href={`/competition/${t.code}`} className="block flex-1 min-w-[280px]">
        {inner}
      </Link>
    );
  }
  return <div key={t.id} className="flex-1 min-w-[280px]">{inner}</div>;
}

export function MajorTournamentsBanner({ tournaments }: Props) {
  if (tournaments.length === 0) return null;
  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tournaments.map((t) => <Card key={t.id} t={t} />)}
      </div>
    </section>
  );
}
