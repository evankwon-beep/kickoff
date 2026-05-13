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
import { resolvePlayerNames } from "@/lib/playerNameMapper";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ id: string }>;
}

const POSITION_LABEL: Record<string, string> = {
  GK: "골키퍼",
  DF: "수비수",
  MF: "미드필더",
  FW: "공격수",
  Goalkeeper: "골키퍼",
  Defence: "수비수",
  Midfield: "미드필더",
  Offence: "공격수",
};
const POSITION_ORDER = ["골키퍼", "수비수", "미드필더", "공격수", "기타"];

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

  const nameMap = await resolvePlayerNames(id, team.squad.map((p) => p.name)).catch(
    () => ({} as Record<string, string>)
  );

  // Group squad by position bucket (GK/DF/MF/FW → 한국어 라벨)
  const groups: Record<string, typeof team.squad> = {};
  for (const p of team.squad) {
    const bucket = POSITION_LABEL[p.position] ?? "기타";
    (groups[bucket] ??= []).push({ ...p, name: nameMap[p.name] ?? p.name });
  }

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
        <section className="kickoff-card p-5">
          <h2 className="section-title text-xl mb-3">선수단</h2>
          {team.squad.length === 0 ? (
            <p className="text-[var(--color-muted)] py-4">선수단 정보가 아직 없어요.</p>
          ) : (
            <div className="space-y-5">
              {POSITION_ORDER
                .filter((bucket) => groups[bucket])
                .map((bucket) => (
                  <div key={bucket}>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-accent)] mb-2">
                      {bucket} <span className="text-[var(--color-muted)] font-normal normal-case">({groups[bucket].length})</span>
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {groups[bucket]
                        .slice()
                        .sort((a, b) => (a.shirtNumber ?? 999) - (b.shirtNumber ?? 999))
                        .map((p) => (
                          <li
                            key={p.id}
                            className="flex items-center gap-3 py-2 px-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)]/40 transition-colors"
                          >
                            <PlayerAvatar name={p.name} size={40} />
                            {p.shirtNumber !== undefined && (
                              <span className="font-mono text-xs w-7 text-center text-[var(--color-accent)] font-bold">
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
