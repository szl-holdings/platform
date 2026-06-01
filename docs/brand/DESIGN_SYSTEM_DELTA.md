# Design System Delta

> Changes applied and recommended during the Series A GitHub Rehaul · April 2026

This document records design system improvements identified in the UI audit, distinguishing between changes applied in this pass and recommended future improvements.

---

## Applied This Pass

No architectural design system changes were applied in this rehaul pass. The UI audit found the existing design system to be coherent and consistent. High-leverage changes identified below are recommendations for implementation in the next sprint.

---

## Recommended High-Leverage Improvements

### 1. SSE Disconnection State (Priority: High)

**Issue:** When a Server-Sent Events connection drops, some surfaces show a blank panel rather than a user-readable disconnection indicator.

**Recommendation:** Add a `<ConnectionStatus>` indicator to all SSE-consuming components that shows:
- Green dot: Connected and receiving
- Amber dot: Reconnecting
- Red dot with message: Disconnected — click to retry

**Surfaces affected:** Command Portal, Pulse, Vessels (real-time fleet feed)

**Implementation:** Add a shared `useSSEConnection` hook to `@workspace/shared-ui` that wraps EventSource with connection state tracking.

---

### 2. Skeleton Loaders (Priority: Medium)

**Issue:** Some async data surfaces use spinner overlays rather than skeleton loaders, which creates a less premium feel and causes layout shift.

**Recommendation:** Replace all spinner overlays with skeleton loaders that match the expected content shape. Use the existing `Skeleton` component from `@workspace/shared-ui`.

**Surfaces to audit:** Terra deal pipeline on initial load; Vessels voyage list; Command Portal on first SSE connection.

---

### 3. Empty State Messaging (Priority: Medium)

**Issue:** Generic "No data available" messages on some surfaces don't guide the user toward the next action.

**Recommendation:** Contextual empty states with:
- A clear heading (what is empty and why)
- A suggested action (e.g., "Add your first vessel" or "Seed demo data")
- An icon that matches the content category (not a generic box icon)

**Surfaces to audit:** New tenant experience before seeding; filtered views with no results.

---

### 4. Error Boundary Presentation (Priority: Medium)

**Issue:** Runtime errors in some surfaces show a raw React error boundary fallback without premium styling.

**Recommendation:** Wrap all top-level route components with a styled `<ErrorBoundary>` component from `@workspace/shared-ui` that shows:
- A composed error card matching the dark-premium aesthetic
- An action to reload or navigate home
- An error code (not a stack trace) for support reference

---

### 5. Bottom Tab Bar Clearance on Mobile (Priority: Low)

**Issue:** On some iOS Safari viewports, content in scrollable areas is clipped by the bottom tab bar.

**Recommendation:** Add `pb-safe` (safe-area bottom padding) to all full-height scrollable containers in CORTEX Mobile.

---

### 6. Focus Ring Visibility (Priority: Low)

**Issue:** Some interactive elements in the dark theme have low-visibility focus rings due to low contrast with background.

**Recommendation:** Ensure all focusable elements have a visible focus ring with at least 3:1 contrast ratio against the background. Use `ring-2 ring-brand-400` pattern from the shared-ui design tokens.

---

## Design Tokens Reference

Current canonical design tokens are defined in `@workspace/shared-ui/src/tokens/`. The tokens are:
- Color palette: `brand`, `neutral`, `semantic` (success, warning, error, info)
- Typography scale: `xs` through `4xl` with line height pairs
- Spacing: 4px base grid
- Radius: `sm`, `md`, `lg`, `full`
- Shadow: `sm`, `md`, `lg`, `command` (the high-elevation command surface shadow)

**No new tokens are required for the improvements above.** All recommendations use existing tokens.

---

*Generated: April 21, 2026 — Series A GitHub Rehaul*
