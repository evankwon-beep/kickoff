import Link from "next/link";
import { TOP4_LEAGUES } from "@/lib/dataSource/types";
import { FavoriteIndicator } from "./FavoriteIndicator";

export function Header() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[var(--color-bg)]/85 border-b border-[var(--color-border)]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center min-w-0">
          <Link href="/" className="group flex items-center gap-3">
            <span
              aria-hidden
              className="relative inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-deep)] shadow-[0_0_20px_color-mix(in_oklab,var(--color-accent)_45%,transparent)]"
            >
              <span className="absolute inset-1 rounded-full border-[1.5px] border-[var(--color-bg)] opacity-80" />
              <span className="absolute inset-2.5 rounded-full border-[1.5px] border-[var(--color-bg)] opacity-70" />
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              <span className="text-[var(--color-accent)]">KICK</span>
              <span>OFF</span>
            </span>
          </Link>
          <FavoriteIndicator />
        </div>
        <nav className="hidden md:flex gap-1 text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">
          {TOP4_LEAGUES.map((l) => (
            <span key={l.code} className="px-3 py-1.5 rounded-full hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] cursor-default transition-colors">
              {l.nameKr}
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}
