import "server-only";
import { env } from "@/lib/env";
import { FootballDataSource } from "./footballData";
import { YoutubeHighlightSource } from "./youtube";
import { matchHighlights } from "@/lib/highlightMatcher";
import { tagKoreanFixtures } from "@/lib/koreanPlayers";
import { filterFootballHighlights, filterByTeam } from "@/lib/highlightFilter";
import { fetchNaverSquad } from "@/lib/naverSquad";
import type { Fixture, LeagueCode, Standings, HighlightVideo, SquadMember, TeamDetail } from "./types";

const TOP4: LeagueCode[] = ["PL", "PD", "BL1", "SA"];

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

export async function fetchEnrichedFixtures(): Promise<Fixture[]> {
  const [fixtures, videos] = await Promise.all([
    football().getRecentAndUpcomingFixtures({
      leagueCodes: [...TOP4, "CL"],
      daysPast: 3,
      daysFuture: 7,
    }),
    youtube().getRecentVideos({ maxResults: 30 }),
  ]);
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

export async function fetchTeamHighlights(team: import("./types").Team, maxResults = 50) {
  const capped = Math.min(maxResults, 50);
  const channelVideos = await youtube()
    .getRecentVideos({ maxResults: capped })
    .catch(() => [] as HighlightVideo[]);
  const teamFiltered = filterByTeam(channelVideos, team);

  // 그 팀 매칭 영상이 충분하면 그대로
  if (teamFiltered.length >= 10) return teamFiltered;

  // 부족하면: 그 팀 영상을 위로, 나머지 모든 축구 하이라이트(일반)도 함께 노출
  const generalFootball = filterFootballHighlights(channelVideos);
  const seen = new Set(teamFiltered.map((v) => v.videoId));
  const tail = generalFootball.filter((v) => !seen.has(v.videoId));
  return [...teamFiltered, ...tail];
}

export async function fetchFootballHighlights(maxResults = 24) {
  const all = await youtube().getRecentVideos({ maxResults });
  return filterFootballHighlights(all);
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
};

export async function fetchCompetitionHighlights(
  code: LeagueCode,
  maxResults = 40
): Promise<HighlightVideo[]> {
  const keywords = COMPETITION_KEYWORDS[code] ?? [];
  if (keywords.length === 0) return [];
  const all = await youtube().getRecentVideos({ maxResults });
  const fb = filterFootballHighlights(all);
  return fb.filter((v) => {
    const lower = v.title.toLowerCase();
    return keywords.some((k) => lower.includes(k.toLowerCase()));
  });
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
    const videos = await youtube().getRecentVideos({ maxResults: 30 });
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
    youtube().getRecentVideos({ maxResults: 30 }),
  ]);
  return tagKoreanFixtures(matchHighlights(fixtures, videos));
}

export type { Fixture, Standings, LeagueCode, HighlightVideo, TeamDetail, SquadMember } from "./types";
