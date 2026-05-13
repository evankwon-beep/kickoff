import type { HighlightVideo, Team } from "./dataSource/types";

// Football keywords (Korean + English). Title must contain at least one.
const FOOTBALL_KEYWORDS = [
  "하이라이트", "highlight", "highlights",
  "골", "goal", "goals",
  "축구", "football", "soccer",
  "epl", "프리미어리그", "premier league",
  "라리가", "la liga", "laliga",
  "분데스", "bundesliga",
  "세리에", "serie a",
  "챔피언스", "champions league", "ucl",
  "유로파", "europa", "uel",
  "fa컵", "fa cup",
  "월드컵", "world cup",
  "vs.", " vs ", "대",
];

// Common non-football content keywords that should disqualify a video even if
// the channel sometimes posts football.
const EXCLUDE_KEYWORDS = [
  "snl", "드라마", "예능", "코미디", "예고편",
  "movie", "드라마티즈", "토크쇼", "키즈",
  "[로맨스", "[봉주르", "성수", "한가인",
];

function looksLikeFootball(title: string): boolean {
  const lower = title.toLowerCase();
  if (EXCLUDE_KEYWORDS.some((k) => lower.includes(k.toLowerCase()))) return false;
  return FOOTBALL_KEYWORDS.some((k) => lower.includes(k.toLowerCase()));
}

export function filterFootballHighlights(videos: HighlightVideo[]): HighlightVideo[] {
  return videos.filter((v) => looksLikeFootball(v.title));
}

const TEAM_NAME_ALIASES: Record<string, string[]> = {
  // EPL
  "Manchester City FC": ["맨시티", "맨체스터 시티", "manchester city", "man city", "mci"],
  "Liverpool FC": ["리버풀", "liverpool", "liv"],
  "Tottenham Hotspur FC": ["토트넘", "tottenham", "spurs", "tot"],
  "Chelsea FC": ["첼시", "chelsea", "che"],
  "Arsenal FC": ["아스널", "아스날", "arsenal", "ars"],
  "Manchester United FC": ["맨유", "맨체스터 유나이티드", "manchester united", "man utd", "mun"],
  "Wolverhampton Wanderers FC": ["울브스", "울버햄튼", "wolves", "wolverhampton", "wol"],
  // 라리가
  "Real Madrid CF": ["레알", "레알마드리드", "real madrid", "rma"],
  "FC Barcelona": ["바르사", "바르셀로나", "barcelona", "bar"],
  "Club Atlético de Madrid": ["AT마드리드", "아틀레티코", "atletico", "atm"],
  // 분데스
  "FC Bayern München": ["바이언", "뮌헨", "bayern", "fcb"],
  "Bayer 04 Leverkusen": ["레버쿠젠", "leverkusen", "b04"],
  "Borussia Dortmund": ["도르트문트", "도르트", "dortmund", "bvb"],
  // 세리에
  "FC Internazionale Milano": ["인테르", "inter"],
  "Juventus FC": ["유베", "유벤투스", "juventus", "juv"],
  "AC Milan": ["AC밀란", "밀란", "milan", "mil"],
  "Atalanta BC": ["아탈란타", "atalanta"],
};

function teamAliases(team: Team): string[] {
  const explicit = TEAM_NAME_ALIASES[team.name];
  const base = [team.name, team.shortName, team.tla].filter(Boolean).map((s) => s.toLowerCase());
  return explicit ? [...explicit, ...base] : base;
}

export function filterByTeam(videos: HighlightVideo[], team: Team): HighlightVideo[] {
  const aliases = teamAliases(team);
  return filterFootballHighlights(videos).filter((v) => {
    const lower = v.title.toLowerCase();
    return aliases.some((a) => lower.includes(a.toLowerCase()));
  });
}
