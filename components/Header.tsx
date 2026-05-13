import Link from "next/link";
import { TOP4_LEAGUES } from "@/lib/dataSource/types";

export function Header() {
  return (
    <header className="border-b border-[var(--color-border)]">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          🦵 <span className="text-[var(--color-accent)]">KICK</span>OFF
        </Link>
        <nav className="hidden md:flex gap-4 text-sm text-[var(--color-muted)]">
          {TOP4_LEAGUES.map((l) => (
            <span key={l.code} className="hover:text-[var(--color-text)] cursor-default">
              {l.nameKr}
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}
