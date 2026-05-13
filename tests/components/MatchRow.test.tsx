import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatchRow } from "@/components/MatchRow";
import type { Fixture } from "@/lib/dataSource/types";

const team = (id: number, name: string, sn: string, tla: string) => ({
  id, name, shortName: sn, tla, crestUrl: `https://crests.football-data.org/${id}.png`,
});

const finishedFixture: Fixture = {
  id: 1, leagueCode: "PL",
  utcKickoff: "2026-05-12T14:00:00Z",
  status: "FINISHED",
  home: team(73, "Tottenham", "Tottenham", "TOT"),
  away: team(61, "Chelsea", "Chelsea", "CHE"),
  score: { home: 2, away: 1 },
  highlightYoutubeId: "abc123",
  hasKoreanPlayer: true,
};

describe("MatchRow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-13T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  // 모바일+데스크탑 두 레이아웃 둘 다 렌더되므로 getAllBy 사용
  it("shows both teams and score for finished match", () => {
    render(<MatchRow fixture={finishedFixture} />);
    // koreanTeamName(73) = "토트넘", (61) = "첼시"
    expect(screen.getAllByText("토트넘").length).toBeGreaterThan(0);
    expect(screen.getAllByText("첼시").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
  });

  it("renders highlight link when youtube id present", () => {
    render(<MatchRow fixture={finishedFixture} />);
    const links = screen.getAllByRole("link", { name: /하이라이트/ });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute("href", "https://www.youtube.com/watch?v=abc123");
  });

  it("shows Korean flag when hasKoreanPlayer", () => {
    render(<MatchRow fixture={finishedFixture} />);
    expect(screen.getAllByLabelText(/한국 선수 출전/).length).toBeGreaterThan(0);
  });

  it("shows VS (not score) for scheduled match", () => {
    const sched: Fixture = { ...finishedFixture, status: "SCHEDULED", score: { home: null, away: null } };
    render(<MatchRow fixture={sched} />);
    expect(screen.getAllByText("VS").length).toBeGreaterThan(0);
  });
});
