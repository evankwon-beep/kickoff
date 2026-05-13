import { describe, it, expect } from "vitest";
import { filterFootballHighlights } from "@/lib/highlightFilter";
import type { HighlightVideo } from "@/lib/dataSource/types";

const make = (title: string): HighlightVideo => ({
  videoId: title.slice(0, 6),
  title,
  channelTitle: "test",
  publishedAt: "2026-05-13T00:00:00Z",
  thumbnailUrl: "",
});

describe("filterFootballHighlights", () => {
  it("keeps videos with football keywords", () => {
    const videos = [
      make("[하이라이트] 토트넘 vs 첼시"),
      make("Manchester City vs Liverpool — Highlights"),
      make("EPL 38라운드 골 모음"),
    ];
    expect(filterFootballHighlights(videos)).toHaveLength(3);
  });

  it("filters out non-football videos", () => {
    const videos = [
      make("[SNL 코리아] 어느 새부터 성수는 안 멋져"),
      make("[로맨스의 절댓값] 우리 담임의 전여친"),
      make("[봉주르빵집] 주방팀의 요상한 합"),
    ];
    expect(filterFootballHighlights(videos)).toHaveLength(0);
  });

  it("excludes videos matching exclude list even if they have ambiguous words", () => {
    const videos = [
      make("SNL 골 슛 패러디"), // has "골" but also "snl"
    ];
    expect(filterFootballHighlights(videos)).toHaveLength(0);
  });
});
