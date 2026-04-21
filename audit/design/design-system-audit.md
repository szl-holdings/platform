# Design System Audit — Series-A Reset
*April 2026*

## Purpose
Audit of the `@szl-holdings/design-system` package against every consuming artifact. Documents token alignment, component adoption, and structural integrity after this reset.

---

## 1. Design-System Package — Token & Component Layer

**Location:** `packages/design-system`

### Token modules

| Layer | File | Status |
|---|---|---|
| Color, typography, spacing, radius, elevation, motion | `src/tokens/index.ts` | Complete |
| CSS custom property names (`--gi-*`) | `src/tokens/vars.ts` | Complete |
| CSS injection helper (`injectTokens()`) | `src/tokens/index.ts` | Complete |
| CSS static export (`gi-tokens.css`) | `src/tokens/gi-tokens.css` | Added this reset |
| CSS package export (`./tokens/css`) | `package.json` exports map | Added this reset |
| Product accent map | `src/tokens/index.ts` → `productAccent` | `lyte`, `sentra`, `counsel` added this reset |

### Component modules (new exports added this reset)

| Subpath | Contents |
|---|---|
| `./data` | StatusBadge, MetricStat, DataGrid, FilterBar, TableToolbar |
| `./data/status-badge` | StatusBadge (8 artifact files now consume this) |
| `./data/metric-stat` | MetricStat |
| `./data/data-grid` | DataGrid |
| `./data/filter-bar` | FilterBar |

### Canonical color roles

```
bg.base      #060b12   page background
bg.surface   #0d1520   primary card surface
bg.overlay   #111c2a   stacked overlay
bg.raised    #162030   elevated drawer/modal

text.primary   #c8d8e8
text.secondary #7a99b8
text.muted     #4a6070

accent.blue    #4d8fcc  command, vessels
accent.teal    #3ea89a  holdings platform
accent.green   #5baa8a  terra, state.allowed
accent.amber   #c9a85c  pulse, lyte
accent.red     #c96070  sentra, destructive
accent.violet  #9b7cc8  counsel, carlota, aegis
accent.slate   #7a99b8  neutral secondary
```

### Canonical radius scale

```
sm   2px   (was 4px — 2× inflated)
md   4px   (was 6px)
lg   6px   (was 8px)
xl   8px   (was 12px)
2xl  12px  (was 16px)
```

### Canonical motion budget

| Token | Duration |
|---|---|
| instant | 60ms |
| fast | 120ms |
| normal | 200ms |
| slow | 350ms |
| glacial | 600ms — editorial brand only (carlota-jo) |

---

## 2. Token Adoption — Post-Reset State

| Artifact | GI CSS vars | Radius | Motion | Accent |
|---|---|---|---|---|
| sentra | ✅ Imported | ✅ Normalized | ✅ ≤350ms | ✅ Red |
| counsel | ✅ Imported | ✅ Normalized | ✅ ≤350ms | ✅ Violet |
| vessels | ✅ Imported | ✅ Normalized | ✅ ≤350ms | ✅ Blue |
| lyte | ✅ Imported | ✅ Normalized | ✅ ≤350ms | ✅ Amber |
| terra | ✅ Imported | ✅ Normalized | ✅ ≤350ms | ✅ Green |
| pulse | ✅ Imported | ✅ Normalized | ✅ ≤350ms | ✅ Amber |
| aegis | ✅ Imported | ✅ Normalized | ✅ ≤350ms | ✅ Violet (was neon cyan) |
| command | ✅ Imported | ✅ Normalized | ✅ ≤350ms | ✅ Blue via var(--gi-*) |
| szl-holdings | ✅ Imported | ✅ Normalized | ✅ ≤350ms | ✅ Amber (was cyan) |
| carlota-jo | ✅ Imported | ✅ Normalized | ✅ ≤500ms editorial | ✅ Gold (light theme) |
| szl-holdings-mobile | ✅ `gi-bridge.ts` | ✅ `giRadius` | N/A | ✅ `giProductAccent.lyte` |

---

## 3. Component Adoption — Post-Reset State

### 3.1 StatusBadge — Migrated (8 files)

All files listed below previously contained local badge component functions with hardcoded color configs. Each has been migrated to the canonical `StatusBadge` from `@szl-holdings/design-system`, using a `*_VARIANT` map to convert domain status strings to `StatusVariant`.

- `artifacts/vessels/src/pages/atlas-execute.tsx`
- `artifacts/vessels/src/pages/trading-desk.tsx`
- `artifacts/szl-holdings/src/pages/governance-posture.tsx`
- `artifacts/lyte-command-center/src/pages/decision-center.tsx`
- `artifacts/szl-holdings/src/fund-operations/components.tsx`
- `artifacts/szl-holdings/src/ownership-os/components.tsx`
- `artifacts/szl-holdings/src/components/CertificationReadinessOS.tsx`
- `artifacts/szl-holdings/src/pages/distribution-os/campaigns-page.tsx`

### 3.2 Proof / Cockpit Components — Active Adoption

All major artifacts consume proof and cockpit components directly. These were active before this reset and remain in use:

| Component | Consuming Artifacts |
|---|---|
| `ProofEnvelope` | sentra, vessels, counsel, terra, pulse, command, carlota-jo, szl-holdings, aegis |
| `ConfidenceMeter` | vessels, counsel, terra, carlota-jo, aegis |
| `PolicyStateChip` | terra, vessels, counsel, carlota-jo |
| `AutonomyModeToggle` | pulse, command, szl-holdings, aegis |

### 3.3 Mobile Token Bridge

`lib/gi-bridge.ts` provides `giColors`, `giRadius`, `giMotion`, `giProductAccent` sourced directly from `@szl-holdings/design-system/tokens`. `LYTE_COLORS` in `constants/colors.ts` derives all semantic color values from the bridge.

---

## 4. Post-Reset Changes Summary

1. **`gi-tokens.css`** — New static CSS file defining all `--gi-*` custom properties. Imported by all 10 web artifacts.
2. **`./tokens/css` export** — Package export path for CSS-only import.
3. **`./data` subpath exports** — StatusBadge, MetricStat, DataGrid, FilterBar now accessible via subpath.
4. **Radius normalized** — All 10 web artifacts updated from 2× inflated scale to canonical values.
5. **Motion capped** — szl-holdings infinite glow animations removed; carlota-jo entrance animations capped.
6. **Neon removed** — Aegis `#0cc8d9` → `#9b7cc8`; colored grid textures removed from sentra, counsel, vessels, lyte.
7. **Command fonts** — Inter + Space Grotesk + JetBrains Mono imports aligned.
8. **Command product colors** — Aligned to design-system `productAccent`.
9. **`lyte`, `sentra`, `counsel` added to productAccent** — Canonical product accent map is now complete.
10. **LYTE_COLORS normalized** — Mobile primary changed from purple to amber; all values sourced from `gi-bridge.ts`.
11. **Glow decorations removed** — szl-holdings depth glow radials and card hover glows removed.
12. **8 StatusBadge components migrated** — Per-app badge functions replaced with canonical design-system `StatusBadge`.
13. **Mobile design-system dependency** — `@szl-holdings/design-system` added to mobile `package.json`; token bridge in `lib/gi-bridge.ts`.
