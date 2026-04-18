# Carlota Jo Consulting

Domain pack for premium advisory operations. Provides a UHNW client portal, service catalog, appointment booking, and secure document delivery.

**Kind:** web
**Preview path:** `/carlota-jo/`
**Artifact dir:** `artifacts/carlota-jo/`

## Local development

```bash
pnpm --filter @szl-holdings/carlota-jo dev
```

## Key modules

| Module | Purpose |
|--------|---------|
| Client Portal | Secure client communication with Proof Chain |
| Service Catalog | Advisory service management |
| Booking System | Appointment scheduling |
| Document Delivery | Secure document sharing with Covenant Policy |

See `PRODUCT_SURFACE_MAP.md` for the full module-to-primitive mapping.

## Notable source paths

| Path | Purpose |
|------|---------|
| `src/pages/` | Top-level routes (portal, catalog, booking, documents) |
| `src/components/` | Shared advisory UI components |
| `src/hooks/`, `src/lib/` | Data hooks and API client |
| `src/locales/` + `src/i18n.ts` | Internationalization |
| `src/data/` | Demo seed data |

## Key environment variables

| Variable | Purpose |
|----------|---------|
| `VITE_PLAUSIBLE_DOMAIN` | Plausible analytics domain |

API and auth keys live on `api-server`. See `ops/infra/environment-matrix.md` for the full environment variable matrix.
