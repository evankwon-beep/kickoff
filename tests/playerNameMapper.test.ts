import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolvePlayerName } from "@/lib/playerNameMapper";

describe("resolvePlayerName", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ results: { bindings: [] } }),
      }))
    );
  });
  afterEach(() => vi.restoreAllMocks());

  it("returns override Korean name when team+en is mapped", async () => {
    const r = await resolvePlayerName(73, "Heung-Min Son");
    expect(r.display).toBe("손흥민");
    expect(r.source).toBe("override");
  });

  it("matches override case-insensitively and with whitespace tolerance", async () => {
    const r = await resolvePlayerName(73, "  heung-min son  ");
    expect(r.display).toBe("손흥민");
  });

  it("falls back to wikidata then english when no override", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          results: { bindings: [{ personLabelKo: { value: "테스트선수" } }] },
        }),
      }))
    );
    const r = await resolvePlayerName(73, "Some Unknown Player");
    expect(r.display).toBe("테스트선수");
    expect(r.source).toBe("wikidata");
  });

  it("returns english name when both override and wikidata miss", async () => {
    const r = await resolvePlayerName(99999, "Totally Unknown Name");
    expect(r.display).toBe("Totally Unknown Name");
    expect(r.source).toBe("english");
  });
});
