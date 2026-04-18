# SZL Holdings — Demo Day Runbook

## Quick Start (Fresh Clone)

```bash
git clone <repo-url> && cd szl-holdings
cp .env.example .env
# Edit .env: set DATABASE_URL and SESSION_SECRET (minimum required)
pnpm install
pnpm seed          # creates demo users + seed data + runs verification
pnpm start         # starts all services
```

All services without configured API keys will run in demo/mock mode automatically.

## Demo Credentials

| Role             | Email                        | Password          |
| ---------------- | ---------------------------- | ----------------- |
| Platform Owner   | admin@szlholdings.com        | DemoAdmin2026!    |
| Org Admin        | alex@szlholdings.com         | DemoUser2026!     |
| Analyst          | jordan@szlholdings.com       | DemoUser2026!     |
| Marketing        | morgan@szlholdings.com       | DemoUser2026!     |
| Creative         | casey@szlholdings.com        | DemoUser2026!     |

## Required Environment Variables

| Variable           | Required | Description                                       |
| ------------------ | -------- | ------------------------------------------------- |
| `DATABASE_URL`     | Yes      | PostgreSQL connection string                      |
| `SESSION_SECRET`   | Yes      | Session signing secret (`openssl rand -hex 32`)   |
| `NODE_ENV`         | No       | `development` (default) or `production`           |
| `OPENAI_API_KEY`   | No       | AI features — falls back to mock if absent        |
| `STRIPE_SECRET_KEY`| No       | Billing — falls back to demo mode if absent       |
| `RESEND_API_KEY`   | No       | Email — skipped if absent                         |

See `.env.example` for the full list of optional integrations.

## Health Check

```
GET /api/health          → full service matrix (server, database, auth, AI, storage, job queue)
GET /api/health/live     → liveness probe (always 200)
GET /api/health/ready    → readiness probe (database connectivity)
GET /api/health/detailed → authenticated detailed diagnostics
```

## Platform Artifacts

| Artifact              | Path              | Type            | Purpose                              |
| --------------------- | ----------------- | --------------- | ------------------------------------ |
| Command (Lyte)        | `/command/`       | Command surface | Unified governance command surface   |
| SZL Holdings          | `/szl-holdings/`  | Command surface | Portfolio dashboard                  |
| Aegis                 | `/aegis/`         | Domain pack     | Defense & intelligence               |
| Terra                 | `/terra/`         | Domain pack     | Real estate intelligence             |
| Vessels               | `/vessels/`       | Domain pack     | Maritime intelligence                |
| PRISM Counsel         | `/prism-counsel/` | Domain pack     | Legal governance                     |
| Carlota Jo            | `/carlota-jo/`    | Domain pack     | Advisory consulting                  |
| Firestorm             | `/firestorm/`     | Domain pack     | Cybersecurity operations             |
| Stephen Site          | `/stephen-site/`  | Supporting      | Founder portfolio site               |
| CORTEX Mobile         | (Expo Go)         | Mobile          | Mobile command (React Native)        |
| API Server            | port 8080         | Backend         | REST + GraphQL + MCP server          |

## Demo Walkthrough (~15 minutes)

### 1. Environment Verification (1 minute)
Open `/api/health` in the browser. Confirm:
- `status: "healthy"`
- `services.database.status: "ok"` with latency under 50ms
- `services.auth.status: "configured"`
- `platform.totalApps: 11`

### 2. Login (30 seconds)
Navigate to `/command/` and log in with `admin@szlholdings.com` / `DemoAdmin2026!`.
The admin account has `platform_owner` role with full access to all domain packs.

### 3. Platform Overview (2 minutes)
Walk through the SZL Holdings dashboard at `/szl-holdings/`:
- Portfolio metrics and active domain packs
- The governed decision infrastructure narrative
- Leadership and milestone data

### 4. Domain Packs (5 minutes)
Walk through each domain pack to demonstrate the breadth of the platform:

- **Aegis** (`/aegis/`): Defense signals, threat assessment, covenant policies, OSINT feeds
- **Vessels** (`/vessels/`): Fleet tracking, voyage management, maritime corridors, exception management
- **Terra** (`/terra/`): Property analysis, market intelligence, deal pipeline
- **PRISM Counsel** (`/prism-counsel/`): Legal matters, compliance tracking, risk assessment
- **Carlota Jo** (`/carlota-jo/`): Advisory service packages, client engagement

### 5. Canonical Decision Loop (2 minutes)
Demonstrate the governed decision loop that powers all domain packs:
```
Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning
```
Show how signals in Vessels (fleet exceptions) flow through the same governance framework as signals in Aegis (threat intelligence).

### 6. Platform Primitives (2 minutes)
Highlight the five platform primitives visible across domain packs:
- **Outcome Graph** — decision lifecycle tracking
- **Proof Chain** — immutable audit trail
- **Covenant Policy** — permission and approval gates
- **Monte Carlo** — probabilistic risk simulation
- **Workflow Engine** — durable process orchestration

### 7. Multi-User Access (1 minute)
Open a second browser/incognito window and log in as `alex@szlholdings.com` / `DemoUser2026!`.
Show how RBAC governs what each role can see and do.

### 8. Mobile Preview (1 minute)
If Expo Go is available, show CORTEX mobile command on a device or simulator.

## Troubleshooting

| Issue                        | Fix                                                          |
| ---------------------------- | ------------------------------------------------------------ |
| API returns 500              | Run `pnpm --filter @workspace/api-server run build`          |
| Login fails                  | Run `pnpm seed` to recreate demo users                      |
| Port 8080 conflict           | Normal — Command workflow manages the API server internally  |
| Database connection error    | Verify `DATABASE_URL` in environment                         |
| Seed warns about voyages     | Non-critical — schema drift in domain tables, demo works     |
| `z is not defined`           | Run `pnpm --filter @workspace/api-server run build` to rebuild |
| Health shows `missing_secret`| Set `SESSION_SECRET` in .env                                 |

## Root Scripts

| Command                | Purpose                                          |
| ---------------------- | ------------------------------------------------ |
| `pnpm install`         | Install all workspace dependencies               |
| `pnpm seed`            | Seed demo data with post-verification assertions |
| `pnpm start`           | Start all services                               |
| `pnpm build`           | Typecheck + build all packages                   |
| `pnpm test`            | Run API and component tests                      |
| `pnpm migrate`         | Push schema changes to database                  |
| `pnpm qa:site`         | Run full QA suite (routes, links, trust, meta)   |
