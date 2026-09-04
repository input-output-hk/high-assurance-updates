import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityItemList } from "@/components/weekly-update";
import { StatusBadge } from "@/components/status-badge";
import {
  getDeliverableBySlug,
  getDeliverables,
  getReposForDeliverable,
  getWeeklyUpdates,
} from "@/lib/content";
import { formatDate, formatDateRange, weekParts } from "@/lib/format";
import { REACTIVE_GROUP, type Deliverable, type WeeklyGroup, type WeeklyUpdate } from "@/lib/types";

// Static export: one page per deliverable, 404 anything else.
export const dynamicParams = false;

export function generateStaticParams() {
  return getDeliverables().map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const d = getDeliverableBySlug(slug);
  return d ? { title: d.title, description: d.summary } : { title: "Deliverable" };
}

function quarterLabel(quarter: Deliverable["quarter"]): string {
  return quarter === "ongoing" ? "Ongoing" : quarter.replace("-", " ");
}

/** All weekly updates that reported activity for this deliverable, newest first. */
function activityByWeek(d: Deliverable): { update: WeeklyUpdate; group: WeeklyGroup }[] {
  // The Reactive deliverable (slug "reactive") maps to the gatherer's Reactive bucket.
  const groupKey = d.slug === REACTIVE_GROUP ? REACTIVE_GROUP : d.id;
  return getWeeklyUpdates()
    .map((update) => ({ update, group: update.groups.find((g) => g.deliverable === groupKey) }))
    .filter(
      (x): x is { update: WeeklyUpdate; group: WeeklyGroup } =>
        !!x.group && (x.group.items.length > 0 || Object.keys(x.group.commitCounts).length > 0),
    );
}

export default async function DeliverablePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const d = getDeliverableBySlug(slug);
  if (!d) notFound();

  const weeks = activityByWeek(d);
  // Tracked repos are derived from config.yaml (the gatherer's source), so the
  // chips shown here always match the repos whose activity rolls up below.
  const repos = getReposForDeliverable(d.id);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-14">
      <header className="border-b border-border pb-8">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-wider text-muted hover:text-foreground"
        >
          ← Overview
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm tracking-wider text-primary">{d.id}</span>
          <span className="font-mono text-xs uppercase tracking-wider text-muted">
            {quarterLabel(d.quarter)}
          </span>
          <StatusBadge status={d.status} />
        </div>

        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground">
          {d.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/80">{d.description}</p>

        {d.milestones.length > 0 && (
          <ul className="mt-6 flex flex-col gap-3">
            {d.milestones.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-md border border-border bg-surface px-3 py-2"
              >
                <span className="font-mono text-xs tracking-wider text-primary">{m.id}</span>
                <span className="text-sm text-foreground">{m.title}</span>
                <span className="ml-auto flex flex-wrap gap-x-6 gap-y-0.5 font-mono text-xs">
                  {m.dueDate && (
                    <span className="text-muted">
                      Due <span className="text-foreground">{formatDate(m.dueDate)}</span>
                    </span>
                  )}
                  {m.deliveredDate && (
                    <span className="text-muted">
                      Shipped{" "}
                      <span className="text-[color:var(--status-done)]">{formatDate(m.deliveredDate)}</span>
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}

        {repos.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {repos.map((repo) => (
              <li key={repo.url}>
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-xs text-muted transition-colors hover:border-primary hover:text-foreground"
                >
                  {repo.owner}/{repo.name}
                </a>
              </li>
            ))}
          </ul>
        )}

        {d.links.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
            {d.links.map((link) => (
              <li key={`${link.label}-${link.url}`}>
                <a
                  href={link.url}
                  className="font-mono text-xs text-[color:var(--on-primary-link)] hover:underline"
                  target={link.url.startsWith("http") ? "_blank" : undefined}
                  rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  {link.label} ↗
                </a>
              </li>
            ))}
          </ul>
        )}
      </header>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">Activity</h2>
        <p className="mt-1 text-sm text-muted">
          Gathered GitHub activity for this deliverable, week by week — the same evidence that
          appears in the weekly updates.
        </p>

        {weeks.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-border bg-surface p-6 text-sm text-muted">
            No gathered activity is linked to this deliverable yet. It will appear here as weekly
            updates are published.
          </p>
        ) : (
          <div className="mt-6 flex flex-col gap-5">
            {weeks.map(({ update, group }) => (
              <section key={update.slug} className="rounded-lg border border-border bg-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                  <h3 className="font-display text-base font-semibold text-foreground">
                    {weekParts(update.week).label}{" "}
                    <span className="text-muted">· {formatDateRange(update.weekStart, update.weekEnd)}</span>
                  </h3>
                  <Link
                    href={`/updates/${update.slug}/`}
                    className="font-mono text-xs uppercase tracking-wider text-[color:var(--on-primary-link)] hover:underline"
                  >
                    Weekly update ↗
                  </Link>
                </div>
                <div className="pt-1">
                  <ActivityItemList items={group.items} commitCounts={group.commitCounts} />
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
