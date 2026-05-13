"use client";

export interface FavoriteTeam {
  id: number;
  name: string;
  crestUrl: string;
}

const KEY = "kickoff:favorite-team";

export function loadFavorite(): FavoriteTeam | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FavoriteTeam;
  } catch {
    return null;
  }
}

export function saveFavorite(team: FavoriteTeam): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(team));
  window.dispatchEvent(new CustomEvent("kickoff:favorite-change", { detail: team }));
}

export function clearFavorite(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("kickoff:favorite-change", { detail: null }));
}
