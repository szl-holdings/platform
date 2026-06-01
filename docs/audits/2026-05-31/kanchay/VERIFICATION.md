# KANCHAY — VERIFICATION

**Signed:** Yachay, 2026-06-01. ADDITIVE only; no v11 LOCKED number changed.
Evidence files in `verify/`. HF push record in `HF_PUSH_RESULTS.json`; GitHub in `PUSH_LOG.md`.

## 1 · Visual diff (a11oy landing, before vs after brand integration)

Rendered locally from the live `SZLHOLDINGS/a11oy` `index.html` + `style.css`, once **without**
the brand bridge (before) and once **with** `brand-tokens.css` + `brand-bridge.css` (after).

| | file |
|---|---|
| Before | `verify/a11oy_before.png` |
| After | `verify/a11oy_after.png` |
| Components (token proof, 3 stacks share these tokens) | `verify/components.png` |

**Result:** layout, copy, type, and design language are **pixel-equivalent**; the only change is
that color values now resolve through canonical tokens (background → canonical navy `#0a0f1e`,
gold → `hatun-300`, success → canonical `success`). The patch is non-destructive: it re-points
existing CSS custom properties, touching no markup, no fonts, no images, no banner, no avatars,
no emoji. The `components.png` shows the same tokens driving button/card/alert across the HTML,
React, and Vue example stacks (identical visual output, honest copy: "DSSE PLACEHOLDER",
"Conjecture 1 (open)").

## 2 · Accessibility scores (axe-core 4.10.2, WCAG 2.0/2.1 A + AA)

Run in headless Chromium against the rendered pages. Full JSON: `verify/axe_results.json`.

| Page | Violations | of which color-contrast (nodes) | Passes |
|---|---:|---:|---:|
| a11oy **before** | 2 | 3 | 20 |
| a11oy **after** | 2 | 3 | 20 |
| **KANCHAY components** | **0** | **0** | 9 |

**Reading the numbers honestly:**
- **before == after** on a11oy → the brand patch introduces **zero** new accessibility
  regressions (it does not change the offending elements).
- The 2 pre-existing a11oy violations are in the **original markup the patch does not touch**:
  (a) one `aria-prohibited-attr`, and (b) 3 low-contrast nodes — the decorative hero-rail labels
  styled with the Space's own `--dim`/`--muted` grays (`#555/#888`). These pre-date KANCHAY.
- The **KANCHAY component system itself has 0 violations and 0 contrast failures** — when surfaces
  use the canonical tokens as designed, they are WCAG AA conformant. This is the standard the
  brand kit holds.

**Recommended (additive) follow-up** to clear the 3 pre-existing a11oy contrast nodes: remap the
Space's `--dim`/`--muted` to `gray-400` (`#76859b`, 5.09:1 on navy — AA large) in `brand-bridge.css`.
Left out of this push to keep the patch strictly variable-equivalent; flagged for the integration agent.

## 3 · Token-level WCAG AA (independent of any page)

`tokens/COLOR_CONTRAST_REPORT.md`: **21/21** surface/foreground pairs pass WCAG AA
(17/21 also AAA). Ratios computed per the WCAG 2.1 relative-luminance formula. This is the
contrast guarantee the KAN-2 invariant (`KANCHAY_LEAN_STUB.md`) formalizes.

## 4 · HF Space SHAs (before → after)

From `HF_PUSH_RESULTS.json` (HfApi direct push):

| Space | before | after | HTML patched |
|---|---|---|---|
| a11oy | `f1e76d01cd8723b2…` | `10d348eec6a049dd…` | index.html |
| amaru | `f691f28e9d5bd3d9…` | `47c855967bb47b81…` | static/index.html |
| sentra | `c2add26940cd789a…` | `649fd750e44c45df…` | index.html |
| killinchu | `43e422fc35baea42…` | `1f56eb892b92b5f3…` | static/index.html |
| rosie | `dd04b8fc09d6d126…` | `a7794aac1b570a74…` | (docker; tokens uploaded) |
| anatomy-3d | `8c30023f30db0209…` | `fb6b9142c9ad56aa…` | index.html |
| rosie-3d | `cc11413dc908b39a…` | `b2d27bf63baf17d1…` | index.html |
| README | `0e9b96300b293dbe…` | `c00b12a5004fa174…` | Brand section appended |

## 5 · Protected-element verification (org card)

Post-push check on `SZLHOLDINGS/README/README.md`:
- `emoji 🦸` frontmatter: **present** (untouched)
- `szl_banner.png` banner image: **present** (untouched)
- hero-avatar `<img>` row: **6 avatars present** (untouched)
- frontmatter block intact; only a `## Brand (KANCHAY)` section was appended.

## 6 · GitHub brand-kit

`szl-holdings/brand-kit` created + pushed, commit `eb7c48a37258dc63…` on `main` (see `PUSH_LOG.md`),
all token/logo/font/example files verified present on the remote tree.

## 7 · Note on live-Space rebuild

These SHAs are the committed source revisions. HF rebuilds static Spaces asynchronously; the new
`brand-tokens.css` / `brand-bridge.css` and the `<head>` links are in the committed source and take
effect on the next build. No runtime behavior depends on them beyond CSS variable resolution.

— Yachay, 2026-06-01. All evidence on disk; no overclaim; DSSE PLACEHOLDER / SLSA L1 / Conjecture-1 honest.
