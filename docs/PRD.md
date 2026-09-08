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
- Evidence links and dated `updates[]` entries for the Djed / USDCx
  verifications claimed in `products.yaml` (Blaster summary).
