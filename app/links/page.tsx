import type { Metadata } from "next";
import { getConfig, getProducts, getTrackedRepos } from "@/lib/content";

export const metadata: Metadata = {
  title: "Links",
  description:
    "Curated jump-off points for Cardano High Assurance: tracked repositories and key ecosystem resources.",
};

function host(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function LinkCard({ label, url, note }: { label: string; url: string; note?: string }) {
  return (
    <li>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex h-full flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span className="flex items-start justify-between gap-2">
          <span className="font-display text-base font-semibold text-foreground group-hover:text-primary">
            {label}
          </span>
          <span aria-hidden className="text-muted group-hover:text-primary">
            ↗
          </span>
        </span>
        {note && <span className="mt-1 text-sm text-muted">{note}</span>}
        <span className="mt-3 font-mono text-xs text-muted">{host(url)}</span>
      </a>
    </li>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</ul>
    </section>
  );
}

export default function LinksPage() {
  const config = getConfig();
  const repos = getTrackedRepos();
  const products = getProducts();
  const titleById = new Map(products.map((p) => [p.id, p.title]));

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-14">
      <header className="border-b border-border pb-8">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">Ecosystem</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground">
          Links
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
          Jump-off points into the work: the repositories this tracker watches and the ecosystem
          resources the team builds on.
        </p>
      </header>

      {repos.length > 0 && (
        <Section title="Tracked repositories">
          {repos.map((r) => {
            const note = r.product
              ? `${r.product} · ${titleById.get(r.product) ?? r.product}`
              : "Other";
            return <LinkCard key={r.url} label={`${r.owner}/${r.name}`} url={r.url} note={note} />;
          })}
        </Section>
      )}

      {config.links.length > 0 && (
        <Section title="Ecosystem resources">
          {config.links.map((l) => (
            <LinkCard key={l.url} label={l.label} url={l.url} />
          ))}
        </Section>
      )}

      <Section title="This tracker">
        <LinkCard label="Source & content" url={config.site.repoUrl} note="Everything is git-reviewable" />
      </Section>
    </div>
  );
}
