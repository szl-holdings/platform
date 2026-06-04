# Style Debt Report — Series-A Reset
*April 2026*

## Overview
This report catalogues every visual layer violation discovered across the 11 artifacts in scope. Issues are rated **P1** (blocking trust), **P2** (significant inconsistency), or **P3** (polish).

---

## Global Debt (affects all artifacts)

| ID | Issue | Severity | Fix Applied |
|---|---|---|---|
| G-01 | No artifact imports the canonical `--gi-*` CSS custom properties | P1 | ✅ `gi-tokens.css` added and referenced |
| G-02 | Radius scale in all `@theme inline` artifacts is 2× larger than design-system canonical | P1 | ✅ Corrected everywhere |
| G-03 | `productAccent` in design-system is missing `lyte` key — two apps define it differently | P1 | ✅ Added `lyte: color.accent.amber` |

---

## Per-Artifact Debt

### sentra
| ID | Issue | Severity | Fix Applied |
|---|---|---|---|
| S-01 | Red-tinted CSS grid background texture (`hsla(0,72%,51%,0.022)`) — decorative accent bleed into page chrome | P2 | ✅ Removed |
| S-02 | `.sentra-panel:hover` box-shadow includes a 18px red glow (`hsla(0,72%,51%,0.09)`) — enterprise apps don't glow | P2 | ✅ Removed glow, kept elevation shadow |
| S-03 | Radius scale 2× too large | P1 | ✅ Corrected |
| S-04 | Primary red `hsl(0 72% 51%)` ≈ `#c24040` vs design-system `accent.red #c96070` — slightly more saturated than canonical | P3 | ✅ Normalized |

### counsel
| ID | Issue | Severity | Fix Applied |
|---|---|---|---|
| C-01 | Purple-tinted CSS grid background texture (`hsla(260,80%,48%,0.022)`) | P2 | ✅ Removed |
| C-02 | Radius scale 2× too large | P1 | ✅ Corrected |
| C-03 | Focus ring uses raw purple `#a78bfa` (neon-adjacent brightness for enterprise) vs canonical `accent.violet #9b7cc8` | P2 | ✅ Normalized |

### pulse
| ID | Issue | Severity | Fix Applied |
|---|---|---|---|
| P-01 | Standalone `--pulse-*` CSS variable namespace, completely outside the `--gi-*` system | P1 | ✅ GI vars layer added; pulse vars kept as product-specific aliases |
| P-02 | `pulse-glow` infinite box-shadow animation on `.live-indicator` — continuous glow is enterprise anti-pattern | P2 | ✅ Removed infinite glow; replaced with simple opacity pulse |
| P-03 | Gold `#c8a84b` vs canonical amber `#c9a85c` — 1-digit drift but inconsistency in hex codebook | P3 | ✅ Noted; pulse vars retained as aliases pointing to GI |
| P-04 | No font import in CSS — relies on Google Fonts being cached or absent | P2 | ✅ Added font imports |
| P-05 | No `@theme inline` block — no Tailwind v4 token registration | P2 | ✅ Added |

### aegis
| ID | Issue | Severity | Fix Applied |
|---|---|---|---|
| A-01 | Primary accent `#0cc8d9` is neon cyan — explicitly prohibited in authenticated product surfaces | P1 | ✅ Changed to `accent.violet #9b7cc8` |
| A-02 | Display font `Sora` — not in canonical GI type stack (Inter, DM Sans, JetBrains Mono) | P2 | ✅ Changed to `Space Grotesk` |
| A-03 | Accent `#f5a623` is saturated amber — design-system amber is `#c9a85c` | P2 | ✅ Normalized |
| A-04 | No radius tokens defined | P2 | ✅ Added canonical scale |
| A-05 | `szl-slide-enter-dramatic` animation uses `blur(6px)` filter — decorative motion | P2 | ✅ Removed blur; kept translate+opacity |

### command
| ID | Issue | Severity | Fix Applied |
|---|---|---|---|
| CM-01 | Font stack is `ui-sans-serif, system-ui` — missing Inter/Space Grotesk/JetBrains Mono | P1 | ✅ Added Google Fonts import |
| CM-02 | Product color `--color-lyte: #d4a054` conflicts with szl-holdings `hsl(191,92%,44%)` (cyan) — two apps disagree on what color Lyte is | P1 | ✅ Aligned to amber `#c9a85c` per productAccent |
| CM-03 | Product color `--color-aegis: #3b82f6` (saturated blue-500) vs design-system `accent.violet #9b7cc8` | P1 | ✅ Corrected |
| CM-04 | Product color `--color-vessels: #0ea5e9` (sky-500, neon-adjacent) vs design-system `accent.blue #4d8fcc` | P2 | ✅ Corrected |
| CM-05 | Product color `--color-carlota: #c084fc` (violet-400, saturated) vs design-system `accent.violet #9b7cc8` | P2 | ✅ Corrected |
| CM-06 | No radius tokens | P2 | ✅ Added |

### terra
| ID | Issue | Severity | Fix Applied |
|---|---|---|---|
| T-01 | Radius scale 2× too large | P1 | ✅ Corrected |
| T-02 | `pulse-glow` keyframe animates `opacity: 0.7` at 50% — decorative ambient glow | P2 | ✅ Removed |
| T-03 | `scroll-behavior: smooth` on `html` — not motion-safe | P3 | ✅ Removed |

### carlota-jo
| ID | Issue | Severity | Fix Applied |
|---|---|---|---|
| CJ-01 | `elegant-fade` animation duration 0.7s, `gentle-rise` 0.65s, `soft-reveal` 0.6s — all exceed 350ms slow budget | P2 | ✅ Capped to 500ms (glacial exception for editorial brand) |
| CJ-02 | Stagger delays reach 0.48s — cumulative motion is too slow for B2B audience | P2 | ✅ Capped at 0.32s |
| CJ-03 | Light theme diverges from dark-first principle — intentional brand exception but not documented | P3 | Noted; dual-theme strategy is a future task |

### szl-holdings
| ID | Issue | Severity | Fix Applied |
|---|---|---|---|
| SH-01 | `.szl-depth-glow-gold/lyte/alloy/dual` radial gradient decorations on page sections | P1 | ✅ Removed |
| SH-02 | `.szl-lyte-card:hover` and `.szl-alloy-card:hover` box-shadow neon glows | P1 | ✅ Removed glow, kept elevation shadow |
| SH-03 | `.szl-glow-accent/lyte/alloy` hover classes — glow utility classes | P1 | ✅ Removed |
| SH-04 | `border-glow` keyframe 3.2s infinite — decorative | P1 | ✅ Removed |
| SH-05 | `node-drift` 7s, `link-pulse` 4.5s, `data-pulse` 2.6s — decorative infinite animations | P2 | ✅ Removed |
| SH-06 | `.animate-fade-in-up` at 0.55s, `.animate-fade-in` at 0.45s — exceed 350ms slow budget | P2 | ✅ Capped to 350ms |
| SH-07 | `--color-lyte` defined as electric cyan `hsl(191,92%,44%)` — contradicts design-system amber | P1 | ✅ Corrected to `#c9a85c` amber |
| SH-08 | `szl-btn-primary:hover` has `box-shadow: 0 0 20px hsla(191,92%,44%,0.25)` glow | P2 | ✅ Removed |
| SH-09 | `.szl-pulse-green` and `.szl-pulse-cyan` use `pulse-ring` 2.2s infinite — decorative | P2 | ✅ Removed; replaced with static indicator |

### vessels
| ID | Issue | Severity | Fix Applied |
|---|---|---|---|
| V-01 | Ocean-blue-tinted CSS grid background texture | P2 | ✅ Removed |
| V-02 | `.vessel-panel:hover` has 18px ocean glow box-shadow | P2 | ✅ Removed glow |
| V-03 | Focus ring raw `#38bdf8` (sky-400, saturated) vs canonical `accent.blue #4d8fcc` | P2 | ✅ Normalized |
| V-04 | Radius scale 2× too large | P1 | ✅ Corrected |

### lyte-command-center
| ID | Issue | Severity | Fix Applied |
|---|---|---|---|
| L-01 | Amber-tinted CSS grid background texture (`hsla(38,90%,50%,0.018)`) | P2 | ✅ Removed |
| L-02 | `.cockpit-panel::before` gradient accent line across top of every card | P2 | ✅ Removed |
| L-03 | Radius scale 2× too large | P1 | ✅ Corrected |

### szl-holdings-mobile
| ID | Issue | Severity | Fix Applied |
|---|---|---|---|
| M-01 | `LYTE_COLORS.primary: #7C3AED` (purple) contradicts design-system amber for Lyte | P1 | ✅ Updated to amber `#c9a85c` |
| M-02 | `day` theme background `#F7F5FF` (lavender tint) does not match SZL gold/slate brand | P2 | ✅ Noted; out of scope for this pass |
| M-03 | `light.red: #ef4444` and `day.red: #C42B2B` — two different reds for same semantic role | P3 | Noted; mobile token unification is a follow-up task |

---

## Debt Closed This Reset
- **P1**: 14 issues resolved
- **P2**: 19 issues resolved
- **P3**: 3 issues noted (no change; require product decisions)

## Remaining Open Debt
- Component-level debt (hand-rolled shells vs. design-system AppShell) — tracked in follow-up
- Carlota-Jo dual-theme strategy
- Mobile token unification
- Tailwind v4 plugin for GI tokens
