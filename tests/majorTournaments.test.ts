import { describe, it, expect } from "vitest";
import { selectActiveTournaments } from "@/lib/majorTournaments";

describe("selectActiveTournaments", () => {
  it("includes World Cup 2026 as upcoming when 4 weeks away", () => {
    const now = new Date("2026-05-13T00:00:00Z");
    const active = selectActiveTournaments(now, 60);
    const wc = active.find((t) => t.id === "wc-2026");
    expect(wc).toBeDefined();
    expect(wc!.state).toBe("upcoming");
    expect(wc!.daysToStart).toBeGreaterThan(20);
    expect(wc!.daysToStart).toBeLessThan(35);
  });

  it("includes Champions League final as ongoing in mid-May 2026", () => {
    const now = new Date("2026-05-13T00:00:00Z");
    const active = selectActiveTournaments(now, 60);
    const cl = active.find((t) => t.id === "cl-2025-26");
    expect(cl).toBeDefined();
    expect(cl!.state).toBe("ongoing");
  });

  it("excludes tournaments already finished", () => {
    const now = new Date("2026-05-13T00:00:00Z");
    const active = selectActiveTournaments(now, 60);
    const afcon = active.find((t) => t.id === "afcon-2025");
    expect(afcon).toBeUndefined(); // ended Jan 2026
  });

  it("excludes tournaments outside horizon", () => {
    const now = new Date("2026-05-13T00:00:00Z");
    const active = selectActiveTournaments(now, 60);
    const euro = active.find((t) => t.id === "euro-2028");
    expect(euro).toBeUndefined(); // 2년 후
  });

  it("sorts by daysToStart ascending (ongoing first)", () => {
    const now = new Date("2026-05-13T00:00:00Z");
    const active = selectActiveTournaments(now, 60);
    for (let i = 1; i < active.length; i++) {
      expect(active[i].daysToStart).toBeGreaterThanOrEqual(active[i - 1].daysToStart);
    }
  });
});
