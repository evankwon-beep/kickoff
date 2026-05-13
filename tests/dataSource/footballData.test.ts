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
