# Terra — Real Estate Intelligence

Domain pack for real estate intelligence. Surfaces distress pipeline monitoring, ownership graph, deal workflow, and AI-assisted lead scoring.

**Kind:** web
**Preview path:** `/terra/`
**Artifact dir:** `artifacts/terra/`

## Screenshots

| View | Path |
|------|------|
| Hero — Portfolio overview | `media/screenshots/terra/hero.png` |
| Portfolio view | `media/screenshots/terra/portfolio.png` |

Regenerate: `bash scripts/capture-screenshots.sh terra`

## Local development

```bash
pnpm --filter @szl-holdings/terra dev
```

## Key modules

| Module | Purpose |
|--------|---------|
| Distress Pipeline | NYC public records monitoring for distressed properties |
| Ownership Graph | Entity relationship mapping |
| Deal Pipeline | Investment opportunity tracking with Monte Carlo simulation |
| Market Signals | Real-time market intelligence |
| Lead Scoring | AI-assisted prospect ranking |

See `PRODUCT_SURFACE_MAP.md` for the full module-to-primitive mapping.

## Notable source paths

| Path | Purpose |
|------|---------|
| `src/pages/` | Route-level views (pipeline, deals, ownership, etc.) |
| `src/components/` | Shared Terra UI components |
| `src/hooks/`, `src/lib/` | Data hooks and API client |
| `src/data/` | Demo seed data |

## Key environment variables

| Variable | Purpose |
|----------|---------|
| `VITE_PLAUSIBLE_DOMAIN` | Plausible analytics domain |

Terra reads its primary data from the API server via the shared API client; backend keys (e.g. records providers) live on `api-server`. See `ops/infra/environment-matrix.md` for the full environment variable matrix.
