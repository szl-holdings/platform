# Monorepo Health Report

Generated: 2026-04-15

## Overview

Updated: 2026-04-27

| Metric | Value |
|--------|-------|
| Package Manager | pnpm 9.x with workspaces |
| Language | TypeScript 5.x (strict mode) |
| Active Artifacts | 14 (see below) |
| Shared Libraries | 37 |
| Database Tables | 561 |
| Node Modules | ~3.2GB (shared via pnpm content-addressable store) |

## Workspace Structure

```
artifacts/          # Active deployable apps
  ├── szl-holdings/       # Flagship web (marketing, trust, docs)
  ├── api-server/         # Express API + GraphQL + WS
  ├── terra/              # Real estate intelligence
  ├── vessels/            # Maritime intelligence
  ├── carlota-jo/         # Advisory consulting
  ├── command/            # Unified operations (merged Command + Lyte + Imperium)
  ├── conduit/            # Reverse ETL data pipeline
  ├── a11oy/              # Brand orchestration layer
  ├── sentra/             # Cyber resilience command
  ├── counsel/            # Legal matter command
  ├── pulse/              # AI executive briefing
  ├── cortex-mobile/      # Mobile command center (Expo)
  ├── szl-holdings-mobile/ # Holdings companion (Expo)
  └── mockup-sandbox/     # Internal design prototyping (not public)
  # Archived dirs (code retained for reference, not registered):
  # firestorm/, aegis/, imperium/, lyte-command-center/, prism-counsel/, stephen-site/
  # See ops/frontier/disposition-matrix.md for disposition details
lib/                # 37 shared packages
ops/                # Operational documentation
docs/               # Project-level documentation
tests/              # Integration and e2e tests
```

## Dependency Graph Health

### Clean Dependencies
- All shared libs use `workspace:*` protocol
- TypeScript project references configured
- No circular dependencies detected in lib/

### Concerns
- Build time increases with workspace size (currently within acceptable range)
- Some archived artifact directories remain on disk; workflows and registrations removed

## TypeScript Configuration

- `tsconfig.base.json` at root with path aliases
- Each package has own `tsconfig.json` extending base
- Strict mode enabled globally
- Project references for cross-package type checking

## Build Performance

| Build | Approximate Time |
|-------|-----------------|
| Full typecheck | ~45-60s |
| Single artifact build | ~10-15s |
| Full workspace build | ~2-3min |
| pnpm install (warm) | ~5-10s |
| pnpm install (cold) | ~30-60s |

## Recommendations

1. **Deregister 5 archived artifacts** — frees workflow slots and reduces noise
2. **Add `pnpm -r build` to CI** — catches cross-package type errors
3. **Consider turbo or nx** — for incremental builds (future, when build time exceeds 5min)
4. **Pin critical dependencies** — TypeScript, React, Vite versions across workspace
