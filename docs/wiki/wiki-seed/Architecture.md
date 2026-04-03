# Architecture

The SZL Holdings platform is a pnpm monorepo with 16 deployable artifacts sharing a common execution fabric, database layer, authentication system, and AI orchestration engine.

---

## System Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  Web (React + Vite)     Mobile (Expo / React Native)    │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS / WebSocket
┌─────────────────────────▼───────────────────────────────┐
│                  API Gateway (Express 5)                 │
│  Auth Middleware · Rate Limiting · Request Logging       │
└──────┬──────────────────┬──────────────────┬────────────┘
       │                  │                  │
┌──────▼──────┐  ┌────────▼──────┐  ┌───────▼────────┐
│   Domain    │  │    Alloy      │  │   AI Engine    │
│   Services  │  │  Execution    │  │  (Orchestration│
│  (Lyte,     │  │  Fabric       │  │   + Evidence)  │
│  Aegis,     │  │               │  │                │
│  Vessels,   │  │  Workflow     │  │  HuggingFace   │
│  Terra,     │  │  Approval     │  │  Qwen3-8B      │
│  Carlota Jo)│  │  Audit Trail  │  │  RAG Retrieval │
└──────┬──────┘  └────────┬──────┘  └───────┬────────┘
       │                  │                  │
┌──────▼──────────────────▼──────────────────▼──────────┐
│                   Data Layer                            │
│  PostgreSQL 16 · Drizzle ORM · 120+ Tables             │
│  Domain-isolated schemas · Immutable audit tables       │
└────────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

```
szl-holdings-platform/
├── artifacts/                  # 16 deployable applications
│   ├── api-server/             # Centralized Express API server
│   ├── lyte-command-center/    # Lyte web app
│   ├── firestorm/              # Aegis web app
│   ├── vessels/                # Vessels web app
│   ├── terra/                  # Terra web app
│   ├── carlota-jo/             # Carlota Jo web app
│   ├── szl-holdings/           # SZL Holdings corporate site
│   ├── stephen-site/           # Founder personal site
│   └── *-mobile/               # 7 Expo/React Native mobile apps
├── lib/                        # Shared TypeScript libraries
│   ├── shared-ui/              # Design system + component library
│   ├── db/                     # Drizzle ORM schema + migrations
│   ├── auth/                   # OIDC/PKCE session management
│   ├── services/               # Domain service logic
│   ├── workflow-engine/        # Alloy workflow orchestration
│   ├── ai-engine/              # AI orchestration + agent coordination
│   ├── audit/                  # Immutable audit trail
│   ├── observability/          # Structured logging (pino) + metrics
│   ├── api-spec/               # OpenAPI spec
│   └── api-client-react/       # Generated React Query hooks
├── infra/                      # Azure Bicep IaC templates
├── docs/                       # Platform documentation
└── scripts/                    # Automation and tooling
```

---

## AI Architecture

The AI layer is governed by policy — agents cannot execute consequential actions without explicit human approval.

**Agent Coordination:**
- **Helmsman** — Maritime intelligence agent (Vessels domain)
- **Sentinel** — Security and threat analysis agent (Aegis domain)
- **Compass** — General operational intelligence (Lyte domain)

**Execution Model:**
1. Agent receives task context with scoped permissions
2. Agent produces a structured recommendation (9 schema-validated decision types)
3. Recommendation is routed to Alloy for approval classification
4. If auto-execute: policy check gates execution
5. If human review required: approval gate created, human confirms
6. Action executed with full attribution in audit trail

**Evidence Model:** All AI outputs include source citations, confidence scores, and retrieval provenance. No opaque recommendations.

---

## Authentication & Authorization

**Authentication:** OpenID Connect with PKCE. No password storage in SZL systems. Supports Azure AD multi-tenant SSO and SCIM 2.0 provisioning.

**Authorization:** 11-role RBAC with organization-scoped tenant isolation.

| Role | Access Level |
|------|-------------|
| `founder_admin` | Full system access |
| `admin` | Org-scoped administration |
| `operator` | Workflow execution |
| `analyst` | Read + analysis |
| `viewer` | Read-only |
| `client` | Client portal only |
| + 5 domain-specific roles | Domain-isolated access |

**WebSocket Security:** HMAC-signed tickets with 5-minute TTL. Per-channel ACL enforced server-side.

---

## Database Architecture

**Engine:** PostgreSQL 16 with Drizzle ORM.

**Scale:** 120+ tables across domain-isolated schemas. Shared user/auth tables. Per-domain operational tables. Immutable audit tables (append-only).

**Migration strategy:** Drizzle Kit migrations tracked in version control. No direct schema modifications in production.

---

## Infrastructure (Production Target)

**Cloud:** Microsoft Azure.

| Component | Azure Service |
|-----------|--------------|
| Application hosting | Azure App Service |
| Database | Azure Database for PostgreSQL Flexible Server |
| Secrets | Azure Key Vault |
| Session store | Azure Cache for Redis |
| CDN / static assets | Azure CDN |
| Container registry | Azure Container Registry |

**IaC:** Azure Bicep templates in `infra/` cover all production components.

---

## Further Reference

- [System Overview](../../docs/architecture/system-overview.md)
- [Data Flow](../../docs/architecture/data-flow.md)
- [Platform Map](../../docs/architecture/platform-map.md)
- [[Deployment-Model]]
- [[Security-Posture]]
