import { describe, it, expect } from "vitest";
import { matchHighlights } from "@/lib/highlightMatcher";
import type { Fixture, HighlightVideo } from "@/lib/dataSource/types";

const team = (id: number, name: string, shortName: string, tla: string) => ({
  id, name, shortName, tla, crestUrl: "",
});

const fixtures: Fixture[] = [
  {
    id: 1, leagueCode: "PL",
    utcKickoff: "2026-05-11T14:00:00Z",
    status: "FINISHED",
    home: team(65, "Manchester City FC", "Man City", "MCI"),
    away: team(64, "Liverpool FC", "Liverpool", "LIV"),
    score: { home: 2, away: 1 },
  },
  {
    id: 2, leagueCode: "PL",
    utcKickoff: "2026-05-12T14:00:00Z",
    status: "FINISHED",
    home: team(73, "Tottenham Hotspur FC", "Tottenham", "TOT"),
    away: team(61, "Chelsea FC", "Chelsea", "CHE"),
    score: { home: 2, away: 1 },
  },
];

const videos: HighlightVideo[] = [
  {
    videoId: "abc",
    title: "[하이라이트] 토트넘 vs 첼시 | 25-26 EPL",
    channelTitle: "쿠팡플레이",
    publishedAt: "2026-05-12T22:00:00Z",
    thumbnailUrl: "",
  },
  {
    videoId: "def",
    title: "[하이라이트] 맨시티 2:1 리버풀 | 25-26 EPL",
    channelTitle: "쿠팡플레이",
    publishedAt: "2026-05-11T22:00:00Z",
    thumbnailUrl: "",
  },
];

describe("matchHighlights", () => {
  it("attaches youtube videoId to matching fixtures", () => {
    const result = matchHighlights(fixtures, videos);
    const tot = result.find((f) => f.id === 2)!;
    const mci = result.find((f) => f.id === 1)!;
    expect(tot.highlightYoutubeId).toBe("abc");
    expect(mci.highlightYoutubeId).toBe("def");
  });

  it("leaves highlightYoutubeId undefined when no match", () => {
    const result = matchHighlights(fixtures, []);
    expect(result[0].highlightYoutubeId).toBeUndefined();
  });

  it("does not match across very different dates (>3 days)", () => {
    const stale: HighlightVideo[] = [{
      videoId: "old",
      title: "[하이라이트] 맨시티 vs 리버풀",
      channelTitle: "쿠팡플레이",
      publishedAt: "2026-04-01T22:00:00Z",
      thumbnailUrl: "",
    }];
    const result = matchHighlights(fixtures, stale);
    expect(result[0].highlightYoutubeId).toBeUndefined();
  });
});
