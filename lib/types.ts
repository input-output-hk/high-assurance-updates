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
  community?: true;
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
