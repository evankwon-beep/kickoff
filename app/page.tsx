import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LeagueStandingsCard } from "@/components/LeagueStandingsCard";
import { UpcomingFixtures } from "@/components/UpcomingFixtures";
import { HighlightStrip } from "@/components/HighlightStrip";
import { KoreanPlayerSection } from "@/components/KoreanPlayerSection";
import { StaleDataNotice } from "@/components/StaleDataNotice";
import {
  fetchTop4Standings,
  fetchEnrichedFixtures,
  fetchTopHighlights,
} from "@/lib/dataSource";

export const revalidate = 3600;

export default async function HomePage() {
  const [standings, fixtures, videos] = await Promise.all([
    fetchTop4Standings().catch(() => []),
    fetchEnrichedFixtures().catch(() => []),
    fetchTopHighlights(12).catch(() => []),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        <StaleDataNotice
          show={standings.length === 0 || fixtures.length === 0 || videos.length === 0}
        />
        <UpcomingFixtures fixtures={fixtures} />
        <section>
          <h2 className="font-bold text-lg mb-3">4대 리그 순위</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {standings.map((s) => (
              <LeagueStandingsCard key={s.leagueCode} standings={s} />
            ))}
          </div>
        </section>
        <HighlightStrip videos={videos} />
        <KoreanPlayerSection fixtures={fixtures} />
      </main>
      <Footer />
    </div>
  );
}
