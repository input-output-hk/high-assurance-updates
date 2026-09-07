import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { load as loadYaml } from "js-yaml";
import {
  ACTIVITY_TYPES,
  OTHER_GROUP,
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
  return loadYaml(raw, { filename: `content/${fileName}` });
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
  const p = raw as Record<string, unknown>;

  for (const key of ["id", "slug", "title", "summary", "description", "statusUpdatedAt"]) {
    if (!asString(p[key])) fail("products.yaml", `${where} is missing string "${key}"`);
  }
  if (!PRODUCT_STATUSES.includes(p.status as ProductStatus)) {
    fail(
      "products.yaml",
      `${where} has invalid status "${String(p.status)}" (expected one of ${PRODUCT_STATUSES.join(", ")})`,
    );
  }
  if (!asString(p.quarter)) fail("products.yaml", `${where} is missing string "quarter"`);
  const quarter = p.quarter;
  if (quarter !== "ongoing" && !QUARTER_RE.test(quarter)) {
    fail(
      "products.yaml",
      `${where} has invalid quarter "${quarter}" (expected "Q1-2026"-style or "ongoing")`,
    );
  }

  const milestones: Milestone[] = Array.isArray(p.milestones)
    ? p.milestones.map((m, i) => normalizeMilestone(m, `${where} milestones[${i}]`))
    : [];
  const updates: ProductUpdate[] = Array.isArray(p.updates)
    ? p.updates.flatMap((u) => {
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
    id: p.id as string,
    slug: p.slug as string,
    title: p.title as string,
    quarter,
    status: p.status as ProductStatus,
    statusUpdatedAt: p.statusUpdatedAt as string,
    proposals: Array.isArray(p.proposals) ? p.proposals.filter(asString) : [],
    milestones,
    updates,
    summary: p.summary as string,
    description: p.description as string,
    links: normalizeLinks(p.links),
  };
}

let productsCache: Product[] | null = null;

/**
 * All products, in authored order — the site's organizing spine (ADR-13).
 * Fails the build on malformed content.
 */
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
    if (p.id === OTHER_GROUP) {
      fail("products.yaml", `product id "${OTHER_GROUP}" is reserved for the unmapped-activity bucket`);
    }
    slugs.add(p.slug);
    ids.add(p.id);
    return p;
  });
  productsCache = products;
  return products;
}

/** The product with the given slug, or undefined if none matches. */
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
  const num = (key: string, v: unknown): number | null => {
    if (v == null) return null;
    if (typeof v !== "number" || !Number.isFinite(v)) {
      fail("proposals.yaml", `${where} has non-numeric "${key}" (${JSON.stringify(v)})`);
    }
    return v;
  };
  return {
    id: p.id as string,
    title: p.title as string,
    status: p.status as ProposalStatus,
    windowStart: p.windowStart as string,
    windowEnd: p.windowEnd as string,
    treasuryAskAda: num("treasuryAskAda", p.treasuryAskAda),
    budgetUsd: num("budgetUsd", p.budgetUsd),
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

  const seen = new Set<string>();
  for (const p of proposals) {
    if (seen.has(p.id)) fail("proposals.yaml", `duplicate id "${p.id}"`);
    seen.add(p.id);
  }

  const proposalById = new Map(proposals.map((p) => [p.id, p]));
  const productById = new Map(getProducts().map((p) => [p.id, p]));
  for (const p of proposals) {
    for (const ref of p.products) {
      const product = productById.get(ref);
      if (!product) fail("proposals.yaml", `proposal "${p.id}" references unknown product "${ref}"`);
      if (!product.proposals.includes(p.id)) {
        fail("products.yaml", `product "${ref}" does not list proposal "${p.id}" that funds it`);
      }
    }
  }
  for (const product of productById.values()) {
    for (const ref of product.proposals) {
      const prop = proposalById.get(ref);
      if (!prop) fail("products.yaml", `product "${product.id}" references unknown proposal "${ref}"`);
      if (!prop.products.includes(product.id)) {
        fail("proposals.yaml", `proposal "${ref}" does not list product "${product.id}" that references it`);
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

/**
 * The site config. `site` is validated (it feeds LLM feeds and OG images);
 * repos + roster feed the gatherer, so they're validated strictly too —
 * including that every repo's product id actually exists (ADR-6).
 */
export function getConfig(): SiteConfig {
  if (configCache) return configCache;
  const raw = readYaml("config.yaml");
  if (typeof raw !== "object" || raw === null) fail("config.yaml", "expected an object");
  const c = raw as Record<string, unknown>;

  const site = (c.site ?? {}) as Record<string, unknown>;
  for (const key of ["title", "tagline", "description", "repoUrl", "url"]) {
    if (!asString(site[key])) fail("config.yaml", `site is missing string "${key}"`);
  }

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
    site: site as unknown as SiteConfig["site"],
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
  const data = loadYaml("\n" + match[1], { filename: `content/${fileName}` });
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
  const { data, body: rawBody } = parseFrontmatter(fileName, raw);
  for (const key of ["week", "weekStart", "weekEnd", "generatedAt"]) {
    if (!asString(data[key])) fail(fileName, `frontmatter is missing string "${key}"`);
  }
  const groups = Array.isArray(data.activity)
    ? data.activity.map((g, i) => normalizeGroup(fileName, i, g))
    : [];
  const week = data.week as string;

  // The gatherer's authoring TODO is an HTML comment; react-markdown escapes
  // raw HTML, so comments would render as literal text on the page and in the
  // feeds — strip them, and treat a narrative that is only the bare
  // "## Highlights" heading as absent.
  const stripped = rawBody.replace(/<!--[\s\S]*?-->/g, "").trim();
  const body = /^##\s+Highlights$/.test(stripped) ? "" : stripped;

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

/** All weekly updates, most recent first. Missing directory → empty list (but products.yaml must load). */
export function getWeeklyUpdates(): WeeklyUpdate[] {
  if (weeklyCache) return weeklyCache;
  let files: string[];
  try {
    files = readdirSync(WEEKLY_DIR).filter((f) => f.endsWith(".md"));
  } catch {
    files = [];
  }
  const validGroups = new Set<string>([OTHER_GROUP, ...getProducts().map((p) => p.id)]);
  const weeks = new Set<string>();
  const updates = files.map((file) => {
    const raw = readFileSync(join(WEEKLY_DIR, file), "utf8");
    const update = normalizeWeekly(`weekly/${file}`, raw);
    if (weeks.has(update.slug)) fail(`weekly/${file}`, `duplicate week "${update.week}"`);
    weeks.add(update.slug);
    for (const g of update.groups) {
      if (!validGroups.has(g.product)) {
        fail(`weekly/${file}`, `activity group references unknown product "${g.product}"`);
      }
    }
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
