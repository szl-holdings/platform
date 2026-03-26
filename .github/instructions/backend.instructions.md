---
applyTo:
  - "artifacts/api-server/**/*.ts"
  - "lib/**/*.ts"
---

## Backend conventions (Express 5 + Drizzle ORM + PostgreSQL)

### API server (`artifacts/api-server`)

- Express 5 with async route handlers.
- Use `helmet` for security headers, `cors` for cross-origin, `express-rate-limit` for rate limiting.
- Structured logging with `pino` and `pino-http`.
- Validate all request bodies and query params with Zod schemas from `@workspace/api-zod`.
- Use `@workspace/services` for business logic — keep route handlers thin.

### Database (`lib/db`)

- Drizzle ORM with PostgreSQL.
- Define schemas using `pgTable` with explicit column types.
- Use Drizzle query builder — avoid raw SQL unless necessary.
- Migrations managed by Drizzle Kit.

### Shared libraries (`lib/`)

- All libraries are ESM-only (`"type": "module"`).
- Each library has its own `tsconfig.json` with `composite: true` for project references.
- Export from `index.ts` barrel files.
- Use `workspace:*` protocol when depending on other `@workspace/*` packages.
- Zod schemas in `@workspace/api-zod` must stay in sync with the OpenAPI spec in `@workspace/api-spec`.

### Logging & error handling

- Use structured logging with `pino` — include request IDs, timestamps, and context fields.
- Log at appropriate levels: `error` for failures, `warn` for recoverable issues, `info` for key events, `debug` for development.
- Return consistent error response shapes — include status code, error type, and human-readable message.
- Never expose internal error details (stack traces, SQL errors) to API consumers.

### Security & permissions

- Follow the principle of least privilege — database roles, API scopes, and file access should be minimal.
- Sanitize and validate all user input before processing — never pass raw input to queries or shell commands.
- Use parameterized queries (Drizzle handles this) — never interpolate user input into SQL strings.
- Keep secrets in environment variables — never commit credentials, tokens, or connection strings.
