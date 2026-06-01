# SZL Holdings — Security and Governance FAQ

**Date:** April 22, 2026
**Audience:** Enterprise security teams, compliance officers, procurement

---

## Authentication and Access

**Q: How do users authenticate?**
OpenID Connect (PKCE) via Replit Auth. No passwords stored. Session management with configurable secret and optional Redis backend.

**Q: What is the authorization model?**
11-role RBAC with deny-by-default global enforcement. Every request is authenticated before reaching any route handler. Roles include: `super_admin`, `ops`, `exec`, `analyst`, `compliance`, `viewer`, and domain-specific roles.

**Q: Is multi-tenancy supported?**
Yes. All data queries are scoped by `org_id`. Cross-org access returns 404 (not 403) to prevent information leakage. Tenant isolation is enforced at the query layer, not the application layer.

**Q: How is CSRF handled?**
Token-based CSRF protection on all state-changing endpoints.

---

## AI Governance

**Q: Can AI take actions without human approval?**
No. The Covenant Policy engine enforces mandatory approval gates based on risk tier. AI recommends; humans approve; systems execute. This is structural — it cannot be bypassed by configuration.

**Q: How are AI actions audited?**
Every AI action generates a trace record in the cognitive observability system. Traces include: model called, tokens used, latency, confidence score, source references, and approval status. The AI Ops Dashboard provides visibility into all AI activity.

**Q: Can AI recommendations be replayed?**
Yes. The Decision Replay system (backed by `packages/trace-graph`) stores the full decision history: actor, model/tool, input, approval state, result, and timestamp. Any decision can be replayed end-to-end.

**Q: How is AI confidence calibrated?**
The Outcome Graph tracks whether accepted recommendations led to the desired outcome. Acceptance rates and achievement rates are computed per agent and per domain. These metrics feed back to calibrate future confidence scores.

---

## Data Protection

**Q: Is data encrypted at rest?**
PostgreSQL is managed by Replit with encryption at rest. Application data is stored in a single database instance scoped by tenant.

**Q: Is data encrypted in transit?**
Yes. All external communication uses TLS. Internal service communication within the Replit environment uses mTLS proxy.

**Q: What is the data classification model?**
See `docs/DATA_CLASSIFICATION.md`. Data is classified as: Public, Internal, Confidential, and Restricted. Classification determines storage, access, and retention policies.

**Q: Is there a data retention policy?**
Audit events are retained indefinitely. Operational data follows domain-specific retention policies. See `docs/LOGGING_AND_RETENTION.md`.

---

## Audit and Compliance

**Q: What audit trail exists?**
Every write operation generates an immutable audit event with: actor, action, target, timestamp, and correlation ID. The Proof Chain library creates structured evidence records linking signals to decisions to outcomes.

**Q: Can audit events be tampered with?**
Audit events are append-only in the database. The Proof Chain uses hash-linked entries for tamper evidence. Administrative access to the audit trail requires `super_admin` role.

**Q: Is there incident response documentation?**
Yes. See `INCIDENT_RESPONSE.md` at the repository root and `docs/operations/` for operational runbooks.

---

## Deployment and Infrastructure

**Q: Where is the platform deployed?**
Replit Deployments — auto-scaling, managed TLS, health checks, and continuous deployment from the main branch.

**Q: What is the CI/CD pipeline?**
22 GitHub Actions workflows covering: lint, typecheck, build, test, security scan, secret detection, dependency review, CodeQL analysis, accessibility, performance, and release artifact generation. All action references use pinned SHAs.

**Q: Is there a disaster recovery plan?**
Database backups are automated via the `backup.yml` GitHub Action. Backup health is monitored in the `/api/health` response. See `docs/operations/` for backup and restore procedures.

---

## Supply Chain Security

**Q: How are dependencies managed?**
pnpm with committed lock file (`pnpm-lock.yaml`). Dependency review runs on every pull request. Scheduled secret scanning detects leaked credentials. CodeQL provides semantic vulnerability analysis.

**Q: Are there SBOM capabilities?**
Not yet in the CI pipeline — identified as a gap. CycloneDX integration is recommended for the release workflow.

**Q: How are third-party actions secured?**
All GitHub Actions are referenced by commit SHA, not by tag. This prevents supply-chain attacks via tag mutation.
