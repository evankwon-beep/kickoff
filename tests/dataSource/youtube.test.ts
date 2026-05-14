import { describe, it, expect, vi, beforeEach } from "vitest";
import { YoutubeHighlightSource } from "@/lib/dataSource/youtube";

// playlistItems API 응답 형태로 구성 (snippet.resourceId.videoId)
function makeChannelsResponse(channelId: string, uploadsId: string) {
  return {
    items: [
      {
        id: channelId,
        contentDetails: { relatedPlaylists: { uploads: uploadsId } },
      },
    ],
  };
}

function makePlaylistItem(opts: {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumb?: string;
}) {
  return {
    snippet: {
      publishedAt: opts.publishedAt,
      channelTitle: opts.channelTitle,
      title: opts.title,
      thumbnails: { high: { url: opts.thumb ?? `https://i.ytimg.com/vi/${opts.videoId}/hqdefault.jpg` } },
      resourceId: { kind: "youtube#video", videoId: opts.videoId },
    },
  };
}

describe("YoutubeHighlightSource.getRecentVideos (playlistItems 기반)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/channels?")) {
          // channelId를 url에서 추출해 그대로 uploads에 UU로 변환
          const m = url.match(/[?&]id=([^&]+)/);
          const cid = m?.[1] ?? "UCXXX";
          const uploads = cid.replace(/^UC/, "UU");
          return { ok: true, status: 200, json: async () => makeChannelsResponse(cid, uploads) };
        }
        if (url.includes("/playlistItems?")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              items: [
                makePlaylistItem({
                  videoId: "abc123",
                  title: "[하이라이트] 토트넘 vs 첼시 | 25-26 EPL",
                  channelTitle: "쿠팡플레이",
                  publishedAt: "2026-05-12T22:30:00Z",
                }),
                makePlaylistItem({
                  videoId: "def456",
                  title: "[하이라이트] 맨시티 vs 리버풀 | 25-26 EPL",
                  channelTitle: "쿠팡플레이",
                  publishedAt: "2026-05-11T22:30:00Z",
                }),
              ],
            }),
          };
        }
        // /videos? (shorts filter) — 모두 충분히 긴 영상으로
        return {
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              { id: "abc123", contentDetails: { duration: "PT3M20S" } },
              { id: "def456", contentDetails: { duration: "PT3M20S" } },
            ],
          }),
        };
      })
    );
  });

  it("calls channels.list (contentDetails) then playlistItems.list with uploads playlist id", async () => {
    const src = new YoutubeHighlightSource("api-key", "UCnBht7BrOx-A328KFXgysqQ", []);
    await src.getRecentVideos({ maxResults: 20 });

    const calls = (fetch as unknown as { mock: { calls: [string][] } }).mock.calls.map((c) => c[0]);
    const channelsCall = calls.find((u) => u.includes("/channels?"));
    const playlistCall = calls.find((u) => u.includes("/playlistItems?"));
    expect(channelsCall).toBeDefined();
    expect(channelsCall!).toContain("key=api-key");
    expect(channelsCall!).toContain("id=UCnBht7BrOx-A328KFXgysqQ");
    expect(channelsCall!).toContain("part=contentDetails");

    expect(playlistCall).toBeDefined();
    expect(playlistCall!).toContain("key=api-key");
    expect(playlistCall!).toContain("playlistId=UUnBht7BrOx-A328KFXgysqQ");
    expect(playlistCall!).toContain("part=snippet");
    expect(playlistCall!).toContain("maxResults=20");
  });

  it("maps playlistItems results to HighlightVideo shape", async () => {
    const src = new YoutubeHighlightSource("api-key", "UCnBht7BrOx-A328KFXgysqQ", []);
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

  it("paginates playlistItems when totalMax > 50", async () => {
    // 100개 요청 → 페이지 2번 (50 + 50) 호출되어야 함
    let pageCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/channels?")) {
          return {
            ok: true,
            status: 200,
            json: async () =>
              makeChannelsResponse("UCnBht7BrOx-A328KFXgysqQ", "UUnBht7BrOx-A328KFXgysqQ"),
          };
        }
        if (url.includes("/playlistItems?")) {
          pageCount += 1;
          const items = Array.from({ length: 50 }, (_, i) =>
            makePlaylistItem({
              videoId: `p${pageCount}_${i}`,
              title: `vid ${pageCount}-${i}`,
              channelTitle: "쿠팡플레이",
              publishedAt: `2026-05-${String(13 - pageCount).padStart(2, "0")}T10:00:00Z`,
            })
          );
          return {
            ok: true,
            status: 200,
            json: async () => ({
              items,
              nextPageToken: pageCount < 2 ? `tok${pageCount}` : undefined,
            }),
          };
        }
        // /videos? — 모두 long
        return { ok: true, status: 200, json: async () => ({ items: [] }) };
      })
    );

    const src = new YoutubeHighlightSource("api-key", "UCnBht7BrOx-A328KFXgysqQ", []);
    const videos = await src.getRecentVideos({ maxResults: 100 });
    expect(pageCount).toBe(2);
    expect(videos.length).toBe(100);
  });

  it("merges videos from both primary and fallback channels", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/channels?")) {
          const m = url.match(/[?&]id=([^&]+)/);
          const cid = m?.[1] ?? "UCXXX";
          return {
            ok: true,
            status: 200,
            json: async () => makeChannelsResponse(cid, cid.replace(/^UC/, "UU")),
          };
        }
        if (url.includes("/playlistItems?")) {
          const m = url.match(/[?&]playlistId=([^&]+)/);
          const pid = m?.[1] ?? "";
          const channelTitle = pid.startsWith("UU1") ? "쿠팡플레이" : "SPOTV";
          const vidPrefix = pid.startsWith("UU1") ? "cp" : "sp";
          return {
            ok: true,
            status: 200,
            json: async () => ({
              items: [
                makePlaylistItem({
                  videoId: `${vidPrefix}1`,
                  title: `${channelTitle} highlight 1`,
                  channelTitle,
                  publishedAt: "2026-05-12T10:00:00Z",
                }),
              ],
            }),
          };
        }
        return { ok: true, status: 200, json: async () => ({ items: [] }) };
      })
    );

    const src = new YoutubeHighlightSource("api-key", "UC1AAA", ["UC2BBB"]);
    const videos = await src.getRecentVideos({ maxResults: 50 });
    const ids = videos.map((v) => v.videoId).sort();
    expect(ids).toEqual(["cp1", "sp1"]);
  });
});

describe("YoutubeHighlightSource - shorts filter", () => {
  it("removes videos shorter than ~60 seconds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/channels?")) {
          return {
            ok: true,
            status: 200,
            json: async () => makeChannelsResponse("UCAAA", "UUAAA"),
          };
        }
        if (url.includes("/playlistItems?")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              items: [
                makePlaylistItem({
                  videoId: "longvid",
                  title: "long video",
                  channelTitle: "ch",
                  publishedAt: "2026-05-13T10:00:00Z",
                }),
                makePlaylistItem({
                  videoId: "shortvid",
                  title: "short video",
                  channelTitle: "ch",
                  publishedAt: "2026-05-13T10:00:00Z",
                }),
              ],
            }),
          };
        }
        if (url.includes("/videos?")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              items: [
                { id: "longvid", contentDetails: { duration: "PT3M20S" } },
                { id: "shortvid", contentDetails: { duration: "PT45S" } },
              ],
            }),
          };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      })
    );

    const src = new YoutubeHighlightSource("k", "UCAAA", []);
    const videos = await src.getRecentVideos({ maxResults: 20 });
    const ids = videos.map((v) => v.videoId);
    expect(ids).toContain("longvid");
    expect(ids).not.toContain("shortvid");
  });
});
