import { describe, it, expect, vi, beforeEach } from "vitest";
import fixture from "../fixtures/yt-search.json";
import { YoutubeHighlightSource } from "@/lib/dataSource/youtube";

describe("YoutubeHighlightSource.getRecentVideos", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => fixture,
    })));
  });

  it("calls YouTube search with channelId + order=date", async () => {
    const src = new YoutubeHighlightSource("api-key", "CHANNEL_ID", []);
    await src.getRecentVideos({ maxResults: 20 });

    const url = (fetch as any).mock.calls[0][0] as string;
    expect(url).toContain("https://www.googleapis.com/youtube/v3/search");
    expect(url).toContain("key=api-key");
    expect(url).toContain("channelId=CHANNEL_ID");
    expect(url).toContain("order=date");
    expect(url).toContain("type=video");
    expect(url).toContain("maxResults=20");
  });

  it("maps results to HighlightVideo shape", async () => {
    const src = new YoutubeHighlightSource("api-key", "CHANNEL_ID", []);
    const videos = await src.getRecentVideos({ maxResults: 20 });
    expect(videos).toHaveLength(2);
    expect(videos[0]).toEqual({
      videoId: "abc123",
      title: "[하이라이트] 토트넘 vs 첼시 | 25-26 EPL",
      channelTitle: "쿠팡플레이",
      publishedAt: "2026-05-12T22:30:00Z",
      thumbnailUrl: "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
    });
  });
});
