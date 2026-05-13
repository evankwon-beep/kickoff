import marketValues from "@/data/player-market-values.json";
import type { LeagueCode } from "./dataSource/types";

interface SectionInfo {
  teamId: number;
  league: LeagueCode;
  teamName: string;
}

// 매핑 JSON의 섹션 마커 → 팀 ID + 리그 코드 + 팀명
const SECTION: Record<string, SectionInfo> = {
  arsenal: { teamId: 57, league: "PL", teamName: "아스널" },
  mancity: { teamId: 65, league: "PL", teamName: "맨시티" },
  manunited: { teamId: 66, league: "PL", teamName: "맨유" },
  liverpool: { teamId: 64, league: "PL", teamName: "리버풀" },
  tottenham: { teamId: 73, league: "PL", teamName: "토트넘" },
  chelsea: { teamId: 61, league: "PL", teamName: "첼시" },
  astonvilla: { teamId: 58, league: "PL", teamName: "아스톤 빌라" },
  newcastle: { teamId: 67, league: "PL", teamName: "뉴캐슬" },
  bournemouth: { teamId: 1044, league: "PL", teamName: "본머스" },
  barcelona: { teamId: 81, league: "PD", teamName: "바르셀로나" },
  realmadrid: { teamId: 86, league: "PD", teamName: "레알 마드리드" },
  atletico: { teamId: 78, league: "PD", teamName: "AT마드리드" },
  realbetis: { teamId: 90, league: "PD", teamName: "베티스" },
  athletic: { teamId: 77, league: "PD", teamName: "아틀레틱" },
  realsociedad: { teamId: 92, league: "PD", teamName: "레알 소시에다드" },
  celta: { teamId: 558, league: "PD", teamName: "셀타 비고" },
  villarreal: { teamId: 94, league: "PD", teamName: "비야레알" },
  bayern: { teamId: 5, league: "BL1", teamName: "바이에른" },
  dortmund: { teamId: 4, league: "BL1", teamName: "도르트문트" },
  leverkusen: { teamId: 3, league: "BL1", teamName: "레버쿠젠" },
  leipzig: { teamId: 721, league: "BL1", teamName: "RB 라이프치히" },
  stuttgart: { teamId: 10, league: "BL1", teamName: "슈투트가르트" },
  frankfurt: { teamId: 36, league: "BL1", teamName: "프랑크푸르트" },
  inter: { teamId: 108, league: "SA", teamName: "인테르" },
  juventus: { teamId: 109, league: "SA", teamName: "유벤투스" },
  napoli: { teamId: 113, league: "SA", teamName: "나폴리" },
  milan: { teamId: 98, league: "SA", teamName: "AC 밀란" },
  roma: { teamId: 100, league: "SA", teamName: "AS 로마" },
  lazio: { teamId: 110, league: "SA", teamName: "라치오" },
  atalanta: { teamId: 102, league: "SA", teamName: "아탈란타" },
  fiorentina: { teamId: 99, league: "SA", teamName: "피오렌티나" },
};

export interface LeagueStarPlayer {
  name: string;
  teamId: number;
  teamName: string;
  league: LeagueCode;
  valueBillionWon: number;
  crestUrl: string;
}

function build(): LeagueStarPlayer[] {
  const out: LeagueStarPlayer[] = [];
  let current: SectionInfo | null = null;
  for (const [key, value] of Object.entries(marketValues as Record<string, unknown>)) {
    if (key.startsWith("_")) {
      const m = key.slice(1);
      current = SECTION[m] ?? null;
      continue;
    }
    if (typeof value !== "number" || value <= 0 || !current) continue;
    out.push({
      name: key,
      teamId: current.teamId,
      teamName: current.teamName,
      league: current.league,
      valueBillionWon: value,
      crestUrl: `https://crests.football-data.org/${current.teamId}.png`,
    });
  }
  return out;
}

const ALL = build();

/** 리그 코드별 시장가치 top N (alias dedupe 포함). */
export function topByLeague(league: LeagueCode, n = 5): LeagueStarPlayer[] {
  const players = ALL.filter((p) => p.league === league);
  // 같은 팀 + 같은 가치 = alias 가능성 → 첫 등장만 유지
  const seen = new Set<string>();
  const unique: LeagueStarPlayer[] = [];
  for (const p of players.sort((a, b) => b.valueBillionWon - a.valueBillionWon)) {
    const key = `${p.teamId}::${p.valueBillionWon}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(p);
    if (unique.length >= n) break;
  }
  return unique;
}
