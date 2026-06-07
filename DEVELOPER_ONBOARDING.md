# platform — Developer Onboarding

> **Doctrine v11 LOCKED** · The SZL Holdings platform monorepo.

This is the root onboarding doc for the full SZL platform monorepo. It covers
the monorepo structure, how to run locally, and where to start for the most
important packages a new developer touches first.

---

## 1. What this repo is

The `platform` monorepo contains the full SZL Holdings governed-decision platform:

- **apps/** — Alloy runtime API, ingestion orchestrator, eval runner, substrate inference
- **packages/** — `unified-kernel` (THE core), policy engine, MCP gateway, GraphQL gateway
- **services/** — Fabric API, Meridian control plane + forecast lab, VSP-OTEL
- **lib/** — DB schema (730 tables, Drizzle ORM), AI engine, proof-chain, RBAC

The **unified-kernel** (`packages/unified-kernel/`) is the most important package
for a new developer. Start there. See `packages/unified-kernel/DEVELOPER_ONBOARDING.md`.

---

## 2. Monorepo structure

```
platform/
├── apps/
│   ├── alloy-runtime-api/          Core runtime API (Express 5)
│   ├── alloy-ingestion-orchestrator/  Ingestion pipeline
│   └── substrate-inference/        Inference workers
├── packages/
│   ├── unified-kernel/             THE kernel (19 theses as software) ← START HERE
│   ├── aef-policy-guard/           Policy enforcement
│   ├── substrate-mcp-gateway/      MCP gateway
│   └── graphql-gateway/            GraphQL API
├── services/
│   ├── alloy-fabric-api/           Fabric API
│   ├── meridian_control_plane/     Meridian control
│   └── vsp-otel/                   OTEL span exporter
├── lib/
│   ├── db/                         Drizzle schema (730 tables)
│   └── ai-engine/                  AI inference engine
├── ARCHITECTURE.md                 Platform architecture overview ← READ FIRST
├── KNOWN-GAPS.md                   Known issues + remediation log
└── ENVIRONMENT_VARIABLES.md        All env vars documented
```

---

## 3. Running locally

### Prerequisites

- Node 22+ with pnpm
- PostgreSQL 16 (or use the Docker Compose)
- Docker (recommended for first run)

### First run

```bash
# FULL clone (never --depth 1)
git clone https://github.com/szl-holdings/platform.git && cd platform

# Copy env file and fill in secrets
cp .env.example .env.local
# Edit .env.local — at minimum set DATABASE_URL, HF_TOKEN

# Install all workspace packages
pnpm install

# Build the unified-kernel (required by most services)
pnpm -F @szl-holdings/unified-kernel build

# Run the kernel boot demo
pnpm -F @szl-holdings/unified-kernel boot

# Run all tests
pnpm test
```

---

## 4. Key packages for a new developer

| Package | Path | Priority |
|---|---|---|
| `unified-kernel` | `packages/unified-kernel/` | **Start here** — 19 theses as software |
| `aef-policy-guard` | `packages/aef-policy-guard/` | Policy gate evaluation |
| `substrate-mcp-gateway` | `packages/substrate-mcp-gateway/` | MCP tool interface |
| `alloy-runtime-api` | `apps/alloy-runtime-api/` | Main API server |
| `db` | `lib/db/` | Drizzle schema (730 tables) |

---

## 5. Doctrine constants (LOCKED)

| Constant | Value |
|---|---|
| Declarations | 749 |
| Axioms | 14 unique |
| Sorries | 163 |
| Kernel commit | `c7c0ba17` |
| Lambda uniqueness | Conjecture 1 — NOT a theorem |

---

## 6. Architecture reference

For the full platform architecture, read (in order):
1. `ARCHITECTURE.md` — high-level platform layer model
2. `packages/unified-kernel/DEVELOPER_ONBOARDING.md` — kernel deep-dive
3. `SUBSTRATE.md` — data substrate design
4. `API-SPEC.md` — API surface

---

## 7. CI and tests

```bash
# Run all package tests
pnpm test

# Run the unified-kernel doctrine invariants (REQUIRED before core PRs)
pnpm -F @szl-holdings/unified-kernel test

# Lint
pnpm lint

# Type-check
pnpm typecheck
```

CI workflows: `.github/workflows/` — ci.yml, doctrine.yml, tests.yml, ghcr-build-push.yml.

---

*Authored by Perplexity Computer Agent on behalf of Yachay (CTO).*
*Doctrine v11 LOCKED · 749/14/163 · Λ = Conjecture 1.*
*Signed-off-by: stephenlutar2-hash <stephenlutar2@gmail.com>*
