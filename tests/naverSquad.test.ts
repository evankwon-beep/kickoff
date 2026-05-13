import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchNaverSquad } from "@/lib/naverSquad";

const SAMPLE_HTML = `
  ... lots of html ...
  "squad":[{"name":"손흥민","profileUrl":"https://sports-phinf.pstatic.net/player/wfootball/default/123.png","countryId":"KOR","countryName":"대한민국"},{"name":"해리 케인","profileUrl":"https://sports-phinf.pstatic.net/player/wfootball/default/456.png","countryId":"ENG","countryName":"잉글랜드"}]
  ... more html ...
`;

describe("fetchNaverSquad", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () => SAMPLE_HTML,
      }))
    );
  });
  afterEach(() => vi.restoreAllMocks());

  it("returns parsed squad for known team id", async () => {
    const squad = await fetchNaverSquad(73); // Tottenham — in team-korean-names.json
    expect(squad).not.toBeNull();
    expect(squad!).toHaveLength(2);
    expect(squad![0]).toMatchObject({
      name: "손흥민",
      profileUrl: expect.stringContaining("/123.png"),
      countryName: "대한민국",
    });
  });

  it("returns null for unmapped team id", async () => {
    const squad = await fetchNaverSquad(999999);
    expect(squad).toBeNull();
  });

  it("issues request to Naver mobile search with 선수단 query", async () => {
    await fetchNaverSquad(73);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const url = (fetch as any).mock.calls[0][0] as string;
    expect(url).toContain("m.search.naver.com/search.naver");
    expect(decodeURIComponent(url)).toContain("토트넘 선수단");
  });
});
