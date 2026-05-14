import "server-only";
import teamData from "@/data/team-korean-names.json";
import type { LeagueCode } from "@/lib/dataSource/types";

/**
 * 네이버 스포츠 비공식 record API 어댑터.
 *
 * Source page (사용자 검증): https://m.sports.naver.com/wfootball/record/epl?seasonCode=lji9&tab=players
 * SPA가 호출하는 실 endpoint:
 *   GET https://api-gw.sports.naver.com/statistics/categories/{categoryId}/seasons/{seasonCode}/top-players?limit=N
 *
 * 응답 result.topPlayers는 통계 type별로 묶인 배열 (goals, assists, indexScore, ...).
 * 골/도움 type만 추출해 한국어 이름 + 팀명 + 사진을 반환합니다.
 *
 * football-data /scorers가 EPL에서 명백히 잘못된 player↔team을 돌려주는 문제(2025/26)
 * 해결을 위해 도입. 호출자(leagueAwards)는 이 어댑터 우선, 실패 시 기존 football-data로 fallback.
 */

const NAVER_API_BASE = "https://api-gw.sports.naver.com";

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";

/** football-data LeagueCode → 네이버 categoryId */
const LEAGUE_TO_NAVER: Partial<Record<LeagueCode, string>> = {
  PL: "epl",
  PD: "primera",
  BL1: "bundesliga",
  SA: "seriea",
  FL1: "ligue1",
};

/**
 * 25/26 시즌 코드 (네이버 내부 식별자). 시즌 list endpoint로 동적 조회도 가능하지만
 * 매 호출마다 가는 건 낭비라 하드코딩 + 시즌 만료 시 한 줄 변경.
 *
 * 검증 시각: 2026-05 (현재 25/26 진행 중).
 * seriea는 네이버에서 25/26 시즌이 비어 있어 매핑 없음 (호출 시 null 반환).
 */
const SEASON_CODE_BY_LEAGUE: Partial<Record<LeagueCode, string>> = {
  PL: "lji9",
  PD: "Igrb",
  BL1: "lvYe",
  FL1: "eJUK",
  // SA: 네이버 미지원 (2026-05 기준)
};

export interface NaverRecordPlayer {
  /** 네이버 plain text 한국어 이름 (예: "엘링 홀란") */
  name: string;
  /** football-data team ID 역매핑 결과. 매핑 실패 시 0 */
  teamId: number;
  /** 한국어 팀명 (네이버 응답 그대로) */
  teamName: string;
  /** 사진 URL */
  photoUrl?: string;
  /** 국적 ISO 코드 (네이버 형식, 예: "NOR") */
  countryId?: string;
  goals: number;
  assists: number;
}

export interface NaverLeagueRecord {
  scorers: NaverRecordPlayer[];
  assists: NaverRecordPlayer[];
}

interface NaverRankRow {
  rank: number;
  rankType: string;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  countryId?: string;
  image?: string;
  goals: number;
  assists: number;
}

interface NaverTopPlayerBucket {
  type: string;
  ranks: NaverRankRow[];
}

interface NaverApiResponse {
  code: number;
  success: boolean;
  message?: string;
  result?: { topPlayers: NaverTopPlayerBucket[] };
}

interface TeamEntry {
  id: number;
  query: string;
  names?: string[];
}

const TEAMS = teamData as TeamEntry[];

/**
 * 네이버 한국어 팀명 → football-data teamId 역매핑.
 * 1순위: query 완전 일치.
 * 2순위: query가 입력의 prefix/contain 관계.
 * 3순위: aliases 부분 일치.
 *
 * 네이버는 가끔 다른 표기를 씁니다 (예: "브렌트퍼드" vs 우리쪽 "브렌트포드",
 * "맨체스터 시티" vs "맨시티"). 그런 경우를 위해 양방향 contain 매칭.
 */
function resolveTeamIdFromKoreanName(naverTeamName: string): number {
  if (!naverTeamName) return 0;
  const target = naverTeamName.trim();
  // 1) query 완전 일치
  const exact = TEAMS.find((t) => t.query === target);
  if (exact) return exact.id;
  // 2) query 부분 일치 (양방향)
  const partial = TEAMS.find(
    (t) => target.includes(t.query) || t.query.includes(target)
  );
  if (partial) return partial.id;
  // 3) aliases (영문일 가능성도 포함)
  const lower = target.toLowerCase();
  const byAlias = TEAMS.find((t) =>
    (t.names ?? []).some((n) => n.toLowerCase() === lower)
  );
  if (byAlias) return byAlias.id;
  return 0;
}

function mapRow(row: NaverRankRow): NaverRecordPlayer {
  return {
    name: row.playerName,
    teamId: resolveTeamIdFromKoreanName(row.teamName),
    teamName: row.teamName,
    photoUrl: row.image || undefined,
    countryId: row.countryId,
    goals: row.goals ?? 0,
    assists: row.assists ?? 0,
  };
}

// 모듈 in-memory 1일 캐시. Next.js fetch revalidate와 별개로 동일 빌드/서버 인스턴스 내 중복 호출 방지.
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const memCache = new Map<string, { at: number; data: NaverLeagueRecord }>();

/**
 * 네이버 record API에서 단일 리그의 골/도움 TOP을 가져옵니다.
 * 실패(네트워크 오류, 미지원 리그, 비ok 응답) 시 null.
 *
 * @param league football-data LeagueCode
 * @param topN 각 부문 상위 N (기본 10, 호출자가 추가로 잘라 씀)
 */
export async function fetchNaverLeagueRecord(
  league: LeagueCode,
  topN = 10
): Promise<NaverLeagueRecord | null> {
  const categoryId = LEAGUE_TO_NAVER[league];
  const seasonCode = SEASON_CODE_BY_LEAGUE[league];
  if (!categoryId || !seasonCode) return null;

  const cacheKey = `${categoryId}::${seasonCode}::${topN}`;
  const cached = memCache.get(cacheKey);
  if (cached && Date.now() - cached.at < ONE_DAY_MS) {
    return cached.data;
  }

  const url = `${NAVER_API_BASE}/statistics/categories/${categoryId}/seasons/${seasonCode}/top-players?limit=${topN}`;
  const referer = `https://m.sports.naver.com/wfootball/record/${categoryId}?seasonCode=${seasonCode}&tab=players`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Referer: referer,
        Origin: "https://m.sports.naver.com",
        "Accept-Language": "ko",
      },
      // Next.js fetch cache: 1일
      next: { revalidate: 86400 },
    } as RequestInit);
    if (!res.ok) return null;
    const json = (await res.json()) as NaverApiResponse;
    if (!json.success || !json.result) return null;

    const buckets = json.result.topPlayers;
    const goalsBucket = buckets.find((b) => b.type === "goals");
    const assistsBucket = buckets.find((b) => b.type === "assists");

    const scorers = (goalsBucket?.ranks ?? [])
      .filter((r) => (r.goals ?? 0) > 0)
      .sort((a, b) => b.goals - a.goals)
      .map(mapRow);
    const assists = (assistsBucket?.ranks ?? [])
      .filter((r) => (r.assists ?? 0) > 0)
      .sort((a, b) => b.assists - a.assists)
      .map(mapRow);

    const data: NaverLeagueRecord = { scorers, assists };
    memCache.set(cacheKey, { at: Date.now(), data });
    return data;
  } catch {
    return null;
  }
}

/** 테스트용: 캐시 비우기 */
export function __clearNaverRecordCache(): void {
  memCache.clear();
}
