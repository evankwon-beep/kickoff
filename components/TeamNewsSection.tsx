import type { NewsItem } from "@/lib/news";

interface Props {
  teamName: string;
  general: NewsItem[];
  transfer: NewsItem[];
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

function NewsList({ items }: { items: NewsItem[] }) {
  if (items.length === 0) {
    return <p className="text-[var(--color-muted)] py-3 text-sm">아직 가져올 뉴스가 없어요.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((n, idx) => {
        const hasArticleImg = Boolean(n.imageUrl);
        return (
          <li
            key={`${n.link}-${idx}`}
            className="border border-[var(--color-border)] rounded-lg overflow-hidden hover:border-[var(--color-accent)]/40 transition-colors"
          >
            <a
              href={n.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-stretch gap-3 p-3 group"
            >
              <div className="shrink-0 w-20 h-20 rounded-md overflow-hidden flex items-center justify-center bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-bg)] border border-[var(--color-border)]">
                {hasArticleImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={n.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-2xl opacity-50" aria-hidden>📰</span>
                )}
              </div>
              <div className="min-w-0 flex-1 text-left flex flex-col">
                <p className="text-sm font-semibold leading-snug group-hover:text-[var(--color-accent)] transition-colors line-clamp-3">
                  {n.title}
                </p>
                <p className="text-xs text-[var(--color-muted)] mt-auto pt-1 flex items-center gap-2">
                  <span className="truncate">{n.source}</span>
                  {n.publishedAt && (
                    <>
                      <span>·</span>
                      <span className="whitespace-nowrap">{relativeTime(n.publishedAt)}</span>
                    </>
                  )}
                </p>
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function TeamNewsSection({ teamName, general, transfer }: Props) {
  const newsUrl = (q: string) =>
    `https://news.google.com/search?q=${encodeURIComponent(q)}&hl=ko`;

  return (
    <section className="kickoff-card p-5">
      <h2 className="section-title text-xl mb-4">📰 {teamName} 뉴스</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-accent)]">최근 뉴스</h3>
          </div>
          <NewsList items={general} />
          <a
            href={newsUrl(`${teamName} 축구`)}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-3 text-center text-xs font-bold py-2 px-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)]/60 hover:text-[var(--color-accent)] transition-colors"
          >
            전체 뉴스 보기 ↗
          </a>
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-gold)]">💰 이적 시장</h3>
          </div>
          <NewsList items={transfer} />
          <a
            href={newsUrl(`${teamName} 이적`)}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-3 text-center text-xs font-bold py-2 px-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-gold)]/60 hover:text-[var(--color-gold)] transition-colors"
          >
            전체 이적 소식 보기 ↗
          </a>
        </div>
      </div>
    </section>
  );
}
