# Architecture — SZL Holdings

## System Layers

### Client Layer
- 11 React/Vite web applications with TypeScript
- 1 Expo (React Native) mobile application (iOS + Android)
- Shared UI component library (@szl-holdings/shared-ui)
- Tailwind CSS for styling with premium dark theme

### API Layer
- Express.js server with TypeScript
- 2,816 RESTful endpoints across 357 route files
- Auth middleware on all admin/write operations
- Structured error responses
- Health/readiness endpoints

### Data Layer
- PostgreSQL with Drizzle ORM
- 798 database tables across all domains
- Connection pooling
- Structured schema with foreign key relationships

### AI Layer
- Multi-provider AI routing (OpenAI, Anthropic, Gemini)
- BGE embeddings for hybrid search
- 9 validated tool schemas
- Propose-only mode with human approval
- Evidence retrieval with reranking

### Infrastructure Layer
- Replit managed hosting
- GitHub Actions CI/CD (23 workflows)
- pnpm monorepo workspace
- Environment-based configuration

## Domain Boundaries

Each product domain owns its schema prefix:
- `alloy_*` — Alloy execution fabric
- `firestorm_*` / `aegis_*` — Aegis defense/SOC
- `tenax_*` / `sentra_*` — Sentra cyber resilience
- `terra_*` — Real estate intelligence
- `vessels_*` — Maritime command
- `carlota_*` — Advisory services
- `dos_*` — Distribution OS
- Core tables — Shared platform (users, roles, audit, etc.)

## Key Design Decisions
1. **Monorepo**: Single repository for all products — shared types, shared UI, shared build
2. **Shared DB**: Single PostgreSQL instance with domain-prefixed tables
3. **Auth centralized**: Single auth middleware shared across all routes
4. **AI governance**: All AI decisions audit-logged by default
5. **Feature flags**: Database-backed flags for progressive rollout
