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
    html.style.removeProperty("--color-pitch");
    html.style.removeProperty("--color-pitch-2");
    html.style.removeProperty("--gradient-pitch");
    if (bg) bg.style.display = "none";
    return;
  }

  const theme = THEMES[String(team.id)] ?? THEMES.default;
  html.style.setProperty("--color-accent", theme.primary);
  html.style.setProperty("--color-accent-deep", theme.primaryDeep);
  html.style.setProperty("--color-on-accent", theme.text);

  // 메인 hero 그라데이션 (잔디 그린)을 팀 색으로 교체
  // primaryDeep을 짙은 톤으로 사용 — 너무 밝으면 본문 텍스트 가독성 해침
  html.style.setProperty("--color-pitch", theme.primaryDeep);
  html.style.setProperty("--color-pitch-2", theme.primaryDeep);
  html.style.setProperty(
    "--gradient-pitch",
    `radial-gradient(1200px 280px at 50% -120px, color-mix(in oklab, ${theme.primary} 22%, transparent), transparent 60%), linear-gradient(180deg, color-mix(in oklab, ${theme.primaryDeep} 70%, var(--color-bg)) 0%, var(--color-bg) 70%)`
  );

  if (!bg) {
    bg = document.createElement("div");
    bg.id = "kickoff-emblem-bg";
    bg.style.position = "fixed";
    bg.style.inset = "0";
    bg.style.pointerEvents = "none";
    bg.style.zIndex = "0";
    bg.style.opacity = "0.15";
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
