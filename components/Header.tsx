import Link from "next/link";
import { TOP4_LEAGUES } from "@/lib/dataSource/types";

export function Header() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[var(--color-bg)]/80 border-b border-[var(--color-border)]">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block w-2.5 h-6 rounded-sm bg-gradient-to-b from-[var(--color-accent)] to-[var(--color-accent-deep)] group-hover:from-[var(--color-gold)] transition-colors"
          />
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-[var(--color-accent)]">KICK</span>
            <span>OFF</span>
          </span>
        </Link>
        <nav className="hidden md:flex gap-5 text-sm text-[var(--color-muted)]">
          {TOP4_LEAGUES.map((l) => (
            <span key={l.code} className="hover:text-[var(--color-text)] cursor-default font-medium">
              {l.nameKr}
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}
