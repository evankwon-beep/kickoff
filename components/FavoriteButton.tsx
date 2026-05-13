"use client";

import { useEffect, useState } from "react";
import {
  loadFavorite,
  saveFavorite,
  clearFavorite,
  type FavoriteTeam,
} from "@/lib/themeStorage";

interface Props {
  team: FavoriteTeam;
}

export function FavoriteButton({ team }: Props) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const fav = loadFavorite();
    setActive(fav?.id === team.id);
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<FavoriteTeam | null>).detail;
      setActive(detail?.id === team.id);
    };
    window.addEventListener("kickoff:favorite-change", onChange);
    return () => window.removeEventListener("kickoff:favorite-change", onChange);
  }, [team.id]);

  const toggle = () => {
    if (active) clearFavorite();
    else saveFavorite(team);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={
        "inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all border " +
        (active
          ? "bg-[var(--color-accent)] text-[var(--color-on-accent,#0a0a0b)] border-[var(--color-accent)] shadow-[0_0_24px_color-mix(in_oklab,var(--color-accent)_50%,transparent)]"
          : "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-accent)]/60")
      }
      aria-pressed={active}
    >
      <span aria-hidden>{active ? "★" : "☆"}</span>
      {active ? "내 팀" : "즐겨찾기"}
    </button>
  );
}
