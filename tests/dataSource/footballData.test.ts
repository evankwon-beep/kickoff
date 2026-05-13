import { describe, it, expect, vi, beforeEach } from "vitest";
import fixture from "../fixtures/fd-standings-pl.json";
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
