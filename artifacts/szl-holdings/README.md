# SZL Holdings — Dashboard

Primary public-facing web application. Serves the corporate site, product pages, trust center, investor hub, founder profile, Nexus command, and the Forge admin surface.

**Kind:** web
**Preview path:** `/`
**Artifact dir:** `artifacts/szl-holdings/`

## Screenshots

| View | Path |
|------|------|
| Hero — Dashboard overview | `media/screenshots/szl-holdings/hero.png` |
| Portfolio view | `media/screenshots/szl-holdings/portfolio.png` |

Regenerate: `bash scripts/capture-screenshots.sh szl-holdings`

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

## Notable modules

| Path | Purpose |
|------|---------|
| `src/pages/` | Top-level route components for the public site |
| `src/control-tower/` | Forge admin (authenticated) surfaces |
| `src/ownership-os/` | Ownership Operating System views |
| `src/fund-operations/` | Fund Operations surfaces |
| `src/alloy/` | Alloy workflow and digest UI |
| `src/components/` | Shared UI components |
| `src/lib/` | API client, analytics, helpers |
| `src/locales/` + `src/i18n.ts` | Internationalization |
| `vite-api-plugin.ts` | Local dev API proxy plugin |

## Key environment variables

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Base URL for the API server |
| `VITE_APP_MODE` | Runtime mode (e.g. `demo`, `live`) |
| `VITE_SANDBOX_API_BASE` | Sandbox API base for demo mode |
| `VITE_PLAUSIBLE_DOMAIN` | Plausible analytics domain |
| `VITE_PLAUSIBLE_SHARED_URL` | Shared Plausible dashboard URL |
| `VITE_STRIPE_PRICE_SZL_PRO` | Stripe price ID for SZL Pro tier |
| `SZL_WEBHOOK_SECRET` | Server-side webhook signing secret (build/SSR only) |

See `ops/infra/environment-matrix.md` for the full environment variable matrix.
