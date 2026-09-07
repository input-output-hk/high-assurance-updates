import type { Metadata } from "next";
import Link from "next/link";
import { StatusDot } from "@/components/status-badge";
import { getProducts, getProposals } from "@/lib/content";
import type { Proposal, ProposalStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Proposals",
  description:
    "The funding proposals behind the Cardano High Assurance products: windows, treasury asks, funded products, and canonical links.",
};

function StatusChip({ status }: { status: ProposalStatus }) {
  const meta =
    status === "active"
      ? { label: "Active", color: "var(--status-progress)" }
      : { label: "Completed", color: "var(--status-done)" };
  return <StatusDot label={meta.label} color={meta.color} />;
}

/** The headline ask: on-chain ada when present, USD reference budget otherwise. */
function ask(p: Proposal): string | null {
  if (p.treasuryAskAda != null) return `₳${p.treasuryAskAda.toLocaleString("en-US")}`;
  if (p.budgetUsd != null) return `$${p.budgetUsd.toLocaleString("en-US")}`;
  return null;
}

export default function ProposalsPage() {
  const proposals = getProposals();
  const products = getProducts();
  const titleById = new Map(products.map((p) => [p.id, p.title]));
  const slugById = new Map(products.map((p) => [p.id, p.slug]));

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-14">
      <header className="border-b border-border pb-8">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">Funding</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground">
          Proposals
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
          The treasury proposals that fund the High Assurance products. Product status and
          milestones live on each product page; the canonical proposal texts live at the linked
          external sources.
        </p>
      </header>

      <ol className="mt-8 flex flex-col gap-6">
        {proposals.map((p, i) => (
          <li
            key={p.id}
            id={p.id}
            className="ledger-in rounded-lg border border-border bg-surface p-6"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                {p.title}
              </h2>
              <StatusChip status={p.status} />
            </div>
            <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted">
              {p.windowStart.replace("-", " ")} – {p.windowEnd.replace("-", " ")}
              {ask(p) && (
                <>
                  {" "}· ask <span className="text-foreground">{ask(p)}</span>
                </>
              )}
            </p>

            <p className="mt-4 text-sm leading-6 text-foreground/80">{p.summary}</p>

            {p.products.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
                  Funds
                </span>
                {p.products.map((id) => (
                  <Link
                    key={id}
                    href={`/products/${slugById.get(id) ?? id}/`}
                    className="rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-xs text-muted transition-colors hover:border-primary hover:text-foreground"
                  >
                    {titleById.get(id) ?? id}
                  </Link>
                ))}
              </div>
            )}

            {p.collaborators.length > 0 && (
              <p className="mt-3 text-xs text-muted">
                In collaboration with {p.collaborators.join(", ")}.
              </p>
            )}

            {p.links.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                {p.links.map((l) => (
                  <li key={l.url}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-[color:var(--on-primary-link)] hover:underline"
                    >
                      {l.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {p.notes && <p className="mt-3 text-xs leading-5 text-muted">{p.notes}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
