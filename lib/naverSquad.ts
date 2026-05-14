import "server-only";
import teamMap from "@/data/team-korean-names.json";
import hideListRaw from "@/data/player-hide-list.json";

const HIDE_LIST = hideListRaw as Record<string, string[] | string>;

function isHidden(fdTeamId: number, playerName: string): boolean {
  const entry = HIDE_LIST[String(fdTeamId)];
  if (!entry || typeof entry === "string") return false;
  return entry.some((n) => n === playerName || playerName.includes(n) || n.includes(playerName));
}

interface NaverPlayer {
  name: string;
  profileUrl?: string;
  countryId?: string;
  countryName?: string;
  position?: string;       // "GK" | "DF" | "MF" | "FW"
  positionName?: string;   // "골키퍼" | "수비수" | "미드필더" | "공격수"
  backNo?: string;         // shirt number as string; empty if youth/reserve
}

interface TeamMapEntry {
  id: number;
  query: string;
  names: string[];
}

const TEAM_MAP = teamMap as TeamMapEntry[];

function findMapEntry(fdTeamId: number): TeamMapEntry | undefined {
  return TEAM_MAP.find((t) => t.id === fdTeamId);
}

const SEARCH_BASE = "https://m.search.naver.com/search.naver";

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";

function extractSquadJson(html: string): NaverPlayer[] | null {
  const m = html.match(/"squad":\s*(\[[\s\S]+?\}\])/);
  if (!m) return null;
  try {
    const arr = JSON.parse(m[1]) as NaverPlayer[];
    return arr;
  } catch {
    // Fallback: regex-extract structured fields when JSON.parse fails
    const items: NaverPlayer[] = [];
    const re = /"name":"([^"]+)"[\s\S]*?"position":"([^"]*)"[\s\S]*?"positionName":"([^"]*)"[\s\S]*?"backNo":"([^"]*)"/g;
    let mm: RegExpExecArray | null;
    while ((mm = re.exec(m[1])) !== null) {
      items.push({ name: mm[1], position: mm[2], positionName: mm[3], backNo: mm[4] });
    }
    return items.length > 0 ? items : null;
  }
}

/** Returns the Naver squad (Korean names + photos) or null if not available. */
export async function fetchNaverSquad(fdTeamId: number): Promise<NaverPlayer[] | null> {
  const entry = findMapEntry(fdTeamId);
  if (!entry) return null;
  const query = `${entry.query} 선수단`;
  const url = `${SEARCH_BASE}?query=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "ko" },
      // Cache 12h per Next.js
      next: { revalidate: 43200 },
    } as RequestInit);
    if (!res.ok) return null;
    const html = await res.text();
    const squad = extractSquadJson(html);
    if (!squad) return null;
    // 이적 반영이 늦은 외부 데이터를 위한 수동 hide list 적용
    return squad.filter((p) => !isHidden(fdTeamId, p.name));
  } catch {
    return null;
  }
}

/**
 * Squad에 없거나 squad의 profileUrl이 빈 선수를 위한 fallback.
 * 네이버 검색 결과 HTML에서 인물 사진 URL을 가져온다.
 *
 * 1차: og:image (네이버 favicon/logo는 reject)
 * 2차: HTML 본문의 search.pstatic.net/common/?src=... 패턴 (인물 카드 썸네일)
 */
export async function fetchNaverPersonPhoto(
  koName: string
): Promise<string | null> {
  if (!koName) return null;
  const tryQuery = async (q: string): Promise<string | null> => {
    const url = `${SEARCH_BASE}?query=${encodeURIComponent(q)}`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, "Accept-Language": "ko" },
        next: { revalidate: 86400 },
      } as RequestInit);
      if (!res.ok) return null;
      const html = await res.text();
      // 1차: og:image — 단 네이버 기본 favicon/logo는 거름
      const og = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
      const ogUrl = og?.[1];
      if (
        ogUrl &&
        ogUrl.includes("pstatic.net") &&
        !ogUrl.includes("og_default") &&
        !ogUrl.includes("/logo/") &&
        !ogUrl.includes("naver_share") &&
        !ogUrl.includes("og_200x200") &&
        !ogUrl.includes("/favicon/")
      ) {
        return ogUrl;
      }
      // 2차: HTML 본문의 인물 카드 썸네일 (CDN proxy URL)
      // 큰 사이즈(type=f128_128 또는 f223_281 등) 우선, 없으면 작은 거라도
      const big = html.match(
        /https:\/\/search\.pstatic\.net\/common\/\?src=[^"'\s&]+(?:&amp;|&)type=f(?:128_128|223_281|180_180|200_200)/
      );
      if (big?.[0]) return big[0].replace(/&amp;/g, "&");
      const any = html.match(
        /https:\/\/search\.pstatic\.net\/common\/\?src=[^"'\s&]+(?:&amp;|&)type=f\d+_\d+/
      );
      if (any?.[0]) return any[0].replace(/&amp;/g, "&");
      return null;
    } catch {
      return null;
    }
  };
  // 한 번 시도 후, 하이픈/공백 변형도 한 번 더 시도 (예: "모건 깁스-화이트" → "모건 깁스 화이트")
  const variants = [koName];
  if (koName.includes("-")) variants.push(koName.replace(/-/g, " "));
  if (koName.includes(" ")) variants.push(koName.replace(/\s+/g, ""));
  for (const v of variants) {
    const url = await tryQuery(v);
    if (url) return url;
  }
  return null;
}

export type { NaverPlayer };
