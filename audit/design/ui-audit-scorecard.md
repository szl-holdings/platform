# UI Audit Scorecard — Design System v2 Pass
**Date:** April 2026
**Auditor:** Design system pass (Rehaul 7/9)
**Scoring:** 1–5 per dimension. 5 = excellent/compliant. 1 = significant debt.

Dimensions:
- **Typography** — scale discipline, font consistency, max heading size
- **Spacing** — density-appropriate rhythm, token-based values
- **Color Discipline** — no raw hex outside token system, no neon in product UX
- **Hierarchy** — clear visual priority, restrained emphasis
- **Motion** — ≤200ms, no decorative animations, reduced-motion respected
- **Nav** — consistent navigation pattern, density-aware
- **States** — empty/loading/error states implemented and consistent

---

## Web Artifacts

### SZL Holdings Dashboard (`/`)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Typography | 4 | Space Grotesk for headings (de-facto standard, documented). Raw hex `#d4bc7a`, `#6ea8d8` for accent variants — minor drift. |
| Spacing | 4 | Mostly token-based. Some raw `clamp()` for marketing section gaps — acceptable for landing use. |
| Color Discipline | 3 | Publication palette (#c9b787 used uniformly for non-SZL domains instead of per-product accents). Raw hex for accent light/muted variants. |
| Hierarchy | 4 | Clear page structure. Hero typography large but appropriate for marketing surface. |
| Motion | 4 | Transitions ≤200ms. Reduced-motion CSS present. |
| Nav | 4 | Command/portfolio nav pattern. Clean. |
| States | 3 | Limited empty/loading state treatment on data sections. |
| **Overall** | **3.7** | |

### Command (`/command/`)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Typography | 5 | Space Grotesk headings. Body 13px Inter. Heading sizes ≤20px. |
| Spacing | 5 | Dense/compact density modes applied. Good rhythm. |
| Color Discipline | 5 | gi-tokens direct usage. Product accent vars from `--color-*` map aligned to gi-tokens. |
| Hierarchy | 5 | Strong signal vs noise. Clean information architecture. |
| Motion | 5 | 150ms transitions. Reduced-motion CSS present. |
| Nav | 5 | AppShell + SideNav pattern. Consistent with design system. |
| States | 4 | EmptyState and error states present. Loading skeletons could be more consistent. |
| **Overall** | **4.9** | Best-in-class command surface. |

### Pulse (`/pulse/`)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Typography | 4 | Crimson Pro for editorial prose — intentional exception. `0.65rem` label (too small at 10.4px). |
| Spacing | 4 | gi-tokens via local aliases. Some raw spacing in prose sections. |
| Color Discipline | 4 | Local `--pulse-*` vars correctly reference gi-tokens. Some raw rgba alpha values. |
| Hierarchy | 5 | Excellent editorial hierarchy. Classification bar adds institutional gravitas. |
| Motion | 4 | `animate-fadeIn` reduced from 300ms to 200ms. `live-pulse` at 2s is acceptable loop. |
| Nav | 4 | Sidebar with active states. |
| States | 4 | Good use of confidence color tokens for AI evidence. |
| **Overall** | **4.1** | Motion budget now met. |

### Sentra (`/sentra/`)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Typography | 4 | Space Grotesk. Heading sizes ≤xl. |
| Spacing | 4 | shadcn HSL bridge. Density vars not yet linked. |
| Color Discipline | 4 | HSL bridge maps cleanly to gi-accent-red. Shadow vars added. |
| Hierarchy | 4 | Red accent used appropriately for threat classification. |
| Motion | 5 | 150ms transitions. Reduced-motion present. |
| Nav | 4 | Consistent sidebar pattern. |
| States | 4 | Panel + card hover states consistent. |
| **Overall** | **4.2** | Solid. HSL bridge adds minor abstraction overhead. |

### Vessels (`/vessels/`)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Typography | 4 | Space Grotesk. Body Inter. Sizes within scale. |
| Spacing | 4 | shadcn HSL bridge + local product tokens. |
| Color Discipline | 5 | All `#0ea5e9` / sky-* replaced with `#4d8fcc` (gi-accent-blue) across all ~40 source files. API payloads centralized in `domain-colors.ts`. Zero off-token neon remaining. |
| Hierarchy | 4 | Maritime domain accents appropriate. Map canvas uses enterprise blue now. |
| Motion | 4 | Page transitions 150ms. Canvas animations are non-interactive. |
| Nav | 4 | Consistent sidebar + top bar. |
| States | 4 | Hover, active, and severity states all using token-referenced colors. |
| **Overall** | **4.4** | Color discipline fully resolved in this pass. |

### Lyte (`/lyte/`)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Typography | 4 | Space Grotesk. |
| Spacing | 4 | HSL bridge. Density-aware in principle. |
| Color Discipline | 5 | `--lyte-amber/gold` → `var(--gi-accent-amber)`. `--lyte-critical/ok/info` → gi semantic tokens. All `#c9b787` replaced with `#c9a85c` across component files. Focus ring and ::selection updated. |
| Hierarchy | 4 | Severity levels now visually distinct: red (critical), amber (warn), green (ok), blue (info). |
| Motion | 5 | Transitions ≤200ms. |
| Nav | 4 | Consistent pattern. |
| States | 4 | `.status-*` classes rewritten with semantic background+border tints. `.proof-badge` uses `--gi-text-muted`. |
| **Overall** | **4.3** | Severity semantics fully restored. Residual: density token linking. |

### Terra (`/terra/`)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Typography | 4 | Space Grotesk + Inter. |
| Spacing | 4 | HSL bridge. Local product tokens reference gi-tokens. |
| Color Discipline | 3 | Raw hex `#3a8060` (darker green), `#9a7840` (darker amber) used in theme inline. These are accessible variants but outside the token system. |
| Hierarchy | 4 | Green accent appropriate for real estate/growth domain. |
| Motion | 4 | Slide animations at 320–350ms — slightly over budget for interactive elements but within page-transition tolerance. |
| Nav | 4 | Consistent. |
| States | 4 | Good error/loading handling. |
| **Overall** | **3.8** | Raw hex variants in theme block are the main debt. |

### Counsel (`/counsel/`)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Typography | 4 | Space Grotesk + Inter. |
| Spacing | 4 | HSL bridge maps cleanly. |
| Color Discipline | 4 | Violet HSL bridge correctly maps to `gi-accent-violet`. |
| Hierarchy | 4 | Legal matter hierarchy is clear. |
| Motion | 5 | Transitions clean. |
| Nav | 4 | Standard sidebar. |
| States | 4 | Good matter-state handling. |
| **Overall** | **4.1** | Clean. Minimal debt. |

### Aegis (`/aegis/`)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Typography | 4 | Space Grotesk. Clean sizing. |
| Spacing | 5 | Direct gi-tokens. Well-structured. |
| Color Discipline | 4 | Mostly gi-tokens. Some raw hex in chart series data. |
| Hierarchy | 4 | Defense/intelligence theme. Appropriate gravity. |
| Motion | 4 | Slide animation at 350ms — borderline. |
| Nav | 4 | Standard AppShell. |
| States | 4 | Good threat state handling. |
| **Overall** | **4.2** | |

### Carlota Jo (`/carlota-jo/`)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Typography | 5 | Intentional brand exception (Cormorant Garamond). Fully documented. |
| Spacing | 4 | Token-based. Some raw rem values in prose. |
| Color Discipline | 4 | Own stone/cream palette as documented exception. Raw hex in stone scale — acceptable as self-contained brand system. |
| Hierarchy | 5 | Excellent editorial hierarchy. Gold accent restrained. |
| Motion | 4 | Transitions short. |
| Nav | 4 | Minimal, editorial-style nav. |
| States | 3 | Limited empty/error state treatment. |
| **Overall** | **4.1** | Intentional exception — score reflects compliance with its own brand system. |

---

## Mobile (`szl-holdings-mobile`)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Typography | 4 | React Native system fonts. Enterprise accent family used via `gi-bridge`. |
| Spacing | 4 | Own layout tokens. Aligned conceptually to 8pt grid. |
| Color Discipline | 4 | gi-bridge imports gi-tokens correctly. Light (day) mode uses manually-tuned WCAG AA variants — tracked as known divergence until gi-light-mode token parity. |
| Hierarchy | 4 | KPI cards, audit trails readable. |
| Motion | 4 | React Native Animated — within budget. |
| Nav | 4 | Bottom tab pattern appropriate. |
| States | 4 | Loading/skeleton states present. |
| **Overall** | **4.0** | Mobile shell is well-aligned. Light mode tokens need eventual parity with gi-light. |

---

## Summary Table

| Artifact | Typo | Space | Color | Hierarchy | Motion | Nav | States | **Avg** |
|---------|------|-------|-------|-----------|--------|-----|--------|---------|
| SZL Holdings | 4 | 4 | 3 | 4 | 4 | 4 | 3 | 3.7 |
| Command | 5 | 5 | 5 | 5 | 5 | 5 | 4 | **4.9** |
| Pulse | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 4.1 |
| Sentra | 4 | 4 | 4 | 4 | 5 | 4 | 4 | 4.2 |
| Vessels | 4 | 4 | 5 | 4 | 4 | 4 | 4 | 4.4 |
| Lyte | 4 | 4 | 5 | 4 | 5 | 4 | 4 | 4.3 |
| Terra | 4 | 4 | 3 | 4 | 4 | 4 | 4 | 3.8 |
| Counsel | 4 | 4 | 4 | 4 | 5 | 4 | 4 | 4.1 |
| Aegis | 4 | 5 | 4 | 4 | 4 | 4 | 4 | 4.2 |
| Carlota Jo | 5 | 4 | 4 | 5 | 4 | 4 | 3 | 4.1 |
| Mobile | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4.0 |
| **Platform avg** | **4.2** | **4.2** | **4.1** | **4.3** | **4.4** | **4.1** | **3.8** | **4.2** |

**Weakest dimensions platform-wide:** States (3.8) and Holdings/Terra color discipline (3). Primary target for follow-on pass: Holdings domain-pack color differentiation (VD-020/021).
