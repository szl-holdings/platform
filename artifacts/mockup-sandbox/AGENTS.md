# AGENTS — artifacts/mockup-sandbox (NEXUS)

**Scope:** Narrows [root AGENTS.md](../../AGENTS.md) for the NEXUS agentic AI layer artifact.

## What This Is

NEXUS is the unified agentic AI orchestration layer, accessible at `/nexus/`. It is a Vite React app built to `dist/public/` and served statically by the API server. It has four pillars: Parallel Research Swarm, Persistent Memory + Skills Library, Universal Protocol Bridge, and Cross-App Orchestrator.

## NEXUS-Specific Rules

- **This is an internal/design sandbox.** Do not surface NEXUS routes in external marketing. It is a development and research tool.
- **Build pipeline:** Changes to `src/` require a NEXUS rebuild. The api-server `start.sh` handles this automatically — just restart the api workflow. Use `SKIP_NEXUS_BUILD=1` to skip rebuild during backend-only iterations.
- **The `kind=design` artifact kind** means this artifact does not have a dedicated Replit workflow for live dev. Changes build and serve via the api-server.

## Build Commands

```bash
# Build NEXUS bundle only
pnpm --filter @workspace/api-server build:nexus

# Force rebuild + start
pnpm --filter @workspace/api-server rebuild:nexus

# Skip rebuild (backend iterations)
SKIP_NEXUS_BUILD=1 pnpm --filter @workspace/api-server dev
```

## Key Files

| File | Purpose |
|------|---------|
| `src/pages/` | NEXUS page components |
| `src/pages/Research.tsx` | Research swarm UI |
| `src/pages/Memory.tsx` | Memory fabric UI |
| `src/pages/Bridge.tsx` | Protocol bridge UI |
| `index.html` | Entry point |
| `vite.config.ts` | Vite config |
