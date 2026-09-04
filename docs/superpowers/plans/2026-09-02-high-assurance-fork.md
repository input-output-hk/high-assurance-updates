# Cardano High Assurance Tracker (fork) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fork `devx-updates` into `input-output-hk/high-assurance-updates` — a static tracker for IO's four Cardano High Assurance products (Plu-stan, sc-testing-tool, Blaster, CBDE), organized by product with proposals as metadata and community contributions auto-flagged.

**Architecture:** Keep the proven machinery (Next.js 16 static export → GitHub Pages, content-as-YAML, weekly GitHub-activity gatherer, draft-PR CI). Restructure the content layer: `deliverables.yaml` → `products.yaml`, new `proposals.yaml` + `/proposals` page, gatherer groups by product and tags non-roster authors `community: true`. Spec: `docs/superpowers/specs/2026-09-02-high-assurance-fork-design.md`.

**Tech Stack:** Next.js 16.2.10 (static export, Turbopack), React 19, TypeScript 5, Tailwind 4, js-yaml, tsx, GitHub REST/Search API, GitHub Actions.

---

## Context for the engineer

- **Working directory for ALL tasks after Task 1:** `/Users/romainsoulat/high-assurance-updates` (created in Task 1). The source repo `/Users/romainsoulat/devx-updates` is NOT modified by this plan.
- **Read before writing Next.js code** (repo rule, see `AGENTS.md`): the bundled docs under `node_modules/next/dist/docs/` — notably `01-app/02-guides/static-exports.md` and `03-api-reference/03-file-conventions/page.md`. `params` are Promises; `output: 'export'`; dynamic routes need `generateStaticParams` + `dynamicParams = false`.
- **No test framework exists** in this codebase, and we are not adding one (content site; the loaders fail the build loudly on bad content). Verification per task = targeted `tsc`/`tsx` probes; the green gates are Task 2 (build passes after the strip) and Task 17 (build passes after the refactor).
- **Red zone:** Tasks 3–16 intentionally leave `npm run build` broken (a rename this entangled can't be green per-task). Each task still verifies its own file compiles cleanly. Commit per task anyway — the repo is unpublished until Task 22.
- **Type renames used throughout** (fixed vocabulary — do not improvise): `Deliverable`→`Product`, `DeliverableStatus`→`ProductStatus`, `DELIVERABLE_STATUSES`→`PRODUCT_STATUSES`, `DeliverableLink`→`SiteLink`, `DeliverableUpdate`→`ProductUpdate`, `TrackedRepo.deliverable`→`TrackedRepo.product`, `WeeklyGroup.deliverable`→`WeeklyGroup.product`, `REACTIVE_GROUP`(`"reactive"`)→`OTHER_GROUP`(`"other"`). New: `Proposal`, `ProposalStatus`, `PROPOSAL_STATUSES`, `ActivityItem.community?: boolean`.
- **New loader API** (defined in Task 4, used by every page task): `getProducts()`, `getProductBySlug(slug)`, `getReposForProduct(id)`, `getProposals()`, `getProposalsForProduct(id)`, plus the unchanged `getConfig()`, `getTrackedRepos()`, `getStatusAsOf()`, `getWeeklyUpdates()`, `getWeeklyUpdateBySlug()`, `getLatestWeeklyUpdate()`.
- **Commit style** (match repo history): `feat(...)`, `chore(...)`, `docs(...)` prefixes, imperative mood, and the trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

### Task index

| # | Task | Build state after |
|---|---|---|
| 1 | Create the fork working copy | green |
| 2 | Strip DevX-only pages & content | green (gate) |
| 3 | Rewrite `lib/types.ts` | red |
| 4 | Rewrite `lib/content.ts` | red |
| 5 | Seed `content/config.yaml` | red |
| 6 | Seed `content/products.yaml` | red |
| 7 | Seed `content/proposals.yaml` | red |
| 8 | Timeline component → products | red |
| 9 | Weekly components → products + community callout | red |
| 10 | Home page | red |
| 11 | Product detail page | red |
| 12 | New Proposals page | red |
| 13 | Links page | red |
| 14 | Updates pages copy | red |
| 15 | Site identity (header, footer, OG image) | red |
| 16 | LLM feeds & status.json | red |
| 17 | Full build + lint checkpoint | green (gate) |
| 18 | Gatherer: product grouping + community flag | green |
| 19 | CI workflows + repo metadata | green |
| 20 | Docs rewrite (README, PRD, ARCHITECTURE, AGENTS) | green |
| 21 | Backfill weekly history (Jul–Aug 2026) | green |
| 22 | Final verification + publish to GitHub | green |

---

### Task 1: Create the fork working copy

**Files:**
- Create: `/Users/romainsoulat/high-assurance-updates/` (git clone)

- [ ] **Step 1: Clone the source repo and carry the spec + plan onto main**

```bash
git clone /Users/romainsoulat/devx-updates /Users/romainsoulat/high-assurance-updates
cd /Users/romainsoulat/high-assurance-updates
git checkout main
# The spec and this plan live on a branch in the source repo — carry them into the fork's main.
git checkout origin/high-assurance-fork-spec -- docs/superpowers/
git commit -m "docs: carry High Assurance fork spec and plan

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

- [ ] **Step 2: Detach from the source repo's remote**

```bash
git remote remove origin
git branch -a
```

Expected: only `* main` remains (no `remotes/origin/*`).

- [ ] **Step 3: Sanity-build the pristine clone**

```bash
npm ci && npm run build
```

Expected: `✓ Exporting` / build succeeds. (This proves the baseline is green before we touch anything.)

---

### Task 2: Strip DevX-only pages & content

Removes everything the spec drops (§4): pledge, proposal page, map, impact, DevX weekly history, DevX data files, and the loaders/nav entries that reference them. Build must be GREEN at the end of this task.

**Files:**
- Delete: `app/pledge/`, `app/proposal/`, `app/map/`, `app/_impact/`, `components/GraphMap.tsx`, `components/Nav.tsx`, `components/growth-chart.tsx`, `lib/map-types.ts`, `content/pledge.md`, `content/proposal/`, `content/impact.yaml`, `content/weekly/*.md`, `data/`, `devx-proposal.pdf`, `scratchpad-fav.ico`, `scripts/backfill-open-prs.ts`
- Modify: `lib/content.ts`, `lib/types.ts`, `lib/llm-feed.ts`, `components/site-header.tsx`

- [ ] **Step 1: Delete the DevX-only files**

```bash
cd /Users/romainsoulat/high-assurance-updates
git rm -r app/pledge app/proposal app/map app/_impact \
  components/GraphMap.tsx components/Nav.tsx components/growth-chart.tsx \
  lib/map-types.ts content/pledge.md content/proposal content/impact.yaml \
  content/weekly data devx-proposal.pdf scratchpad-fav.ico \
  scripts/backfill-open-prs.ts
```

- [ ] **Step 2: Remove the impact/proposal/pledge loaders from `lib/content.ts`**

Delete these three whole sections at the bottom of the file (everything from `// --- Proposal ---` through the end of `getImpact`): the `proposalCache`/`getProposalMarkdown` block, the `alignmentCache`/`getCommunityAlignmentMarkdown` block, and the entire `// --- Impact ---` section (`asNumberOrNull`, `normalizeSeries`, `normalizeGrowthMetric`, `normalizePastMetric`, `impactCache`, `getImpact`). Then remove the now-unused imports from the import block at the top: `GrowthMetric`, `ImpactConfig`, `ImpactSeries`, `PastMetric`.

- [ ] **Step 3: Remove the Impact types from `lib/types.ts`**

Delete the whole `// --- Impact (ecosystem KPIs …) ---` section: interfaces `ImpactPoint`, `ImpactSeries`, `GrowthMetric`, `PastMetric`, `ImpactConfig` (lines ~87–137).

- [ ] **Step 4: Remove the proposal-markdown sections from `lib/llm-feed.ts`**

Remove `getProposalMarkdown` from the import list. In `buildLlmsTxt()`, delete the two-line "## Proposal" section:

```ts
  lines.push("");
  lines.push("## Proposal");
  lines.push(`- [Developer Experience Initiative proposal](${b}/proposal/): the full funded proposal, rendered as Markdown.`);
```

In `buildLlmsFullTxt()`, delete:

```ts
  parts.push("\n---\n");
  parts.push("## Proposal\n");
  parts.push(getProposalMarkdown().trim());
```

(The remaining `config.proposal` references stay for now — they go away in Task 16.)

- [ ] **Step 5: Trim the nav in `components/site-header.tsx`**

Replace the `NAV` constant with:

```ts
const NAV = [
  { href: "/", label: "Overview" },
  { href: "/updates", label: "Updates" },
  { href: "/links", label: "Links" },
];
```

- [ ] **Step 6: Verify the build is green**

```bash
npm run build && npm run lint
```

Expected: build succeeds (the `updates/[week]` route simply generates zero pages now that `content/weekly/` is empty — `generateStaticParams` returning `[]` is legal), lint passes. If lint flags unused imports you missed in steps 2–4, remove them.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: strip DevX-only pages, content, and loaders

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Rewrite `lib/types.ts`

**Files:**
- Modify: `lib/types.ts` (full replacement)

- [ ] **Step 1: Replace the entire file with:**

```ts
// Shared content types for the Cardano High Assurance tracker.

export const PRODUCT_STATUSES = [
  "not-started",
  "in-progress",
  "done",
  "blocked",
] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/** "Q3-2026"-style quarter, or "ongoing" for open-ended work. Validated in content.ts. */
export type Quarter = string;

export interface SiteLink {
  label: string;
  url: string;
}

/**
 * An intermediate improvement made while working toward a product's milestone.
 * Shown as a marker on the home timeline; links to the weekly update that
 * reported it.
 */
export interface ProductUpdate {
  date: string; // YYYY-MM-DD
  description: string;
  week: string; // ISO week key of the weekly update to link to, e.g. "2026-W36"
}

/**
 * A committed milestone within a product, carried from its funding proposal's
 * roadmap. `dueDate` is null for milestones with no calendar deadline (e.g.
 * 2025/26-cycle deliverables whose dates are still being confirmed).
 *
 * `evidence`, `acceptanceCriteria`, `team`, and `thirdPartyAssurance` are
 * stored for the record — not yet surfaced in the UI.
 */
export interface Milestone {
  id: string; // e.g. "BL.03"
  title: string;
  /** Committed deadline (YYYY-MM-DD), or null when there is no calendar date. */
  dueDate: string | null;
  /** When it was actually delivered (YYYY-MM-DD), or null if not yet. */
  deliveredDate: string | null;
  status: ProductStatus;
  description: string;
  evidence: string;
  acceptanceCriteria: string;
  team: string;
  thirdPartyAssurance: string;
}

/**
 * A product: the site's organizing unit (ADR-13). Rolls up gathered GitHub
 * activity (by `id`, see ADR-6) and holds the milestones from the proposals
 * that fund it (`proposals` references proposals.yaml ids).
 */
export interface Product {
  id: string;
  slug: string;
  title: string;
  quarter: Quarter;
  status: ProductStatus;
  statusUpdatedAt: string; // YYYY-MM-DD
  /** Ids of the funding proposals (proposals.yaml). */
  proposals: string[];
  /** Committed milestones on this product; may be empty. */
  milestones: Milestone[];
  /** Intermediate improvements along the way, shown on the timeline. */
  updates: ProductUpdate[];
  summary: string;
  description: string;
  links: SiteLink[];
}

export const PROPOSAL_STATUSES = ["active", "completed"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

/**
 * A funding proposal (ADR-13): metadata rendered on the Proposals page, never
 * the site's structure. Canonical texts live at external links (AdaStat, IPFS).
 */
export interface Proposal {
  id: string;
  title: string;
  status: ProposalStatus;
  windowStart: string; // e.g. "Q3-2026" or "Q2-2025"
  windowEnd: string;
  /** On-chain ask in ada, or null when the proposal predates on-chain asks. */
  treasuryAskAda: number | null;
  /** Reference budget in USD, or null. */
  budgetUsd: number | null;
  summary: string;
  /** Product ids this proposal funds. */
  products: string[];
  collaborators: string[];
  links: SiteLink[];
  notes: string;
}

/**
 * A curated repository the gatherer tracks (ADR-4/5/6). `product` is the id of
 * the product it maps to, or null to fall into the "Other" bucket. `teamOnly`
 * (ADR-5): for shared/external repos, count only roster-authored work.
 */
export interface TrackedRepo {
  url: string;
  owner: string;
  name: string;
  product: string | null;
  teamOnly: boolean;
}

export interface SiteConfig {
  site: {
    title: string;
    tagline: string;
    description: string;
    repoUrl: string;
    /** Canonical public base URL incl. Pages subpath; base for LLM-feed links. */
    url: string;
  };
  /** GitHub logins whose work counts as the team's (ADR-5, ADR-14). */
  roster: string[];
  repos: TrackedRepo[];
  links: SiteLink[];
}

// --- Weekly updates (gathered activity, ADR-6/7) ---------------------------

export const ACTIVITY_TYPES = [
  "pr",
  "pr-opened",
  "issue-opened",
  "issue-closed",
  "release",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/** The special group key for activity that maps to no product (ADR-6). */
export const OTHER_GROUP = "other";

export interface ActivityItem {
  type: ActivityType;
  title: string;
  url: string;
  repo: string; // "owner/name"
  author: string;
  /** True when the author is not on the team roster — a community contribution (ADR-14). */
  community?: boolean;
}

export interface WeeklyGroup {
  /** A product id or OTHER_GROUP. */
  product: string;
  items: ActivityItem[];
  /** Per-repo raw commit counts — noise summarized, not itemized (ADR-7). */
  commitCounts: Record<string, number>;
}

export interface WeeklyCounters {
  prsMerged: number;
  /** PRs opened in-window and still open at gather time (incl. drafts) — in-progress work, any target branch (ADR-7). */
  prsOpened: number;
  issuesClosed: number;
  issuesOpened: number;
  releases: number;
  reposTouched: number;
  commits: number;
  /** Issue + PR conversation comments authored in-window — noise, summarized (ADR-7). */
  comments: number;
}

export interface WeeklyUpdate {
  week: string; // ISO week key, e.g. "2026-W36"
  slug: string; // URL-safe, lowercased, e.g. "2026-w36"
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string; // YYYY-MM-DD (Sunday)
  generatedAt: string; // YYYY-MM-DD
  counters: WeeklyCounters;
  groups: WeeklyGroup[];
  /** Human-authored narrative (Markdown body below the frontmatter). */
  body: string;
}
```

- [ ] **Step 2: Verify the file itself compiles**

```bash
npx tsc --noEmit 2>&1 | grep "lib/types.ts" ; echo "exit: $?"
```

Expected: no output from grep (`exit: 1`) — other files now fail, `lib/types.ts` itself must not.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat(model): product/proposal types, community flag, Other bucket

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Rewrite `lib/content.ts`

**Files:**
- Modify: `lib/content.ts` (full replacement)

- [ ] **Step 1: Replace the entire file with:**

```ts
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { load as loadYaml } from "js-yaml";
import {
  ACTIVITY_TYPES,
  PRODUCT_STATUSES,
  PROPOSAL_STATUSES,
  type ActivityItem,
  type ActivityType,
  type Milestone,
  type Product,
  type ProductStatus,
  type ProductUpdate,
  type Proposal,
  type ProposalStatus,
  type SiteConfig,
  type SiteLink,
  type TrackedRepo,
  type WeeklyCounters,
  type WeeklyGroup,
  type WeeklyUpdate,
} from "./types";

// Content is read from disk at build time (static export). No network, no runtime IO.
const CONTENT_DIR = join(process.cwd(), "content");

/** "Q3-2026"-style quarters; "ongoing" is also accepted for open-ended work. */
const QUARTER_RE = /^Q[1-4]-\d{4}$/;

function readYaml(fileName: string): unknown {
  const raw = readFileSync(join(CONTENT_DIR, fileName), "utf8");
  return loadYaml(raw);
}

/** Throw a build-failing error so malformed content never ships silently. */
function fail(fileName: string, message: string): never {
  throw new Error(`Invalid content in content/${fileName}: ${message}`);
}

function asString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function normalizeLinks(raw: unknown): SiteLink[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((l) => {
    if (typeof l === "object" && l !== null) {
      const link = l as Record<string, unknown>;
      if (asString(link.label) && asString(link.url)) {
        return [{ label: link.label, url: link.url }];
      }
    }
    return [];
  });
}

function normalizeStatus(where: string, raw: unknown, fallback: ProductStatus): ProductStatus {
  if (raw == null) return fallback;
  if (!PRODUCT_STATUSES.includes(raw as ProductStatus)) {
    fail(
      "products.yaml",
      `${where} has invalid status "${String(raw)}" (expected one of ${PRODUCT_STATUSES.join(", ")})`,
    );
  }
  return raw as ProductStatus;
}

function normalizeMilestone(raw: unknown, where: string): Milestone {
  if (typeof raw !== "object" || raw === null) fail("products.yaml", `${where} is not an object`);
  const m = raw as Record<string, unknown>;
  for (const key of ["id", "title"]) {
    if (!asString(m[key])) fail("products.yaml", `${where} is missing string "${key}"`);
  }
  const text = (v: unknown): string => (asString(v) ? v : "");
  return {
    id: m.id as string,
    title: m.title as string,
    dueDate: asString(m.dueDate) ? m.dueDate : null,
    deliveredDate: asString(m.deliveredDate) ? m.deliveredDate : null,
    status: normalizeStatus(`${where} milestone status`, m.status, "not-started"),
    description: text(m.description),
    evidence: text(m.evidence),
    acceptanceCriteria: text(m.acceptanceCriteria),
    team: text(m.team),
    thirdPartyAssurance: text(m.thirdPartyAssurance),
  };
}

function normalizeProduct(raw: unknown, index: number): Product {
  const where = `product #${index + 1}`;
  if (typeof raw !== "object" || raw === null) {
    fail("products.yaml", `${where} is not an object`);
  }
  const d = raw as Record<string, unknown>;

  for (const key of ["id", "slug", "title", "summary", "description", "statusUpdatedAt"]) {
    if (!asString(d[key])) fail("products.yaml", `${where} is missing string "${key}"`);
  }
  if (!PRODUCT_STATUSES.includes(d.status as ProductStatus)) {
    fail(
      "products.yaml",
      `${where} has invalid status "${String(d.status)}" (expected one of ${PRODUCT_STATUSES.join(", ")})`,
    );
  }
  const quarter = String(d.quarter ?? "");
  if (quarter !== "ongoing" && !QUARTER_RE.test(quarter)) {
    fail(
      "products.yaml",
      `${where} has invalid quarter "${quarter}" (expected "Q1-2026"-style or "ongoing")`,
    );
  }

  const milestones: Milestone[] = Array.isArray(d.milestones)
    ? d.milestones.map((m, i) => normalizeMilestone(m, `${where} milestones[${i}]`))
    : [];
  const updates: ProductUpdate[] = Array.isArray(d.updates)
    ? d.updates.flatMap((u) => {
        if (typeof u === "object" && u !== null) {
          const up = u as Record<string, unknown>;
          if (asString(up.date) && asString(up.description) && asString(up.week)) {
            return [{ date: up.date, description: up.description, week: up.week }];
          }
        }
        return [];
      })
    : [];

  return {
    id: d.id as string,
    slug: d.slug as string,
    title: d.title as string,
    quarter,
    status: d.status as ProductStatus,
    statusUpdatedAt: d.statusUpdatedAt as string,
    proposals: Array.isArray(d.proposals) ? d.proposals.filter(asString) : [],
    milestones,
    updates,
    summary: d.summary as string,
    description: d.description as string,
    links: normalizeLinks(d.links),
  };
}

let productsCache: Product[] | null = null;

export function getProducts(): Product[] {
  if (productsCache) return productsCache;
  const raw = readYaml("products.yaml");
  if (!Array.isArray(raw)) fail("products.yaml", "expected a top-level list");
  const slugs = new Set<string>();
  const ids = new Set<string>();
  const products = raw.map((entry, i) => {
    const p = normalizeProduct(entry, i);
    if (slugs.has(p.slug)) fail("products.yaml", `duplicate slug "${p.slug}"`);
    if (ids.has(p.id)) fail("products.yaml", `duplicate id "${p.id}"`);
    slugs.add(p.slug);
    ids.add(p.id);
    return p;
  });
  productsCache = products;
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return getProducts().find((p) => p.slug === slug);
}

// --- Proposals ---------------------------------------------------------------

function normalizeProposal(raw: unknown, index: number): Proposal {
  const where = `proposal #${index + 1}`;
  if (typeof raw !== "object" || raw === null) fail("proposals.yaml", `${where} is not an object`);
  const p = raw as Record<string, unknown>;
  for (const key of ["id", "title", "windowStart", "windowEnd", "summary"]) {
    if (!asString(p[key])) fail("proposals.yaml", `${where} is missing string "${key}"`);
  }
  if (!PROPOSAL_STATUSES.includes(p.status as ProposalStatus)) {
    fail(
      "proposals.yaml",
      `${where} has invalid status "${String(p.status)}" (expected one of ${PROPOSAL_STATUSES.join(", ")})`,
    );
  }
  const num = (v: unknown): number | null =>
    typeof v === "number" && Number.isFinite(v) ? v : null;
  return {
    id: p.id as string,
    title: p.title as string,
    status: p.status as ProposalStatus,
    windowStart: p.windowStart as string,
    windowEnd: p.windowEnd as string,
    treasuryAskAda: num(p.treasuryAskAda),
    budgetUsd: num(p.budgetUsd),
    summary: p.summary as string,
    products: Array.isArray(p.products) ? p.products.filter(asString) : [],
    collaborators: Array.isArray(p.collaborators) ? p.collaborators.filter(asString) : [],
    links: normalizeLinks(p.links),
    notes: asString(p.notes) ? p.notes : "",
  };
}

let proposalsCache: Proposal[] | null = null;

/**
 * All funding proposals, in authored order. Cross-validates both directions of
 * the product↔proposal references so a broken id fails the build (ADR-13).
 */
export function getProposals(): Proposal[] {
  if (proposalsCache) return proposalsCache;
  const raw = readYaml("proposals.yaml");
  if (!Array.isArray(raw)) fail("proposals.yaml", "expected a top-level list");
  const proposals = raw.map((entry, i) => normalizeProposal(entry, i));

  const proposalIds = new Set(proposals.map((p) => p.id));
  const productIds = new Set(getProducts().map((p) => p.id));
  for (const p of proposals) {
    for (const ref of p.products) {
      if (!productIds.has(ref)) {
        fail("proposals.yaml", `proposal "${p.id}" references unknown product "${ref}"`);
      }
    }
  }
  for (const product of getProducts()) {
    for (const ref of product.proposals) {
      if (!proposalIds.has(ref)) {
        fail("products.yaml", `product "${product.id}" references unknown proposal "${ref}"`);
      }
    }
  }

  proposalsCache = proposals;
  return proposals;
}

/** Proposals that fund a given product id. */
export function getProposalsForProduct(productId: string): Proposal[] {
  return getProposals().filter((p) => p.products.includes(productId));
}

// --- Site config -------------------------------------------------------------

/** Split a GitHub repo URL into { owner, name }. */
function parseRepoUrl(url: string): { owner: string; name: string } | null {
  const m = url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
  if (!m) return null;
  return { owner: m[1], name: m[2] };
}

function normalizeTrackedRepo(raw: unknown, index: number): TrackedRepo {
  const where = `repos[${index}]`;
  if (typeof raw !== "object" || raw === null) fail("config.yaml", `${where} is not an object`);
  const r = raw as Record<string, unknown>;
  if (!asString(r.url)) fail("config.yaml", `${where} is missing string "url"`);
  const parsed = parseRepoUrl(r.url);
  if (!parsed) fail("config.yaml", `${where} url "${r.url}" is not a github.com repo URL`);
  const product = r.product == null ? null : String(r.product);
  return {
    url: r.url,
    owner: parsed.owner,
    name: parsed.name,
    product,
    teamOnly: r.teamOnly === true,
  };
}

let configCache: SiteConfig | null = null;

export function getConfig(): SiteConfig {
  if (configCache) return configCache;
  const raw = readYaml("config.yaml");
  if (typeof raw !== "object" || raw === null) fail("config.yaml", "expected an object");
  const c = raw as Record<string, unknown>;

  // site/links are authored by us and consumed lightly; trust their shape.
  // repos + roster feed the gatherer, so validate them strictly — including
  // that every repo's product id actually exists (ADR-6).
  const repos = Array.isArray(c.repos)
    ? c.repos.map((entry, i) => normalizeTrackedRepo(entry, i))
    : fail("config.yaml", `expected "repos" to be a list`);
  const roster = Array.isArray(c.roster) ? c.roster.filter(asString) : [];
  const productIds = new Set(getProducts().map((p) => p.id));
  for (const repo of repos) {
    if (repo.product !== null && !productIds.has(repo.product)) {
      fail("config.yaml", `repo ${repo.owner}/${repo.name} references unknown product "${repo.product}"`);
    }
  }

  configCache = {
    site: (c.site ?? {}) as SiteConfig["site"],
    roster,
    repos,
    links: normalizeLinks(c.links),
  };
  return configCache;
}

/** The curated repositories the gatherer tracks (ADR-4). */
export function getTrackedRepos(): TrackedRepo[] {
  return getConfig().repos;
}

/**
 * Tracked repos that roll up to a given product id — derived from the same
 * `config.yaml` list the gatherer reads, so the product page and the gathered
 * activity can never drift out of sync.
 */
export function getReposForProduct(productId: string): TrackedRepo[] {
  return getTrackedRepos().filter((r) => r.product === productId);
}

/** Latest statusUpdatedAt across all products — the site's "status as of" date. */
export function getStatusAsOf(): string {
  return getProducts()
    .map((p) => p.statusUpdatedAt)
    .sort()
    .at(-1) ?? "";
}

// --- Weekly updates ----------------------------------------------------------

const WEEKLY_DIR = join(CONTENT_DIR, "weekly");

/**
 * Split a `---`-fenced YAML frontmatter block from a Markdown body. Reuses
 * js-yaml (no extra dependency) to stay consistent with the rest of the loader.
 */
function parseFrontmatter(
  fileName: string,
  raw: string,
): { data: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) fail(fileName, "missing YAML frontmatter (--- fenced block)");
  const data = loadYaml(match[1]);
  if (typeof data !== "object" || data === null) {
    fail(fileName, "frontmatter is not an object");
  }
  return { data: data as Record<string, unknown>, body: match[2].trim() };
}

function normalizeCounters(fileName: string, raw: unknown): WeeklyCounters {
  const c = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const num = (key: keyof WeeklyCounters): number =>
    typeof c[key] === "number" && Number.isFinite(c[key]) ? (c[key] as number) : 0;
  return {
    prsMerged: num("prsMerged"),
    prsOpened: num("prsOpened"),
    issuesClosed: num("issuesClosed"),
    issuesOpened: num("issuesOpened"),
    releases: num("releases"),
    reposTouched: num("reposTouched"),
    commits: num("commits"),
    comments: num("comments"),
  };
}

function normalizeActivityItem(fileName: string, where: string, raw: unknown): ActivityItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const i = raw as Record<string, unknown>;
  if (!ACTIVITY_TYPES.includes(i.type as ActivityType)) {
    fail(fileName, `${where} has invalid type "${String(i.type)}"`);
  }
  if (!asString(i.title) || !asString(i.url) || !asString(i.repo)) {
    fail(fileName, `${where} is missing string "title", "url", or "repo"`);
  }
  return {
    type: i.type as ActivityType,
    title: i.title,
    url: i.url,
    repo: i.repo,
    author: asString(i.author) ? i.author : "",
    ...(i.community === true ? { community: true } : {}),
  };
}

function normalizeGroup(fileName: string, index: number, raw: unknown): WeeklyGroup {
  const where = `activity[${index}]`;
  if (typeof raw !== "object" || raw === null) fail(fileName, `${where} is not an object`);
  const g = raw as Record<string, unknown>;
  if (!asString(g.product)) fail(fileName, `${where} is missing string "product"`);
  const items = Array.isArray(g.items)
    ? g.items
        .map((it, i) => normalizeActivityItem(fileName, `${where}.items[${i}]`, it))
        .filter((it): it is ActivityItem => it !== null)
    : [];
  const commitCounts: Record<string, number> = {};
  if (typeof g.commitCounts === "object" && g.commitCounts !== null) {
    for (const [repo, count] of Object.entries(g.commitCounts as Record<string, unknown>)) {
      if (typeof count === "number" && Number.isFinite(count)) commitCounts[repo] = count;
    }
  }
  return { product: g.product, items, commitCounts };
}

function normalizeWeekly(fileName: string, raw: string): WeeklyUpdate {
  const { data, body } = parseFrontmatter(fileName, raw);
  for (const key of ["week", "weekStart", "weekEnd", "generatedAt"]) {
    if (!asString(data[key])) fail(fileName, `frontmatter is missing string "${key}"`);
  }
  const groups = Array.isArray(data.activity)
    ? data.activity.map((g, i) => normalizeGroup(fileName, i, g))
    : [];
  const week = data.week as string;
  return {
    week,
    slug: week.toLowerCase(),
    weekStart: data.weekStart as string,
    weekEnd: data.weekEnd as string,
    generatedAt: data.generatedAt as string,
    counters: normalizeCounters(fileName, data.counters),
    groups,
    body,
  };
}

let weeklyCache: WeeklyUpdate[] | null = null;

/** All weekly updates, most recent first. Missing directory → empty list. */
export function getWeeklyUpdates(): WeeklyUpdate[] {
  if (weeklyCache) return weeklyCache;
  let files: string[];
  try {
    files = readdirSync(WEEKLY_DIR).filter((f) => f.endsWith(".md"));
  } catch {
    files = [];
  }
  const weeks = new Set<string>();
  const updates = files.map((file) => {
    const raw = readFileSync(join(WEEKLY_DIR, file), "utf8");
    const update = normalizeWeekly(`weekly/${file}`, raw);
    if (weeks.has(update.slug)) fail(`weekly/${file}`, `duplicate week "${update.week}"`);
    weeks.add(update.slug);
    return update;
  });
  updates.sort((a, b) => (a.week < b.week ? 1 : a.week > b.week ? -1 : 0));
  weeklyCache = updates;
  return updates;
}

export function getWeeklyUpdateBySlug(slug: string): WeeklyUpdate | undefined {
  return getWeeklyUpdates().find((u) => u.slug === slug.toLowerCase());
}

export function getLatestWeeklyUpdate(): WeeklyUpdate | undefined {
  return getWeeklyUpdates()[0];
}
```

- [ ] **Step 2: Verify the file itself compiles**

```bash
npx tsc --noEmit 2>&1 | grep "lib/content.ts" ; echo "exit: $?"
```

Expected: no grep output (`exit: 1`).

- [ ] **Step 3: Commit**

```bash
git add lib/content.ts
git commit -m "feat(model): product/proposal loaders with cross-reference validation

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Seed `content/config.yaml`

**Files:**
- Modify: `content/config.yaml` (full replacement)

- [ ] **Step 1: Replace the entire file with:**

```yaml
# Site-wide configuration for the Cardano High Assurance tracker.
site:
  title: Cardano High Assurance
  tagline: A transparent, weekly-updated tracker for IO's Cardano High Assurance toolkit.
  description: >-
    Track delivery of Input Output's Cardano High Assurance products —
    automated formal verification (Blaster), property-based testing, static
    analysis, and the containerized developer environment: product status,
    milestones, and weekly progress.
  repoUrl: "https://github.com/input-output-hk/high-assurance-updates"
  # Canonical public base URL (includes the Pages subpath). The single knob to
  # change if we move to a custom domain (ADR-11). Used to build absolute links
  # in the LLM-readable feeds (/llms.txt, /llms-full.txt, /api/status.json).
  url: "https://input-output-hk.github.io/high-assurance-updates"

# GitHub logins whose work counts as the team's. Used for teamOnly filtering
# (ADR-5) and for flagging community contributions in owned repos (ADR-14).
roster:
  - sfeitosa
  - bogdan-manole
  - sjoerdvisscher
  - etiennejf
  - paulacu-iohk
  - EehMauro
  - KJES4
  - RSoulatIOHK
  - mpetruska

# Curated repositories the gatherer tracks (ADR-4). Each declares:
#   product:  which product its activity rolls up to, or null to fall into
#             the "Other" bucket (ADR-6).
#   teamOnly: true for shared/external repos — count only activity authored
#             by a roster member (ADR-5); false (default) for owned repos.
repos:
  - url: "https://github.com/input-output-hk/plu-stan"
    product: plu-stan
    teamOnly: false
  - url: "https://github.com/input-output-hk/Cardano-CWE-Research"
    product: plu-stan
    teamOnly: false
  - url: "https://github.com/input-output-hk/sc-testing-tools"
    product: sc-testing-tool
    teamOnly: false
  - url: "https://github.com/input-output-hk/sc-testing-tools-vs-extension"
    product: sc-testing-tool
    teamOnly: false
  - url: "https://github.com/input-output-hk/Lean-blaster"
    product: blaster
    teamOnly: false
  - url: "https://github.com/input-output-hk/Blaster-benchmarking"
    product: blaster
    teamOnly: false
  - url: "https://github.com/input-output-hk/PlutusCoreBlaster"
    product: blaster
    teamOnly: false
  - url: "https://github.com/input-output-hk/CardanoLedgerApiBlaster"
    product: blaster
    teamOnly: false
  # CBDE — the repo is expected to be renamed to "Hades"; GitHub redirects
  # renamed repos, so gathering keeps working. Update this URL when it lands.
  - url: "https://github.com/input-output-hk/hades"
    product: cbde
    teamOnly: false

# Curated jump-off points shown on the Links page.
links:
  - label: Lean-blaster
    url: "https://github.com/input-output-hk/Lean-blaster"
  - label: 2026/27 governance action (AdaStat)
    url: "https://adastat.net/governances/73e171a4c0730b4b59ecae271ab89f12a9d56360b02920e1f95107dbdc1d676205"
```

- [ ] **Step 2: Commit** (verified together with Task 7)

```bash
git add content/config.yaml
git commit -m "feat(content): High Assurance site config, roster, and repo map

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Seed `content/products.yaml`

**Files:**
- Delete: `content/deliverables.yaml`
- Create: `content/products.yaml`

- [ ] **Step 1: Remove the old file**

```bash
git rm content/deliverables.yaml
```

- [ ] **Step 2: Create `content/products.yaml` with:**

```yaml
# Products of the Cardano High Assurance team.
#
# This file is the MANUAL source of truth for each PRODUCT's status
# (see docs/ARCHITECTURE.md ADR-3). Auto-gathered GitHub activity is shown
# alongside these but never overrides the status set here.
#
# A product rolls up gathered activity (by `id`, see config.yaml), names the
# proposals that fund it (`proposals`, ids into proposals.yaml), and holds the
# milestones committed in those proposals.
#
# status:  not-started | in-progress | done | blocked
# quarter: Qn-YYYY | ongoing
# Update `statusUpdatedAt` (YYYY-MM-DD) whenever you change a status.
#
# Milestones carry the proposal roadmap:
#   dueDate:       committed deadline (YYYY-MM-DD; quarter deliverables use the
#                  quarter's last day), or omit if there is no date.
#   deliveredDate: when it was actually delivered (YYYY-MM-DD); omit until then.
#
# 2025/26-cycle milestones (PS.*, ST.*, BL.00) are recorded from the IOE 2025
# Core Development Proposal; their statuses and delivery dates are TO BE
# CONFIRMED by the team (spec §11) before this content is treated as final.

- id: plu-stan
  slug: plu-stan
  title: Static Analyzer for Plinth
  quarter: ongoing
  status: in-progress
  statusUpdatedAt: 2026-09-02
  proposals:
    - core-dev-2025
  summary: >-
    Plu-stan, a "one-click" static analysis tool for Plinth smart contracts:
    detects common errors, performance issues, and anti-patterns without
    requiring formal-methods expertise.
  description: >-
    Plu-stan automatically detects common errors, performance issues, and
    anti-patterns in Plinth contracts, improving code quality, security, and
    developer productivity without requiring user expertise. Its ruleset is
    grounded in the Cardano CWE research, which catalogues Cardano-specific
    vulnerability classes. The core is designed to be adaptable to other
    smart contract languages.
  milestones:
    # 2025/26 cycle — statuses and dates to be confirmed by the team.
    - id: PS.01
      title: Proof of Concept
      status: done
      description: Initial proof-of-concept static analyzer for Plinth.
    - id: PS.02
      title: Ruleset Documentation
      status: done
      description: Documented ruleset of detected error classes and anti-patterns.
    - id: PS.03
      title: Stable Release
      status: done
      description: Stable release of the analyzer.
  links: []

- id: sc-testing-tool
  slug: sc-testing-tool
  title: Property-Based Testing for Cardano Contracts
  quarter: ongoing
  status: in-progress
  statusUpdatedAt: 2026-09-02
  proposals:
    - core-dev-2025
  summary: >-
    A property-based testing framework for Cardano smart contracts: generates
    diverse inputs and action sequences to test specified contract properties,
    with a VS Code extension for the developer workflow.
  description: >-
    The sc-testing-tool automatically generates diverse inputs and actions to
    test specified contract properties — surfacing edge cases, validating
    assumptions, and checking vulnerabilities — and integrates into the Plinth
    workflow for rigorous, automated testing. A companion Visual Studio Code
    extension brings the workflow into the editor.
  milestones:
    # 2025/26 cycle — statuses and dates to be confirmed by the team.
    - id: ST.01
      title: CLI Tool
      status: done
      description: Command-line property-based testing tool for Plinth contracts.
    - id: ST.02
      title: VS Code Integration
      status: done
      description: Visual Studio Code extension integrating the PBT workflow.
    - id: ST.03
      title: Documentation
      status: done
      description: User documentation for the testing framework.
  links: []

- id: blaster
  slug: blaster
  title: Automated Formal Verification
  quarter: ongoing
  status: in-progress
  statusUpdatedAt: 2026-09-02
  proposals:
    - core-dev-2025
    - high-assurance-2026
  summary: >-
    Blaster, IO's open-source automated formal verification tool for Cardano
    smart contracts: SMT-backed proofs over UPLC, already used to prove
    correctness properties of production DApps including Djed and USDCx.
  description: >-
    Blaster mathematically proves correctness properties of Cardano smart
    contracts with minimal annotations. Built in Lean 4 with Z3 as backend
    solver, it operates on Untyped Plutus Core — the common compilation target
    of all Cardano contract languages — so the verification core serves the
    whole ecosystem. The 2026/27 cycle extends it from single-script to full
    DApp-level verification, connects four surface languages (Aiken, Pebble,
    Scalus, Futura), and ships a VS Code extension, a Common Vulnerability
    Library, an equivalence checker, and kernel-replayable proof
    reconstruction.
  milestones:
    # 2025/26 cycle — delivery date to be confirmed by the team.
    - id: BL.00
      title: Single-Script Verification (2025/26 cycle)
      status: done
      description: >-
        Automated formal verification of individual Cardano scripts; used to
        prove correctness properties of production DApps including Djed and
        USDCx.
    - id: BL.01
      title: Equivalence Checking Tool
      dueDate: "2026-12-31"
      status: in-progress
      description: >-
        Backend capability and CLI for formal proof that two UPLC programs are
        semantically equivalent — enabling post-audit optimizations and
        cross-compiler verification. Integrated into CI/CD pipelines, with
        tutorials covering correct and incorrect optimizations.
      team: IO
      thirdPartyAssurance: Intersect delivery assurance + third-party assurer
    - id: BL.02
      title: VS Code Extension V1
      dueDate: "2026-12-31"
      status: in-progress
      description: >-
        Extension in the official Visual Studio Marketplace: single-contract
        verification, tool parameterization, execution trace visualization,
        and Lean 4 proof output for power users.
      team: IO
      thirdPartyAssurance: Intersect delivery assurance + third-party assurer
    - id: BL.03
      title: Language Integrations — Aiken, Pebble, Scalus, Futura
      dueDate: "2027-03-31"
      status: not-started
      description: >-
        Blaster integrated as a verification backend into four smart contract
        languages, with counterexample replay in each developer's native
        environment. Delivered with Midgard Labs (Aiken), Harmonic Labs
        (Pebble), Lantr (Scalus), and SAIB (Futura).
      team: IO + Midgard Labs, Harmonic Labs, Lantr, SAIB
      thirdPartyAssurance: Intersect delivery assurance + third-party assurer
    - id: BL.04
      title: VS Code Extension V2
      dueDate: "2027-06-30"
      status: not-started
      description: >-
        Multi-contract interactions, multi-transaction trace visualization
        (EUTXO graph view), CBOR-level counterexample export for
        emulator/testnet replay, and an LLM-friendly counterexample format.
      team: IO
      thirdPartyAssurance: Intersect delivery assurance + third-party assurer
    - id: BL.05
      title: DApp Proof Framework
      dueDate: "2027-06-30"
      status: not-started
      description: >-
        Blaster extended from single-contract to multi-script DApp-level
        verification: an extended ledger state supporting multi-script
        execution, and the Universal Annotation Language extended to express
        protocol-wide invariants. Demonstrated on TWAG 1 examples.
      team: IO
      thirdPartyAssurance: Intersect delivery assurance + third-party assurer
    - id: BL.06
      title: Common Vulnerability Library
      dueDate: "2027-06-30"
      status: not-started
      description: >-
        Publicly accessible library of ready-made property templates for major
        DApp categories (DEXs, bridges, lending, NFT minting). Initial
        coverage: Double Satisfaction, Large Value Attack, Large Datum Attack.
        Open contribution process, produced with auditing partners.
      team: IO + No.Witness Labs, TxPipe
      thirdPartyAssurance: Intersect delivery assurance + third-party assurer
    - id: BL.07
      title: Proof Reconstruction Module
      dueDate: "2027-06-30"
      status: not-started
      description: >-
        Optimization and rewriting step proofs reconstructed as Lean 4 proof
        terms, replayable using only the Lean kernel — removing Blaster from
        the trusted codebase for this scope. Delivered with TxPipe.
      team: IO + TxPipe
      thirdPartyAssurance: Intersect delivery assurance + third-party assurer
  links: []

- id: cbde
  slug: cbde
  title: Container-Based Developer Environment
  quarter: ongoing
  status: in-progress
  statusUpdatedAt: 2026-09-02
  proposals:
    - high-assurance-2026
  summary: >-
    CBDE (Hades): a single-command, pre-configured containerized environment
    packaging the complete High Assurance toolkit at verified, compatible
    versions — compressing setup from days to one click.
  description: >-
    CBDE packages the complete Plinth toolchain — compilers, libraries,
    property-based testing, static analysis, formal verification, and
    profiling — into a single-command containerized setup, becoming the
    unified hub for the High Assurance toolkit. It targets the largest
    measured barrier to Cardano developer onboarding: multi-day environment
    configuration.
  milestones:
    - id: CB.01
      title: Solution Design & Tool Inventory
      dueDate: "2026-09-30"
      status: in-progress
      description: >-
        Architectural design for the containerized environment; inventory of
        all High Assurance tools and compilers with integration requirements,
        dependency constraints, and containerization approach.
      team: IO
      thirdPartyAssurance: Intersect delivery assurance + third-party assurer
    - id: CB.02
      title: Environment Setup & Tool Encapsulation (0.x pre-release)
      dueDate: "2026-12-31"
      status: not-started
      description: >-
        Container runtime configured with verified, compatible versions of all
        identified tools; all High Assurance tools operational inside the
        container. Pre-release (0.x) for an initial internal cohort.
      team: IO
      thirdPartyAssurance: Intersect delivery assurance + third-party assurer
    - id: CB.03
      title: Community Beta & V1.0 Preparation
      dueDate: "2027-03-31"
      status: not-started
      description: >-
        At least five external community members using CBDE for real-world
        development over 1–2 months; feedback captured in a prioritized
        backlog, critical items addressed for V1.0.
      team: IO
      thirdPartyAssurance: Intersect delivery assurance + third-party assurer
    - id: CB.04
      title: V1.0 Release & Documentation
      dueDate: "2027-06-30"
      status: not-started
      description: >-
        Version 1.0 released to the community with comprehensive setup and
        usage guides; all tools accessible and documented for use without
        specialist environment knowledge.
      team: IO
      thirdPartyAssurance: Intersect delivery assurance + third-party assurer
  links: []
```

- [ ] **Step 3: Commit** (verified together with Task 7)

```bash
git add content/products.yaml
git commit -m "feat(content): seed the four High Assurance products and milestones

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Seed `content/proposals.yaml`

**Files:**
- Create: `content/proposals.yaml`

- [ ] **Step 1: Create `content/proposals.yaml` with:**

```yaml
# Funding proposals behind the High Assurance products (ADR-13).
#
# Proposals are METADATA, not structure: the site is organized by product, and
# each product lists the proposal ids that fund it. Canonical proposal texts
# live at the external links; this file holds only what the site displays.
#
# status: active | completed

- id: core-dev-2025
  title: IOE 2025 Core Development Proposal — Plutus High Assurance
  status: completed
  windowStart: Q2-2025
  windowEnd: Q2-2026
  # USD reference budget: the sum of the three Plutus High Assurance
  # initiatives ($1,859,000 AFV + $2,366,000 PBT + $777,140 Static Analyzer).
  budgetUsd: 5002140
  summary: >-
    Input Output Engineering's 2025 core budget proposal. Its three Plutus
    High Assurance initiatives funded the first cycle of this team's tools:
    the Automatic Formal Verification tool (Blaster), the Property-Based
    Testing tool, and the Static Analyzer (Plu-stan).
  products:
    - blaster
    - sc-testing-tool
    - plu-stan
  collaborators:
    - Anastasia Labs
    - MLabs
    - Obsidian Systems
    - Modus Create
    - Sundae Labs
  links:
    # Gateway link derived from the proposal PDF's IPFS CID — verify it
    # resolves before launch (spec §11).
    - label: Proposal document (v1.1, PDF)
      url: "https://ipfs.io/ipfs/bafybeicabpq4cu6eev53m3ywiczbidyn2ivos4tglq7vy3gkbklp3dk5zi"
  notes: >-
    The 2025 Core Development Proposal also funded many initiatives outside
    this tracker's scope (Leios, Hydra, Mithril, and others); only its Plutus
    High Assurance initiatives are tracked here.

- id: high-assurance-2026
  title: Cardano High Assurance 2026/27
  status: active
  windowStart: Q3-2026
  windowEnd: Q2-2027
  treasuryAskAda: 13078578
  budgetUsd: 3138859
  summary: >-
    On-chain governance action funding two workstreams under the Cardano High
    Assurance umbrella: extending Blaster from single-script to full
    DApp-level verification with four new language integrations
    (₳10,112,037), and delivering the Container-Based Developer Environment
    that packages the complete toolkit into a single-command setup
    (₳2,966,541). Administered by Intersect via milestone-based disbursement;
    unspent funds return to the Treasury.
  products:
    - blaster
    - cbde
  collaborators:
    - Lantr
    - Harmonic Labs
    - SAIB
    - Midgard Labs
    - TxPipe
    - No.Witness Labs
  links:
    - label: Governance action (AdaStat)
      url: "https://adastat.net/governances/73e171a4c0730b4b59ecae271ab89f12a9d56360b02920e1f95107dbdc1d676205"
    - label: Proposal document (IPFS)
      url: "https://ipnso-com.ipns.dweb.link/?cid=QmQBhjELHaMKhYZjwuskHS9NRyvUdiGv69aK8C1H787c5A"
  notes: >-
    USD figure is a reference at an ADA/USD rate of 0.24; the ask is
    denominated in ada.
```

- [ ] **Step 2: Verify the whole content model loads and cross-validates**

```bash
npx tsx -e "
import { getConfig, getProducts, getProposals, getProposalsForProduct } from './lib/content';
const products = getProducts();
const proposals = getProposals();
const config = getConfig();
console.log('products:', products.map((p) => p.id).join(', '));
console.log('proposals:', proposals.map((p) => p.id).join(', '));
console.log('repos:', config.repos.length, 'roster:', config.roster.length);
console.log('blaster funded by:', getProposalsForProduct('blaster').map((p) => p.id).join(', '));
"
```

Expected output:

```
products: plu-stan, sc-testing-tool, blaster, cbde
proposals: core-dev-2025, high-assurance-2026
repos: 9 roster: 9
blaster funded by: core-dev-2025, high-assurance-2026
```

- [ ] **Step 3: Negative test — a broken reference must fail the load**

Temporarily change `product: cbde` to `product: cbdX` on the hades repo in `content/config.yaml`, rerun the probe, and confirm it throws `Invalid content in content/config.yaml: repo input-output-hk/hades references unknown product "cbdX"`. **Revert the change** and rerun the probe to confirm it's green again.

- [ ] **Step 4: Commit**

```bash
git add content/proposals.yaml
git commit -m "feat(content): seed the 2025 and 2026/27 funding proposals

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Timeline component → products

**Files:**
- Rename: `components/deliverable-timeline.tsx` → `components/product-timeline.tsx`
- Modify: the renamed file

- [ ] **Step 1: Rename**

```bash
git mv components/deliverable-timeline.tsx components/product-timeline.tsx
```

- [ ] **Step 2: Retarget the window to the 2026/27 cycle.** Replace the window constants block (top of file):

```ts
// The program window the whole timeline is scaled to: Jun 1 2026 → Jan 31 2027.
// Starts in June to cover the pre-funding backfill weeks (the last milestone,
// DX.08, is due 15 Jan 2027).
const WIN_START = Date.UTC(2026, 5, 1);
const WIN_END = Date.UTC(2027, 0, 31);
const SPAN = WIN_END - WIN_START;
const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
```

with:

```ts
// The program window the whole timeline is scaled to: Jul 1 2026 → Jun 30 2027
// — the 2026/27 proposal window (Q3 2026 → Q2 2027). Undated milestones (the
// 2025/26 cycle's) simply render no marker.
const WIN_START = Date.UTC(2026, 6, 1);
const WIN_END = Date.UTC(2027, 5, 30);
const SPAN = WIN_END - WIN_START;
const MONTHS = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
```

- [ ] **Step 3: Fix the month-axis math.** In `monthMarks()`, replace both `Date.UTC(2026, 5 + i, 1)` / `Date.UTC(2026, 5 + i + 1, 1)` with `Date.UTC(2026, 6 + i, 1)` / `Date.UTC(2026, 6 + i + 1, 1)` (Date.UTC normalizes month overflow into 2027 — the existing comment already says so; keep it).

- [ ] **Step 4: Rename types and props throughout the file.**
  - Import: `import type { Product, ProductUpdate } from "@/lib/types";`
  - `UpdateMarker({ u }: { u: DeliverableUpdate })` → `{ u: ProductUpdate }`
  - `function Track({ d, ticks, today }: { d: Deliverable; … })` → `d: Product`
  - `export function DeliverableTimeline({ deliverables }: { deliverables: Deliverable[] })` → `export function ProductTimeline({ products }: { products: Product[] })`, and inside it `{deliverables.map((d, i) => …)}` → `{products.map((d, i) => …)}`
  - The row link `href={`/deliverables/${d.slug}/`}` → `href={`/products/${d.slug}/`}`
  - Update the two prose comments that say "deliverable"/"Jun 2026→Jan 2027" to "product"/"Jul 2026→Jun 2027".

- [ ] **Step 5: Verify the file compiles**

```bash
npx tsc --noEmit 2>&1 | grep "product-timeline" ; echo "exit: $?"
```

Expected: no grep output (`exit: 1`). (`app/page.tsx` still fails — fixed in Task 10.)

- [ ] **Step 6: Commit**

```bash
git add -A components/
git commit -m "feat(ui): product timeline spanning the 2026/27 window

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Weekly components → products + community callout

**Files:**
- Modify: `components/weekly-update.tsx`

- [ ] **Step 1: Update the imports** (top of file). Replace:

```ts
import type { ActivityItem, ActivityType, Deliverable, WeeklyCounters, WeeklyGroup } from "@/lib/types";
import { REACTIVE_GROUP } from "@/lib/types";
```

with:

```ts
import type { ActivityItem, ActivityType, Product, WeeklyCounters, WeeklyGroup } from "@/lib/types";
import { OTHER_GROUP } from "@/lib/types";
```

(`CounterStrip`, `ACTIVITY_META`, and `ActivityRow` are unchanged.)

- [ ] **Step 2: Replace `ActivityItemList` with the community-splitting version:**

```tsx
/**
 * The list of activity items + per-repo commit summary for one group/week.
 * Roster-authored items list first; non-roster items are set apart under a
 * "Community contributions" callout (ADR-14).
 */
export function ActivityItemList({
  items,
  commitCounts,
}: {
  items: ActivityItem[];
  commitCounts: Record<string, number>;
}) {
  const team = items.filter((i) => !i.community);
  const community = items.filter((i) => i.community);
  const commits = Object.entries(commitCounts);
  return (
    <>
      {team.length > 0 && (
        <ul className="divide-y divide-border">
          {team.map((item) => (
            <ActivityRow key={item.url} item={item} />
          ))}
        </ul>
      )}
      {community.length > 0 && (
        <div className="mt-4 rounded-md border border-border bg-surface-2 px-3 pb-1 pt-3">
          <p className="font-mono text-[0.65rem] uppercase tracking-wider text-primary">
            Community contributions
          </p>
          <ul className="divide-y divide-border">
            {community.map((item) => (
              <ActivityRow key={item.url} item={item} />
            ))}
          </ul>
        </div>
      )}
      {commits.length > 0 && (
        <p className="mt-3 flex items-center gap-1.5 font-mono text-xs text-muted">
          <GitCommitIcon className="shrink-0 text-[0.95rem]" style={{ color: "var(--gh-neutral)" }} />
          {commits.map(([repo, n]) => `${n} commit${n === 1 ? "" : "s"} · ${repo}`).join("  ·  ")}
        </p>
      )}
    </>
  );
}
```

- [ ] **Step 3: Replace `ActivityGroups` with the product version:**

```tsx
/**
 * Gathered activity grouped by product (ADR-6). Each group shows the product's
 * manual status alongside the evidence; the Other bucket has no product.
 * Commit volume is summarized per repo (ADR-7).
 */
export function ActivityGroups({
  groups,
  products,
}: {
  groups: WeeklyGroup[];
  products: Product[];
}) {
  const byId = new Map(products.map((p) => [p.id, p]));

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => {
        const other = group.product === OTHER_GROUP;
        const product = other ? undefined : byId.get(group.product);
        return (
          <section key={group.product} className="rounded-lg border border-border bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <h3 className="font-display text-base font-semibold text-foreground">
                {other ? (
                  <span className="font-mono text-xs uppercase tracking-wider text-muted">Other</span>
                ) : product ? (
                  <Link href={`/products/${product.slug}/`} className="hover:text-primary">
                    <span className="font-mono text-xs tracking-wider text-primary">{product.id}</span>{" "}
                    {product.title}
                  </Link>
                ) : (
                  <span className="font-mono text-xs tracking-wider text-primary">{group.product}</span>
                )}
              </h3>
              {product && <StatusBadge status={product.status} />}
            </div>

            <div className="pt-1">
              <ActivityItemList items={group.items} commitCounts={group.commitCounts} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Update `components/status-badge.tsx` imports** — replace both occurrences of `DeliverableStatus` with `ProductStatus`:

```ts
import type { ProductStatus } from "@/lib/types";
```

(and the two type annotations inside the file).

- [ ] **Step 5: Verify both files compile**

```bash
npx tsc --noEmit 2>&1 | grep -E "weekly-update|status-badge" ; echo "exit: $?"
```

Expected: no grep output (`exit: 1`).

- [ ] **Step 6: Commit**

```bash
git add components/weekly-update.tsx components/status-badge.tsx
git commit -m "feat(ui): group activity by product; call out community contributions

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: Home page

**Files:**
- Modify: `app/page.tsx` (full replacement)

- [ ] **Step 1: Replace the entire file with:**

```tsx
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
                    Delivery ledger
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
```

- [ ] **Step 2: Verify** `npx tsc --noEmit 2>&1 | grep "app/page.tsx" ; echo "exit: $?"` → no grep output.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat(home): product dashboard with proposal-aware fact strip

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: Product detail page

**Files:**
- Rename: `app/deliverables/` → `app/products/`
- Modify: `app/products/[slug]/page.tsx` (full replacement)

- [ ] **Step 1: Rename the route directory**

```bash
git mv app/deliverables app/products
```

- [ ] **Step 2: Replace `app/products/[slug]/page.tsx` entirely with:**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityItemList } from "@/components/weekly-update";
import { StatusBadge } from "@/components/status-badge";
import {
  getProductBySlug,
  getProducts,
  getProposalsForProduct,
  getReposForProduct,
  getWeeklyUpdates,
} from "@/lib/content";
import { formatDate, formatDateRange, weekParts } from "@/lib/format";
import type { Product, WeeklyGroup, WeeklyUpdate } from "@/lib/types";

// Static export: one page per product, 404 anything else.
export const dynamicParams = false;

export function generateStaticParams() {
  return getProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getProductBySlug(slug);
  return p ? { title: p.title, description: p.summary } : { title: "Product" };
}

function quarterLabel(quarter: Product["quarter"]): string {
  return quarter === "ongoing" ? "Ongoing" : quarter.replace("-", " ");
}

/** All weekly updates that reported activity for this product, newest first. */
function activityByWeek(p: Product): { update: WeeklyUpdate; group: WeeklyGroup }[] {
  return getWeeklyUpdates()
    .map((update) => ({ update, group: update.groups.find((g) => g.product === p.id) }))
    .filter(
      (x): x is { update: WeeklyUpdate; group: WeeklyGroup } =>
        !!x.group && (x.group.items.length > 0 || Object.keys(x.group.commitCounts).length > 0),
    );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getProductBySlug(slug);
  if (!p) notFound();

  const weeks = activityByWeek(p);
  // Tracked repos are derived from config.yaml (the gatherer's source), so the
  // chips shown here always match the repos whose activity rolls up below.
  const repos = getReposForProduct(p.id);
  const funding = getProposalsForProduct(p.id);

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
          <span className="font-mono text-sm tracking-wider text-primary">{p.id}</span>
          <span className="font-mono text-xs uppercase tracking-wider text-muted">
            {quarterLabel(p.quarter)}
          </span>
          <StatusBadge status={p.status} />
        </div>

        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground">
          {p.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/80">{p.description}</p>

        {funding.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
              Funded by
            </span>
            {funding.map((prop) => (
              <Link
                key={prop.id}
                href="/proposals"
                className="rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-xs text-muted transition-colors hover:border-primary hover:text-foreground"
              >
                {prop.title}
              </Link>
            ))}
          </div>
        )}

        {p.milestones.length > 0 && (
          <ul className="mt-6 flex flex-col gap-3">
            {p.milestones.map((m) => (
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

        {p.links.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
            {p.links.map((link) => (
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
          Gathered GitHub activity for this product, week by week — the same evidence that
          appears in the weekly updates. Community contributions are called out.
        </p>

        {weeks.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-border bg-surface p-6 text-sm text-muted">
            No gathered activity is linked to this product yet. It will appear here as weekly
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
```

- [ ] **Step 3: Verify** `npx tsc --noEmit 2>&1 | grep "app/products" ; echo "exit: $?"` → no grep output.

- [ ] **Step 4: Commit**

```bash
git add -A app/
git commit -m "feat(products): product detail page with funded-by proposals

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 12: New Proposals page

**Files:**
- Create: `app/proposals/page.tsx`
- Modify: `components/site-header.tsx`

- [ ] **Step 1: Create `app/proposals/page.tsx` with:**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
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
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted">
      <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  );
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
              {p.windowStart} – {p.windowEnd}
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
```

- [ ] **Step 2: Add Proposals to the nav.** In `components/site-header.tsx`, replace the `NAV` constant with:

```ts
const NAV = [
  { href: "/", label: "Overview" },
  { href: "/updates", label: "Updates" },
  { href: "/proposals", label: "Proposals" },
  { href: "/links", label: "Links" },
];
```

- [ ] **Step 3: Verify** `npx tsc --noEmit 2>&1 | grep -E "app/proposals|site-header" ; echo "exit: $?"` → no grep output.

- [ ] **Step 4: Commit**

```bash
git add app/proposals components/site-header.tsx
git commit -m "feat(proposals): proposals index page and nav entry

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 13: Links page

**Files:**
- Modify: `app/links/page.tsx`

- [ ] **Step 1: Update imports.** Replace:

```ts
import { getConfig, getDeliverables, getTrackedRepos } from "@/lib/content";
import { REACTIVE_GROUP } from "@/lib/types";
```

with:

```ts
import { getConfig, getProducts, getTrackedRepos } from "@/lib/content";
```

- [ ] **Step 2: Update the metadata description.** Replace the `description` string with:

```ts
    "Curated jump-off points for Cardano High Assurance: tracked repositories and key ecosystem resources.",
```

- [ ] **Step 3: Update the page body.** In `LinksPage()`, replace:

```ts
  const deliverables = getDeliverables();
  const titleById = new Map(deliverables.map((d) => [d.id, d.title]));
```

with:

```ts
  const products = getProducts();
  const titleById = new Map(products.map((p) => [p.id, p.title]));
```

and inside the "Tracked repositories" section, replace the `note` computation:

```ts
            const note =
              r.deliverable && r.deliverable !== REACTIVE_GROUP
                ? `${r.deliverable} · ${titleById.get(r.deliverable) ?? r.deliverable}`
                : "Reactive / other";
```

with:

```ts
            const note = r.product
              ? `${r.product} · ${titleById.get(r.product) ?? r.product}`
              : "Other";
```

Also update the header paragraph text `…the ecosystem resources the initiative builds on.` → `…the ecosystem resources the team builds on.`

- [ ] **Step 4: Verify** `npx tsc --noEmit 2>&1 | grep "app/links" ; echo "exit: $?"` → no grep output.

- [ ] **Step 5: Commit**

```bash
git add app/links/page.tsx
git commit -m "feat(links): repo notes keyed by product

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 14: Updates pages copy

**Files:**
- Modify: `app/updates/page.tsx`

> **Amended after Task 2:** `app/updates/[week]/page.tsx` was deleted in Task 2 — Next 16.2.10's
> static export throws error E87 on a dynamic route whose `generateStaticParams()` returns zero
> entries, so the route cannot exist while `content/weekly/` is empty. It is recreated (already in
> product vocabulary) in **Task 21 Step 2**, once the backfill provides weekly content.

- [ ] **Step 1: `app/updates/page.tsx`** — replace the metadata description with:

```ts
    "Weekly progress on Cardano High Assurance: gathered GitHub activity grouped by product, plus a short narrative.",
```

and in the header paragraph, replace `grouped by\n          deliverable` wording so the sentence reads `…gathered automatically from GitHub and grouped by product, with a short narrative from the team.`

- [ ] **Step 3: Verify** `npx tsc --noEmit 2>&1 | grep "app/updates" ; echo "exit: $?"` → no grep output.

- [ ] **Step 4: Commit**

```bash
git add app/updates
git commit -m "feat(updates): weekly pages speak products

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 15: Site identity (header brand, footer, OG image)

**Files:**
- Modify: `components/site-header.tsx`, `components/site-footer.tsx`, `lib/og-image.tsx`

- [ ] **Step 1: Header brand.** In `components/site-header.tsx`, replace the brand text `DevX Initiative` with `Cardano High Assurance`.

- [ ] **Step 2: Footer.** In `components/site-footer.tsx`, replace:

```tsx
                <p>
                    {config.site.title} · led by {config.proposal.lead} · Input Output
                </p>
```

with:

```tsx
                <p>
                    {config.site.title} · Input Output
                </p>
```

- [ ] **Step 3: OG card eyebrow.** In `lib/og-image.tsx`, replace the eyebrow text `Developer Experience Initiative` with `Input Output · High Assurance`.

- [ ] **Step 4: Verify** `npx tsc --noEmit 2>&1 | grep -E "site-footer|site-header|og-image" ; echo "exit: $?"` → no grep output.

- [ ] **Step 5: Commit**

```bash
git add components/site-header.tsx components/site-footer.tsx lib/og-image.tsx
git commit -m "feat(identity): Cardano High Assurance branding

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 16: LLM feeds & status.json

**Files:**
- Modify: `lib/llm-feed.ts` (full replacement; the three route handlers in `app/llms.txt/`, `app/llms-full.txt/`, `app/api/status.json/` are thin wrappers and stay untouched)

- [ ] **Step 1: Replace the entire file with:**

```ts
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
```

- [ ] **Step 2: Verify the feeds build against the seed content**

```bash
npx tsx -e "
import { buildLlmsTxt, buildStatusJson } from './lib/llm-feed';
const txt = buildLlmsTxt();
if (!txt.includes('## Proposals') || !txt.includes('## Products')) throw new Error('missing sections');
const json = buildStatusJson();
console.log('proposals:', json.proposals.length, 'products:', json.products.length);
"
```

Expected: `proposals: 2 products: 4`.

- [ ] **Step 3: Commit**

```bash
git add lib/llm-feed.ts
git commit -m "feat(feeds): llms.txt, llms-full.txt, status.json speak products and proposals

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 17: Full build + lint checkpoint (GREEN GATE)

- [ ] **Step 1: Type-check, build, lint**

```bash
npx tsc --noEmit && npm run build && npm run lint
```

Expected: all three pass. Fix any residual renamed-symbol stragglers (the likely culprits are imports of `Deliverable*`/`REACTIVE_GROUP` in files this plan already touched — re-check the task steps rather than improvising new names).

- [ ] **Step 2: No lingering "deliverable" vocabulary in code**

```bash
grep -rin "deliverable\|reactive" app components lib --include="*.ts" --include="*.tsx" ; echo "exit: $?"
```

Expected: no output (`exit: 1`). (`scripts/gather.ts` still says deliverable — that's Task 18.)

- [ ] **Step 3: Commit anything the checkpoint fixed**

```bash
git add -A
git commit -m "chore: green checkpoint after product/proposal refactor

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>" || echo "nothing to fix — clean checkpoint"
```

---

### Task 18: Gatherer — product grouping + community flag

**Files:**
- Modify: `scripts/gather.ts`

- [ ] **Step 1: Header comment.** In the file's doc comment, change `groups activity by deliverable` to `groups activity by product`, and in the `--repo` option help text change `Uses deliverable=null` to `Uses product=null`.

- [ ] **Step 2: Import.** Replace:

```ts
import {
  REACTIVE_GROUP,
  type ActivityItem,
  type TrackedRepo,
  type WeeklyCounters,
} from "../lib/types";
```

with:

```ts
import {
  OTHER_GROUP,
  type ActivityItem,
  type TrackedRepo,
  type WeeklyCounters,
} from "../lib/types";
```

- [ ] **Step 3: User agent.** In `gh()`, change `"User-Agent": "devx-updates-gatherer"` to `"User-Agent": "high-assurance-updates-gatherer"`.

- [ ] **Step 4: Community flag.** In `gatherRepo()`, replace the `push` helper:

```ts
  const push = (type: ActivityItem["type"], raw: { title: string; html_url: string; login: string }) => {
    if (isBot(raw.login)) return;
    items.push({ type, title: raw.title, url: raw.html_url, repo: slug, author: raw.login });
  };
```

with:

```ts
  const push = (type: ActivityItem["type"], raw: { title: string; html_url: string; login: string }) => {
    if (isBot(raw.login)) return;
    const item: ActivityItem = { type, title: raw.title, url: raw.html_url, repo: slug, author: raw.login };
    // Non-roster author in a tracked repo → a community contribution (ADR-14).
    if (raw.login && !roster.includes(raw.login)) item.community = true;
    items.push(item);
  };
```

- [ ] **Step 5: Group by product.** In `gatherWeek()`:
  - comment `// Group activity by deliverable id (or the Reactive bucket)…` → `// Group activity by product id (or the Other bucket)…`
  - `const groupKey = repo.deliverable ?? REACTIVE_GROUP;` → `const groupKey = repo.product ?? OTHER_GROUP;`
  - the frontmatter mapping `.map(([deliverable, g]) => ({ deliverable, items: g.items, commitCounts: g.commitCounts }));` → `.map(([product, g]) => ({ product, items: g.items, commitCounts: g.commitCounts }));`

- [ ] **Step 6: Weekly template comment.** Replace the generated-file trailer:

```ts
    `## Highlights\n\n` +
    `<!-- Write the week's narrative here before merging. What shipped, why it\n` +
    `matters, and what's next. The activity above is auto-gathered evidence. -->\n`;
```

with:

```ts
    `## Highlights\n\n` +
    `<!-- Write the week's narrative here before merging. What shipped, why it\n` +
    `matters, and what's next. The activity above is auto-gathered evidence;\n` +
    `items flagged community:true are outside contributions — consider a shout-out. -->\n`;
```

- [ ] **Step 7: `--repo` override.** In `main()`, change `deliverable: null` to `product: null` in the manual-repo constructor.

- [ ] **Step 8: Verify with a real dry run** (needs `gh` auth; all repos are public):

```bash
GITHUB_TOKEN=$(gh auth token) npx tsx scripts/gather.ts --dry-run --week 2026-W35 | tee /tmp/gather-w35.md
grep -c "product:" /tmp/gather-w35.md
```

Expected: the output is a well-formed weekly file whose `activity:` groups use `product:` keys (grep count ≥ 1, assuming any tracked repo had activity that week; if the week was fully quiet, rerun with `--week 2026-W34`). Also check the community flag end-to-end with a repo that has known non-roster authors:

```bash
GITHUB_TOKEN=$(gh auth token) npx tsx scripts/gather.ts --dry-run --week 2026-W35 --repo cardano-foundation/developer-portal | grep -m1 "community: true"
```

Expected: at least one `community: true` line (that repo's activity is authored by non-roster users; if that specific week is quiet, try `--week 2026-W34`).

- [ ] **Step 9: Commit**

```bash
git add scripts/gather.ts
git commit -m "feat(gather): group by product and flag community contributions

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 19: CI workflows + repo metadata

**Files:**
- Modify: `.github/workflows/deploy.yml`, `.github/workflows/gather-weekly.yml`, `package.json`, `next.config.ts`

- [ ] **Step 1: `deploy.yml`** — replace:

```yaml
        env:
          # Project site is served under /devx-updates (ADR-11).
          NEXT_PUBLIC_BASE_PATH: /devx-updates
```

with:

```yaml
        env:
          # Project site is served under /high-assurance-updates (ADR-11).
          NEXT_PUBLIC_BASE_PATH: /high-assurance-updates
```

- [ ] **Step 2: `gather-weekly.yml`** — in the `Open draft PR` step, replace the body line `Auto-gathered weekly activity, grouped by deliverable.` with `Auto-gathered weekly activity, grouped by product. Community contributions are flagged.`

- [ ] **Step 3: `package.json`** — change `"name": "devx-updates"` to `"name": "high-assurance-updates"`. *(Amended after Task 2:)* also remove the now-unused map-page dependencies — `"d3-force"` and `"react-force-graph-2d"` from `dependencies`, `"@types/d3-force"` from `devDependencies` — then run `npm install` so `package-lock.json` is refreshed.

- [ ] **Step 4: `next.config.ts`** — update the comment `// GitHub Pages serves a project site under a subpath (e.g. /devx-updates).` to `// GitHub Pages serves a project site under a subpath (e.g. /high-assurance-updates).`

- [ ] **Step 5: Verify** `npm run build` still passes (env var is CI-side; the removed deps had no remaining importers after Task 2).

- [ ] **Step 6: Commit**

```bash
git add .github package.json package-lock.json next.config.ts
git commit -m "chore(ci): retarget workflows and metadata to high-assurance-updates

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 20: Docs rewrite

**Files:**
- Modify: `README.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `AGENTS.md` (full replacements except AGENTS.md)

- [ ] **Step 1: Replace `README.md` with:**

```markdown
# Cardano High Assurance — delivery tracker

A public, static website tracking delivery of Input Output's **Cardano High
Assurance** products: Plu-stan (static analysis), sc-testing-tool
(property-based testing), Blaster (automated formal verification), and CBDE
(the containerized developer environment).

- **Manual product status** lives in `content/products.yaml` — the honest
  headline the team stands behind.
- **Funding proposals** live in `content/proposals.yaml` and render at
  `/proposals`; the canonical texts live on-chain / on IPFS.
- **Weekly evidence** is gathered automatically from GitHub every Monday by
  `scripts/gather.ts` (CI opens a draft PR; a human writes the Highlights and
  merges — nothing publishes without a merge). Contributions from outside the
  team roster are flagged as community contributions.

Forked from [`devx-updates`](https://github.com/input-output-hk/devx-updates).
See `docs/PRD.md` (what & why) and `docs/ARCHITECTURE.md` (the ADRs).

## Working on it

```bash
npm ci
npm run dev        # local dev at http://localhost:3000
npm run build      # static export to ./out
GITHUB_TOKEN=$(gh auth token) npx tsx scripts/gather.ts --dry-run   # preview a weekly
```
```

- [ ] **Step 2: Replace `docs/PRD.md` with:**

```markdown
# Product Requirements — Cardano High Assurance Tracker

## 1. Overview

A public, static website that lets the Cardano community track delivery of
Input Output's **Cardano High Assurance** products. It combines **manually
authored product status** (the honest headline the team stands behind) with an
**automatically gathered activity feed** (living proof-of-work pulled from
GitHub), published as reviewed **weekly updates**.

The site is organized by **product**; the **funding proposals** behind the
products are first-class metadata, not structure.

| | |
|---|---|
| **Products** | Plu-stan (static analysis) · sc-testing-tool (property-based testing) · Blaster (automated formal verification) · CBDE / Hades (containerized dev environment) |
| **Proposals** | IOE 2025 Core Development Proposal (Plutus High Assurance initiatives) · Cardano High Assurance 2026/27 (₳13,078,578, on-chain) |
| **Audience** | Cardano community, DReps, builders, oversight/assurance bodies (Intersect + third-party assurer) |

## 2. Goals

- **G1 — Transparency.** Anyone can see current product status, milestones,
  and exactly what work happened, week by week.
- **G2 — Credibility.** Every status claim is backed by live, verifiable
  GitHub evidence (linked PRs/issues/releases).
- **G3 — Low upkeep.** CI gathers the activity; the weekly human effort is a
  short narrative.
- **G4 — LLM/machine readability.** llms.txt, llms-full.txt, status.json.
- **G5 — Credit where due.** Contributions from outside the team roster are
  flagged and celebrated as community contributions.

## 3. Non-Goals

- No dynamic backend (fully static, GitHub Pages).
- No fabricated metrics — only what can be derived from committed content.
- No private data — only public repositories.
- No automatic publishing without a human merge.
- No on-page rendering of full proposal texts — AdaStat/IPFS are canonical.

## 4. Functional requirements

- **FR-1 Home** — product status grid + timeline, proof-of-work counters,
  latest weekly update.
- **FR-2 Products** — one page per product: status, description, milestones,
  funded-by proposals, tracked repos, weekly activity rollup.
- **FR-3 Proposals** — index of funding proposals: window, ask, status,
  funded products, canonical links.
- **FR-4 Weekly updates** — archive + permalink per week; activity grouped by
  product; community contributions called out; manual Highlights narrative.
- **FR-5 Links** — tracked repos + curated ecosystem resources.
- **FR-6 Manual status is authoritative** — gathered activity is shown
  alongside but never overrides `products.yaml`.
- **FR-7 Attribution** — a GitHub-username roster defines the team; in
  team-owned repos all activity counts and non-roster authors are flagged
  `community`; in `teamOnly` repos only roster activity counts.
- **FR-8 Weekly workflow** — Monday 08:00 UTC gather → draft PR → human edits
  Highlights → merge publishes.

## 5. Open items

- Delivery dates / final status for the 2025/26-cycle milestones of Plu-stan
  and sc-testing-tool (team to confirm; marked in `products.yaml`).
- Final curated links list.
- The `hades` → `Hades` repo rename (update `config.yaml` when it lands).
```

- [ ] **Step 3: Replace `docs/ARCHITECTURE.md` with:**

```markdown
# Architecture — Cardano High Assurance Tracker

Architecture Decision Records. Forked from `devx-updates`; ADR numbering is
kept compatible where the decision carried over unchanged.

- **ADR-1 — Fully static export.** `output: 'export'` → `./out`, hosted on
  GitHub Pages. No server, no database, no request-time APIs. Everything is a
  build-time snapshot of committed content.
- **ADR-2 — Next.js App Router + Tailwind.** Standard, well-documented stack;
  the bundled Next 16 docs in `node_modules/next/dist/docs/` are the reference.
- **ADR-3 — Content as YAML/Markdown; manual status is the source of truth.**
  `content/products.yaml` (product status + milestones),
  `content/proposals.yaml` (funding metadata), `content/config.yaml` (site,
  roster, repo map), `content/weekly/*.md` (gathered evidence + narrative).
  Loaders in `lib/content.ts` fail the build on malformed content, including
  broken product↔proposal↔repo references.
- **ADR-4 — Curated repo list.** The gatherer only reads repos listed in
  `config.yaml` — no org-wide crawling.
- **ADR-5 — Roster attribution.** `roster` lists team GitHub logins. Repos
  marked `teamOnly: true` count only roster-authored activity (for
  shared/external repos). Team-owned repos count everything.
- **ADR-6 — Repo→product mapping.** Each tracked repo declares the `product`
  its activity rolls up to; unmapped activity falls into the **"Other"**
  bucket (`OTHER_GROUP`).
- **ADR-7 — Signal vs. noise.** Merged PRs, opened PRs, opened/closed issues,
  and releases are itemized; commits and conversation comments are summarized
  as per-repo counts. Bots and merge commits are excluded.
- **ADR-8 — CI drafts, human publishes.** A scheduled action (Mon 08:00 UTC)
  gathers the prior Mon–Sun week and opens a draft PR; a human writes the
  Highlights and merges. Nothing publishes without a merge.
- **ADR-9 — Deploy on merge.** Push to `main` builds the static export and
  deploys to GitHub Pages.
- **ADR-10 — No secrets.** The built-in `GITHUB_TOKEN` suffices; all tracked
  repos are public.
- **ADR-11 — basePath knob.** The site lives under
  `/high-assurance-updates` on Pages; `NEXT_PUBLIC_BASE_PATH` is set by the
  deploy workflow, and `site.url` in `config.yaml` is the single knob for a
  future custom domain.
- **ADR-12 — LLM feeds.** `/llms.txt`, `/llms-full.txt`, `/api/status.json`
  are emitted by static GET route handlers from the same loaders the pages
  use, so they can never drift from what's rendered.
- **ADR-13 — Products as spine, proposals as metadata.** *(New in this fork.)*
  The team's work is continuous across funding cycles, and one proposal funds
  several products (and vice versa). So the dashboard, status files, weekly
  grouping, and detail pages are all keyed by product; proposals are a
  YAML-backed index page (`/proposals`) whose canonical texts live at external
  links (AdaStat, IPFS). Cross-references are validated at build time.
- **ADR-14 — Community-contribution flag.** *(New in this fork.)* In tracked
  repos, itemized activity authored by a non-roster, non-bot user is tagged
  `community: true` by the gatherer. The UI sets these apart under a
  "Community contributions" callout, and the weekly Highlights template
  prompts the author to consider a shout-out — mentioning worthy outside
  contributions is a stated product goal, not an afterthought.
```

- [ ] **Step 4: Update `AGENTS.md`** — replace the line:

```markdown
  the gatherer (roster + `teamOnly` + repo→deliverable map), CI pipelines,
```

with:

```markdown
  the gatherer (roster + `teamOnly` + repo→product map), CI pipelines,
```

- [ ] **Step 5: Commit**

```bash
git add README.md docs/PRD.md docs/ARCHITECTURE.md AGENTS.md
git commit -m "docs: rewrite PRD, architecture ADRs, and README for High Assurance

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 21: Backfill weekly history (Jul–Aug 2026)

Populates the tracker with the 2026/27 window's history so it doesn't launch empty. Runtime: expect 10–20 minutes (Search API rate limits; the gatherer waits and retries on its own).

- [ ] **Step 1: Run the backfill**

```bash
GITHUB_TOKEN=$(gh auth token) npx tsx scripts/gather.ts --from 2026-07-01 --to 2026-08-30
ls content/weekly/
```

(The range ends Sunday 2026-08-30 — the end of W35, the last *complete* week; including Aug 31 would gather the still-in-progress W36, which next Monday's cron covers properly.)

Expected: one `2026-Wxx.md` per week (W27…W35) that had activity (quiet weeks are skipped by design). If a repo 404s (e.g. not yet public), the gatherer logs `⚠ owner/name: skipped` and continues — note any skips in the final report.

- [ ] **Step 2: Recreate `app/updates/[week]/page.tsx`** *(amended after Task 2: the route was deleted there because Next 16's static export rejects a dynamic route with zero `generateStaticParams` entries; now that weekly files exist it can return).* Create the file with exactly:

```tsx
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
```

- [ ] **Step 3: Spot-check one generated file** — open the newest `content/weekly/*.md` and confirm: frontmatter groups use `product:` keys matching `plu-stan|sc-testing-tool|blaster|cbde`, and any non-roster author's item carries `community: true`.

- [ ] **Step 4: Build with the real data**

```bash
npm run build
```

Expected: green — this exercises the weekly loader, the recreated per-week route, the updates pages, the product-page rollups, and the feeds against real gathered data.

- [ ] **Step 5: Commit**

```bash
git add content/weekly app/updates
git commit -m "chore(weekly): backfill Jul-Aug 2026 activity and restore per-week pages

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 22: Final verification + publish to GitHub

- [ ] **Step 1: Full local verification**

```bash
npx tsc --noEmit && npm run build && npm run lint
```

Expected: all green.

- [ ] **Step 2: Manual pass** — `npm run dev`, then check in a browser (or with curl against `http://localhost:3000`):
  - `/` — fact strip shows 4 products / 2 proposals; timeline rows link to `/products/<slug>/`
  - `/products/blaster/` — milestones BL.00–BL.07, "Funded by" shows both proposals, repo chips show 4 repos
  - `/proposals/` — both proposals with AdaStat/IPFS links
  - `/updates/` and one weekly permalink — activity grouped by product; any community item renders in the callout
  - `/links/`, `/llms.txt`, `/llms-full.txt`, `/api/status.json`

- [ ] **Step 3: Create the GitHub repo and push** *(requires `input-output-hk` org permission — if `gh repo create` is denied, hand this step to Romain: create the repo empty in the GitHub UI, then run the `git remote add` + `git push` lines)*

```bash
cd /Users/romainsoulat/high-assurance-updates
gh repo create input-output-hk/high-assurance-updates --public --source . --push \
  || { git remote add origin https://github.com/input-output-hk/high-assurance-updates.git && git push -u origin main; }
```

- [ ] **Step 4: One-time Pages setup (manual, in the GitHub UI)** — repo Settings → Pages → "Build and deployment" → Source: **GitHub Actions**. Then trigger the first deploy: Actions → `deploy` → Run workflow. Verify the site at `https://input-output-hk.github.io/high-assurance-updates/`.

- [ ] **Step 5: Report** — list any skipped repos from Task 21, the open items from the spec (§11: 2025/26 milestone dates, links list, hades rename, the 2025 proposal IPFS gateway link), and confirm the weekly cron will fire next Monday 08:00 UTC.
```
