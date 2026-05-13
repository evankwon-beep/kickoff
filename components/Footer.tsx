export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] mt-14">
      <div className="max-w-6xl mx-auto px-4 py-8 text-xs text-[var(--color-muted)] flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden className="inline-block w-2 h-4 rounded-sm bg-gradient-to-b from-[var(--color-accent)] to-[var(--color-accent-deep)]" />
          <p>
            데이터 <span className="text-[var(--color-text)] font-semibold">Football-Data.org</span> · 한국어 / 사진 <span className="text-[var(--color-text)] font-semibold">Naver Sports</span> · 영상 <span className="text-[var(--color-text)] font-semibold">YouTube</span>
          </p>
        </div>
        <p className="font-semibold">© Kickoff · 비영리 팬 프로젝트</p>
      </div>
    </footer>
  );
}
