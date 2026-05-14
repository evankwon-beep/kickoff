import "server-only";
import { fetchScorers, fetchTop4Standings } from "@/lib/dataSource";
import { fetchNaverSquad } from "@/lib/naverSquad";
import { koreanTeamName } from "@/lib/i18n";
import type { LeagueCode, ScorerEntry, Standings } from "@/lib/dataSource/types";

export interface AwardEntry {
  /** 표시 이름 (가능하면 한국어, 폴백 영어) */
  name: string;
  teamId: number;
  /** 한국어 팀명 */
  teamName: string;
  crestUrl: string;
  /** 선수 사진 (네이버 squad에서 매칭된 경우) */
  photoUrl?: string;
  /** 국적 코드 또는 영어 이름 (UI에서 koreanCountry로 변환) */
  nationality?: string;
  /** 통계 값 (골/도움/실점) */
  value: number;
  /** "골" / "도움" / "실점" */
  unit: string;
}

export interface LeagueAwards {
  league: LeagueCode;
  scorers: AwardEntry[]; // 득점왕 top 3
  assists: AwardEntry[]; // 도움왕 top 3
  defense: AwardEntry[]; // 수비왕 top 3 (실점 적은 팀 GK 또는 팀)
}

function crestFor(teamId: number, fallback?: string): string {
  if (fallback) return fallback;
  return `https://crests.football-data.org/${teamId}.png`;
}

/** 이름이 같은 선수인지 (공백/기호 제거, prefix) */
function looksLikeSamePlayer(a: string, b: string): boolean {
  if (a === b) return true;
  const na = a.replace(/[\s·\-]/g, "");
  const nb = b.replace(/[\s·\-]/g, "");
  if (na === nb) return true;
  if ((a.startsWith(b) || b.startsWith(a)) && Math.abs(a.length - b.length) <= 3) return true;
  return false;
}

/** 영문 풀네임 → 토큰들로 분리해서 squad와 매칭 */
function matchSquadByName<T extends { name: string }>(
  squad: T[],
  fdName: string
): T | undefined {
  const exact = squad.find((p) => looksLikeSamePlayer(p.name, fdName));
  if (exact) return exact;
  // 영문 last name 토큰으로 시도
  const tokens = fdName.split(/\s+/).filter((t) => t.length >= 2);
  for (const t of tokens) {
    const m = squad.find((p) => p.name.includes(t));
    if (m) return m;
  }
  return undefined;
}

async function enrichScorerEntries(
  entries: ScorerEntry[],
  valueOf: (e: ScorerEntry) => number,
  unit: string,
  topN: number
): Promise<AwardEntry[]> {
  // value > 0 인 항목만 정렬
  const sorted = entries
    .filter((e) => valueOf(e) > 0)
    .sort((a, b) => valueOf(b) - valueOf(a))
    .slice(0, topN);

  // 팀 ID별 squad 병렬 fetch (사진/한국어 이름 매칭)
  const teamIds = Array.from(new Set(sorted.map((e) => e.team.id)));
  const squads = new Map<number, Awaited<ReturnType<typeof fetchNaverSquad>>>();
  await Promise.all(
    teamIds.map(async (id) => {
      try {
        squads.set(id, await fetchNaverSquad(id));
      } catch {
        squads.set(id, null);
      }
    })
  );

  return sorted.map((e) => {
    const squad = squads.get(e.team.id);
    const matched = squad ? matchSquadByName(squad, e.player.name) : undefined;
    return {
      name: matched?.name ?? e.player.name,
      teamId: e.team.id,
      teamName: koreanTeamName(e.team.id, e.team.name),
      crestUrl: crestFor(e.team.id, e.team.crest),
      photoUrl: matched?.profileUrl,
      nationality: matched?.countryName ?? e.player.nationality,
      value: valueOf(e),
      unit,
    };
  });
}

/** 실점 최저 팀 top N → 각 팀의 주전 GK (backNo=1 우선, 없으면 첫 GK) */
async function buildDefenseAwards(
  standings: Standings,
  topN: number
): Promise<AwardEntry[]> {
  // played > 0 인 팀만 (시즌 초 nonsense 방지)
  const ranked = [...standings.rows]
    .filter((r) => r.playedGames > 0)
    .sort((a, b) => a.goalsAgainst - b.goalsAgainst)
    .slice(0, topN);

  const squads = new Map<number, Awaited<ReturnType<typeof fetchNaverSquad>>>();
  await Promise.all(
    ranked.map(async (r) => {
      try {
        squads.set(r.team.id, await fetchNaverSquad(r.team.id));
      } catch {
        squads.set(r.team.id, null);
      }
    })
  );

  return ranked.map((r) => {
    const squad = squads.get(r.team.id);
    // 주전 GK 우선: backNo=1 > position GK 첫 번째
    let gk = squad?.find(
      (p) => p.backNo === "1" && (p.position === "GK" || p.positionName?.includes("골키퍼"))
    );
    if (!gk) {
      gk = squad?.find(
        (p) => p.position === "GK" || p.positionName?.includes("골키퍼")
      );
    }
    return {
      name: gk?.name ?? koreanTeamName(r.team.id, r.team.name),
      teamId: r.team.id,
      teamName: koreanTeamName(r.team.id, r.team.name),
      crestUrl: crestFor(r.team.id, r.team.crestUrl),
      photoUrl: gk?.profileUrl,
      nationality: gk?.countryName,
      value: r.goalsAgainst,
      unit: "실점",
    };
  });
}

/** 단일 리그의 시즌 어워드 (득점왕/도움왕/수비왕 top 3) */
export async function fetchLeagueAwards(
  league: LeagueCode,
  standings: Standings | null,
  topN = 3
): Promise<LeagueAwards> {
  const scorerEntries = await fetchScorers(league, 10);

  const [scorers, assists, defense] = await Promise.all([
    enrichScorerEntries(scorerEntries, (e) => e.goals, "골", topN),
    enrichScorerEntries(scorerEntries, (e) => e.assists, "도움", topN),
    standings
      ? buildDefenseAwards(standings, topN)
      : Promise.resolve([] as AwardEntry[]),
  ]);

  return { league, scorers, assists, defense };
}

/** 5대 리그 시즌 어워드 일괄 fetch */
export async function fetchAllLeagueAwards(
  leagues: LeagueCode[],
  topN = 3
): Promise<Partial<Record<LeagueCode, LeagueAwards>>> {
  // standings 한 번에 가져와서 리그별로 매핑
  const allStandings = await fetchTop4Standings().catch(() => [] as Standings[]);
  const standingsByCode = new Map(allStandings.map((s) => [s.leagueCode, s]));

  const results = await Promise.all(
    leagues.map((code) =>
      fetchLeagueAwards(code, standingsByCode.get(code) ?? null, topN).catch(
        () =>
          ({
            league: code,
            scorers: [],
            assists: [],
            defense: [],
          }) as LeagueAwards
      )
    )
  );

  const out: Partial<Record<LeagueCode, LeagueAwards>> = {};
  for (const r of results) out[r.league] = r;
  return out;
}
