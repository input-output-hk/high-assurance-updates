import type { Metadata } from "next";
import Link from "next/link";
import { getWeeklyUpdates } from "@/lib/content";
import { formatDateRange, weekParts } from "@/lib/format";
import type { WeeklyUpdate } from "@/lib/types";

export const metadata: Metadata = {
  title: "Updates",
  description:
    "Weekly progress on Cardano High Assurance: gathered GitHub activity grouped by product, plus a short narrative.",
};

/** A plain-text teaser from the Markdown narrative for the archive list. */
function excerpt(body: string, max = 240): string {
  const text = body
    .replace(/<!--[\s\S]*?-->/g, "") // strip HTML comments
    .split("\n")
    .filter((line) => !line.startsWith("#")) // drop headings
    .join(" ")
    .replace(/[*_`>#]/g, "") // strip common Markdown marks
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links -> text
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

function summaryLine(u: WeeklyUpdate): string {
  const c = u.counters;
  const parts = [
    c.prsMerged && `${c.prsMerged} PR${c.prsMerged === 1 ? "" : "s"} merged`,
    c.issuesClosed && `${c.issuesClosed} issue${c.issuesClosed === 1 ? "" : "s"} closed`,
    c.releases && `${c.releases} release${c.releases === 1 ? "" : "s"}`,
    c.commits && `${c.commits} commits`,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "No tracked activity";
}

export default function UpdatesPage() {
  const updates = getWeeklyUpdates();

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-14">
      <header className="border-b border-border pb-8">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">Weekly updates</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground">
          Updates
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
          A weekly record of what shipped, gathered automatically from GitHub and grouped by
          product, with a short narrative from the team. Numbers are snapshots as of each
          gather run.
        </p>
      </header>

      {updates.length === 0 ? (
        <p className="mt-8 text-muted">No weekly updates published yet.</p>
      ) : (
        <ol className="mt-8 flex flex-col gap-4">
          {updates.map((u, i) => {
            const { label, year } = weekParts(u.week);
            return (
              <li key={u.slug}>
                <Link
                  href={`/updates/${u.slug}/`}
                  className="ledger-in group block rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-display text-lg font-semibold text-foreground group-hover:text-primary">
                      {label} <span className="text-muted">· {year}</span>
                    </span>
                    <span className="font-mono text-xs uppercase tracking-wider text-muted">
                      {formatDateRange(u.weekStart, u.weekEnd)}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-[color:var(--on-primary-link)]">
                    {summaryLine(u)}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted">{excerpt(u.body)}</p>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
