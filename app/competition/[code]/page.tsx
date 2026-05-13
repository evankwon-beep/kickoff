import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { UpcomingFixtures } from "@/components/UpcomingFixtures";
import { LeagueStandingsCard } from "@/components/LeagueStandingsCard";
import { fetchCompetition, fetchCompetitionFixtures } from "@/lib/dataSource";
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

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function CompetitionPage({ params }: PageProps) {
  const { code: raw } = await params;
  const code = raw as LeagueCode;
  if (!VALID.includes(code)) notFound();

  const [standings, fixtures] = await Promise.all([
    fetchCompetition(code),
    fetchCompetitionFixtures(code).catch(() => []),
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

        {standings ? (
          <section>
            <h2 className="font-bold text-xl mb-3">순위표</h2>
            <div className="max-w-md">
              <LeagueStandingsCard standings={standings} topN={Math.min(20, standings.rows.length)} />
            </div>
          </section>
        ) : (
          <section className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)]">
            <p className="text-[var(--color-muted)]">
              아직 순위/조 정보를 가져올 수 없어요. 토너먼트가 시작되면 표시됩니다.
            </p>
          </section>
        )}

        <UpcomingFixtures fixtures={fixtures} />
      </main>
      <Footer />
    </div>
  );
}
