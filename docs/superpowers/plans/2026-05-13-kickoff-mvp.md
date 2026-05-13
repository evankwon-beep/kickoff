# 킥오프(Kickoff) MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 한국 축구 팬을 위한 종합 대시보드 사이트의 1차 MVP. 4대 리그 순위, 다가오는 경기, 하이라이트 영상, 한국 선수 정보를 다크 모드 + 반응형으로 한 페이지에 보여주고 Vercel에 배포한다.

**Architecture:** Next.js 15 App Router + Tailwind CSS. 데이터는 `lib/dataSource/` 인터페이스 뒤에 Football-Data.org와 YouTube Data API 어댑터를 두고 ISR(1시간)로 캐시. 추후 유료 API로 교체 가능하도록 설계.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Vitest, Pretendard 폰트

**Related Spec:** `docs/superpowers/specs/2026-05-13-kickoff-design.md`

---

## File Structure

```
/Users/gwonhoseong/Projects/축구사이트/
├── app/
│   ├── layout.tsx              # 루트 레이아웃 (다크모드, 폰트, 메타)
│   ├── page.tsx                # 메인 대시보드
│   └── globals.css             # Tailwind + 폰트
├── components/
│   ├── Header.tsx              # 상단 헤더 + 리그 네비
│   ├── Footer.tsx
│   ├── TeamBadge.tsx           # 엠블럼 + 팀명 (재사용 핵심)
│   ├── MatchRow.tsx            # 경기 한 줄
│   ├── LeagueStandingsCard.tsx # 한 리그 순위 카드
│   ├── UpcomingFixtures.tsx    # 오늘/다가오는 경기 섹션
│   ├── HighlightCard.tsx       # 유튜브 썸네일 카드
│   ├── HighlightStrip.tsx      # 하이라이트 가로 스트립
│   └── KoreanPlayerSection.tsx # 한국 선수 활약
├── lib/
│   ├── dataSource/
│   │   ├── types.ts            # 인터페이스/타입 정의
│   │   ├── footballData.ts     # Football-Data.org 어댑터
│   │   ├── youtube.ts          # YouTube API 어댑터
│   │   └── index.ts            # 외부 노출 (composite)
│   ├── time.ts                 # KST 변환 유틸
│   ├── highlightMatcher.ts     # 영상↔경기 매칭
│   └── koreanPlayers.ts        # 한국 선수 데이터 로더
├── data/
│   └── korean-players.json
├── tests/
│   ├── time.test.ts
│   ├── highlightMatcher.test.ts
│   ├── dataSource/
│   │   └── footballData.test.ts
│   └── components/
│       └── MatchRow.test.tsx
├── public/
│   └── (favicon 등)
├── .env.local.example
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── package.json
└── README.md
```

---

## Task 1: 프로젝트 초기 세팅 (Next.js 15 + TypeScript + Tailwind)

**Files:**
- Create: `/Users/gwonhoseong/Projects/축구사이트/` 내부에 Next.js 프로젝트 구조 초기화

- [ ] **Step 1: Next.js 프로젝트 생성**

작업 디렉토리: `/Users/gwonhoseong/Projects/축구사이트/`

Run:
```bash
cd "/Users/gwonhoseong/Projects/축구사이트"
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --use-npm --eslint --turbopack
```

Expected: `app/`, `package.json`, `tailwind.config.ts`(혹은 v4 인라인), `tsconfig.json` 등 생성.

- [ ] **Step 2: 개발 서버 실행 확인**

Run:
```bash
npm run dev
```

Expected: `http://localhost:3000`에 Next.js 기본 페이지 표시. Ctrl+C로 종료.

- [ ] **Step 3: `.gitignore`에 `.env*.local` 포함 확인 + git 초기화**

Run:
```bash
git init
git add -A
git commit -m "chore: bootstrap Next.js 15 project"
```

Expected: 첫 커밋 성공.

---

## Task 2: Vitest + 테스트 환경 설정

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (test 스크립트)

- [ ] **Step 1: 의존성 설치**

Run:
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Expected: 패키지 설치 완료.

- [ ] **Step 2: `vitest.config.ts` 작성**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

- [ ] **Step 3: `tests/setup.ts` 작성**

Create `tests/setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: `package.json`에 스크립트 추가**

Modify `package.json` scripts에 추가:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: 더미 테스트로 환경 검증**

Create `tests/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs vitest", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run:
```bash
npm test
```

Expected: 1 test passed.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "chore: set up Vitest with jsdom and React Testing Library"
```

---

## Task 3: 다크모드 + Pretendard 폰트 + 글로벌 스타일

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Create: `app/fonts.ts`

- [ ] **Step 1: Pretendard 폰트 설치**

Run:
```bash
npm install pretendard
```

(또는 next/font/local 방식으로 처리; 본 plan은 패키지 방식 사용)

- [ ] **Step 2: `app/globals.css` 작성**

Replace `app/globals.css`:
```css
@import "tailwindcss";
@import "pretendard/dist/web/variable/pretendardvariable.css";

@theme {
  --color-bg: #0a0a0b;
  --color-surface: #14141a;
  --color-border: #26262e;
  --color-text: #f5f5f7;
  --color-muted: #9a9aa3;
  --color-accent: #b6ff3c;   /* 라임 그린 — 강조 */
  --color-korean: #ff4d4f;   /* 한국 강조용 */
  --font-display: "Pretendard Variable", "Inter", system-ui, sans-serif;
}

html, body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-display);
  -webkit-font-smoothing: antialiased;
}

* {
  border-color: var(--color-border);
}
```

- [ ] **Step 3: `app/layout.tsx` 작성**

Replace `app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kickoff — 유럽 축구 대시보드",
  description: "EPL, 라리가, 분데스리가, 세리에A 순위, 일정, 하이라이트, 한국 선수까지 한 화면에.",
  openGraph: {
    title: "Kickoff",
    description: "유럽 축구를 한눈에",
    locale: "ko_KR",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 4: 임시 페이지로 폰트/색상 확인**

Replace `app/page.tsx`:
```tsx
export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-4xl font-bold">🦵 Kickoff</h1>
      <p className="text-[var(--color-muted)] mt-2">유럽 축구를 한눈에</p>
      <p className="mt-4 text-[var(--color-accent)]">accent</p>
      <p className="text-[var(--color-korean)]">🇰🇷 korean</p>
    </main>
  );
}
```

Run:
```bash
npm run dev
```

Expected: 어두운 배경에 흰 텍스트, Pretendard 폰트, 라임그린/빨강 강조색 확인. 종료.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: set up dark theme, Pretendard font, design tokens"
```

---

## Task 4: 환경변수 + API 키 자리 준비

**Files:**
- Create: `.env.local.example`
- Create: `lib/env.ts`

- [ ] **Step 1: `.env.local.example` 작성**

Create `.env.local.example`:
```
# Football-Data.org (https://www.football-data.org/client/register)
FOOTBALL_DATA_TOKEN=

# YouTube Data API v3 (https://console.cloud.google.com/)
YOUTUBE_API_KEY=

# 하이라이트 우선 채널 ID (쿠팡플레이)
YOUTUBE_PRIMARY_CHANNEL_ID=UCgKkUv9NWBhI4xK0XGCEcjA

# 폴백 채널 (콤마 구분)
YOUTUBE_FALLBACK_CHANNEL_IDS=
```

(`UCgKkUv9NWBhI4xK0XGCEcjA`는 쿠팡플레이 채널 ID 잠정값. 실제 발견되면 .env.local에서 교체)

- [ ] **Step 2: `lib/env.ts` 작성 (서버 전용 환경변수 검증)**

Create `lib/env.ts`:
```ts
import "server-only";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  footballDataToken: () => required("FOOTBALL_DATA_TOKEN"),
  youtubeApiKey: () => required("YOUTUBE_API_KEY"),
  youtubePrimaryChannelId: () => optional("YOUTUBE_PRIMARY_CHANNEL_ID"),
  youtubeFallbackChannelIds: () =>
    optional("YOUTUBE_FALLBACK_CHANNEL_IDS")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
};
```

- [ ] **Step 3: `server-only` 패키지 설치**

Run:
```bash
npm install server-only
```

- [ ] **Step 4: 사용자가 실제 `.env.local`을 만들도록 README 메모**

Append to `README.md` (없으면 생성):
```
## Local development

1. Copy `.env.local.example` → `.env.local`
2. Fill in:
   - `FOOTBALL_DATA_TOKEN`: register at https://www.football-data.org/client/register (free tier)
   - `YOUTUBE_API_KEY`: create at Google Cloud Console → APIs & Services → Credentials
3. `npm run dev`
```

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: scaffold env var handling with server-only guard"
```

---

## Task 5: 한국 시간대 유틸 (TDD)

**Files:**
- Create: `lib/time.ts`
- Create: `tests/time.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `tests/time.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatKST, formatRelativeKST } from "@/lib/time";

describe("formatKST", () => {
  it("formats UTC instant to KST date/time", () => {
    const iso = "2026-05-13T19:00:00Z"; // 19:00 UTC = 04:00 KST (다음 날)
    expect(formatKST(iso)).toBe("2026-05-14 04:00");
  });

  it("formats with weekday when requested", () => {
    const iso = "2026-05-13T19:00:00Z";
    expect(formatKST(iso, { withWeekday: true })).toBe("2026-05-14 (목) 04:00");
  });
});

describe("formatRelativeKST", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-13T12:00:00Z")); // KST 21:00 (수)
  });
  afterEach(() => vi.useRealTimers());

  it('returns "오늘 22:00" for same KST date later today', () => {
    const iso = "2026-05-13T13:00:00Z"; // KST 22:00 (수)
    expect(formatRelativeKST(iso)).toBe("오늘 22:00");
  });

  it('returns "내일 새벽 04:00" for next-day early hours', () => {
    const iso = "2026-05-13T19:00:00Z"; // KST 04:00 목
    expect(formatRelativeKST(iso)).toBe("내일 새벽 04:00");
  });

  it('returns "3일 후 22:00" for further future', () => {
    const iso = "2026-05-16T13:00:00Z"; // KST 22:00 (토)
    expect(formatRelativeKST(iso)).toBe("3일 후 22:00");
  });

  it('returns "어제 22:00" for previous KST day', () => {
    const iso = "2026-05-12T13:00:00Z"; // KST 22:00 화
    expect(formatRelativeKST(iso)).toBe("어제 22:00");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run:
```bash
npm test -- time
```

Expected: FAIL — `Cannot find module "@/lib/time"` 또는 함수 미정의.

- [ ] **Step 3: 최소 구현**

Create `lib/time.ts`:
```ts
const KST_OFFSET_MIN = 9 * 60;

function toKSTParts(iso: string) {
  const d = new Date(iso);
  const utcMs = d.getTime();
  const kst = new Date(utcMs + KST_OFFSET_MIN * 60_000);
  return {
    year: kst.getUTCFullYear(),
    month: kst.getUTCMonth() + 1,
    day: kst.getUTCDate(),
    hour: kst.getUTCHours(),
    minute: kst.getUTCMinutes(),
    weekday: kst.getUTCDay(), // 0=일
  };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

const WEEKDAY_KR = ["일", "월", "화", "수", "목", "금", "토"];

export function formatKST(iso: string, opts: { withWeekday?: boolean } = {}): string {
  const p = toKSTParts(iso);
  const base = `${p.year}-${pad(p.month)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}`;
  if (opts.withWeekday) {
    return `${p.year}-${pad(p.month)}-${pad(p.day)} (${WEEKDAY_KR[p.weekday]}) ${pad(p.hour)}:${pad(p.minute)}`;
  }
  return base;
}

function kstDateNum(iso: string) {
  const p = toKSTParts(iso);
  return p.year * 10000 + p.month * 100 + p.day;
}

export function formatRelativeKST(iso: string, now: Date = new Date()): string {
  const target = toKSTParts(iso);
  const ref = toKSTParts(now.toISOString());

  const diffDays =
    Math.floor(Date.UTC(target.year, target.month - 1, target.day) / 86_400_000) -
    Math.floor(Date.UTC(ref.year, ref.month - 1, ref.day) / 86_400_000);

  const hhmm = `${pad(target.hour)}:${pad(target.minute)}`;
  const dawn = target.hour < 6 ? "새벽 " : "";

  if (diffDays === 0) return `오늘 ${hhmm}`;
  if (diffDays === 1) return `내일 ${dawn}${hhmm}`;
  if (diffDays === -1) return `어제 ${hhmm}`;
  if (diffDays > 1) return `${diffDays}일 후 ${hhmm}`;
  return `${Math.abs(diffDays)}일 전 ${hhmm}`;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run:
```bash
npm test -- time
```

Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add lib/time.ts tests/time.test.ts
git commit -m "feat: add KST time formatting utilities"
```

---

## Task 6: 데이터 소스 인터페이스 정의

**Files:**
- Create: `lib/dataSource/types.ts`

- [ ] **Step 1: 타입과 인터페이스 작성**

Create `lib/dataSource/types.ts`:
```ts
export type LeagueCode = "PL" | "PD" | "BL1" | "SA" | "CL" | "FA" | "WC" | "EC";
// PL=EPL, PD=라리가, BL1=분데스, SA=세리에A, CL=챔스, FA=FA컵, WC=월드컵, EC=유로

export const TOP4_LEAGUES: { code: LeagueCode; nameKr: string; nameEn: string }[] = [
  { code: "PL", nameKr: "EPL", nameEn: "Premier League" },
  { code: "PD", nameKr: "라리가", nameEn: "La Liga" },
  { code: "BL1", nameKr: "분데스리가", nameEn: "Bundesliga" },
  { code: "SA", nameKr: "세리에A", nameEn: "Serie A" },
];

export interface Team {
  id: number;
  name: string;
  shortName: string;
  tla: string;       // 3-letter code (e.g. MCI, LIV)
  crestUrl: string;
}

export interface StandingRow {
  position: number;
  team: Team;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface Standings {
  leagueCode: LeagueCode;
  season: string;       // "2025/26"
  rows: StandingRow[];
  updatedAt: string;    // ISO
}

export type FixtureStatus = "SCHEDULED" | "LIVE" | "IN_PLAY" | "PAUSED" | "FINISHED" | "POSTPONED" | "CANCELLED";

export interface Fixture {
  id: number;
  leagueCode: LeagueCode;
  utcKickoff: string;    // ISO UTC
  status: FixtureStatus;
  home: Team;
  away: Team;
  score: { home: number | null; away: number | null };
  highlightYoutubeId?: string;
  hasKoreanPlayer?: boolean;
}

export interface HighlightVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
}

export interface DataSource {
  getStandings(leagueCode: LeagueCode): Promise<Standings>;
  getRecentAndUpcomingFixtures(opts: { leagueCodes: LeagueCode[]; daysPast: number; daysFuture: number }): Promise<Fixture[]>;
}

export interface HighlightSource {
  getRecentVideos(opts: { maxResults: number }): Promise<HighlightVideo[]>;
}
```

- [ ] **Step 2: 컴파일 확인**

Run:
```bash
npx tsc --noEmit
```

Expected: 오류 없음.

- [ ] **Step 3: 커밋**

```bash
git add lib/dataSource/types.ts
git commit -m "feat: define DataSource interface and core domain types"
```

---

## Task 7: Football-Data.org 어댑터 — 순위 (TDD)

**Files:**
- Create: `lib/dataSource/footballData.ts`
- Create: `tests/dataSource/footballData.test.ts`
- Create: `tests/fixtures/fd-standings-pl.json` (실제 API 응답 형태)

- [ ] **Step 1: API 응답 픽스처 작성**

Create `tests/fixtures/fd-standings-pl.json`:
```json
{
  "competition": { "code": "PL", "name": "Premier League" },
  "season": { "startDate": "2025-08-15", "endDate": "2026-05-24" },
  "standings": [
    {
      "type": "TOTAL",
      "table": [
        {
          "position": 1,
          "team": { "id": 64, "name": "Liverpool FC", "shortName": "Liverpool", "tla": "LIV", "crest": "https://crests.football-data.org/64.png" },
          "playedGames": 30, "won": 22, "draw": 5, "lost": 3,
          "points": 71, "goalsFor": 68, "goalsAgainst": 28, "goalDifference": 40
        },
        {
          "position": 2,
          "team": { "id": 57, "name": "Arsenal FC", "shortName": "Arsenal", "tla": "ARS", "crest": "https://crests.football-data.org/57.png" },
          "playedGames": 30, "won": 20, "draw": 7, "lost": 3,
          "points": 67, "goalsFor": 60, "goalsAgainst": 25, "goalDifference": 35
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: 실패하는 테스트 작성**

Create `tests/dataSource/footballData.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import fixture from "../fixtures/fd-standings-pl.json";
import { FootballDataSource } from "@/lib/dataSource/footballData";

describe("FootballDataSource.getStandings", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => fixture,
    })));
  });

  it("calls correct endpoint with auth token", async () => {
    const ds = new FootballDataSource("test-token");
    await ds.getStandings("PL");

    const call = (fetch as any).mock.calls[0];
    expect(call[0]).toBe("https://api.football-data.org/v4/competitions/PL/standings");
    expect(call[1].headers["X-Auth-Token"]).toBe("test-token");
  });

  it("maps response to Standings shape", async () => {
    const ds = new FootballDataSource("test-token");
    const s = await ds.getStandings("PL");

    expect(s.leagueCode).toBe("PL");
    expect(s.season).toBe("2025/26");
    expect(s.rows).toHaveLength(2);
    expect(s.rows[0]).toMatchObject({
      position: 1,
      points: 71,
      team: { id: 64, tla: "LIV", crestUrl: "https://crests.football-data.org/64.png" },
    });
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run:
```bash
npm test -- footballData
```

Expected: FAIL — 모듈/클래스 미정의.

- [ ] **Step 4: 어댑터 구현 (순위만)**

Create `lib/dataSource/footballData.ts`:
```ts
import type { DataSource, LeagueCode, Standings, Fixture } from "./types";

const BASE = "https://api.football-data.org/v4";

interface FdTeam {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
}

interface FdStandingsResponse {
  season: { startDate: string; endDate: string };
  standings: { type: string; table: FdTableRow[] }[];
}

interface FdTableRow {
  position: number;
  team: FdTeam;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

function mapTeam(t: FdTeam) {
  return {
    id: t.id,
    name: t.name,
    shortName: t.shortName ?? t.name,
    tla: t.tla ?? "",
    crestUrl: t.crest ?? "",
  };
}

function seasonLabel(startDate: string, endDate: string): string {
  const start = new Date(startDate).getUTCFullYear();
  const end = new Date(endDate).getUTCFullYear();
  return `${start}/${end.toString().slice(2)}`;
}

export class FootballDataSource implements Pick<DataSource, "getStandings"> {
  constructor(private token: string) {}

  private async fetchJson<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "X-Auth-Token": this.token },
      next: { revalidate: 3600 },
    } as RequestInit);
    if (!res.ok) {
      throw new Error(`football-data ${path} ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  async getStandings(leagueCode: LeagueCode): Promise<Standings> {
    const data = await this.fetchJson<FdStandingsResponse>(
      `/competitions/${leagueCode}/standings`
    );
    const total = data.standings.find((s) => s.type === "TOTAL") ?? data.standings[0];
    return {
      leagueCode,
      season: seasonLabel(data.season.startDate, data.season.endDate),
      rows: total.table.map((r) => ({
        position: r.position,
        team: mapTeam(r.team),
        playedGames: r.playedGames,
        won: r.won,
        draw: r.draw,
        lost: r.lost,
        points: r.points,
        goalsFor: r.goalsFor,
        goalsAgainst: r.goalsAgainst,
        goalDifference: r.goalDifference,
      })),
      updatedAt: new Date().toISOString(),
    };
  }
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run:
```bash
npm test -- footballData
```

Expected: PASS (2 tests).

- [ ] **Step 6: 커밋**

```bash
git add lib/dataSource/footballData.ts tests/dataSource/footballData.test.ts tests/fixtures/fd-standings-pl.json
git commit -m "feat: implement Football-Data.org standings adapter with tests"
```

---

## Task 8: Football-Data.org 어댑터 — 일정/결과 (TDD)

**Files:**
- Modify: `lib/dataSource/footballData.ts`
- Modify: `tests/dataSource/footballData.test.ts`
- Create: `tests/fixtures/fd-matches.json`

- [ ] **Step 1: 픽스처 추가**

Create `tests/fixtures/fd-matches.json`:
```json
{
  "matches": [
    {
      "id": 1001,
      "competition": { "code": "PL" },
      "utcDate": "2026-05-14T19:00:00Z",
      "status": "SCHEDULED",
      "homeTeam": { "id": 65, "name": "Manchester City FC", "shortName": "Man City", "tla": "MCI", "crest": "https://crests.football-data.org/65.png" },
      "awayTeam": { "id": 64, "name": "Liverpool FC", "shortName": "Liverpool", "tla": "LIV", "crest": "https://crests.football-data.org/64.png" },
      "score": { "fullTime": { "home": null, "away": null } }
    },
    {
      "id": 1002,
      "competition": { "code": "PL" },
      "utcDate": "2026-05-12T14:00:00Z",
      "status": "FINISHED",
      "homeTeam": { "id": 73, "name": "Tottenham Hotspur FC", "shortName": "Tottenham", "tla": "TOT", "crest": "https://crests.football-data.org/73.png" },
      "awayTeam": { "id": 61, "name": "Chelsea FC", "shortName": "Chelsea", "tla": "CHE", "crest": "https://crests.football-data.org/61.png" },
      "score": { "fullTime": { "home": 2, "away": 1 } }
    }
  ]
}
```

- [ ] **Step 2: 실패 테스트 추가**

Append to `tests/dataSource/footballData.test.ts`:
```ts
import matchesFixture from "../fixtures/fd-matches.json";

describe("FootballDataSource.getRecentAndUpcomingFixtures", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => matchesFixture,
    })));
  });

  it("queries date range with leagueCodes filter", async () => {
    const ds = new FootballDataSource("test-token");
    await ds.getRecentAndUpcomingFixtures({
      leagueCodes: ["PL", "PD"],
      daysPast: 3,
      daysFuture: 7,
    });

    const url = (fetch as any).mock.calls[0][0] as string;
    expect(url).toContain("https://api.football-data.org/v4/matches");
    expect(url).toContain("competitions=PL,PD");
    expect(url).toMatch(/dateFrom=\d{4}-\d{2}-\d{2}/);
    expect(url).toMatch(/dateTo=\d{4}-\d{2}-\d{2}/);
  });

  it("maps to Fixture shape", async () => {
    const ds = new FootballDataSource("test-token");
    const fixtures = await ds.getRecentAndUpcomingFixtures({
      leagueCodes: ["PL"],
      daysPast: 3,
      daysFuture: 7,
    });

    expect(fixtures).toHaveLength(2);
    expect(fixtures[0]).toMatchObject({
      id: 1001,
      leagueCode: "PL",
      utcKickoff: "2026-05-14T19:00:00Z",
      status: "SCHEDULED",
      home: { tla: "MCI" },
      away: { tla: "LIV" },
      score: { home: null, away: null },
    });
    expect(fixtures[1].score).toEqual({ home: 2, away: 1 });
    expect(fixtures[1].status).toBe("FINISHED");
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run:
```bash
npm test -- footballData
```

Expected: FAIL — `getRecentAndUpcomingFixtures` 미구현.

- [ ] **Step 4: 메서드 구현**

Modify `lib/dataSource/footballData.ts` — `FootballDataSource` 클래스에 메서드 추가, `Pick`에 메서드 추가:

먼저 `class FootballDataSource implements Pick<DataSource, "getStandings">` 줄을 다음으로 교체:
```ts
export class FootballDataSource implements DataSource {
```

그리고 클래스 본문 끝(`getStandings` 메서드 뒤)에 추가:
```ts
  async getRecentAndUpcomingFixtures(opts: {
    leagueCodes: LeagueCode[];
    daysPast: number;
    daysFuture: number;
  }): Promise<Fixture[]> {
    const now = new Date();
    const from = new Date(now.getTime() - opts.daysPast * 86_400_000);
    const to = new Date(now.getTime() + opts.daysFuture * 86_400_000);
    const dateFrom = from.toISOString().slice(0, 10);
    const dateTo = to.toISOString().slice(0, 10);

    const params = new URLSearchParams({
      competitions: opts.leagueCodes.join(","),
      dateFrom,
      dateTo,
    });

    const data = await this.fetchJson<{ matches: FdMatch[] }>(
      `/matches?${params.toString()}`
    );

    return data.matches.map(mapMatch);
  }
}

interface FdMatch {
  id: number;
  competition: { code: string };
  utcDate: string;
  status: string;
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score: { fullTime: { home: number | null; away: number | null } };
}

function mapMatch(m: FdMatch): Fixture {
  return {
    id: m.id,
    leagueCode: m.competition.code as LeagueCode,
    utcKickoff: m.utcDate,
    status: m.status as Fixture["status"],
    home: mapTeam(m.homeTeam),
    away: mapTeam(m.awayTeam),
    score: { home: m.score.fullTime.home, away: m.score.fullTime.away },
  };
}
```

`}` 위치 주의: `}` 클래스 닫는 중괄호 다음에 `FdMatch` 인터페이스와 `mapMatch` 함수가 옴.

- [ ] **Step 5: 테스트 통과 확인**

Run:
```bash
npm test -- footballData
```

Expected: PASS (4 tests).

- [ ] **Step 6: 커밋**

```bash
git add lib/dataSource/footballData.ts tests/dataSource/footballData.test.ts tests/fixtures/fd-matches.json
git commit -m "feat: implement Football-Data.org fixtures adapter with date range filter"
```

---

## Task 9: YouTube 어댑터 (단순 — 모킹 위주)

**Files:**
- Create: `lib/dataSource/youtube.ts`
- Create: `tests/dataSource/youtube.test.ts`
- Create: `tests/fixtures/yt-search.json`

- [ ] **Step 1: 픽스처**

Create `tests/fixtures/yt-search.json`:
```json
{
  "items": [
    {
      "id": { "kind": "youtube#video", "videoId": "abc123" },
      "snippet": {
        "publishedAt": "2026-05-12T22:30:00Z",
        "channelTitle": "쿠팡플레이",
        "title": "[하이라이트] 토트넘 vs 첼시 | 25-26 EPL",
        "thumbnails": { "high": { "url": "https://i.ytimg.com/vi/abc123/hqdefault.jpg" } }
      }
    },
    {
      "id": { "kind": "youtube#video", "videoId": "def456" },
      "snippet": {
        "publishedAt": "2026-05-11T22:30:00Z",
        "channelTitle": "쿠팡플레이",
        "title": "[하이라이트] 맨시티 vs 리버풀 | 25-26 EPL",
        "thumbnails": { "high": { "url": "https://i.ytimg.com/vi/def456/hqdefault.jpg" } }
      }
    }
  ]
}
```

- [ ] **Step 2: 테스트 작성**

Create `tests/dataSource/youtube.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import fixture from "../fixtures/yt-search.json";
import { YoutubeHighlightSource } from "@/lib/dataSource/youtube";

describe("YoutubeHighlightSource.getRecentVideos", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => fixture,
    })));
  });

  it("calls YouTube search with channelId + order=date", async () => {
    const src = new YoutubeHighlightSource("api-key", "CHANNEL_ID", []);
    await src.getRecentVideos({ maxResults: 20 });

    const url = (fetch as any).mock.calls[0][0] as string;
    expect(url).toContain("https://www.googleapis.com/youtube/v3/search");
    expect(url).toContain("key=api-key");
    expect(url).toContain("channelId=CHANNEL_ID");
    expect(url).toContain("order=date");
    expect(url).toContain("type=video");
    expect(url).toContain("maxResults=20");
  });

  it("maps results to HighlightVideo shape", async () => {
    const src = new YoutubeHighlightSource("api-key", "CHANNEL_ID", []);
    const videos = await src.getRecentVideos({ maxResults: 20 });
    expect(videos).toHaveLength(2);
    expect(videos[0]).toEqual({
      videoId: "abc123",
      title: "[하이라이트] 토트넘 vs 첼시 | 25-26 EPL",
      channelTitle: "쿠팡플레이",
      publishedAt: "2026-05-12T22:30:00Z",
      thumbnailUrl: "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
    });
  });
});
```

- [ ] **Step 3: 실패 확인**

Run:
```bash
npm test -- youtube
```

Expected: FAIL.

- [ ] **Step 4: 구현**

Create `lib/dataSource/youtube.ts`:
```ts
import type { HighlightSource, HighlightVideo } from "./types";

const BASE = "https://www.googleapis.com/youtube/v3";

interface YtSearchResponse {
  items: Array<{
    id: { kind: string; videoId?: string };
    snippet: {
      publishedAt: string;
      channelTitle: string;
      title: string;
      thumbnails: { high?: { url: string }; default?: { url: string } };
    };
  }>;
}

export class YoutubeHighlightSource implements HighlightSource {
  constructor(
    private apiKey: string,
    private primaryChannelId: string,
    private fallbackChannelIds: string[]
  ) {}

  async getRecentVideos(opts: { maxResults: number }): Promise<HighlightVideo[]> {
    const channels = [this.primaryChannelId, ...this.fallbackChannelIds].filter(Boolean);
    const results: HighlightVideo[] = [];
    for (const channelId of channels) {
      results.push(...(await this.fetchChannel(channelId, opts.maxResults)));
    }
    return results.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }

  private async fetchChannel(channelId: string, maxResults: number): Promise<HighlightVideo[]> {
    const params = new URLSearchParams({
      key: this.apiKey,
      channelId,
      part: "snippet",
      order: "date",
      type: "video",
      maxResults: String(maxResults),
    });
    const res = await fetch(`${BASE}/search?${params.toString()}`, {
      next: { revalidate: 3600 },
    } as RequestInit);
    if (!res.ok) throw new Error(`youtube ${res.status}`);
    const data = (await res.json()) as YtSearchResponse;
    return data.items
      .filter((i) => i.id.videoId)
      .map((i) => ({
        videoId: i.id.videoId!,
        title: i.snippet.title,
        channelTitle: i.snippet.channelTitle,
        publishedAt: i.snippet.publishedAt,
        thumbnailUrl: i.snippet.thumbnails.high?.url ?? i.snippet.thumbnails.default?.url ?? "",
      }));
  }
}
```

- [ ] **Step 5: 통과 확인**

Run:
```bash
npm test -- youtube
```

Expected: PASS.

- [ ] **Step 6: 커밋**

```bash
git add lib/dataSource/youtube.ts tests/dataSource/youtube.test.ts tests/fixtures/yt-search.json
git commit -m "feat: implement YouTube Data API adapter for highlights"
```

---

## Task 10: 하이라이트 ↔ 경기 매칭 (TDD)

**Files:**
- Create: `lib/highlightMatcher.ts`
- Create: `tests/highlightMatcher.test.ts`

- [ ] **Step 1: 실패 테스트**

Create `tests/highlightMatcher.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { matchHighlights } from "@/lib/highlightMatcher";
import type { Fixture, HighlightVideo } from "@/lib/dataSource/types";

const team = (id: number, name: string, shortName: string, tla: string) => ({
  id, name, shortName, tla, crestUrl: "",
});

const fixtures: Fixture[] = [
  {
    id: 1, leagueCode: "PL",
    utcKickoff: "2026-05-11T14:00:00Z",
    status: "FINISHED",
    home: team(65, "Manchester City FC", "Man City", "MCI"),
    away: team(64, "Liverpool FC", "Liverpool", "LIV"),
    score: { home: 2, away: 1 },
  },
  {
    id: 2, leagueCode: "PL",
    utcKickoff: "2026-05-12T14:00:00Z",
    status: "FINISHED",
    home: team(73, "Tottenham Hotspur FC", "Tottenham", "TOT"),
    away: team(61, "Chelsea FC", "Chelsea", "CHE"),
    score: { home: 2, away: 1 },
  },
];

const videos: HighlightVideo[] = [
  {
    videoId: "abc",
    title: "[하이라이트] 토트넘 vs 첼시 | 25-26 EPL",
    channelTitle: "쿠팡플레이",
    publishedAt: "2026-05-12T22:00:00Z",
    thumbnailUrl: "",
  },
  {
    videoId: "def",
    title: "[하이라이트] 맨시티 2:1 리버풀 | 25-26 EPL",
    channelTitle: "쿠팡플레이",
    publishedAt: "2026-05-11T22:00:00Z",
    thumbnailUrl: "",
  },
];

describe("matchHighlights", () => {
  it("attaches youtube videoId to matching fixtures", () => {
    const result = matchHighlights(fixtures, videos);
    const tot = result.find((f) => f.id === 2)!;
    const mci = result.find((f) => f.id === 1)!;
    expect(tot.highlightYoutubeId).toBe("abc");
    expect(mci.highlightYoutubeId).toBe("def");
  });

  it("leaves highlightYoutubeId undefined when no match", () => {
    const result = matchHighlights(fixtures, []);
    expect(result[0].highlightYoutubeId).toBeUndefined();
  });

  it("does not match across very different dates (>3 days)", () => {
    const stale: HighlightVideo[] = [{
      videoId: "old",
      title: "[하이라이트] 맨시티 vs 리버풀",
      channelTitle: "쿠팡플레이",
      publishedAt: "2026-04-01T22:00:00Z",
      thumbnailUrl: "",
    }];
    const result = matchHighlights(fixtures, stale);
    expect(result[0].highlightYoutubeId).toBeUndefined();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run:
```bash
npm test -- highlightMatcher
```

Expected: FAIL.

- [ ] **Step 3: 구현**

Create `lib/highlightMatcher.ts`:
```ts
import type { Fixture, HighlightVideo } from "./dataSource/types";

const TEAM_ALIASES: Record<string, string[]> = {
  // EPL
  "Manchester City": ["맨시티", "맨체스터 시티", "manchester city", "man city", "mci"],
  "Liverpool": ["리버풀", "liverpool", "liv"],
  "Tottenham Hotspur": ["토트넘", "tottenham", "spurs", "tot"],
  "Chelsea": ["첼시", "chelsea", "che"],
  "Arsenal": ["아스널", "아스날", "arsenal", "ars"],
  "Manchester United": ["맨유", "맨체스터 유나이티드", "manchester united", "man utd", "mun"],
  // 라리가
  "Real Madrid": ["레알", "레알마드리드", "real madrid", "rma"],
  "Barcelona": ["바르사", "바르셀로나", "barcelona", "bar"],
  "Atletico Madrid": ["AT마드리드", "아틀레티코", "atletico", "atm"],
  // 분데스
  "Bayern Munich": ["바이언", "뮌헨", "bayern", "fcb"],
  "Bayer 04 Leverkusen": ["레버쿠젠", "leverkusen", "b04"],
  "Borussia Dortmund": ["도르트문트", "도르트", "dortmund", "bvb"],
  // 세리에
  "Inter": ["인테르", "inter"],
  "Juventus": ["유베", "유벤투스", "juventus", "juv"],
  "AC Milan": ["AC밀란", "밀란", "milan", "mil"],
  "Atalanta": ["아탈란타", "atalanta"],
};

function aliasesFor(team: { name: string; shortName: string; tla: string }): string[] {
  const candidates = [team.name, team.shortName, team.tla].filter(Boolean);
  for (const [key, list] of Object.entries(TEAM_ALIASES)) {
    if (candidates.some((c) => c.toLowerCase().includes(key.toLowerCase()))) {
      return [...list, ...candidates.map((c) => c.toLowerCase())];
    }
  }
  return candidates.map((c) => c.toLowerCase());
}

function titleMentions(title: string, aliases: string[]): boolean {
  const lower = title.toLowerCase();
  return aliases.some((a) => lower.includes(a.toLowerCase()));
}

function dayDiff(a: string, b: string): number {
  const da = Math.floor(new Date(a).getTime() / 86_400_000);
  const db = Math.floor(new Date(b).getTime() / 86_400_000);
  return Math.abs(da - db);
}

export function matchHighlights(fixtures: Fixture[], videos: HighlightVideo[]): Fixture[] {
  return fixtures.map((f) => {
    const homeAliases = aliasesFor(f.home);
    const awayAliases = aliasesFor(f.away);
    const candidate = videos
      .filter((v) => dayDiff(v.publishedAt, f.utcKickoff) <= 3)
      .find((v) => titleMentions(v.title, homeAliases) && titleMentions(v.title, awayAliases));
    return candidate ? { ...f, highlightYoutubeId: candidate.videoId } : f;
  });
}
```

- [ ] **Step 4: 통과 확인**

Run:
```bash
npm test -- highlightMatcher
```

Expected: PASS (3 tests).

- [ ] **Step 5: 커밋**

```bash
git add lib/highlightMatcher.ts tests/highlightMatcher.test.ts
git commit -m "feat: implement team-name based highlight-to-fixture matcher"
```

---

## Task 11: 한국 선수 데이터 + 마커

**Files:**
- Create: `data/korean-players.json`
- Create: `lib/koreanPlayers.ts`
- Create: `tests/koreanPlayers.test.ts`

- [ ] **Step 1: 한국 선수 명단**

Create `data/korean-players.json`:
```json
[
  { "id": "son-heung-min", "name": "손흥민", "nameEn": "Son Heung-min", "teamId": 73, "teamName": "Tottenham Hotspur", "position": "FW" },
  { "id": "lee-kang-in", "name": "이강인", "nameEn": "Lee Kang-in", "teamId": 524, "teamName": "Paris Saint-Germain", "position": "MF" },
  { "id": "kim-min-jae", "name": "김민재", "nameEn": "Kim Min-jae", "teamId": 5, "teamName": "Bayern Munich", "position": "DF" },
  { "id": "hwang-hee-chan", "name": "황희찬", "nameEn": "Hwang Hee-chan", "teamId": 76, "teamName": "Wolverhampton Wanderers", "position": "FW" },
  { "id": "hwang-in-beom", "name": "황인범", "nameEn": "Hwang In-beom", "teamId": 78, "teamName": "Feyenoord", "position": "MF" }
]
```

> 운영 중 추가/수정은 이 파일을 직접 편집한다. team `id`는 Football-Data.org 팀 ID 기준.

- [ ] **Step 2: 테스트**

Create `tests/koreanPlayers.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { tagKoreanFixtures, listKoreanPlayers } from "@/lib/koreanPlayers";
import type { Fixture } from "@/lib/dataSource/types";

const f = (id: number, homeId: number, awayId: number): Fixture => ({
  id, leagueCode: "PL",
  utcKickoff: "2026-05-12T14:00:00Z",
  status: "FINISHED",
  home: { id: homeId, name: "", shortName: "", tla: "", crestUrl: "" },
  away: { id: awayId, name: "", shortName: "", tla: "", crestUrl: "" },
  score: { home: 1, away: 0 },
});

describe("tagKoreanFixtures", () => {
  it("marks fixtures where a Korean player's team plays", () => {
    const fixtures = [f(1, 73, 64), f(2, 65, 64)]; // 토트넘 vs 리버풀 (손흥민), 맨시 vs 리버풀
    const result = tagKoreanFixtures(fixtures);
    expect(result[0].hasKoreanPlayer).toBe(true);
    expect(result[1].hasKoreanPlayer).toBe(false);
  });
});

describe("listKoreanPlayers", () => {
  it("returns all players", () => {
    expect(listKoreanPlayers().length).toBeGreaterThanOrEqual(5);
    expect(listKoreanPlayers().some((p) => p.name === "손흥민")).toBe(true);
  });
});
```

- [ ] **Step 3: 실패 확인**

Run:
```bash
npm test -- koreanPlayers
```

Expected: FAIL.

- [ ] **Step 4: 구현**

Create `lib/koreanPlayers.ts`:
```ts
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
```

- [ ] **Step 5: tsconfig에서 JSON resolution 확인**

`tsconfig.json`에 `"resolveJsonModule": true`가 있는지 확인. 없으면 추가.

- [ ] **Step 6: 통과 확인**

Run:
```bash
npm test -- koreanPlayers
```

Expected: PASS.

- [ ] **Step 7: 커밋**

```bash
git add data/korean-players.json lib/koreanPlayers.ts tests/koreanPlayers.test.ts tsconfig.json
git commit -m "feat: add Korean player data and fixture tagging"
```

---

## Task 12: 데이터 소스 합성 (`lib/dataSource/index.ts`)

**Files:**
- Create: `lib/dataSource/index.ts`

- [ ] **Step 1: 합성 모듈 작성**

Create `lib/dataSource/index.ts`:
```ts
import "server-only";
import { env } from "@/lib/env";
import { FootballDataSource } from "./footballData";
import { YoutubeHighlightSource } from "./youtube";
import { matchHighlights } from "@/lib/highlightMatcher";
import { tagKoreanFixtures } from "@/lib/koreanPlayers";
import type { Fixture, LeagueCode, Standings } from "./types";

const TOP4: LeagueCode[] = ["PL", "PD", "BL1", "SA"];

let _footballData: FootballDataSource | null = null;
function football() {
  if (!_footballData) _footballData = new FootballDataSource(env.footballDataToken());
  return _footballData;
}

let _youtube: YoutubeHighlightSource | null = null;
function youtube() {
  if (!_youtube) {
    _youtube = new YoutubeHighlightSource(
      env.youtubeApiKey(),
      env.youtubePrimaryChannelId(),
      env.youtubeFallbackChannelIds()
    );
  }
  return _youtube;
}

export async function fetchTop4Standings(): Promise<Standings[]> {
  return Promise.all(TOP4.map((c) => football().getStandings(c)));
}

export async function fetchEnrichedFixtures(): Promise<Fixture[]> {
  const [fixtures, videos] = await Promise.all([
    football().getRecentAndUpcomingFixtures({
      leagueCodes: [...TOP4, "CL"],
      daysPast: 3,
      daysFuture: 7,
    }),
    youtube().getRecentVideos({ maxResults: 30 }),
  ]);
  return tagKoreanFixtures(matchHighlights(fixtures, videos));
}

export type { Fixture, Standings, LeagueCode } from "./types";
```

- [ ] **Step 2: 타입체크**

Run:
```bash
npx tsc --noEmit
```

Expected: 오류 없음.

- [ ] **Step 3: 커밋**

```bash
git add lib/dataSource/index.ts
git commit -m "feat: compose data sources and enrichment pipeline"
```

---

## Task 13: TeamBadge 컴포넌트

**Files:**
- Create: `components/TeamBadge.tsx`
- Create: `tests/components/TeamBadge.test.tsx`

- [ ] **Step 1: 테스트**

Create `tests/components/TeamBadge.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamBadge } from "@/components/TeamBadge";

const team = {
  id: 64, name: "Liverpool FC", shortName: "Liverpool", tla: "LIV",
  crestUrl: "https://crests.football-data.org/64.png",
};

describe("TeamBadge", () => {
  it("renders crest image with alt and team name", () => {
    render(<TeamBadge team={team} />);
    const img = screen.getByRole("img", { name: /liverpool/i });
    expect(img).toHaveAttribute("src", expect.stringContaining("/64.png"));
    expect(screen.getByText("Liverpool")).toBeInTheDocument();
  });

  it("hides text when textHidden prop set", () => {
    render(<TeamBadge team={team} textHidden />);
    expect(screen.queryByText("Liverpool")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run:
```bash
npm test -- TeamBadge
```

Expected: FAIL.

- [ ] **Step 3: 구현**

Create `components/TeamBadge.tsx`:
```tsx
import Image from "next/image";
import type { Team } from "@/lib/dataSource/types";

interface Props {
  team: Team;
  size?: number;
  textHidden?: boolean;
  className?: string;
}

export function TeamBadge({ team, size = 20, textHidden, className }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      {team.crestUrl ? (
        <Image
          src={team.crestUrl}
          alt={team.name}
          width={size}
          height={size}
          className="shrink-0"
          unoptimized
        />
      ) : (
        <span className="inline-block bg-[var(--color-border)] rounded-full" style={{ width: size, height: size }} aria-hidden />
      )}
      {!textHidden && <span className="truncate">{team.shortName}</span>}
    </span>
  );
}
```

- [ ] **Step 4: Next 이미지 외부 도메인 허용**

Modify `next.config.ts`:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "crests.football-data.org" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 5: 통과 확인**

Run:
```bash
npm test -- TeamBadge
```

Expected: PASS.

- [ ] **Step 6: 커밋**

```bash
git add components/TeamBadge.tsx tests/components/TeamBadge.test.tsx next.config.ts
git commit -m "feat: TeamBadge component with crest + short name"
```

---

## Task 14: MatchRow 컴포넌트

**Files:**
- Create: `components/MatchRow.tsx`
- Create: `tests/components/MatchRow.test.tsx`

- [ ] **Step 1: 테스트**

Create `tests/components/MatchRow.test.tsx`:
```tsx
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatchRow } from "@/components/MatchRow";
import type { Fixture } from "@/lib/dataSource/types";

const team = (id: number, name: string, sn: string, tla: string) => ({
  id, name, shortName: sn, tla, crestUrl: `https://crests.football-data.org/${id}.png`,
});

const finishedFixture: Fixture = {
  id: 1, leagueCode: "PL",
  utcKickoff: "2026-05-12T14:00:00Z",
  status: "FINISHED",
  home: team(73, "Tottenham", "Tottenham", "TOT"),
  away: team(61, "Chelsea", "Chelsea", "CHE"),
  score: { home: 2, away: 1 },
  highlightYoutubeId: "abc123",
  hasKoreanPlayer: true,
};

describe("MatchRow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-13T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("shows both teams and score for finished match", () => {
    render(<MatchRow fixture={finishedFixture} />);
    expect(screen.getByText("Tottenham")).toBeInTheDocument();
    expect(screen.getByText("Chelsea")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders highlight link when youtube id present", () => {
    render(<MatchRow fixture={finishedFixture} />);
    const link = screen.getByRole("link", { name: /하이라이트/ });
    expect(link).toHaveAttribute("href", "https://www.youtube.com/watch?v=abc123");
  });

  it("shows Korean flag when hasKoreanPlayer", () => {
    render(<MatchRow fixture={finishedFixture} />);
    expect(screen.getByLabelText(/한국 선수 출전/)).toBeInTheDocument();
  });

  it("shows VS (not score) for scheduled match", () => {
    const sched: Fixture = { ...finishedFixture, status: "SCHEDULED", score: { home: null, away: null } };
    render(<MatchRow fixture={sched} />);
    expect(screen.getByText("VS")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run:
```bash
npm test -- MatchRow
```

Expected: FAIL.

- [ ] **Step 3: 구현**

Create `components/MatchRow.tsx`:
```tsx
import Link from "next/link";
import { TeamBadge } from "./TeamBadge";
import { formatRelativeKST } from "@/lib/time";
import type { Fixture } from "@/lib/dataSource/types";

interface Props {
  fixture: Fixture;
}

export function MatchRow({ fixture }: Props) {
  const isFinished = fixture.status === "FINISHED";
  return (
    <div className="grid grid-cols-[80px_1fr_60px_1fr_auto] items-center gap-3 py-3 border-b border-[var(--color-border)] text-sm">
      <span className="text-[var(--color-muted)]">{formatRelativeKST(fixture.utcKickoff)}</span>
      <div className="flex items-center justify-end gap-2 min-w-0">
        <TeamBadge team={fixture.home} />
      </div>
      <div className="text-center font-mono">
        {isFinished ? (
          <span><span>{fixture.score.home}</span> - <span>{fixture.score.away}</span></span>
        ) : (
          <span className="text-[var(--color-muted)]">VS</span>
        )}
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <TeamBadge team={fixture.away} />
      </div>
      <div className="flex items-center gap-2">
        {fixture.hasKoreanPlayer && (
          <span aria-label="한국 선수 출전" title="한국 선수 출전" className="text-[var(--color-korean)]">🇰🇷</span>
        )}
        {fixture.highlightYoutubeId && (
          <Link
            href={`https://www.youtube.com/watch?v=${fixture.highlightYoutubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent)] hover:underline whitespace-nowrap"
          >
            ▶ 하이라이트
          </Link>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run:
```bash
npm test -- MatchRow
```

Expected: PASS (4 tests).

- [ ] **Step 5: 커밋**

```bash
git add components/MatchRow.tsx tests/components/MatchRow.test.tsx
git commit -m "feat: MatchRow component with score, KR flag, highlight link"
```

---

## Task 15: LeagueStandingsCard 컴포넌트

**Files:**
- Create: `components/LeagueStandingsCard.tsx`

- [ ] **Step 1: 구현 (단순 표시 컴포넌트 — 테스트는 통합 페이지에서)**

Create `components/LeagueStandingsCard.tsx`:
```tsx
import { TeamBadge } from "./TeamBadge";
import type { Standings, LeagueCode } from "@/lib/dataSource/types";
import { TOP4_LEAGUES } from "@/lib/dataSource/types";

interface Props {
  standings: Standings;
  topN?: number;
}

const nameByCode: Record<LeagueCode, string> = Object.fromEntries(
  TOP4_LEAGUES.map((l) => [l.code, l.nameKr])
) as Record<LeagueCode, string>;

export function LeagueStandingsCard({ standings, topN = 6 }: Props) {
  const title = nameByCode[standings.leagueCode] ?? standings.leagueCode;
  return (
    <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] min-w-[220px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-base">{title}</h3>
        <span className="text-xs text-[var(--color-muted)]">{standings.season}</span>
      </div>
      <ol className="space-y-2">
        {standings.rows.slice(0, topN).map((r) => (
          <li key={r.team.id} className="flex items-center gap-2 text-sm">
            <span className="w-5 text-[var(--color-muted)] tabular-nums">{r.position}</span>
            <TeamBadge team={r.team} size={18} />
            <span className="ml-auto tabular-nums font-mono">{r.points}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 2: 타입체크**

Run:
```bash
npx tsc --noEmit
```

Expected: 오류 없음.

- [ ] **Step 3: 커밋**

```bash
git add components/LeagueStandingsCard.tsx
git commit -m "feat: LeagueStandingsCard component"
```

---

## Task 16: UpcomingFixtures + Highlight 섹션 컴포넌트

**Files:**
- Create: `components/UpcomingFixtures.tsx`
- Create: `components/HighlightCard.tsx`
- Create: `components/HighlightStrip.tsx`

- [ ] **Step 1: UpcomingFixtures**

Create `components/UpcomingFixtures.tsx`:
```tsx
import { MatchRow } from "./MatchRow";
import type { Fixture } from "@/lib/dataSource/types";

interface Props {
  fixtures: Fixture[];
}

export function UpcomingFixtures({ fixtures }: Props) {
  const sorted = [...fixtures].sort((a, b) => a.utcKickoff.localeCompare(b.utcKickoff));
  return (
    <section className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]">
      <h2 className="font-bold text-lg mb-2">오늘 & 다가오는 경기 <span className="text-[var(--color-muted)] text-sm font-normal">(KST)</span></h2>
      {sorted.length === 0 ? (
        <p className="text-[var(--color-muted)] py-4">예정된 경기가 없어요.</p>
      ) : (
        <div>{sorted.slice(0, 12).map((f) => <MatchRow key={f.id} fixture={f} />)}</div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: HighlightCard**

Create `components/HighlightCard.tsx`:
```tsx
import Image from "next/image";
import Link from "next/link";
import type { HighlightVideo } from "@/lib/dataSource/types";

export function HighlightCard({ video }: { video: HighlightVideo }) {
  return (
    <Link
      href={`https://www.youtube.com/watch?v=${video.videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-[260px] shrink-0 group"
    >
      <div className="relative aspect-video rounded-lg overflow-hidden bg-[var(--color-border)]">
        {video.thumbnailUrl && (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            sizes="260px"
            className="object-cover group-hover:opacity-90 transition"
            unoptimized
          />
        )}
        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-2 py-1 rounded">
          ▶
        </span>
      </div>
      <div className="mt-2">
        <p className="text-sm line-clamp-2">{video.title}</p>
        <p className="text-xs text-[var(--color-muted)] mt-1">{video.channelTitle}</p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: HighlightStrip**

Create `components/HighlightStrip.tsx`:
```tsx
import { HighlightCard } from "./HighlightCard";
import type { HighlightVideo } from "@/lib/dataSource/types";

export function HighlightStrip({ videos }: { videos: HighlightVideo[] }) {
  return (
    <section className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]">
      <h2 className="font-bold text-lg mb-3">최근 하이라이트 <span className="text-[var(--color-muted)] text-sm font-normal">(쿠팡플레이 등)</span></h2>
      {videos.length === 0 ? (
        <p className="text-[var(--color-muted)] py-4">아직 업로드된 하이라이트가 없어요.</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
          {videos.slice(0, 12).map((v) => <HighlightCard key={v.videoId} video={v} />)}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: 타입체크**

Run:
```bash
npx tsc --noEmit
```

Expected: 오류 없음.

- [ ] **Step 5: 커밋**

```bash
git add components/UpcomingFixtures.tsx components/HighlightCard.tsx components/HighlightStrip.tsx
git commit -m "feat: UpcomingFixtures, HighlightCard, HighlightStrip components"
```

---

## Task 17: KoreanPlayerSection 컴포넌트

**Files:**
- Create: `components/KoreanPlayerSection.tsx`

- [ ] **Step 1: 구현**

Create `components/KoreanPlayerSection.tsx`:
```tsx
import { listKoreanPlayers } from "@/lib/koreanPlayers";
import type { Fixture } from "@/lib/dataSource/types";

interface Props {
  fixtures: Fixture[];
}

interface PlayerActivity {
  id: string;
  name: string;
  teamName: string;
  recentMatch: { opponent: string; result: string; scoreLine: string } | null;
}

function summarize(fixtures: Fixture[]): PlayerActivity[] {
  const players = listKoreanPlayers();
  return players.map((p) => {
    const recent = fixtures
      .filter((f) => f.status === "FINISHED" && (f.home.id === p.teamId || f.away.id === p.teamId))
      .sort((a, b) => b.utcKickoff.localeCompare(a.utcKickoff))[0];
    if (!recent) return { id: p.id, name: p.name, teamName: p.teamName, recentMatch: null };

    const isHome = recent.home.id === p.teamId;
    const myScore = isHome ? recent.score.home! : recent.score.away!;
    const oppScore = isHome ? recent.score.away! : recent.score.home!;
    const opponent = isHome ? recent.away.shortName : recent.home.shortName;
    const result = myScore > oppScore ? "승" : myScore < oppScore ? "패" : "무";
    return {
      id: p.id,
      name: p.name,
      teamName: p.teamName,
      recentMatch: { opponent, result, scoreLine: `${myScore}-${oppScore}` },
    };
  });
}

export function KoreanPlayerSection({ fixtures }: Props) {
  const activities = summarize(fixtures);
  return (
    <section className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]">
      <h2 className="font-bold text-lg mb-3">🇰🇷 한국 선수</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {activities.map((a) => (
          <li key={a.id} className="border border-[var(--color-border)] rounded-lg p-3">
            <p className="font-semibold">{a.name} <span className="text-[var(--color-muted)] text-sm">({a.teamName})</span></p>
            {a.recentMatch ? (
              <p className="text-sm text-[var(--color-muted)] mt-1">
                최근: vs {a.recentMatch.opponent} {a.recentMatch.scoreLine}{" "}
                <span className={a.recentMatch.result === "승" ? "text-[var(--color-accent)]" : a.recentMatch.result === "패" ? "text-[var(--color-korean)]" : ""}>
                  ({a.recentMatch.result})
                </span>
              </p>
            ) : (
              <p className="text-sm text-[var(--color-muted)] mt-1">최근 7일 경기 없음</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: 타입체크**

Run:
```bash
npx tsc --noEmit
```

Expected: 오류 없음.

- [ ] **Step 3: 커밋**

```bash
git add components/KoreanPlayerSection.tsx
git commit -m "feat: KoreanPlayerSection with recent activity per player"
```

---

## Task 18: Header / Footer

**Files:**
- Create: `components/Header.tsx`
- Create: `components/Footer.tsx`

- [ ] **Step 1: Header**

Create `components/Header.tsx`:
```tsx
import Link from "next/link";
import { TOP4_LEAGUES } from "@/lib/dataSource/types";

export function Header() {
  return (
    <header className="border-b border-[var(--color-border)]">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          🦵 <span className="text-[var(--color-accent)]">KICK</span>OFF
        </Link>
        <nav className="hidden md:flex gap-4 text-sm text-[var(--color-muted)]">
          {TOP4_LEAGUES.map((l) => (
            <span key={l.code} className="hover:text-[var(--color-text)] cursor-default">
              {l.nameKr}
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}
```

> 리그 메뉴는 Plan 2에서 `/league/[code]`로 연결될 예정. 1차 MVP에선 시각적 표시만.

- [ ] **Step 2: Footer**

Create `components/Footer.tsx`:
```tsx
export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] mt-10">
      <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-[var(--color-muted)] flex flex-col sm:flex-row gap-2 sm:justify-between">
        <p>데이터: Football-Data.org · 영상: YouTube</p>
        <p>© Kickoff · 비영리 팬 프로젝트</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: 커밋**

```bash
git add components/Header.tsx components/Footer.tsx
git commit -m "feat: Header and Footer components"
```

---

## Task 19: 메인 페이지 조립 + ISR

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: 페이지 조립**

Replace `app/page.tsx`:
```tsx
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LeagueStandingsCard } from "@/components/LeagueStandingsCard";
import { UpcomingFixtures } from "@/components/UpcomingFixtures";
import { HighlightStrip } from "@/components/HighlightStrip";
import { KoreanPlayerSection } from "@/components/KoreanPlayerSection";
import { fetchTop4Standings, fetchEnrichedFixtures } from "@/lib/dataSource";
import { YoutubeHighlightSource } from "@/lib/dataSource/youtube";
import { env } from "@/lib/env";

export const revalidate = 3600;

export default async function HomePage() {
  const [standings, fixtures, videos] = await Promise.all([
    fetchTop4Standings().catch(() => []),
    fetchEnrichedFixtures().catch(() => []),
    new YoutubeHighlightSource(
      env.youtubeApiKey(),
      env.youtubePrimaryChannelId(),
      env.youtubeFallbackChannelIds()
    ).getRecentVideos({ maxResults: 12 }).catch(() => []),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        <UpcomingFixtures fixtures={fixtures} />
        <section>
          <h2 className="font-bold text-lg mb-3">4대 리그 순위</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {standings.map((s) => (
              <LeagueStandingsCard key={s.leagueCode} standings={s} />
            ))}
          </div>
        </section>
        <HighlightStrip videos={videos} />
        <KoreanPlayerSection fixtures={fixtures} />
      </main>
      <Footer />
    </div>
  );
}
```

> 주의: 위 코드는 YouTube를 두 번 호출하는 비효율이 있음. 다음 단계에서 정리.

- [ ] **Step 2: 데이터 페치 정리 (중복 호출 제거)**

Modify `lib/dataSource/index.ts` — 함수 추가:

`fetchEnrichedFixtures` 함수 아래에 추가:
```ts
export async function fetchTopHighlights(maxResults = 12): Promise<import("./types").HighlightVideo[]> {
  return youtube().getRecentVideos({ maxResults });
}
```

그리고 `export type { ... }` 줄을 다음으로 확장:
```ts
export type { Fixture, Standings, LeagueCode, HighlightVideo } from "./types";
```

그리고 `app/page.tsx`를 정리:

Replace `app/page.tsx`:
```tsx
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LeagueStandingsCard } from "@/components/LeagueStandingsCard";
import { UpcomingFixtures } from "@/components/UpcomingFixtures";
import { HighlightStrip } from "@/components/HighlightStrip";
import { KoreanPlayerSection } from "@/components/KoreanPlayerSection";
import {
  fetchTop4Standings,
  fetchEnrichedFixtures,
  fetchTopHighlights,
} from "@/lib/dataSource";

export const revalidate = 3600;

export default async function HomePage() {
  const [standings, fixtures, videos] = await Promise.all([
    fetchTop4Standings().catch(() => []),
    fetchEnrichedFixtures().catch(() => []),
    fetchTopHighlights(12).catch(() => []),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        <UpcomingFixtures fixtures={fixtures} />
        <section>
          <h2 className="font-bold text-lg mb-3">4대 리그 순위</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {standings.map((s) => (
              <LeagueStandingsCard key={s.leagueCode} standings={s} />
            ))}
          </div>
        </section>
        <HighlightStrip videos={videos} />
        <KoreanPlayerSection fixtures={fixtures} />
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 3: 타입체크 + 단위 테스트**

Run:
```bash
npx tsc --noEmit && npm test
```

Expected: 모든 테스트 통과.

- [ ] **Step 4: 로컬 실행 (API 키 필요)**

먼저 `.env.local` 작성:
```
FOOTBALL_DATA_TOKEN=<your-token>
YOUTUBE_API_KEY=<your-key>
YOUTUBE_PRIMARY_CHANNEL_ID=<쿠팡플레이 채널 ID — 실제 값 확인 필요>
```

Run:
```bash
npm run dev
```

브라우저로 http://localhost:3000 접속. 다음 시각적 검수:
- 헤더(KICKOFF 로고 + 리그 이름들)
- 다가오는 경기 섹션이 KST 시간으로 표시됨
- 4리그 카드가 4개 (PC), 모바일에선 1열로 쌓임
- 하이라이트 가로 스트립이 스크롤됨
- 한국 선수 섹션이 카드들로 표시됨
- 다크 배경 + 라임 그린 강조색

문제 있으면 콘솔 로그/네트워크 탭 확인.

- [ ] **Step 5: 커밋**

```bash
git add app/page.tsx lib/dataSource/index.ts
git commit -m "feat: assemble main dashboard page with ISR"
```

---

## Task 20: 반응형 점검 + 에러 폴백 토스트

**Files:**
- Modify: `app/page.tsx`
- Create: `components/StaleDataNotice.tsx`

- [ ] **Step 1: 빈 데이터 감지 컴포넌트**

Create `components/StaleDataNotice.tsx`:
```tsx
interface Props {
  show: boolean;
}

export function StaleDataNotice({ show }: Props) {
  if (!show) return null;
  return (
    <div className="bg-[var(--color-korean)]/10 border border-[var(--color-korean)]/30 text-[var(--color-korean)] text-sm px-4 py-2 rounded-lg">
      ⚠️ 일부 데이터를 가져오지 못했어요. 잠시 후 자동으로 다시 시도합니다.
    </div>
  );
}
```

- [ ] **Step 2: 페이지에 적용**

Modify `app/page.tsx` — `<main>` 안 첫 줄에 추가하고 import:
```tsx
import { StaleDataNotice } from "@/components/StaleDataNotice";
```

그리고 `<main>` 자식 첫 줄에:
```tsx
<StaleDataNotice show={standings.length === 0 || fixtures.length === 0 || videos.length === 0} />
```

- [ ] **Step 3: 모바일 시뮬레이션**

Run:
```bash
npm run dev
```

브라우저 개발자도구 → 디바이스 모드 → iPhone 14 Pro 선택. 점검:
- 헤더 햄버거 없이도 깔끔하게 보임 (1차에선 햄버거 생략, 리그 이름 hidden md:flex)
- 다가오는 경기 한 줄당 줄넘김 없이
- 리그 카드 1열로 쌓이며 가로 스와이프 가능
- 하이라이트 가로 스크롤 부드럽게
- 한국 선수 카드 1열 → sm부터 2열 → md부터 3열

만약 깨지는 부분 있으면 해당 컴포넌트의 className 수정.

- [ ] **Step 4: 커밋**

```bash
git add app/page.tsx components/StaleDataNotice.tsx
git commit -m "feat: add stale data notice and responsive checkpoints"
```

---

## Task 21: Vercel 배포

**Files:**
- Create: `README.md` (이미 있다면 업데이트)
- Modify: 환경변수 등록 (Vercel 대시보드, 코드 변경 없음)

- [ ] **Step 1: GitHub 저장소 생성 및 푸시**

GitHub에서 새 repo `kickoff` 생성. 그리고:
```bash
git remote add origin https://github.com/<your-username>/kickoff.git
git branch -M main
git push -u origin main
```

> 사용자가 직접 수행해야 함. GitHub CLI(`gh`) 사용 가능하면:
> ```bash
> gh repo create kickoff --public --source=. --remote=origin --push
> ```

- [ ] **Step 2: Vercel 연결**

https://vercel.com → "Add New" → "Project" → GitHub 저장소 선택 → Import.

빌드 설정은 기본값(Next.js 자동 감지).

- [ ] **Step 3: 환경변수 등록**

Vercel 프로젝트 Settings → Environment Variables에 추가:
- `FOOTBALL_DATA_TOKEN`
- `YOUTUBE_API_KEY`
- `YOUTUBE_PRIMARY_CHANNEL_ID`
- `YOUTUBE_FALLBACK_CHANNEL_IDS` (옵션)

Production/Preview/Development 모두 체크.

- [ ] **Step 4: Deploy**

자동으로 첫 배포 진행. 완료 후 `https://kickoff-<hash>.vercel.app` 같은 URL 발급.

브라우저로 접속해서 메인 페이지가 잘 보이는지 확인.

- [ ] **Step 5: README 마무리**

Replace/append `README.md`:
```
# Kickoff 🦵

유럽 4대 축구 리그(EPL, 라리가, 분데스리가, 세리에A) + 챔피언스리그 + 메이저 컵 대회를 한국 팬을 위해 한눈에 보여주는 대시보드.

## Features (MVP)
- 4대 리그 실시간 순위 (1시간 캐시)
- 오늘/다가오는 경기 + 결과 (KST 자동 변환)
- 쿠팡플레이/유튜브 하이라이트 매칭
- 한국 선수 활약 섹션
- 다크 모드 + 모바일 반응형

## Stack
- Next.js 15 (App Router, ISR)
- TypeScript, Tailwind CSS 4
- Football-Data.org + YouTube Data API v3
- Hosted on Vercel

## Local development
1. `cp .env.local.example .env.local` 후 값 채우기
2. `npm install`
3. `npm run dev`

## Testing
```bash
npm test
```

## Roadmap
- 경기 상세 페이지 (라인업, 통계)
- 리그/팀/토너먼트 상세 페이지
- API-Football 유료 어댑터 (라이브 스코어, 풀 컵 데이터)
```

- [ ] **Step 6: 마지막 커밋**

```bash
git add README.md
git commit -m "docs: add README for MVP launch"
git push
```

배포된 사이트 URL을 사용자에게 공유하면 MVP 완료.

---

## Done Criteria

다음을 모두 충족하면 Plan 1 완료:

1. `npm test` 모든 테스트 통과
2. `npx tsc --noEmit` 타입 오류 없음
3. `npm run build` 빌드 성공
4. Vercel에 배포되어 `https://*.vercel.app` 주소로 공개 접근 가능
5. 메인 페이지에서 5개 섹션(다가오는 경기 / 4리그 순위 / 하이라이트 / 한국 선수 / 헤더+푸터)이 다 보임
6. 모바일 사이즈에서 깨지지 않음
7. 외부 API 1개 실패해도 페이지 전체가 죽지 않음 (`StaleDataNotice` 표시)

## Plan 2에서 다룰 것

- `/match/[id]` 경기 상세 (라인업, 골 타임라인, 통계, 유튜브 임베드, FotMob 외부 링크)
- `/league/[code]` 리그 풀 순위표 + 일정 + 득점왕
- `/team/[id]` 팀 상세 + 선수단
- `/competition/[id]` 토너먼트 대진표 (챔스, 월드컵 등)
- API-Football 어댑터 구현 (라인업/통계용)
- 진행 중 메이저 대회 배너 (조건부 렌더)
- 헤더 리그 메뉴 → 실제 링크화
