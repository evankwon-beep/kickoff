import { HighlightCard } from "./HighlightCard";
import type { HighlightVideo } from "@/lib/dataSource/types";

export function HighlightStrip({ videos }: { videos: HighlightVideo[] }) {
  return (
    <section className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]">
      <h2 className="font-bold text-lg mb-3">
        최근 하이라이트{" "}
        <span className="text-[var(--color-muted)] text-sm font-normal">(쿠팡플레이 등)</span>
      </h2>
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
