const KST_OFFSET_MIN = 9 * 60;

function toKSTParts(iso: string) {
  const d = new Date(iso);
  const utcMs = d.getTime();
  const kst = new Date(utcMs + KST_OFFSET_MIN * 60_000);
  return {
    year: kst.getUTCFullYear(),
    month: kst.getUTCMonth() + 1,
    day: kst.getUTCDate(),
    hour: kst.getUTCHours(),
    minute: kst.getUTCMinutes(),
    weekday: kst.getUTCDay(),
  };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

const WEEKDAY_KR = ["일", "월", "화", "수", "목", "금", "토"];

export function formatKST(iso: string, opts: { withWeekday?: boolean } = {}): string {
  const p = toKSTParts(iso);
  const base = `${p.year}-${pad(p.month)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}`;
  if (opts.withWeekday) {
    return `${p.year}-${pad(p.month)}-${pad(p.day)} (${WEEKDAY_KR[p.weekday]}) ${pad(p.hour)}:${pad(p.minute)}`;
  }
  return base;
}

export function formatRelativeKST(iso: string, now: Date = new Date()): string {
  const target = toKSTParts(iso);
  const ref = toKSTParts(now.toISOString());

  const diffDays =
    Math.floor(Date.UTC(target.year, target.month - 1, target.day) / 86_400_000) -
    Math.floor(Date.UTC(ref.year, ref.month - 1, ref.day) / 86_400_000);

  const hhmm = `${pad(target.hour)}:${pad(target.minute)}`;
  const dawn = target.hour < 6 ? "새벽 " : "";

  if (diffDays === 0) return `오늘 ${hhmm}`;
  if (diffDays === 1) return `내일 ${dawn}${hhmm}`;
  if (diffDays === -1) return `어제 ${hhmm}`;
  if (diffDays > 1) return `${diffDays}일 후 ${hhmm}`;
  return `${Math.abs(diffDays)}일 전 ${hhmm}`;
}
