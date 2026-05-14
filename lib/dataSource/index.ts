import "server-only";
import { env } from "@/lib/env";
import { FootballDataSource } from "./footballData";
import { YoutubeHighlightSource } from "./youtube";
import { matchHighlights } from "@/lib/highlightMatcher";
import { tagKoreanFixtures } from "@/lib/koreanPlayers";
import { filterFootballHighlights, filterByTeam, filterOutNonHighlights } from "@/lib/highlightFilter";
import { fetchNaverSquad } from "@/lib/naverSquad";
import type { Fixture, LeagueCode, Standings, HighlightVideo, SquadMember, TeamDetail } from "./types";

const TOP4: LeagueCode[] = ["PL", "PD", "BL1", "SA", "FL1"];

let _footballData: FootballDataSource | null = null;
function football() {
  if (!_footballData) _footballData = new FootballDataSource(env.footballDataToken());
  return _footballData;
}

let _youtube: YoutubeHighlightSource | null = null;
function youtube() {
  if (!_youtube) {
    _youtube = new YoutubeHighlightSource(
      env.youtubeApiKey(),
      env.youtubePrimaryChannelId(),
      env.youtubeFallbackChannelIds()
    );
  }
  return _youtube;
}

export async function fetchTop4Standings(): Promise<Standings[]> {
  return Promise.all(TOP4.map((c) => football().getStandings(c)));
}

export async function fetchScorers(code: LeagueCode, limit = 10) {
  return football().getScorers(code, limit).catch(() => []);
}

export async function fetchEnrichedFixtures(): Promise<Fixture[]> {
  // YouTube quota 등으로 영상이 실패해도 fixtures는 무조건 표시되도록 분리
  let fixtures: Fixture[] = [];
  let videos: HighlightVideo[] = [];
  try {
    fixtures = await football().getRecentAndUpcomingFixtures({
      leagueCodes: [...TOP4, "CL"],
      daysPast: 3,
      daysFuture: 7,
    });
  } catch {
    return [];
  }
  try {
    videos = await youtube().getRecentVideos({ maxResults: 50 });
  } catch {
    // YouTube 실패해도 fixtures는 살림 (영상 매칭만 빠짐)
  }
  return tagKoreanFixtures(matchHighlights(fixtures, videos));
}

export async function fetchTopHighlights(maxResults = 12): Promise<HighlightVideo[]> {
  return youtube().getRecentVideos({ maxResults });
}

export async function fetchTeamDetailEnriched(teamId: number): Promise<TeamDetail> {
  // Football-Data + Naver를 병렬로 시도. 하나가 실패해도 다른 한쪽으로 페이지 렌더.
  const [fdResult, naver] = await Promise.all([
    football().getTeam(teamId).then(
      (d) => ({ ok: true as const, data: d }),
      () => ({ ok: false as const, data: null as TeamDetail | null }),
    ),
    fetchNaverSquad(teamId),
  ]);

  const firstTeam = naver?.filter((p) => p.backNo && p.backNo.trim() !== "") ?? [];
  const naverSquad: SquadMember[] = firstTeam.map((np, idx) => ({
    id: idx + 1,
    name: np.name,
    position: np.position ?? "기타",
    shirtNumber: np.backNo ? Number(np.backNo) : undefined,
    nationality: np.countryName,
    photoUrl: np.profileUrl,
  }));

  // FD 성공 시: FD 정보 + (Naver 1군 squad 있으면 교체)
  if (fdResult.ok && fdResult.data) {
    return naverSquad.length > 0
      ? { ...fdResult.data, squad: naverSquad }
      : fdResult.data;
  }

  // FD 실패 시: Naver 데이터로 최소 페이지 구성 (FD-rate-limit 대응)
  if (naverSquad.length > 0) {
    return {
      id: teamId,
      name: "팀 정보",
      shortName: "팀",
      tla: "",
      crestUrl: "",
      squad: naverSquad,
    };
  }

  // 둘 다 실패 → 호출자에서 notFound 처리
  throw new Error(`fetchTeamDetailEnriched: no data for team ${teamId}`);
}

export async function fetchGroupStandings(code: LeagueCode) {
  return football().getGroupStandings(code).catch(() => []);
}

export { fetchTeamDetailEnriched as fetchTeamDetail };

export async function fetchTeamFixtures(teamId: number) {
  return football().getRecentAndUpcomingFixturesForTeam({
    teamId,
    daysPast: 14,
    daysFuture: 14,
  });
}

/**
 * 팀 페이지 하이라이트.
 * 사용자 요구: "팀명을 두 채널(쿠팡플레이/SPOTV)에 검색했을 때 가장 최근 경기 영상".
 *
 * QUOTA 0 전략: 메인 페이지에서 이미 가져오는 두 채널 최근 영상 풀(getRecentVideos)을
 * 재사용 (Next.js fetch 캐시로 같은 URL 호출은 캐시 공유). 새 search.list 호출 없음.
 * 같은 두 채널 안에서 팀 키워드 매칭이므로 사용자 요구와 동일한 의미.
 */
export async function fetchTeamHighlights(team: import("./types").Team, maxResults = 20) {
  const all = await youtube()
    .getRecentVideos({ maxResults: 100 })
    .catch(() => [] as HighlightVideo[]);
  const refined = filterByTeam(all, team);
  refined.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return refined.slice(0, maxResults);
}

/**
 * 메인 페이지 하단 하이라이트.
 * 사용자 요구: "팀 관계없이 가장 최근 경기 영상을 두 채널에서 가져오기 + 최소 10개 + 최근순".
 * 두 채널의 최근 영상을 받아 축구 하이라이트 필터를 통과시키고, publishedAt desc로 정렬.
 * 필터 통과가 10개 미만이면 필터되지 않은 최근 영상으로 보강(shorts는 제외).
 */
export async function fetchFootballHighlights(maxResults = 24) {
  const fetchSize = Math.max(maxResults, 50);
  const all = await youtube()
    .getRecentVideos({ maxResults: fetchSize })
    .catch(() => [] as HighlightVideo[]);
  // getRecentVideos는 이미 publishedAt desc + shorts 제거 상태
  const filtered = filterFootballHighlights(all);

  if (filtered.length >= Math.min(10, maxResults)) {
    return filtered.slice(0, maxResults);
  }

  // 최소 10개 보장을 위해 필터 통과되지 않은 최근 영상도 추가(shorts/중복은 제외).
  const seen = new Set(filtered.map((v) => v.videoId));
  const filler: HighlightVideo[] = [];
  for (const v of all) {
    if (seen.has(v.videoId)) continue;
    filler.push(v);
  }
  const combined = [...filtered, ...filler];
  // 중복 없는 상태로 publishedAt desc 보장
  combined.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return combined.slice(0, Math.max(maxResults, 10));
}

// Filter the existing fetchEnrichedFixtures by top-N teams across TOP4 leagues.
export async function fetchEnrichedFixturesByTop6(): Promise<Fixture[]> {
  // Fetch standings to learn each league's top-6 team ids
  const standings = await fetchTop4Standings();
  const topTeamIds = new Set<number>();
  for (const s of standings) {
    for (const row of s.rows.slice(0, 6)) topTeamIds.add(row.team.id);
  }
  const enriched = await fetchEnrichedFixtures();
  return enriched.filter(
    (f) => topTeamIds.has(f.home.id) || topTeamIds.has(f.away.id)
  );
}

export async function fetchCompetition(code: LeagueCode) {
  return football().getStandings(code).catch(() => null);
}

const COMPETITION_KEYWORDS: Record<string, string[]> = {
  CL: ["챔피언스", "champions league", "ucl"],
  WC: ["월드컵", "world cup", "fifa"],
  EC: ["유로", "euro 20", "euros"],
  EL: ["유로파", "europa league", "uel"],
  PL: ["epl", "프리미어리그", "premier league"],
  PD: ["라리가", "la liga", "laliga"],
  BL1: ["분데스", "bundesliga"],
  SA: ["세리에", "serie a"],
  FL1: ["리그앙", "ligue 1", "ligue1"],
};

/**
 * 대회 페이지 하이라이트.
 * 사용자 요구: "챔피언스리그 섹션 누르면 해당 대회 영상을, 월드컵 개최 시 월드컵 영상을".
 * → 두 채널 안에서 대회 키워드들로 검색하고 publishedAt desc로 반환.
 */
export async function fetchCompetitionHighlights(
  code: LeagueCode,
  maxResults = 20
): Promise<HighlightVideo[]> {
  const keywords = COMPETITION_KEYWORDS[code] ?? [];
  if (keywords.length === 0) return [];

  // QUOTA 0: 메인의 두 채널 풀 재사용. 키워드(한·영) 제목 매칭으로 client-side filter.
  const merged = await youtube()
    .getRecentVideos({ maxResults: 100 })
    .catch(() => [] as HighlightVideo[]);

  const lowerKw = keywords.map((k) => k.toLowerCase());
  const filtered = filterOutNonHighlights(merged).filter((v) => {
    const lower = v.title.toLowerCase();
    return lowerKw.some((k) => lower.includes(k));
  });
  filtered.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return filtered.slice(0, maxResults);
}

export async function fetchCompetitionFixtures(code: LeagueCode) {
  let fixtures: Fixture[];
  try {
    fixtures = await football().getRecentAndUpcomingFixtures({
      leagueCodes: [code],
      daysPast: 14,
      daysFuture: 60,
    });
  } catch {
    return [];
  }
  let enriched = fixtures;
  try {
    const videos = await youtube().getRecentVideos({ maxResults: 50 });
    enriched = matchHighlights(fixtures, videos);
  } catch {
    // Youtube 실패해도 fixtures는 반환
  }
  return tagKoreanFixtures(enriched);
}

export async function fetchChampionsLeagueFixtures(): Promise<Fixture[]> {
  const [fixtures, videos] = await Promise.all([
    football().getRecentAndUpcomingFixtures({
      leagueCodes: ["CL"],
      daysPast: 14,
      daysFuture: 21,
    }),
    youtube().getRecentVideos({ maxResults: 50 }),
  ]);
  return tagKoreanFixtures(matchHighlights(fixtures, videos));
}

export type { Fixture, Standings, LeagueCode, HighlightVideo, TeamDetail, SquadMember } from "./types";
