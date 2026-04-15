# Monorepo Health Report

Generated: 2026-04-15

## Overview

| Metric | Value |
|--------|-------|
| Package Manager | pnpm 9.x with workspaces |
| Language | TypeScript 5.x (strict mode) |
| Active Artifacts | 15 |
| Shared Libraries | 34 |
| Database Tables | 561 |
| Node Modules | ~3.2GB (shared via pnpm content-addressable store) |

## Workspace Structure

```
artifacts/          # 15 deployable apps
  ├── szl-holdings/      # Flagship web (marketing, trust, docs)
  ├── firestorm/         # Aegis defense command
  ├── terra/             # Real estate intelligence
  ├── vessels/           # Maritime intelligence
  ├── carlota-jo/        # Advisory consulting
  ├── command/           # Unified operations
  ├── cortex-mobile/     # Mobile command center (Expo)
  ├── szl-holdings-mobile/ # Holdings companion (Expo)
  ├── api-server/        # Express API + GraphQL + WS
  ├── mockup-sandbox/    # Design prototyping
  ├── aegis/             # Archived (duplicate of firestorm)
  ├── imperium/          # Archived (merged into command)
  ├── lyte-command-center/ # Archived (merged into command)
  ├── prism-counsel/     # Archived (deprecated)
  └── stephen-site/      # Archived (deprecated)
lib/                # 34 shared packages
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
- 5 archived artifacts still registered and consuming workflow slots
- Some archived artifacts may have stale dependency versions
- Build time increases with workspace size

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
