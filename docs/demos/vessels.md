# Vessels — Maritime Intelligence: Demo Script

**Duration:** 8–10 minutes  
**Persona:** Captain James Wren (Fleet Operator) or Robert Tanner (CCO / Compliance)  
**URL:** `/vessels/`  
**Pre-requisite:** Demo seed loaded; signed into platform

---

## Pre-Demo Checklist

- [ ] Fleet dashboard shows ≥ 5 vessels with simulated positions
- [ ] MV Soltana visible with an active alert (e.g., "Route Deviation — Bay of Bengal")
- [ ] Cargo tracking shows ≥ 3 active consignments
- [ ] Sanctions screening shows ≥ 2 reviewed entities
- [ ] At least one exception in the exceptions center

> **Note:** Vessel positions are simulated (seeded AIS data). When presenting to maritime prospects, disclose this proactively: "The positions you're seeing are demo data — the live AIS integration activates when we provision an AIS provider subscription."

---

## Step 1 — Fleet Dashboard (2 min)

**URL:** `/vessels/`

> "Vessels is the maritime intelligence layer. Every vessel in the fleet is tracked here — position, status, last port, next destination, active alerts."

Point to the fleet map (simulated positions).

> "The fleet map shows real-time positions from our AIS integration. In this demo, positions are pre-seeded for stability."

Point to **MV Soltana** with its alert badge.

> "MV Soltana has a route deviation alert — the vessel deviated 40nm east of the approved corridor. The system flagged it automatically and queued an exception."

---

## Step 2 — AIS Tracking (1 min)

**URL:** `/vessels/ais-tracking`

> "The AIS tracking view shows the historical track of each vessel — every position report, speed, and heading. When the live AIS feed is active, this updates every 15 minutes."

---

## Step 3 — Exceptions Center (2 min)

**URL:** `/vessels/exceptions-center`

> "Every deviation, every policy breach, every flag-state anomaly lands in the exceptions center. Nothing falls through the cracks."

Click the MV Soltana exception.

> "The exception shows the exact coordinates of the deviation, the applicable policy rule that was violated, the severity classification, and the recommended response."

Click **Create Workflow** to show the response workflow trigger.

> "The operator clicks once to create a response workflow. The workflow is a DAG — it assigns tasks to the right people in the right order. No manual coordination."

---

## Step 4 — Cargo Tracking (1 min)

**URL:** `/vessels/cargo-tracking`

> "Cargo tracking shows every active consignment — origin, destination, current status, and the chain of custody. The blockchain bill of lading links physical cargo to a tamper-proof record."

---

## Step 5 — Sanctions Screening (2 min)

**URL:** `/vessels/sanctions-screening`

> "Before any cargo is loaded or any counterparty is engaged, the sanctions engine screens against OFAC, UN, and EU lists in real time."

Run a screening (type a sample entity name).

> "The screening returns a match score, the specific list entry, the risk rationale, and a recommended action. Compliance officers have a documented audit trail for every decision."

---

## Step 6 — Intelligence Briefs (1 min)

**URL:** `/vessels/intelligence-briefs`

> "Finally, the AI generates maritime intelligence briefs — geopolitical risk assessments, corridor pressure scores, weather impact models. Every brief is attributed to its source signals."

---

## Avoidance Guide

- Always disclose that vessel positions are simulated AIS data, especially with maritime prospects
- Do NOT demo the Insurance, Trading, or Platform modules — they have UI but the backend is not fully connected
- Helmsman AI copilot is available but frame as "the AI assistant for operators; it's connected to the platform's knowledge layer"

---

## Questions to Anticipate

**"Is the AIS data real?"**  
> "In this demo, positions are seeded for consistency. The live AIS integration — using MarineTraffic or AISHub — activates when we provision a subscription. The adapter is built and tested."

**"How does this handle a real PSC inspection?**  
> "The PSC module tracks deficiency codes, flag state records, and inspection history per vessel. When an inspection is due, the system surfaces the relevant documentation and generates a readiness checklist."
