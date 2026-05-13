import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatKST, formatRelativeKST } from "@/lib/time";

describe("formatKST", () => {
  it("formats UTC instant to KST date/time", () => {
    const iso = "2026-05-13T19:00:00Z"; // 19:00 UTC = 04:00 KST (다음 날)
    expect(formatKST(iso)).toBe("2026-05-14 04:00");
  });

  it("formats with weekday when requested", () => {
    const iso = "2026-05-13T19:00:00Z";
    expect(formatKST(iso, { withWeekday: true })).toBe("2026-05-14 (목) 04:00");
  });
});

describe("formatRelativeKST", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-13T12:00:00Z")); // KST 21:00 (수)
  });
  afterEach(() => vi.useRealTimers());

  it('returns "오늘 22:00" for same KST date later today', () => {
    const iso = "2026-05-13T13:00:00Z"; // KST 22:00 (수)
    expect(formatRelativeKST(iso)).toBe("오늘 22:00");
  });

  it('returns "내일 새벽 04:00" for next-day early hours', () => {
    const iso = "2026-05-13T19:00:00Z"; // KST 04:00 목
    expect(formatRelativeKST(iso)).toBe("내일 새벽 04:00");
  });

  it('returns "3일 후 22:00" for further future', () => {
    const iso = "2026-05-16T13:00:00Z"; // KST 22:00 (토)
    expect(formatRelativeKST(iso)).toBe("3일 후 22:00");
  });

  it('returns "어제 22:00" for previous KST day', () => {
    const iso = "2026-05-12T13:00:00Z"; // KST 22:00 화
    expect(formatRelativeKST(iso)).toBe("어제 22:00");
  });
});
