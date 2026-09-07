// LLM-readable feeds for the Cardano High Assurance tracker (PRD G4 / NFR-5).
//
// One place that turns the site's committed content (the same loaders the pages
// use — so these can never drift from what's rendered) into three machine
// consumables, emitted as static files at build time by GET Route Handlers:
//
//   /llms.txt        — the llms.txt-standard index: a short Markdown map with
//                      absolute links to every resource an LLM should read.
//   /llms-full.txt   — the whole corpus as one clean Markdown document.
//   /api/status.json — structured product status + proof-of-work snapshot.
//
// Everything is a build-time snapshot of committed data (ADR-1); the feeds are
// labelled with the "as of" dates so consumers know their freshness.

import {
  getConfig,
  getProducts,
  getProposals,
  getStatusAsOf,
  getWeeklyUpdates,
} from "./content";
import { formatDateRange } from "./format";
import { OTHER_GROUP, type Product, type Proposal, type WeeklyUpdate } from "./types";

/** Canonical base URL with any trailing slash removed. */
function base(): string {
  return getConfig().site.url.replace(/\/+$/, "");
}

/** Human labels for gathered activity types (ADR-7). */
const ACTIVITY_LABEL: Record<string, string> = {
  pr: "PR merged",
  "pr-opened": "PR opened",
  "issue-opened": "Issue opened",
  "issue-closed": "Issue closed",
  release: "Release",
};

/** Map a product id (or the Other key) to a display title. */
function productTitleMap(): Record<string, string> {
  const map: Record<string, string> = { [OTHER_GROUP]: "Other" };
  for (const p of getProducts()) map[p.id] = p.title;
  return map;
}

/** Newest weekly's generatedAt — the freshness of the activity data. */
function activityAsOf(): string {
  return getWeeklyUpdates()[0]?.generatedAt ?? "";
}

/** The headline ask: on-chain ada when present, USD reference budget otherwise. */
function askLabel(p: Proposal): string {
  if (p.treasuryAskAda != null) return `₳${p.treasuryAskAda.toLocaleString("en-US")}`;
  if (p.budgetUsd != null) return `$${p.budgetUsd.toLocaleString("en-US")}`;
  return "n/a";
}

/**
 * Cumulative proof-of-work across every published week (PRD FR-12). The
 * additive counters are summed; repos-touched is the distinct set across all
 * weeks (summing the per-week counts would double-count).
 */
function proofOfWork() {
  const weeks = getWeeklyUpdates();
  const totals = {
    prsMerged: 0,
    prsOpened: 0,
    issuesClosed: 0,
    issuesOpened: 0,
    releases: 0,
    commits: 0,
    comments: 0,
  };
  const repos = new Set<string>();
  for (const w of weeks) {
    totals.prsMerged += w.counters.prsMerged;
    totals.prsOpened += w.counters.prsOpened;
    totals.issuesClosed += w.counters.issuesClosed;
    totals.issuesOpened += w.counters.issuesOpened;
    totals.releases += w.counters.releases;
    totals.commits += w.counters.commits;
    totals.comments += w.counters.comments;
    for (const g of w.groups) {
      for (const it of g.items) repos.add(it.repo);
      for (const repo of Object.keys(g.commitCounts)) repos.add(repo);
    }
  }
  return { weeksPublished: weeks.length, totals, reposTouched: repos.size };
}

// --- /llms.txt -------------------------------------------------------------

/** The llms.txt index: a short Markdown map linking every resource (H2 + bullet lists). */
export function buildLlmsTxt(): string {
  const { site } = getConfig();
  const b = base();
  const statusAsOf = getStatusAsOf();
  const dataAsOf = activityAsOf();

  const lines: string[] = [];
  lines.push(`# ${site.title}`);
  lines.push("");
  lines.push(`> ${site.tagline} Manual product status backed by automatically gathered GitHub evidence.`);
  lines.push("");
  if (statusAsOf) lines.push(`Product status as of ${statusAsOf}. Activity data as of ${dataAsOf}.`);
  lines.push("");
  lines.push(
    "For the entire corpus as one document, fetch /llms-full.txt. For structured data, fetch /api/status.json.",
  );

  lines.push("");
  lines.push("## Proposals");
  for (const p of getProposals()) {
    lines.push(
      `- [${p.title}](${b}/proposals/) — ${p.status}, ${p.windowStart} – ${p.windowEnd}, ask ${askLabel(p)}. Funds: ${p.products.join(", ")}.`,
    );
  }

  lines.push("");
  lines.push("## Products");
  for (const p of getProducts()) {
    lines.push(`- [${p.id} · ${p.title} — ${p.status}](${b}/products/${p.slug}/): ${p.summary.trim()}`);
  }

  lines.push("");
  lines.push("## Weekly updates");
  for (const w of getWeeklyUpdates()) {
    lines.push(`- [${w.week} (${formatDateRange(w.weekStart, w.weekEnd)})](${b}/updates/${w.slug}/): ${w.counters.prsMerged} PRs merged, ${w.counters.commits} commits across ${w.counters.reposTouched} repos.`);
  }

  lines.push("");
  lines.push("## Machine-readable");
  lines.push(`- [Full corpus (Markdown)](${b}/llms-full.txt): proposals, all product status, and every weekly update in one file.`);
  lines.push(`- [Status snapshot (JSON)](${b}/api/status.json): structured product status and cumulative proof-of-work.`);
  lines.push(`- [Source repository](${site.repoUrl}): the committed YAML/Markdown behind everything here.`);
  lines.push("");

  return lines.join("\n");
}

// --- /llms-full.txt --------------------------------------------------------

function renderProposalFull(p: Proposal): string {
  const out: string[] = [];
  out.push(`### ${p.title} — ${p.status}`);
  out.push(`Window: ${p.windowStart} – ${p.windowEnd} · Ask: ${askLabel(p)} · ${base()}/proposals/`);
  out.push("");
  out.push(p.summary.trim());
  if (p.products.length > 0) out.push(`\nFunds products: ${p.products.join(", ")}.`);
  if (p.collaborators.length > 0) out.push(`In collaboration with: ${p.collaborators.join(", ")}.`);
  if (p.links.length > 0) {
    out.push(`Links: ${p.links.map((l) => `${l.label} (${l.url})`).join(", ")}`);
  }
  if (p.notes.trim()) out.push(`\nNote: ${p.notes.trim()}`);
  return out.join("\n");
}

function renderProductFull(p: Product): string {
  const b = base();
  const out: string[] = [];
  out.push(`### ${p.id} · ${p.title} — ${p.status}`);
  out.push(`Quarter: ${p.quarter} · Status updated: ${p.statusUpdatedAt} · ${b}/products/${p.slug}/`);
  if (p.proposals.length > 0) out.push(`Funded by: ${p.proposals.join(", ")}`);
  out.push("");
  out.push(p.summary.trim());
  if (p.description.trim() && p.description.trim() !== p.summary.trim()) {
    out.push("");
    out.push(p.description.trim());
  }
  if (p.milestones.length > 0) {
    out.push("");
    out.push("Milestones:");
    for (const m of p.milestones) {
      const due = m.dueDate ? `due ${m.dueDate}` : "no calendar deadline";
      const delivered = m.deliveredDate ? `, delivered ${m.deliveredDate}` : "";
      out.push(`- ${m.id} ${m.title} — ${m.status} (${due}${delivered})`);
      if (m.description.trim()) out.push(`  ${m.description.trim().replace(/\s+/g, " ")}`);
    }
  }
  if (p.links.length > 0) {
    out.push("");
    out.push(`Links: ${p.links.map((l) => `${l.label} (${l.url})`).join(", ")}`);
  }
  return out.join("\n");
}

function renderWeeklyFull(w: WeeklyUpdate, titles: Record<string, string>): string {
  const c = w.counters;
  const out: string[] = [];
  out.push(`### ${w.week} — ${formatDateRange(w.weekStart, w.weekEnd)}`);
  out.push(`Generated ${w.generatedAt} · ${base()}/updates/${w.slug}/`);
  out.push("");
  out.push(
    `Counters: ${c.prsMerged} PRs merged, ${c.prsOpened} PRs opened, ${c.issuesClosed} issues closed, ${c.issuesOpened} issues opened, ${c.releases} releases, ${c.commits} commits across ${c.reposTouched} repos, ${c.comments} comments.`,
  );
  if (w.body.trim()) {
    out.push("");
    out.push(w.body.trim());
  }
  const groupsWithContent = w.groups.filter(
    (g) => g.items.length > 0 || Object.keys(g.commitCounts).length > 0,
  );
  if (groupsWithContent.length > 0) {
    out.push("");
    out.push("Activity by product:");
    for (const g of groupsWithContent) {
      const title = titles[g.product] ?? g.product;
      out.push("");
      out.push(`- ${g.product} · ${title}`);
      for (const it of g.items) {
        const label = ACTIVITY_LABEL[it.type] ?? it.type;
        const author = it.author ? ` by ${it.author}${it.community ? " (community)" : ""}` : "";
        out.push(`  - ${label}: ${it.title} — ${it.repo}${author} (${it.url})`);
      }
      const commits = Object.entries(g.commitCounts);
      if (commits.length > 0) {
        out.push(`  - commits: ${commits.map(([repo, n]) => `${repo} (${n})`).join(", ")}`);
      }
    }
  }
  return out.join("\n");
}

/** The whole corpus as one Markdown document. */
export function buildLlmsFullTxt(): string {
  const { site } = getConfig();
  const statusAsOf = getStatusAsOf();
  const dataAsOf = activityAsOf();
  const titles = productTitleMap();

  const parts: string[] = [];
  parts.push(`# ${site.title} — Full Snapshot`);
  parts.push("");
  parts.push(`> ${site.tagline}`);
  parts.push("");
  parts.push(
    [
      `Source: ${base()}`,
      statusAsOf ? `Product status as of ${statusAsOf}` : "",
      dataAsOf ? `Activity data as of ${dataAsOf}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  parts.push("");
  parts.push(
    "This document is generated from the tracker's committed content (see docs/ARCHITECTURE.md ADR-3): product status is authored by hand; the weekly activity is gathered from GitHub as supporting evidence. All figures are snapshots as of the dates above, not real-time.",
  );

  parts.push("\n---\n");
  parts.push("## Proposals\n");
  parts.push(getProposals().map(renderProposalFull).join("\n\n"));

  parts.push("\n---\n");
  parts.push("## Product status\n");
  if (statusAsOf) parts.push(`Status as of ${statusAsOf}.\n`);
  parts.push(getProducts().map(renderProductFull).join("\n\n"));

  parts.push("\n---\n");
  parts.push("## Weekly updates\n");
  parts.push(getWeeklyUpdates().map((w) => renderWeeklyFull(w, titles)).join("\n\n"));
  parts.push("");

  return parts.join("\n");
}

// --- /api/status.json ------------------------------------------------------

/** Structured product status + proof-of-work snapshot for programmatic consumers. */
export function buildStatusJson() {
  const { site } = getConfig();
  const b = base();
  const weeks = getWeeklyUpdates();

  return {
    site: { title: site.title, url: b, repoUrl: site.repoUrl },
    // Manual status is authoritative (ADR-3); activity is snapshot evidence (ADR-1).
    statusAsOf: getStatusAsOf(),
    activityAsOf: activityAsOf(),
    proposals: getProposals().map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      windowStart: p.windowStart,
      windowEnd: p.windowEnd,
      treasuryAskAda: p.treasuryAskAda,
      budgetUsd: p.budgetUsd,
      products: p.products,
      collaborators: p.collaborators,
      links: p.links,
    })),
    products: getProducts().map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      quarter: p.quarter,
      status: p.status,
      statusUpdatedAt: p.statusUpdatedAt,
      proposals: p.proposals,
      summary: p.summary.trim(),
      url: `${b}/products/${p.slug}/`,
      milestones: p.milestones.map((m) => ({
        id: m.id,
        title: m.title,
        status: m.status,
        dueDate: m.dueDate,
        deliveredDate: m.deliveredDate,
      })),
      links: p.links,
    })),
    proofOfWork: proofOfWork(),
    weeks: weeks.map((w) => ({
      week: w.week,
      slug: w.slug,
      weekStart: w.weekStart,
      weekEnd: w.weekEnd,
      generatedAt: w.generatedAt,
      url: `${b}/updates/${w.slug}/`,
      counters: w.counters,
    })),
  };
}
