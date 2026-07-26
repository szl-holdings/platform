# Architecture Overview — SZL Holdings

## System Architecture

```
┌─────────────────────────────────────────────────┐
│                  Client Layer                    │
│  8 Web Apps (React/Vite) + 8 Mobile (Expo/RN)  │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────┐
│              API Server (Express)                │
│         1,618 endpoints / 100+ route files       │
│      Auth Middleware │ Rate Limiting │ CORS      │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│           PostgreSQL Database                    │
│              442 tables                          │
│    Drizzle ORM │ Connection Pooling             │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│            Shared Libraries                      │
│  @szl-holdings/db │ ai-engine │ shared-ui       │
│  workflow-engine │ audit │ auth                  │
└─────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Mobile | Expo (React Native), TypeScript |
| Backend | Node.js (Express), TypeScript |
| Database | PostgreSQL (Drizzle ORM) |
| AI/ML | HuggingFace Inference, BGE Embeddings |
| CI/CD | GitHub Actions (45 workflows, measured in `artifacts/SOURCE_OF_TRUTH.json`) |
| Hosting | Replit managed infrastructure |
| Monorepo | pnpm workspaces |

## Domain Architecture

| Domain | Web App | Mobile App | API Routes | DB Tables |
|--------|---------|-----------|------------|-----------|
| SZL Holdings | szl-holdings | szl-holdings-mobile | holdings, admin | Core tables |
| Lyte | lyte-command-center | lyte-mobile | lyte-*, alloy-* | alloy_*, lyte_* |
| Aegis | firestorm | aegis-mobile | firestorm-* | firestorm_* |
| Terra | terra | terra-mobile | terra-* | terra_* |
| Vessels | vessels | vessels-mobile | vessels-* | vessels_* |
| Carlota Jo | carlota-jo | carlota-jo-mobile | carlota-*, booking | carlota_* |
| Founder | stephen-site | stephen-mobile | stephen | — |
| Distribution | (embedded in SZL) | — | distribution-os | dos_* |

## Security Architecture
- Auth middleware on all admin/write endpoints
- AI decisions in propose-only mode with human approval gates
- Immutable audit trail for all AI actions
- SCIM 2.0 for enterprise identity provisioning
- Feature flags for progressive rollout control

## Data Flow
1. Client sends authenticated request → API Server
2. API Server validates auth, permissions, input
3. Business logic executed with audit logging
4. Database operations via Drizzle ORM
5. Response returned with structured error contracts
6. AI operations: evidence retrieval → policy check → propose → HITL approval → execute → audit log

*Last updated: April 3, 2026*
