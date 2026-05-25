# Phase 5 — Vessels visual redesign (A11oy × Anthropic × Lambda)

## Goal
Bring Vessels' UI in line with the A11oy palette + Anthropic editorial
typography + Lambda Labs' dense, data-grid feel.

## Design directives (handed to the design subagent)
- **Palette**: A11oy core — background `#0a0a0a`, surface `#0e0e0e`, accent
  `#c9b787` (gold), text primary `#f5f5f5`, text muted `#8a8a8a`, error
  `#dc8a8a`. No additional hues.
- **Typography**: Display = Anthropic "Tiempos"-equivalent serif (use
  `font-display`, already in the design system); body = sans; data =
  `font-mono`. Tabular-nums always on for numeric cells.
- **Density**: Lambda-style — table rows 28–32px, 11px monospace for IDs/
  timestamps, sparkline charts inline.
- **Motion**: ≤ 120ms ease-out, no decorative animation; only state
  transitions.
- **Structure**: Left nav (existing) → top status strip (fleet count, ok/
  failed signals, last sync) → primary content grid (12-col).

## Work
1. Spin up the design subagent with the directives + screenshots of A11oy +
   anthropic.com + lambdalabs.com as reference.
2. Subagent produces 2 variants; pick one with the user, then ship across:
   - `artifacts/vessels/src/pages/fleet.tsx`
   - `artifacts/vessels/src/pages/vessel/[id].tsx`
   - `artifacts/vessels/src/pages/route-plan.tsx`
   - `artifacts/vessels/src/pages/coexistence.tsx`
   - `artifacts/vessels/src/components/layout.tsx` (top status strip).
3. Token sweep: any hex outside the A11oy palette gets replaced or
   justified.

## Done looks like
- Visual diff vs. current Vessels (screenshot pairs) attached to the PR.
- No new color tokens introduced; existing token file remains the single
  source of truth.
