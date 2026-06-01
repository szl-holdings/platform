# KANCHAY — Typography System

**License:** type tokens Apache-2.0; fonts under their own OFL/UFL (see below).
**Attribution:** ORCID 0009-0001-0110-4173. **Open-source families only — no proprietary licensing.**

## 1 · Families & reasoning

| Role | Family | License | Why |
|---|---|---|---|
| **Body / UI** | **Inter** | [SIL OFL 1.1](https://github.com/rsms/inter/blob/master/LICENSE.txt) | Designed for screen UI at small sizes; tall x-height, open apertures, tabular figures, huge weight range. Already the de-facto sans for technical dashboards; legible for dense audit/receipt copy. |
| **Headings / Display** | **IBM Plex Sans** | [SIL OFL 1.1](https://github.com/IBM/plex/blob/master/LICENSE.txt) | Engineering/enterprise heritage; slightly more character than Inter for headings, pairs cleanly with Inter body without clashing. Conveys "defense-grade / systems" tone without novelty. |
| **Mono / Code / Receipts** | **JetBrains Mono** | [SIL OFL 1.1](https://github.com/JetBrains/JetBrainsMono/blob/master/OFL.txt) | Built for code; tall lowercase, distinct `0/O`, `1/l/I`, increased letter height — ideal for hashes, SHA-256 receipt roots, Lean snippets, and numeric audit data where character disambiguation matters. |
| **Display (numerics, optional)** | **IBM Plex Mono** | [SIL OFL 1.1](https://github.com/IBM/plex/blob/master/LICENSE.txt) | Large hero numbers (the canonical counts: 456 / 749 / 14 / 6 / 163) where a monospace display reinforces "these are exact figures." |

All four are open-source (SIL Open Font License 1.1), redistributable, embeddable, no royalties —
satisfying the hard rule "open-source fonts only." IBM Plex and JetBrains Mono are also available
via Google Fonts and as npm packages (`@fontsource/*`), enabling self-hosting (no third-party CDN
dependency — a sovereignty requirement).

## 2 · Type scale (modular)

Base **16px**, ratio **1.250 (Major Third)** — a calm, enterprise-appropriate scale (not the
dramatic 1.333+ used by consumer marketing). Rounded to whole px for crispness.

| Token | rem | px | Use | Family |
|---|---|---|---|---|
| `text-xs`   | 0.75  | 12 | captions, receipt metadata | mono |
| `text-sm`   | 0.875 | 14 | secondary UI, table cells | body |
| `text-base` | 1.000 | 16 | body copy | body |
| `text-lg`   | 1.250 | 20 | lead paragraph, card titles | body |
| `text-xl`   | 1.563 | 25 | H4 | heading |
| `text-2xl`  | 1.953 | 31 | H3 | heading |
| `text-3xl`  | 2.441 | 39 | H2 | heading |
| `text-4xl`  | 3.052 | 49 | H1 | display |
| `text-5xl`  | 3.815 | 61 | hero | display |

Computed as `16 · 1.25ⁿ`. Line-heights: body `1.6`, headings `1.2`, display `1.1`, mono `1.5`.
Letter-spacing: display/headings `-0.01em` (tighten), all-caps labels `+0.08em`, mono `0`.

Font weights: body 400 / medium 500 / semibold 600; headings 600 / 700; mono 400 / 500.

## 3 · Fallback chain

```
--font-body:    "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
--font-heading: "IBM Plex Sans", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
--font-mono:    "JetBrains Mono", "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
--font-display: "IBM Plex Sans", "Inter", system-ui, sans-serif;
```

Each chain ends in a generic family so text renders before/without webfonts. `system-ui` is the
first fallback so the FOUT (flash of unstyled text) lands on the OS UI font, not Times.

## 4 · @font-face (self-hosted, variable where available)

Self-host the WOFF2 in `fonts/` (do **not** rely on a third-party CDN — sovereignty). Use
`font-display: swap` so text is visible during load (accessibility: never invisible text).

```css
/* Inter (variable) */
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 100 900;            /* variable axis */
  font-display: swap;
  src: url("../fonts/Inter-Variable.woff2") format("woff2");
}
/* IBM Plex Sans (static weights 400/600/700) */
@font-face {
  font-family: "IBM Plex Sans"; font-style: normal; font-weight: 400; font-display: swap;
  src: url("../fonts/IBMPlexSans-Regular.woff2") format("woff2");
}
@font-face {
  font-family: "IBM Plex Sans"; font-style: normal; font-weight: 600; font-display: swap;
  src: url("../fonts/IBMPlexSans-SemiBold.woff2") format("woff2");
}
@font-face {
  font-family: "IBM Plex Sans"; font-style: normal; font-weight: 700; font-display: swap;
  src: url("../fonts/IBMPlexSans-Bold.woff2") format("woff2");
}
/* JetBrains Mono (variable) */
@font-face {
  font-family: "JetBrains Mono"; font-style: normal; font-weight: 100 800; font-display: swap;
  src: url("../fonts/JetBrainsMono-Variable.woff2") format("woff2");
}
```

### Preload the critical font (body) for LCP

```html
<link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossorigin>
```

## 5 · CSS custom properties (drop-in)

```css
:root {
  --font-body: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-heading: "IBM Plex Sans", "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace;
  --font-display: "IBM Plex Sans", "Inter", system-ui, sans-serif;

  --text-xs: 0.75rem;  --text-sm: 0.875rem; --text-base: 1rem;   --text-lg: 1.25rem;
  --text-xl: 1.563rem; --text-2xl: 1.953rem; --text-3xl: 2.441rem;
  --text-4xl: 3.052rem; --text-5xl: 3.815rem;

  --leading-tight: 1.1; --leading-snug: 1.2; --leading-normal: 1.6; --leading-mono: 1.5;
  --tracking-tight: -0.01em; --tracking-caps: 0.08em;
  --weight-regular: 400; --weight-medium: 500; --weight-semibold: 600; --weight-bold: 700;
}
body { font-family: var(--font-body); font-size: var(--text-base); line-height: var(--leading-normal); }
h1 { font-family: var(--font-display); font-size: var(--text-4xl); line-height: var(--leading-tight); letter-spacing: var(--tracking-tight); font-weight: var(--weight-bold); }
h2 { font-family: var(--font-heading); font-size: var(--text-3xl); line-height: var(--leading-snug); font-weight: var(--weight-semibold); }
h3 { font-family: var(--font-heading); font-size: var(--text-2xl); line-height: var(--leading-snug); font-weight: var(--weight-semibold); }
code, kbd, samp, .receipt-hash { font-family: var(--font-mono); font-size: var(--text-sm); line-height: var(--leading-mono); }
```

## 6 · Accessibility notes

- Minimum body size 16px; never below 12px (mono captions only).
- `font-display: swap` — text always visible during load.
- Mono used for hashes/IDs so `0/O` and `1/l/I` are unambiguous in audit data.
- Line length target 60–75ch for body copy.
- Respect `prefers-reduced-motion` for any animated type.

— Yachay, 2026-06-01. All families SIL OFL 1.1; no proprietary licensing; no mystical content.
