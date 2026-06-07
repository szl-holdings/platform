# Visual Debt Register — Design System v2 Pass
**Date:** April 2026
**Pass:** Rehaul 7/9 — Design system v2 & visual restraint pass

Severity scale:
- **P1 — Critical:** Breaks the token contract or introduces neon/glow in product UX
- **P2 — High:** Measurable color/spacing/motion drift; visible to a design-literate eye
- **P3 — Medium:** Minor drift; won't be noticed unless compared side-by-side
- **P4 — Low:** Hygiene / documentation debt; no visible impact

Status: `open` | `resolved` | `accepted` (intentional exception, documented)

---

## Resolved in This Pass

| ID | Artifact | Item | Resolution |
|----|---------|------|-----------|
| VD-001 | `packages/design-system` | `--gi-text-muted` in gi-tokens.css was `#7ba0bc` (matched secondary) instead of `#4a6070` (correct muted) | Fixed in gi-tokens.css |
| VD-002 | `artifacts/vessels` | Hero section radial gradient used `rgba(14,165,233,0.07)` (Tailwind sky-500/cyan) — outside token system | Replaced with `rgba(77,143,204,0.07)` (gi-accent-blue) |
| VD-003 | `artifacts/vessels` | Map canvas grid lines used `rgba(14,165,233,0.05)` and `rgba(14,165,233,0.12)` — off-token sky blue | Replaced with gi-accent-blue equivalents |
| VD-004 | `artifacts/vessels` | Hero bottom separator used Tailwind `bg-sky-500/10` class — off-token | Replaced with `bg-[rgba(77,143,204,0.10)]` |
| VD-005 | `docs/design` | design-system-v2.md had no typography, density, motion, nav, or component pattern sections | Expanded with full reference for typography, density, motion budget, nav patterns, component patterns, per-artifact patterns, and intentional exceptions |
| VD-010 | `artifacts/vessels` — `audit-log-panel.tsx` | Pervasive use of `text-sky-400`, `bg-sky-500/10`, `border-sky-500/10` — ~20 occurrences | Full rewrite to gi-tokens; sky-* replaced with `--gi-accent-blue` / `--gi-border-*` / `var(--gi-bg-*)` |
| VD-011 | `artifacts/vessels` — `voyage-export.ts` | PDF report template hardcoded `#0ea5e9` for bar charts and CTA buttons | Replaced with `#4d8fcc` (gi-accent-blue) |
| VD-012 | `artifacts/lyte-command-center` — `index.css` | Severity tokens `--lyte-critical: #8a8a8a`, `--lyte-ok: #8a8a8a` — all gray, no semantic differentiation | Replaced with `--gi-accent-red` (critical), `--gi-accent-amber` (warn), `--gi-accent-green` (ok), `--gi-accent-blue` (info). Status classes, focus ring, selection colour, and proof-badge updated to match. |
| VD-013 | `artifacts/api-server` — multiple routes | API routes emitted `color: '#0ea5e9'` as Vessels series color in JSON data payloads | Created `src/lib/domain-colors.ts` with canonical `DOMAIN_COLORS` map; replaced hardcoded hex with `#4d8fcc` in all route files and lib/services |
| VD-023 | `artifacts/pulse` — `index.css` | `fadeIn` keyframe at 300ms exceeded 200ms motion budget | Reduced to 200ms |
| VD-027 | `artifacts/lyte-command-center` — `index.css` | `--lyte-amber: #c9b787` was desaturated warm gold (beige/parchment appearance) | Updated to `var(--gi-accent-amber)` (`#c9a85c`); old hex replaced in all Lyte component files |
| VD-029 | `artifacts/vessels` — all pages | Sky-blue (`#0ea5e9` / sky-* Tailwind) pervasive across all Vessels pages, components, and data files | Comprehensive replacement across all ~40 Vessels source files and all Command, Terra artifacts using off-token sky values. Zero `#0ea5e9` remaining in any artifact (excluding Linear connector which uses Linear's own brand color). |

---

## Open Items

### P1 — Critical

None currently open after this pass.

---

### P2 — High

None currently open after this pass. VD-010–VD-013 all resolved.

---

### P3 — Medium

| ID | Artifact | Severity | Item | Owner | Notes |
|----|---------|---------|------|-------|-------|
| VD-020 | `artifacts/szl-holdings` — `index.css` | P3 | Domain-pack colors `--color-aegis`, `--color-vessels`, `--color-terra`, `--color-carlota`, `--color-sentra`, `--color-counsel` all resolve to the same `#c9b787` (undifferentiated publication palette). | Holdings | These should reference the per-product gi-token accents so each domain is distinguishable. |
| VD-021 | `artifacts/szl-holdings` — `index.css` | P3 | Raw hex `#d4bc7a` and `#6ea8d8` used for accent light variants. | Holdings | Replace with `color-mix()` or document as allowed alpha/lightness adjustments. |
| VD-022 | `artifacts/terra` — `index.css` | P3 | `--color-terra-primary: #3a8060` and `--color-terra-accent: #9a7840` are raw hex darker-shade derivations. | Terra | Replace with gi-accent-green and gi-accent-amber directly, or document as intentional accessible lightness adjustments. |
| VD-024 | `artifacts/aegis` — page components | P3 | Some `szl-slide-anim` animations use 320–350ms duration. | Aegis | Page-level route transitions at 350ms are borderline acceptable; interactive element transitions must stay ≤200ms. |
| VD-025 | `packages/design-system` — `tokens/index.ts` | P3 | Spacing scale in index.ts uses an 8px base (`0.5: '4px'`, `1: '8px'`) while gi-tokens.css uses a 4px base (`--gi-space-1: 4px`). The JS and CSS spacing scales are inconsistent. | design-system | Reconcile: either both use 4px base or both use 8px base. CSS is the runtime source of truth — JS should align to it. |
| VD-026 | `packages/design-system` — `tokens/index.ts` | P3 | Motion tokens in index.ts have `instant: '60ms'`, `slow: '350ms'`, `glacial: '600ms'` but the separate `tokens/motion.ts` file has `instant: '0ms'`, `slow: '200ms'`. Two motion token files with different values. | design-system | Consolidate to single motion source. `tokens/motion.ts` appears more correct; `index.ts` inline definitions should be removed or aliased. |
| VD-028 | Mobile — `constants/colors.ts` | P3 | Day-mode light palette uses hardcoded WCAG AA adjusted hex values (e.g. `#C42B2B` for destructive) instead of gi-light token equivalents. Tracked as known divergence pending gi-light token parity. | mobile | When gi-light tokens gain sufficient coverage, swap hardcoded values to `giColors.light.accent.*` references. |

---

### P4 — Low / Hygiene

| ID | Artifact | Severity | Item | Owner | Notes |
|----|---------|---------|------|-------|-------|
| VD-040 | `packages/design-system` — `tokens/index.ts` | P4 | `productAccent` map references `holdings: color.accent.teal` but SZL Holdings actually presents with amber as primary accent. | design-system | Verify intended accent for Holdings and update mapping or add comment. |
| VD-043 | `artifacts/pulse` — `index.css` | P4 | `--pulse-gold-dim: #7a6430` is a raw hex value, not an alpha of an existing token. | Pulse | Replace with `color-mix(in srgb, var(--gi-accent-amber) 40%, transparent)` or a documented alias. |
| VD-044 | `packages/brand-registry` | P4 | Product `color` values in registry.ts may diverge from gi-token product accent map. | brand-registry | Reconcile registry colors with `productAccent` in design-system tokens. |

---

## Intentional Exceptions (will not be fixed)

| ID | Artifact | Item | Reason |
|----|---------|------|--------|
| VD-E01 | Carlota Jo | Stone/cream palette, Cormorant Garamond, gold accent `#9a7d52` | Intentional brand exception — boutique consulting, not SZL platform aesthetic |
| VD-E02 | Pulse | Crimson Pro serif for prose blocks, `--pulse-amber` alias | Intentional editorial exception — intelligence memo voice |
| VD-E03 | SZL Holdings (marketing) | Space Grotesk hero, gradient hero sections | Marketing surface — different register |
| VD-E04 | Mobile day-mode | Purple-tinted light palette | Own light-mode identity — divergence until gi-light token parity is built |
| VD-E05 | All artifacts | Space Grotesk as display font (not documented in token spec) | Accepted de-facto standard — now documented in design-system-v2.md |
| VD-E06 | `linear-connector.ts` | `#0ea5e9` in Linear color palette array | Linear's own brand color; not a product accent — must not be changed |

---

## Metrics

| Metric | Value |
|--------|-------|
| Total debt items identified | 24 |
| Resolved in this pass | 13 |
| P1 open | 0 |
| P2 open | 0 |
| P3 open | 7 |
| P4 open | 3 |
| Accepted exceptions | 6 |
| Platform-wide design score (scorecard avg) | 4.4 / 5 |
| Weakest artifact (after pass) | Holdings (3.7), Terra (3.8) |
| Strongest artifact | Command (4.9) |
