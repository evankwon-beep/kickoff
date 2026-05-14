import type { HighlightSource, HighlightVideo } from "./types";

const BASE = "https://www.googleapis.com/youtube/v3";

interface YtSearchResponse {
  items: Array<{
    id: { kind: string; videoId?: string };
    snippet: {
      publishedAt: string;
      channelTitle: string;
      title: string;
      thumbnails: { high?: { url: string }; default?: { url: string } };
    };
  }>;
}

export class YoutubeHighlightSource implements HighlightSource {
  constructor(
    private apiKey: string,
    private primaryChannelId: string,
    private fallbackChannelIds: string[]
  ) {}

  async getRecentVideos(opts: { maxResults: number }): Promise<HighlightVideo[]> {
    const channels = [this.primaryChannelId, ...this.fallbackChannelIds].filter(Boolean);
    const results: HighlightVideo[] = [];
    for (const channelId of channels) {
      results.push(...(await this.fetchChannel(channelId, opts.maxResults)));
    }
    results.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return this.filterOutShorts(results);
  }

  private async fetchChannel(channelId: string, maxResults: number): Promise<HighlightVideo[]> {
    const params = new URLSearchParams({
      key: this.apiKey,
      channelId,
      part: "snippet",
      order: "date",
      type: "video",
      maxResults: String(maxResults),
    });
    const res = await fetch(`${BASE}/search?${params.toString()}`, {
      next: { revalidate: 3600 },
    } as RequestInit);
    if (!res.ok) throw new Error(`youtube ${res.status}`);
    const data = (await res.json()) as YtSearchResponse;
    return data.items
      .filter((i) => i.id.videoId)
      .map((i) => ({
        videoId: i.id.videoId!,
        title: i.snippet.title,
        channelTitle: i.snippet.channelTitle,
        publishedAt: i.snippet.publishedAt,
        thumbnailUrl: i.snippet.thumbnails.high?.url ?? i.snippet.thumbnails.default?.url ?? "",
      }));
  }

  /**
   * 특정 채널(들) "안에서만" 키워드 검색. 사용자 요구상 두 채널(쿠팡플레이/SPOTV)에 한정해 검색해야 할 때 사용.
   * order=date(최신순). 여러 채널이면 결과를 병합하고 publishedAt desc로 정렬한 뒤 shorts 필터를 적용한다.
   */
  async searchInChannels(
    query: string,
    channelIds: string[],
    maxResultsPerChannel = 50
  ): Promise<HighlightVideo[]> {
    const channels = channelIds.filter(Boolean);
    if (channels.length === 0) return [];
    const collected: HighlightVideo[] = [];
    const seen = new Set<string>();
    for (const channelId of channels) {
      const params = new URLSearchParams({
        key: this.apiKey,
        channelId,
        q: query,
        part: "snippet",
        order: "date",
        type: "video",
        maxResults: String(Math.min(maxResultsPerChannel, 50)),
      });
      try {
        const res = await fetch(`${BASE}/search?${params.toString()}`, {
          next: { revalidate: 3600 },
        } as RequestInit);
        if (!res.ok) continue;
        const data = (await res.json()) as YtSearchResponse;
        for (const i of data.items) {
          if (!i.id.videoId || seen.has(i.id.videoId)) continue;
          seen.add(i.id.videoId);
          collected.push({
            videoId: i.id.videoId,
            title: i.snippet.title,
            channelTitle: i.snippet.channelTitle,
            publishedAt: i.snippet.publishedAt,
            thumbnailUrl: i.snippet.thumbnails.high?.url ?? i.snippet.thumbnails.default?.url ?? "",
          });
        }
      } catch {
        // 채널 하나 실패해도 다음 채널은 계속 시도
      }
    }
    collected.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return this.filterOutShorts(collected);
  }

  private async filterOutShorts(videos: HighlightVideo[]): Promise<HighlightVideo[]> {
    if (videos.length === 0) return videos;
    // YouTube API returns up to 50 ids per call
    const chunks: string[][] = [];
    for (let i = 0; i < videos.length; i += 50) chunks.push(videos.slice(i, i + 50).map((v) => v.videoId));
    const durations = new Map<string, number>(); // videoId -> seconds
    for (const chunk of chunks) {
      const params = new URLSearchParams({
        key: this.apiKey,
        part: "contentDetails",
        id: chunk.join(","),
      });
      try {
        const res = await fetch(`${BASE}/videos?${params.toString()}`, {
          next: { revalidate: 3600 },
        } as RequestInit);
        if (!res.ok) continue;
        const data = (await res.json()) as { items?: Array<{ id: string; contentDetails?: { duration?: string } }> };
        for (const it of data.items ?? []) {
          durations.set(it.id, parseIsoDuration(it.contentDetails?.duration ?? "PT0S"));
        }
      } catch {
        // ignore; keep all videos for this chunk
      }
    }
    return videos.filter((v) => {
      const d = durations.get(v.videoId);
      // If we don't know duration, keep it (better than dropping accidentally)
      if (d === undefined) return true;
      // Shorts are <= 60 seconds. Use 70 as buffer for borderline.
      return d > 70;
    });
  }
}

function parseIsoDuration(iso: string): number {
  // PT#H#M#S → seconds
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return 0;
  const h = Number(m[1] ?? 0);
  const min = Number(m[2] ?? 0);
  const s = Number(m[3] ?? 0);
  return h * 3600 + min * 60 + s;
}
