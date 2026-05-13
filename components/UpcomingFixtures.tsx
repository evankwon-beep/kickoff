"use client";

import { useState } from "react";
import { MatchRow } from "./MatchRow";
import type { Fixture, LeagueCode } from "@/lib/dataSource/types";
import { TOP4_LEAGUES } from "@/lib/dataSource/types";

interface Props {
  fixtures: Fixture[];
}

type TabValue = "ALL" | LeagueCode;

const TABS: { value: TabValue; label: string }[] = [
  { value: "ALL", label: "전체" },
  ...TOP4_LEAGUES.map((l) => ({ value: l.code as TabValue, label: l.nameKr })),
];

export function UpcomingFixtures({ fixtures }: Props) {
  const [tab, setTab] = useState<TabValue>("ALL");
  const sorted = [...fixtures].sort((a, b) =>
    a.utcKickoff.localeCompare(b.utcKickoff)
  );
  const visible =
    tab === "ALL" ? sorted : sorted.filter((f) => f.leagueCode === tab);

  return (
    <section className="kickoff-card p-5">
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
        <h2 className="section-title text-xl">
          오늘 & 다가오는 경기{" "}
          <span className="text-[var(--color-muted)] text-sm font-normal ml-1">KST</span>
        </h2>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3 -mx-1">
        {TABS.map((t) => {
          const isActive = tab === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={
                "px-3 py-1.5 rounded-full text-xs font-bold transition-colors " +
                (isActive
                  ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
                  : "bg-[var(--color-border)]/60 text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]")
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {visible.length === 0 ? (
        <p className="text-[var(--color-muted)] py-4">해당 리그의 예정된 경기가 없어요.</p>
      ) : (
        <div>
          {visible.slice(0, 20).map((f) => (
            <MatchRow key={f.id} fixture={f} />
          ))}
        </div>
      )}
    </section>
  );
}
