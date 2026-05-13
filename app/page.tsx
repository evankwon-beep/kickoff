import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LeagueStandingsCard } from "@/components/LeagueStandingsCard";
import { UpcomingFixtures } from "@/components/UpcomingFixtures";
import { HighlightStrip } from "@/components/HighlightStrip";
import { StaleDataNotice } from "@/components/StaleDataNotice";
import { MajorTournamentsBanner } from "@/components/MajorTournamentsBanner";
import { selectActiveTournaments } from "@/lib/majorTournaments";
import {
  fetchTop4Standings,
  fetchEnrichedFixturesByTop6,
  fetchFootballHighlights,
} from "@/lib/dataSource";

export const revalidate = 3600;

export default async function HomePage() {
  const [standings, fixtures, videos] = await Promise.all([
    fetchTop4Standings().catch(() => []),
    fetchEnrichedFixturesByTop6().catch(() => []),
    fetchFootballHighlights(50).catch(() => []),
  ]);

  const partialFail =
    standings.length === 0 || fixtures.length === 0 || videos.length === 0;
  const activeTournaments = selectActiveTournaments();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 pt-8 pb-12 space-y-8 kickoff-hero rounded-b-3xl">
        <StaleDataNotice show={partialFail} />
        <MajorTournamentsBanner tournaments={activeTournaments} />

        <section>
          <h2 className="section-title text-xl mb-3">4대 리그 순위</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {standings.map((s) => (
              <LeagueStandingsCard key={s.leagueCode} standings={s} />
            ))}
          </div>
        </section>

        <UpcomingFixtures fixtures={fixtures} />
        <HighlightStrip videos={videos} />
      </main>
      <Footer />
    </div>
  );
}
