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
  it("keeps full-match highlight videos with league keyword", () => {
    const videos = [
      make("[하이라이트] 토트넘 vs 첼시 | EPL 38라운드"),
      make("[라리가] 36R 오사수나 vs AT마드리드 2분 하이라이트"),
      make("EPL 38라운드 골 모음"),
      make("Champions League Final Highlights — Real vs Inter"),
    ];
    expect(filterFootballHighlights(videos)).toHaveLength(4);
  });

  it("filters out non-football videos", () => {
    const videos = [
      make("[SNL 코리아] 어느 새부터 성수는 안 멋져"),
      make("[로맨스의 절댓값] 우리 담임의 전여친"),
      make("[봉주르빵집] 주방팀의 요상한 합"),
    ];
    expect(filterFootballHighlights(videos)).toHaveLength(0);
  });

  it("filters out non-football sports (MLB/NBA) even with 'highlights' keyword", () => {
    const videos = [
      make("샌디에이고 vs 밀워키｜5분 하이라이트｜2026 MLB"),
      make("[NBA 플레이오프] 미네소타 vs 샌안토니오 주요장면"),
    ];
    expect(filterFootballHighlights(videos)).toHaveLength(0);
  });

  it("filters out K리그 (domestic) videos — user wants overseas only", () => {
    const videos = [
      make("골키퍼를 얼어붙게 만든 김주찬의 감아차기 | 2026 K리그1"),
      make("[K리그1 하이라이트] 안양 vs 김천"),
    ];
    expect(filterFootballHighlights(videos)).toHaveLength(0);
  });

  it("filters out previews/reviews even if they look like football", () => {
    const videos = [
      make("정상빈과 손흥민의 맞대결 l LAFC 프리뷰 l EPL"),
      make("EPL 38라운드 리뷰"),
    ];
    expect(filterFootballHighlights(videos)).toHaveLength(0);
  });

  it("excludes videos matching exclude list even if they have ambiguous words", () => {
    const videos = [
      make("SNL 골 슛 패러디"),
    ];
    expect(filterFootballHighlights(videos)).toHaveLength(0);
  });
});
