# Aegis — Primary Use Cases

## Overview

These are the seven primary use cases Aegis is built to serve. Each use case maps to one or more command surfaces and inherits the platform's zero-trust controls, structured decision model, and automation gating.

---

## 1. Alert Triage

**Persona**: Security Analyst, Incident Responder  
**Surface**: Command Home → Alerts Panel → Investigation Board

**Problem**: Security teams receive thousands of alerts per day. Most are noise. The few that matter require immediate, structured response. Without a disciplined triage workflow, real threats are buried in volume.

**How Aegis Handles It**
- Prioritized alert queue surfaces highest-severity, unacknowledged alerts first
- Each alert carries source trust score, related signals, and suggested triage action
- Analyst acknowledges, enriches, and either closes or escalates to an investigation
- All triage actions are logged with operator identity and timestamp
- Automation gating: triage suggestions are propose_only — analyst initiates every escalation

**Done looks like**: Alert is acknowledged, classified (real/false positive), and either closed with a note or promoted to a case with evidence attached.

---

## 2. Investigation Support

**Persona**: Security Analyst, Incident Responder  
**Surface**: Investigations Board

**Problem**: Investigations are messy. Evidence comes from multiple sources, hypotheses evolve, entities multiply, and the thread of reasoning is lost between shift changes.

**How Aegis Handles It**
- Case timeline shows all events, actions, and decisions in chronological order
- Entity graph surfaces related assets, identities, and signals without manual correlation
- Signal feed shows real-time incoming signals related to the case
- Evidence panel allows structured tagging of IOCs, screenshots, logs, and artifact references
- Analyst notes and hypothesis tracking keep the reasoning thread explicit
- Recommended actions surface suggested next steps (propose_only)

**Done looks like**: Investigation case has a complete timeline, all known entities mapped, evidence tagged, hypothesis documented, and a decision drafted for responder review.

---

## 3. Risk and Incident Coordination

**Persona**: SOC Manager, Incident Responder  
**Surface**: Command Home (Approval Queue, Assignment View), Investigations Board

**Problem**: When multiple incidents are active simultaneously, coordination breaks down. Analysts work in parallel without visibility into each other's progress. Escalations are informal. Approval authority is ambiguous.

**How Aegis Handles It**
- Command Home shows all active incidents with severity, status, and assignee at a glance
- Approval queue surfaces all pending actions awaiting manager decision
- SOC Manager can reassign, escalate, or override SLAs from the command surface
- Org-scoped escalation paths enforce that escalations route to the right authority
- All coordination actions carry identity-aware audit records

**Done looks like**: Active incident portfolio is visible, all pending approvals are addressed, critical incidents have assigned leads, and SLA health is within acceptable thresholds.

---

## 4. Approval-Aware Response

**Persona**: Incident Responder, SOC Manager  
**Surface**: Response Orchestration Board, Decision Console

**Problem**: Automated response is powerful and dangerous. Teams either over-automate (creating blast radius) or under-automate (too slow). Without explicit approval gates, operators lose visibility into what the system is doing in their name.

**How Aegis Handles It**
- Every response playbook step carries an automation gate:
  - **propose_only**: system suggests, operator initiates
  - **approval_required**: queues for named approver before execution
  - **approved_execute**: pre-cleared step executes with full audit log
  - **blocked_by_policy**: prohibited in current environment/tenant
- Playbook execution board shows all pending/executing/completed/blocked steps
- Rollback and containment actions are always approval_required minimum
- Decision Console structures the decision before any response executes

**Done looks like**: Response playbook is executing with all steps in visible status. No action executes without its required gate being satisfied. Audit chain is complete.

---

## 5. Evidence Aggregation

**Persona**: Security Analyst, Incident Responder  
**Surface**: Investigations Board (Evidence Panel)

**Problem**: Evidence degrades. Logs rotate, cloud trails expire, memory images decay. Without structured evidence collection tied to the case timeline, post-incident review is reconstruction from memory.

**How Aegis Handles It**
- Evidence panel allows structured capture: IOC, screenshot, log artifact, configuration snapshot, external reference
- Every evidence item carries: source trust level, collected-by identity, collection timestamp, sensitivity label, and retention class
- Evidence is linked to the case timeline at the point of collection
- Export restrictions enforce that sensitive evidence cannot be extracted outside tenant boundary without explicit authorization

**Done looks like**: All evidence relevant to the investigation is captured in the case with provenance intact. Post-incident review has a complete record.

---

## 6. Executive Reporting

**Persona**: CISO, Resilience Lead  
**Surface**: Executive / Board View

**Problem**: Security posture data is trapped in operational tooling. Translating it into board-ready risk language requires hours of manual work and is always out of date by the time it is presented.

**How Aegis Handles It**
- Executive View surfaces: posture score, top risks by impact, active incidents summary, SLA/MTTR metrics, control status, and 30/90 day trend lines
- All metrics are live, not static reports
- Board export generates a sensitivity-labeled, watermarked PDF summary
- Export restrictions enforce that board summaries carry retention labels and cannot be forwarded outside authorized recipients

**Done looks like**: CISO opens the Executive View and has a current, accurate posture picture ready for the board in under 60 seconds.

---

## 7. Resilience Workflow Management

**Persona**: Resilience Lead, CISO  
**Surface**: Executive / Board View, Compliance surfaces

**Problem**: Cyber resilience is not a state — it is a trajectory. Organizations that pass their audit today may be degrading. Without trend visibility tied to real incident data, resilience is theater.

**How Aegis Handles It**
- Framework scorecards show current control status against NIST CSF, CIS, StateRAMP
- Risk register captures residual risk with remediation owners and due dates
- Trend lines show MTTR, escalation rate, control degradation, and SLA compliance over 30/90 days
- Hardening controls track implementation status with audit trail
- Milestones track remediation program progress with accountability

**Done looks like**: Resilience Lead has a live view of the organization's control status, risk trajectory, and remediation accountability — and can produce a board-quality summary on demand.
