# Unified Command

The primary operations command surface for SZL Holdings. Merges the former Lyte Command Center and IMPERIUM cloud sovereignty surfaces into a single unified interface.

**Kind:** web
**Preview path:** `/command/`
**Artifact dir:** `artifacts/command/`

## Screenshots

| View | Path |
|------|------|
| Hero — Command overview | `media/screenshots/command/hero.png` |
| Strategy dashboard | `media/screenshots/command/dashboard.png` |

Regenerate: `bash scripts/capture-screenshots.sh command`

## Local development

```bash
pnpm --filter @szl-holdings/command dev
```

## Key modules

| Module | Purpose |
|--------|---------|
| Strategy Dashboard | 5-pillar operational overview (PRISM framework) |
| Signal Timeline | Correlated business signal feed |
| Action Queue | Pending decisions with simulation context |
| Approvals Center | Human-in-the-loop approval queue |
| Governed Decision Loop | Flagship end-to-end loop demo at `/command/operations/governed-decision-loop` |
| Infrastructure | Cloud sovereignty and platform infrastructure (formerly IMPERIUM) |
| Decision Receipts | Immutable governed decision records |
| Outcome Loop | Aggregate outcome graph view |

See `PRODUCT_SURFACE_MAP.md` for the full module-to-primitive mapping.

## Notable source paths

| Path | Purpose |
|------|---------|
| `src/pages/` | Top-level command routes |
| `src/operations/` | Governed Decision Loop and operational surfaces |
| `src/infrastructure/` | Cloud sovereignty / IMPERIUM-era views |
| `src/components/` | Shared command UI |
| `src/hooks/`, `src/lib/` | Data hooks, API client, utilities |
| `src/data/` | Demo seed data |

## Key environment variables

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | API server base URL |
| `VITE_DEPLOY_ENV` | Deployment environment label |
| `VITE_IS_DEMO` | Toggle demo-mode UI affordances |
| `VITE_PLAUSIBLE_DOMAIN` | Plausible analytics domain |

See `ops/infra/environment-matrix.md` for the full environment variable matrix.
