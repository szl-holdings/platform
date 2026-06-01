# Aegis — Operator Personas

## Overview

Aegis serves six primary operator types. Each persona has distinct goals, workflows, and authority levels. Platform behavior — including automation gating, data sensitivity controls, and escalation paths — is calibrated to these personas.

---

## 1. Security Analyst

**Role**: Tier 1 / Tier 2 SOC operator responsible for alert triage, initial investigation, and evidence collection.

**Primary Goals**
- Clear the alert queue without missing real threats
- Collect and tag evidence before it degrades
- Escalate credibly with structured context, not instinct

**Key Workflows**
- Alert triage → incident creation
- Signal correlation and entity enrichment
- Evidence collection and tagging
- Hypothesis drafting and analyst notes
- Escalation to senior analysts or IR leads

**Permissions Class**: `analyst`
- Read: all alerts, incidents, signals in their org
- Write: triage notes, evidence tags, hypothesis drafts
- Execute: propose_only automation actions
- Cannot: approve response actions, access exec-level views, export sensitive data

**Pain Points**
- Alert volume overwhelms structured thinking
- Evidence degrades before it can be documented
- Escalations lack structure — hard to hand off context

---

## 2. Incident Responder

**Role**: Tier 2 / Tier 3 specialist who leads active incident response and coordinates containment and remediation.

**Primary Goals**
- Contain the threat quickly with minimum collateral damage
- Drive the investigation to a structured decision
- Coordinate response across teams without losing the audit trail

**Key Workflows**
- Incident command: timeline management, entity tracking
- Decision Console: structured hypothesis → evidence → decision
- Response Orchestration: playbook execution, step tracking, rollback
- Cross-team coordination via approval queues

**Permissions Class**: `responder`
- Read: full incident and case data in their org
- Write: incident status, decision objects, playbook step execution
- Execute: approval_required automation (with named approver)
- Cannot: approve their own actions, access board-level exports

**Pain Points**
- Parallel response tracks lose synchronization
- Automation runs without visibility into what triggered it
- Post-incident reviews lack a reliable audit record

---

## 3. SOC Manager

**Role**: Manages the SOC team, queue health, SLA compliance, and escalation authority.

**Primary Goals**
- Maintain queue visibility across all active incidents and cases
- Enforce SLA discipline
- Approve escalations and high-risk response actions
- Identify analyst performance patterns and capacity gaps

**Key Workflows**
- Command Home: queue health, analyst assignments, approval queue
- SLA tracking and breach alerts
- Approval of high-risk automation and escalations
- Analyst workload management

**Permissions Class**: `soc_manager`
- Read: all incidents, cases, alerts, analyst decisions in their org
- Write: assignments, SLA overrides, approval decisions
- Execute: approved_execute for pre-cleared playbooks
- Approve: responder-initiated response actions

**Pain Points**
- No single view of queue health and analyst capacity
- Escalations surface too late — SLA breaches are discovered, not predicted
- Approvals are informal — no audit trail when things go wrong

---

## 4. Resilience Lead

**Role**: Owns the organization's cyber resilience program: frameworks, controls, risk register, and improvement trajectory.

**Primary Goals**
- Track control status against frameworks (NIST, CIS, FedRAMP)
- Identify risk trends, not just current incidents
- Drive remediation ownership and due-date discipline
- Report resilience trajectory to CISO and board

**Key Workflows**
- Compliance posture: framework scorecards, risk register
- Hardening controls: control status, remediation assignments
- Trend analysis: MTTR, escalation rates, control degradation
- Readiness reporting

**Permissions Class**: `resilience_lead`
- Read: compliance, risk, controls, incidents, trends
- Write: control status updates, risk register entries, remediation assignments
- Export: compliance reports (sensitivity-labeled)
- Cannot: access raw signal data, manage analyst workflows

**Pain Points**
- Control status lives in spreadsheets disconnected from incidents
- Trend visibility requires manual aggregation
- Board reporting is always out of date

---

## 5. CISO / Security Executive

**Role**: Accountable for security posture, board communication, regulatory compliance, and security investment.

**Primary Goals**
- Understand organizational risk posture at a glance
- Validate that the team is executing with discipline (SLA, escalation, decision quality)
- Communicate credibly to the board
- Identify systemic gaps, not just incidents

**Key Workflows**
- Executive / Board View: posture, top risks, metrics, trends
- Control status summary
- Escalation and SLA metric review
- Board export generation (watermarked, sensitivity-labeled)

**Permissions Class**: `executive`
- Read: posture summaries, top risks, metrics, trend data
- Export: board-ready summaries (with retention label and export restriction flags)
- Cannot: access raw signals, manage operational workflows, execute automation

**Pain Points**
- Operational data isn't translated into risk language
- Board reports require hours of manual curation
- There is no reliable single source of truth for posture

---

## 6. External Partner / MSSP Analyst

**Role**: External security professional operating under a managed services agreement — bounded to specific client tenants with restricted data access.

**Primary Goals**
- Perform scoped triage and investigation work within their authorized tenant
- Deliver structured outputs (reports, decisions) that the client can retain
- Operate without access to other clients' data

**Key Workflows**
- Scoped alert triage and case management
- Investigation work within authorized tenant boundary
- Structured report export to client

**Permissions Class**: `partner_analyst`
- Read: authorized tenant data only (hard tenant boundary enforced)
- Write: triage notes, evidence tags within authorized scope
- Execute: propose_only only — no direct automation
- Export: client-scoped, watermarked, restricted to authorized tenant
- Cannot: access cross-tenant data, view internal platform operations, escalate outside tenant

**Pain Points**
- Unclear boundary between what they can and cannot access
- Output format is inconsistent — clients get raw data not structured reports
- No visibility into which of their actions are logged and by whom
