# Counsel — Legal Matter Command: Demo Script

**Duration:** 6–8 minutes  
**Persona:** Sophia Marchetti (Chief Compliance Officer / Legal Ops Lead)  
**URL:** `/counsel/`  
**Pre-requisite:** Demo seed loaded; signed into platform

---

## Pre-Demo Checklist

- [ ] Confirm "Rivera v. Apex Capital" matter visible in the matter list with a clock violation badge
- [ ] Confirm at least 2 obligations on the timeline with one overdue
- [ ] Confirm dependency graph shows ≥ 3 connected matter nodes

---

## Step 1 — Dashboard Overview (1 min)

**URL:** `/counsel/`

> "Counsel is the legal matter command center. It surfaces every active matter, obligation, and compliance posture across the portfolio in a single view."

Point to the KPI tiles (open matters, overdue obligations, risk exposure index).

> "Every number here traces to a real matter in the database. When an obligation deadline passes, the system flags it automatically — no manual tracking."

---

## Step 2 — Matter Overview (2 min)

**URL:** `/counsel/matters`

> "Here's the full matter register. Rivera v. Apex Capital is the priority item — statute of limitations approaching, clock violation badge active."

Click **Rivera v. Apex Capital**.

> "Every matter has a full obligation set, a risk score, and a linked dependency graph. The clock violation is a hard-coded deadline rule: if the response window is missed, the matter escalates automatically to the approval queue."

Point to the **assignee** and **current status**.

> "Matters are assigned to counsel with RBAC-gated updates. Only the assigned attorney or an admin can change status — every change is logged."

---

## Step 3 — Obligation Timeline (2 min)

**URL:** `/counsel/obligations`

> "Every obligation across every active matter is plotted on a single timeline. Overdue items are highlighted in red — the system doesn't wait for a human to notice."

Point to the overdue obligation.

> "This obligation was due April 14. The system has already created an alert and queued an escalation approval. The legal team has visibility before the client does."

---

## Step 4 — Dependency Graph (1 min)

**URL:** `/counsel/dependency-graph`

> "Legal matters don't exist in isolation. This graph shows how matters, obligations, and related entities connect. When Rivera's motion deadline shifts, the system can surface which other matters have dependencies on that ruling."

---

## Step 5 — Knowledge Search (1 min)

**URL:** `/counsel/aef-search`

> "Finally — embedded legal knowledge search. Counsel can search the matter database, uploaded documents, and the platform's knowledge base in one query. All retrieval is attributed."

---

## Avoidance Guide

- Do NOT demo **Court Filing** — the court API integration is not yet live (no credential)
- Do NOT demo **Performance KPIs** as live metrics — these are seeded aggregations
- The **Risk Exposure Desk** shows seeded risk scores — frame as "model output from case data"

---

## Questions to Anticipate

**"Can this file directly with the court?"**  
> "The court filing integration is built and tested against the NY courts API specification. We're in the process of onboarding credentials — it's a Q2 activation."

**"How is document management handled?"**  
> "Documents are stored in the platform's document fabric — encrypted at rest, access-logged, role-scoped. The integration with e-filing is the final link in the chain."
