import { HighlightCard } from "./HighlightCard";
import type { HighlightVideo } from "@/lib/dataSource/types";

export function HighlightStrip({ videos }: { videos: HighlightVideo[] }) {
  return (
    <section className="kickoff-card p-5">
      <h2 className="section-title text-xl mb-3">
        최근 하이라이트 <span className="text-[var(--color-muted)] text-sm font-normal ml-1">쿠팡플레이 · SPOTV</span>
      </h2>
      {videos.length === 0 ? (
        <p className="text-[var(--color-muted)] py-4">아직 업로드된 축구 하이라이트가 없어요.</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-thin">
          {videos.slice(0, 12).map((v) => <HighlightCard key={v.videoId} video={v} />)}
        </div>
      )}
    </section>
  );
}
