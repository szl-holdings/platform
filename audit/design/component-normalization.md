# Component Normalization Report
*Series-A Reset · April 2026*

---

## 1. CSS Token Layer — Web (Completed)

Every web artifact imports `@szl-holdings/design-system/tokens/css` at the CSS root, establishing the `--gi-*` custom property namespace as the single source of truth.

**Before:** No artifact imported GI tokens. Each app defined its own color variables in isolation.
**After:** All 10 apps share `--gi-bg-*`, `--gi-text-*`, `--gi-accent-*`, `--gi-border-*`, `--gi-state-*`, `--gi-confidence-*`. Artifact-specific tokens reference `var(--gi-*)` rather than hardcoded hex.

---

## 2. Status Badge Migration (Completed)

Local `StatusBadge`, `SeverityBadge`, `PriorityBadge`, `RiskBadge` component functions across 8 files have been replaced with the canonical `StatusBadge` from `@szl-holdings/design-system/data`. Each replacement uses a local `*_VARIANT` map (string → `StatusVariant`) and delegates all rendering to the design-system component.

| File | Local Component Removed | Migrated To |
|---|---|---|
| `artifacts/vessels/src/pages/atlas-execute.tsx` | `StatusBadge` (run statuses) | `DSStatusBadge` from design-system |
| `artifacts/vessels/src/pages/trading-desk.tsx` | `StatusBadge` (order statuses) | `DSStatusBadge` from design-system |
| `artifacts/szl-holdings/src/pages/governance-posture.tsx` | `StatusBadge` + `PriorityBadge` | `DSStatusBadge` from design-system |
| `artifacts/lyte-command-center/src/pages/decision-center.tsx` | `SeverityBadge` | `DSStatusBadge` from design-system |
| `artifacts/szl-holdings/src/fund-operations/components.tsx` | `StatusBadge` (fund statuses) | `DSStatusBadge` from design-system |
| `artifacts/szl-holdings/src/ownership-os/components.tsx` | `StatusBadge` + `PriorityBadge` | `DSStatusBadge` from design-system |
| `artifacts/szl-holdings/src/components/CertificationReadinessOS.tsx` | `StatusBadge` (cert statuses) | `DSStatusBadge` from design-system |
| `artifacts/szl-holdings/src/pages/distribution-os/campaigns-page.tsx` | `StatusBadge` (campaign statuses) | `DSStatusBadge` from design-system |

---

## 3. Proof & Cockpit Component Adoption (Pre-existing + Maintained)

The following artifacts already consume proof/cockpit components from the design-system and continued to do so through this reset:

| Artifact | Components Used |
|---|---|
| sentra | `ProofEnvelope` (mesh-exposures, incident-commander, exposure-board, decision-center, control-drift) |
| vessels | `ProofEnvelope`, `ConfidenceMeter`, `PolicyStateChip`, `AutonomyModeToggle` |
| counsel | `ProofEnvelope`, `ConfidenceMeter`, `PolicyStateChip`, `AutonomyModeToggle` |
| terra | `ProofEnvelope`, `ConfidenceMeter`, `PolicyStateChip` |
| pulse | `ProofEnvelope`, `AutonomyModeToggle` |
| command | `ProofEnvelope`, `AutonomyModeToggle` |
| carlota-jo | `ProofEnvelope`, `ConfidenceMeter`, `PolicyStateChip` |
| szl-holdings | `ProofEnvelope`, `AutonomyModeToggle` |
| aegis | `ProofEnvelope`, `ConfidenceMeter`, `AutonomyModeToggle` |

---

## 4. Mobile Token Bridge (Completed)

`artifacts/szl-holdings-mobile` now depends on `@szl-holdings/design-system` (`workspace:*`).

`lib/gi-bridge.ts` imports directly from `@szl-holdings/design-system/tokens` and exports React Native-compatible values: `giColors`, `giRadius`, `giMotion`, `giProductAccent`.

`constants/colors.ts` — `LYTE_COLORS` derives all values from the bridge, referencing `giColors.accent.*`, `giColors.bg.*`, `giColors.text.*`, and `giProductAccent.lyte`. No local hex duplication for brand or semantic colors.

---

## 5. Design-System Package Exports (Updated)

`./data` subpath added to `packages/design-system/package.json` exports:
- `"./data"` → `src/data/index.ts` (StatusBadge, MetricStat, DataGrid, FilterBar, TableToolbar)
- `"./data/status-badge"` → `src/data/StatusBadge.tsx`
- `"./data/metric-stat"` → `src/data/MetricStat.tsx`
- `"./data/data-grid"` → `src/data/DataGrid.tsx`
- `"./data/filter-bar"` → `src/data/FilterBar.tsx`

---

## 6. Radius Scale (Completed)

All artifacts normalized from inflated 2× scale to canonical values:

| Token | Was | Now |
|---|---|---|
| `sm` | 4px | 2px |
| `md` | 6px | 4px |
| `lg` | 8px | 6px |
| `xl` | 12px | 8px |
| `2xl` | 16px | 12px |

---

## 7. Motion Budget (Completed)

Infinite decorative animations removed from all artifacts. All transitions respect ≤200ms standard / ≤350ms panel / ≤500ms editorial (carlota-jo only).

Animations removed: `border-glow`, `node-drift`, `link-pulse`, `data-pulse`, `pulse-ring`, `depth-glow-*` across szl-holdings, pulse, lyte-command-center.

---

## 8. Neon / Glow Removal (Completed)

- Hover glow box-shadows removed from all card surfaces
- Radial gradient depth-glow overlays removed from szl-holdings
- Accent-colored CSS grid textures removed from sentra, counsel, vessels, lyte
- Aegis accent corrected: `#0cc8d9` → `#9b7cc8` (enterprise violet)
- Lyte identity corrected from electric cyan to amber (`#c9a85c`) across web and mobile

---

## 9. Visual Outcomes

1. **Sharper corners** — All cards/panels reduced from 8–16px to 2–12px.
2. **Clean dark backgrounds** — Accent-colored grid textures removed.
3. **No hover glows** — Cards use elevation shadow only.
4. **Lyte identity** — Amber (`#c9a85c`) everywhere, consistent with `productAccent.lyte`.
5. **Aegis accent** — Enterprise violet replaces neon cyan across all slide surfaces.
6. **Consistent status badges** — All migrated files now render from the canonical `StatusBadge` semantic color system.
