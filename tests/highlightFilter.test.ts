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
  it("passes top-team mentions (full highlights, clips, VAR moments)", () => {
    const videos = [
      make("[라리가] 36R 오사수나 vs AT.마드리드 2분 하이라이트"),
      make("희비가 교차하는 VAR 결과 l 라리가 I 오사수나 vs AT.마드리드"),
      make("팜플로나 원정에서 먼저 득점하는 AT.마드리드"),
      make("[25/26 세리에A] 36R 라치오 vs 인터 밀란 3분 하이라이트"),
      make("Bayern Munich 4-1 Dortmund — Full Highlights"),
    ];
    expect(filterFootballHighlights(videos).length).toBeGreaterThanOrEqual(4);
  });

  it("filters out other sports", () => {
    const videos = [
      make("샌디에이고 vs 밀워키｜5분 하이라이트｜2026 MLB"),
      make("[NBA 플레이오프] 미네소타 vs 샌안토니오 주요장면"),
      make("포디엄 눈앞에서 8위까지? 르끌레르 마이애미 잔혹사ㅣ2026 F1"),
    ];
    expect(filterFootballHighlights(videos)).toHaveLength(0);
  });

  it("filters out K리그 (domestic)", () => {
    const videos = [
      make("골키퍼를 얼어붙게 만든 김주찬의 감아차기 | 2026 K리그1"),
      make("[K리그1 하이라이트] 안양 vs 김천"),
    ];
    expect(filterFootballHighlights(videos)).toHaveLength(0);
  });

  it("filters out reviews/previews/analysis/issues clips", () => {
    const videos = [
      make("PL 우승 싸움은 아직도 진행 중 l 프리미어리그 이슈 l 쿠팡플레이"),
      make("토트넘은 아직도 강등 위기 l 토트넘 이슈"),
      make("정상빈과 손흥민의 맞대결 l LAFC 프리뷰"),
      make("EPL 36R 리뷰"),
      make("토트넘 현지 해설"),
    ];
    expect(filterFootballHighlights(videos)).toHaveLength(0);
  });

  it("filters out non-football videos", () => {
    const videos = [
      make("[SNL 코리아] 어느 새부터 성수는 안 멋져"),
      make("[로맨스의 절댓값] 우리 담임의 전여친"),
    ];
    expect(filterFootballHighlights(videos)).toHaveLength(0);
  });
});
