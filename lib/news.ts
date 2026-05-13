import "server-only";

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  /** 출처 사이트의 도메인 (fallback용). 없을 수 있음. */
  sourceDomain?: string;
  /** 기사 본문에서 가져온 대표 이미지(og:image). 없으면 undefined. */
  imageUrl?: string;
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

function extractOgImage(html: string): string | null {
  // og:image / twitter:image 둘 다 시도
  const patterns = [
    /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
    /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i,
    /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
    /<meta\s+content=["']([^"']+)["']\s+name=["']twitter:image["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return null;
}

async function fetchArticleImage(url: string): Promise<string | null> {
  try {
    // 1.5초 타임아웃: 느린 기사 사이트가 페이지 전체를 지연시키지 않도록
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
      redirect: "follow",
      signal: controller.signal,
      // 12시간 캐시
      next: { revalidate: 43200 },
    } as RequestInit);
    clearTimeout(timer);
    if (!res.ok) return null;
    const text = await res.text();
    const img = extractOgImage(text);
    if (!img) return null;
    // 상대 경로면 절대 경로로
    if (img.startsWith("//")) return `https:${img}`;
    if (img.startsWith("/")) {
      try {
        const u = new URL(url);
        return `${u.origin}${img}`;
      } catch {
        return null;
      }
    }
    return img;
  } catch {
    return null;
  }
}

async function enrichWithImages(items: NewsItem[]): Promise<NewsItem[]> {
  // 병렬로 처리 (각 1.5초 타임아웃이라 전체 ~1.5초)
  const results = await Promise.all(
    items.map(async (it) => {
      const imageUrl = await fetchArticleImage(it.link);
      return imageUrl ? { ...it, imageUrl } : it;
    })
  );
  return results;
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
  limit = 3
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

  // limit 개수만큼 자르고 OG 이미지 보강 (느린 기사 사이트는 타임아웃으로 패스)
  const [generalEnriched, transferEnriched] = await Promise.all([
    enrichWithImages(generalOnly.slice(0, limit)),
    enrichWithImages(transfer.slice(0, limit)),
  ]);

  return {
    general: generalEnriched,
    transfer: transferEnriched,
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
