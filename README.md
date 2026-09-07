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
