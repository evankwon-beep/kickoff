import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { UpcomingFixtures } from "@/components/UpcomingFixtures";
import { HighlightStrip } from "@/components/HighlightStrip";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import {
  fetchTeamDetail,
  fetchTeamFixtures,
  fetchTeamHighlights,
} from "@/lib/dataSource";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ id: string }>;
}

const POSITION_LABEL: Record<string, string> = {
  Goalkeeper: "골키퍼",
  Defence: "수비",
  Midfield: "미드필더",
  Offence: "공격",
};

function ageFromBirth(iso?: string): string {
  if (!iso) return "";
  const now = new Date("2026-05-13"); // project date context
  const d = new Date(iso);
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return `${age}세`;
}

export default async function TeamPage({ params }: PageProps) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id)) notFound();

  let team;
  try {
    team = await fetchTeamDetail(id);
  } catch {
    notFound();
  }

  const [fixtures, videos] = await Promise.all([
    fetchTeamFixtures(id).catch(() => []),
    fetchTeamHighlights(team, 40).catch(() => []),
  ]);

  // Group squad by position bucket
  const groups: Record<string, typeof team.squad> = {};
  for (const p of team.squad) {
    const bucket = POSITION_LABEL[p.position] ?? p.position ?? "기타";
    (groups[bucket] ??= []).push(p);
  }
  const order = ["골키퍼", "수비", "미드필더", "공격", "기타"];

  const googleNewsUrl = `https://news.google.com/search?q=${encodeURIComponent(team.name + " 축구")}&hl=ko`;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        <div>
          <Link href="/" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]">
            ← 홈으로
          </Link>
        </div>

        {/* Team header */}
        <section className="flex flex-col sm:flex-row items-start gap-4 bg-gradient-to-br from-[var(--color-surface)] to-[#1a1530] rounded-xl p-6 border border-[var(--color-border)]">
          {team.crestUrl && (
            <Image
              src={team.crestUrl}
              alt={team.name}
              width={80}
              height={80}
              unoptimized
              className="shrink-0"
            />
          )}
          <div className="min-w-0">
            <h1 className="font-bold text-2xl">{team.name}</h1>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              {team.founded && `창단 ${team.founded}`}
              {team.venue && ` · 홈구장 ${team.venue}`}
              {team.clubColors && ` · ${team.clubColors}`}
            </p>
            {team.coach?.name && (
              <p className="text-sm text-[var(--color-muted)] mt-1">감독: {team.coach.name}</p>
            )}
            {team.runningCompetitions && team.runningCompetitions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {team.runningCompetitions.map((c) => (
                  <span
                    key={c.code}
                    className="text-xs px-2 py-1 rounded bg-[var(--color-border)]/60 text-[var(--color-text)]"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            )}
            <a
              href={googleNewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-sm text-[var(--color-accent)] hover:underline"
            >
              📰 Google 뉴스에서 최근 기사 보기 ↗
            </a>
          </div>
        </section>

        {/* Recent + upcoming */}
        <UpcomingFixtures fixtures={fixtures} />

        {/* Squad */}
        <section className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]">
          <h2 className="font-bold text-xl mb-3">선수단</h2>
          {team.squad.length === 0 ? (
            <p className="text-[var(--color-muted)] py-4">선수단 정보가 아직 없어요.</p>
          ) : (
            <div className="space-y-4">
              {order
                .filter((bucket) => groups[bucket])
                .map((bucket) => (
                  <div key={bucket}>
                    <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-2">{bucket}</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {groups[bucket].map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center gap-3 py-2 px-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 transition-colors"
                        >
                          <PlayerAvatar name={p.name} size={40} />
                          {p.shirtNumber !== undefined && (
                            <span className="font-mono text-xs w-7 text-center text-[var(--color-accent)] font-semibold">
                              {p.shirtNumber}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate">{p.name}</p>
                            <p className="text-xs text-[var(--color-muted)]">
                              {[p.nationality, ageFromBirth(p.dateOfBirth)].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* Team highlights */}
        <HighlightStrip videos={videos} />
      </main>
      <Footer />
    </div>
  );
}
