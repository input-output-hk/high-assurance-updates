#!/usr/bin/env -S npx tsx
/**
 * Weekly GitHub activity gatherer (docs/ARCHITECTURE.md ADR-5…ADR-8).
 *
 * Reads the curated repo list + roster from content/config.yaml, queries the
 * public GitHub API for the target calendar week (default: the prior Mon–Sun),
 * groups activity by product, and writes content/weekly/YYYY-Www.md with
 * an empty Highlights section for a human to fill in before merge.
 *
 * Run:  GITHUB_TOKEN=$(gh auth token) npx tsx scripts/gather.ts [options]
 * Options:
 *   --week 2026-W28      gather a specific ISO week instead of the prior one
 *   --from 2026-06-01    backfill a date range: gather every ISO week that
 *   --to   2026-07-12    overlaps [from, to] (both YYYY-MM-DD, used together).
 *                        Weeks with no activity are skipped, not written.
 *   --repo owner/name    override the tracked repo list (repeatable); for
 *                        testing. Uses product=null, teamOnly=false.
 *   --dry-run            print the generated file(s) to stdout, don't write them
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { dump as dumpYaml } from "js-yaml";
import { getConfig } from "../lib/content";
import {
  OTHER_GROUP,
  type ActivityItem,
  type TrackedRepo,
  type WeeklyCounters,
} from "../lib/types";

const API = "https://api.github.com";
const BOT_LOGINS = new Set(["dependabot", "dependabot[bot]", "github-actions[bot]"]);
const isBot = (login: string) => login.endsWith("[bot]") || BOT_LOGINS.has(login);

// --- args ------------------------------------------------------------------

interface Args {
  week?: string;
  from?: string;
  to?: string;
  repos: string[];
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { repos: [], dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--week") args.week = argv[++i];
    else if (a === "--from") args.from = argv[++i];
    else if (a === "--to") args.to = argv[++i];
    else if (a === "--repo") args.repos.push(argv[++i]);
    else if (a === "--dry-run") args.dryRun = true;
    else throw new Error(`Unknown argument: ${a}`);
  }
  return args;
}

// --- ISO week math (all UTC) ----------------------------------------------

function isoWeekOf(d: Date): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (date.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  date.setUTCDate(date.getUTCDate() - day + 3); // move to the week's Thursday
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 864e5));
  return { year: date.getUTCFullYear(), week };
}

function mondayOfISOWeek(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4)); // Jan 4 is always in ISO week 1
  const day = (jan4.getUTCDay() + 6) % 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - day);
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return monday;
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const weekKey = (year: number, week: number) => `${year}-W${String(week).padStart(2, "0")}`;

/** Resolve the target week to { key, start (Mon), end (Sun) } as UTC dates. */
function resolveWeek(explicit?: string): { key: string; start: Date; end: Date } {
  let year: number;
  let week: number;
  if (explicit) {
    const m = explicit.match(/^(\d{4})-W(\d{1,2})$/i);
    if (!m) throw new Error(`--week must look like 2026-W28, got "${explicit}"`);
    year = Number(m[1]);
    week = Number(m[2]);
  } else {
    // Prior calendar week: back up 7 days from today, then take that week (ADR-8).
    const priorWeek = new Date();
    priorWeek.setUTCDate(priorWeek.getUTCDate() - 7);
    ({ year, week } = isoWeekOf(priorWeek));
  }
  const start = mondayOfISOWeek(year, week);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { key: weekKey(year, week), start, end };
}

interface Week {
  key: string;
  start: Date;
  end: Date;
}

/** The full ISO week (Mon–Sun) that a given date falls in. */
function weekOf(d: Date): Week {
  const { year, week } = isoWeekOf(d);
  const start = mondayOfISOWeek(year, week);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { key: weekKey(year, week), start, end };
}

function parseDate(s: string, flag: string): Date {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error(`${flag} must look like 2026-06-01, got "${s}"`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

/** Every ISO week that overlaps [from, to], inclusive of the weeks at each end. */
function weeksBetween(from: Date, to: Date): Week[] {
  const weeks: Week[] = [];
  let cursor = weekOf(from).start; // Monday of the first week
  while (cursor <= to) {
    weeks.push(weekOf(cursor));
    cursor = new Date(cursor);
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return weeks;
}

/** The list of weeks to gather, from --from/--to (a range) or --week / default (one). */
function resolveWeeks(args: Args): { weeks: Week[]; range: boolean } {
  if (args.from || args.to) {
    if (!args.from || !args.to) throw new Error("--from and --to must be used together");
    if (args.week) throw new Error("--week cannot be combined with --from/--to");
    const from = parseDate(args.from, "--from");
    const to = parseDate(args.to, "--to");
    if (from > to) throw new Error(`--from (${args.from}) must be on or before --to (${args.to})`);
    return { weeks: weeksBetween(from, to), range: true };
  }
  return { weeks: [resolveWeek(args.week)], range: false };
}

// --- GitHub API ------------------------------------------------------------

const token = process.env.GITHUB_TOKEN;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function gh<T>(path: string): Promise<T> {
  const url = path.startsWith("http") ? path : `${API}${path}`;
  // The Search API caps at 30 req/min, so a multi-week backfill routinely trips
  // the rate limit. On a 403/429, wait until the limit resets (per the response
  // headers) and retry rather than aborting the whole run.
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "high-assurance-updates-gatherer",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (res.ok) return res.json() as Promise<T>;

    const rateLimited = res.status === 403 || res.status === 429;
    if (rateLimited && attempt < 6) {
      const retryAfter = res.headers.get("retry-after");
      const remaining = res.headers.get("x-ratelimit-remaining");
      const reset = res.headers.get("x-ratelimit-reset");
      let waitMs = 0;
      if (retryAfter) waitMs = Number(retryAfter) * 1000;
      else if (remaining === "0" && reset) waitMs = Number(reset) * 1000 - Date.now();
      if (waitMs > 0 && waitMs <= 120_000) {
        console.error(`  ⏳ rate limited; waiting ${Math.ceil(waitMs / 1000)}s before retrying…`);
        await sleep(waitMs + 1000); // small buffer past the reset instant
        continue;
      }
    }

    const body = await res.text();
    throw new Error(`GitHub API ${res.status} for ${path}: ${body.slice(0, 300)}`);
  }
}

/**
 * GET every page of a REST list endpoint. Pages via `?page=N` until a short page
 * comes back. `path` must NOT already carry a `per_page`/`page` param.
 */
async function ghPaged<T>(path: string): Promise<T[]> {
  const perPage = 100;
  const out: T[] = [];
  const sep = path.includes("?") ? "&" : "?";
  for (let page = 1; ; page++) {
    const batch = await gh<T[]>(`${path}${sep}per_page=${perPage}&page=${page}`);
    out.push(...batch);
    if (batch.length < perPage) break;
  }
  return out;
}

interface SearchIssue {
  title: string;
  html_url: string;
  user: { login: string } | null;
  pull_request?: unknown;
}

/** Run one issues-search query, honoring teamOnly by OR-ing per-author queries. */
async function searchIssues(
  repo: TrackedRepo,
  qualifiers: string,
  roster: string[],
): Promise<SearchIssue[]> {
  const authors = repo.teamOnly ? roster : [null];
  const seen = new Set<string>();
  const out: SearchIssue[] = [];
  for (const author of authors) {
    const q = [
      `repo:${repo.owner}/${repo.name}`,
      qualifiers,
      author ? `author:${author}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    const data = await gh<{ items: SearchIssue[] }>(
      `/search/issues?per_page=100&q=${encodeURIComponent(q)}`,
    );
    for (const item of data.items) {
      if (seen.has(item.html_url)) continue;
      seen.add(item.html_url);
      out.push(item);
    }
  }
  return out;
}

interface RepoActivity {
  items: ActivityItem[];
  commits: number;
  comments: number;
  touched: boolean;
}

async function gatherRepo(
  repo: TrackedRepo,
  start: Date,
  end: Date,
  roster: string[],
): Promise<RepoActivity> {
  const slug = `${repo.owner}/${repo.name}`;
  const range = `${ymd(start)}..${ymd(end)}`;
  const items: ActivityItem[] = [];

  const push = (type: ActivityItem["type"], raw: { title: string; html_url: string; login: string }) => {
    if (isBot(raw.login)) return;
    const item: ActivityItem = { type, title: raw.title, url: raw.html_url, repo: slug, author: raw.login };
    // Non-roster author in a tracked repo → a community contribution (ADR-14).
    if (raw.login && !roster.includes(raw.login)) item.community = true;
    items.push(item);
  };

  // Merged PRs, opened issues, closed issues (ADR-7: itemize signal).
  const merged = await searchIssues(repo, `is:pr is:merged merged:${range}`, roster);
  const mergedUrls = new Set<string>();
  for (const p of merged) {
    mergedUrls.add(p.html_url);
    push("pr", { title: p.title, html_url: p.html_url, login: p.user?.login ?? "" });
  }

  // PRs opened in-window (including drafts), regardless of target branch —
  // in-progress work on feature/integration branches that the merged search
  // above can't see because it hasn't landed yet. The Search API's
  // `is:pr created:` matches drafts and non-drafts alike (no `draft:` qualifier
  // needed). A PR opened *and* merged in the same window is already itemized as
  // merged, so skip those to avoid listing the same PR twice.
  const openedPrs = await searchIssues(repo, `is:pr created:${range}`, roster);
  for (const p of openedPrs)
    if (!mergedUrls.has(p.html_url))
      push("pr-opened", { title: p.title, html_url: p.html_url, login: p.user?.login ?? "" });

  const opened = await searchIssues(repo, `is:issue created:${range}`, roster);
  for (const i of opened)
    if (!i.pull_request) push("issue-opened", { title: i.title, html_url: i.html_url, login: i.user?.login ?? "" });

  const closed = await searchIssues(repo, `is:issue closed:${range}`, roster);
  for (const i of closed)
    if (!i.pull_request) push("issue-closed", { title: i.title, html_url: i.html_url, login: i.user?.login ?? "" });

  // Releases (REST) — filter to the window and (if teamOnly) roster authors.
  interface Release {
    name: string | null;
    tag_name: string;
    html_url: string;
    draft: boolean;
    published_at: string | null;
    author: { login: string } | null;
  }
  const releases = await gh<Release[]>(`/repos/${slug}/releases?per_page=100`);
  for (const r of releases) {
    if (r.draft || !r.published_at) continue;
    const when = new Date(r.published_at);
    if (when < start || when > endOfDay(end)) continue;
    const login = r.author?.login ?? "";
    if (repo.teamOnly && !roster.includes(login)) continue;
    push("release", { title: r.name || r.tag_name, html_url: r.html_url, login });
  }

  // Commits (REST) — summarized as a per-repo count (ADR-7), bots/merges excluded.
  // Counted across *all* branches, not just the default one: work on feature and
  // draft-PR branches lives on non-default branches, and the plain `/commits`
  // endpoint (no `sha`) only walks the default branch. We enumerate every branch,
  // walk each one's commits in-window, and dedup by SHA so a commit reachable
  // from several branches is counted once. teamOnly is filtered in code by author
  // login (as releases/comments already are), which also drops the per-author
  // query fan-out the default-branch-only version used.
  let commits = 0;
  interface Commit {
    sha: string;
    author: { login: string } | null;
    commit: { message: string };
    parents: unknown[];
  }
  interface Branch {
    name: string;
  }
  const branches = await ghPaged<Branch>(`/repos/${slug}/branches`);
  const seenCommits = new Set<string>();
  for (const branch of branches) {
    const qs = new URLSearchParams({
      sha: branch.name,
      since: start.toISOString(),
      until: endOfDay(end).toISOString(),
    });
    const branchCommits = await ghPaged<Commit>(`/repos/${slug}/commits?${qs}`);
    for (const c of branchCommits) {
      if (seenCommits.has(c.sha)) continue; // reachable from an already-walked branch
      seenCommits.add(c.sha);
      if (c.parents.length > 1) continue; // merge commit
      const login = c.author?.login ?? "";
      if (isBot(login)) continue;
      if (repo.teamOnly && !roster.includes(login)) continue;
      commits++;
    }
  }

  // Issue & PR conversation comments (REST) — summarized as a per-repo count
  // like commits (ADR-7: noise, not itemized). The endpoint returns comments on
  // both issues and pull requests (a PR is an issue in GitHub's model), so it
  // covers "comments in both". `since` filters by *updated* time, so re-filter
  // to comments actually created in the window. Bots excluded; teamOnly limits
  // to roster authors. (Inline PR review comments are a separate endpoint and
  // deliberately not counted here — the conversation is the meaningful signal.)
  let comments = 0;
  interface IssueComment {
    user: { login: string } | null;
    created_at: string;
  }
  const commentsPage = await gh<IssueComment[]>(
    `/repos/${slug}/issues/comments?per_page=100&since=${encodeURIComponent(start.toISOString())}`,
  );
  for (const cm of commentsPage) {
    const when = new Date(cm.created_at);
    if (when < start || when > endOfDay(end)) continue;
    const login = cm.user?.login ?? "";
    if (isBot(login)) continue;
    if (repo.teamOnly && !roster.includes(login)) continue;
    comments++;
  }

  return { items, commits, comments, touched: items.length > 0 || commits > 0 || comments > 0 };
}

function endOfDay(d: Date): Date {
  const e = new Date(d);
  e.setUTCHours(23, 59, 59, 999);
  return e;
}

// --- main ------------------------------------------------------------------

/** Gather one week across all repos and render its Markdown file. */
async function gatherWeek(
  week: Week,
  repos: TrackedRepo[],
  roster: string[],
): Promise<{ file: string; hasActivity: boolean }> {
  const { key, start, end } = week;
  console.error(`Gathering ${key} (${ymd(start)} … ${ymd(end)}) across ${repos.length} repo(s)…`);

  // Group activity by product id (or the Other bucket), tracking per-repo commit counts.
  const groups = new Map<string, { items: ActivityItem[]; commitCounts: Record<string, number> }>();
  const counters: WeeklyCounters = {
    prsMerged: 0,
    prsOpened: 0,
    issuesClosed: 0,
    issuesOpened: 0,
    releases: 0,
    reposTouched: 0,
    commits: 0,
    comments: 0,
  };

  const failed: string[] = [];

  for (const repo of repos) {
    const slug = `${repo.owner}/${repo.name}`;
    const groupKey = repo.product ?? OTHER_GROUP;
    const group = groups.get(groupKey) ?? { items: [], commitCounts: {} };

    // Isolate per-repo failures: a renamed/private/missing repo (or a transient
    // API error that outlives the retry budget) should log a warning and be
    // skipped, not abort the whole week and discard every other repo's work.
    let activity: RepoActivity;
    try {
      activity = await gatherRepo(repo, start, end, roster);
    } catch (err) {
      failed.push(slug);
      console.error(`  ⚠ ${slug}: skipped — ${err instanceof Error ? err.message : err}`);
      continue;
    }

    group.items.push(...activity.items);
    if (activity.commits > 0) group.commitCounts[slug] = activity.commits;
    groups.set(groupKey, group);

    for (const it of activity.items) {
      if (it.type === "pr") counters.prsMerged++;
      else if (it.type === "pr-opened") counters.prsOpened++;
      else if (it.type === "issue-closed") counters.issuesClosed++;
      else if (it.type === "issue-opened") counters.issuesOpened++;
      else if (it.type === "release") counters.releases++;
    }
    counters.commits += activity.commits;
    counters.comments += activity.comments;
    if (activity.touched) counters.reposTouched++;
    console.error(
      `  ${slug}: ${activity.items.length} item(s), ${activity.commits} commit(s), ${activity.comments} comment(s)`,
    );
  }

  if (failed.length > 0) {
    console.error(
      `  ⚠ ${key}: ${failed.length} of ${repos.length} repo(s) skipped due to errors: ${failed.join(", ")}`,
    );
  }

  const activity = [...groups.entries()]
    .filter(([, g]) => g.items.length > 0 || Object.keys(g.commitCounts).length > 0)
    .map(([product, g]) => ({ product, items: g.items, commitCounts: g.commitCounts }));

  const frontmatter = {
    week: key,
    weekStart: ymd(start),
    weekEnd: ymd(end),
    generatedAt: ymd(new Date()),
    counters,
    activity,
  };

  const file =
    `---\n${dumpYaml(frontmatter, { lineWidth: 100 }).trimEnd()}\n---\n\n` +
    `## Highlights\n\n` +
    `<!-- Write the week's narrative here before merging. What shipped, why it\n` +
    `matters, and what's next. The activity above is auto-gathered evidence;\n` +
    `items flagged community:true are outside contributions — consider a shout-out. -->\n`;

  return { file, hasActivity: activity.length > 0 };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!token) console.warn("⚠ No GITHUB_TOKEN set — unauthenticated requests are heavily rate-limited.");

  const config = getConfig();
  const roster = config.roster;
  const repos: TrackedRepo[] =
    args.repos.length > 0
      ? args.repos.map((r) => {
          const [owner, name] = r.split("/");
          if (!owner || !name) throw new Error(`--repo must be owner/name, got "${r}"`);
          return { url: `https://github.com/${r}`, owner, name, product: null, teamOnly: false };
        })
      : config.repos;

  const { weeks, range } = resolveWeeks(args);
  if (range) console.error(`Backfilling ${weeks.length} week(s): ${weeks[0].key} … ${weeks[weeks.length - 1].key}`);

  const dir = join(process.cwd(), "content", "weekly");
  if (!args.dryRun) mkdirSync(dir, { recursive: true });

  for (const week of weeks) {
    const { file, hasActivity } = await gatherWeek(week, repos, roster);

    if (args.dryRun) {
      process.stdout.write(file);
      continue;
    }

    // In range mode a quiet week is expected — skip it rather than write an empty file.
    if (range && !hasActivity) {
      console.error(`Skipped ${week.key} — no activity.`);
      continue;
    }

    const outPath = join(dir, `${week.key}.md`);
    writeFileSync(outPath, file);
    console.error(`Wrote ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
