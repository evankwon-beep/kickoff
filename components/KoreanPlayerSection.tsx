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

export function KoreanPlayerSection({ fixtures }: Props) {
  const activities = summarize(fixtures);
  return (
    <section className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]">
      <h2 className="font-bold text-lg mb-3">🇰🇷 한국 선수</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {activities.map((a) => (
          <li key={a.id} className="border border-[var(--color-border)] rounded-lg p-3">
            <p className="font-semibold">
              {a.name}{" "}
              <span className="text-[var(--color-muted)] text-sm">({a.teamName})</span>
            </p>
            {a.recentMatch ? (
              <p className="text-sm text-[var(--color-muted)] mt-1">
                최근: vs {a.recentMatch.opponent} {a.recentMatch.scoreLine}{" "}
                <span
                  className={
                    a.recentMatch.result === "승"
                      ? "text-[var(--color-accent)]"
                      : a.recentMatch.result === "패"
                        ? "text-[var(--color-korean)]"
                        : ""
                  }
                >
                  ({a.recentMatch.result})
                </span>
              </p>
            ) : (
              <p className="text-sm text-[var(--color-muted)] mt-1">최근 7일 경기 없음</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
