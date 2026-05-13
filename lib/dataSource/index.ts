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
  const detail = await football().getTeam(teamId);
  const naver = await fetchNaverSquad(teamId);
  if (naver && naver.length > 0) {
    const firstTeam = naver.filter((p) => p.backNo && p.backNo.trim() !== "");
    if (firstTeam.length > 0) {
      const replaced: SquadMember[] = firstTeam.map((np, idx) => ({
        id: idx + 1,
        name: np.name,
        position: np.position ?? "기타", // GK/DF/MF/FW
        shirtNumber: np.backNo ? Number(np.backNo) : undefined,
        nationality: np.countryName,
        photoUrl: np.profileUrl,
      }));
      return { ...detail, squad: replaced };
    }
  }
  return detail;
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

export async function fetchTeamHighlights(team: import("./types").Team, maxResults = 30) {
  const videos = await youtube().getRecentVideos({ maxResults });
  return filterByTeam(videos, team);
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
  const [fixtures, videos] = await Promise.all([
    football().getRecentAndUpcomingFixtures({
      leagueCodes: [code],
      daysPast: 14,
      daysFuture: 30,
    }),
    youtube().getRecentVideos({ maxResults: 30 }),
  ]);
  return tagKoreanFixtures(matchHighlights(fixtures, videos));
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
