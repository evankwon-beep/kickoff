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
  "f1", "wec", "motogp", "e-sports", "e스포츠", "esports",
  // 국내(K리그) 제외
  "k리그", "kleague", "k-league", "klassic", "k1리그", "k2리그",
  // 부수 콘텐츠 (경기 영상이 아님)
  "프리뷰", "preview", "리뷰", "review", "분석", "인터뷰",
  "토론", "토크", "talk", "단신", "vlog", "비하인드",
  "주요장면", "이슈", "해설", "커뮤니티", "shorts",
  // 비스포츠
  "snl", "드라마", "예능", "코미디", "예고편",
  "movie", "드라마티즈", "토크쇼", "키즈",
];

const TEAM_NAME_ALIASES: Record<string, string[]> = {
  // EPL top 6 (May 2026)
  "Arsenal FC": ["아스널", "아스날", "arsenal", "ars"],
  "Manchester City FC": ["맨시티", "맨체스터 시티", "manchester city", "man city", "mci"],
  "Manchester United FC": ["맨유", "맨체스터 유나이티드", "manchester united", "man utd", "mun"],
  "Liverpool FC": ["리버풀", "liverpool"],
  "Aston Villa FC": ["아스톤 빌라", "빌라", "aston villa"],
  "AFC Bournemouth": ["본머스", "bournemouth"],
  "Tottenham Hotspur FC": ["토트넘", "tottenham", "spurs"],
  "Chelsea FC": ["첼시", "chelsea"],
  "Newcastle United FC": ["뉴캐슬", "newcastle"],
  "Wolverhampton Wanderers FC": ["울브스", "울버햄튼", "wolves", "wolverhampton"],
  // 라리가 top 6
  "FC Barcelona": ["바르사", "바르셀로나", "barça", "barcelona"],
  "Real Madrid CF": ["레알", "레알마드리드", "레알 마드리드", "real madrid"],
  "Villarreal CF": ["비야레알", "비야 레알", "villarreal"],
  "Club Atlético de Madrid": ["AT마드리드", "at.마드리드", "아틀레티코 마드리드", "아틀레티코", "atletico"],
  "Real Betis Balompié": ["베티스", "real betis"],
  "RC Celta de Vigo": ["셀타", "celta"],
  "Athletic Club": ["아틀레틱", "athletic"],
  // 분데스 top 6
  "FC Bayern München": ["바이에른", "바이언", "뮌헨", "bayern"],
  "Borussia Dortmund": ["도르트문트", "도르트", "dortmund", "bvb"],
  "RB Leipzig": ["라이프치히", "rb 라이프치히", "leipzig"],
  "VfB Stuttgart": ["슈투트가르트", "stuttgart"],
  "TSG 1899 Hoffenheim": ["호펜하임", "hoffenheim"],
  "Bayer 04 Leverkusen": ["레버쿠젠", "leverkusen"],
  // 세리에 top 6
  "FC Internazionale Milano": ["인테르", "인터 밀란", "인테르 밀란", "inter"],
  "SSC Napoli": ["나폴리", "napoli"],
  "Juventus FC": ["유베", "유벤투스", "juventus"],
  "AC Milan": ["AC밀란", "ac 밀란", "밀란", "ac milan"],
  "AS Roma": ["AS 로마", "as 로마", "as roma", "로마"],
  "Atalanta BC": ["아탈란타", "atalanta"],
  // PSG / Champions League regulars
  "Paris Saint-Germain FC": ["파리 생제르맹", "psg"],
};

const TOP_TEAM_ALIASES: string[] = (() => {
  const set = new Set<string>();
  for (const list of Object.values(TEAM_NAME_ALIASES)) {
    for (const alias of list) set.add(alias.toLowerCase());
  }
  return Array.from(set);
})();

function looksLikeFootball(title: string): boolean {
  const lower = title.toLowerCase();
  if (EXCLUDE_KEYWORDS.some((k) => lower.includes(k.toLowerCase()))) return false;

  // Path 1: top team mentioned (covers VAR clips, goal compilations, full highlights, etc.)
  if (TOP_TEAM_ALIASES.some((a) => lower.includes(a))) return true;

  // Path 2: highlight keyword + league keyword (general European football)
  const hasHighlight = HIGHLIGHT_KEYWORDS.some((k) => lower.includes(k.toLowerCase()));
  const hasLeague = FOOTBALL_LEAGUE_KEYWORDS.some((k) => lower.includes(k.toLowerCase()));
  return hasHighlight && hasLeague;
}

export function filterFootballHighlights(videos: HighlightVideo[]): HighlightVideo[] {
  return videos.filter((v) => looksLikeFootball(v.title));
}

function teamAliases(team: Team): string[] {
  const explicit = TEAM_NAME_ALIASES[team.name];
  const base = [team.name, team.shortName, team.tla].filter(Boolean).map((s) => s.toLowerCase());
  return explicit ? [...explicit, ...base] : base;
}

export function filterByTeam(videos: HighlightVideo[], team: Team): HighlightVideo[] {
  const aliases = teamAliases(team);
  return videos.filter((v) => {
    const lower = v.title.toLowerCase();
    // 다른 스포츠 / K리그 / 프리뷰·리뷰 등은 제외
    if (EXCLUDE_KEYWORDS.some((k) => lower.includes(k.toLowerCase()))) return false;
    // 팀명 또는 alias 매칭
    return aliases.some((a) => lower.includes(a.toLowerCase()));
  });
}
