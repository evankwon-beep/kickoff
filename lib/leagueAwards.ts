import "server-only";
import { fetchScorers, fetchTop4Standings } from "@/lib/dataSource";
import { fetchNaverSquad, fetchNaverPersonPhoto } from "@/lib/naverSquad";
import {
  fetchNaverLeagueRecord,
  type NaverRecordPlayer,
} from "@/lib/naverSportsRecord";
import { koreanTeamName } from "@/lib/i18n";
import {
  SECTION,
  looksLikeSamePlayer,
  lookupValueFlexible,
} from "@/lib/leagueStars";
import enToKoMap from "@/data/scorer-name-en-to-ko.json";
import type { LeagueCode, ScorerEntry, Standings } from "@/lib/dataSource/types";

const EN_TO_KO = enToKoMap as Record<string, string>;

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
  /** 통계 값 (골/도움/시장가치 등) */
  value: number;
  /** "골" / "도움" / "억" 등 */
  unit: string;
}

export interface LeagueAwards {
  league: LeagueCode;
  scorers: AwardEntry[]; // 득점왕 top 3
  assists: AwardEntry[]; // 도움왕 top 3
  defense: AwardEntry[]; // 수비왕 top 3 (수비수 시장가치 TOP)
}

function crestFor(teamId: number, fallback?: string): string {
  if (fallback) return fallback;
  return `https://crests.football-data.org/${teamId}.png`;
}

/** 영문 풀네임 → 한국어 매핑이 있으면 한국어, 없으면 그대로 */
function enToKo(name: string): string {
  return EN_TO_KO[name] ?? EN_TO_KO[name.trim()] ?? name;
}

/** Naver squad에서 한국어/영문 이름으로 선수 매칭 */
function matchSquad<T extends { name: string; backNo?: string }>(
  squad: T[],
  displayName: string,
  englishName: string
): T | undefined {
  // 1) 정확 매칭 (한국어 표시 이름)
  const exact = squad.find((p) => p.name === displayName);
  if (exact) return exact;
  // 2) 유사 매칭 (한국어)
  const fuzzy = squad.find((p) => looksLikeSamePlayer(p.name, displayName));
  if (fuzzy) return fuzzy;
  // 3) 영문 이름이 한국어로 매핑되지 않았을 때 — 토큰 기반 (영문)
  if (displayName === englishName) {
    const tokens = englishName.split(/\s+/).filter((t) => t.length >= 2);
    for (const t of tokens) {
      const m = squad.find((p) => p.name.includes(t));
      if (m) return m;
    }
  }
  // 4) 한국어 토큰 매칭 (성/이름 일부)
  const tokens = displayName.split(/\s+/).filter((t) => t.length >= 2);
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

  return Promise.all(
    sorted.map(async (e) => {
      const squad = squads.get(e.team.id);
      const displayName = enToKo(e.player.name);
      const matched = squad
        ? matchSquad(squad, displayName, e.player.name)
        : undefined;
      // squad 매칭됐어도 profileUrl이 빈 문자열인 경우 fallback 동작하도록 truthy 체크
      const squadPhoto = matched?.profileUrl?.trim()
        ? matched.profileUrl
        : null;
      // fallback 검색어: squad에서 매칭된 정확한 한국어 이름이 가장 좋음
      const searchName = matched?.name ?? displayName;
      const photoUrl =
        squadPhoto ??
        (await fetchNaverPersonPhoto(searchName)) ??
        undefined;
      return {
        // 우선순위: Naver squad 매칭된 한국어 이름 > 영문→한국어 매핑 > 원본 영문
        name: matched?.name ?? displayName,
        teamId: e.team.id,
        teamName: koreanTeamName(e.team.id, e.team.name),
        crestUrl: crestFor(e.team.id, e.team.crest),
        photoUrl,
        nationality: matched?.countryName ?? e.player.nationality,
        value: valueOf(e),
        unit,
      };
    })
  );
}

/**
 * 리그별 매핑된 팀의 Naver squad를 fetch해서 position="DF"인 선수 중
 * 매핑 JSON의 시장가치 top N. football-data 무료 API에 개별 수비수 통계가
 * 없기 때문에 대안으로 사용.
 */
async function fetchTopDefenders(
  league: LeagueCode,
  topN: number
): Promise<AwardEntry[]> {
  // 1) SECTION에서 league에 해당하는 모든 teamId 추출
  const teamIds = Array.from(
    new Set(
      Object.values(SECTION)
        .filter((s) => s.league === league)
        .map((s) => s.teamId)
    )
  );
  if (teamIds.length === 0) return [];

  // 2) 각 team Naver squad 병렬 fetch
  const squadByTeam = new Map<
    number,
    Awaited<ReturnType<typeof fetchNaverSquad>>
  >();
  await Promise.all(
    teamIds.map(async (id) => {
      try {
        squadByTeam.set(id, await fetchNaverSquad(id));
      } catch {
        squadByTeam.set(id, null);
      }
    })
  );

  // 3) position="DF"인 선수 + 시장가치 lookup
  interface DefenderCandidate extends AwardEntry {
    /** 중복 제거용 키 */
    dedupeKey: string;
  }
  const candidates: DefenderCandidate[] = [];
  for (const [teamId, squad] of squadByTeam.entries()) {
    if (!squad) continue;
    const section = Object.values(SECTION).find((s) => s.teamId === teamId);
    for (const p of squad) {
      const isDF =
        p.position === "DF" || p.positionName?.includes("수비수");
      if (!isDF) continue;
      const value = lookupValueFlexible(p.name);
      if (value == null || value <= 0) continue;
      candidates.push({
        name: p.name,
        teamId,
        teamName: section?.teamName ?? koreanTeamName(teamId, ""),
        crestUrl: crestFor(teamId),
        photoUrl: p.profileUrl,
        nationality: p.countryName,
        value,
        unit: "억",
        dedupeKey: `${teamId}::${p.name}`,
      });
    }
  }

  // 4) 같은 선수 alias 중복 제거 + value 내림차순 + top N
  const seen = new Set<string>();
  const ranked: DefenderCandidate[] = [];
  for (const c of candidates.sort((a, b) => b.value - a.value)) {
    // 같은 팀의 alias 중복 방지
    const isDup = ranked.some(
      (r) => r.teamId === c.teamId && looksLikeSamePlayer(r.name, c.name)
    );
    if (isDup) continue;
    if (seen.has(c.dedupeKey)) continue;
    seen.add(c.dedupeKey);
    ranked.push(c);
    if (ranked.length >= topN) break;
  }
  // dedupeKey 제거하고 AwardEntry로 반환
  return ranked.map(({ dedupeKey: _ignored, ...rest }) => {
    void _ignored;
    return rest;
  });
}

/**
 * 네이버 record API row를 AwardEntry로 변환.
 * 네이버는 이미 한국어 이름/팀명/사진을 주므로 추가 fetch 없이 그대로 사용.
 * teamId 매핑이 실패한(0) 경우 crestUrl이 깨지지 않도록 빈 문자열로 두고,
 * 팀 페이지 링크 등 컴포넌트가 0을 invalid로 인식해 비활성화하게 합니다.
 */
function naverRowToAward(
  row: NaverRecordPlayer,
  value: number,
  unit: string
): AwardEntry {
  return {
    name: row.name,
    teamId: row.teamId,
    // 네이버 팀명을 한국어 매핑으로 재정규화 (teamId 매핑 성공 시 우리 표준 표기 사용)
    teamName: row.teamId
      ? koreanTeamName(row.teamId, row.teamName)
      : row.teamName,
    crestUrl: row.teamId
      ? `https://crests.football-data.org/${row.teamId}.png`
      : "",
    photoUrl: row.photoUrl,
    nationality: row.countryId,
    value,
    unit,
  };
}

/** 단일 리그의 시즌 어워드 (득점왕/도움왕/수비왕 top 3) */
export async function fetchLeagueAwards(
  league: LeagueCode,
  _standings: Standings | null,
  topN = 3
): Promise<LeagueAwards> {
  void _standings; // standings는 더 이상 defense 산출에 쓰이지 않음 (signature 호환 유지)

  // 1) Naver record API 우선 시도 (football-data /scorers의 player↔team 부정확 이슈 우회).
  //    지원되는 리그만 (PL/PD/BL1/FL1). SA 및 기타는 곧장 fallback.
  const naverRecord = await fetchNaverLeagueRecord(league, 10).catch(() => null);

  if (naverRecord && (naverRecord.scorers.length > 0 || naverRecord.assists.length > 0)) {
    const scorers = naverRecord.scorers
      .slice(0, topN)
      .map((r) => naverRowToAward(r, r.goals, "골"));
    const assists = naverRecord.assists
      .slice(0, topN)
      .map((r) => naverRowToAward(r, r.assists, "도움"));
    const defense = await fetchTopDefenders(league, topN);
    return { league, scorers, assists, defense };
  }

  // 2) Fallback: 기존 football-data 경로
  const scorerEntries = await fetchScorers(league, 10);
  const [scorers, assists, defense] = await Promise.all([
    enrichScorerEntries(scorerEntries, (e) => e.goals, "골", topN),
    enrichScorerEntries(scorerEntries, (e) => e.assists, "도움", topN),
    fetchTopDefenders(league, topN),
  ]);

  return { league, scorers, assists, defense };
}

/** 5대 리그 시즌 어워드 일괄 fetch */
export async function fetchAllLeagueAwards(
  leagues: LeagueCode[],
  topN = 3
): Promise<Partial<Record<LeagueCode, LeagueAwards>>> {
  // standings는 시그니처 호환을 위해 유지하지만 defense 계산엔 더 이상 안 씀
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
