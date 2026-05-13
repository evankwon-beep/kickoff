import { describe, it, expect, vi, beforeEach } from "vitest";
import fixture from "../fixtures/fd-standings-pl.json";
import matchesFixture from "../fixtures/fd-matches.json";
import { FootballDataSource } from "@/lib/dataSource/footballData";

describe("FootballDataSource.getStandings", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => fixture,
    })));
  });

  it("calls correct endpoint with auth token", async () => {
    const ds = new FootballDataSource("test-token");
    await ds.getStandings("PL");

    const call = (fetch as any).mock.calls[0];
    expect(call[0]).toBe("https://api.football-data.org/v4/competitions/PL/standings");
    expect(call[1].headers["X-Auth-Token"]).toBe("test-token");
  });

  it("maps response to Standings shape", async () => {
    const ds = new FootballDataSource("test-token");
    const s = await ds.getStandings("PL");

    expect(s.leagueCode).toBe("PL");
    expect(s.season).toBe("2025/26");
    expect(s.rows).toHaveLength(2);
    expect(s.rows[0]).toMatchObject({
      position: 1,
      points: 71,
      team: { id: 64, tla: "LIV", crestUrl: "https://crests.football-data.org/64.png" },
    });
  });
});

describe("FootballDataSource.getRecentAndUpcomingFixtures", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => matchesFixture,
    })));
  });

  it("queries date range with leagueCodes filter", async () => {
    const ds = new FootballDataSource("test-token");
    await ds.getRecentAndUpcomingFixtures({
      leagueCodes: ["PL", "PD"],
      daysPast: 3,
      daysFuture: 7,
    });

    const url = (fetch as any).mock.calls[0][0] as string;
    expect(url).toContain("https://api.football-data.org/v4/matches");
    expect(url).toContain("competitions=PL%2CPD");
    expect(url).toMatch(/dateFrom=\d{4}-\d{2}-\d{2}/);
    expect(url).toMatch(/dateTo=\d{4}-\d{2}-\d{2}/);
  });

  it("maps to Fixture shape", async () => {
    const ds = new FootballDataSource("test-token");
    const fixtures = await ds.getRecentAndUpcomingFixtures({
      leagueCodes: ["PL"],
      daysPast: 3,
      daysFuture: 7,
    });

    expect(fixtures).toHaveLength(2);
    expect(fixtures[0]).toMatchObject({
      id: 1001,
      leagueCode: "PL",
      utcKickoff: "2026-05-14T19:00:00Z",
      status: "SCHEDULED",
      home: { tla: "MCI" },
      away: { tla: "LIV" },
      score: { home: null, away: null },
    });
    expect(fixtures[1].score).toEqual({ home: 2, away: 1 });
    expect(fixtures[1].status).toBe("FINISHED");
  });
});

const teamFixture = {
  id: 73,
  name: "Tottenham Hotspur FC",
  shortName: "Tottenham",
  tla: "TOT",
  crest: "https://crests.football-data.org/73.png",
  founded: 1882,
  venue: "Tottenham Hotspur Stadium",
  clubColors: "Navy Blue / White",
  coach: { name: "Ange Postecoglou", nationality: "Australia" },
  squad: [
    { id: 3754, name: "Heung-min Son", position: "Offence", shirtNumber: 7, nationality: "South Korea", dateOfBirth: "1992-07-08" },
    { id: 7888, name: "Guglielmo Vicario", position: "Goalkeeper", shirtNumber: 13, nationality: "Italy" },
  ],
  runningCompetitions: [
    { code: "PL", name: "Premier League" },
    { code: "EL", name: "UEFA Europa League" },
  ],
};

describe("FootballDataSource.getTeam", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => teamFixture,
    })));
  });

  it("calls /teams/{id} and maps detail", async () => {
    const ds = new FootballDataSource("test-token");
    const t = await ds.getTeam(73);
    expect((fetch as any).mock.calls[0][0]).toBe(
      "https://api.football-data.org/v4/teams/73"
    );
    expect(t.id).toBe(73);
    expect(t.tla).toBe("TOT");
    expect(t.founded).toBe(1882);
    expect(t.coach?.name).toBe("Ange Postecoglou");
    expect(t.squad).toHaveLength(2);
    expect(t.squad[0]).toMatchObject({ id: 3754, shirtNumber: 7, nationality: "South Korea" });
    expect(t.runningCompetitions).toEqual([
      { code: "PL", name: "Premier League" },
      { code: "EL", name: "UEFA Europa League" },
    ]);
  });
});

const groupFixture = {
  competition: { code: "WC", name: "FIFA World Cup" },
  season: { startDate: "2026-06-11", endDate: "2026-07-19" },
  standings: [
    {
      type: "TOTAL",
      group: "Group A",
      table: [
        { position: 1, team: { id: 770, name: "Mexico", tla: "MEX", crest: "" }, playedGames: 0, won: 0, draw: 0, lost: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 },
        { position: 2, team: { id: 771, name: "South Africa", tla: "RSA", crest: "" }, playedGames: 0, won: 0, draw: 0, lost: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 },
      ],
    },
    {
      type: "TOTAL",
      group: "Group B",
      table: [
        { position: 1, team: { id: 772, name: "South Korea", tla: "KOR", crest: "" }, playedGames: 0, won: 0, draw: 0, lost: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 },
      ],
    },
  ],
};

describe("FootballDataSource.getGroupStandings", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true, status: 200,
      json: async () => groupFixture,
    })));
  });

  it("returns one entry per group with mapped standings", async () => {
    const ds = new FootballDataSource("test-token");
    const result = await ds.getGroupStandings("WC");
    expect(result).toHaveLength(2);
    expect(result[0].group).toBe("Group A");
    expect(result[0].standings.rows).toHaveLength(2);
    expect(result[1].group).toBe("Group B");
    expect(result[1].standings.rows[0].team.tla).toBe("KOR");
  });
});
