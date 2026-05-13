import type { HighlightVideo, Team } from "./dataSource/types";

// "하이라이트" 의미 키워드 — 풀경기 하이라이트 영상에 거의 항상 들어감.
const HIGHLIGHT_KEYWORDS = [
  "하이라이트", "highlight", "highlights",
  "골 모음", "goals", "전체 골",
];

// 축구 리그 / 대회 키워드 — 제목에 적어도 하나 있어야 함.
const FOOTBALL_LEAGUE_KEYWORDS = [
  "epl", "프리미어리그", "premier league",
  "라리가", "la liga", "laliga",
  "분데스", "bundesliga",
  "세리에", "serie a",
  "챔피언스", "champions league", "ucl",
  "유로파", "europa league", "uel",
  "컨퍼런스", "conference league",
  "fa cup", "fa컵",
  "월드컵", "world cup", "fifa",
  "유로", "euro 20", "euros",
  "코파", "copa america",
  "아시안컵", "afc asian cup", "afc cup",
  "리그앙", "ligue 1",
  "에레디비지에", "eredivisie",
  "친선", "friendly",
];

// 다른 스포츠 / 비스포츠 — 하이라이트가 있어도 제외.
const EXCLUDE_KEYWORDS = [
  // 다른 스포츠
  "mlb", "nba", "kbo", "ufc",
  "야구", "농구", "배구", "골프", "테니스", "복싱",
  "baseball", "basketball", "volleyball", "tennis", "boxing", "golf",
  // 국내(K리그) 제외 — 해외 축구만 보고 싶음
  "k리그", "kleague", "k-league", "klassic", "k1리그", "k2리그",
  // 부수 콘텐츠 (경기 영상이 아님)
  "프리뷰", "preview", "리뷰", "review", "분석", "인터뷰",
  "토론", "토크", "talk", "단신", "vlog", "비하인드",
  "주요장면", // 보통 농구/야구의 short clip
  // 비스포츠
  "snl", "드라마", "예능", "코미디", "예고편",
  "movie", "드라마티즈", "토크쇼", "키즈",
];

function looksLikeFootball(title: string): boolean {
  const lower = title.toLowerCase();
  if (EXCLUDE_KEYWORDS.some((k) => lower.includes(k.toLowerCase()))) return false;
  const hasHighlight = HIGHLIGHT_KEYWORDS.some((k) => lower.includes(k.toLowerCase()));
  const hasFootballLeague = FOOTBALL_LEAGUE_KEYWORDS.some((k) => lower.includes(k.toLowerCase()));
  return hasHighlight && hasFootballLeague;
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
