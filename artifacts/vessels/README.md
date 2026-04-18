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
