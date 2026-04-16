# Workflow State Model

**Last updated:** April 2026
**Purpose:** Define the decision workflow states and transitions

---

## Decision Lifecycle States

```
┌─────────┐     ┌──────────┐     ┌─────────────┐     ┌───────────┐
│ DETECTED │────▶│ ENRICHED │────▶│ RECOMMENDED │────▶│ SIMULATED │
└─────────┘     └──────────┘     └─────────────┘     └─────┬─────┘
                                                           │
                                     ┌──────────┐         │
                                     │ ESCALATED│◄────────┤
                                     └────┬─────┘         │
                                          │               ▼
                                          │         ┌───────────┐
                                          └────────▶│ APPROVED  │
                                                    └─────┬─────┘
                                                          │
                                                          ▼
┌──────────┐     ┌────────┐     ┌────────┐         ┌───────────┐
│ LEARNING │◄────│MEASURED│◄────│ PROVED │◄────────│ EXECUTING │
└──────────┘     └────────┘     └────────┘         └───────────┘
```

---

## State Definitions

| State | Loop Step | Entry Condition | Exit Condition | Primitive |
|-------|-----------|----------------|----------------|-----------|
| DETECTED | Signal | Event Fabric receives a domain signal | Correlation engine matches cross-domain pattern | Event Fabric |
| ENRICHED | Context | Correlation produces linked signal set | Agent Gateway has sufficient context to recommend | Event Fabric |
| RECOMMENDED | Recommendation | AI produces governed recommendation with sources | Simulation engine is invoked with scenario definition | Agent Gateway |
| SIMULATED | Simulation | Monte Carlo completes with metric distributions | Policy engine receives evaluation request | Decision Simulation |
| APPROVED | Policy | Covenant Policy returns allow decision | Workflow Engine begins execution | Covenant Policy |
| ESCALATED | Policy | Covenant Policy returns deny or requires escalation | Higher-authority approval received or action cancelled | Covenant Policy |
| EXECUTING | Execution | Workflow Engine dispatches action steps | All steps complete with attribution records | Workflow Engine |
| PROVED | Proof | Proof Chain captures immutable decision record | Outcome tracking initiated | Proof Chain |
| MEASURED | Outcome | Outcome Graph records predicted vs. actual results | Learning job triggered | Outcome Graph |
| LEARNING | Learning | Confidence calibration runs on historical data | Calibration complete; system updated | Outcome Graph |

---

## Transition Rules

1. Every transition is recorded as a PrismBusEvent with the decision's correlationId
2. No state can be skipped — the loop is sequential by design
3. ESCALATED is the only branch state — it can return to APPROVED or terminate
4. EXECUTING cannot begin until APPROVED (human-in-the-loop gate)
5. PROVED records are append-only — no state can modify a proof record after creation

---

## Competitive Comparison

| Platform | States Modeled | Governance Gate | Outcome Loop |
|----------|---------------|-----------------|--------------|
| Palantir Foundry | Data → Analysis → Action | No formal gate | No |
| Anduril Lattice | Detect → Track → Engage | ROE engine (automated) | No |
| ServiceNow | Request → Approval → Fulfillment | Approval workflow | Satisfaction survey only |
| Vanta | Evidence → Assessment → Report | Compliance check | Audit cycle |
| SZL | All 10 states above | Covenant Policy (human + automated) | Full quantitative outcome tracking |

SZL is the only platform that models the complete lifecycle from signal detection through measured outcome with a formal governance gate at the policy step.
