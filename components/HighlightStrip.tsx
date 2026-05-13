import { HighlightCard } from "./HighlightCard";
import type { HighlightVideo } from "@/lib/dataSource/types";

// 채널 내 검색 URL — q가 있으면 그 키워드로 채널 검색, 없으면 채널 홈
function spotvUrl(q?: string) {
  return q
    ? `https://www.youtube.com/@SPOTV/search?query=${encodeURIComponent(q)}`
    : "https://www.youtube.com/@SPOTV";
}
function coupangUrl(q?: string) {
  return q
    ? `https://www.youtube.com/@CoupangPlaySports/search?query=${encodeURIComponent(q)}`
    : "https://www.youtube.com/@CoupangPlaySports";
}

function EmptyState({ searchQuery }: { searchQuery?: string }) {
  const ytSearchUrl = searchQuery
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`
    : null;
  return (
    <div className="border border-dashed border-[var(--color-border)] rounded-xl p-5 text-sm text-[var(--color-muted)]">
      <p className="mb-3">
        가져올 수 있는 축구 하이라이트가 아직 없어요. 유튜브에서 직접 확인해보세요.
      </p>
      <div className="flex flex-wrap gap-2">
        {ytSearchUrl && (
          <a
            href={ytSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-accent)] text-[var(--color-on-accent,#0a0a0b)] font-bold hover:opacity-90 transition-opacity"
          >
            🔍 YouTube에서 {searchQuery} 검색
          </a>
        )}
        <a
          href={spotvUrl(searchQuery)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 transition-colors text-[var(--color-text)] font-semibold"
        >
          ▶ SPOTV에서 {searchQuery ? `${searchQuery} 검색` : "채널 보기"}
        </a>
        <a
          href={coupangUrl(searchQuery)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 transition-colors text-[var(--color-text)] font-semibold"
        >
          ▶ 쿠팡플레이에서 {searchQuery ? `${searchQuery} 검색` : "채널 보기"}
        </a>
      </div>
    </div>
  );
}

interface Props {
  videos: HighlightVideo[];
  layout?: "scroll" | "grid";
  limit?: number;
  title?: string;
  /** 빈 상태일 때 YouTube 검색 링크에 쓸 키워드 (보통 팀 한국어명) */
  emptyStateQuery?: string;
}

export function HighlightStrip({
  videos,
  layout = "scroll",
  limit = 12,
  title = "최근 하이라이트",
  emptyStateQuery,
}: Props) {
  return (
    <section className="kickoff-card p-5">
      <h2 className="section-title text-xl mb-3">
        {title}{" "}
        <span className="text-[var(--color-muted)] text-sm font-normal ml-1">쿠팡플레이 스포츠 · SPOTV</span>
      </h2>
      {videos.length === 0 ? (
        <EmptyState searchQuery={emptyStateQuery} />
      ) : layout === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.slice(0, limit).map((v) => <HighlightCard key={v.videoId} video={v} />)}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-thin">
          {videos.slice(0, limit).map((v) => <HighlightCard key={v.videoId} video={v} />)}
        </div>
      )}
    </section>
  );
}
