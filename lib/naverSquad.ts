import "server-only";
import teamMap from "@/data/team-korean-names.json";

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
    return extractSquadJson(html);
  } catch {
    return null;
  }
}

export type { NaverPlayer };
