export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] mt-12">
      <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-[var(--color-muted)] flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <p>
          데이터 <span className="text-[var(--color-text)]">Football-Data.org</span> · 영상 <span className="text-[var(--color-text)]">YouTube</span>
        </p>
        <p>© Kickoff · 비영리 팬 프로젝트</p>
      </div>
    </footer>
  );
}
