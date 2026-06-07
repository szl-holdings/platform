# AGENTS — artifacts/terra

**Scope:** Narrows [root AGENTS.md](../../AGENTS.md) for the Terra real estate intelligence artifact.

## What This Is

Terra delivers real estate intelligence focused on distressed property identification, ownership graph analysis, and deal pipeline management for NYC and expanding markets. It is a domain pack of the SZL Holdings platform.

## Domain Vocabulary

| Canonical term | Do not use |
|---------------|-----------|
| Property | Asset, listing |
| Distress signal | Red flag, warning |
| Ownership graph | Owner network, structure |
| Lien | Debt, claim |
| Deal | Transaction, opportunity |
| Distress score | Risk score (when referring to property distress) |

## Entity Types

Terra domain uses: `property`, `deal`, `signal` (types: `distress_filing`, `ownership_change`, `lien_filed`, `tax_delinquency`, `foreclosure_filing`). Import from `@workspace/ontology`.

## UI Rules

- Property distress signals must show the filing source, date, and confidence. Never show a distress indicator without a source reference.
- Deal stages must follow the canonical stages: `prospect → qualified → diligence → negotiation → closed | lost`. Do not add intermediate stages without updating `DealEntity` in `@workspace/ontology`.
- The Decision Center (`/decision-center`) must show `PolicyStateChip` on every recommended action.
- Ownership graph data must show a freshness timestamp — property records can be days old.

## Key Files

| File | Purpose |
|------|---------|
| `src/pages/` | Route pages |
| `src/pages/DecisionCenter.tsx` | Governance surface |
| `src/pages/trust-provenance.tsx` | Trust and proof chain viewer |
