import { HighlightCard } from "./HighlightCard";
import type { HighlightVideo } from "@/lib/dataSource/types";

const COUPANG_CHANNEL_URL = "https://www.youtube.com/channel/UCjn-VbcIkAeXQKCmLJV8YwQ";
const SPOTV_CHANNEL_URL = "https://www.youtube.com/channel/UC3Gk2_hnSDLEz0k_TJb6l2w";

function EmptyState() {
  return (
    <div className="border border-dashed border-[var(--color-border)] rounded-xl p-5 text-sm text-[var(--color-muted)]">
      <p className="mb-3">
        가져올 수 있는 축구 하이라이트가 아직 없어요. 유튜브 채널에서 직접 확인해보세요.
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={SPOTV_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 transition-colors text-[var(--color-text)] font-semibold"
        >
          ▶ SPOTV NOW 채널
        </a>
        <a
          href={COUPANG_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 transition-colors text-[var(--color-text)] font-semibold"
        >
          ▶ 쿠팡플레이 채널
        </a>
      </div>
    </div>
  );
}

export function HighlightStrip({ videos }: { videos: HighlightVideo[] }) {
  return (
    <section className="kickoff-card p-5">
      <h2 className="section-title text-xl mb-3">
        최근 하이라이트{" "}
        <span className="text-[var(--color-muted)] text-sm font-normal ml-1">쿠팡플레이 · SPOTV</span>
      </h2>
      {videos.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-thin">
          {videos.slice(0, 12).map((v) => <HighlightCard key={v.videoId} video={v} />)}
        </div>
      )}
    </section>
  );
}
