import type { DataSource, LeagueCode, Standings } from "./types";

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
  standings: { type: string; table: FdTableRow[] }[];
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

export class FootballDataSource implements Pick<DataSource, "getStandings"> {
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
}
