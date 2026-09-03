# Design — Cardano High Assurance Tracker (fork of devx-updates)

**Date:** 2026-09-02
**Status:** Approved by Romain Soulat (2026-09-02)
**Approach:** Fork and restructure the content model (Approach A)

## 1. Summary

Fork `input-output-hk/devx-updates` into **`input-output-hk/high-assurance-updates`**:
a public, static tracker for IO's Cardano High Assurance products. The proven
machinery carries over unchanged — Next.js 16 static export, content-as-YAML,
the weekly GitHub-activity gatherer, the draft-PR CI workflow, and the
llms.txt / status.json feeds. The content layer is restructured:

- The primary organizing unit changes from *deliverable* (single proposal) to
  **product** (four products, funded by multiple proposals).
- Proposals become first-class metadata rendered on a **Proposals index page**,
  not the site's spine.
- The gatherer groups activity by product and **flags community (non-roster)
  contributions** in owned repos.
- DevX-only pages (pledge, ecosystem map, single-proposal page, impact) are
  dropped.

## 2. Identity & hosting

| | |
|---|---|
| Repo | `https://github.com/input-output-hk/high-assurance-updates` |
| Pages URL | `https://input-output-hk.github.io/high-assurance-updates` |
| `basePath` | `/high-assurance-updates` |
| Site title | **Cardano High Assurance** |
| Tagline | A transparent, weekly-updated tracker for IO's Cardano High Assurance toolkit. |

All DevX identity is replaced: OG/Twitter images, header (no single treasury
ask), footer, favicon, and the bundled `devx-proposal.pdf` is removed.

## 3. Content model

### 3.1 `content/products.yaml` (replaces `deliverables.yaml`)

One entry per product. Fields: `id`, `slug`, `title`, `status`
(`not-started | in-progress | done | blocked`), `statusUpdatedAt`, `summary`,
`description`, `updates[]` (dated entries, optionally linked to a week),
`proposals[]` (ids into `proposals.yaml`), `milestones[]`, `links[]`.

The four products and their repos:

| id | Title | Repos |
|---|---|---|
| `plu-stan` | Plu-stan — Static Analyzer for Plinth | `input-output-hk/plu-stan`, `input-output-hk/Cardano-CWE-Research` |
| `sc-testing-tool` | sc-testing-tool — Property-Based Testing | `input-output-hk/sc-testing-tools`, `input-output-hk/sc-testing-tools-vs-extension` |
| `blaster` | Blaster — Automated Formal Verification | `input-output-hk/Lean-blaster`, `input-output-hk/Blaster-benchmarking`, `input-output-hk/PlutusCoreBlaster`, `input-output-hk/CardanoLedgerApiBlaster` |
| `cbde` | CBDE / Hades — Container-Based Developer Environment | `input-output-hk/hades` |

Milestones seeded from the 2026/27 proposal's Deliverables & Roadmap table:

- **Blaster:** Equivalence Checking Tool (Q4 2026), VS Code Extension V1
  (Q4 2026), Language Integrations — Aiken, Pebble, Scalus, Futura (Q1 2027),
  VS Code Extension V2 (Q2 2027), DApp Proof Framework (Q2 2027), Common
  Vulnerability Library (Q2 2027), Proof Reconstruction Module (Q2 2027).
- **CBDE:** Solution Design & Tool Inventory (Q3 2026), Environment Setup &
  Tool Encapsulation / 0.x pre-release (Q4 2026), Community Beta & V1.0
  Preparation (Q1 2027), V1.0 Release & Documentation (Q2 2027).
- **Plu-stan / sc-testing-tool:** 2025/26-cycle deliverables (PoC, Ruleset
  Docs, Stable Release; CLI tool, VS Code integration, Documentation) recorded
  as milestones with delivery dates **to be confirmed by the team** before
  launch; marked clearly if dates are unknown.

Notable 2025/26 history (e.g. Blaster's Djed and USDCx verifications) is
recorded as dated `updates` entries on the relevant product.

### 3.2 `content/proposals.yaml` (new)

One entry per funding proposal. Fields: `id`, `slug`, `title`, `window`
(`start`/`end` quarters), `status` (`active | completed`), `treasuryAskAda`
and/or per-initiative USD budgets, `products[]` (funded product ids),
`collaborators[]`, `links[]` (governance action, IPFS/PDF, docs), `notes`.

| id | Title | Window | Funds | Key facts |
|---|---|---|---|---|
| `core-dev-2025` | IOE 2025 Core Development Proposal (Plutus High Assurance initiatives) | 2025 → 2026 | plu-stan, sc-testing-tool, blaster | AFV $1,859,000; PBT Tool $2,366,000; Static Analyzer $777,140. Page notes the proposal also funded many non-HA initiatives outside this tracker's scope. |
| `high-assurance-2026` | Cardano High Assurance 2026/27 | Q3 2026 → Q2 2027 | blaster, cbde | ₳13,078,578 total (WS1 Blaster ₳10,112,037; WS2 CBDE ₳2,966,541). Links: adastat governance action `73e171…6205`, IPFS proposal PDF. Collaborators: Lantr, Harmonic Labs, SAIB, Midgard Labs, TxPipe, No.Witness Labs. |

### 3.3 `content/config.yaml`

- `site`: new title/tagline/description, `repoUrl` and `url` per §2.
- `roster`: `sfeitosa`, `bogdan-manole`, `sjoerdvisscher`, `etiennejf`,
  `paulacu-iohk`, `EehMauro`, `KJES4`, `RSoulatIOHK`, `mpetruska`.
- `repos`: the nine repos of §3.1, each with `product:` (renamed from
  `deliverable:`) and `teamOnly: false` (all are IO-owned; the roster is still
  used to distinguish team vs community authors — see §5).
- `links`: curated jump-off points (product repos, VS Code Marketplace once
  live, relevant docs) — seeded minimally, extended later.
- Single-proposal fields (`proposal.treasuryAskAda`, `lead`, `collaborators`)
  are **removed** from config; that data now lives in `proposals.yaml`.

## 4. Pages

| Route | Disposition |
|---|---|
| `/` (dashboard) | Keep — product status grid, proof-of-work counters, latest weekly update. |
| `/deliverables/[slug]` | Rename to **`/products/[slug]`** — adds a "Funded by" badge linking to the proposal(s), and a "Community contributions" section fed by flagged activity. `generateStaticParams` + `dynamicParams = false` as today. |
| `/proposals` | **New** — index of both proposals: title, window, ask, status, funded products, external links. No full-text rendering; external sources are canonical. |
| `/updates`, `/updates/[week]` | Keep — weekly archive and permalinks, grouped by product. |
| `/links` | Keep. |
| `/llms.txt`, `/llms-full.txt`, `/api/status.json` | Keep — vocabulary updated (products, proposals). |
| Roadmap/timeline component | Keep — milestone timeline grouped per product, spanning the 2025/26 cycle through Q2 2027. |
| `/pledge`, `/map/*`, `/proposal`, `/_impact` | **Drop** (delete pages, components `GraphMap.tsx`, map types, and nav entries). |

## 5. Gatherer & weekly format

`scripts/gather.ts` keeps its interface (`--week`, `--from/--to`, `--repo`,
`--dry-run`) and behavior (merged PRs, opened/closed issues, releases,
per-repo commit counts, bot exclusion, Monday–Sunday ISO weeks). Changes:

1. **Group by product** (rename of the deliverable grouping); unmapped
   activity falls into an **"Other"** bucket (replaces "Other / Reactive").
2. **Community flag:** in any tracked repo, an itemized entry (merged PR,
   issue, release) whose author is not on the roster and not a bot is kept
   and tagged `community: true`.
3. The weekly template renders flagged entries under a **"Community
   contributions"** callout inside each product's section, and keeps the empty
   **Highlights** section for manually written shout-outs of worthy outside
   contributions.

Note: `hades` may be renamed to `Hades`/another name. GitHub's API follows
renames via redirects, so gathering keeps working; the config URL should be
updated when the rename lands.

## 6. CI

- `gather-weekly.yml`: unchanged behavior — scheduled Monday 08:00 UTC +
  manual dispatch, opens a draft PR with the pre-filled week. Only repo-name
  references and PR text updated.
- `deploy.yml`: unchanged — merge to `main` builds the static export and
  deploys to GitHub Pages.
- No secrets beyond the built-in `GITHUB_TOKEN`; all tracked repos are public.

## 7. Docs

- `docs/PRD.md`: rewritten for the HA tracker (users now include DReps and
  the community following the 2026/27 on-chain proposal; goals unchanged in
  spirit: transparency, credibility, low upkeep, LLM-readability).
- `docs/ARCHITECTURE.md`: ADRs carried over, plus new ADRs for
  (a) the product/proposal split and (b) the community-contribution flag.
- `AGENTS.md` / `CLAUDE.md`: kept as-is (Next.js 16 guidance still applies).

## 8. Error handling

- Build fails loudly if a `repos[].product` id or a `products[].proposals[]`
  id has no matching entry (same fail-fast validation style as today's
  content loader).
- Gatherer treats API failures per-repo: a failed repo is reported and
  skipped, not silently dropped (current behavior preserved).

## 9. Testing & acceptance

1. `npm run build` passes (static export, `dynamicParams = false` on
   `products/[slug]` and `updates/[week]`).
2. `npx tsx scripts/gather.ts --dry-run` against a real recent week shows
   correct product grouping and community flagging (e.g. a known non-roster
   PR in an owned repo appears under "Community contributions").
3. Lint passes.
4. Manual pass: dashboard, each product page, proposals page, one weekly
   permalink, links page, llms.txt — all render with real seed content and
   correct basePath-prefixed links.

## 10. Out of scope

- Rendering full proposal texts on-page (external adastat/IPFS links are
  canonical).
- Tracking the other 2025 Core Dev initiatives (Transaction Monitoring
  System, Tiered Pricing Models) — the proposals page notes their existence.
- Custom domain; KPI dashboards; RSS.

## 11. Open items (placeholders allowed at launch)

- Delivery dates / final status for the 2025/26 milestones of Plu-stan and
  sc-testing-tool (team to confirm).
- Final curated `links` list.
- The `hades` → `Hades` repo rename (update config when it happens).
