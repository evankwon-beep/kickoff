export type LeagueCode = "PL" | "PD" | "BL1" | "SA" | "CL" | "FA" | "WC" | "EC";

export const TOP4_LEAGUES: { code: LeagueCode; nameKr: string; nameEn: string }[] = [
  { code: "PL", nameKr: "EPL", nameEn: "Premier League" },
  { code: "PD", nameKr: "라리가", nameEn: "La Liga" },
  { code: "BL1", nameKr: "분데스리가", nameEn: "Bundesliga" },
  { code: "SA", nameKr: "세리에A", nameEn: "Serie A" },
];

export interface Team {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crestUrl: string;
}

export interface StandingRow {
  position: number;
  team: Team;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface Standings {
  leagueCode: LeagueCode;
  season: string;
  rows: StandingRow[];
  updatedAt: string;
}

export type FixtureStatus =
  | "SCHEDULED"
  | "LIVE"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED";

export interface Fixture {
  id: number;
  leagueCode: LeagueCode;
  utcKickoff: string;
  status: FixtureStatus;
  home: Team;
  away: Team;
  score: { home: number | null; away: number | null };
  highlightYoutubeId?: string;
  hasKoreanPlayer?: boolean;
}

export interface HighlightVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
}

export interface SquadMember {
  id: number;
  name: string;
  position: string;       // e.g. "Goalkeeper", "Defence"
  shirtNumber?: number;
  nationality?: string;
  dateOfBirth?: string;
}

export interface TeamDetail extends Team {
  founded?: number;
  venue?: string;
  clubColors?: string;
  coach?: { name: string; nationality?: string } | null;
  squad: SquadMember[];
  runningCompetitions?: { code: string; name: string }[];
}

export interface DataSource {
  getStandings(leagueCode: LeagueCode): Promise<Standings>;
  getRecentAndUpcomingFixtures(opts: {
    leagueCodes: LeagueCode[];
    daysPast: number;
    daysFuture: number;
  }): Promise<Fixture[]>;
  getTeam(id: number): Promise<TeamDetail>;
  getRecentAndUpcomingFixturesForTeam(opts: { teamId: number; daysPast: number; daysFuture: number }): Promise<Fixture[]>;
}

export interface HighlightSource {
  getRecentVideos(opts: { maxResults: number }): Promise<HighlightVideo[]>;
}
