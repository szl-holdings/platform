# SZL Holdings — Dashboard

Primary public-facing web application. Serves the corporate site, product pages, trust center, investor hub, founder profile, Nexus command, and the Forge admin surface.

**Kind:** web  
**Preview path:** `/`  
**Artifact dir:** `artifacts/szl-holdings/`

## Local development

```bash
pnpm --filter @szl-holdings/szl-holdings dev
```

## Key sections

| Route | Purpose |
|-------|---------|
| `/` | Homepage and product overview |
| `/trust` | Trust center |
| `/investor` | Investor hub |
| `/founder` | Founder profile (formerly `stephen-site`) |
| `/nexus` | Nexus command surface |
| `/forge` | Admin surface (authenticated) |

## Environment variables

See `ops/infra/environment-matrix.md` for the full environment variable matrix.
