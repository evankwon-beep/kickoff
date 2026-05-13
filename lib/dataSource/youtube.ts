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
    return results.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
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
}
