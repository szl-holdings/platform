# SZL Holdings — Golden Path Catalog

**Version:** 2.0  
**Date:** 2026-04-28  
**Status:** ✅ IMPLEMENTED — Phase 3 (Developer Control Plane)  
**Purpose:** The three canonical golden paths are implemented as Backstage Software Templates. Each template is live under `/platform/backstage/templates/`. Any new service/agent/UI that does not follow a golden path must explain why in its `catalog-info.yaml`.  
**Audience:** Platform engineers, all domain engineers

## Template Locations

| Template | Path | Template ID |
|----------|------|-------------|
| New Domain API | `platform/backstage/templates/new-domain-api/` | `template:new-domain-api` |
| New Agent Worker | `platform/backstage/templates/new-agent-worker/` | `template:new-agent-worker` |
| New Domain UI | `platform/backstage/templates/new-domain-ui/` | `template:new-domain-ui` |

## Usage (via Backstage Scaffolder)

1. Start Backstage locally (see `platform/backstage/README.md`)
2. Navigate to **Create → Choose Template**
3. Select the appropriate golden path
4. Fill in parameters and confirm
5. Backstage opens a Pull Request with the scaffolded skeleton

## Usage (manual — until Backstage is live)

```bash
# Copy the template skeleton manually and fill in the Nunjucks variables
cp -r platform/backstage/templates/new-domain-api/skeleton services/<your-slug>
# Replace ${{ values.* }} placeholders with your values
```

---

## What Is a Golden Path?

A golden path is a pre-built, opinionated scaffold that produces a production-ready workload skeleton in one command. It is not a rigid template — engineers can diverge — but the path removes all the toil of wiring up boilerplate: health endpoints, OTel, structured logging, env contract, auth, policy guard, CI workflow, and Backstage catalog entry.

A golden path consists of:
1. A **Backstage Software Template** (Jinja/Nunjucks, executed by Backstage scaffolder)
2. A **Score manifest** (`score.yaml`) pre-populated for the workload type
3. A **catalog-info.yaml** pre-populated with correct domain, system, owner
4. A **base CI workflow** wired up in `.github/workflows/`
5. An **env contract** that imports from `packages/env`
6. **OTel instrumentation** imported from `packages/otel`
7. A **health endpoint** at `/health` returning `{ status: "ok", version: string }`
8. A **structured logger** from `packages/telemetry-standards`
9. A **policy guard** import from `packages/policy-guard`

---

## Golden Path 1: `new-domain-api`

**Purpose:** Scaffold a new domain-specific REST API service (TypeScript/Express or Hono).  
**When to use:** Adding a new domain pack that needs its own backend API service, or extracting a domain from api-server.  
**Template ID:** `template:new-domain-api`

### What It Produces

```
services/<domain-slug>/
├── src/
│   ├── index.ts              # Entry point — binds PORT, starts Express/Hono
│   ├── health.ts             # GET /health → { status: "ok", version }
│   ├── routes/
│   │   └── <domain>.ts       # Starter domain route file
│   ├── middleware/
│   │   ├── auth.ts           # Imports packages/auth-shared
│   │   ├── policy.ts         # Imports packages/policy-guard
│   │   └── otel.ts           # Imports packages/otel
│   └── logger.ts             # Imports packages/telemetry-standards
├── package.json              # @workspace/<domain>-api, Node 22, TypeScript 5
├── tsconfig.json             # Extends ../../tsconfig.base.json
├── score.yaml                # Score workload manifest
├── catalog-info.yaml         # Backstage Component kind: service
├── Dockerfile                # FROM node:22-alpine, multi-stage
└── .env.example              # Documents required env vars
```

### Required Ingredients

| Ingredient | Source | Notes |
|-----------|--------|-------|
| `packages/env` | `@workspace/env` | Zod-validated env; domain-specific vars extend base schema |
| `packages/auth-shared` | `@workspace/auth-shared` | Session/JWT verification middleware |
| `packages/policy-guard` | `@workspace/policy-guard` | Policy enforcement on all domain routes |
| `packages/otel` | `@workspace/otel` | OTel SDK — auto-instruments Express/Hono routes |
| `packages/telemetry-standards` | `@workspace/telemetry-standards` | Structured JSON logger (pino-compatible) |
| `packages/observability-core` | `@workspace/observability-core` | Health pool, slow query if uses shared DB |
| `lib/db` | `@szl-holdings/db` | Database client if the service needs DB access |
| `packages/shared-contracts` | `@workspace/shared-contracts` | API error envelope: `{ error, code, details }` |

### Template Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `domainName` | string | Human-readable domain name (e.g. "Meridian") |
| `domainSlug` | string | URL/package slug (e.g. "meridian") |
| `ownerGroup` | select | Owner group from canonical list |
| `system` | select | Backstage system this belongs to |
| `needsDatabase` | boolean | Whether to wire up `lib/db` |
| `port` | number | Default listen port (added to env schema) |

### Health Endpoint Contract

```typescript
// GET /health
// Response: 200 OK
{
  "status": "ok",
  "version": "1.0.0",
  "domain": "<domain-slug>",
  "uptime": 12345,
  "db": "ok"          // only if needsDatabase=true
}
```

### CI Wiring

The template adds a Backstage-managed GitHub Actions workflow reference. The root `ci.yml` already covers lint, typecheck, and build via Turbo. The new service only needs its own entry in `turbo.json` (handled by the template).

---

## Golden Path 2: `new-agent-worker`

**Purpose:** Scaffold a new AI agent worker or async background worker (TypeScript or Python).  
**When to use:** Adding a new AI agent to the Alloy fabric, a new embedding/ranking worker, or any async processing task.  
**Template ID:** `template:new-agent-worker`

### What It Produces (TypeScript variant)

```
workers/<agent-slug>/
├── src/
│   ├── index.ts              # Entry point — queue/event loop or cron
│   ├── agent.ts              # Core agent logic
│   ├── health.ts             # Optional: /health for long-running workers
│   ├── prompts/
│   │   └── <agent-slug>.ts   # Prompt definitions
│   └── logger.ts             # packages/telemetry-standards
├── package.json              # @workspace/<agent-slug>-worker, Node 22
├── tsconfig.json             # Extends ../../tsconfig.base.json
├── score.yaml                # Score workload manifest (type: worker)
├── catalog-info.yaml         # Backstage Component kind: worker
├── Dockerfile                # FROM node:22-alpine
└── .env.example
```

### What It Produces (Python variant)

```
workers/<agent-slug>/
├── src/
│   ├── main.py               # Entry point
│   ├── agent.py              # Core agent logic
│   ├── health.py             # FastAPI /health endpoint
│   └── logger.py             # Structured JSON logging (structlog)
├── pyproject.toml            # Python 3.11+, FastAPI + Pydantic v2
├── requirements.txt
├── score.yaml
├── catalog-info.yaml
├── Dockerfile                # FROM python:3.11-slim
└── .env.example
```

### Required Ingredients

| Ingredient | Source | TypeScript | Python | Notes |
|-----------|--------|-----------|--------|-------|
| `packages/agents-core` | `@workspace/agents-core` | ✅ | ❌ | Agent runtime |
| `packages/agents-prompts` | `@workspace/agents-prompts` | ✅ | ❌ | Prompt registry |
| `packages/agents-tools` | `@workspace/agents-tools` | ✅ | ❌ | Tool definitions |
| `packages/otel` | `@workspace/otel` | ✅ | ❌ (opentelemetry-sdk-python) | Tracing |
| `packages/aef-policy-guard` | `@workspace/aef-policy-guard` | ✅ | ❌ | AEF policy |
| `packages/cognitive-observability` | `@workspace/cognitive-observability` | ✅ | ❌ | AI trace |
| `packages/telemetry-standards` | `@workspace/telemetry-standards` | ✅ | ❌ | Log schema |
| `lib/proof-chain` | `@szl-holdings/proof-chain` | ✅ | ❌ | Proof emission |
| FastAPI + Pydantic v2 | PyPI | ❌ | ✅ | Python HTTP + validation |
| structlog | PyPI | ❌ | ✅ | Python structured logging |

### Template Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `agentName` | string | Human-readable agent name |
| `agentSlug` | string | Package/file slug |
| `language` | select | typescript \| python |
| `triggerType` | select | queue \| cron \| event \| http |
| `ownerGroup` | select | Owner group |
| `system` | select | Backstage system |
| `emitsProof` | boolean | Whether to wire lib/proof-chain |
| `needsDatabase` | boolean | Whether to wire lib/db |

### Proof Emission Contract

If `emitsProof=true`, the agent calls `proofChain.emit()` after every consequential decision:

```typescript
import { proofChain } from '@szl-holdings/proof-chain';

await proofChain.emit({
  agentId: '<agent-slug>',
  decisionId: crypto.randomUUID(),
  inputs: { /* redacted inputs */ },
  outcome: { /* outcome summary */ },
  policy: '<policy-id>',
  timestamp: new Date().toISOString(),
});
```

---

## Golden Path 3: `new-domain-ui`

**Purpose:** Scaffold a new domain-specific React SPA artifact (Vite + React 19 + Tailwind 4).  
**When to use:** Adding a new product surface / domain pack UI.  
**Template ID:** `template:new-domain-ui`

### What It Produces

```
artifacts/<domain-slug>/
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Root component with routing
│   ├── pages/
│   │   ├── Dashboard.tsx     # Default landing page
│   │   └── NotFound.tsx      # 404
│   ├── components/           # Domain-specific components
│   ├── hooks/
│   │   ├── useApi.ts         # TanStack Query + @szl-holdings/api-client-react
│   │   └── useAuth.ts        # @workspace/auth-shared
│   ├── lib/
│   │   └── otel.ts           # OTel browser instrumentation from @workspace/otel
│   └── styles/
│       └── globals.css       # Tailwind 4 base
├── index.html
├── vite.config.ts            # Vite 7, @vitejs/plugin-react, allowedHosts: true
├── package.json              # @workspace/<domain-slug>, React 19
├── tsconfig.json             # Extends ../../tsconfig.base.json
├── .replit-artifact/
│   └── artifact.toml         # Registers artifact in Replit workspace
├── score.yaml                # Score workload manifest (type: website)
├── catalog-info.yaml         # Backstage Component kind: website
└── .env.example              # VITE_APP_URL, domain-specific vars
```

### Required Ingredients

| Ingredient | Source | Notes |
|-----------|--------|-------|
| React 19 | `pnpm-workspace.yaml` catalog | Pinned to `19.1.0` |
| Vite 7 | catalog | Pinned; `server.allowedHosts: true` required |
| Tailwind 4 | catalog | `@tailwindcss/vite` plugin |
| TanStack Query | catalog | `@tanstack/react-query` pinned to `5.99.0` |
| `@szl-holdings/api-client-react` | `lib/api-client-react` | Generated React Query API client |
| `packages/auth-shared` | `@workspace/auth-shared` | Auth state management |
| `packages/otel` | `@workspace/otel` | Browser trace instrumentation |
| `@szl-holdings/design-system` | `lib/design-system` | Design tokens |
| lucide-react | catalog | Icons |
| `@replit/vite-plugin-cartographer` | catalog | Replit dev UX |
| `@replit/vite-plugin-dev-banner` | catalog | Replit dev UX |
| `@replit/vite-plugin-runtime-error-modal` | catalog | Dev DX |

### Template Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `domainName` | string | Human-readable domain name |
| `domainSlug` | string | URL/package slug |
| `previewPath` | string | Replit preview path (e.g. `/meridian/`) |
| `ownerGroup` | select | Owner group |
| `system` | select | Backstage system |
| `hasStripe` | boolean | Whether to include Stripe client setup |
| `hasI18n` | boolean | Whether to include i18next (like carlota-jo) |

### Vite Config Contract

Every domain UI must include:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT ?? '5173'),
    allowedHosts: true,     // Required for Replit proxy
  },
  // ...
});
```

### artifact.toml Contract

```toml
[[artifact]]
id = "artifacts/<domain-slug>"
kind = "web"
title = "<Domain Name> — <Subtitle>"
previewPath = "/<domain-slug>/"
```

---

## Cross-Cutting Requirements (All Golden Paths)

These requirements apply to all three golden paths and will be enforced by CI checks in Phase 3:

| Requirement | Enforcement |
|-------------|-------------|
| `catalog-info.yaml` present | CI lint step |
| `score.yaml` present | CI lint step |
| `.env.example` present and complete | `scripts/check-env-coverage.ts` |
| Health endpoint at `/health` (services) | `pnpm health:check` |
| No cross-artifact imports | Biome `noRestrictedImports` rule |
| TypeScript strict mode | `tsconfig.base.json` |
| Biome lint passing | `pnpm lint` |
| Node 22 in Dockerfile | CI container build check |
| Structured log schema from `packages/telemetry-standards` | Code review; future lint rule |
| OTel instrumentation from `packages/otel` | Code review; future lint rule |

---

## Golden Path Deviations

Legitimate reasons to deviate from a golden path:
- **Python services** — use structlog, FastAPI, and opentelemetry-sdk-python instead of TypeScript equivalents
- **Video artifacts** — no health endpoint required (static React animation)
- **Design/mockup artifacts** — no auth, no health endpoint required
- **Expo mobile** — different Vite config and artifact.toml shape; use mobile scaffold instead

Deviations must be documented in the component's `catalog-info.yaml` under `metadata.annotations`:
```yaml
annotations:
  szl.io/golden-path-deviation: "Python service; uses structlog + FastAPI instead of TS stack"
```
