import data from "@/data/player-market-values.json";

type RawValue = number | string;
const MAP = data as Record<string, RawValue>;

// JSON에 _xxx 키 (주석용)도 있어서 number 값만 신뢰
function isPositiveNumber(v: unknown): v is number {
  return typeof v === "number" && v > 0;
}

/**
 * 한국어 선수명을 받아 추정 시장가치(억원)를 반환. 매핑 없으면 null.
 */
export function lookupMarketValue(playerKoreanName: string): number | null {
  if (!playerKoreanName) return null;
  const v = MAP[playerKoreanName.trim()];
  return isPositiveNumber(v) ? v : null;
}

/**
 * 억원 단위 숫자를 사람 친화적인 문자열로. 1000억 이상은 "X,XXX억" 또는 "X.X조".
 */
export function formatKRWMarketValue(billionWon: number): string {
  if (billionWon >= 10_000) {
    // 1조 이상
    return `${(billionWon / 10_000).toFixed(1)}조원`;
  }
  if (billionWon >= 1000) {
    return `${billionWon.toLocaleString("ko-KR")}억원`;
  }
  return `${billionWon}억원`;
}
