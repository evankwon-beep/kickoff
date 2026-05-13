import type { DataSource, LeagueCode, Standings, Fixture, TeamDetail } from "./types";

const BASE = "https://api.football-data.org/v4";

interface FdTeam {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
}

interface FdStandingsResponse {
  season: { startDate: string; endDate: string };
  standings: { type: string; group?: string; table: FdTableRow[] }[];
}

interface FdTableRow {
  position: number;
  team: FdTeam;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

function mapTeam(t: FdTeam) {
  return {
    id: t.id,
    name: t.name,
    shortName: t.shortName ?? t.name,
    tla: t.tla ?? "",
    crestUrl: t.crest ?? "",
  };
}

function seasonLabel(startDate: string, endDate: string): string {
  const start = new Date(startDate).getUTCFullYear();
  const end = new Date(endDate).getUTCFullYear();
  return `${start}/${end.toString().slice(2)}`;
}

export class FootballDataSource implements DataSource {
  constructor(private token: string) {}

  private async fetchJson<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "X-Auth-Token": this.token },
      next: { revalidate: 3600 },
    } as RequestInit);
    if (!res.ok) {
      throw new Error(`football-data ${path} ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  async getStandings(leagueCode: LeagueCode): Promise<Standings> {
    const data = await this.fetchJson<FdStandingsResponse>(
      `/competitions/${leagueCode}/standings`
    );
    const total = data.standings.find((s) => s.type === "TOTAL") ?? data.standings[0];
    return {
      leagueCode,
      season: seasonLabel(data.season.startDate, data.season.endDate),
      rows: total.table.map((r) => ({
        position: r.position,
        team: mapTeam(r.team),
        playedGames: r.playedGames,
        won: r.won,
        draw: r.draw,
        lost: r.lost,
        points: r.points,
        goalsFor: r.goalsFor,
        goalsAgainst: r.goalsAgainst,
        goalDifference: r.goalDifference,
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  async getGroupStandings(leagueCode: LeagueCode): Promise<{ group: string; standings: Standings }[]> {
    const data = await this.fetchJson<FdStandingsResponse>(
      `/competitions/${leagueCode}/standings`
    );
    const groups = data.standings.filter((s) => s.type === "TOTAL" && s.group);
    return groups.map((g) => ({
      group: g.group!,
      standings: {
        leagueCode,
        season: seasonLabel(data.season.startDate, data.season.endDate),
        rows: g.table.map((r) => ({
          position: r.position,
          team: mapTeam(r.team),
          playedGames: r.playedGames,
          won: r.won,
          draw: r.draw,
          lost: r.lost,
          points: r.points,
          goalsFor: r.goalsFor,
          goalsAgainst: r.goalsAgainst,
          goalDifference: r.goalDifference,
        })),
        updatedAt: new Date().toISOString(),
      },
    }));
  }

  async getRecentAndUpcomingFixtures(opts: {
    leagueCodes: LeagueCode[];
    daysPast: number;
    daysFuture: number;
  }): Promise<Fixture[]> {
    const now = new Date();
    const from = new Date(now.getTime() - opts.daysPast * 86_400_000);
    const to = new Date(now.getTime() + opts.daysFuture * 86_400_000);
    const dateFrom = from.toISOString().slice(0, 10);
    const dateTo = to.toISOString().slice(0, 10);

    const params = new URLSearchParams({
      competitions: opts.leagueCodes.join(","),
      dateFrom,
      dateTo,
    });

    const data = await this.fetchJson<{ matches: FdMatch[] }>(
      `/matches?${params.toString()}`
    );

    return data.matches.map(mapMatch);
  }

  async getTeam(id: number): Promise<TeamDetail> {
    const data = await this.fetchJson<FdTeamDetail>(`/teams/${id}`);
    return {
      id: data.id,
      name: data.name,
      shortName: data.shortName ?? data.name,
      tla: data.tla ?? "",
      crestUrl: data.crest ?? "",
      founded: data.founded,
      venue: data.venue,
      clubColors: data.clubColors,
      coach: data.coach
        ? { name: data.coach.name, nationality: data.coach.nationality }
        : null,
      squad: (data.squad ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        position: p.position ?? "",
        shirtNumber: p.shirtNumber,
        nationality: p.nationality,
        dateOfBirth: p.dateOfBirth,
      })),
      runningCompetitions: (data.runningCompetitions ?? []).map((c) => ({
        code: c.code,
        name: c.name,
      })),
    };
  }

  async getRecentAndUpcomingFixturesForTeam(opts: {
    teamId: number;
    daysPast: number;
    daysFuture: number;
  }): Promise<Fixture[]> {
    const now = new Date();
    const from = new Date(now.getTime() - opts.daysPast * 86_400_000);
    const to = new Date(now.getTime() + opts.daysFuture * 86_400_000);
    const params = new URLSearchParams({
      dateFrom: from.toISOString().slice(0, 10),
      dateTo: to.toISOString().slice(0, 10),
    });
    const data = await this.fetchJson<{ matches: FdMatch[] }>(
      `/teams/${opts.teamId}/matches?${params.toString()}`
    );
    return data.matches.map(mapMatch);
  }
}

interface FdMatch {
  id: number;
  competition: { code: string };
  utcDate: string;
  status: string;
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score: { fullTime: { home: number | null; away: number | null } };
}

interface FdTeamDetail {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
  founded?: number;
  venue?: string;
  clubColors?: string;
  coach?: { name: string; nationality?: string } | null;
  squad?: Array<{
    id: number;
    name: string;
    position?: string;
    shirtNumber?: number;
    nationality?: string;
    dateOfBirth?: string;
  }>;
  runningCompetitions?: Array<{ code: string; name: string }>;
}

function mapMatch(m: FdMatch): Fixture {
  return {
    id: m.id,
    leagueCode: m.competition.code as LeagueCode,
    utcKickoff: m.utcDate,
    status: m.status as Fixture["status"],
    home: mapTeam(m.homeTeam),
    away: mapTeam(m.awayTeam),
    score: { home: m.score.fullTime.home, away: m.score.fullTime.away },
  };
}
