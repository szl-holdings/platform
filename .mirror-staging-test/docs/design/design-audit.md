# SZL Holdings — Design System Audit

**Date:** April 2026  
**Scope:** All 7 web platforms + shared-ui component library

---

## Audit Methodology

This audit evaluates visual consistency, component discipline, and enterprise-grade polish across the SZL platform ecosystem. The reference aesthetic is dark-premium, command-center — New Relic and BOSS-inspired density with deliberate restraint.

---

## Design System Foundation

### Current State

The platform uses a shared component library (`@workspace/shared-ui`) with:
- Tailwind CSS v4 for utility styling
- Radix UI primitives for accessible interactive components
- Framer Motion for animation
- Recharts for data visualization
- Custom dark color palette defined in CSS variables

**Strengths:**
- Consistent color vocabulary across platforms (background hierarchy, border colors, accent usage)
- Shared navigation patterns and command palette implementation
- Consistent data table and card patterns across Lyte, Aegis, and Vessels

**Identified gaps:**
- Typography scale not formally defined — some platforms use inconsistent heading weights
- Spacing scale not enforced — some components use arbitrary pixel values rather than Tailwind spacing tokens
- Empty state components vary between platforms
- Loading state patterns inconsistent (some use skeleton loaders, some spinners)
- Status badge vocabulary not standardized

---

## Typography Assessment

### Current State

| Element | Assessment |
|---------|-----------|
| Headings (H1–H3) | Mostly consistent — occasional weight inconsistency on secondary platforms |
| Body copy | Consistent — `text-sm` primary, `text-xs` secondary |
| Data labels | Mostly consistent — `text-xs font-mono` for technical data |
| KPI numbers | Inconsistent — some platforms use large numerals without consistent scale |
| Navigation labels | Consistent across platforms that share the sidebar component |

### Recommendations

1. Formalize a typography scale in `shared-ui` that maps semantic purpose to Tailwind classes
2. Standardize KPI number sizes across Lyte, Aegis, and Vessels dashboards
3. Establish a code/data monospace pattern for technical identifiers (IPs, vessel IDs, case numbers)

---

## Color System Assessment

### Current Palette

| Role | Usage |
|------|-------|
| `bg-background` | Primary page background (deep dark) |
| `bg-card` | Card surfaces |
| `bg-muted` | Secondary/inactive states |
| `border` | Subtle dividers |
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary text |
| `text-primary` | Brand accent (used sparingly) |
| Semantic colors | `text-red-*`, `text-yellow-*`, `text-green-*` for status |

**Strengths:** The palette is disciplined. Dark background hierarchy is well-maintained. Accent color is used sparingly and effectively.

**Gaps:**
- Status color semantic not formalized — different platforms use slightly different red/yellow/green shades
- Blue vs. indigo inconsistency in some interactive elements
- Some charts use bright colors that don't match the dark-premium aesthetic

---

## Component Inventory

### Consistent (Well-Implemented)

- ✅ Navigation sidebar / mobile drawer
- ✅ Data tables with sorting and filtering
- ✅ Card containers with consistent border and padding
- ✅ Command palette (keyboard shortcut navigation)
- ✅ Modal / sheet patterns
- ✅ Dropdown menus
- ✅ Input fields and form components

### Needs Standardization

- ⚠️ Empty state components — vary significantly between platforms
- ⚠️ Loading skeleton patterns — inconsistent between platforms
- ⚠️ Status badges — color vocabulary not fully standardized
- ⚠️ KPI strip layouts — different approaches across Lyte, Aegis, Vessels
- ⚠️ Chart color palettes — some use colors that conflict with dark premium aesthetic
- ⚠️ Hero sections on marketing pages — vary significantly across SZL Holdings, Vessels, and Terra

---

## Platform-Specific Findings

### Lyte

**Strengths:** PRISM framework visualization is distinctive and well-executed. Command Inbox density is appropriate for operator use. Signal lifecycle cards are consistent.

**Opportunities:** Readiness Module scoring UI could use a more premium indicator design. Motion tab workflow cards would benefit from a cleaner timeline view.

### Aegis

**Strengths:** Defense workspace SOC command table is dense and functional. MITRE ATT&CK matrix rendering is technically impressive.

**Opportunities:** Intelligence workspace (INCA) has a slightly different visual language from Defense and Command workspaces — worth normalizing the heading patterns and card styles.

### Vessels

**Strengths:** Fleet command table with status indicators is clean. Voyage economics view uses good data hierarchy.

**Opportunities:** Map view integration with command panels could be tighter on smaller viewport sizes. Dark vessel detection timeline could use more visual distinctiveness.

### Terra

**Strengths:** Property map integration is well-executed. Distress scoring indicators are clear.

**Opportunities:** Property cards in list view could benefit from a more structured information hierarchy — distress score more prominent, ownership data more structured.

---

## Priority Recommendations

| Priority | Change | Impact |
|---------|--------|--------|
| High | Standardize status badge color vocabulary across all platforms | Trust and readability |
| High | Standardize empty state components — create shared EmptyState component | Consistency |
| High | Standardize loading skeleton patterns — create shared LoadingState component | Professionalism |
| Medium | Formalize KPI strip layout — create shared KPIStrip component | Investor presentation |
| Medium | Chart color system — define a 6-color dark-appropriate chart palette | Visual coherence |
| Low | Typography scale documentation — formalize in design-system-tokens.md | Developer guidance |
| Low | Marketing hero sections — align visual language across corporate sites | Brand consistency |
