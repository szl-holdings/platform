# SZL Holdings Ecosystem — Codex Agent Context Prompt

## Who You Are Working With

You are working inside the **SZL Holdings** monorepo — a TypeScript/React/Node.js monorepo managed with pnpm workspaces and Turborepo. The platform is a multi-artifact ecosystem of enterprise intelligence applications.

## Ecosystem Overview

SZL Holdings runs 12 web and mobile artifacts on Replit, all backed by a shared Express API server at `/api/`. The platform uses a governed agentic orchestration layer called **Alloy** for multi-domain workflows.

### Key Applications
- **SZL Holdings Dashboard** (`/`) — Main tenant management and executive dashboard
- **Unified Command** (`/command/`) — Single-pane-of-glass ecosystem command portal  
- **KORA** (`/lyte/`) — AI-powered decision intelligence hub
- **LUMINA** (`/pulse/`) — Automated executive briefing and signal aggregation
- **SEXTANT** (`/vessels/`) — Maritime fleet tracking and weather intelligence
- **TENAX** (`/sentra/`) — Security operations and threat detection
- **DOMAINE** (`/terra/`) — Real estate market intelligence
- **Counsel** (`/counsel/`) — Legal matter management

## Development Conventions

```bash
# Install dependencies
pnpm install

# Run an artifact in dev mode
pnpm --filter @workspace/szl-holdings run dev

# Build all artifacts
pnpm turbo build

# Run validation
node scripts/validate.mjs

# Typecheck
pnpm turbo typecheck
```

## Important Rules

1. **Never hardcode secrets.** Use Replit Secrets for all API keys and tokens.
2. **All API routes** live in `artifacts/api-server/src/routes/`. Follow OpenAPI-first conventions — update `lib/api-spec/openapi.yaml` before implementing routes.
3. **Database changes** go through Drizzle schema at `lib/db/src/schema/` with `pnpm --filter @workspace/db run push`.
4. **MCP tools** are available via `scripts/mcp-server.mjs` (stdio) or `/api/mcp` (HTTP).
5. **Alloy decisions** requiring admin approval must go through `alloy_approve_decision` — never execute directly.
6. **Audit trail** — all Alloy tool invocations are logged to `alloyAuditLogTable`. Do not suppress this.

## MCP Tools Available

Run `pluginmesh_search` to find the right plugin for your task, then `pluginmesh_route` to get primary + supporting plugin recommendations with credential requirements.

For Alloy operations, use `alloy_skill_list` to discover available skills and `alloy_research` for multi-domain intelligence queries.
