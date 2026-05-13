import teamData from "@/data/team-korean-names.json";
import countryData from "@/data/country-korean-names.json";

interface TeamEntry {
  id: number;
  query: string;
  names?: string[];
}

const TEAMS = teamData as TeamEntry[];
const TEAM_BY_ID = new Map(TEAMS.map((t) => [t.id, t]));
const TEAM_BY_NAME = new Map<string, TeamEntry>();
for (const t of TEAMS) {
  for (const n of t.names ?? []) TEAM_BY_NAME.set(n.toLowerCase(), t);
  TEAM_BY_NAME.set(t.query.toLowerCase(), t);
}

const COUNTRIES = countryData as Record<string, string>;

/**
 * 팀 ID 또는 영문 이름으로 한국어 표기를 찾습니다.
 * 클럽 팀이 매핑 안 됐을 때는 국가팀(월드컵 등) 매핑도 시도합니다.
 * 둘 다 없으면 입력값 그대로.
 */
export function koreanTeamName(
  teamIdOrName: number | string,
  fallback?: string
): string {
  if (typeof teamIdOrName === "number") {
    const clubMatch = TEAM_BY_ID.get(teamIdOrName)?.query;
    if (clubMatch) return clubMatch;
    // 국가팀 fallback: fallback 영문명을 koreanCountry로 시도
    if (fallback) {
      const ko = COUNTRIES[fallback];
      if (ko) return ko;
    }
    return fallback ?? String(teamIdOrName);
  }
  const clubByName = TEAM_BY_NAME.get(teamIdOrName.toLowerCase())?.query;
  if (clubByName) return clubByName;
  // 영문 이름이 국가일 수도 (예: "Mexico", "South Korea")
  const countryMatch = COUNTRIES[teamIdOrName];
  if (countryMatch) return countryMatch;
  return fallback ?? teamIdOrName;
}

/**
 * 국가 ISO 코드(또는 영문 이름)를 한국어 국가명으로. 없으면 원본 반환.
 */
export function koreanCountry(codeOrName?: string | null): string {
  if (!codeOrName) return "";
  const direct = COUNTRIES[codeOrName];
  if (direct) return direct;
  const upper = COUNTRIES[codeOrName.toUpperCase()];
  if (upper) return upper;
  return codeOrName;
}
