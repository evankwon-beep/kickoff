import Image from "next/image";
import Link from "next/link";
import type { HighlightVideo } from "@/lib/dataSource/types";

export function HighlightCard({ video }: { video: HighlightVideo }) {
  return (
    <Link
      href={`https://www.youtube.com/watch?v=${video.videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-[280px] shrink-0 group"
    >
      <div className="relative aspect-video rounded-xl overflow-hidden bg-[var(--color-border)] ring-1 ring-[var(--color-border)] group-hover:ring-[var(--color-accent)]/60 transition-all">
        {video.thumbnailUrl && (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            sizes="280px"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
            unoptimized
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <span className="absolute bottom-2 right-2 bg-[var(--color-accent)] text-[var(--color-bg)] text-xs font-bold px-2 py-1 rounded shadow">
          ▶ PLAY
        </span>
      </div>
      <div className="mt-2 px-1">
        <p className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-[var(--color-accent)] transition-colors">
          {video.title}
        </p>
        <p className="text-xs text-[var(--color-muted)] mt-1">{video.channelTitle}</p>
      </div>
    </Link>
  );
}
