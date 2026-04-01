# SZL Holdings — Trust Center

**Version:** 3.0  
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

**Role model:**

| Role | Access Scope |
|------|-------------|
| `founder_admin` | Full platform access, configuration, and user management |
| `admin` | Platform administration within organization scope |
| `operator` | Full operational read/write: alerts, incidents, workflows |
| `analyst` | Read access to all operational data and audit logs |
| `viewer` | Read-only access to dashboards and summaries |
| `client` | External client access (Carlota Jo context) |

Role assignments are logged. Changes to role configuration require approval from a platform administrator.

---

## Auditability and Audit Trail Design

Every significant action across the SZL platform generates an immutable audit event.

**Properties of every audit event:**
- **Attributed** — Who performed the action, under what role, at what time
- **Contextual** — The triggering context (user session, agent recommendation, scheduled trigger, webhook)
- **Tamper-resistant** — Append-only. Events cannot be edited or deleted by any user, including administrators
- **Searchable** — Queryable by actor, action type, affected entity, and time range

AI agent outputs are audit-logged alongside human actions. When an agent recommendation leads to a human-confirmed action, the full chain is preserved: `recommendation → review → approval → execution → outcome`.

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

**Dependency management:** Dependencies are explicitly versioned. The dependency graph is tracked for known vulnerabilities using automated scanning in the build pipeline.

---

## Incident Readiness

**Detection.** Platform observability is instrumented. Service health, latency, error rates, and dependency status are monitored continuously.

**Triage.** Incidents are classified by severity. Critical incidents (platform-wide outage or data exposure) trigger immediate principal notification.

**Containment.** Isolation procedures are documented for each platform. Compromised sessions, exposed credentials, or service degradation have defined containment playbooks.

**Communication.** Material incidents affecting customer-facing services are communicated proactively. Post-incident reviews are conducted within five business days of resolution.

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

**Third-party services:**
- All third-party integrations are reviewed before onboarding. API credentials are scoped to the minimum permissions required

---

## Honesty Notice

*SZL Holdings does not currently hold SOC 2 certification or any formal regulatory compliance status. This document describes our engineering and operational practices as they stand today. We will update this document as compliance certifications are obtained.*

---

*See also: [Security Posture](security-posture.md) · [Deployment Model](deployment-model.md) · [Privacy Boundaries](privacy-boundaries.md)*
