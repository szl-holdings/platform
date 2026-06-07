# UI Consistency Audit

**Version:** 1.0 | **Date:** April 2026 | **Scope:** All web artifacts  
**Reference:** `docs/DESIGN_SYSTEM.md`, `docs/COMMAND_UX_PATTERNS.md`

---

## Executive Summary

The AEEP platform has 10 web artifacts (excluding marketing, pitch deck, and video). A full audit of design token adherence, component consistency, navigation patterns, typography, motion, and accessibility was conducted across all surfaces. 

**Key findings:**
- All surfaces are correctly dark-first with the `color.bg.*` token family
- Neon accent palette (`accent.neon.*`) is present but properly marked deprecated; active use is concentrated in marketing and landing pages
- Display-scale text (`text-4xl` through `text-6xl`) appears broadly in marketing/landing sections but bleeds into some authenticated views
- Hard-coded inline hex values (`text-[#...]`, `bg-[#...]`) appear in approximately 20+ component files
- Framer Motion is used in multiple artifacts with decorative animations that violate the 200ms/no-decorative-motion rule
- Glow box-shadows (`0 0 20px rgba(...)`) are present in multiple surfaces
- Navigation structure varies significantly across artifacts — the canonical primary nav (Overview, Operations, Search, Workflows, Evidence, Memory, Reports, Admin) is not implemented on any surface
- Evidence-first pattern (`EvidencePanel`, traceId surfacing) coverage is partial at best
- `StatusBadge` component exists but many surfaces implement custom status coloring instead

---

## Priority Scale

| Priority | Meaning |
|---|---|
| **P1 — Critical** | Breaks enterprise visual contract; blocks enterprise buyer trust |
| **P2 — High** | Significant inconsistency visible to users across surfaces |
| **P3 — Medium** | Diverges from design system but isolated or low-visibility |
| **P4 — Low** | Minor polish; does not affect enterprise readiness |

---

## 1. Color & Accent Findings

### F-COL-01: Neon accent colors used in authenticated product views — P1

**Surfaces affected:** `artifacts/sentra`, `artifacts/lyte-command-center`, `artifacts/vessels`, `artifacts/szl-holdings`  
**Files:** Multiple component files  
**Evidence:** `accent.neon.cyan (#00d4ff)`, `accent.neon.green (#00e878)` used as primary interactive colors and glow effect sources in authenticated dashboards

**Current state:**  
```tsx
// sentra — example pattern found
className="text-cyan-400"  // maps to neon cyan
style={{ borderColor: '#00d4ff', boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)' }}
```

**Required state:**  
```tsx
className="text-[var(--gi-accent-red)]"  // sentra domain accent
// No glow box-shadow
```

**Remediation:** Replace all neon accent values with the appropriate enterprise accent for the domain. Sentra → `color.accent.red`. Vessels → `color.accent.blue`. See domain accent map in `DESIGN_SYSTEM.md §1.5`.

---

### F-COL-02: Hard-coded inline hex values in component files — P1

**Surfaces affected:** `artifacts/vessels` (20+ files), `artifacts/szl-holdings` (multiple), `artifacts/mockup-sandbox` (multiple)  
**Evidence:** `text-[#...]`, `bg-[#...]`, `border-[#...]` Tailwind JIT patterns throughout artifact components

**Current state:**
```tsx
// vessels — example patterns
className="text-[#7a99b8] bg-[#0d1520] border-[#243040]"
```

**Required state:**
```tsx
className="text-[var(--gi-text-secondary)] bg-[var(--gi-bg-surface)] border-[var(--gi-border-default)]"
// Or use token imports directly in style objects
```

**Remediation:** Systematic find-and-replace of all inline hex JIT values with CSS custom properties or token references. A lint rule should be added to prevent future occurrences.

---

### F-COL-03: Glow box-shadows in product UI — P2

**Surfaces affected:** `artifacts/sentra`, `artifacts/lyte-command-center`, `artifacts/szl-holdings`, `artifacts/vessels`  
**Evidence:** Multiple components use `boxShadow: '0 0 NNpx rgba(...)'` patterns — glow aesthetics associated with consumer/gaming UI

**Required state:** Use only `elevation.*` tokens from `packages/design-system/src/tokens/elevation.ts`. No glow or bloom shadows anywhere in authenticated product UX.

**Remediation:** Search for `0 0 [0-9]` in `boxShadow` and `box-shadow` values across all artifact source files. Replace with the appropriate `elevation.*` token.

---

### F-COL-04: Inconsistent domain accents — P2

**Surfaces affected:** `artifacts/lyte-command-center` (uses amber heavily, mixing amber and blue), `artifacts/szl-holdings` (uses investor-deck multi-color palette in operational views)

**Current state:** Lyte uses amber as primary accent correctly per the domain accent map, but also introduces blue accents inconsistently.

**Remediation:** Each domain surface must use exactly one accent from the enterprise palette. Secondary data can use `color.accent.slate` or `color.text.secondary`. No multi-accent mixing within a single domain.

---

## 2. Typography Findings

### F-TYP-01: Display-scale text in authenticated dashboards — P1

**Surfaces affected:** `artifacts/szl-holdings` (investor-relations, docs-*, platform-architecture), `artifacts/vessels` (fleet-assessment, marketing-home), `artifacts/lyte-command-center` (landing page), `artifacts/mockup-sandbox` (Home)  
**Evidence:**

| File | Class | Size |
|---|---|---|
| `szl-holdings/src/pages/docs-control-plane.tsx` | `text-5xl md:text-6xl` | 48–60px |
| `szl-holdings/src/pages/investor-relations.tsx` | `text-5xl md:text-6xl` | 48–60px |
| `vessels/src/pages/fleet-assessment.tsx` | `text-4xl sm:text-5xl md:text-6xl` | 36–60px |
| `vessels/src/pages/marketing-home.tsx` | `text-[2.5rem] sm:text-5xl` | 40–48px |
| `lyte-command-center/src/pages/landing.tsx` | `text-4xl md:text-5xl` | 36–48px |
| `mockup-sandbox/src/pages/Home.tsx` | `text-5xl` | 48px |

**Rule:** Maximum heading size in authenticated product UX is `fontSize.2xl` (20px, Tailwind `text-xl`). Text-3xl (24px) is acceptable only for metric display values in `metric` text style.

**Note:** Display sizes are appropriate on marketing/landing pages (unauthenticated). The violation is when these sizes appear in authenticated dashboard views.

**Remediation:** Audit each file to determine if the page is a marketing/landing page (acceptable) or an authenticated product view (must be capped). For authenticated views, replace display headings with `page-title` (20px) or `section-title` (14px) styles.

---

### F-TYP-02: Non-standard font stacks — P2

**Surfaces affected:** `artifacts/lyte-command-center`, `artifacts/vessels`, `artifacts/szl-holdings`  
**Evidence:** Multiple surfaces define local `font-display` custom properties or use Tailwind `font-display` utilities with locally scoped font definitions instead of the canonical `fontFamily.sans` / `fontFamily.mono` token stack.

**Remediation:** Remove all local font definitions. Use the `fontFamily.sans` stack from `packages/design-system/src/tokens/typography.ts` as the single source of truth.

---

### F-TYP-03: Inconsistent heading weight usage — P3

**Surfaces affected:** `artifacts/szl-holdings`, `artifacts/vessels`  
**Evidence:** Mix of `font-bold (700)` and `font-extrabold (800)` on headings in investor/marketing sections. Bold weight above 600 (semibold) is not in the AEEP token system.

**Remediation:** Cap heading weight at `fontWeight.semibold (600)`. `font-bold (700)` is reserved for single-word emphasis only.

---

## 3. Motion & Animation Findings

### F-MOT-01: Decorative Framer Motion in authenticated product surfaces — P2

**Surfaces affected:** `artifacts/command` (particle motion effects), `artifacts/pulse` (hero section float animations), `artifacts/szl-holdings` (entry animations on data sections)  
**Evidence:** Framer Motion variants with `initial={{ opacity: 0, y: 30 }}`, spring physics, and particle systems found in component files serving authenticated views.

**Rule:** All motion in product UX must use transitions ≤ 200ms, from the `motion.transition.*` token set. No spring, bounce, particle, or decorative float animations.

**Remediation:**
1. Remove particle effect components from authenticated views
2. Replace `initial/animate` Framer Motion patterns on data tables and card grids with CSS opacity transitions using `transition.fade`
3. Spring/physics animations → replace with `motion.easing.decelerate` cubic-bezier
4. Retain only utility transitions: drawer open/close, tab transitions, fade-in on navigation

---

### F-MOT-02: Missing prefers-reduced-motion support — P2

**Surfaces affected:** All artifacts using Framer Motion  
**Evidence:** No surfaces wrap Framer Motion usage in `useReducedMotion()` or CSS `@media (prefers-reduced-motion: reduce)` blocks.

**Remediation:** All Framer Motion animations must check `useReducedMotion()` and collapse to instant or static state when active. CSS transitions must include the standard reduced-motion media query override.

---

## 4. Navigation Findings

### F-NAV-01: Canonical primary nav not implemented on any surface — P1

**Surfaces affected:** All 10 web artifacts  
**Evidence:** Navigation structures vary significantly:
- `szl-holdings`: Custom sidebar with Holdings-specific items
- `command`: Flat top navigation
- `vessels`: Domain-specific tab navigation
- `terra`: Minimal sidebar
- `sentra`: Cybersecurity-themed sidebar
- `pulse`: Executive briefing single-page layout — no navigation structure

**Required canonical nav items:** Overview | Operations | Search | Workflows | Evidence | Memory | Reports | Admin

**Remediation:** This is a significant migration. Recommended approach:
1. Implement canonical primary nav in `SideNav` component (already scaffolded in `packages/design-system/src/shell/SideNav.tsx`)
2. Domain-specific items should be added in the Operations section
3. Migrate each surface to use `AppShell` + `SideNav` as the layout root
4. Priority order: `command` → `sentra` → `counsel` → `terra` → `vessels` → `pulse` → `szl-holdings`

---

### F-NAV-02: EcosystemNav cross-surface navigation inconsistency — P2

**Surfaces affected:** All artifacts  
**Evidence:** The `EcosystemNav` component from `lib/shared-ui` is not consistently present or styled across surfaces. Some surfaces link to the full platform, others are isolated.

**Remediation:** Standardize EcosystemNav integration in the `TopBar` component and ensure it is rendered by every `AppShell` instance.

---

### F-NAV-03: Active navigation state indicators vary by artifact — P3

**Surfaces affected:** `artifacts/vessels`, `artifacts/terra`, `artifacts/lyte-command-center`  
**Evidence:** Some surfaces use background highlight for active nav items, others use left border, others use text color change only. No uniform active state indicator exists.

**Required:** Active nav item uses left border in domain accent color — `3px solid color.accent.[domain]` — on the left edge of the nav item. Background: `color.bg.hover`. Text: `color.text.primary`.

**Remediation:** Enforce through the `SideNav` component API — active state styling should not be overridable per artifact.

---

## 5. Component Usage Findings

### F-CMP-01: Custom status coloring instead of StatusBadge — P2

**Surfaces affected:** `artifacts/vessels`, `artifacts/terra`, `artifacts/sentra`, `artifacts/counsel`  
**Evidence:** Multiple surfaces implement custom status indicators using inline Tailwind color classes (`text-green-400`, `text-red-400`, `bg-green-900`) rather than `StatusBadge`.

**Current state:**
```tsx
// vessels — example
<span className="text-green-400 font-medium">Active</span>
<span className="text-red-500">Blocked</span>
```

**Required state:**
```tsx
<StatusBadge variant="active" label="Active" />
<StatusBadge variant="error" label="Blocked" />
```

**Remediation:** Replace all custom status indicators with `StatusBadge` from `packages/design-system/src/data/StatusBadge.tsx`. Enumerate current custom patterns with a targeted search for `text-green-`, `text-red-`, `text-amber-` used as status indicators.

---

### F-CMP-02: EvidencePanel not surfaced on AI result screens — P1

**Surfaces affected:** `artifacts/vessels`, `artifacts/terra`, `artifacts/pulse`, `artifacts/command`  
**Evidence:** Traceability coverage audit (from `evolve-ui-audit.md`):

| Artifact | traceId | Citations | Policy | Tool calls |
|---|---|---|---|---|
| `lyte-command-center` | Partial | Partial | Partial | Partial |
| `command` | Partial | No | No | No |
| `vessels` | No | No | No | No |
| `terra` | No | No | No | No |
| `sentra` | Partial | No | No | No |
| `pulse` | No | No | No | No |
| All others | No | No | No | No |

**Required:** Every screen that surfaces an AI-generated result must link to `EvidencePanel` showing traceId, source citations, policy verdict, confidence, and freshness.

**Remediation:** This is a cross-cutting concern. Implement `EvidenceBadge` on all AI result cards as a first step (low-lift, high-visibility signal). Full `EvidencePanel` integration follows in the drawer pattern per surface.

---

### F-CMP-03: DataGrid / DenseTable fragmentation — P2

**Surfaces affected:** `artifacts/vessels`, `artifacts/terra`, `artifacts/sentra`, `artifacts/counsel`  
**Evidence:** Multiple surfaces implement custom data tables using raw `<table>` HTML or custom flex-based table layouts rather than `DataGrid` or `DenseTable`.

**Remediation:** Migrate custom table implementations to `DataGrid` (from `packages/design-system/src/data/DataGrid.tsx`) for standard views, and `DenseTable` (from `packages/design-system/src/cockpit/DenseTable.tsx`) for maximum-density operator views.

---

### F-CMP-04: Empty states missing or inconsistent — P3

**Surfaces affected:** `artifacts/terra`, `artifacts/counsel`, `artifacts/vessels`  
**Evidence:** Several queue and list views show a blank container or raw text ("No records found") when empty, rather than using the `EmptyState` component.

**Remediation:** Add `EmptyState` from `packages/design-system/src/feedback/EmptyState.tsx` to all list/queue views. Each empty state must have a domain-appropriate icon, descriptive heading, and supporting copy.

---

### F-CMP-05: Loading states inconsistent — P3

**Surfaces affected:** Multiple artifacts  
**Evidence:** Some surfaces use full-page spinners for data loading, others show a blank view while loading, and only a few implement skeleton loading.

**Remediation:** Replace full-page spinners and blank loading views with `SkeletonLoader` from `packages/design-system/src/feedback/SkeletonLoader.tsx`. Full-page spinner is only acceptable for initial app boot.

---

### F-CMP-06: Deprecated ui-command package still imported in some artifacts — P2

**Surfaces affected:** Verify with targeted import scan  
**Evidence:** `packages/ui-command` is fully deprecated but may still be imported in older artifact components.

**Remediation:** Run `grep -r "ui-command" --include="*.tsx" --include="*.ts" artifacts/` to enumerate remaining imports. Replace each with the equivalent component from `packages/design-system`.

---

## 6. Accessibility Findings

### F-A11Y-01: Icon-only buttons missing aria-label — P2

**Surfaces affected:** Multiple artifacts  
**Evidence:** Icon-only action buttons (close drawer, expand section, filter toggle) appear without `aria-label` attributes in multiple surfaces.

**Remediation:** Audit all `<button>` elements containing only an icon (no visible text). Add `aria-label="[Action description]"` to each. The `Button` component in `packages/design-system/src/form/Button.tsx` should enforce this at the API level for icon-only usage.

---

### F-A11Y-02: Color as sole status indicator — P2

**Surfaces affected:** Surfaces using custom status coloring (see F-CMP-01)  
**Evidence:** The same surfaces using custom color-only status indicators also fail the color-independence accessibility requirement.

**Remediation:** Resolved by F-CMP-01 — switching to `StatusBadge` enforces icon + color + text label together.

---

### F-A11Y-03: Focus ring suppressed in some surfaces — P2

**Surfaces affected:** `artifacts/sentra`, `artifacts/vessels`  
**Evidence:** Some component files include `outline-none` or `focus:outline-none` without providing a visible alternative focus indicator.

**Required:** Focus ring must always be visible: `2px solid color.border.focus (#4d8fcc)`, `outline-offset: 2px`. Never suppress focus rings without an accessible replacement.

**Remediation:** Search for `outline-none` and `focus:outline-none` across artifact source files. Replace with `focus-visible:ring-2 focus-visible:ring-[var(--gi-border-focus)]`.

---

### F-A11Y-04: Data tables missing semantic markup — P3

**Surfaces affected:** Artifacts using custom table implementations  
**Evidence:** Custom table layouts using `<div>` with flex styling lack `<table>`, `<th scope="col">`, `<caption>`, and `aria-sort` on sortable columns.

**Remediation:** Resolved by F-CMP-03 — migrating to `DataGrid` which provides correct semantic markup. For any remaining custom tables, add proper semantic elements.

---

### F-A11Y-05: Live data regions not marked — P3

**Surfaces affected:** `artifacts/pulse`, `artifacts/command`, `artifacts/sentra`  
**Evidence:** Surfaces with live-updating data feeds (agent run status, alert feeds, operational metrics) do not use `aria-live` regions.

**Remediation:** Add `aria-live="polite"` to containers that update with new data without user action. Use `aria-live="assertive"` only for critical system alerts.

---

## 7. Layout & Structure Findings

### F-LAY-01: Screen mode contract not implemented — P2

**Surfaces affected:** All artifacts  
**Evidence:** No surface implements the Executive/Operator mode toggle using `useScreenMode()`. The `SentientLayer` AI rail in `lib/shared-ui` approximates executive mode behavior but is not wired to a platform-wide mode contract.

**Remediation:** Implement `DesignSystemProvider` as the root provider on all surfaces. Wire the mode toggle in `TopBar` to `useScreenMode()`. Adapt key components (DataGrid, RecommendationCard, PageHeader) to respond to mode changes.

---

### F-LAY-02: Density mode not respected in most surfaces — P2

**Surfaces affected:** All artifacts  
**Evidence:** No artifact currently reads from `useDensity()` for spacing or font size. All spacing is hard-coded via Tailwind utilities.

**Remediation:** Implement density mode at the `DesignSystemProvider` level and thread it through key layout components (AppShell, DataGrid, SideNav, FormField). This is a prerequisite for enterprise customization requirements.

---

### F-LAY-03: Border radius inconsistency — P3

**Surfaces affected:** `artifacts/szl-holdings`, `artifacts/vessels`, `artifacts/terra`  
**Evidence:** Mix of `rounded-xl (12px)`, `rounded-2xl (16px)`, and `rounded-sm (2px)` used in the same views without token basis. Tailwind's default radius scale is not mapped to the AEEP `radius.*` token set.

**Remediation:** Map all `rounded-*` Tailwind utilities to the AEEP radius token equivalent. Configure Tailwind to override the default radius scale with AEEP values.

---

### F-LAY-04: Card background inconsistency — P3

**Surfaces affected:** `artifacts/lyte-command-center`, `artifacts/pulse`  
**Evidence:** Some cards use `color.bg.raised (#162030)` as card background instead of `color.bg.surface (#0d1520)`. Cards should sit on surface; raised is for elements within cards (inner panels, highlighted sections).

**Remediation:** Audit all `className="..."` patterns using `bg-[var(--gi-bg-raised)]` or `bg-[#162030]` on card containers. Cards should use `bg-[var(--gi-bg-surface)]`.

---

## 8. Artifact-Level Scorecard

| Artifact | Design Token Adherence | Nav Pattern | Evidence-First | Accessibility | Motion Compliance | Overall |
|---|---|---|---|---|---|---|
| `szl-holdings` | ⚠️ Partial | ❌ Custom | ❌ Missing | ⚠️ Partial | ⚠️ Decorative motion | **P2** |
| `command` | ✅ Good | ❌ Custom | ⚠️ Partial | ⚠️ Partial | ❌ Particle effects | **P1** |
| `sentra` | ❌ Neon accents | ❌ Custom | ⚠️ Partial | ❌ Missing focus rings | ⚠️ Glow shadows | **P1** |
| `counsel` | ✅ Good | ❌ Custom | ❌ Missing | ⚠️ Partial | ✅ Compliant | **P2** |
| `terra` | ✅ Good | ❌ Custom | ❌ Missing | ⚠️ Partial | ✅ Compliant | **P2** |
| `vessels` | ❌ Inline hex | ❌ Custom | ❌ Missing | ❌ Missing aria | ✅ Compliant | **P1** |
| `pulse` | ✅ Good | ❌ No nav | ❌ Missing | ⚠️ Partial | ⚠️ Hero animations | **P2** |
| `lyte-command-center` | ❌ Neon amber | ❌ Custom | ⚠️ Partial | ⚠️ Partial | ⚠️ Entry animations | **P1** |
| `aegis` | ✅ Marketing | N/A (pitch deck) | N/A | N/A | N/A | **N/A** |
| `carlota-jo` | ✅ Good | ❌ Custom | ❌ Missing | ⚠️ Partial | ✅ Compliant | **P3** |

**Legend:** ✅ Compliant | ⚠️ Partial | ❌ Non-compliant

---

## 9. Prioritized Remediation Backlog

### P1 — Critical (Blocks enterprise buyer trust)

| ID | Finding | Primary Surface | Effort |
|---|---|---|---|
| F-COL-01 | Remove neon accent colors from product UX | `sentra`, `lyte-command-center`, `vessels` | Medium |
| F-COL-02 | Replace all inline hex values with token references | `vessels`, `szl-holdings` | High |
| F-TYP-01 | Cap heading sizes at `fontSize.2xl` in authenticated views | `szl-holdings`, `vessels` | Medium |
| F-NAV-01 | Implement canonical primary nav via `SideNav` on all surfaces | All | Very High |
| F-CMP-02 | Add `EvidenceBadge` + `EvidencePanel` to all AI result screens | All | High |

### P2 — High (Significant visible inconsistency)

| ID | Finding | Primary Surface | Effort |
|---|---|---|---|
| F-COL-03 | Remove glow box-shadows; replace with `elevation.*` tokens | `sentra`, `lyte`, `vessels` | Low |
| F-COL-04 | Enforce single domain accent per surface | `lyte-command-center` | Low |
| F-MOT-01 | Remove decorative Framer Motion from product views | `command`, `pulse`, `szl-holdings` | Medium |
| F-MOT-02 | Add `prefers-reduced-motion` support to all animated surfaces | All | Medium |
| F-NAV-02 | Standardize `EcosystemNav` in all `TopBar` instances | All | Low |
| F-CMP-01 | Replace custom status coloring with `StatusBadge` | `vessels`, `terra`, `sentra` | Medium |
| F-CMP-03 | Migrate custom tables to `DataGrid` / `DenseTable` | `vessels`, `terra`, `counsel` | High |
| F-CMP-06 | Remove remaining `ui-command` imports | TBD via scan | Low |
| F-A11Y-01 | Add `aria-label` to all icon-only buttons | All | Low |
| F-A11Y-03 | Fix suppressed focus rings | `sentra`, `vessels` | Low |
| F-LAY-01 | Implement screen mode contract | All | Very High |
| F-LAY-02 | Wire density mode via `useDensity()` | All | High |

### P3 — Medium (Polish, lower visibility)

| ID | Finding | Primary Surface | Effort |
|---|---|---|---|
| F-TYP-02 | Standardize font stacks to canonical token | `lyte`, `vessels` | Low |
| F-TYP-03 | Cap heading weight at semibold (600) | `szl-holdings`, `vessels` | Low |
| F-NAV-03 | Standardize active nav state indicator | `vessels`, `terra`, `lyte` | Low |
| F-CMP-04 | Add `EmptyState` to all list/queue views | `terra`, `counsel`, `vessels` | Low |
| F-CMP-05 | Replace full-page spinners with `SkeletonLoader` | Multiple | Medium |
| F-A11Y-04 | Add semantic markup to custom tables | All with custom tables | Medium |
| F-A11Y-05 | Add `aria-live` to live data feeds | `pulse`, `command`, `sentra` | Low |
| F-LAY-03 | Standardize border-radius to AEEP `radius.*` tokens | `szl-holdings`, `vessels`, `terra` | Medium |
| F-LAY-04 | Fix card background token (surface vs raised) | `lyte`, `pulse` | Low |

---

## 10. Recommended Remediation Sequence

**Phase 1 — Token Enforcement (P1, 2–3 weeks)**
1. F-COL-01: Strip neon accents from `sentra` and `lyte-command-center`
2. F-COL-02: Replace inline hex across `vessels` (most extensive) and `szl-holdings`
3. F-COL-03: Remove glow box-shadows across all surfaces
4. F-TYP-01: Cap heading sizes in authenticated views

**Phase 2 — Navigation & Shell (P1, 4–6 weeks)**
5. F-NAV-01: Implement canonical `SideNav` nav structure on all surfaces
6. F-NAV-02: Standardize `EcosystemNav` / `TopBar` integration
7. Migrate all surfaces to `AppShell` layout root

**Phase 3 — Component Migration (P1–P2, 4–6 weeks)**
8. F-CMP-02: Add `EvidenceBadge` to all AI result screens (quick win)
9. F-CMP-01: Replace custom status coloring with `StatusBadge`
10. F-CMP-03: Migrate custom tables to `DataGrid` / `DenseTable`

**Phase 4 — Motion & Accessibility (P2, 2–3 weeks)**
11. F-MOT-01: Remove decorative Framer Motion
12. F-MOT-02: Add `prefers-reduced-motion` support
13. F-A11Y-01, 03, 04, 05: Accessibility fixes

**Phase 5 — Screen Mode & Density (P2, 3–4 weeks)**
14. F-LAY-01: Implement screen mode contract
15. F-LAY-02: Wire density mode
16. Remaining P3 polish items

---

## Appendix: How to Run the Audit Queries

Neon accent usage:
```bash
grep -r "#00d4ff\|#00e878\|#ffb700\|#ff4455\|cyan-400\|green-400\|neon" \
  --include="*.tsx" --include="*.ts" --include="*.css" artifacts/
```

Inline hex values:
```bash
grep -r "text-\[#\|bg-\[#\|border-\[#\|text-\[rgb" \
  --include="*.tsx" artifacts/
```

Glow box-shadows:
```bash
grep -r "0 0 [0-9].*rgba\|box-shadow.*0 0" \
  --include="*.tsx" --include="*.css" artifacts/
```

Display-scale text in authenticated views:
```bash
grep -r "text-4xl\|text-5xl\|text-6xl\|text-7xl\|text-8xl" \
  --include="*.tsx" artifacts/
```

Suppressed focus rings:
```bash
grep -r "outline-none\|focus:outline-none" \
  --include="*.tsx" artifacts/
```

Deprecated ui-command imports:
```bash
grep -r "ui-command" --include="*.tsx" --include="*.ts" artifacts/
```
