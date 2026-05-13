import type { NewsItem } from "@/lib/news";

interface Props {
  teamName: string;
  news: NewsItem[];
}

function relativeTime(iso: string): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diffMin = Math.round((Date.now() - t) / 60_000);
  if (diffMin < 60) return `${Math.max(1, diffMin)}분 전`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}시간 전`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `${diffD}일 전`;
  const diffW = Math.round(diffD / 7);
  return `${diffW}주 전`;
}

export function TeamNewsSection({ teamName, news }: Props) {
  const googleNewsUrl = `https://news.google.com/search?q=${encodeURIComponent(teamName + " 축구")}&hl=ko`;

  return (
    <section className="kickoff-card p-5">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <h2 className="section-title text-xl">
          📰 {teamName} 뉴스{" "}
          <span className="text-[var(--color-muted)] text-sm font-normal ml-1">최근 / 이적</span>
        </h2>
        <a
          href={googleNewsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
        >
          전체 보기 ↗
        </a>
      </div>
      {news.length === 0 ? (
        <p className="text-[var(--color-muted)] py-4">아직 가져올 뉴스가 없어요.</p>
      ) : (
        <ul className="space-y-2">
          {news.map((n, idx) => (
            <li
              key={`${n.link}-${idx}`}
              className="border border-[var(--color-border)] rounded-lg p-3 hover:border-[var(--color-accent)]/40 transition-colors"
            >
              <a
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <p className="text-sm font-semibold leading-snug group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                  {n.title}
                </p>
                <p className="text-xs text-[var(--color-muted)] mt-1.5 flex items-center gap-2">
                  <span>{n.source}</span>
                  {n.publishedAt && (
                    <>
                      <span>·</span>
                      <span>{relativeTime(n.publishedAt)}</span>
                    </>
                  )}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
