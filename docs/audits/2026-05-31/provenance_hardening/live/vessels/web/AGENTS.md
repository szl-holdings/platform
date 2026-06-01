# AGENTS — artifacts/vessels

**Scope:** Narrows [root AGENTS.md](../../AGENTS.md) for the Vessels maritime intelligence artifact.

## What This Is

The Vessels web artifact delivers maritime intelligence: fleet position tracking via AIS, voyage economics, sanctions screening, and route risk assessment. It is a domain pack of the SZL Holdings platform — it inherits all governance primitives.

## Domain Vocabulary

Use these terms exactly. Do not introduce synonyms.

| Canonical term | Do not use |
|---------------|-----------|
| Vessel | Ship, boat |
| Voyage | Trip, journey, route |
| AIS dark / going dark | Lost signal, disappeared |
| Sanctions screening | Compliance check |
| Fleet | Ships, vessels (when referring to a managed group) |
| Port call | Stop, docking |

## Entity Types

Vessels domain uses: `vessel`, `voyage`, `signal` (types: `ais_dark`, `ais_position`, `sanctions_hit`, `voyage_anomaly`, `port_arrival`, `cargo_discrepancy`). Import these types from `@workspace/ontology`.

## UI Rules

- The Vessels Decision Center (`/decision-center`) is the primary governance surface. All recommendations must show `EvidenceBadge`, `FreshnessChip`, and `ConfidenceMeter` from `packages/design-system`.
- AIS data older than 5 minutes must show a `FreshnessChip` in "stale" state.
- Sanctions screening results must show their list source and timestamp — never just "clear" or "matched" without provenance.
- Voyage cost simulations must show the Monte Carlo confidence interval, not just the point estimate.

## Key Files

| File | Purpose |
|------|---------|
| `src/pages/` | Route pages |
| `src/pages/DecisionCenter.tsx` | Governance surface |
| `src/pages/Fleet.tsx` | Fleet position map |
| `src/pages/trust-provenance.tsx` | Trust and proof chain viewer |

## Cursor Cloud specific instructions

### Repository structure

This repo is an **extracted artifact** from the `szl-holdings/szl-holdings-platform` pnpm monorepo. It contains only the Vessels maritime web frontend (`web/`). The ~26 `workspace:*` dependencies are provided via stub packages in `stubs/` and resolved through `pnpm-workspace.yaml` at the repo root.

### Running the dev server

```bash
cd /workspace/web && pnpm dev
# Serves at http://localhost:9090/vessels/
```

The Vite dev server starts on port 9090. The app will show errors in the browser because the workspace package stubs provide minimal implementations. This is expected — the full rendering requires the complete monorepo with real shared-ui, design-system, and services packages.

### Lint, test, typecheck

| Command | Working dir | Notes |
|---------|-------------|-------|
| `pnpm exec biome lint ./src` | `web/` | Runs Biome linter; existing codebase has pre-existing warnings |
| `npx tsx src/lib/raz-nihyeh/__tests__/non-monotone-counterexample.test.ts` | `web/` | Only automated test in this repo |
| `pnpm exec tsc --noEmit --skipLibCheck` | `web/` | TypeScript check; expect 17 pre-existing errors from stub type mismatches |

### Key caveats

- **Dependency scan warning**: Vite logs `Failed to run dependency scan` because stub packages import `react` but can't resolve it during the scan phase. This is non-blocking — Vite serves modules on-demand.
- **`@tailwindcss/typography` v0.5 + Tailwind v4**: The `@plugin "@tailwindcss/typography"` directive in `index.css` uses Tailwind v4 syntax. The installed version (0.5.x) may not fully support this — visual styling may differ.
- **`@source` directives in CSS**: The `index.css` has `@source "../../../lib/shared-ui/src/**/*.{ts,tsx}"` pointing to monorepo paths that don't exist in this checkout. Tailwind v4 silently ignores missing sources.
- **Stub packages**: Generated via `node scripts/generate-stubs.mjs`. If new workspace imports are added to source files, re-run this script to regenerate stubs.
- **No lockfile committed**: The `pnpm-lock.yaml` is generated on install and is gitignored for this standalone checkout.

