# Component Audit — Design System v2 Migration

**Date:** April 2026  
**Scope:** All 13 web artifacts  
**Severity key:** `keep` · `normalize` · `replace` · `remove`

---

## Shell / Navigation

| Component | Status | Finding | Action |
|-----------|--------|---------|--------|
| AppShell | `keep` | Solid AEEP shell with collapsible sidebar, TopBar, density-aware padding | Standardised across all artifacts via `@szl-holdings/design-system` |
| SideNav | `keep` | Per-product nav items, active state uses product accent | All products use this component |
| TopBar | `keep` | 48px height, ⌘K trigger, consistent across products | Standardised |
| PageHeader | `keep` | Semantic heading + breadcrumb area | Standardised |
| Breadcrumb | `keep` | **New in v2** — accessible breadcrumb with icon slots | Added `src/shell/Breadcrumb.tsx` |
| TenantIndicator | `keep` | Multi-org context badge in TopBar | Standardised |
| GlobalCommandPalette | `keep` | ⌘K overlay with search, consistent everywhere | Standardised |

---

## Feedback / State

| Component | Old State | Action | New State |
|-----------|-----------|--------|-----------|
| EmptyState | Present in design-system; inconsistently used | Standardised; all async routes now reference this component | `keep` |
| ErrorState | Present in design-system | Standardised | `keep` |
| LoadingState | Spinner variant — inconsistently used | Keep for secondary loads | `keep` |
| SkeletonLoader | **Missing** — some products showed blank screens on initial load | **Added** in v2: SkeletonText, SkeletonCard, SkeletonKPI, SkeletonTable | `keep` (new) |
| Toast | **Missing** — no cross-product notification system | **Added** in v2: ToastContainer + useToast hook | `keep` (new) |

---

## Data Display

| Component | Status | Notes |
|-----------|--------|-------|
| StatusBadge | `keep` | 10 variants including pending, active, approved, rejected, escalated |
| MetricStat | `keep` | KPI tile with delta, icon, unit, footnote |
| DataGrid | `keep` | Dense table with sort/filter hooks |
| FilterBar | `keep` | Filter chips with clear-all |
| TableToolbar | `keep` | Actions row above data tables |

---

## Forms

| Component | Status | Notes |
|-----------|--------|-------|
| Button | `keep` (new in v2) | Primary, secondary, ghost, destructive, outline × xs–lg |
| FormField | `keep` | Labelled wrapper with error slot |
| SearchInput | `keep` | With debounce and clear |
| SegmentedControl | `keep` | 2–4 option toggle |
| Select | `keep` | Dropdown with search |
| Stepper | `keep` | Numeric increment/decrement |

---

## Cockpit (Command-surface)

| Component | Status | Notes |
|-----------|--------|-------|
| ApprovalDialog | `keep` | Human-in-the-loop approval modal |
| AuditRail | `keep` | Vertical actor/action timeline |
| DenseTable | `keep` | High-density table for ops surfaces |
| EvidenceDrawer | `keep` | Side panel for evidence chain |
| GraphCanvas | `keep` | Entity relationship graph |
| MapSurface | `keep` | Geo data surface |
| NarrativePanel | `keep` | AI narrative with evidence |
| RecommendationCard | `keep` | Proposed action with proof |
| RunTimeline | `keep` | Workflow run visualiser |
| TimelineLane | `keep` | Multi-lane event timeline |
| **SubstrateWorkflowPanel** | `keep` (new — consolidated) | Agent substrate workflow panel — was duplicated across 5 artifacts (terra, carlota-jo, lyte, vessels, sentra). Consolidated into design-system; artifacts now use thin wrappers with domain props. No hardcoded hex — uses `--gi-*` tokens. |
| **AtlasScenePanel** | `keep` (new — consolidated) | Geographic/scene context panel — was duplicated across 3 artifacts (terra, vessels, sentra). Consolidated into design-system; tab content injected via `ReactNode` props. Accepts `headerRight` slot for status badges. |
| **GovernedCockpitShell** | `keep` (new — consolidated) | Page-level shell for governed cockpit surfaces — header, KPI grid, AutonomyModeToggle, and children render prop. Replaced boilerplate across 7 artifacts (pulse, sentra, szl-holdings, vessels, carlota-jo, terra, command). |

---

## Proof / Governance (AI Transparency)

| Component | Status | Notes |
|-----------|--------|-------|
| ProofEnvelope | `keep` | Container for all AI-generated outputs |
| AutonomyModeToggle | `keep` | observe → recommend → approved-act |
| ConfidenceMeter | `keep` | Visual confidence gauge |
| EvidenceBadge | `keep` | Source provenance indicator |
| FreshnessChip | `keep` | Data latency indicator |
| PolicyModeBadge | `keep` | Policy tier badge |
| PolicyStateChip | `keep` | allowed / requires-approval / blocked |

---

## Per-Artifact Migration Notes

### Sentra — Cyber Resilience Command
- **Accent:** Red (`#c96070` = `--gi-accent-red`)
- **Pattern:** Uses shadcn-style `hsl(var(--background))` tokens + gi-* CSS vars
- **Changes:** Removed neon colors from `governed-cockpit.tsx` — replaced `#00e878`, `#ffb700`, `#ff4455` with `color.accent.green`, `color.accent.amber`, `color.accent.red`
- **Status:** ✅ Compliant

### Counsel — Legal Matter Command
- **Accent:** Violet (`--gi-accent-violet`)
- **Pattern:** Shadcn-style tokens + gi-* vars
- **Changes:** Removed neon colors from `governed-cockpit.tsx`
- **Status:** ✅ Compliant

### Vessels — Maritime Intelligence
- **Accent:** Blue (`--gi-accent-blue`)
- **Pattern:** gi-* tokens directly
- **Changes:** Removed neon colors from `governed-cockpit.tsx`; `fleet-map.tsx` vessel markers retain functional map glow (not decorative)
- **Note:** Fleet map vessel marker glow (`box-shadow: 0 0 4px`) is functional density encoding on a dark map — not an arcade effect
- **Status:** ✅ Compliant

### Terra — Real Estate Intelligence
- **Accent:** Green (`--gi-accent-green`)
- **Pattern:** gi-* tokens
- **Changes:** Removed neon colors from `governed-cockpit.tsx`; inline border opacity hex replaced with `rgba()`
- **Status:** ✅ Compliant

### Pulse — AI Executive Briefing
- **Accent:** Amber (`--gi-accent-amber`)
- **Typography exception:** Uses Crimson Pro serif (intentional editorial brand for AI briefings)
- **Changes:** Removed neon colors from `governed-cockpit.tsx`
- **Status:** ✅ Compliant

### Carlota Jo Consulting
- **Theme exception:** Light-mode editorial brand (intentional) — uses Cormorant Garamond serif, stone/ink colour palette
- **Applies to:** Public-facing consulting site, not authenticated SZL Holdings product
- **Changes:** Removed neon colors from `governed-cockpit.tsx`
- **Status:** ✅ Compliant (light theme intentional)

### Aegis — SZL Holdings Investor Pitch Deck
- **Accent:** Violet (`--gi-accent-violet`)
- **Light mode:** Investor deck surface; eligible for `[data-theme="light"]` in screenshot/print contexts
- **Changes:** Removed neon colors from `governed-cockpit.tsx`; infrastructure CSS `gold-glow` text-shadow removed
- **Status:** ✅ Compliant

### Lyte — Decision Intelligence
- **Accent:** Amber (`--gi-accent-amber`)
- **Pattern:** Shadcn-style tokens + gi-* vars
- **Changes:** None — no neon palette found
- **Status:** ✅ Compliant

### Command — Unified Command
- **Accent:** Blue (`--gi-accent-blue`)
- **Sub-surfaces:** Legatus Console (infrastructure) has a distinct Roman/gold theme
- **Changes:** 
  - `governed-cockpit.tsx`: neon colors removed
  - `competitive-atlas.tsx`: neon accent colors replaced with enterprise palette
  - `infrastructure/index.css`: gold-glow text-shadow removed; pulse-gold animation made opacity-only (no box-shadow glow); classification/threat colors normalized to enterprise tokens; gi-tokens.css import added
- **Note:** Legatus Console retains gold accents (#c9a227) as intentional branded theming for that sub-surface. Glow effects removed.
- **Status:** ✅ Compliant

### SZL Holdings Dashboard
- **Accent:** Teal (`--gi-accent-teal`)
- **Pattern:** gi-* tokens directly
- **Changes:** Removed neon colors from `governed-cockpit.tsx`
- **Status:** ✅ Compliant

### API Server
- **Scope:** Backend server; no primary UI surfaces
- **Changes:** None required
- **Status:** ✅ Out of scope (backend)

### NEXUS Mockup Sandbox
- **Scope:** Design artifact — excluded from product surface overhaul per task scope
- **Observation:** Still uses neon palette extensively — tracked as follow-on work
- **Status:** ⚠️ Follow-on (design artifact out of scope)

---

## Token Usage Summary

| Concern | Before v2 | After v2 |
|---------|-----------|---------|
| Neon colors on product surfaces | Present in all governed-cockpit files and infrastructure CSS | Removed — all replaced with enterprise `color.accent.*` values |
| Text-shadow glow | Present in `infrastructure/index.css` `.gold-glow` | Removed |
| Box-shadow glow rings | `pulse-gold` keyframe had `box-shadow: 0 0 0 Xpx` | Replaced with opacity-only fade animation |
| Light theme | None | Added — `[data-theme="light"]` / `.gi-light` selector |
| Typography CSS vars | Defined in JS tokens only | Added to `gi-tokens.css` as CSS custom props |
| Spacing CSS vars | Defined in JS tokens only | Added to `gi-tokens.css` as CSS custom props |
| Elevation/shadow | JS constants only | CSS custom props `--gi-shadow-0` through `--gi-shadow-4` |
| Density vars | JS constants only | CSS custom props `[data-density=*]` attribute selectors |
| Semantic status vars | `semanticColors` JS export only | CSS custom props `--gi-success-*`, `--gi-warning-*`, etc. |
| Button component | Absent — each artifact hand-rolled buttons | Standardised `Button` with 5 variants × 4 sizes |
| Skeleton loaders | Absent or per-artifact — inconsistent | 4 standardised variants: Text, Card, KPI, Table |
| Toast system | Absent — no cross-product notifications | `ToastContainer` + `useToast` hook |
| Breadcrumb | Absent | `Breadcrumb` component added to shell |
| SubstrateWorkflowPanel | Duplicated across 5 artifacts with hardcoded hex | Consolidated into `@szl-holdings/design-system/cockpit`; artifacts use thin wrappers with domain props; all `--gi-*` tokens |
| AtlasScenePanel | Duplicated across 3 artifacts with hardcoded hex | Consolidated into `@szl-holdings/design-system/cockpit`; tab content via ReactNode; `headerRight` slot for status badges |
| GovernedCockpitShell | Boilerplate duplicated across 7 governed-cockpit pages | Consolidated into design-system; render prop `(autonomyMode, setAutonomyMode) => ReactNode` for domain body |
