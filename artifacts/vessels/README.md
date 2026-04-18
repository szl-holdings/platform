# Vessels Maritime Intelligence

Domain pack for maritime fleet intelligence. Covers AIS vessel tracking, voyage P&L, dark vessel detection, sanctions screening, and exception management.

**Kind:** web
**Preview path:** `/vessels/`
**Artifact dir:** `artifacts/vessels/`

## Local development

```bash
pnpm --filter @szl-holdings/vessels dev
```

## Key modules

| Module | Purpose |
|--------|---------|
| Fleet Map | Real-time AIS vessel tracking |
| Voyage P&L | Voyage economics with Monte Carlo simulation |
| Dark Vessel Detection | AIS anomaly and spoofing alerts |
| Sanctions Screening | Compliance verification via Proof Chain |
| Helmsman AI | Maritime intelligence agent |
| Exception Center | Risk-based workflow queue |

See `PRODUCT_SURFACE_MAP.md` for the full module-to-primitive mapping.

## Notable source paths

| Path | Purpose |
|------|---------|
| `src/pages/` | Route-level views (fleet, voyage, exceptions, helmsman) |
| `src/components/` | Shared Vessels UI components |
| `src/contexts/` | React contexts for fleet/session state |
| `src/hooks/`, `src/lib/` | Data hooks and API client |
| `src/data/` | Demo seed data |

## Key environment variables

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API server base URL |
| `VITE_PLAUSIBLE_DOMAIN` | Plausible analytics domain |
| `VITE_STRIPE_PRICE_VESSELS_ENTERPRISE` | Stripe price ID for the Vessels Enterprise tier |

The AIS feed itself is gated server-side by `AIS_FEED_ENABLED` on `api-server`. See `ops/infra/environment-matrix.md` for the full environment variable matrix.
