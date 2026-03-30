# SZL Holdings — Trust Center

**Version:** 1.0 · **Last updated:** March 2026

---

## Overview

SZL Holdings builds and operates technology platforms for organisations where operational clarity, security posture, and responsible AI use are non-negotiable. This document describes the platform architecture principles, access and control model, AI governance approach, deployment discipline, incident readiness, and privacy and security posture that underpin every product in the SZL ecosystem.

This is not a compliance checklist. It is a record of how we build and why we build that way.

---

## Platform Architecture

The SZL platform is organised into four functional layers:

**1 · Observe** — Real-time data acquisition and signal ingestion across operational domains.  
Products: Vessels (maritime telemetry), Rosie (threat and incident signals), Beacon (business and operational telemetry).

**2 · Understand** — Pattern recognition, model evaluation, and explainable intelligence synthesis.  
Products: INCA (AI research command), Nimbus (predictive modelling and anomaly detection).

**3 · Execute** — Workflow orchestration, action routing, and human-in-the-loop approval gates.  
Products: AlloyScape (execution fabric and agent coordination layer).

**4 · Advise** — Principal-led advisory translating platform intelligence into strategic decisions.  
Products: Carlota Jo Consulting (operational and brand transformation).

These layers are not separate silos. They share a common entity model, a unified event schema, and a consistent design system. Signals observed at the infrastructure level inform decisions at the executive level. The architecture is explicit about this — cross-layer traceability is a design goal, not an afterthought.

---

## Access Control and Role-Based Permissions

Every SZL application implements role-based access control (RBAC) as a first-class concern.

**Principles:**
- Access is granted by explicit role assignment, not by default.
- Roles are scoped to operational need: executives see strategic summaries; operators see tactical queues; compliance personnel see audit logs and control evidence; maintainers see system state without production access.
- Destructive or irreversible actions — data deletion, role escalation, configuration resets — require multi-step confirmation and are flagged in the audit trail.
- Session tokens are short-lived. Privileged sessions require explicit re-authentication.

**Role model (representative):**
- `exec` — Strategic dashboards, KPI views, executive briefings. No write access to operational systems.
- `ops` — Full operational read/write. Alert management, incident triage, workflow execution.
- `compliance` — Read access to all audit logs, control evidence, and risk registers. Cannot modify operational data.
- `maintenance` — System state visibility. Cannot access user data or security-sensitive workflows.

Role assignments are logged. Changes to role configuration require approval from a platform administrator.

---

## Auditability and Audit Trail Design

Every significant action across the SZL platform generates an immutable audit event. Audit trails are:

- **Attributed** — Every event records who performed the action, under what role, and at what time.
- **Contextual** — Events include the triggering context (user session, agent recommendation, scheduled trigger, or external webhook).
- **Tamper-resistant** — Audit logs are append-only. Events cannot be edited or deleted by platform users.
- **Searchable** — Audit records are queryable by actor, action type, affected entity, and time range.

AI agent outputs are audit-logged alongside human actions. When an agent recommendation leads to a human-confirmed action, the chain is preserved: recommendation → review → approval → execution.

---

## AI Governance Principles

SZL platforms use AI to surface intelligence, generate recommendations, and accelerate triage — not to replace human judgement on consequential decisions.

**Core principles:**

**Explainability first.** Every AI-generated recommendation includes reasoning. Where a confidence score exists, it is shown alongside the output. Agents do not issue summary verdicts without traceable evidence.

**Advisory, not autonomous.** AI agents in the SZL ecosystem — Helmsman (maritime), Sentinel (security), Beacon (operations) — are advisory agents. They analyse, recommend, and synthesise. They do not execute changes, modify configurations, or trigger production actions without explicit human confirmation.

**Human-in-the-loop for destructive operations.** Any action that is irreversible, affects live systems, or touches sensitive data requires a human approval step. This is enforced at the workflow level, not just the UI level.

**No black-box scoring.** Risk scores, anomaly flags, and priority rankings are accompanied by contributing factors. A vessel flagged as high-risk shows which signals contributed. A security finding rated Critical shows the CVE chain and MITRE mapping.

**Model accountability.** Model versions are logged. Predictions are associated with the model version that produced them. Drift is monitored. When model behaviour changes materially, the platform flags it.

---

## Deployment Discipline

SZL platforms are deployed with infrastructure-as-code practices and continuous delivery pipelines.

**Standards:**
- Infrastructure configuration is version-controlled and reviewed before application.
- Deployment pipelines include automated build validation and environment-specific configuration injection.
- Secrets and API credentials are managed via environment-variable injection. Credentials are never committed to source control.
- Production and development environments are isolated. Development data does not touch production systems.
- Rollback is supported at the deployment pipeline level. Every release can be reverted.
- Configuration changes to live systems are gated behind an approval step in the admin control plane.

**Platform dependencies** are explicitly versioned. The dependency graph is tracked and audited for known vulnerabilities using automated scanning integrated into the build pipeline.

---

## Incident Readiness

SZL Holdings maintains documented incident response procedures for each platform.

**Detection.** Platform observability is instrumented. Service health, latency, error rates, and dependency status are monitored continuously. Anomaly thresholds are defined and trigger automated alerts.

**Triage.** Incidents are classified by severity. Critical incidents (platform-wide outage or data exposure) trigger immediate principal notification. High-severity incidents follow documented escalation paths with target response times.

**Containment.** Isolation procedures are documented for each platform. Compromised sessions, exposed credentials, or service degradation have defined containment playbooks.

**Communication.** Material incidents affecting customer-facing services are communicated proactively. Post-incident reviews are conducted within five business days of resolution.

**Practice.** Firestorm, SZL's security simulation platform, is used for regular adversarial readiness exercises. Red-team scenarios, MITRE ATT&CK simulations, and tabletop exercises are part of the operating rhythm.

---

## Privacy and Security Posture

**Data handling:**
- Operational data collected by SZL platforms is used to deliver the service for which it was collected. It is not sold or shared with third parties for advertising purposes.
- Data is classified at ingestion. Access to sensitive classifications requires elevated role assignment.
- Data retention periods are defined per data class. Data beyond retention windows is purged on schedule.

**Security architecture:**
- All inter-service communication is encrypted in transit (TLS 1.3).
- Data at rest is encrypted using AES-256 equivalent standards.
- API endpoints are authenticated. Unauthenticated endpoints expose only public information.
- Dependency vulnerability scanning is automated. Critical vulnerabilities trigger immediate review.
- Penetration testing scenarios are executed using Firestorm's adversary emulation capabilities.

**Third-party services:**
- All third-party integrations are reviewed before onboarding. API credentials are scoped to the minimum permissions required.
- Third-party service status is monitored. Degradation in third-party services is communicated to affected platform users.

---

## Product Reliability Intent

SZL platforms are designed for operational contexts where unreliability is not a recoverable condition. This shapes every architectural decision.

**What this means in practice:**
- Platform components are designed to degrade gracefully. When external data sources are unavailable, the platform indicates the gap explicitly rather than silently serving stale data.
- Demo and simulation modes are explicitly labelled. Users know when they are viewing live data and when they are viewing simulated or cached data.
- Performance is a feature. Dashboard load times, query latency, and streaming data freshness are monitored and treated as reliability metrics.
- The platform is built by the people who operate it. There is no gap between the engineering team and the operating responsibility.

---

## Contact

Security disclosures and trust-related inquiries: contact via the SZL Holdings website.  
Enterprise access requests and compliance documentation: available on request.

---

*SZL Holdings does not claim SOC 2 certification or any formal regulatory compliance status at this time. This document describes our engineering and operational practices as they stand today.*
