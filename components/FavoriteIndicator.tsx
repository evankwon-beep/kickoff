"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  loadFavorite,
  clearFavorite,
  type FavoriteTeam,
} from "@/lib/themeStorage";

export function FavoriteIndicator() {
  const [team, setTeam] = useState<FavoriteTeam | null>(null);

  useEffect(() => {
    setTeam(loadFavorite());
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<FavoriteTeam | null>).detail;
      setTeam(detail ?? null);
    };
    window.addEventListener("kickoff:favorite-change", onChange);
    return () => window.removeEventListener("kickoff:favorite-change", onChange);
  }, []);

  if (!team) return null;

  return (
    <span className="inline-flex items-center gap-1.5 ml-2">
      <Link
        href={`/team/${team.id}`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--color-accent)] text-[var(--color-on-accent,#0a0a0b)]"
      >
        <span aria-hidden>★</span> {team.name}
      </Link>
      <button
        type="button"
        onClick={() => clearFavorite()}
        title="즐겨찾기 해제"
        aria-label="즐겨찾기 해제"
        className="text-[var(--color-muted)] hover:text-[var(--color-text)] text-xs"
      >
        ✕
      </button>
    </span>
  );
}
