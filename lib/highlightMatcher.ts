import type { Fixture, HighlightVideo } from "./dataSource/types";

const TEAM_ALIASES: Record<string, string[]> = {
  "Manchester City": ["맨시티", "맨체스터 시티", "manchester city", "man city", "mci"],
  "Liverpool": ["리버풀", "liverpool", "liv"],
  "Tottenham Hotspur": ["토트넘", "tottenham", "spurs", "tot"],
  "Chelsea": ["첼시", "chelsea", "che"],
  "Arsenal": ["아스널", "아스날", "arsenal", "ars"],
  "Manchester United": ["맨유", "맨체스터 유나이티드", "manchester united", "man utd", "mun"],
  "Real Madrid": ["레알", "레알마드리드", "real madrid", "rma"],
  "Barcelona": ["바르사", "바르셀로나", "barcelona", "bar"],
  "Atletico Madrid": ["AT마드리드", "아틀레티코", "atletico", "atm"],
  "Bayern Munich": ["바이언", "뮌헨", "bayern", "fcb"],
  "Bayer 04 Leverkusen": ["레버쿠젠", "leverkusen", "b04"],
  "Borussia Dortmund": ["도르트문트", "도르트", "dortmund", "bvb"],
  "Inter": ["인테르", "inter"],
  "Juventus": ["유베", "유벤투스", "juventus", "juv"],
  "AC Milan": ["AC밀란", "밀란", "milan", "mil"],
  "Atalanta": ["아탈란타", "atalanta"],
};

function aliasesFor(team: { name: string; shortName: string; tla: string }): string[] {
  const candidates = [team.name, team.shortName, team.tla].filter(Boolean);
  for (const [key, list] of Object.entries(TEAM_ALIASES)) {
    if (candidates.some((c) => c.toLowerCase().includes(key.toLowerCase()))) {
      return [...list, ...candidates.map((c) => c.toLowerCase())];
    }
  }
  return candidates.map((c) => c.toLowerCase());
}

function titleMentions(title: string, aliases: string[]): boolean {
  const lower = title.toLowerCase();
  return aliases.some((a) => lower.includes(a.toLowerCase()));
}

function dayDiff(a: string, b: string): number {
  const da = Math.floor(new Date(a).getTime() / 86_400_000);
  const db = Math.floor(new Date(b).getTime() / 86_400_000);
  return Math.abs(da - db);
}

export function matchHighlights(fixtures: Fixture[], videos: HighlightVideo[]): Fixture[] {
  return fixtures.map((f) => {
    const homeAliases = aliasesFor(f.home);
    const awayAliases = aliasesFor(f.away);
    const candidate = videos
      .filter((v) => dayDiff(v.publishedAt, f.utcKickoff) <= 3)
      .find((v) => titleMentions(v.title, homeAliases) && titleMentions(v.title, awayAliases));
    return candidate ? { ...f, highlightYoutubeId: candidate.videoId } : f;
  });
}
