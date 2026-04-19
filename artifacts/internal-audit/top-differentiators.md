# Top 10 Differentiated Capabilities
**SZL Holdings — Governed Operational Intelligence**  
**Audit Date:** April 19, 2026

---

## 1. Decision Twin (Lyte)
**Claim:** Simulate the downstream consequences of a business decision before committing.

**What it does:**
- Choose any live signal or stalled approval
- Simulate approve / delay / reroute / escalate
- Estimate revenue impact, SLA impact, staffing load, security exposure
- Show confidence bands and explicit assumptions
- Store the chosen path in Alloy audit with full provenance

**Why no competitor has this under the same roof:**
Palantir has ontology; Datadog has incident simulation; neither ties decision simulation to a governed action queue with an audit trail.

**Status:** ✅ Live (761 lines, Lyte `/decision-twin`)

---

## 2. Policy Compiler (Alloy)
**Claim:** Convert plain-English operating rules into executable, versioned, rollback-able policy objects.

**What it does:**
- Input: "Any spend above $50K requires CFO approval unless emergency flag is present"
- Output: Structured policy object with conditions, effect, required approver
- Validates before activation; shows which workflows it governs
- Versions every change; one-click rollback
- Dry-run mode to test before deployment

**Why no competitor has this under the same roof:**
ServiceNow has workflow; OpenPolicyAgent has policy-as-code. Neither gives a business person a natural-language compiler with full governance rails.

**Status:** ✅ Live (1252 lines, Command `/operations/alloy/policy-compiler`)

---

## 3. Why This Property Now (Terra)
**Claim:** Ranked, explainable acquisition thesis engine for NYC real estate.

**What it does:**
- Combines: liens, code violations, transfer anomalies, ownership complexity, neighborhood trend, timing
- Generates human-readable investment thesis with confidence score
- Owner-contact hypothesis (LLC → person resolution)
- One-click to watchlist → Alloy deal pipeline

**Why no competitor has this under the same roof:**
CoStar has data; Cherre has ownership graphs. Neither synthesizes a ranked, explainable thesis with a governed action handoff.

**Status:** ✅ Live (912 lines, Terra `/why-this-property-now`)

---

## 4. Adversary Narrative Engine (Aegis)
**Claim:** Readable incident storyline that aggregates multi-source evidence into an explained attack chain.

**What it does:**
- Aggregates: SIEM, XDR, identity, cloud evidence
- Explains: what happened, likely attack chain, confidence, affected assets
- Maps each step to MITRE ATT&CK
- Generates executive summary AND analyst detail mode
- Preserves analyst edits; links to remediation actions with safety gates

**Why no competitor has this under the same roof:**
CrowdStrike has XDR correlation; Splunk has SIEM. Neither generates a narrative-form incident story with both executive and analyst modes from a single surface.

**Status:** ✅ Live (1806 lines, Aegis `/adversary-narrative-engine`)

---

## 5. Voyage Risk Twin (Vessels)
**Claim:** Route-level operational, compliance, and economic risk simulator for maritime.

**What it does:**
- Combines: vessel behavior patterns, AIS gaps, sanctions flags, route risk, weather, voyage economics
- Explains why a route or vessel is risky (not just a score)
- Recommends alternative routes with cost/risk tradeoffs
- Generates auditable compliance packet

**Why no competitor has this under the same roof:**
Windward has behavior analytics; Veson has voyage economics. Neither unifies all five risk dimensions into a single explainable twin with a compliance export.

**Status:** ✅ Live (1063 lines, Vessels `/voyage-risk-twin`)

---

## 6. White-Glove Command (Carlota Jo)
**Claim:** A discreet, premium concierge operating layer with structured service lifecycle management.

**What it does:**
- Service lanes with SLA enforcement
- VIP preference memory (tied to client dossier)
- Exception handling with escalation playbooks
- Quiet activity log (visible only to staff)
- Full service-lifecycle states from intake to resolution

**Why no competitor has this under the same roof:**
Quintessentially and Velocity Black have the white-glove experience; Salesforce has CRM. Neither gives you a governed, auditable concierge operations layer.

**Status:** ✅ Live (Carlota Jo `/concierge` — clients, requests, playbooks, comms)

---

## 7. Cross-Domain Evidence Registry (Command)
**Claim:** Every AI recommendation across every domain shows its evidence, confidence, and freshness — from one surface.

**What it does:**
- Evidence items linked to every recommendation across Lyte, Terra, Aegis, Vessels, Carlota Jo
- Source attribution (which tool / agent / data feed)
- Confidence score and freshness indicator
- Proof chain: every evidence item has a provenance reference

**Why no competitor has this under the same roof:**
This is the connective tissue that makes the six domain packs read as one platform — no competitor has a governed cross-domain evidence layer.

**Status:** ✅ Live (Command `/intelligence/evidence`)

---

## 8. Governed Decision Loop (Command)
**Claim:** A nine-step canonical loop from signal to proof, governing every consequential action across the platform.

**The loop:** Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning

**What makes it one-of-one:**
No competitor enforces human-in-the-loop, policy gates, and audit proof across all six domain packs from a single operating model.

**Status:** ✅ Live (Command `/strategy` + Platform primitives)

---

## 9. Alloy Execution Fabric (Agent-to-Human Handoff)
**Claim:** AI agents that route consequential actions to human reviewers with full context, not just notifications.

**What it does:**
- Agent proposes; policy engine evaluates; human approves with full evidence
- Irreversible actions gated behind human approval
- After-action summary auto-generated
- Every handoff stored in immutable trust receipt

**Why no competitor has this under the same roof:**
Temporal has workflow durability; LangGraph has agent orchestration. Neither enforces a governed human-in-loop model with audit receipts at the platform level.

**Status:** ✅ Live (Command `/operations/alloy/gates` + `/operations/approvals`)

---

## 10. Cognitive Runtime Self-Model (Command)
**Claim:** The platform has a verifiable, read-only inspection surface for its own AI reasoning — so operators can audit why an agent made a decision.

**What it does:**
- Self-model: identity, capabilities, calibration, trust score
- World model: entity graph with freshness and provenance
- Memory explorer: tiered memory with retention and sensitivity
- Reflection console: structured improvement reasoning

**Why no competitor has this under the same roof:**
This is radical transparency for AI operations — no competitor exposes a governed, read-only window into AI cognition at the enterprise level.

**Status:** ✅ Live (Command `/cognitive/*`)
