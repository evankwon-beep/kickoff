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
