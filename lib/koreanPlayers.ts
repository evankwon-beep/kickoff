import data from "@/data/korean-players.json";
import type { Fixture } from "./dataSource/types";

export interface KoreanPlayer {
  id: string;
  name: string;
  nameEn: string;
  teamId: number;
  teamName: string;
  position: "GK" | "DF" | "MF" | "FW";
}

export function listKoreanPlayers(): KoreanPlayer[] {
  return data as KoreanPlayer[];
}

export function tagKoreanFixtures(fixtures: Fixture[]): Fixture[] {
  const teamIds = new Set(listKoreanPlayers().map((p) => p.teamId));
  return fixtures.map((f) => ({
    ...f,
    hasKoreanPlayer: teamIds.has(f.home.id) || teamIds.has(f.away.id),
  }));
}
