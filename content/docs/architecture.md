# Architecture — SZL Holdings

## System Layers

### Client Layer
- 8 React/Vite web applications with TypeScript
- 8 Expo (React Native) mobile applications
- Shared UI component library (@szl-holdings/shared-ui)
- Tailwind CSS for styling with premium dark theme

### API Layer
- Express.js server with TypeScript
- 1,618 RESTful endpoints across 100+ route files
- Auth middleware on all admin/write operations
- Structured error responses
- Health/readiness endpoints

### Data Layer
- PostgreSQL with Drizzle ORM
- 442 tables across all domains
- Connection pooling
- Structured schema with foreign key relationships

### AI Layer
- HuggingFace Inference for AI decisions
- BGE embeddings for hybrid search
- 9 validated tool schemas
- Propose-only mode with human approval
- Evidence retrieval with reranking

### Infrastructure Layer
- Replit managed hosting
- GitHub Actions CI/CD (43 workflows, measured in `artifacts/SOURCE_OF_TRUTH.json`)
- pnpm monorepo workspace
- Environment-based configuration

## Domain Boundaries

Each product domain owns its schema prefix:
- `alloy_*` — Alloy execution fabric
- `firestorm_*` — Aegis defense/SOC
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
