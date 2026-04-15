# SZL Holdings — Internal Development Hub

> **Members-only context.** This README is visible only to organization members.

---

## Quick Start

```bash
# Clone the monorepo
git clone git@github.com:szl-holdings/szl-holdings-platform.git
cd szl-holdings-platform

# Install dependencies
pnpm install

# Start the development environment (all apps)
pnpm dev

# Start a specific app
pnpm --filter @workspace/szl-holdings dev
pnpm --filter @workspace/lyte-command-center dev
pnpm --filter @workspace/firestorm dev
pnpm --filter @workspace/api-server dev
```

## Environment Setup

1. Copy `.env.example` to `.env` and fill in required values
2. Ensure PostgreSQL 16 is running locally or use the Replit-managed instance
3. Run database migrations: `pnpm --filter @workspace/db migrate`
4. Start the API server first, then the frontend apps

## Monorepo Structure

```
szl-holdings-platform/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express 5 API — all backend routes
│   ├── szl-holdings/       # Corporate dashboard
│   ├── lyte-command-center/# Business observability command surface
│   ├── firestorm/          # Aegis — defense & intelligence
│   ├── vessels/            # Maritime fleet command
│   ├── terra/              # Real estate intelligence
│   ├── prism-counsel/      # Legal matter command
│   ├── carlota-jo/         # Premium advisory
│   ├── imperium/           # Cloud sovereignty engine
│   ├── command/            # Ecosystem command portal
│   ├── stephen-site/       # Founder portfolio
│   └── szl-holdings-mobile/# CORTEX — unified mobile command (Expo)
├── lib/                    # Shared libraries (37 packages)
│   ├── db/                 # Drizzle ORM schemas (644 tables)
│   ├── ai-engine/          # AI orchestration, model routing, safety
│   ├── shared-ui/          # Design system tokens & components
│   ├── api-spec/           # OpenAPI spec & codegen
│   └── ...                 # See lib/ for full list
├── docs/                   # Architecture, investor, trust docs
├── .github/                # CI workflows, templates, governance
└── infra/                  # Infrastructure-as-code
```

## Key Development Commands

| Command | Purpose |
|---------|---------|
| `pnpm install` | Install all dependencies |
| `pnpm dev` | Start all dev servers |
| `pnpm run lint` | Lint all packages |
| `pnpm run typecheck` | TypeScript type checking |
| `pnpm run test` | Run test suites |
| `pnpm --filter @workspace/db generate` | Generate Drizzle migrations |
| `pnpm --filter @workspace/db migrate` | Run pending migrations |
| `pnpm --filter @workspace/api-spec codegen` | Regenerate API client |

## CI Pipeline

All PRs must pass before merge:

- **Lint** — ESLint across all packages
- **Typecheck** — `tsc --noEmit` strict mode
- **Test** — Unit test suite with coverage
- **Build** — API server + all 10 web apps
- **CodeQL** — Static security analysis
- **Dependency Review** — Vulnerability + license audit
- **Lighthouse** — Performance thresholds (80+ perf, 90+ a11y)

## Branch Strategy

- `master` — Production branch, protected
- Feature branches — `feat/description`, `fix/description`
- Squash merge only — clean linear history

## Key Architecture Docs

| Document | Path |
|----------|------|
| System Overview | `docs/architecture/system-overview.md` |
| Platform Map | `docs/architecture/platform-map.md` |
| Data Flow | `docs/architecture/data-flow.md` |
| Trust Center | `docs/trust/trust-center.md` |
| Security Posture | `docs/trust/security-posture.md` |
| Deployment Model | `docs/trust/deployment-model.md` |
| Ops Runbook | `docs/ops-runbook.md` |

## Database

- **644 tables** across all domains
- Drizzle ORM with strict TypeScript schemas
- All queries scoped by `org_id` for multi-tenancy
- Migration history tracked in `lib/db/migrations/`

## Contact

**Stephen Lutar** — Founder & CEO
- Email: stephen@szlholdings.com
