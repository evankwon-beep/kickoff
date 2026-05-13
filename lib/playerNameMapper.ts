import overridesData from "@/data/player-name-overrides.json";

interface Override { en: string; ko: string }
const OVERRIDES = overridesData as Record<string, Override[]>;

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function findOverride(teamId: number, englishName: string): string | null {
  const list = OVERRIDES[String(teamId)] ?? [];
  const target = normalize(englishName);
  for (const entry of list) {
    if (normalize(entry.en) === target) return entry.ko;
  }
  return null;
}

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

// SPARQL: find Q-id of a footballer whose en label matches the search term, then return the ko label.
function buildQuery(englishName: string): string {
  const safe = englishName.replace(/"/g, '\\"');
  return `
    SELECT ?personLabelKo WHERE {
      ?person rdfs:label "${safe}"@en .
      ?person wdt:P106/wdt:P279* wd:Q937857 .
      ?person rdfs:label ?personLabelKo .
      FILTER(LANG(?personLabelKo) = "ko")
    }
    LIMIT 1
  `;
}

async function queryWikidata(englishName: string): Promise<string | null> {
  try {
    const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(buildQuery(englishName))}&format=json`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Kickoff/1.0 (https://kickoff.vercel.app)",
        Accept: "application/sparql-results+json",
      },
      // Cache 24h per Next.js ISR
      next: { revalidate: 86400 },
    } as RequestInit);
    if (!res.ok) return null;
    const data = await res.json() as { results: { bindings: Array<{ personLabelKo?: { value: string } }> } };
    const first = data.results.bindings[0];
    return first?.personLabelKo?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns Korean name if known; otherwise the original English name.
 * Two-tier lookup: manual overrides first, then Wikidata SPARQL.
 */
export async function resolvePlayerName(
  teamId: number,
  englishName: string
): Promise<{ display: string; source: "override" | "wikidata" | "english" }> {
  const override = findOverride(teamId, englishName);
  if (override) return { display: override, source: "override" };

  const wikidata = await queryWikidata(englishName);
  if (wikidata && wikidata !== englishName) return { display: wikidata, source: "wikidata" };

  return { display: englishName, source: "english" };
}

/**
 * Batch-resolve names. Runs in parallel with bounded concurrency to avoid Wikidata throttling.
 */
export async function resolvePlayerNames(
  teamId: number,
  englishNames: string[]
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  // Resolve sequentially in chunks of 5 to be polite to Wikidata.
  const CHUNK = 5;
  for (let i = 0; i < englishNames.length; i += CHUNK) {
    const chunk = englishNames.slice(i, i + CHUNK);
    const resolved = await Promise.all(chunk.map((n) => resolvePlayerName(teamId, n)));
    chunk.forEach((n, idx) => {
      results[n] = resolved[idx].display;
    });
  }
  return results;
}
