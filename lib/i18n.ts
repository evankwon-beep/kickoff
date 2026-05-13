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
 * 팀 ID 또는 영문 이름으로 한국어 표기를 찾습니다. 없으면 입력값 그대로.
 */
export function koreanTeamName(
  teamIdOrName: number | string,
  fallback?: string
): string {
  if (typeof teamIdOrName === "number") {
    return TEAM_BY_ID.get(teamIdOrName)?.query ?? fallback ?? String(teamIdOrName);
  }
  return (
    TEAM_BY_NAME.get(teamIdOrName.toLowerCase())?.query ??
    fallback ??
    teamIdOrName
  );
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
