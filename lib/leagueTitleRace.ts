import type { Standings, LeagueCode } from "./dataSource/types";

// Total matches per team in each league (used to derive remaining games).
// EPL/LaLiga/SerieA: 20 teams × 38 matches; Bundesliga: 18 teams × 34 matches.
const TOTAL_MATCHES: Record<LeagueCode, number> = {
  PL: 38,
  PD: 38,
  BL1: 34,
  SA: 38,
  FL1: 34,  // Ligue 1: 18 teams × 34 matches
  CL: 6,
  FA: 0,
  WC: 0,
  EC: 0,
};

export type TitleStatus =
  | { kind: "clinched" }                  // 1위가 산술적으로 우승 확정
  | { kind: "magic"; magicNumber: number } // 우승까지 필요한 추가 승점
  | { kind: "unknown" };                   // 데이터 부족

export interface TitleRace {
  leader: TitleStatus;
  // For non-leader rows: whether they can still mathematically catch the leader's *current* points
  // (a rough "still in the race?" signal)
  stillInRace: (teamId: number) => boolean;
}

export function computeTitleRace(standings: Standings): TitleRace {
  const total = TOTAL_MATCHES[standings.leagueCode] ?? 0;
  if (total === 0 || standings.rows.length < 2) {
    return { leader: { kind: "unknown" }, stillInRace: () => false };
  }

  const leader = standings.rows[0];
  const remaining = (r: typeof leader) => Math.max(0, total - r.playedGames);
  const maxPoints = (r: typeof leader) => r.points + remaining(r) * 3;

  // Highest possible points among non-leader teams
  let maxOthers = 0;
  for (const r of standings.rows.slice(1)) {
    const m = maxPoints(r);
    if (m > maxOthers) maxOthers = m;
  }

  let leaderStatus: TitleStatus;
  if (leader.points > maxOthers) {
    leaderStatus = { kind: "clinched" };
  } else {
    const magic = maxOthers + 1 - leader.points;
    leaderStatus = { kind: "magic", magicNumber: Math.max(1, magic) };
  }

  const stillInRace = (teamId: number) => {
    const row = standings.rows.find((r) => r.team.id === teamId);
    if (!row || row === leader) return false;
    return maxPoints(row) > leader.points;
  };

  return { leader: leaderStatus, stillInRace };
}
