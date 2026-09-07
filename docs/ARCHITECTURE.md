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
