# SZL Holdings — API Inventory

## Overview
- **Total endpoints**: 1166
- **Route files**: 60+
- **Auth coverage**: Majority use authMiddleware, some public endpoints

## Route Domains

| Domain | Route File(s) | Key Endpoints | Auth |
|--------|-------------|---------------|------|
| Health | health.ts | GET /health | Public |
| Auth | auth.ts, oidc-auth.ts | POST /auth/login, GET /auth/session | Mixed |
| SCIM | scim.ts | SCIM provisioning endpoints | Auth required |
| AI Engine | ai-engine.ts | 14 endpoints: /ai/health, /ai/respond, /ai/triage, /ai/extract, /ai/plan, /ai/retrieve, /ai/tools/*, /ai/audit, /ai/evals/* | Mixed |
| Alloy | alloy.ts | Workflow CRUD, approval, execution | Auth required |
| Alloy Chat | alloy-chat.ts | Chat sessions | Auth required |
| Lyte Platform | lyte-platform.ts, lyte.ts, lyte-extended.ts | Signals, actions, readiness, views, comments | Mixed |
| Lyte Live | lyte-live.ts | Live data feeds | Auth optional |
| Terra | terra.ts, terra-live.ts, terra-broker.ts, terra-crm.ts, terra-distress.ts | Properties, deals, market data, live feeds | Mixed |
| Vessels | vessels.ts, vessels-platform.ts, vessels-extended.ts, vessels-live.ts | Fleet, voyages, exceptions, ports, corridors | Mixed |
| Firestorm | firestorm.ts, firestorm-live.ts | SOC, incidents, threats | Mixed |
| Carlota Jo | carlota-jo.ts, carlota-live.ts | Consulting, brand | Auth optional |
| Capital | capital-readiness.ts | Artifacts, lender/investor packets, milestones, models, diligence | Auth required |
| Notifications | notifications.ts | CRUD for notifications | Auth required |
| Domain Agents | domain-agents/ | AI agent chat per domain | Mixed |
| Agent OS | agent-os.ts | Agent scheduling, runs, knowledge | Mixed |
| Doctrine | doctrine.ts | Event ingestion | Rate limited |
| Projects | projects.ts | Project CRUD | Role required |
| Files | files.ts | File management | Auth required |
| Documents | documents.ts | Document engine | Auth required |
| Billing | billing.ts | Stripe integration | Auth required |
| CMS | cms.ts | Content management | Auth required |
| Admin | admin.ts | Admin operations | Auth required |
| Connectors | connectors.ts | External integrations | Auth required |
| Webhooks | webhooks.ts | Webhook management | Auth required |
| Push | push-tokens.ts, push-notifications.ts | Mobile push notifications | Auth required |
| Observability | observability.ts, lyte-observability.ts, apm.ts | Metrics, APM | Auth required |
| Holdings | holdings.ts | Parent company data | Auth required |
| Intelligence | intelligence.ts | Intelligence cache | Auth required |
| Stephen | stephen.ts | Founder surface data | Mixed |
| Booking | booking.ts | Appointment booking | Public |
| Config | config.ts | App configuration | Auth required |
| Feature Flags | feature-flags.ts | Feature flag management | Auth required |
| Feedback | feedback.ts | User feedback | Auth required |
| Services | services.ts | Service registry | Mixed |
| Readiness | readiness.ts, readiness-live.ts | Readiness assessments | Mixed |
| Certification | certification-readiness.ts | Certification tracking | Auth required |
| Exports | exports.ts | Data export jobs | Auth required |
| Contact | contact.ts | Contact forms | Public |
| Demo | demo-requests.ts | Demo request handling | Public |
| Backup | backup.ts | Database backup | Auth required |

## Security Notes
- `/api/ai/audit` now requires auth (fixed)
- All write operations require auth
- Rate limiting on doctrine events, terra live, AI endpoints
- RBAC enforced on admin, projects, agent-os run
