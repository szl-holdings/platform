# SZL Holdings — UI Remediation Plan

**Date:** April 2026  
**Priority:** High-value changes that improve investor-facing credibility

---

## Scope

This plan covers the high-priority visual and consistency improvements identified in the design audit. Items are prioritized by visibility during investor/buyer evaluation sessions.

---

## Phase 1: Foundation (High Priority)

### 1.1 Standardize Status Badge Component

**Issue:** Status badges vary between platforms — different colors, sizes, and dot indicator patterns.

**Target:** Create a shared `StatusBadge` component in `@workspace/shared-ui` with the standard vocabulary from `design-system-tokens.md`.

**Files affected:**
- `lib/shared-ui/src/components/status-badge.tsx` (create)
- Replace local badge implementations across `lyte-command-center`, `firestorm`, `vessels`, `terra`

**Effort:** Medium (2–3 hours)

---

### 1.2 Standardize Empty State Component

**Issue:** Each platform has a different approach to empty states (no data, no results, loading errors). Some are bare text, some are styled, some are missing entirely.

**Target:** Create a shared `EmptyState` component in `@workspace/shared-ui`:
- Icon slot
- Title + description
- Optional action button
- Consistent vertical padding and centering

**Files affected:**
- `lib/shared-ui/src/components/empty-state.tsx` (create)
- Replace local empty state implementations across platforms

**Effort:** Medium (2–3 hours)

---

### 1.3 Standardize Loading Skeleton Pattern

**Issue:** Loading states vary — some platforms show spinners, some show skeletons, some show blank areas.

**Target:** Establish skeleton loaders as the standard. Create a shared `LoadingSkeleton` component set:
- `SkeletonText` — text line placeholder
- `SkeletonCard` — card-shaped placeholder
- `SkeletonKPI` — KPI strip placeholder
- `SkeletonTable` — table row placeholder

**Files affected:**
- `lib/shared-ui/src/components/loading-skeleton.tsx` (create)

**Effort:** Medium (2–3 hours)

---

## Phase 2: Data Visualization (Medium Priority)

### 2.1 Chart Color System

**Issue:** Charts use inconsistent color palettes across platforms. Some use bright, non-dark-premium colors.

**Target:** Define the 6-color dark-appropriate chart palette in CSS tokens and update Recharts configs across all platforms to use `var(--chart-N)` tokens.

**Files affected:**
- `lib/shared-ui/src/styles/` — add chart color tokens
- `artifacts/lyte-command-center/src/` — update chart configurations
- `artifacts/firestorm/src/` — update chart configurations
- `artifacts/vessels/src/` — update chart configurations
- `artifacts/terra/src/` — update chart configurations

**Effort:** Medium (3–4 hours)

---

### 2.2 KPI Strip Standardization

**Issue:** KPI strips appear across multiple platforms (Lyte, Aegis, Vessels) with slightly different padding, font sizing, and delta indicator patterns.

**Target:** Create a shared `KPIStrip` component in `@workspace/shared-ui`:
- Responsive grid (4 cols desktop, 2 cols tablet, 1 col mobile)
- Consistent KPI card: value, label, delta, trend indicator
- Configurable with metric config objects

**Files affected:**
- `lib/shared-ui/src/components/kpi-strip.tsx` (create)

**Effort:** Medium (2–3 hours)

---

## Phase 3: Marketing Surface (Lower Priority, High Investor Impact)

### 3.1 Hero Section Alignment

**Issue:** Marketing/landing pages for Vessels, Terra, and Carlota Jo have significantly different hero section treatments.

**Target:** Create a shared `PremiumHero` layout component that establishes consistent:
- Background treatment (dark gradient or geometric pattern)
- Headline + subheadline typography
- CTA button placement
- Badge / label treatment

**Files affected:**
- `lib/shared-ui/src/components/premium-hero.tsx` (create)
- `artifacts/vessels/src/pages/` — update marketing landing
- `artifacts/terra/src/pages/` — update marketing landing

**Effort:** Medium–High (4–6 hours)

---

### 3.2 Footer / Trust Links

**Issue:** Footer treatment varies across platforms. Some have no footer. Some have minimal footers.

**Target:** Consistent platform footer with:
- Copyright notice
- Links to Trust Center, Privacy, Security
- Platform family navigation
- Contact email

**Files affected:**
- `lib/shared-ui/src/components/platform-footer.tsx` (create)

**Effort:** Low–Medium (2 hours)

---

## Implementation Priority Order

1. StatusBadge component (most visible in investor demo sessions)
2. EmptyState component (platforms feel unpolished without it)
3. LoadingSkeleton component (demo loading states matter)
4. Chart color system (visible in every dashboard)
5. KPI strip standardization (visible on every command surface)
6. Hero section alignment (visible on marketing pages)
7. Footer consistency (background polish)

---

## Acceptance Criteria

A platform passes the design remediation bar when:
- Every status indicator uses the StatusBadge component with standard vocabulary
- Every empty data state uses the EmptyState component
- Every loading state uses skeleton loaders, not spinners
- Chart colors use `var(--chart-N)` tokens
- KPI strips are consistent and responsive
