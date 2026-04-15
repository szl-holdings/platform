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

10 web applications (React 19 + Vite 7 + Tailwind CSS 4):

| App | Package |
|-----|---------|
| SZL Holdings Dashboard | `@workspace/szl-holdings` |
| Lyte Command Center | `@workspace/lyte-command-center` |
| Aegis (Firestorm) | `@workspace/firestorm` |
| Vessels Maritime Intelligence | `@workspace/vessels` |
| Terra Real Estate Intelligence | `@workspace/terra` |
| PRISM Counsel Legal Command | `@workspace/prism-counsel` |
| Carlota Jo Advisory | `@workspace/carlota-jo` |
| IMPERIUM Cloud Sovereignty | `@workspace/imperium` |
| Command Portal | `@workspace/command` |
| Stephen Lutar | `@workspace/stephen-site` |

1 mobile application (Expo SDK 53 / React Native):

| App | Package |
|-----|---------|
| CORTEX Mobile Command | `@workspace/szl-holdings-mobile` |

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
| `@workspace/db` | Drizzle ORM schema (644 tables) and database client |
| `@workspace/ai-engine` | AI orchestration — model routing, safety rails, telemetry |
| `@workspace/api-client-react` | Generated React Query hooks from OpenAPI spec |
| `@workspace/api-zod` | Zod schemas for API request/response validation |
| `@workspace/api-spec` | OpenAPI specification and code generation |
| `@workspace/services` | Shared business logic services |
| `@workspace/shared-ui` | Reusable React UI components and design tokens |
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

## General Guidelines

- Never hardcode secrets or credentials — use environment variables or a secrets manager.
- Use explicit error handling — avoid swallowing errors silently. Throw or log with context.
- Use strict TypeScript typing — avoid `any`. Prefer narrowing, generics, and discriminated unions.
- Keep functions focused — each function should do one thing well.
- Write self-documenting code — use descriptive variable and function names over comments.
- Prefer immutable data patterns — use `const`, `readonly`, and spread operators over mutation.
- Validate external inputs — never trust data from APIs, forms, or query parameters without validation.
- Follow the principle of least privilege — request only the permissions and access you need.
- Keep dependencies minimal — avoid adding packages for trivial functionality.
- Use consistent naming conventions — camelCase for variables/functions, PascalCase for types/components.
