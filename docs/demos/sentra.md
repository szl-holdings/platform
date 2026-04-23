# Sentra — Cyber Resilience Command: Demo Script

**Duration:** 8–12 minutes  
**Persona:** Diana Reyes (CISO) or Priya Nair (SOC Analyst)  
**URL:** `/sentra/`  
**Pre-requisite:** Demo seed loaded (`pnpm seed:demo`); signed into platform

---

## Pre-Demo Checklist

- [ ] Confirm at least one **Critical** incident visible on the dashboard (e.g., "Credential Stuffing — OKTA Login Portal")
- [ ] Confirm mesh map shows ≥ 4 connected nodes with one in warning state
- [ ] Confirm alerts tab shows ≥ 3 open alerts
- [ ] Sentra sidebar fully visible (not collapsed)

---

## Step 1 — Dashboard Overview (2 min)

**URL:** `/sentra/`

Open with the Sentra landing page.

> "Sentra is the cyber resilience command center. The moment you open it, you see the full picture: active incidents, critical alerts, and the real-time state of the agent mesh."

Point to the summary tiles at the top (Active Incidents, Critical Alerts, Total Alerts, Last Updated).

> "These numbers come live from the database. No static widgets here — every refresh shows the current state."

---

## Step 2 — Incident Commander (3 min)

**URL:** `/sentra/incidents`

> "Here's the full incident log. We have an active credential stuffing attack on the OKTA login portal — severity: Critical, stage: Lateral Movement."

Click the **Credential Stuffing** incident to open it.

> "Every incident has a full timeline. You can see when it was detected, when the SOC analyst started triaging, and every action taken. Full attribution — every step is traceable."

Point to the **MITRE ATT&CK stage** badge.

> "The system automatically classifies each incident against the MITRE ATT&CK framework. That's not a manual tag — it comes from the detection logic."

Demonstrate **Status Update**: change status from `triaging` to `escalated`.

> "When the analyst escalates, the timeline gets a new entry, the status updates across the dashboard, and any connected approval workflows are triggered."

---

## Step 3 — Mesh Map (2 min)

**URL:** `/sentra/mesh-map`

> "This is the agent mesh — the live topology of every AI agent and sensor node in the security perimeter."

Point to the warning-state node.

> "Each node reports health telemetry in real time. That yellow node has elevated latency — it's been flagged and the system is already queuing a containment rule check."

Click the **Mesh Exposures** link.

> "Exposures show which mesh nodes are exposed to the affected blast radius of any open incident. You can see the blast radius of the credential stuffing incident extends to three internal API gateways."

---

## Step 4 — Approvals & Decision Center (2 min)

**URL:** `/sentra/approvals`

> "Any action that crosses a risk threshold requires explicit approval. Block the C2 IP range? That's an approval. Isolate the OKTA gateway? That needs sign-off."

Point to a pending approval.

> "This is the governance layer built into security. Every action is attributed, every approval is recorded, and every override creates a proof chain entry."

---

## Step 5 — Trust Provenance (1 min)

**URL:** `/sentra/trust-provenance`

> "Finally — every decision, every alert acknowledgment, every escalation has a cryptographic provenance record. When auditors ask 'who approved what and when,' this is your answer."

---

## Avoidance Guide

- Do NOT click **Control Drift** if seed data is missing drift scores
- Do NOT demo **Recovery Readiness** if no incidents are in `contained` or `resolved` state
- The **Resilience Scorecard** derives from incident data — if seed is incomplete, show the Dashboard and skip this page

---

## Questions to Anticipate

**"Is this real data?"**  
> "The incident and alert data is populated through the platform's seed system — the same data model and schema as live production. We can show this connected to a live SIEM feed the moment credentials are provisioned."

**"How does MFA work for approvals?"**  
> "MFA on approval surfaces is on the roadmap for Q2 — right now approvals are gated by role and session. We can show the approval policy configuration in the Guardian policy center."
