# SZL Holdings — Trust Center

**Version:** 4.0  
**Date:** April 2026

---

## Overview

SZL Holdings builds and operates technology platforms for organisations where operational clarity, security posture, and responsible AI use are non-negotiable. This document describes the platform architecture principles, access and control model, AI governance approach, deployment discipline, incident readiness, and privacy and security posture that underpin every product in the SZL ecosystem.

This is not a compliance checklist. It is a record of how we build and why we build that way.

---

## Platform Architecture

The SZL platform is organised into four functional layers:

**Observe · Decide · Act** — Real-time data acquisition, signal structuring, and domain-specific intelligence across five verticals.  
Platforms: Lyte (business observability), Aegis (defense & intelligence), Terra (real estate intelligence), Vessels (maritime intelligence).

**Execute** — Workflow orchestration, action routing, and human-in-the-loop approval gates.  
System: Alloy (execution fabric and agent coordination layer).

**Advise** — Principal-led advisory translating platform intelligence into strategic decisions.  
Platform: Carlota Jo Consulting.

These layers share a common entity model, a unified event schema, and a consistent design system. Signals observed at the infrastructure level inform decisions at the executive level. Cross-layer traceability is a design goal, not an afterthought.

---

## Access Control and Role-Based Permissions

Every SZL application implements RBAC as a first-class concern.

**Principles:**
- Access is granted by explicit role assignment, not by default
- Roles are scoped to operational need: executives see strategic summaries; operators see tactical queues; compliance personnel see audit logs
- Destructive or irreversible actions require multi-step confirmation and are flagged in the audit trail
- Session tokens are short-lived. Privileged sessions require explicit re-authentication

**Role model — 11 granted user roles** (`auth.rbac_roles.count: 11` per `audit/source-of-truth.json`):

> **Counting methodology:** The `platformRole` column in `lib/db/src/schema/auth.ts` contains **12 enum values**: 11 granted user roles (assignable permissions for authenticated users) plus `anonymous_visitor` (the unauthenticated visitor state, not a grantable role). All platform counts, source-of-truth entries, and public-facing documentation use 11 to refer to the granted roles only. See `docs/security-posture.md` for the full role taxonomy with scope definitions.

| Role | Scope | Access |
|------|-------|--------|
| `founder_admin` | Platform-wide | Full administrative access, configuration, user management |
| `platform_admin` | Platform-wide | Platform administration and configuration |
| `operator` | Platform-wide | Full operational read/write: alerts, incidents, workflows |
| `analyst` | Platform-wide | Read access to all operational data and audit logs |
| `executive_viewer` | Platform-wide | Executive dashboard and strategic summary access |
| `ops_manager` | Domain | Operations management within assigned tenant |
| `sales_delivery_user` | Domain | Sales and delivery operations |
| `maritime_ops_user` | Domain (Vessels) | Vessels maritime domain access |
| `real_estate_ops_user` | Domain (Terra) | Terra real estate domain access |
| `service_coordinator` | Domain | Service coordination across assigned workflows |
| `pilot_customer_user` | Domain | Pilot and trial customer access |

Role assignments are logged. Changes to role configuration require approval from a platform administrator.

---

## Auditability and Audit Trail Design

Every significant action across the SZL platform generates an immutable audit event.

**Properties of every audit event:**
- **Attributed** — Who performed the action, under what role, at what time
- **Contextual** — The triggering context (user session, agent recommendation, scheduled trigger, webhook)
- **Tamper-resistant** — Append-only. Events cannot be edited or deleted by any user, including administrators
- **Searchable** — Queryable by actor, action type, affected entity, and time range

AI agent outputs are audit-logged alongside human actions. When an agent recommendation leads to a human-confirmed action, the full chain is preserved: `signal → context → recommendation → simulation → policy → execution → proof → outcome → learning`.

---

## AI Governance Principles

SZL platforms use AI to surface intelligence, generate recommendations, and accelerate triage — not to replace human judgement on consequential decisions.

### Explainability First

Every AI-generated recommendation includes reasoning. Where a confidence score exists, it is shown alongside the output. Agents do not issue summary verdicts without traceable evidence.

### Advisory, Not Autonomous

AI agents in the SZL ecosystem — Helmsman (maritime), Sentinel (security), Compass (readiness) — are advisory agents. They analyse, recommend, and synthesise. They do not execute changes, modify configurations, or trigger production actions without explicit human confirmation.

### Human-in-the-Loop for Consequential Operations

Any action that is irreversible, affects live systems, or touches sensitive data requires a human approval step. This is enforced at the **workflow level** (Alloy), not just the UI level. The gate cannot be bypassed in code.

### No Black-Box Scoring

Risk scores, anomaly flags, and priority rankings are accompanied by contributing factors. A vessel flagged as high-risk shows which signals contributed. A security finding rated Critical shows the CVE chain and MITRE mapping.

### Model Accountability

Model versions are logged. Predictions are associated with the model version that produced them. Drift is monitored. When model behaviour changes materially, the platform flags it.

---

## Deployment Discipline

**Standards:**
- Infrastructure configuration is version-controlled (Azure Bicep in `/infra/`) and reviewed before application
- Deployment pipelines include automated build validation and environment-specific configuration injection
- Secrets and API credentials are managed via environment-variable injection. Credentials are never committed to source control
- Production and development environments are isolated
- Rollback is supported at the deployment pipeline level. Every release can be reverted

**CI gates:** Every commit runs typecheck, lint, dependency audit, secret scan, and build validation. Any high or critical vulnerability blocks the build.

**Dependency management:** Dependencies are explicitly versioned. The dependency graph is tracked for known vulnerabilities using automated scanning in the build pipeline.

---

## Incident Readiness

**Detection.** Platform observability is instrumented with OpenTelemetry, Pino structured logging, self-monitoring, and provider health probes. Service health, latency, error rates, and dependency status are monitored continuously.

**Triage.** Incidents are classified by severity (SEV-1 through SEV-4). Critical incidents (platform-wide outage or data exposure) trigger immediate principal notification. Full runbook at `docs/internal/ops/incident-response-runbook.md`.

**Containment.** Isolation procedures are documented for each platform. Compromised sessions, exposed credentials, or service degradation have defined containment playbooks.

**Communication.** Material incidents affecting customer-facing services are communicated proactively. Post-incident reviews are conducted within five business days of resolution.

---

## Analytics & Observability

SZL Holdings instruments core product analytics to understand how the platform is used and to detect operational problems early.

**What is tracked:**
- Core user journey events: login, signup, dashboard views, signal interactions, approval decisions, billing events
- Full event taxonomy documented at `docs/internal/analytics/event-taxonomy.md`

**What is not tracked:**
- Personally identifiable information as event properties
- Vanity metrics (impressions, renders without user intent)
- Raw API call counts (handled in APM/telemetry, not analytics)

All analytics events are routed through the API server and stored in the platform database. No third-party analytics trackers are in use.

---

## Independent Penetration Test (NCC Group, May 2026)

SZL Holdings engaged **NCC Group** to conduct an independent external penetration test of the production platform ahead of the SOC 2 Type II observation period. The engagement was a two-week black-box and grey-box assessment of the API server, the SZL Holdings Dashboard, and the Aegis, Vessels, Terra, and Command portals, with a follow-up remediation re-test conducted by NCC Group.

**Test window:** April 28 – May 9, 2026 · **Re-test:** May 12, 2026 · **Letter of Attestation issued:** May 16, 2026

**Headline result — no Critical findings.** All three High-severity findings were remediated by SZL Holdings during the engagement and **independently re-tested and confirmed closed by NCC Group**. The remediated High-severity items were:

1. Unauthenticated access to two non-public metadata routes — closed by adding explicit auth enforcement and a build-time guard preventing future unguarded routers.
2. Internal agent token scope too broad — closed by enforcing a route-prefix allowlist, audit-logging every use, and placing the token on a 90-day rotation.
3. Cross-tenant data leak via ID enumeration on two routes — closed by adding org-scoped access checks and regression tests covering cross-organisation access.

Of five Medium-severity findings, four are remediated (three closed in a pre-SOC 2 batch on April 20, 2026 awaiting next scheduled re-test); the remaining Medium item is a multi-week input-validation expansion in active remediation. No Medium item represents an active exploitable vulnerability.

NCC Group's Letter of Attestation states that the platform's security posture is **appropriate for a pre-commercial SaaS platform of this stage and suitable for entry into the SOC 2 Type II audit observation period**.

The full technical findings report and the formal Letter of Attestation (reference NCC-SZL-2026-04-LOA-1.0) are available to enterprise evaluators and the SOC 2 audit firm under NDA. Request via security@szlholdings.com.

---

## Privacy and Security Posture

**Data handling:**
- Operational data is used to deliver the service for which it was collected. It is not sold or shared with third parties for advertising
- Data is classified at ingestion. Access to sensitive classifications requires elevated role assignment
- Data retention periods are defined per data class

**Security architecture:**
- All inter-service communication is encrypted in transit (TLS 1.3)
- Data at rest is encrypted using AES-256 equivalent standards
- API endpoints are authenticated. Unauthenticated endpoints expose only public information
- Dependency vulnerability scanning is automated. Critical vulnerabilities trigger immediate review
- Notification dispatch is rate-limited per severity tier to prevent alert fatigue

**Third-party services:**
- All third-party integrations are reviewed before onboarding. API credentials are scoped to the minimum permissions required

---

## Honesty Notice

*SZL Holdings does not currently hold SOC 2 certification or any formal regulatory compliance status. This document describes our engineering and operational practices as they stand today. A known-gap register is maintained at `docs/internal/security/backup-restore.md`. We will update this document as compliance certifications are obtained.*

---

*See also: [Security Posture](security-posture.md) · [Deployment Model](deployment-model.md) · [Privacy Boundaries](privacy-boundaries.md) · [Security Policy](../../SECURITY.md)*
