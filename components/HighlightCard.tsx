import Image from "next/image";
import Link from "next/link";
import type { HighlightVideo } from "@/lib/dataSource/types";

export function HighlightCard({ video }: { video: HighlightVideo }) {
  return (
    <Link
      href={`https://www.youtube.com/watch?v=${video.videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-[300px] shrink-0 group"
    >
      <div className="relative aspect-video rounded-xl overflow-hidden bg-[var(--color-border)] ring-1 ring-[var(--color-border)] group-hover:ring-[var(--color-accent)] transition-all">
        {video.thumbnailUrl && (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            sizes="300px"
            className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
            unoptimized
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="w-14 h-14 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] flex items-center justify-center text-2xl shadow-2xl">
            ▶
          </span>
        </span>
        <span className="absolute top-2 left-2 pitch-badge">하이라이트</span>
      </div>
      <div className="mt-2.5 px-0.5">
        <p className="text-sm font-bold line-clamp-2 leading-snug group-hover:text-[var(--color-accent)] transition-colors">
          {video.title}
        </p>
        <p className="text-xs text-[var(--color-muted)] mt-1">{video.channelTitle}</p>
      </div>
    </Link>
  );
}
