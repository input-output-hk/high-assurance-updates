// Small formatting helpers shared across pages. All dates are treated as UTC so
// build output is deterministic regardless of the build machine's timezone.

import type { Proposal } from "./types";

const DATE_OPTS: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "UTC" };

/** "2026-06-29", "2026-07-05" -> "Jun 29 – Jul 5, 2026". */
export function formatDateRange(startYmd: string, endYmd: string): string {
  const start = new Date(`${startYmd}T00:00:00Z`);
  const end = new Date(`${endYmd}T00:00:00Z`);
  const s = start.toLocaleDateString("en-US", DATE_OPTS);
  const e = end.toLocaleDateString("en-US", { ...DATE_OPTS, year: "numeric" });
  return `${s} – ${e}`;
}

/** "2026-07-06" -> "Jul 6, 2026". */
export function formatDate(ymd: string): string {
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-US", {
    ...DATE_OPTS,
    year: "numeric",
  });
}

/** "2026-07-06" -> "Jul 6". */
export function formatShort(ymd: string): string {
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-US", DATE_OPTS);
}

/** ISO week key "2026-W27" -> { label: "Week 27", year: "2026" }. */
export function weekParts(week: string): { label: string; year: string } {
  const m = week.match(/^(\d{4})-W(\d+)$/i);
  if (!m) return { label: week, year: "" };
  return { label: `Week ${Number(m[2])}`, year: m[1] };
}

/** The headline ask: on-chain ada when present, USD reference budget otherwise. */
export function formatAsk(p: Proposal): string | null {
  if (p.treasuryAskAda != null) return `₳${p.treasuryAskAda.toLocaleString("en-US")}`;
  if (p.budgetUsd != null) return `$${p.budgetUsd.toLocaleString("en-US")}`;
  return null;
}
