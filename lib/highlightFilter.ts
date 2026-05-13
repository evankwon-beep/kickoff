import type { HighlightVideo } from "./dataSource/types";

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
