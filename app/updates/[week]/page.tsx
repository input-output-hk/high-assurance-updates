import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { ActivityGroups, CounterStrip } from "@/components/weekly-update";
import { getProducts, getWeeklyUpdateBySlug, getWeeklyUpdates } from "@/lib/content";
import { formatDate, formatDateRange, weekParts } from "@/lib/format";

// Static export: pre-render one page per gathered week and 404 anything else.
export const dynamicParams = false;

export function generateStaticParams() {
  return getWeeklyUpdates().map((u) => ({ week: u.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ week: string }>;
}): Promise<Metadata> {
  const { week } = await params;
  const update = getWeeklyUpdateBySlug(week);
  if (!update) return { title: "Update" };
  const { label, year } = weekParts(update.week);
  return {
    title: `${label} · ${year}`,
    description: `Gathered activity and narrative for ${label}, ${year} (${formatDateRange(update.weekStart, update.weekEnd)}).`,
  };
}

export default async function WeeklyUpdatePage({
  params,
}: {
  params: Promise<{ week: string }>;
}) {
  const { week } = await params;
  const update = getWeeklyUpdateBySlug(week);
  if (!update) notFound();

  const { label, year } = weekParts(update.week);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-14">
      <header className="border-b border-border pb-8">
        <Link
          href="/updates"
          className="font-mono text-xs uppercase tracking-wider text-muted hover:text-foreground"
        >
          ← All updates
        </Link>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground">
          {label} <span className="text-muted">· {year}</span>
        </h1>
        <p className="mt-3 font-mono text-xs uppercase tracking-wider text-muted">
          {formatDateRange(update.weekStart, update.weekEnd)} · gathered {formatDate(update.generatedAt)}
        </p>
      </header>

      <section className="mt-8">
        <CounterStrip counters={update.counters} />
      </section>

      {update.body && (
        <section className="mt-8">
          <Markdown>{update.body}</Markdown>
        </section>
      )}

      {update.groups.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Activity
          </h2>
          <p className="mt-1 mb-5 text-sm text-muted">
            Merged PRs, issues, and releases grouped by product — the evidence behind the
            narrative above. Community contributions are called out.
          </p>
          <ActivityGroups groups={update.groups} products={getProducts()} />
        </section>
      )}
    </div>
  );
}
