# ATLAS Spatial Runtime — Demo Walkthrough

**Audience:** Demo facilitators, sales engineers, investor presentations  
**Date:** April 2026  
**Duration:** 15–25 minutes (full) · 5–8 minutes (executive summary path)

---

## Before You Start

**Prerequisites:**
1. Run `pnpm seed:atlas` to ensure all ATLAS demo scenes are seeded
2. Confirm demo org is active: org ID 1 (SZL Demo Org) should have all four canonical scenarios
3. Set `ENABLE_EXECUTIVE_SAFE_MODE=false` for technical audiences; `true` for board-level presentations

**What this demo proves:**
- ATLAS is not a dashboard — it is a governed decision layer
- Scene memory, drift detection, branching, and proof chain work end-to-end
- Every output is attributed, auditable, and approval-gated
- Four real operational domains are covered in a single unified architecture

---

## Demo Path 1: Aegis Ransomware Branch Comparison

**Message:** *"When a security incident happens, ATLAS gives your SOC team more than an alert. It gives them a governed decision space."*

### Step 1 — Scene Memory
Navigate to the Aegis incident view for `INC-2026-001`.

Point out:
- The scene state panel showing all relevant incident attributes
- The **Drift Score: 0.82** — ATLAS has quantified how far this incident has moved from baseline
- The drift timeline showing when the score crossed 0.50 (warning) and 0.75 (critical)

### Step 2 — Scenario Forge Branches
Show the two branches Scenario Forge has generated:

**Branch A — Network Isolation**
- Hypothesis: Isolate ERP Server immediately to prevent lateral movement
- Top outcome: 72% probability of stopping breach, 48-hour recovery
- Alternative: 28% probability of failed isolation, $2.4M ransomware exposure

**Branch B — Monitor and Contain**
- Hypothesis: Monitor traffic patterns for 4 hours before isolation
- Top outcome: 61% probability of additional lateral movement data, extended recovery

### Step 3 — Approval Gate
Show what happens when an operator selects Branch A:
- Alloy approval workflow opens
- Required approver role: `security_lead`
- Rationale field is required before approval
- Show the proof chain entry created when approval is granted

### Step 4 — Export
Demonstrate the `exportBranchPackage()` adapter:
- JSON branch package delivered via API
- Proof bundle with model attribution, confidence scores, and approval chain

**Key message:** *"The decision just made — why Branch A was chosen, who approved it, what the alternatives were — is in the proof chain. Permanently. This is not a log. It is a governance record."*

---

## Demo Path 2: Vessels Sanctions & Weather Reroute

**Message:** *"Maritime decisions are high-stakes and time-pressured. ATLAS gives operators a structured view of their options before committing a voyage."*

### Step 1 — Scene with Active Drift
Navigate to vessel `IMO-9876543 — MV Pacific Horizon`.

Point out:
- Scene state: route, sanctions flag, weather severity, voyage ETA
- Drift Score: 0.61 — sanctions flag and weather have pushed this voyage out of its normal corridor
- The sanctions alert is not just a notification — it is embedded in the scene state, contextualized with current voyage economics

### Step 2 — Reroute Branch
Show the Cape of Good Hope reroute branch:
- Delta state: alternate route, cleared sanctions, reduced weather severity
- Outcome projections: 88% clean transit (+8 days, +$180K fuel), 12% port delay at Cape Town
- Compare to original route: sanctions exposure vs. additional cost

### Step 3 — Approval
Show the approval workflow:
- Approval role: `fleet_operator`
- Once approved, Alloy dispatches voyage instruction to the vessel management system
- Proof chain entry records the approval with the economic tradeoff documented

**Key message:** *"Without ATLAS, this decision happens on a phone call with no record. With ATLAS, the full decision chain — what options were available, what was chosen, who approved it — is immutable."*

---

## Demo Path 3: Terra Property Distress Stress Test

**Message:** *"Real estate acquisition is scenario modeling by nature. ATLAS makes the scenarios explicit and governed."*

### Step 1 — Distress Scene
Navigate to property `842 Atlantic Ave, Brooklyn`.

Point out:
- Scene state: distress score 87, lis pendens active, tax arrears $142K
- Drift Score: 0.74 — this property has moved significantly from a stable state
- The 214 days-on-market signal is in the scene state alongside the distress signals

### Step 2 — Acquisition Branches
Show the three-scenario acquisition branch:
- **Base case (66%):** Repositioning at target, 24% IRR
- **Soft market (28%):** 12-month hold extension, 14% IRR
- **Structural risk (6%):** Post-acquisition issue, breakeven

### Step 3 — Sensitivity
Point out the Monte Carlo confidence intervals on each projection. The IRR ranges are not point estimates — they carry probability-weighted variance.

**Key message:** *"Every real estate investor does scenario modeling. What ATLAS adds is that the scenario model is not in someone's spreadsheet — it is in the governance system, with approval, attribution, and outcome tracking."*

---

## Demo Path 4: Counsel Matter Pressure & Settlement

**Message:** *"Legal matter management is one of the highest-stakes, least-governed decision spaces in any organization. ATLAS brings the same governance discipline to matters that it brings to security and maritime."*

### Step 1 — Matter Scene
Navigate to matter `Holloway v. Meridian Capital Group`.

Point out:
- Scene state: $8.4M exposure, 34 days to key deadline, client pressure score 78
- Drift Score: 0.55 — the matter is in elevated territory
- Discovery status is embedded in the scene, not siloed in a separate matter management system

### Step 2 — Settlement vs. Trial Branch
Show the accelerated settlement branch:
- Settlement target: $4.2M
- Outcome: 71% probability of acceptance, avoids $8.4M trial exposure
- Alternative: 29% trial proceeds, full exposure

### Step 3 — Approval Chain
Show that settlement approval requires:
1. Outside counsel recommendation (already attached to branch)
2. Partner review (approval gate 1)
3. Client sign-off (approval gate 2)

**Key message:** *"The settlement decision is not just documented. The entire path — who proposed it, what the alternatives were, who approved each gate, when — is in the proof chain. Litigation insurance requires this."*

---

## Executive Summary Path (5–8 minutes)

For board presentations or investor meetings where time is constrained:

1. **Open with Aegis scene + drift score** (90 seconds) — establish that ATLAS is a governance layer, not a dashboard
2. **Show one branch comparison** (90 seconds) — probability-weighted outcomes, not just a recommendation
3. **Show the proof chain entry** (60 seconds) — immutable, attributed, auditable
4. **Invoke Executive Safe Mode** if drift scores are distracting — switch to qualitative labels
5. **Close with the four-domain coverage** (60 seconds) — same architecture, four verticals

---

## Common Questions and Responses

**Q: How is this different from a recommendation engine?**  
A: A recommendation engine makes suggestions. ATLAS makes suggestions, holds them at an approval gate, records who approved what and why, and tracks whether the approved action worked. That loop — recommendation → simulation → policy → execution → proof → outcome → learning — is what makes it governance infrastructure.

**Q: What if the AI branch is wrong?**  
A: Every branch is labeled with a confidence score. The human approval gate exists precisely because AI can be wrong. The proof chain records the human's decision to approve or reject. If a branch performs poorly, the Outcome Graph records it, and future calibration improves.

**Q: What data does this use?**  
A: In demo mode, seeded data is used — all clearly labeled. In production, ATLAS ingests signals from the domain-specific data sources already connected to the SZL platform (AIS for maritime, SIEM connectors for security, NYC Open Data for real estate, matter records for counsel).

**Q: Can this be used in regulated industries?**  
A: Yes. The proof chain audit trail is specifically designed for regulated industry requirements (financial services, maritime, defense contracting, legal). The architecture satisfies the EU AI Act's human oversight and documentation requirements by design.

---

## Seeding Demo Data

All four canonical demo scenarios can be seeded with:

```bash
pnpm seed:atlas
```

Individual scenarios:
```bash
pnpm seed:atlas:aegis    # Ransomware branch comparison
pnpm seed:atlas:vessels  # Sanctions/weather reroute
pnpm seed:atlas:terra    # Property distress stress test
pnpm seed:atlas:counsel  # Matter pressure & settlement
```

Verify seed completeness:
```bash
pnpm qa:atlas
```

Run the full ATLAS test suite:
```bash
pnpm test:atlas
```

---

*See also: [Architecture](../architecture/atlas-spatial-runtime.md) · [Buyer Overview](../buyer/atlas-spatial-runtime-overview.md) · [Trust Controls](../trust/atlas-spatial-runtime-controls.md)*
