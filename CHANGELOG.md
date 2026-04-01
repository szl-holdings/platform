# Changelog

All notable changes to the SZL Holdings platform ecosystem are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).  
See `/docs/releases/versioning-policy.md` for the full versioning policy.

---

## [Unreleased]

### In Progress
- Revenue activation (Stripe billing live for Vessels, Lyte, Terra, Carlota Jo)
- Enterprise SSO / SCIM 2.0 provisioning
- OpenAPI developer portal
- Redis session store for production deployments
- Sentry error tracking integration

---

## [0.1.0] — 2026-04-01

### Platform Release — Initial Public Mirror

This is the first formal public release of the SZL Holdings platform ecosystem.

### Added

**Platform Architecture**
- pnpm monorepo with 16 artifacts (7 web apps, 7 mobile apps, 1 API server, 1 design system)
- Shared TypeScript library stack: `@workspace/shared-ui`, `@workspace/db`, `@workspace/auth`, `@workspace/services`, `@workspace/workflow-engine`, `@workspace/ai-engine`, `@workspace/audit`, `@workspace/observability`
- Centralized Express API server serving all platform backends
- PostgreSQL with Drizzle ORM — shared schema with domain isolation
- WebSocket real-time layer with HMAC-signed tickets and per-channel ACL
- OpenID Connect (PKCE) authentication with organization-scoped RBAC

**Lyte — Business Observability**
- PRISM framework: Pulse, Risk, Intelligence, Signals, Motion
- Command Inbox with signal lifecycle management
- Action Queue with priority routing
- Approvals Center and Ownership Map
- Escalation Center with consequence modeling
- Readiness Module with organizational health scoring
- 40+ connector integration stubs
- Role-aware dashboards (exec, ops, compliance, maintenance)

**Alloy — Execution Fabric**
- Workflow engine with structured action routing
- Human-in-the-loop approval gates
- Immutable audit trail with full attribution
- Agent coordination network (Helmsman, Sentinel, Compass)
- Governed execution: advisory agents cannot execute without explicit approval

**Aegis — Unified Defense & Intelligence**
- Defense workspace: SOC command, MITRE ATT&CK v14 coverage, SOAR playbook engine
- Command workspace: MSP operations, client SLA management
- Intelligence workspace: AI research (INCA), model registry, experiment tracking
- STIX/TAXII protocol layer
- FedRAMP readiness track (Phase 4 roadmap)

**Terra — Real Estate Intelligence**
- NYC distress property data pipeline (multiple public data sources)
- Ownership structure tracking and entity graph
- Deal pipeline management via Alloy
- Interactive property map (Mapbox GL JS)
- Market signal intelligence and broker workflow

**Vessels — Maritime Intelligence**
- AIS telemetry integration and fleet command
- Voyage economics modeling
- Dark vessel detection
- Sanctions screening
- Route intelligence and weather analysis
- Exception Center with consequence modeling
- Helmsman AI agent for maritime intelligence

**Carlota Jo — Private Advisory**
- Web platform: service catalog, inquiry workflow, brand positioning
- Native mobile client: Expo/React Native for iOS and Android
- Discreet inquiry management and client engagement flow

**SZL Holdings — Corporate Platform**
- Ecosystem overview, investor relations, trust center
- Admin control plane with authenticated access
- KPI dashboard with role-gated access

**Stephen Lutar — Founder Site**
- Personal portfolio, work showcase, technical frameworks
- Career command and founder narrative

**Infrastructure**
- Azure Bicep IaC templates (App Service, PostgreSQL, Key Vault, Redis, CDN)
- Stripe billing infrastructure (Checkout, Subscriptions, Invoicing, Customer Portal)
- Multi-provider email (Resend → SendGrid → SMTP failover)
- Branded PDF generation (pdfkit, 8 templates)
- Salesforce AppExchange package stub
- Jira Marketplace (Atlassian Connect) app stub
- Marketplace mobile apps: all major platforms

**Documentation**
- Architecture documentation (system overview, data flow, entity model)
- Trust Center (AI governance, RBAC, audit trail, security posture)
- Investor documentation suite (thesis, readiness, go-to-market, team)
- Buyer documentation suite (executive overview, solution brief, use cases)
- Design system audit and token documentation
- Public mirror policy and governance
- Release discipline (strategy, versioning, checklist)

---

## Release Archive

Older releases are documented here as they are published.

| Version | Date | Summary |
|---------|------|---------|
| 0.1.0 | 2026-04-01 | Initial public platform release |

---

*For security disclosures, see [SECURITY.md](SECURITY.md).*  
*For the full release strategy, see [docs/releases/release-strategy.md](docs/releases/release-strategy.md).*
