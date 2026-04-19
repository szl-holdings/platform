# Backend API Inventory
**Phase:** 3  
**Date:** April 19, 2026  
**Auditor:** Series A Launch Readiness Program (Task #2068)

---

## API Architecture

| Attribute | Value |
|---|---|
| Framework | Express 5 |
| API types | REST (primary), GraphQL (Apollo), WebSocket (SSE) |
| Validation | Zod schemas on all high-risk write routes; expanding to full coverage |
| Auth middleware | OIDC/PKCE session-based; `requireAuth` middleware on all protected routes |
| Rate limiting | express-rate-limit applied to public and auth routes |
| Error handling | Centralized error handler; structured JSON error responses; Pino logging |
| Correlation IDs | `correlationId` injected per request; propagated to all downstream artifacts |
| Route files | 254 files in `artifacts/api-server/src/routes/` |

---

## Route Group Inventory

### Health & Readiness

| Route | Method | Auth | Zod | Rate Limit | Status |
|---|---|---|---|---|---|
| `/api/health` | GET | None | N/A | None | Live |
| `/api/health/detailed` | GET | Token | N/A | None | Live |
| `/api/health/ready` | GET | None | N/A | None | Live |
| `/api/version` | GET | None | N/A | None | Live |

### Authentication

| Route | Method | Auth | Zod | Notes |
|---|---|---|---|---|
| `/api/auth/login` | GET | Public | No | OIDC redirect |
| `/api/auth/callback` | GET | Public | No | OIDC callback handler |
| `/api/auth/logout` | POST | Session | Yes | Session destruction |
| `/api/auth/me` | GET | Session | No | Current user |
| `/api/auth/refresh` | POST | Session | Yes | Token refresh |

### Users & RBAC

| Route | Method | Auth | Zod | Rate Limit | Notes |
|---|---|---|---|---|---|
| `/api/users` | GET | Admin | No | Default | List users |
| `/api/users/:id` | GET,PUT,DELETE | Admin | Yes (write) | Default | User CRUD |
| `/api/roles` | GET,POST | Admin | Yes (write) | Default | Role management |
| `/api/permissions` | GET | Admin | No | Default | Permission registry |
| `/api/rbac/check` | POST | Session | Yes | Default | Permission check |

### Alloy / Workflow

| Route | Method | Auth | Zod | Notes |
|---|---|---|---|---|
| `/api/workflows` | GET,POST | Session | Yes (write) | Full CRUD |
| `/api/workflows/:id` | GET,PUT,DELETE | Session | Yes (write) | |
| `/api/workflows/:id/run` | POST | Session | Yes | Trigger execution |
| `/api/workflow-runs` | GET | Session | No | Execution history |
| `/api/approvals` | GET,POST | Session | Yes (write) | Approval management |
| `/api/approvals/:id/approve` | POST | Session | Yes | Approve action |
| `/api/approvals/:id/reject` | POST | Session | Yes | Reject action |
| `/api/alloy/*` | Various | Session | Partial | Alloy execution fabric |

### AI / Agents

| Route | Method | Auth | Zod | Notes |
|---|---|---|---|---|
| `/api/agents` | GET | Session | No | Agent registry |
| `/api/agents/:id/run` | POST | Session | Yes | Trigger agent |
| `/api/agent-runs` | GET | Session | No | Run history |
| `/api/ai/complete` | POST | Session | Yes | LLM completion |
| `/api/ai/embed` | POST | Session | Yes | Embedding generation |
| `/api/alloy-chat` | POST | Session | Yes | Chat interface |

### Policy

| Route | Method | Auth | Zod | Notes |
|---|---|---|---|---|
| `/api/policies` | GET,POST | Session | Yes (write) | Policy CRUD |
| `/api/policies/:id` | GET,PUT,DELETE | Admin | Yes (write) | |
| `/api/policies/:id/simulate` | POST | Session | Yes | Dry-run |
| `/api/covenant-policy/check` | POST | Session | Yes | Policy enforcement |

### Decisions / Lyte

| Route | Method | Auth | Zod | Notes |
|---|---|---|---|---|
| `/api/decisions` | GET,POST | Session | Yes (write) | Decision management |
| `/api/signals` | GET | Session | No | Signal feed |
| `/api/recommendations` | GET | Session | No | Ranked recommendations |
| `/api/simulations` | POST | Session | Yes | Monte Carlo simulation |
| `/api/proof-chain` | GET | Session | No | Audit trail |

### Domain Packs (Vessels, Terra, Aegis, Carlota Jo, Counsel)

| Route Group | Auth | Zod (write) | Notes |
|---|---|---|---|
| `/api/vessels/*` | Session | Yes | Maritime intelligence |
| `/api/terra/*` | Session | Yes | Real estate intelligence |
| `/api/aegis/*` | Session | Yes | Cyber resilience |
| `/api/carlota-jo/*` | Session | Yes | Advisory management |
| `/api/counsel/*` | Session | Yes | Legal matter management |
| `/api/briefings/*` | Session | Partial | Pulse briefings |

### Analytics & Billing

| Route Group | Auth | Notes |
|---|---|---|
| `/api/analytics/*` | Session (read) / Admin (write) | Event ingestion and reporting |
| `/api/billing/*` | Session | Stripe integration |
| `/api/admin/*` | Admin role only | Admin operations |

### GraphQL

| Route | Auth | Notes |
|---|---|---|
| `/api/graphql` | Session | Apollo Server; full schema introspection |

---

## API Health Summary

| Dimension | Status | Notes |
|---|---|---|
| Route coverage | ✅ | 254 route files; all major domains covered |
| Auth on protected routes | ✅ | `requireAuth` middleware applied |
| Zod validation (high-risk) | ✅ | All high-risk write routes (auth, payment, admin) covered |
| Zod validation (all routes) | 🟡 | ~21% full Zod coverage; expanding |
| Rate limiting | ✅ | Applied to auth and public routes |
| Error contracts | ✅ | Centralized handler; consistent JSON error shape |
| Correlation IDs | ✅ | Pino logger propagates `correlationId` |
| Pagination on list routes | ✅ | Cursor-based pagination on key list endpoints |
| Timeouts on external calls | ✅ | Configured on AI provider calls and external feeds |
| Graceful degradation | 🟡 | AI: yes; AIS: yes (falls to demo); SIEM: pending |
