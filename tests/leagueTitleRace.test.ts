import { describe, it, expect } from "vitest";
import { computeTitleRace } from "@/lib/leagueTitleRace";
import type { Standings, StandingRow } from "@/lib/dataSource/types";

const row = (id: number, position: number, points: number, played: number): StandingRow => ({
  position,
  team: { id, name: `T${id}`, shortName: `T${id}`, tla: `T${id}`, crestUrl: "" },
  playedGames: played,
  won: 0, draw: 0, lost: 0,
  points,
  goalsFor: 0, goalsAgainst: 0, goalDifference: 0,
});

describe("computeTitleRace", () => {
  it("returns clinched when leader's points exceed best-case for everyone else", () => {
    // EPL 38 matches. Leader 90pts @ 36 played (2 left, max +6 = 96).
    // 2위 60pts @ 36 played (2 left, max +6 = 66). 90 > 66 → clinched.
    const standings: Standings = {
      leagueCode: "PL",
      season: "2025/26",
      rows: [row(1, 1, 90, 36), row(2, 2, 60, 36)],
      updatedAt: "",
    };
    const t = computeTitleRace(standings);
    expect(t.leader.kind).toBe("clinched");
  });

  it("returns magic number when leader is ahead but not yet safe", () => {
    // Leader 80pts @ 35 played (3 left, max +9 = 89). 2위 75pts @ 35 played (max +9 = 84).
    // 80 vs maxOthers 84 → magic = 84+1-80 = 5
    const standings: Standings = {
      leagueCode: "PL",
      season: "2025/26",
      rows: [row(1, 1, 80, 35), row(2, 2, 75, 35)],
      updatedAt: "",
    };
    const t = computeTitleRace(standings);
    expect(t.leader.kind).toBe("magic");
    if (t.leader.kind === "magic") {
      expect(t.leader.magicNumber).toBe(5);
    }
  });

  it("flags non-leader as still-in-race when they can mathematically overtake leader's current points", () => {
    // 2위 max = 75 + 9 = 84 > leader.points 80 → still in race
    const standings: Standings = {
      leagueCode: "PL",
      season: "2025/26",
      rows: [row(1, 1, 80, 35), row(2, 2, 75, 35), row(3, 3, 50, 35)],
      updatedAt: "",
    };
    const t = computeTitleRace(standings);
    expect(t.stillInRace(2)).toBe(true);
    // 3위 max = 50 + 9 = 59 < 80 → out
    expect(t.stillInRace(3)).toBe(false);
  });

  it("uses 34-match total for Bundesliga", () => {
    // Leader 60pts @ 33 played (1 left, max +3 = 63).
    // 2위 55pts @ 33 played (1 left, max +3 = 58). 60 > 58 → clinched.
    const standings: Standings = {
      leagueCode: "BL1",
      season: "2025/26",
      rows: [row(1, 1, 60, 33), row(2, 2, 55, 33)],
      updatedAt: "",
    };
    expect(computeTitleRace(standings).leader.kind).toBe("clinched");
  });
});
