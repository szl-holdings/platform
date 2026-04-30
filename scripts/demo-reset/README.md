# Demo Reset Scripts

Scripts for resetting and restoring the SZL Holdings demo environment to a clean, presentation-ready state.

## Quick Start

```bash
# Full reset — all four demo narratives
./scripts/demo-reset/reset.sh

# Single narrative
./scripts/demo-reset/reset.sh --narrative business
./scripts/demo-reset/reset.sh --narrative security
./scripts/demo-reset/reset.sh --narrative maritime
./scripts/demo-reset/reset.sh --narrative legal

# Preflight check only (no data changes)
./scripts/demo-reset/reset.sh --check
```

## Prerequisites

1. `DATABASE_URL` set in `.env` or environment
2. `pnpm install` completed
3. Migrations applied: `pnpm --filter @szl-holdings/db run migrate`

## Narrative Aliases

| Alias | Narrative | Pack |
|-------|-----------|------|
| `business`, `business-revops`, `lyte` | Business Observability / RevOps / CFO | Lyte |
| `security`, `soc`, `aegis` | Security / SOC / Risk | Aegis |
| `maritime`, `vessels` | Maritime / Sanctions / Fleet Operations | Vessels |
| `legal`, `prism`, `prism-counsel` | Legal / Compliance / Matter Command | Counsel |

## What Reset Does

1. Runs preflight checks (DATABASE_URL, pnpm, migrations)
2. Deletes all existing demo-tagged rows in FK-safe order (true clean slate)
3. Seeds the selected narrative's demo entities (idempotent: safe to run repeatedly)
4. Runs an API health check
5. Reports total runtime and ready status

Row counts are stable across repeated runs — each reset removes old demo records before inserting fresh ones.

## After Reset

- All demo banners will be visible in the UI (data state badges)
- Personas can be switched via the demo toolbar (if enabled)
- See `docs/demo/demo-day-guide.md` for the full presentation checklist

## Estimated Runtimes

| Scope | Estimated Time |
|-------|---------------|
| Preflight check only | ~10 seconds |
| Single narrative | ~45–90 seconds |
| Full reset (all narratives) | ~2–4 minutes |
