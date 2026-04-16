# SZL Holdings — Demo Day Runbook

## Quick Start

```bash
pnpm install
pnpm seed          # creates demo users + seed data
pnpm start         # starts all services
```

## Demo Credentials

| Role             | Email                        | Password          |
| ---------------- | ---------------------------- | ----------------- |
| Platform Owner   | admin@szlholdings.com        | DemoAdmin2026!    |
| Org Admin        | alex@szlholdings.com         | DemoUser2026!     |
| Analyst          | jordan@szlholdings.com       | DemoUser2026!     |
| Marketing        | morgan@szlholdings.com       | DemoUser2026!     |
| Creative         | casey@szlholdings.com        | DemoUser2026!     |

## Health Check

```
GET /api/health          → full service matrix (database, auth, AI, storage)
GET /api/health/live     → liveness probe
GET /api/health/ready    → readiness probe
```

## Platform Artifacts

| Artifact          | Path              | Purpose                              |
| ----------------- | ----------------- | ------------------------------------ |
| Command (Lyte)    | `/command/`       | Unified command surface              |
| SZL Holdings      | `/szl-holdings/`  | Portfolio dashboard                  |
| Aegis             | `/aegis/`         | Defense & intelligence domain pack   |
| Terra             | `/terra/`         | Real estate intelligence domain pack |
| Vessels           | `/vessels/`       | Maritime intelligence domain pack    |
| PRISM Counsel     | `/prism-counsel/` | Legal governance domain pack         |
| Carlota Jo        | `/carlota-jo/`    | Consulting domain pack               |
| Firestorm         | `/firestorm/`     | Firestorm defense interface          |
| Stephen Site      | `/stephen-site/`  | Founder portfolio site               |

## Demo Walkthrough

### 1. Login (30 seconds)
Navigate to `/command/` and log in with `admin@szlholdings.com` / `DemoAdmin2026!`.

### 2. Health Matrix (30 seconds)
Open `/api/health` in the browser to show service health, database latency, and uptime.

### 3. Platform Overview (2 minutes)
Walk through the SZL Holdings dashboard at `/szl-holdings/` — show portfolio metrics, active domain packs, and the governed operational intelligence narrative.

### 4. Domain Packs (5 minutes)
- **Aegis** (`/aegis/`): Defense signals, threat assessment, covenant policies
- **Vessels** (`/vessels/`): Fleet tracking, voyage management, maritime corridors
- **Terra** (`/terra/`): Property analysis, market intelligence, deal pipeline
- **PRISM Counsel** (`/prism-counsel/`): Legal matters, compliance tracking, risk assessment

### 5. Canonical Loop (2 minutes)
Demonstrate the governed decision loop:
`Signal → Context → Recommendation → Simulation → Policy → Approval → Execution → Proof → Outcome`

## Troubleshooting

| Issue                        | Fix                                          |
| ---------------------------- | -------------------------------------------- |
| API returns 500              | Check `pnpm --filter @workspace/api-server run build` succeeded |
| Login fails                  | Run `pnpm seed` to recreate demo users       |
| Port 8080 conflict           | Normal — the Command workflow manages the API server on 8080 internally |
| Database connection error    | Verify `DATABASE_URL` in environment          |

## Environment Variables

Copy `.env.example` to `.env` and configure at minimum:
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — run `openssl rand -hex 32`

All other services degrade gracefully to demo/mock mode when keys are absent.
