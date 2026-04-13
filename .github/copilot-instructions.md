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

11 web applications + 1 design sandbox (React 19 + Vite 7 + Tailwind CSS 4):

| App | Package |
|-----|---------|
| SZL Holdings | `@workspace/szl-holdings` |
| Stephen Lutar | `@workspace/stephen-site` |
| Vessels Maritime Intelligence | `@workspace/vessels` |
| Aegis (Firestorm) Defense Command | `@workspace/firestorm` |
| Lyte Command Center | `@workspace/lyte-command-center` |
| PRISM Counsel | `@workspace/prism-counsel` |
| Terra Real Estate Intelligence | `@workspace/terra` |
| Carlota Jo Advisory | `@workspace/carlota-jo` |
| Forge Client & Investor Portal | `@workspace/forge` |
| Nexus Cross-Domain Fusion Canvas | `@workspace/nexus` |
| INCA Lab AI Model Command | `@workspace/inca-lab` |
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

28 shared libraries powering all platforms:

| Library | Purpose |
|---------|---------|
| `@workspace/db` | Drizzle ORM schema and database client (600+ tables) |
| `@workspace/ai-engine` | Multi-provider AI gateway (Anthropic, OpenAI, Gemini, Groq) |
| `@workspace/shared-ui` | Design system — 80+ component exports |
| `@workspace/services` | Shared business logic and external adapters |
| `@workspace/workflow-engine` | Alloy execution fabric |
| `@workspace/proof-chain` | Immutable audit trail engine |
| `@workspace/covenant-policy` | Governance policy enforcement |
| `@workspace/api-spec` | OpenAPI 3.1 specification and code generation |
| `@workspace/api-client-react` | Generated React Query hooks from OpenAPI spec |
| `@workspace/api-zod` | Zod schemas for API request/response validation |
| `@workspace/auth` | OIDC/PKCE authentication utilities, 7-role RBAC |
| `@workspace/audit` | Audit event logging and attribution |
| `@workspace/analytics` | Event instrumentation and analytics |
| `@workspace/observability` | OpenTelemetry traces and metrics |
| `@workspace/prism-bus` | Cross-domain event bus |
| `@workspace/receipt-graph` | Entity relationship and ontology graph |
| `@workspace/mobile-ai` | AI integration for Expo mobile apps |
| `@workspace/forge-runtime` | Forge portal runtime utilities |
| `@workspace/mcp-client` | MCP protocol client |
| `@workspace/graphql-client` | GraphQL client for data federation |
| `@workspace/pulse-evals` | Evaluation harness for AI model quality |
| `@workspace/worldline` | Timeline and temporal signal processing |
| `@workspace/config` | Shared configuration constants |

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
