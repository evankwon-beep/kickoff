import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FixturesList } from "@/components/FixturesList";
import { HighlightStrip } from "@/components/HighlightStrip";
import { LeagueStandingsCard } from "@/components/LeagueStandingsCard";
import {
  fetchCompetition,
  fetchCompetitionFixtures,
  fetchCompetitionHighlights,
  fetchGroupStandings,
} from "@/lib/dataSource";
import type { LeagueCode } from "@/lib/dataSource/types";
import { MAJOR_TOURNAMENTS } from "@/lib/majorTournaments";

export const revalidate = 3600;

const VALID: LeagueCode[] = ["PL", "PD", "BL1", "SA", "CL", "WC", "EC", "FA"];

const TITLES: Record<LeagueCode, string> = {
  PL: "프리미어리그",
  PD: "라리가",
  BL1: "분데스리가",
  SA: "세리에A",
  CL: "UEFA 챔피언스리그",
  WC: "FIFA 월드컵",
  EC: "UEFA 유로",
  FA: "FA컵",
};

// 빈 상태에서 채널/유튜브 검색에 쓸 한국어 키워드
const SEARCH_KEYWORDS: Record<LeagueCode, string> = {
  PL: "프리미어리그",
  PD: "라리가",
  BL1: "분데스리가",
  SA: "세리에A",
  CL: "챔피언스리그",
  WC: "월드컵",
  EC: "유로",
  FA: "FA컵",
};

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function CompetitionPage({ params }: PageProps) {
  const { code: raw } = await params;
  const code = raw as LeagueCode;
  if (!VALID.includes(code)) notFound();

  const isGroupStage = code === "WC" || code === "CL"; // future: detect dynamically
  const [singleStandings, groups, fixtures, highlights] = await Promise.all([
    isGroupStage ? Promise.resolve(null) : fetchCompetition(code),
    isGroupStage ? fetchGroupStandings(code) : Promise.resolve([]),
    fetchCompetitionFixtures(code).catch(() => []),
    fetchCompetitionHighlights(code).catch(() => []),
  ]);

  const meta = MAJOR_TOURNAMENTS.find((t) => t.code === code);
  const title = TITLES[code];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        <div>
          <Link href="/" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]">← 홈으로</Link>
          <h1 className="font-bold text-2xl mt-2">{title}</h1>
          {meta && (
            <p className="text-sm text-[var(--color-muted)] mt-1">
              {meta.start.slice(0, 10)} ~ {meta.end.slice(0, 10)}
            </p>
          )}
        </div>

        {/* 1) 순위표 — 맨 위. 좌(순위) + 우(경기 일정/하이라이트 정보) 2단 밸런스 */}
        {groups.length > 0 ? (
          <section>
            <h2 className="section-title text-xl mb-3">조별 순위</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((g) => (
                <div key={g.group}>
                  <h3 className="font-bold text-sm text-[var(--color-accent)] mb-2 tracking-wider uppercase">{g.group}</h3>
                  <LeagueStandingsCard standings={g.standings} topN={4} hideHeader />
                </div>
              ))}
            </div>
          </section>
        ) : singleStandings ? (
          <section className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5 items-stretch">
            <div className="flex flex-col">
              <h2 className="section-title text-xl mb-3 shrink-0">순위표</h2>
              <LeagueStandingsCard
                standings={singleStandings}
                topN={Math.min(20, singleStandings.rows.length)}
                className="flex-1"
              />
            </div>
            <div className="flex flex-col">
              {/* 하이라이트 헤더 placeholder (높이 정렬용 - 없어도 됨) */}
              <div className="h-0 mb-3" />
              <HighlightStrip
                videos={highlights}
                layout="grid"
                limit={6}
                title={`${title} 하이라이트`}
                emptyStateQuery={`${SEARCH_KEYWORDS[code]} 하이라이트`}
                className="flex-1"
              />
            </div>
          </section>
        ) : (
          <section className="kickoff-card p-6">
            <p className="text-[var(--color-muted)]">아직 순위/조 정보를 가져올 수 없어요. 토너먼트가 시작되면 표시됩니다.</p>
          </section>
        )}

        {/* 2) 경기 일정 */}
        <FixturesList
          fixtures={fixtures}
          title="경기 일정"
          emptyText="이 기간에 예정된 경기가 없어요."
        />

        {/* 3) 하이라이트 (조별 단계나 standings 없을 때만 별도 노출 — 단일 standings의 경우 위 2단 안에 포함됨) */}
        {!singleStandings && (
          <HighlightStrip
            videos={highlights}
            layout="scroll"
            limit={12}
            title={`${title} 하이라이트`}
            emptyStateQuery={`${SEARCH_KEYWORDS[code]} 하이라이트`}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
