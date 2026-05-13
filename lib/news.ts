import "server-only";

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  /** 출처 사이트의 도메인 (favicon URL 구성용). 없을 수 있음. */
  sourceDomain?: string;
}

function cdata(s: string | undefined): string {
  if (!s) return "";
  return s.replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").trim();
}

function extractDomain(url: string | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function parseGoogleNewsRss(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemMatches = xml.match(/<item>[\s\S]+?<\/item>/g) ?? [];
  for (const raw of itemMatches) {
    const title = cdata(raw.match(/<title>([\s\S]*?)<\/title>/)?.[1]);
    const link = cdata(raw.match(/<link>([\s\S]*?)<\/link>/)?.[1]);
    const pubDate = cdata(raw.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]);
    const source = cdata(raw.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]);
    // source 태그의 url 속성에서 진짜 출처 도메인 추출 (favicon용)
    const sourceUrl = raw.match(/<source\s+url="([^"]+)"/)?.[1] ?? "";
    const domain = extractDomain(sourceUrl);
    if (title && link) {
      items.push({
        title,
        link,
        source: source || "Google News",
        publishedAt: pubDate ? new Date(pubDate).toISOString() : "",
        sourceDomain: domain,
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
 * 팀 일반 뉴스와 이적 뉴스를 분리해서 반환.
 */
export async function fetchTeamNewsByType(
  teamKoreanName: string,
  limit = 6
): Promise<{ general: NewsItem[]; transfer: NewsItem[] }> {
  const [general, transfer] = await Promise.all([
    fetchGoogleNews(`${teamKoreanName} 축구`),
    fetchGoogleNews(`${teamKoreanName} 이적`),
  ]);
  const transferLinks = new Set(transfer.map((t) => t.link));
  // 일반 쿼리 결과에서 이적 결과와 겹치는 건 제거 (이적쪽에만 노출)
  const generalOnly = general.filter((g) => !transferLinks.has(g.link));
  generalOnly.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  transfer.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return {
    general: generalOnly.slice(0, limit),
    transfer: transfer.slice(0, limit),
  };
}

/**
 * (호환용) 합친 뉴스. 새 UI는 위 fetchTeamNewsByType 사용.
 */
export async function fetchTeamNews(teamKoreanName: string, limit = 10): Promise<NewsItem[]> {
  const { general, transfer } = await fetchTeamNewsByType(teamKoreanName, limit);
  const seen = new Set<string>();
  const merged: NewsItem[] = [];
  for (const it of [...transfer, ...general]) {
    if (seen.has(it.link)) continue;
    seen.add(it.link);
    merged.push(it);
  }
  merged.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return merged.slice(0, limit);
}
