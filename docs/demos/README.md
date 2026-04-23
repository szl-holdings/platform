# Per-Artifact Demo Scripts

This directory contains one-page demo run scripts for each platform artifact. Each script is written for a non-technical presenter to follow without hitting a broken state.

## Index

| Artifact | Script | Duration | Persona |
|----------|--------|----------|---------|
| SZL Holdings Dashboard | [szl-holdings.md](./szl-holdings.md) | 5–7 min | Founder / CEO / Investor |
| SZL Demo Video | [szl-demo-video.md](./szl-demo-video.md) | 77 sec | Any — no login required |
| Sentra — Cyber Resilience | [sentra.md](./sentra.md) | 8–12 min | CISO / SOC Analyst |
| Counsel — Legal Matter Command | [counsel.md](./counsel.md) | 6–8 min | CCO / Legal Ops |
| Command — Unified Command | [command.md](./command.md) | 8–10 min | CFO / Executive |
| Pulse — AI Executive Briefing | [pulse.md](./pulse.md) | 5–7 min | Any Executive |
| Aegis — Security Platform | [aegis.md](./aegis.md) | 6–8 min | CISO |
| Terra — Real Estate Intelligence | [terra.md](./terra.md) | 6–8 min | Investment Decision-Maker |
| Vessels — Maritime Intelligence | [vessels.md](./vessels.md) | 8–10 min | Fleet Operator / CCO |
| Lyte — Decision Intelligence | [lyte.md](./lyte.md) | 6–8 min | CFO / CTO |
| Carlota Jo Consulting | [carlota-jo.md](./carlota-jo.md) | 4–6 min | Prospect / Client |
| SZL Holdings Mobile (CORTEX) | [szl-holdings-mobile.md](./szl-holdings-mobile.md) | 4–6 min | Executive / Field Operator |
| API Server (Technical) | [api-server.md](./api-server.md) | 5–8 min | CTO / Technical DD |
| NEXUS / Mockup Sandbox | [nexus.md](./nexus.md) | N/A | Internal engineering only |

## Pre-Demo Global Checklist

Before running any demo:

1. **Load demo seed data:**
   ```bash
   pnpm seed:demo
   # or: bash scripts/seed-demo-canonical.sh
   ```

2. **Sign in once** at `https://<your-domain>/api/login` — sets session cookie for all apps

3. **Verify health:**
   ```
   GET https://<your-domain>/api/health/detailed
   ```
   Confirm all services show healthy.

4. **Check required secrets for map demos:**  
   `MAPBOX_ACCESS_TOKEN` must be set for Terra and CORTEX mobile map views.  
   **Do NOT demo map views if token is not set.**

5. **Open browser tabs in advance** — do not cold-start during the demo.

## Demo Mode vs Production

All web apps show an `AppModeBanner` when `APP_MODE=demo` is set. In demo mode:
- GET requests serve seeded fixture data
- Write requests are intercepted and return `{ ok: true, demo: true }` (no data written)
- The banner is visible to the presenter and any observers

For investor demos using the production environment with seeded data, set `APP_MODE=sandbox` (default). Data writes go through the full stack; seeded data is present from the seed script.

## Known Avoidance Items

Across all artifacts, avoid these screens in demos unless specifically noted as ready:

| Item | Artifact | Reason | Workaround |
|------|----------|--------|------------|
| Terra distress map | Terra | Blank without Mapbox token | Show distress table instead |
| Vessels AIS live feed | Vessels | Positions are simulated | Disclose proactively; demo the exception/alert workflow instead |
| Pulse PDF export | Pulse | Not implemented | Not in nav |
| Pulse email subscription | Pulse | Not implemented | Not in nav |
| Stripe payment flow | Carlota Jo | Test mode; no real charge | Do not click "Pay" button |
| Google sign-in | Carlota Jo | Credential not configured | Use OIDC login instead |
| SOAR live actions | Aegis | No SOAR credential | Show approval queue instead |

---

*See also: `docs/demo/demo-day-guide.md` (full-platform narrative), `docs/audit/report.md` (production readiness), `docs/audit/GAP_MATRIX.md` (open gaps)*
