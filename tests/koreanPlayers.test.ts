import { describe, it, expect } from "vitest";
import { tagKoreanFixtures, listKoreanPlayers } from "@/lib/koreanPlayers";
import type { Fixture } from "@/lib/dataSource/types";

const f = (id: number, homeId: number, awayId: number): Fixture => ({
  id, leagueCode: "PL",
  utcKickoff: "2026-05-12T14:00:00Z",
  status: "FINISHED",
  home: { id: homeId, name: "", shortName: "", tla: "", crestUrl: "" },
  away: { id: awayId, name: "", shortName: "", tla: "", crestUrl: "" },
  score: { home: 1, away: 0 },
});

describe("tagKoreanFixtures", () => {
  it("marks fixtures where a Korean player's team plays", () => {
    const fixtures = [f(1, 73, 64), f(2, 65, 64)];
    const result = tagKoreanFixtures(fixtures);
    expect(result[0].hasKoreanPlayer).toBe(true);
    expect(result[1].hasKoreanPlayer).toBe(false);
  });
});

describe("listKoreanPlayers", () => {
  it("returns all players", () => {
    expect(listKoreanPlayers().length).toBeGreaterThanOrEqual(5);
    expect(listKoreanPlayers().some((p) => p.name === "손흥민")).toBe(true);
  });
});
