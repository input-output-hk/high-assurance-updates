import Link from "next/link";
import { ProductTimeline } from "@/components/product-timeline";
import { CounterStrip } from "@/components/weekly-update";
import {
    getConfig,
    getLatestWeeklyUpdate,
    getProducts,
    getProposals,
    getStatusAsOf,
} from "@/lib/content";
import { formatDateRange, weekParts } from "@/lib/format";
import type { ProductStatus } from "@/lib/types";

export default function Home() {
    const config = getConfig();
    const products = getProducts();
    const proposals = getProposals();
    const asOf = getStatusAsOf();
    const latest = getLatestWeeklyUpdate();

    const counts = products.reduce<Record<ProductStatus, number>>(
        (acc, p) => {
            acc[p.status] += 1;
            return acc;
        },
        { "not-started": 0, "in-progress": 0, done: 0, blocked: 0 },
    );

    // Data-derived facts only — no fabricated GitHub numbers (PRD non-goal).
    const facts: { label: string; value: string }[] = [
        { label: "Products", value: String(products.length) },
        { label: "In progress", value: String(counts["in-progress"]) },
        { label: "Done", value: String(counts.done) },
        { label: "Proposals", value: String(proposals.length) },
        { label: "Repos tracked", value: String(config.repos.length) },
    ];

    return (
        <div className="mx-auto w-full max-w-6xl px-6">
            {/* Hero — the delivery manifest header. */}
            <section className="border-b border-border pt-8 pb-8">
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">
                    Assurance, measured
                </p>
                <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
                    {config.site.title}
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
                    {config.site.tagline}
                </p>

                {/* Fact strip in the mono "data" voice. */}
                <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-5">
                    {facts.map((fact) => (
                        <div key={fact.label} className="bg-surface px-4 py-4">
                            <dt className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
                                {fact.label}
                            </dt>
                            <dd className="mt-1 font-display text-2xl font-semibold text-foreground">
                                {fact.value}
                            </dd>
                        </div>
                    ))}
                </dl>
            </section>

            {/* Product timeline. */}
            <section className="py-8">
                <div>
                    <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                        Products
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        Committed milestones vs. actual delivery across the current cycle
                        {asOf ? ` · status as of ${asOf}` : ""}. Select one for its full activity.
                    </p>
                </div>

                <div className="mt-8">
                    <ProductTimeline products={products} />
                </div>
            </section>

            {/* Latest weekly update — the living proof-of-work (FR-1). */}
            {latest && (
                <section className="border-t border-border py-8">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                                Latest update
                            </h2>
                            <p className="mt-1 text-sm text-muted">
                                {weekParts(latest.week).label} · {formatDateRange(latest.weekStart, latest.weekEnd)}
                            </p>
                        </div>
                        <Link
                            href="/updates"
                            className="shrink-0 font-mono text-xs uppercase tracking-wider text-(--on-primary-link) hover:underline"
                        >
                            All updates ↗
                        </Link>
                    </div>

                    <div className="mt-6">
                        <CounterStrip counters={latest.counters} />
                    </div>

                    <Link
                        href={`/updates/${latest.slug}/`}
                        className="mt-4 inline-block font-mono text-xs uppercase tracking-wider text-(--on-primary-link) hover:underline"
                    >
                        Read {weekParts(latest.week).label} ↗
                    </Link>
                </section>
            )}
        </div>
    );
}
