interface Props {
  show: boolean;
}

export function StaleDataNotice({ show }: Props) {
  if (!show) return null;
  return (
    <div className="bg-[var(--color-korean)]/10 border border-[var(--color-korean)]/30 text-[var(--color-korean)] text-sm px-4 py-2 rounded-lg">
      ⚠️ 일부 데이터를 가져오지 못했어요. 잠시 후 자동으로 다시 시도합니다.
    </div>
  );
}
