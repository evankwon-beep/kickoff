import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LeagueStandingsCard } from "@/components/LeagueStandingsCard";
import { UpcomingFixtures } from "@/components/UpcomingFixtures";
import { HighlightStrip } from "@/components/HighlightStrip";
import { StaleDataNotice } from "@/components/StaleDataNotice";
import { MajorTournamentsBanner } from "@/components/MajorTournamentsBanner";
import { LeagueMarketValueSection } from "@/components/LeagueMarketValueSection";
import { LeagueAwardsSection } from "@/components/LeagueAwardsSection";
import { selectActiveTournaments } from "@/lib/majorTournaments";
import {
  fetchTop4Standings,
  fetchEnrichedFixturesByTop6,
  fetchFootballHighlights,
} from "@/lib/dataSource";

// 영상 하이라이트는 시간대별로 새로 올라오니 짧게 갱신.
// YouTube quota가 일시 실패해도 다음 사이클에서 즉시 회복되도록 10분으로 단축.
export const revalidate = 600;

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
          <h2 className="section-title text-xl mb-3">5대 리그 순위</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {standings.map((s) => (
              <LeagueStandingsCard key={s.leagueCode} standings={s} />
            ))}
          </div>
        </section>

        {/* 리그별 시즌 어워드 (득점왕/도움왕) */}
        <LeagueAwardsSection />

        {/* 리그별 시장가치 TOP 5 (standings 무관 - 시장가치만 기준) */}
        <LeagueMarketValueSection />

        {/* 순서 변경: 하이라이트 먼저, 경기 일정 나중 */}
        <HighlightStrip videos={videos} />
        <UpcomingFixtures fixtures={fixtures} />
      </main>
      <Footer />
    </div>
  );
}
