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

  it("shows both teams and score for finished match", () => {
    render(<MatchRow fixture={finishedFixture} />);
    expect(screen.getByText("Tottenham")).toBeInTheDocument();
    expect(screen.getByText("Chelsea")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders highlight link when youtube id present", () => {
    render(<MatchRow fixture={finishedFixture} />);
    const link = screen.getByRole("link", { name: /하이라이트/ });
    expect(link).toHaveAttribute("href", "https://www.youtube.com/watch?v=abc123");
  });

  it("shows Korean flag when hasKoreanPlayer", () => {
    render(<MatchRow fixture={finishedFixture} />);
    expect(screen.getByLabelText(/한국 선수 출전/)).toBeInTheDocument();
  });

  it("shows VS (not score) for scheduled match", () => {
    const sched: Fixture = { ...finishedFixture, status: "SCHEDULED", score: { home: null, away: null } };
    render(<MatchRow fixture={sched} />);
    expect(screen.getByText("VS")).toBeInTheDocument();
  });
});
