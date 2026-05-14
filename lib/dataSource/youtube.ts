import type { HighlightSource, HighlightVideo } from "./types";

const BASE = "https://www.googleapis.com/youtube/v3";

interface YtChannelsResponse {
  items?: Array<{
    id: string;
    contentDetails?: {
      relatedPlaylists?: {
        uploads?: string;
      };
    };
  }>;
}

interface YtPlaylistItem {
  snippet: {
    publishedAt: string;
    channelTitle: string;
    title: string;
    thumbnails: { high?: { url: string }; default?: { url: string } };
    resourceId: { kind: string; videoId: string };
  };
}

interface YtPlaylistItemsResponse {
  items?: YtPlaylistItem[];
  nextPageToken?: string;
}

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

/**
 * YouTube 하이라이트 어댑터.
 *
 * quota 절감 전략:
 * - search.list 대신 channels.list + playlistItems.list 사용
 *   - search.list: 100 unit/call
 *   - channels.list (contentDetails): 1 unit/call
 *   - playlistItems.list (snippet): 1 unit/call
 * - 채널마다 "uploads playlist"가 자동으로 생성됨 (관계: 채널 ID 의 'UC...' → playlist ID 'UU...').
 *   playlistItems로 채널의 최신 업로드를 페이지네이션으로 가져오면 search.list?order=date와 동일한 효과.
 *
 * 캐시:
 * - uploads playlist id: 채널마다 변하지 않으므로 1주(604800초) revalidate + 메모리 캐시
 * - playlistItems: 4시간(14400초) revalidate
 */
export class YoutubeHighlightSource implements HighlightSource {
  private uploadsPlaylistCache = new Map<string, string>();

  constructor(
    private apiKey: string,
    private primaryChannelId: string,
    private fallbackChannelIds: string[]
  ) {}

  async getRecentVideos(opts: { maxResults: number }): Promise<HighlightVideo[]> {
    const channels = [this.primaryChannelId, ...this.fallbackChannelIds].filter(Boolean);
    const perChannelMax = Math.max(1, opts.maxResults);
    const results: HighlightVideo[] = [];
    for (const channelId of channels) {
      try {
        const items = await this.fetchChannelUploads(channelId, perChannelMax);
        results.push(...items);
      } catch {
        // 하나의 채널이 실패해도 나머지는 계속
      }
    }
    // 중복 제거 (같은 영상이 두 채널에 동시 업로드되는 경우는 거의 없지만 안전망)
    const seen = new Set<string>();
    const deduped: HighlightVideo[] = [];
    for (const v of results) {
      if (seen.has(v.videoId)) continue;
      seen.add(v.videoId);
      deduped.push(v);
    }
    deduped.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return this.filterOutShorts(deduped);
  }

  /**
   * 특정 채널의 업로드 playlist id를 가져온다.
   * - 채널 ID는 UC로 시작하고, uploads playlist id는 보통 UU로 시작 (UC → UU)
   *   다만 공식 API에서 반환되는 값을 그대로 쓰는 게 안전.
   * - 메모리 캐시 + Next.js fetch revalidate 1주.
   */
  private async resolveUploadsPlaylist(channelId: string): Promise<string | null> {
    const cached = this.uploadsPlaylistCache.get(channelId);
    if (cached) return cached;

    const params = new URLSearchParams({
      key: this.apiKey,
      id: channelId,
      part: "contentDetails",
    });
    const res = await fetch(`${BASE}/channels?${params.toString()}`, {
      next: { revalidate: 604800 },
    } as RequestInit);
    if (!res.ok) return null;
    const data = (await res.json()) as YtChannelsResponse;
    const uploads = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploads) return null;
    this.uploadsPlaylistCache.set(channelId, uploads);
    return uploads;
  }

  /**
   * 채널의 업로드 playlistItems를 totalMax 만큼 페이지네이션으로 가져온다.
   * playlistItems는 한 페이지 최대 50개. 그 이상이 필요하면 nextPageToken으로 다음 페이지.
   */
  private async fetchChannelUploads(
    channelId: string,
    totalMax: number
  ): Promise<HighlightVideo[]> {
    const uploadsId = await this.resolveUploadsPlaylist(channelId);
    if (!uploadsId) return [];

    const collected: HighlightVideo[] = [];
    let pageToken: string | undefined = undefined;
    // 안전한 페이지 상한: totalMax 50개 페이지 + 1 (혹시 모를 빈 페이지 대비)
    const maxPages = Math.ceil(Math.max(1, totalMax) / 50) + 1;
    for (let page = 0; page < maxPages; page++) {
      if (collected.length >= totalMax) break;
      const perPage = Math.min(50, Math.max(1, totalMax - collected.length));
      const params = new URLSearchParams({
        key: this.apiKey,
        playlistId: uploadsId,
        part: "snippet",
        maxResults: String(perPage),
      });
      if (pageToken) params.set("pageToken", pageToken);
      const res = await fetch(`${BASE}/playlistItems?${params.toString()}`, {
        // 영상 풀은 자주 갱신. playlistItems는 1 unit/call이라 1시간 캐시도 quota 안전.
        next: { revalidate: 3600 },
      } as RequestInit);
      if (!res.ok) break;
      const data = (await res.json()) as YtPlaylistItemsResponse;
      for (const item of data.items ?? []) {
        const videoId = item.snippet?.resourceId?.videoId;
        if (!videoId) continue;
        collected.push({
          videoId,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          thumbnailUrl:
            item.snippet.thumbnails.high?.url ?? item.snippet.thumbnails.default?.url ?? "",
        });
      }
      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
    }
    return collected;
  }

  /**
   * 특정 채널(들) "안에서만" 키워드 검색.
   * 두 채널(쿠팡플레이/SPOTV)에 한정해 검색해야 할 때 사용.
   *
   * 주의: 이 메서드는 search.list(100 unit/call)를 사용한다. 호출 시 quota 비용이 크므로
   * 가능하면 getRecentVideos로 받은 풀에 대해 client-side filter를 권장.
   * 현재 호출자(`lib/dataSource/index.ts`)는 client-side filter로 전환되어 사용 안 함.
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
          next: { revalidate: 21600 },
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
          next: { revalidate: 21600 },
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
