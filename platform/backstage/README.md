# SZL Holdings Developer Portal — Backstage

This directory contains the Backstage IDP configuration for the SZL Holdings platform. Backstage is the single pane of glass for service discovery, golden-path scaffolding, TechDocs, and platform scorecards.

---

## Directory Structure

```
platform/backstage/
├── app-config.yaml          # Backstage application configuration
├── package.json             # Backstage workspace root
├── packages/
│   ├── app/                 # Backstage frontend (React SPA)
│   │   └── src/
│   │       ├── App.tsx      # Routes: Catalog, Scorecards, Runbooks, TechDocs, Scaffolder
│   │       ├── apis.ts      # API factory registration (SCM integrations)
│   │       └── components/
│   │           └── runbooks/
│   │               └── RunbooksPage.tsx  # Custom runbooks catalog view
│   └── backend/             # Backstage backend (Node.js)
│       └── src/
│           └── index.ts     # Catalog, TechDocs, Tech Insights, Scaffolder, Auth
├── catalog/
│   ├── domains.yaml         # 6 domain entities
│   ├── systems.yaml         # 25 system entities
│   ├── groups.yaml          # 9 group entities + 3 user stubs
│   ├── apis.yaml            # 6 API entities (REST + AsyncAPI stubs)
│   └── resources.yaml       # 12 resource entities
├── scripts/
│   └── validate-catalog.mjs # Backstage-native catalog validation (uses @backstage/catalog-model)
├── templates/
│   ├── new-domain-api/      # Golden path: new REST API service
│   ├── new-agent-worker/    # Golden path: new AI agent worker
│   └── new-domain-ui/       # Golden path: new domain SPA
└── README.md                # this file
```

---

## Running Backstage Locally

> **Prerequisites:** Node.js 22+, pnpm 10+, git

### Option A: Run the in-repo Backstage scaffold

The `packages/` directory contains a Backstage app + backend scaffold.
It uses its own `pnpm-workspace.yaml` (isolated from the monorepo root) to avoid
package conflicts with the main workspace.

> **Status:** the scaffold's source files, catalog (119 entities), templates, and
> Tech Insights fact retrievers are all validated. End-to-end `pnpm dev` startup
> has **not** been run from this commit — registering Backstage as its own
> Replit artifact and booting both services is tracked under the Phase 5
> follow-up task. The commands below are the documented entry point once Phase
> 5 lands.

```bash
# From the backstage directory
cd platform/backstage

# Install dependencies (uses local pnpm-workspace.yaml: packages/*)
pnpm install

# Start both app (frontend) and backend concurrently
pnpm dev
#  → Frontend:  http://localhost:3000
#  → Backend:   http://localhost:7007
```

Environment variables to set before starting (copy from `.env.example` or export inline):

```bash
export GITHUB_TOKEN=ghp_...                   # Personal Access Token (read:org, read:repo)
export GITHUB_APP_ID=123456
export GITHUB_APP_CLIENT_ID=Iv1.abc123
export GITHUB_APP_CLIENT_SECRET=abc123
export GITHUB_APP_PRIVATE_KEY_PATH=/path/to/key.pem
export POSTGRES_HOST=localhost                 # Optional; SQLite used if unset
export POSTGRES_USER=backstage
export POSTGRES_PASSWORD=backstage
export POSTGRES_DB=backstage
```

### Option B: Point an existing Backstage instance at this catalog

Add the following to your Backstage `app-config.yaml` under `catalog.locations`:

```yaml
- type: file
  target: <path-to-repo>/platform/backstage/catalog/domains.yaml
- type: file
  target: <path-to-repo>/platform/backstage/catalog/systems.yaml
# ... (see app-config.yaml for all locations)
```

---

## GitHub Integration (Production Setup)

The `app-config.yaml` is pre-configured for GitHub integration with placeholder credentials.

### Required Environment Variables

```bash
# Personal Access Token (development only — never in production)
GITHUB_TOKEN=ghp_...

# GitHub App credentials (production)
GITHUB_APP_ID=...
GITHUB_APP_WEBHOOK_SECRET=...
GITHUB_APP_CLIENT_ID=...
GITHUB_APP_CLIENT_SECRET=...
GITHUB_APP_PRIVATE_KEY_PATH=/path/to/private-key.pem
```

### Creating a GitHub App

1. Go to https://github.com/organizations/szl-holdings/settings/apps
2. Create a new GitHub App with the following permissions:
   - Repository: `Contents` (read), `Metadata` (read), `Pull requests` (write)
   - Organization: `Members` (read)
3. Set the Webhook URL to your Backstage instance URL
4. Set `GITHUB_APP_ID`, `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`, `GITHUB_APP_PRIVATE_KEY_PATH`
5. Uncomment the `apps:` block in `app-config.yaml`

---

## Catalog Validation

Validation uses `@backstage/catalog-model` — the same library that Backstage's own backend uses when ingesting entities. No running Backstage server is required.

```bash
# Run Backstage-native catalog validation (uses @backstage/catalog-model@1.7.3)
pnpm --filter @szl-holdings/backstage-root catalog:validate

# Expected output (119 entities, 0 errors, 0 warnings):
# ✅ Validation PASSED — clean.
# Validator: @backstage/catalog-model@1.7.3
```

The validation script (`scripts/validate-catalog.mjs`) applies:

| Policy | Description |
|--------|-------------|
| `SchemaValidEntityPolicy` | JSON-Schema validation per kind (Component, Group, API, etc.) |
| `FieldFormatEntityPolicy` | metadata.name/namespace format, owner/system ref syntax |
| `NoForeignRootFieldsEntityPolicy` | No unknown top-level YAML keys |

Additionally, SZL-specific checks on Component entities:
- `spec.type` is a canonical platform type
- `spec.lifecycle` is valid (`production \| experimental \| deprecated`)
- `spec.owner` references a known group
- `metadata.annotations` block is present

---

## TechDocs

TechDocs is configured in `app-config.yaml` to read documentation from the repo's `docs/` directory:

| Source | Backstage Location |
|--------|--------------------|
| `docs/` (repo root) | Root TechDocs site |
| `artifacts/<name>/docs/` | Component-level docs |
| `packages/<name>/README.md` | Library docs |

---

## Scaffolder Templates

The three golden-path templates are available in Backstage's scaffolder UI:

| Template | Template ID | Creates |
|----------|-------------|---------|
| New Domain API | `template:new-domain-api` | `services/<slug>/` — Express REST service |
| New Agent Worker | `template:new-agent-worker` | `workers/<slug>/` — AI agent worker |
| New Domain UI | `template:new-domain-ui` | `artifacts/<slug>/` — React SPA |

See `docs/golden-paths.md` for full documentation on each template.

---

## Scorecards

Backstage Scorecards show platform maturity per service. Scores are sourced from `docs/platform-scorecard.md` and update as services meet requirements:

| Dimension | Score Source |
|-----------|-------------|
| Catalog entry | `catalog-info.yaml` present |
| Health endpoint | `/health` returns 200 |
| OTel | `@workspace/otel` dependency present |
| Structured logging | `@workspace/telemetry-standards` dependency present |
| Score manifest | `score.yaml` present |
| Policy guard | `@workspace/policy-guard` dependency present |

---

## Runbooks

Operational runbooks are linked from each component's `catalog-info.yaml` via the `szl.io/runbook` annotation. Runbooks are stored in `infra/runbooks/` and served through TechDocs.
