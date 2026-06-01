# A11OY (+ flagship) Brand Integration Patch

**Goal:** make every flagship surface consume the canonical KANCHAY tokens.
**Method:** **CSS-ONLY, ADDITIVE** — two new stylesheets per Space + one `<head>` link injection.
**Pushed via:** `HfApi.upload_file` (direct), signed Yachay, ORCID 0009-0001-0110-4173.
**Hard rule honored:** the HF banner, the 5 painterly hero avatars, and the animated emojis on
the org card are **NOT touched** — only the CSS layer (+ an appended README Brand section).

## What the patch adds (per Space)

1. **`brand-tokens.css`** — the canonical palette + component tokens (color/space/radius/shadow/
   motion/z-index), self-contained, no third-party CDN. Identical bytes to
   `tokens/COLOR_TOKENS.css` + `tokens/COMPONENT_TOKENS.css`.
2. **`brand-bridge.css`** — re-points each Space's *existing* local CSS variables at the canonical
   tokens (variables only; no markup/layout/font changes):

   ```css
   :root {
     --ground: var(--color-a11oy-bg);      /* was #0a0a0a */
     --gold:   var(--color-hatun-300);     /* was #c9b787 */
     --cream:  var(--color-a11oy-text);    /* was #f5f5f5 */
     --live:   var(--color-success);       /* was #5a8a6e */
     /* + the --color-a11oy-* vars the React console referenced but upstream never defined */
   }
   ```
3. **`<head>` link injection** — two lines added immediately before `</head>`, *after* the Space's
   own stylesheet (so the bridge wins by cascade order). Idempotent (guarded by a `brand-tokens.css`
   marker), so re-runs are no-ops:

   ```html
   <link rel="stylesheet" href="brand-tokens.css"/>
   <link rel="stylesheet" href="brand-bridge.css"/>
   ```

### Why this is additive and safe

- The a11oy React console references `--color-a11oy-navy/-blue/-gold-dim/-gold-soft` etc. but those
  variables were **never defined upstream** (verified: no `:root` defines them in the repo). The
  bridge *defines* them for the first time — strictly additive, fixing latent gaps.
- The a11oy landing `style.css` defines `--ground/--gold/--cream/...`; the bridge re-points them to
  canonical equivalents that are visually near-identical (gold `#c9b787 → hatun-300 #d7b96b`, navy
  `#0a0a0a → #0a0f1e`) and **WCAG-AA-verified**. No selectors, markup, or fonts change.
- The patch never edits the HF banner image, the hero `<img>` avatar row, or the emoji frontmatter.

## Per-flagship application (pushed)

| Space | Token files | HTML patched |
|---|---|---|
| **a11oy** | `brand-tokens.css`, `brand-bridge.css` | `index.html` (2 links before `</head>`) |
| **amaru** | `static/brand-tokens.css`, `static/brand-bridge.css` | `static/index.html` |
| **sentra** | `brand-tokens.css`, `brand-bridge.css` | `index.html` |
| **killinchu** | `static/brand-tokens.css`, `static/brand-bridge.css` | `static/index.html` |
| **rosie** | `brand-tokens.css`, `brand-bridge.css` | docker-only (no static HTML); token files uploaded for downstream consumption |
| **anatomy-3d** | `brand-tokens.css`, `brand-bridge.css` | `index.html` |
| **rosie-3d** | `brand-tokens.css`, `brand-bridge.css` | `index.html` |

## Org card (SZLHOLDINGS/README)

**Appended** a single `## Brand (KANCHAY)` section linking to `szl-holdings/brand-kit`. The banner
image, all six hero-avatar `<img>` links, and the `emoji: 🦸` frontmatter are **verified untouched**
(post-push check: emoji present, banner present, 6 avatars present, frontmatter intact).

## SHAs (before → after)

See `HF_PUSH_RESULTS.json` for the full machine record. Summary:

| Space | before | after |
|---|---|---|
| a11oy | `f1e76d01…` | `10d348ee…` |
| amaru | `f691f28e…` | `47c85596…` |
| sentra | `c2add269…` | `649fd750…` |
| killinchu | `43e422fc…` | `1f56eb89…` |
| rosie | `dd04b8fc…` | `a7794aac…` |
| anatomy-3d | `8c30023f…` | `fb6b9142…` |
| rosie-3d | `cc114139…` | `b2d27bf6…` |
| README | `0e9b9630…` | `c00b12a5…` |

## Compliance

ADDITIVE only · no v11 LOCKED number changed · DSSE PLACEHOLDER / SLSA L1 / Conjecture-1 honesty
preserved · no banned token in any pushed content · open-source fonts only (the patch does not add
or change fonts). Signed Yachay, 2026-06-01.
