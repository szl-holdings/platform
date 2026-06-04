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
