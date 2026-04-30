# Competitive Positioning — SZL Holdings

**Phase:** A · **Audience:** GTM, sales, investors, founder talk tracks · **Last reviewed:** 2026-04-16

---

## Positioning Statement

**For** operators and executives in security, maritime, real estate, legal, and advisory domains
**Who** are accountable for high-stakes decisions but lack a structural way to govern them,
**SZL Holdings is** the governed execution layer for enterprise intelligence —
**That** turns every consequential decision into a signal-attributed, simulation-tested, policy-gated, evidence-backed, immutably-audited, outcome-tracked action,
**Unlike** generic AI copilots, observability tools, workflow platforms, trust vendors, or vertical roll-ups,
**Because** governance, attribution, simulation, proof, and outcomes are the platform — not features bolted on after the sale.

---

## The Five Competitor Categories

SZL is compared against five distinct categories. Each comparison must be precise — vague comparison ("we're better than Datadog") is a sales killer. Specific differentiation ("Datadog tells you the cluster is hot; we tell you what to do, get it approved, and prove the outcome") is a sales accelerant.

---

## Category 1 — Generic AI Copilots

**Examples:** ChatGPT Enterprise, Microsoft 365 Copilot, Glean, Notion AI, generic LLM wrappers

**What they do well:**
- Universal interface for ad-hoc queries
- Strong at unstructured knowledge retrieval
- Familiar UX (chat)

**Where they stop:**
- No schema for decision outputs — recommendations come back as prose
- No policy gate — the copilot will recommend whatever the model says
- No proof chain — recommendations evaporate into chat history
- No outcome tracking — no learning loop
- No domain depth — generic across everything, expert at nothing

**Where SZL continues:**
- Decision Engine produces typed, schema-validated decision objects
- Covenant Policy evaluates every recommendation against role, org, and regulatory constraints
- Proof Chain records model identity, sources, confidence, and review state
- Outcome Graph closes the loop — recommendations are calibrated against historical results
- Six domain packs encode domain-specific signal types, action vocabularies, and risk models

**Buyer-facing one-liner:**
*"Copilots add recommendation volume. We add the governance, evidence, and outcome tracking that turn recommendations into decisions a regulator, an operator, and a board can all stand behind."*

**When the buyer says "we already have Microsoft Copilot":**
Ask: *"When Copilot makes a recommendation that turns into a $2M action, who approved it, what evidence did they review, and what was the outcome 90 days later?"* If they cannot answer, they have a copilot, not a decision system.

---

## Category 2 — Observability Tools

**Examples:** Datadog, New Relic, Splunk, Grafana, Honeycomb, Sumo Logic

**What they do well:**
- Best-in-class signal collection and visualization
- Strong alerting and anomaly detection
- Deep DevOps and infrastructure focus

**Where they stop:**
- Show what happened, not what to do next
- No accountability layer — alerts go into queues that nobody owns
- No policy on action — operators decide ad-hoc what to do
- No simulation of consequence before action
- Alert fatigue is the universal failure mode

**Where SZL continues:**
- PRISM framework organizes signals into Pulse, Risk, Intelligence, Signals, Motion
- Every signal has an owner and a routing rule via Decision Engine
- Monte Carlo simulation models the consequence of acting (or not)
- Action queue is operator-first, not analyst-first
- Closed loop — signals that get acted on feed back into recommendation calibration

**Buyer-facing one-liner:**
*"Observability tells you the cluster is hot. We tell you what to do, who approves it, what the simulated outcome looks like, and we prove the chain after the fact."*

**When the buyer says "we already have Datadog":**
*"Keep it. We are not infrastructure observability — we are decision observability. Datadog signals are great inputs to our decision engine. The question is not whether you can see the signal — it is whether the right person acts on it within the right window with the right approval."*

---

## Category 3 — Workflow Tools

**Examples:** ServiceNow, Zapier, n8n, Asana, Jira, Workato, Tray.io

**What they do well:**
- Strong at sequencing tasks across systems
- Good user-facing form builders and automation
- Mature integration libraries

**Where they stop:**
- Workflow tools execute pre-defined sequences — they do not decide
- No simulation of risk before automation runs
- Approval gates are optional and bypassable in code
- No structured evidence on why a workflow ran
- No outcome tracking — workflow ran, end of story

**Where SZL continues:**
- Decision Engine ranks signals and chooses recommendations before any workflow runs
- Monte Carlo simulation models risk before consequential automation
- Covenant Policy enforces approval gates at the engine layer (not the UI layer); bypass requires explicit, attributed override
- Action Engine records evidence chain alongside the workflow execution
- Outcome Graph records the result and feeds it back to the Decision Engine

**Buyer-facing one-liner:**
*"Workflow tools execute. We decide, simulate, govern, execute, and prove. Workflow is one step in a nine-step loop — it is not the loop."*

**When the buyer says "we already have ServiceNow":**
*"Use it as the execution surface. We sit upstream — we decide what should run, simulate the consequence, gate the approval, and record the proof. ServiceNow is great at orchestrating tasks; we orchestrate decisions."*

---

## Category 4 — Trust / Compliance Vendors

**Examples:** Vanta, Drata, OneTrust, AuditBoard, Tugboat Logic, Secureframe

**What they do well:**
- Streamline compliance certification (SOC 2, ISO 27001)
- Pre-built control libraries
- Auditor-friendly evidence collection

**Where they stop:**
- The product is a binder for the auditor, not a tool the operator uses daily
- Evidence is collected for compliance, not for operations
- No connection to the actual decisions being made in the business
- AI governance is an afterthought (or absent)

**Where SZL continues:**
- Trust surfaces (`/aegis/trust-provenance`, `/vessels/trust-provenance`, `/terra/trust-provenance`) are operator pages — used during the workday, not just before an audit
- Proof Chain is the same evidence the auditor sees and the operator uses to make decisions
- AI governance is structural — Covenant Policy gates every AI recommendation
- Compliance evidence falls out of normal operations, not collected separately

**Buyer-facing one-liner:**
*"Trust vendors sell the binder. We sell the operating system. Your operators get governance every day; your auditor gets the binder for free."*

**When the buyer says "we already have Vanta":**
*"Keep it for the certification track. Vanta proves you have controls; we are the controls operating in real time, on every consequential decision, in the products your team already uses."*

---

## Category 5 — Vertical / Portfolio Roll-Ups

**Examples:** Specialty SIEM (Exabeam, Securonix), maritime ops (Veson, ShipNet), real estate analytics (Real Capital Analytics, CompStak), legal practice management

**What they do well:**
- Deep domain expertise in their vertical
- Mature data models for that vertical
- Strong relationships with vertical buyers

**Where they stop:**
- Each vertical is a separate stack, separate governance, separate audit model
- Cross-domain signal correlation is impossible (different products, different schemas)
- Every new vertical requires full infrastructure rebuild
- Acquisitions integrate badly — the brand may unify, but the data model does not

**Where SZL continues:**
- Six domain packs (Aegis, Vessels, Terra, Counsel, Carlota Jo, IMPERIUM) on one shared governance substrate
- Event Fabric correlates signals across domains — a Vessels sanctions hit becomes a Counsel matter; a Terra distress signal becomes an Aegis financial-crime case
- Every new domain pack ships with governance, simulation, proof, and outcome on day one
- Unified mobile command (CORTEX) reflects every domain through the same loop

**Buyer-facing one-liner:**
*"A vertical roll-up gives you six products. We give you six domain packs on one platform. The difference is whether your CISO, fleet manager, broker, and counsel can see the same signal, with the same governance, in the same audit trail."*

**When the buyer says "we already have a specialty tool for this domain":**
*"Keep it for the domain depth. We add the governance layer on top — and as you add the second and third domain, you will see why a unified governance substrate beats six unrelated stacks."*

---

## Cross-Category Differentiation Matrix

| Capability | Generic AI Copilots | Observability | Workflow Tools | Trust Vendors | Vertical Roll-Ups | **SZL Holdings** |
|------------|--------------------|--------------:|---------------:|---------------|-------------------|------------------|
| Schema-validated decision objects | ✗ | ✗ | ✗ | ✗ | ✗ | **✓** |
| Source-cited AI recommendations | Partial | ✗ | ✗ | ✗ | Partial | **✓** |
| Monte Carlo simulation pre-action | ✗ | ✗ | ✗ | ✗ | Partial | **✓** |
| Policy gate enforced at engine layer | ✗ | ✗ | UI-only | ✗ | Per-product | **✓** |
| Immutable proof chain | ✗ | Logs only | Audit log | ✓ | Per-product | **✓** |
| Closed-loop outcome tracking | ✗ | ✗ | ✗ | ✗ | ✗ | **✓** |
| Cross-domain signal correlation | ✗ | Within infra | ✗ | ✗ | ✗ | **✓ (Event Fabric)** |
| Unified mobile command surface | ✗ | Per-product | ✗ | ✗ | ✗ | **✓ (CORTEX)** |
| Same governance across all domains | n/a | n/a | n/a | n/a | ✗ | **✓** |

---

## What to Never Say

| Do not say | Say instead |
|-----------|-------------|
| "We're like Datadog but for business" | "We are the decision layer above any observability tool — Datadog included" |
| "We use AI" | "Every AI output is schema-validated, source-cited, and policy-gated" |
| "We have great dashboards" | "We have command surfaces — built for the person who is going to push the button" |
| "We do governance" | "We enforce governance at the library layer; bypass requires explicit, attributed override" |
| "We compete with [vendor]" | "We sit above [vendor] — they are great inputs to our decision engine" |
| "We're the only one" | "We are the only platform with all six pillars on one shared substrate — and here is why each pillar is hard to replicate" |

---

## Battle Cards Summary

| Competitor Class | Wedge | Land | Expand |
|------------------|-------|------|--------|
| Copilot incumbents | "Where is your decision schema?" | One domain pack with full governance loop | Add domain packs as buyer extends governance scope |
| Observability incumbents | "Who acted on the alert?" | Lyte over their observability data | Add Decision/Action engines, then domain packs |
| Workflow incumbents | "What evidence did the workflow run on?" | Decision Engine upstream of their workflow | Replace ad-hoc decisions with governed loop |
| Trust vendors | "Is your trust surface used during the workday?" | Trust surface inside an existing domain pack | Compliance evidence falls out of operations |
| Vertical roll-ups | "Can your CISO and your broker see the same signal?" | One domain pack at lower TCO | Add second domain pack — break-even moment |

---

*Source-of-truth files: `MOAT_MAP.md`, `CATEGORY_POSITIONING.md`, `BUYER_PERSONAS.md`, `OBJECTION_HANDLING.md`, `SALES_NARRATIVE.md`.*
