# SZL Holdings — GitHub Packages Strategy

> Registry: `https://github.com/orgs/szl-holdings/packages`
> Platform repo: `szl-holdings/szl-holdings-platform`

---

## Overview

SZL Holdings uses GitHub Packages as the authoritative artifact registry across all five package ecosystems. This centralizes dependency distribution, enforces access control through GitHub's permission model, and keeps all publishing within the existing GitHub infrastructure without additional registry costs.

| Registry | Scope/Namespace | Status | Ecosystem |
|----------|----------------|--------|-----------|
| npm | `@szl-holdings` | **Active** — 22+ packages ready | TypeScript/JavaScript |
| Container (ghcr.io) | `ghcr.io/szl-holdings/*` | **Active** — 6 images ready | Docker/OCI |
| Maven | `com.szlholdings` | **Template ready** | Java/Kotlin |
| NuGet | `SzlHoldings.*` | **Template ready** | .NET |
| RubyGems | `szl-holdings-*` | **Template ready** | Ruby |

---

## npm Registry

### Configuration

- Registry URL: `https://npm.pkg.github.com`
- Scope: `@szl-holdings`
- Auth: `GITHUB_TOKEN` (CI) or PAT with `read:packages`/`write:packages` (local)
- Config: `.npmrc` at monorepo root

### Published Packages

All `lib/*` packages are scoped to `@szl-holdings`:

| Package | Registry Name | Description |
|---------|--------------|-------------|
| `lib/shared-ui` | `@szl-holdings/shared-ui` | Design system, React components |
| `lib/observability` | `@szl-holdings/observability` | Sentry, logging, monitoring |
| `lib/config` | `@szl-holdings/config` | Shared configuration primitives |
| `lib/services` | `@szl-holdings/services` | Core service layer |
| `lib/api-spec` | `@szl-holdings/api-spec` | OpenAPI spec + codegen |
| `lib/analytics` | `@szl-holdings/analytics` | Plausible analytics wrapper |
| `lib/api-client-react` | `@szl-holdings/api-client-react` | React Query API client |
| `lib/api-zod` | `@szl-holdings/api-zod` | Zod schemas for API types |
| `lib/approvals` | `@szl-holdings/approvals` | Approval workflow logic |
| `lib/audit` | `@szl-holdings/audit` | Audit trail system |
| `lib/auth` | `@szl-holdings/auth` | Authentication primitives |
| `lib/data-connectors` | `@szl-holdings/data-connectors` | External data connectors |
| `lib/graphql-client` | `@szl-holdings/graphql-client` | Apollo GraphQL client |
| `lib/i18n` | `@szl-holdings/i18n` | Internationalization |
| `lib/mcp-client` | `@szl-holdings/mcp-client` | MCP protocol client |
| `lib/proof-chain` | `@szl-holdings/proof-chain` | Tamper-evident audit chain |
| `lib/replit-auth-web` | `@szl-holdings/replit-auth-web` | Replit Auth web integration |
| `lib/workflow-engine` | `@szl-holdings/workflow-engine` | Automation workflow engine |
| `lib/worldline` | `@szl-holdings/worldline` | Timeline/event sourcing |
| `lib/db` | `@szl-holdings/db` | Database schema (Drizzle ORM) |
| `lib/ai-engine` | `@szl-holdings/ai-engine` | AI inference engine |
| `lib/integrations-anthropic-ai` | `@szl-holdings/integrations-anthropic-ai` | Anthropic Claude integration |
| `lib/integrations-gemini-ai` | `@szl-holdings/integrations-gemini-ai` | Google Gemini integration |
| `lib/integrations-openai-ai-server` | `@szl-holdings/integrations-openai-ai-server` | OpenAI server-side integration |

### Install from GitHub Packages

```bash
# Configure scope in project .npmrc
echo "@szl-holdings:registry=https://npm.pkg.github.com" >> .npmrc
echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> .npmrc

# Install a package
npm install @szl-holdings/shared-ui
# or
pnpm add @szl-holdings/shared-ui
```

---

## Container Registry (ghcr.io)

### Configuration

- Registry: `ghcr.io`
- Namespace: `ghcr.io/szl-holdings/`
- Auth: `GITHUB_TOKEN` (CI) or PAT with `read:packages`/`write:packages` (local)

### Published Images

| Service | Image | Dockerfile |
|---------|-------|-----------|
| API Server | `ghcr.io/szl-holdings/api-server` | `artifacts/api-server/Dockerfile` |
| Vessels | `ghcr.io/szl-holdings/vessels` | `artifacts/vessels/Dockerfile` |
| Terra | `ghcr.io/szl-holdings/terra` | `artifacts/terra/Dockerfile` |
| Sentra | `ghcr.io/szl-holdings/sentra` | `artifacts/sentra/Dockerfile` |
| Counsel | `ghcr.io/szl-holdings/counsel` | `artifacts/counsel/Dockerfile` |
| Carlota Jo | `ghcr.io/szl-holdings/carlota-jo` | `artifacts/carlota-jo/Dockerfile` |

### Image Tagging Strategy

Every image is published with three tags on release:

| Tag | Example | Purpose |
|-----|---------|---------|
| Semver | `1.2.3` | Pin to exact release |
| Minor | `1.2` | Float within minor |
| SHA | `sha-abc1234` | Pin to exact commit |
| `latest` | `latest` | Default branch tip |

### Pull an image

```bash
# Authenticate
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull
docker pull ghcr.io/szl-holdings/api-server:latest
docker pull ghcr.io/szl-holdings/aegis:1.2.3
```

### Local development with Docker Compose

```bash
# Start all services
docker-compose -f ops/local/docker-compose.yml up --build

# Start only API + SZL Holdings web
docker-compose -f ops/local/docker-compose.yml up api-server szl-holdings

# Tear down
docker-compose -f ops/local/docker-compose.yml down
```

---

## Maven Registry

- Status: **Template ready** — see `docs/github/packages/maven/`
- URL: `https://maven.pkg.github.com/szl-holdings/szl-holdings-platform`
- Group ID: `com.szlholdings`
- CI: `.github/workflows/maven-publish.yml`

Activate when the first Java/Kotlin package is added.

---

## NuGet Registry

- Status: **Template ready** — see `docs/github/packages/nuget/`
- URL: `https://nuget.pkg.github.com/szl-holdings`
- Package prefix: `SzlHoldings.*`
- CI: `.github/workflows/nuget-publish.yml`

Activate when the first .NET package is added.

---

## RubyGems Registry

- Status: **Template ready** — see `docs/github/packages/rubygems/`
- URL: `https://rubygems.pkg.github.com/szl-holdings`
- Gem prefix: `szl-holdings-`
- CI: `.github/workflows/rubygems-publish.yml`

Activate when the first Ruby gem is added.

---

## Naming Conventions

| Registry | Convention | Example |
|----------|-----------|---------|
| npm | `@szl-holdings/<kebab-name>` | `@szl-holdings/shared-ui` |
| Container | `ghcr.io/szl-holdings/<kebab-name>` | `ghcr.io/szl-holdings/api-server` |
| Maven | `com.szlholdings:<kebab-artifact-id>` | `com.szlholdings:szl-core` |
| NuGet | `SzlHoldings.<PascalName>` | `SzlHoldings.Command` |
| RubyGems | `szl-holdings-<kebab-name>` | `szl-holdings-command` |

---

## Versioning Policy

- All packages follow **semver**: `MAJOR.MINOR.PATCH`
- All packages in the monorepo are released together (single version per release)
- Version bumps are triggered by git tags: `v1.2.3`
- Pre-release: append `-rc.1`, `-beta.1`, `-alpha.1` as needed
- Development builds: `-SNAPSHOT` (Maven), `-preview` (NuGet)

---

## Access Control

| Visibility | Who Can Pull |
|------------|-------------|
| Public packages | Any GitHub user (with `read:packages` scope for auth) |
| Private packages | Only org members or explicitly invited users |

Current policy: all packages are **public** (consistent with the public repo).

### Connecting packages to the repo

After publishing a package, connect it to the repository in GitHub UI:
1. Go to the package page on GitHub
2. Click **Connect repository**
3. Select `szl-holdings/szl-holdings-platform`

This links the package in the repo's sidebar and applies repo visibility rules.

---

## Free Tier Limits

GitHub Packages free tier (public repos):
- **Storage:** Unlimited for public packages on public repos
- **Data transfer:** Unlimited for public packages

Private packages (if needed):
- **Storage:** 500 MB included per account
- **Data transfer:** 1 GB/month included

See: [GitHub Packages billing](https://docs.github.com/en/billing/managing-billing-for-github-packages/about-billing-for-github-packages)

---

## Related Files

- `.npmrc` — npm scope + registry configuration
- `ops/local/docker-compose.yml` — local multi-service development
- `.github/workflows/npm-publish.yml` — npm CI
- `.github/workflows/container-publish.yml` — container CI
- `docs/github/packages-security.md` — token management and secret hygiene
- `ops/github/packages-manual-checklist.md` — GitHub UI steps
- `scripts/github/audit-packages.ts` — package audit script
