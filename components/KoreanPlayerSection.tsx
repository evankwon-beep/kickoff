import { listKoreanPlayers } from "@/lib/koreanPlayers";
import type { Fixture } from "@/lib/dataSource/types";

interface Props {
  fixtures: Fixture[];
}

interface PlayerActivity {
  id: string;
  name: string;
  teamName: string;
  recentMatch: { opponent: string; result: string; scoreLine: string } | null;
}

function summarize(fixtures: Fixture[]): PlayerActivity[] {
  const players = listKoreanPlayers();
  return players.map((p) => {
    const recent = fixtures
      .filter((f) => f.status === "FINISHED" && (f.home.id === p.teamId || f.away.id === p.teamId))
      .sort((a, b) => b.utcKickoff.localeCompare(a.utcKickoff))[0];
    if (!recent) return { id: p.id, name: p.name, teamName: p.teamName, recentMatch: null };

    const isHome = recent.home.id === p.teamId;
    const myScore = isHome ? recent.score.home! : recent.score.away!;
    const oppScore = isHome ? recent.score.away! : recent.score.home!;
    const opponent = isHome ? recent.away.shortName : recent.home.shortName;
    const result = myScore > oppScore ? "승" : myScore < oppScore ? "패" : "무";
    return {
      id: p.id,
      name: p.name,
      teamName: p.teamName,
      recentMatch: { opponent, result, scoreLine: `${myScore}-${oppScore}` },
    };
  });
}

const RESULT_COLOR: Record<string, string> = {
  "승": "bg-[var(--color-accent)]/15 text-[var(--color-accent)] border-[var(--color-accent)]/30",
  "패": "bg-[var(--color-korean)]/15 text-[var(--color-korean)] border-[var(--color-korean)]/30",
  "무": "bg-[var(--color-muted)]/15 text-[var(--color-muted)] border-[var(--color-muted)]/30",
};

export function KoreanPlayerSection({ fixtures }: Props) {
  const activities = summarize(fixtures);
  return (
    <section className="kickoff-card p-5">
      <h2 className="section-title text-xl mb-3">🇰🇷 한국 선수</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {activities.map((a) => (
          <li key={a.id} className="border border-[var(--color-border)] rounded-xl p-3 hover:border-[var(--color-korean)]/40 transition-colors">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-bold">{a.name}</p>
              {a.recentMatch && (
                <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${RESULT_COLOR[a.recentMatch.result] ?? ""}`}>
                  {a.recentMatch.result}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-muted)] mt-1">{a.teamName}</p>
            {a.recentMatch ? (
              <p className="text-sm mt-2">
                vs {a.recentMatch.opponent}{" "}
                <span className="font-mono text-[var(--color-text)]">{a.recentMatch.scoreLine}</span>
              </p>
            ) : (
              <p className="text-sm text-[var(--color-muted)] mt-2">최근 7일 경기 없음</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
