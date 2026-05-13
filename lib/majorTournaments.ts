// 2026-05-13 기준 메이저 대회 메타데이터.
// 시작/종료일이 지나면 자동으로 배너에서 사라지고, 다음 사이클 정보로 운영자가 교체.

export interface MajorTournament {
  /** Stable id for keying */
  id: string;
  /** Football-Data.org competition code if available, else null (banner only, no page link) */
  code: "CL" | "WC" | "EC" | null;
  /** Display name in Korean */
  nameKr: string;
  /** Short emoji/icon */
  icon: string;
  /** Tournament start (ISO date) */
  start: string;
  /** Tournament end (ISO date) */
  end: string;
  /** If true, this is a qualifying phase rather than the main tournament. */
  isQualifier?: boolean;
}

export const MAJOR_TOURNAMENTS: MajorTournament[] = [
  {
    id: "wc-2026",
    code: "WC",
    nameKr: "FIFA 월드컵 2026",
    icon: "🏆",
    start: "2026-06-11",
    end: "2026-07-19",
  },
  {
    id: "cl-2025-26",
    code: "CL",
    nameKr: "UEFA 챔피언스리그",
    icon: "⭐",
    start: "2025-09-16",
    end: "2026-05-30",
  },
  {
    id: "afcon-2025",
    code: null,
    nameKr: "아프리카 네이션스컵 2025",
    icon: "🌍",
    start: "2025-12-21",
    end: "2026-01-18",
  },
  {
    id: "euro-2028",
    code: "EC",
    nameKr: "UEFA 유로 2028",
    icon: "🇪🇺",
    start: "2028-06-09",
    end: "2028-07-09",
  },
  {
    id: "asian-cup-2027",
    code: null,
    nameKr: "AFC 아시안컵 2027",
    icon: "🌏",
    start: "2027-01-07",
    end: "2027-02-05",
  },
];

export interface ActiveTournament extends MajorTournament {
  /** "ongoing" if happening now; "upcoming" if within the horizon window. */
  state: "ongoing" | "upcoming";
  /** Days until start (>= 0). 0 if ongoing. */
  daysToStart: number;
  /** Days until end (>= 0). */
  daysToEnd: number;
}

const DAY_MS = 86_400_000;

export function selectActiveTournaments(
  now: Date = new Date(),
  horizonDays = 60,
  tournaments: MajorTournament[] = MAJOR_TOURNAMENTS
): ActiveTournament[] {
  const today = Math.floor(now.getTime() / DAY_MS);
  return tournaments
    .map((t) => {
      const startDay = Math.floor(new Date(t.start).getTime() / DAY_MS);
      const endDay = Math.floor(new Date(t.end).getTime() / DAY_MS);
      const daysToStart = startDay - today;
      const daysToEnd = endDay - today;
      if (daysToEnd < 0) return null; // already over
      if (daysToStart <= 0) {
        return { ...t, state: "ongoing" as const, daysToStart: 0, daysToEnd };
      }
      if (daysToStart <= horizonDays) {
        return { ...t, state: "upcoming" as const, daysToStart, daysToEnd };
      }
      return null;
    })
    .filter((t): t is ActiveTournament => t !== null)
    .sort((a, b) => a.daysToStart - b.daysToStart);
}
