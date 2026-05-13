"use client";

import { useEffect, useState } from "react";
import { loadFavorite, type FavoriteTeam } from "@/lib/themeStorage";
import themesData from "@/data/team-themes.json";

interface Theme {
  primary: string;
  primaryDeep: string;
  text: string;
  name?: string;
}

const THEMES = themesData as Record<string, Theme>;

function applyTheme(team: FavoriteTeam | null) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  let bg = document.getElementById("kickoff-emblem-bg") as HTMLDivElement | null;

  if (!team) {
    html.style.removeProperty("--color-accent");
    html.style.removeProperty("--color-accent-deep");
    html.style.removeProperty("--color-on-accent");
    if (bg) bg.style.display = "none";
    return;
  }

  const theme = THEMES[String(team.id)] ?? THEMES.default;
  html.style.setProperty("--color-accent", theme.primary);
  html.style.setProperty("--color-accent-deep", theme.primaryDeep);
  html.style.setProperty("--color-on-accent", theme.text);

  if (!bg) {
    bg = document.createElement("div");
    bg.id = "kickoff-emblem-bg";
    bg.style.position = "fixed";
    bg.style.inset = "0";
    bg.style.pointerEvents = "none";
    bg.style.zIndex = "0";
    bg.style.opacity = "0.06";
    bg.style.backgroundRepeat = "no-repeat";
    bg.style.backgroundPosition = "right -120px bottom -120px";
    bg.style.backgroundSize = "540px";
    document.body.appendChild(bg);
  }

  if (team.crestUrl) {
    bg.style.backgroundImage = `url("${team.crestUrl}")`;
    bg.style.display = "block";
  } else {
    bg.style.display = "none";
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
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

  useEffect(() => {
    applyTheme(team);
  }, [team]);

  return <>{children}</>;
}
