# Design — "Cleanroom" Visual Identity

**Date:** 2026-09-08
**Status:** Approved by Romain Soulat (2026-09-08), chosen over "Proof Ledger" and
"Machine Room" directions via visual mockups; accent C1 and type pairing 3
selected from rendered variants.
**Scope:** New visual identity, same layout — no page-structure, content,
feed, or CI changes.

## 1. Goal

Give the High Assurance tracker its own identity, visually distinct from the
DevX tracker (and other forks of it): away from Cardano blue `#0033ad` +
Space Grotesk/Geist, toward a cool "security lab" look — slate surfaces, deep
teal accent, Sora + DM Mono.

## 2. Palette

Tokens live in `app/globals.css`; every component already reads CSS variables,
so this section is the bulk of the change.

### Light (default)

| Token | Value | Notes |
|---|---|---|
| background | `#f4f6f8` | page ground, cool slate |
| surface | `#ffffff` | cards |
| surface-2 | `#eceff2` | inset chips/tracks |
| border | `#dde3e9` | |
| foreground | `#1c2733` | |
| muted | `#5d6b79` | ≥4.5:1 on background |
| primary (accent) | `#0e7c86` | deep teal — eyebrows, counters, active nav, markers |
| on-primary-link | `#0b636b` | darker teal for text links (AA on white) |
| status-done | `#177d49` | |
| status-progress | `#c77e1f` | bronze; also the timeline deadline color |
| status-blocked | `#b3403a` | |
| status-todo | `#8a95a1` | |

GitHub activity glyph colors (`--gh-merged`, `--gh-open`, `--gh-closed`,
`--gh-release`, `--gh-neutral`) keep their semantic hues (violet/green/red/
blue/gray) but are re-tuned to sit on the slate surfaces — exact values chosen
at implementation time with a contrast check, in both modes.

### Dark

| Token | Value |
|---|---|
| background | `#10151a` |
| surface | `#171d24` |
| surface-2 | `#1e252d` |
| border | `#2a333d` |
| foreground | `#e6ebf0` |
| muted | `#93a0ac` |
| primary | `#35b3bf` |
| on-primary-link | `#4cc4cf` |
| status-done | `#3fae7a` |
| status-progress | `#d99a4e` |
| status-blocked | `#d16a63` |
| status-todo | `#6f7c88` |

Theme mechanism (data-theme attribute + prefers-color-scheme + toggle) is
unchanged.

## 3. Typography

- **Sora** (weights 400/500/600/700/800 — amended during implementation: 400
  for body text, 600 because `font-semibold` is the workhorse heading weight)
  replaces BOTH Space Grotesk (display) and Geist (body). One sans keeps the
  static-site font payload small.
- **DM Mono** (weights 400/500) replaces Geist Mono as the data voice
  (labels, counters, milestone ids, week keys, code).
- Loaded via `next/font/google` in `app/layout.tsx`, same pattern as today.
  The existing CSS variables (`--font-geist-sans`, `--font-geist-mono`,
  `--font-space-grotesk`) are renamed to `--font-sora` / `--font-dm-mono`,
  with the `globals.css` font-family wiring updated accordingly (display and
  body both map to Sora).

## 4. Voice details

- Hero eyebrow: "Delivery ledger" → **"Assurance, measured"**
  (`app/page.tsx`, one line).
- Everything else — layouts, cards, timeline, `ledger-in` animation, copy —
  unchanged.

## 5. OG card

`public/og.png` (1200×630) is regenerated in the new identity: slate ground,
teal accent, Sora, same content (title, tagline, URL). Mechanism: temporarily
recreate the `ImageResponse` route, build, copy the PNG out, remove the route
again (same approach that produced the current card). The `app/layout.tsx`
metadata (`/og.png`) is untouched.

## 6. Out of scope

- Layout or component structure changes.
- Favicon redesign (current favicon.ico stays; candidate for later).
- Content, feeds (`llms.txt`/`status.json` carry no colors), CI, gatherer.

## 7. Files touched

`app/globals.css`, `app/layout.tsx`, `app/page.tsx` (eyebrow line),
`public/og.png` (binary). Nothing else.

## 8. Testing / acceptance

1. `npm run build` green; `npm run lint` clean.
2. Contrast spot-checks (WCAG AA for body/muted text and link text on their
   grounds, both modes).
3. Manual pass, light AND dark: home, a product page (blaster), proposals,
   one weekly permalink, links — accent/status colors correct everywhere;
   no leftover Cardano blue (`#0033ad`/`#002a8f`) or old font variables
   (grep for them).
4. `file public/og.png` → PNG 1200×630; page metadata still points at it.
5. Work happens on branch `cleanroom-identity` (main auto-deploys); merge to
   main only after the manual pass.
