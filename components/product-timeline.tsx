import { Fragment } from "react";
import Link from "next/link";
import type { Milestone, Product, ProductUpdate } from "@/lib/types";
import { formatShort } from "@/lib/format";
import { StatusBadge } from "./status-badge";

// The program window the whole timeline is scaled to: Jul 1 2026 → Jun 30 2027
// — the 2026/27 proposal window (Q3 2026 → Q2 2027). Undated milestones (the
// 2025/26 cycle's) simply render no marker.
const WIN_START = Date.UTC(2026, 6, 1);
const WIN_END = Date.UTC(2027, 5, 30);
const SPAN = WIN_END - WIN_START;
const MONTHS = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];

// Leave a small gutter at each end so markers/labels never sit on the track edge.
const EDGE = 3;

const DUE_COLOR = "var(--status-progress)"; // amber — the committed deadline
const DONE_COLOR = "var(--status-done)"; // green — actual delivery

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
/** Map a raw window fraction (0–1) to a percentage inside the gutters. */
const xFromFrac = (f: number) => EDGE + f * (100 - 2 * EDGE);
const fracMs = (ms: number) => clamp01((ms - WIN_START) / SPAN);

/** Position of a date as a gutter-inset percentage along the window. */
function pct(ymd: string): number {
  return xFromFrac(fracMs(Date.parse(`${ymd}T00:00:00Z`)));
}

/** Week boundaries (Mondays) within the window, as percentages. */
function weekTicks(): number[] {
  const ticks: number[] = [];
  const d = new Date(WIN_START);
  d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7)); // first Monday in window
  while (d.getTime() <= WIN_END) {
    ticks.push(xFromFrac(fracMs(d.getTime())));
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return ticks;
}

function monthMarks() {
  return MONTHS.map((m, i) => {
    const left = xFromFrac(fracMs(Date.UTC(2026, 6 + i, 1)));
    const right = xFromFrac(fracMs(Date.UTC(2026, 6 + i + 1, 1)));
    return { m, left, width: right - left };
  });
}
// Date.UTC normalizes month overflow (e.g. month 12 → Jan of next year), so the
// Jul→Jan window maps correctly without special-casing the year boundary.

/** Keep marker labels inside the track edges. */
function labelStyle(p: number): React.CSSProperties {
  if (p <= 14) return { left: `${p}%` };
  if (p >= 86) return { right: `${100 - p}%` };
  return { left: `${p}%`, transform: "translateX(-50%)" };
}

/** Keep a marker's tooltip inside the track edges. */
function tipStyle(p: number): React.CSSProperties {
  if (p < 22) return { left: 0 };
  if (p > 78) return { right: 0 };
  return { left: "50%", transform: "translateX(-50%)" };
}

/** "BL.04" alone, or same-prefix ids merged as "BL.04/05/06/07". */
function dueLabel(ms: Milestone[]): string {
  if (ms.length === 1) return ms[0].id;
  const ids = ms.map((m) => m.id);
  const prefix = ids[0].slice(0, ids[0].indexOf(".") + 1);
  return ids
    .map((id, i) => (i > 0 && id.startsWith(prefix) ? id.slice(prefix.length) : id))
    .join("/");
}

/**
 * An intermediate improvement: a dot on the track that reveals a description on
 * hover/focus and links to the weekly update that reported it.
 */
function UpdateMarker({ u }: { u: ProductUpdate }) {
  const at = pct(u.date);
  return (
    <Link
      href={`/updates/${u.week.toLowerCase()}/`}
      aria-label={`Update ${formatShort(u.date)}: ${u.description}`}
      className="group absolute top-1/2 z-20 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-primary ring-1 ring-primary/50 transition-transform hover:scale-125 focus-visible:scale-125 focus-visible:outline-none"
      style={{ left: `${at}%` }}
    >
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full z-30 mb-2 hidden w-52 rounded-md border border-border bg-surface p-3 text-left shadow-lg group-hover:block group-focus-visible:block"
        style={tipStyle(at)}
      >
        <span className="block font-mono text-[0.6rem] uppercase tracking-wider text-primary">
          {formatShort(u.date)} · {u.week}
        </span>
        <span className="mt-1 block text-xs leading-snug text-foreground">{u.description}</span>
        <span className="mt-2 block font-mono text-[0.6rem] uppercase tracking-wider text-muted">
          View weekly update ↗
        </span>
      </span>
    </Link>
  );
}

function Marker({
  at,
  color,
  label,
  date,
  centerLabel = false,
}: {
  at: number;
  color: string;
  label: string;
  date: string;
  /** Always center the label on the mark, ignoring edge clamping. */
  centerLabel?: boolean;
}) {
  const labelPos = centerLabel
    ? { left: `${at}%`, transform: "translateX(-50%)" }
    : labelStyle(at);
  return (
    <>
      <span
        aria-hidden
        className="absolute inset-y-0 w-0.5"
        style={{ left: `${at}%`, backgroundColor: color, transform: "translateX(-50%)" }}
      />
      <span
        aria-hidden
        className="absolute top-0 h-2 w-2 rounded-full"
        style={{ left: `${at}%`, backgroundColor: color, transform: "translate(-50%,-50%)" }}
      />
      <span
        className="absolute -top-5 hidden whitespace-nowrap font-mono text-[0.6rem] uppercase tracking-wider sm:block"
        style={{ ...labelPos, color }}
      >
        {label} {formatShort(date)}
      </span>
    </>
  );
}

function Track({ d, ticks, today }: { d: Product; ticks: number[]; today: number }) {
  // A workstream carries one or more milestones; each with a due or delivered
  // date becomes a marker. Ongoing work (no dated milestone) shows a spanning
  // bar instead.
  const dated = d.milestones.filter((m) => m.dueDate || m.deliveredDate);
  const hasDeadline = dated.length > 0;

  // Milestones sharing a due date render as one merged marker ("BL.04/05/06/07")
  // so their labels stay legible instead of stacking.
  const dueGroups = new Map<string, Milestone[]>();
  for (const m of dated) {
    if (!m.dueDate) continue;
    const group = dueGroups.get(m.dueDate) ?? [];
    group.push(m);
    dueGroups.set(m.dueDate, group);
  }

  return (
    <div className="relative mt-7 h-14 rounded-lg border border-border bg-surface-2 shadow-inner">
      {/* thin week ticks */}
      {ticks.map((left, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute inset-y-2.5 w-px bg-border"
          style={{ left: `${left}%` }}
        />
      ))}

      {/* today line + a label under each track so the now-line is obvious on every row */}
      {today >= 0 && today <= 100 && (
        <>
          <span
            aria-hidden
            className="absolute inset-y-0 w-px bg-primary/50"
            style={{ left: `${today}%` }}
          />
          <span
            className="absolute top-full mt-0.5 -translate-x-1/2 whitespace-nowrap font-mono text-[0.55rem] uppercase tracking-wider text-primary/80"
            style={{ left: `${today}%` }}
          >
            Today
          </span>
        </>
      )}

      {/* no dated milestones this cycle — say so instead of faking a bar */}
      {!hasDeadline && (
        <span className="absolute inset-0 flex items-center justify-center px-4 text-center font-mono text-[0.6rem] uppercase tracking-wider text-muted">
          No dated milestones this cycle — see the product page
        </span>
      )}

      {dated.map((m) => {
        const due = m.dueDate ? pct(m.dueDate) : null;
        const delivered = m.deliveredDate ? pct(m.deliveredDate) : null;
        return (
          <Fragment key={m.id}>
            {/* progress connector from delivery to deadline, when delivered early */}
            {delivered !== null && due !== null && delivered < due && (
              <span
                aria-hidden
                className="absolute inset-y-6 rounded-full"
                style={{
                  left: `${delivered}%`,
                  width: `${due - delivered}%`,
                  backgroundColor: DONE_COLOR,
                  opacity: 0.25,
                }}
              />
            )}
            {delivered !== null && (
              <Marker at={delivered} color={DONE_COLOR} label="Shipped" date={m.deliveredDate!} centerLabel />
            )}
          </Fragment>
        );
      })}

      {/* due markers merged by shared date so labels stay distinct and legible */}
      {[...dueGroups.entries()].map(([date, ms]) => (
        <Marker key={date} at={pct(date)} color={DUE_COLOR} label={dueLabel(ms)} date={date} />
      ))}

      {/* intermediate improvements along the way */}
      {d.updates.map((u) => (
        <UpdateMarker key={`${u.date}-${u.week}`} u={u} />
      ))}
    </div>
  );
}

/**
 * Each product rendered as a track on a shared Jul 2026→Jun 2027 timeline: thin
 * ticks mark weeks; the amber line is the committed deadline; the green line is
 * when it actually shipped (we aim to ship before the deadline); blue dots are
 * intermediate improvements that link to their weekly update.
 */
export function ProductTimeline({ products }: { products: Product[] }) {
  const ticks = weekTicks();
  const months = monthMarks();
  const today = pct(new Date().toISOString().slice(0, 10));

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      {/* legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[0.65rem] uppercase tracking-wider text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-0.5" style={{ backgroundColor: DUE_COLOR }} /> Deadline
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-0.5" style={{ backgroundColor: DONE_COLOR }} /> Shipped
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" /> Update
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-px bg-border" /> Week
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-px bg-primary/50" /> Today
        </span>
      </div>

      {/* month axis */}
      <div className="relative mt-5 h-5 border-b border-border">
        {months.map((mo) => (
          <span
            key={mo.m}
            className="absolute top-0 font-mono text-[0.65rem] uppercase tracking-wider text-muted"
            style={{ left: `${mo.left}%`, width: `${mo.width}%`, textAlign: "center" }}
          >
            {mo.m}
          </span>
        ))}
      </div>

      {/* one row per product */}
      <div className="flex flex-col divide-y divide-border">
        {products.map((d, i) => (
          <div key={d.id} className="ledger-in py-8" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                href={`/products/${d.slug}/`}
                className="group inline-flex items-baseline gap-2"
              >
                <span className="font-mono text-xs tracking-wider text-primary">{d.id}</span>
                <span className="font-display text-lg font-semibold tracking-tight text-foreground group-hover:text-primary">
                  {d.title}
                </span>
              </Link>
              <StatusBadge status={d.status} />
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{d.description}</p>
            <Track d={d} ticks={ticks} today={today} />
          </div>
        ))}
      </div>
    </div>
  );
}
