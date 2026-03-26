This is the **SZL Holdings Platform** — a pnpm monorepo hosted on Replit.

## Architecture

- **Package manager**: pnpm 10 with corepack. Lock file is `pnpm-lock.yaml`.
- **Workspaces**: `artifacts/*`, `lib/*`, `lib/integrations/*`, `scripts`
- **All packages** are scoped under `@workspace/*` and use `"type": "module"` (ESM-only).
- **TypeScript** ~5.9 with project references (`tsconfig.json` at root references shared `lib/` packages).
- **Build**: `pnpm run build` (typechecks libs, then recursively builds all packages).
- **Typecheck**: `pnpm run typecheck` (builds libs via `tsc --build`, then checks each artifact).
- Dependencies shared via `catalog:` entries in `pnpm-workspace.yaml`.

## Frontend apps (`artifacts/`)

9 web applications (React 19 + Vite 7 + Tailwind CSS 4):

| App | Package |
|-----|---------|
| Admin Control Plane | `@workspace/admin-panel` |
| Project List | `@workspace/project-list` |
| Stephen Lutar | `@workspace/stephen-site` |
| Vessels Maritime Intelligence | `@workspace/vessels` |
| Firestorm Security Simulation | `@workspace/firestorm` |
| Lyte Command Center | `@workspace/lyte-command-center` |
| Readiness Report | `@workspace/readiness-report` |
| Dreamscape Creative Engine | `@workspace/dreamscape` |
| Component Preview Server | `@workspace/mockup-sandbox` |

All frontends use:
- Radix UI primitives with shadcn/ui component patterns
- `@tanstack/react-query` for data fetching
- `wouter` for routing
- `class-variance-authority`, `clsx`, `tailwind-merge` for styling utilities
- Each app has its own `vite.config.ts` and `tsconfig.json`

## Backend (`artifacts/api-server`)

- Express 5 with `@workspace/api-server`
- Drizzle ORM with PostgreSQL (`@workspace/db`)
- Zod validation schemas (`@workspace/api-zod`)
- Pino for structured logging

## Shared libraries (`lib/`)

| Library | Purpose |
|---------|---------|
| `@workspace/db` | Drizzle ORM schema and database client |
| `@workspace/api-client-react` | Generated React Query hooks from OpenAPI spec |
| `@workspace/api-zod` | Zod schemas for API request/response validation |
| `@workspace/api-spec` | OpenAPI specification and code generation |
| `@workspace/services` | Shared business logic services |
| `@workspace/shared-ui` | Reusable React UI components |
| `@workspace/config` | Shared configuration constants |
| `@workspace/shared-types` | Shared TypeScript type definitions |
| `@workspace/utils` | General utility functions |
| `@workspace/notifications` | Notification system utilities |
| `@workspace/auth` | Authentication utilities |

## Conventions

- Use `workspace:*` protocol for internal dependencies.
- Use `catalog:` for shared third-party dependency versions.
- Never commit `package-lock.json` or `yarn.lock`.
- Run `pnpm run typecheck` before committing to catch type errors across the monorepo.
- Each artifact reads its port from the `PORT` environment variable.
