# AGENTS — artifacts/api-server

**Scope:** Narrows [root AGENTS.md](../../AGENTS.md) for the API server artifact.

## What This Is

The central Express 5 API server that backs all SZL Holdings surfaces. Every web artifact and the mobile app routes through this server. It owns: REST API routes, GraphQL (Apollo), MCP gateway, NEXUS static serve, WebSocket, and all business logic services.

## Before You Change Anything

1. Read [architecture.md](../../architecture.md) — system topology and middleware chain.
2. Read [policy-model.md](../../policy-model.md) — policy evaluation and proof chain rules.
3. Read [docs/PLATFORM_CANONICAL.md](../../docs/PLATFORM_CANONICAL.md) — build commands and runtime stack.
4. Read `src/app.ts` — understand the middleware chain order before adding middleware.

## Critical Rules

### Every governed route must call `checkPermission()` or `assertPermission()`
Routes that mutate governed state (approvals, actions, workflows, policy decisions) must evaluate permission before executing. No exceptions.

### `orgId` comes from the session — never from the request body
Extract `orgId` from `req.session.user.orgId` (or equivalent). Never trust a caller-supplied org ID for authorization.

### Correlation IDs are injected by `correlationMiddleware`
Do not generate correlation IDs inside route handlers. They are injected by the middleware and available on `req.correlationId`.

### AI-generated content in API responses must carry a proof ID
If a route returns AI-generated content, the response envelope must include the proof chain entry ID. Use the `ProofEntry` type from `@workspace/ontology`.

### The firestorm seed endpoint must be guarded in production
`NODE_ENV === "production"` must block any seed/reset endpoint. Do not rely on auth alone.

## Route File Organization

```
src/routes/
├── auth.ts        — OIDC, sessions, WebSocket tickets
├── alloy.ts       — Workflow engine, approvals, audit
├── terra.ts       — Property intelligence
├── vessels.ts     — Fleet tracking, maritime ops
├── nexus.ts       — NEXUS agentic layer
├── ai.ts          — AI tool execution
├── admin.ts       — Backup, tenant provisioning (founder_admin only)
└── ...
```

## Key Files

| File | Purpose |
|------|---------|
| `src/app.ts` | Express app setup, middleware chain |
| `src/server.ts` | Server entry point |
| `src/routes/` | Route handlers (one file per domain) |
| `src/services/forge/` | Forge governed agent factory |
| `src/middleware/` | Correlation, auth, rate limiting |
| `start.sh` | NEXUS auto-rebuild check + server start |
