# Cleanroom Visual Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retheme the live High Assurance tracker to the approved "Cleanroom" identity (slate + deep teal, Sora + DM Mono) without touching layout or content.

**Architecture:** Pure token/font swap — every component reads CSS variables, so the work is three token blocks in `globals.css`, the font imports in `layout.tsx`, one copy line, and a regenerated OG card. Work on branch `cleanroom-identity`; `main` auto-deploys, so it merges only after the manual pass. Spec: `docs/superpowers/specs/2026-09-08-cleanroom-identity-design.md`.

**Tech Stack:** Tailwind 4 (`@theme inline` tokens), `next/font/google`, Next 16 static export.

**Spec amendment (approved direction, minor):** Sora loads weights **400**/500/700/800 — the spec listed 500/700/800, but body text needs 400 to avoid reading heavy. `--viz-*` tokens are deleted if (and only if) a grep confirms nothing references them (their consumers, the map/growth charts, were removed in the fork).

---

### Task 1: Tokens, fonts, and eyebrow (branch `cleanroom-identity`)

**Files:**
- Modify: `app/globals.css` (lines 1–127: header comment, three token blocks, font wiring)
- Modify: `app/layout.tsx` (font imports + html className)
- Modify: `app/page.tsx` (eyebrow line)

- [ ] **Step 1: Confirm you are on the branch** — `git branch --show-current` → `cleanroom-identity` (it exists; the spec commit is on it). Never commit this work to `main`.

- [ ] **Step 2: Check `--viz-*` usage** — `grep -rn "viz-1\|viz-2\|viz-3" app components lib --include="*.ts*" --include="*.css" | grep -v globals.css`. Expected: no output → the viz tokens are dropped in Step 3. If anything references them, KEEP the viz lines unchanged and note it in your report.

- [ ] **Step 3: Replace `app/globals.css` lines 3–127** (the header comment through the end of `@theme inline`; keep `@import "tailwindcss";`, the `@custom-variant dark` line, and everything from `body {` down untouched) with:

```css
/*
  Cardano High Assurance tracker — "Cleanroom" design system.
  Cool slate surfaces with a deep teal accent and bronze deadlines;
  Sora (display + body) + DM Mono (data voice). A security-lab look,
  deliberately distinct from the DevX tracker this site was forked from.
*/

/* Manual theme toggle wins over prefers-color-scheme: drive `dark:` from the
   data-theme attribute set on <html>. */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

:root {
  /* Light theme (cool slate — the identity's home mode). */
  --background: #f4f6f8;
  --surface: #ffffff;
  --surface-2: #eceff2;
  --foreground: #1c2733;
  --muted: #5d6b79;
  --border: #dde3e9;
  --primary: #0e7c86; /* deep teal */
  --primary-strong: #0b636b;
  --primary-foreground: #ffffff;
  --on-primary-link: #0b636b;

  --status-done: #177d49;
  --status-progress: #c77e1f; /* bronze — also the timeline deadline color */
  --status-blocked: #b3403a;
  --status-todo: #8a95a1;

  /* GitHub-semantic hues for gathered-activity iconography, tuned to sit on
     slate (light). */
  --gh-open: #1a7f37;
  --gh-merged: #7c56c9;
  --gh-closed: #7c56c9;
  --gh-release: #0a6ea4;
  --gh-neutral: #5d6b79;
}

:root[data-theme="dark"],
.dark-seed {
  /* Dark theme (deep slate, not pure black). */
  --background: #10151a;
  --surface: #171d24;
  --surface-2: #1e252d;
  --foreground: #e6ebf0;
  --muted: #93a0ac;
  --border: #2a333d;
  --primary: #35b3bf; /* lightened teal for contrast on dark */
  --primary-strong: #4cc4cf;
  --primary-foreground: #08262a;
  --on-primary-link: #4cc4cf;

  --status-done: #3fae7a;
  --status-progress: #d99a4e;
  --status-blocked: #d16a63;
  --status-todo: #6f7c88;

  /* GitHub-semantic hues (dark). */
  --gh-open: #46c268;
  --gh-merged: #a98eea;
  --gh-closed: #a98eea;
  --gh-release: #58a6e8;
  --gh-neutral: #93a0ac;
}

/* Follow the OS when no explicit choice has been made. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --background: #10151a;
    --surface: #171d24;
    --surface-2: #1e252d;
    --foreground: #e6ebf0;
    --muted: #93a0ac;
    --border: #2a333d;
    --primary: #35b3bf;
    --primary-strong: #4cc4cf;
    --primary-foreground: #08262a;
    --on-primary-link: #4cc4cf;

    --status-done: #3fae7a;
    --status-progress: #d99a4e;
    --status-blocked: #d16a63;
    --status-todo: #6f7c88;

    --gh-open: #46c268;
    --gh-merged: #a98eea;
    --gh-closed: #a98eea;
    --gh-release: #58a6e8;
    --gh-neutral: #93a0ac;
  }
}

@theme inline {
  --color-background: var(--background);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-border: var(--border);
  --color-primary: var(--primary);
  --color-primary-strong: var(--primary-strong);
  --color-primary-foreground: var(--primary-foreground);

  --color-status-done: var(--status-done);
  --color-status-progress: var(--status-progress);
  --color-status-blocked: var(--status-blocked);
  --color-status-todo: var(--status-todo);

  --font-display: var(--font-sora), system-ui, sans-serif;
  --font-sans: var(--font-sora), system-ui, sans-serif;
  --font-mono: var(--font-dm-mono), ui-monospace, monospace;
}
```

(If Step 2 found viz consumers, re-add the original `--viz-*` lines to both light and dark blocks verbatim.)

- [ ] **Step 4: Swap the fonts in `app/layout.tsx`.** Replace:

```ts
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
```
```ts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
```

with:

```ts
import { DM_Mono, Sora } from "next/font/google";
```
```ts
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});
```

and the `<html>` className from
`` `${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased` ``
to
`` `${sora.variable} ${dmMono.variable} h-full antialiased` ``.

- [ ] **Step 5: Eyebrow.** In `app/page.tsx`, change the hero eyebrow text `Delivery ledger` to `Assurance, measured`.

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit && npm run build && npm run lint
grep -rn "0033ad\|002a8f\|geist\|space-grotesk\|Space_Grotesk\|Geist" app components lib --include="*.ts*" --include="*.css"
```

Expected: gate green; grep → no output. Then a rendered check: `grep -o "font-family:[^;]*" out/index.html | sort -u | head` should mention Sora/DM Mono variables, not Geist.

- [ ] **Step 7: Commit**

```bash
git add app/globals.css app/layout.tsx app/page.tsx
git commit -m "feat(identity): Cleanroom theme — slate + teal tokens, Sora + DM Mono

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Regenerate the OG card

**Files:**
- Create (temporarily): `app/opengraph-image.tsx`, `lib/og-image.tsx`
- Replace: `public/og.png`

- [ ] **Step 1: Recover the old generator as a starting point**

```bash
git show 16718e9:lib/og-image.tsx > lib/og-image.tsx
git show 16718e9:app/opengraph-image.tsx > app/opengraph-image.tsx
```

- [ ] **Step 2: Restyle `lib/og-image.tsx` to Cleanroom.** In the recovered file, replace the two brand-color constants and the eyebrow/gradient usage:
  - `const CARDANO_BLUE = "#0033ad";` → `const SLATE_DEEP = "#10151a";`
  - `const CARDANO_BLUE_STRONG = "#002a8f";` → `const SLATE = "#1c2733";`
  - the `background:` line → `` background: `linear-gradient(135deg, ${SLATE} 0%, ${SLATE_DEEP} 100%)` ``
  - the eyebrow dot's `background: "#3fc98d"` → `background: "#35b3bf"`
  - the eyebrow text (`Developer Experience Initiative` in the old file) → `Input Output · High Assurance`
  - leave sizes, layout, and the config-driven title/tagline/URL as they are.

- [ ] **Step 3: Build and capture**

```bash
npm run build
cp out/opengraph-image public/og.png
file public/og.png
```

Expected: `PNG image data, 1200 x 630`.

- [ ] **Step 4: Remove the temporary generator and rebuild**

```bash
git rm --cached -f app/opengraph-image.tsx 2>/dev/null; rm -f app/opengraph-image.tsx lib/og-image.tsx
npm run build
```

Expected: green; route table has NO `/opengraph-image` route; `out/og.png` present (copied from public/).

- [ ] **Step 5: Commit**

```bash
git add public/og.png
git commit -m "feat(identity): regenerate og card in Cleanroom colors

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Contrast checks, manual pass, merge, deploy

- [ ] **Step 1: Contrast spot-checks** (WCAG AA: ≥4.5:1 body text, ≥3:1 large/UI). Compute with a one-liner (e.g. `npx tsx` with a small luminance function, or any contrast tool) for at least: `#1c2733` on `#f4f6f8` and `#ffffff`; `#5d6b79` on `#f4f6f8` and `#ffffff`; `#0b636b` on `#ffffff`; `#e6ebf0` on `#171d24`; `#93a0ac` on `#171d24`; `#4cc4cf` on `#171d24`. Record the ratios in your report. Any body-text pair below 4.5 → STOP and report BLOCKED with the failing pair.

- [ ] **Step 2: Manual pass** — `npm run dev`, check light AND dark (toggle): `/`, `/products/blaster/`, `/proposals/`, `/updates/2026-w35/`, `/links/`. Look for: teal accents everywhere Cardano blue used to be, bronze due markers, readable muted text, DM Mono in labels/counters, Sora headings, no unstyled flashes. (If you cannot drive a browser, inspect the built HTML/CSS in `out/` for the token values and say so honestly in the report.)

- [ ] **Step 3: Merge and deploy** — ONLY after Steps 1–2 pass:

```bash
git checkout main && git merge --no-ff cleanroom-identity -m "feat: Cleanroom visual identity

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
git push origin main
```

Then watch the deploy: `gh run list --repo input-output-hk/high-assurance-updates --limit 2`, `gh run watch <id> --exit-status`, and verify live: `curl -s https://input-output-hk.github.io/high-assurance-updates/ | grep -c "0e7c86\|f4f6f8"` → ≥1, and `curl -s -o /dev/null -w "%{content_type}\n" https://input-output-hk.github.io/high-assurance-updates/og.png` → `image/png`.

- [ ] **Step 4: Report** — commits, contrast table, live URLs checked.
