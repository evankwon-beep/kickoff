import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamBadge } from "@/components/TeamBadge";

const team = {
  id: 64, name: "Liverpool FC", shortName: "Liverpool", tla: "LIV",
  crestUrl: "https://crests.football-data.org/64.png",
};

describe("TeamBadge", () => {
  it("renders crest image with alt and team name", () => {
    render(<TeamBadge team={team} />);
    const img = screen.getByRole("img", { name: /liverpool/i });
    expect(img).toHaveAttribute("src", expect.stringContaining("/64.png"));
    expect(screen.getByText("Liverpool")).toBeInTheDocument();
  });

  it("hides text when textHidden prop set", () => {
    render(<TeamBadge team={team} textHidden />);
    expect(screen.queryByText("Liverpool")).not.toBeInTheDocument();
  });
});
