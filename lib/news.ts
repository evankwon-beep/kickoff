import "server-only";

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
}

function cdata(s: string | undefined): string {
  if (!s) return "";
  return s.replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").trim();
}

function parseGoogleNewsRss(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemMatches = xml.match(/<item>[\s\S]+?<\/item>/g) ?? [];
  for (const raw of itemMatches) {
    const title = cdata(raw.match(/<title>([\s\S]*?)<\/title>/)?.[1]);
    const link = cdata(raw.match(/<link>([\s\S]*?)<\/link>/)?.[1]);
    const pubDate = cdata(raw.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]);
    const source = cdata(raw.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]);
    if (title && link) {
      items.push({
        title,
        link,
        source: source || "Google News",
        publishedAt: pubDate ? new Date(pubDate).toISOString() : "",
      });
    }
  }
  return items;
}

async function fetchGoogleNews(query: string): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 1800 }, // 30분 캐시
    } as RequestInit);
    if (!res.ok) return [];
    const xml = await res.text();
    return parseGoogleNewsRss(xml);
  } catch {
    return [];
  }
}

/**
 * 팀 관련 일반 뉴스 + 이적 뉴스를 합쳐서 반환. 중복 제거 + 최신순 정렬.
 */
export async function fetchTeamNews(teamKoreanName: string, limit = 10): Promise<NewsItem[]> {
  const [general, transfer] = await Promise.all([
    fetchGoogleNews(`${teamKoreanName} 축구`),
    fetchGoogleNews(`${teamKoreanName} 이적`),
  ]);
  const seen = new Set<string>();
  const merged: NewsItem[] = [];
  // 이적 뉴스를 위쪽으로 가게 (사용자 의도)
  for (const it of [...transfer, ...general]) {
    if (seen.has(it.link)) continue;
    seen.add(it.link);
    merged.push(it);
  }
  // 최신순 정렬
  merged.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return merged.slice(0, limit);
}
