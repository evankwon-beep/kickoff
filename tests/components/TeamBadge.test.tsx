import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamBadge } from "@/components/TeamBadge";

// id 64 = Liverpool → koreanTeamName으로 "리버풀" 표시됨
const team = {
  id: 64, name: "Liverpool FC", shortName: "Liverpool", tla: "LIV",
  crestUrl: "https://crests.football-data.org/64.png",
};

describe("TeamBadge", () => {
  it("renders crest image with korean team name", () => {
    render(<TeamBadge team={team} />);
    const img = screen.getByRole("img", { name: /리버풀/ });
    expect(img).toHaveAttribute("src", expect.stringContaining("/64.png"));
    expect(screen.getByText("리버풀")).toBeInTheDocument();
  });

  it("hides text when textHidden prop set", () => {
    render(<TeamBadge team={team} textHidden />);
    expect(screen.queryByText("리버풀")).not.toBeInTheDocument();
  });
});
