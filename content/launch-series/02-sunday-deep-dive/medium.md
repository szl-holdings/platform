# Six primitives, not features.

**The architectural spine that makes SZL Holdings structurally different from dashboards, copilots, and workflow tools.**

---

[IMAGE: 01-hero-primitives-overview.png — SZL Holdings six platform primitives diagram, 1440×900, dark mode]

---

*This is Post 2 of 3 in the SZL Holdings launch series. [Post 1 — Thursday: The accountability gap is the next enterprise problem.](https://szlholdings.substack.com) Post 3 — Monday: From signal to proof.*

---

There is a structural reason why most enterprise software ends up as a collection of features rather than a governed system. Features are the natural unit of product development. They are discrete, deliverable, and demonstrable. You can show a feature in a demo. You can put a feature in a changelog.

Primitives are different. Primitives are the structural constraints and capabilities that determine what a platform can do — not just in one domain, but across every domain built on top of it. Primitives cannot be added later. They have to be designed in.

SZL Holdings is built on six. This post explains what each one does, why it is structurally necessary, and — concretely — how the same primitive operates inside a SOC alert in Aegis, a voyage P&L call in Vessels, and a listing decision in Terra simultaneously.

---

## Why Six, Why These

The governed decision loop at the core of SZL Holdings has a specific shape:

```
Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning
```

Each step in that loop requires a structural capability. You cannot instrument the loop without tracking outcomes — that's the Outcome Graph. You cannot attribute AI recommendations without an immutable record — that's the Proof Chain. You cannot enforce human-in-the-loop without a policy enforcement layer — that's Covenant Policy. You cannot show operators what could happen without probabilistic modeling — that's Decision Simulation. You cannot make complex decisions durable without orchestration — that's the Workflow Engine. You cannot correlate signals across domains without a normalized backbone — that's the Event Fabric.

The six primitives are not a menu. They are what the loop requires.

---

## Primitive 1 — Outcome Graph

[IMAGE: 02-outcome-graph-panel.png — Outcome Graph lifecycle tracking panel in Lyte, 1440×900, dark mode]

**What it does:** Tracks the full decision lifecycle — recommendation → decision → outcome — for every consequential action taken on the platform.

**Why it matters:** Most AI systems are open-loop. A recommendation is made. An action is taken or not taken. The AI never learns which recommendations were right. This creates a calibration dead end. The Outcome Graph closes the loop.

Every decision recorded in the Outcome Graph is linked to its originating signal, the recommendation made, the simulation result, the human decision, and the observed outcome. That linkage is what enables closed-loop learning — the platform knows which recommendations in which contexts led to which results.

**In Aegis (security):** A threat actor classification — APT or opportunistic — is recorded as a decision in the Outcome Graph. When the incident resolves and forensics confirm the classification, the outcome is recorded. Agent calibration adjusts for that threat class.

**In Vessels (maritime):** A voyage P&L recommendation — execute the charter at the offered rate or hold for a better rate — is tracked. When the voyage closes, the financial outcome is recorded. Future P&L recommendations for similar routes adjust their confidence accordingly.

**In Terra (real estate):** An AI underwriting recommendation — pursue or pass on an asset — is linked to the deal outcome. Win rates by asset class and recommendation confidence level are tracked automatically over time.

**In PRISM Counsel (legal):** A matter triage recommendation — recommended counsel assignment, urgency tier, jurisdictional considerations — is linked to the eventual matter resolution. Triage accuracy is tracked over time and surfaces in the Outcome Graph as a calibration signal for similar matter types.

One primitive. Four domains. The calibration compounding is the structural moat.

---

## Primitive 2 — Proof Chain

[IMAGE: 03-proof-chain-audit-trail.png — Proof Chain audit trail with AI provenance and actor attribution, 1440×900, dark mode]

**What it does:** Maintains an immutable, append-only audit trail with full provenance for every significant action — human or AI.

**Why it matters:** Enterprise operations carry compliance obligations, legal discovery risk, and regulatory exposure. A decision log that can be modified is not a Proof Chain. It is a record of what someone chose to remember.

The Proof Chain is append-only. Every entry carries: actor identity (human or AI model), timestamp, action type, source citations for AI outputs, confidence score for AI recommendations, and a cryptographic reference to the preceding entry. The chain cannot be modified retroactively.

**In Aegis:** A SOC analyst closes a P1 incident. The Proof Chain records the analyst's identity, the incident ID, the AI recommendations that were accepted or overridden, and the time of closure. Legal discovery against that incident produces a verifiable chain of custody.

**In Vessels:** A sanctions screening decision — clear or escalate a vessel — is recorded in the Proof Chain with the sanctions list version used, the AI recommendation, the human reviewer identity, and the final disposition. Regulatory auditors can reconstruct the full decision.

**In Terra:** An AI underwriting output — a deal score with sourced comparable transactions — is recorded in the Proof Chain with the model identity, the data sources cited, and the confidence score at the time of the recommendation. If the deal later produces a loss, the chain shows exactly what the AI said, what it cited, and what the human decided.

**In PRISM Counsel:** Every AI-assisted matter triage, draft pleading, or court filing recommendation is recorded in the Proof Chain with model identity, citations to relevant case law and authorities, and the attorney of record who approved or modified the output. Discovery requests and bar inquiries can reconstruct the AI's role in any matter.

---

## Primitive 3 — Covenant Policy

[IMAGE: 04-covenant-policy-gate.png — Covenant Policy approval gate in Lyte action queue, 1440×900, dark mode]

**What it does:** Defines what AI agents and users can do, with what approval requirements, for what action types — enforced at the platform layer.

**Why it matters:** Most "human-in-the-loop" implementations are UI patterns, not architectural constraints. A button that says "approve" can be bypassed, worked around, or simply removed in a future sprint. Covenant Policy is enforced by the Alloy execution fabric — it is not a UI element. An AI agent cannot bypass it because Alloy will not execute the action without a valid approval record.

Policy definitions are structured: action type, required role for approval, approval timeout, escalation path, and whether the action can be executed autonomously below a confidence threshold.

**In Aegis:** Threat containment actions — isolating a host, blocking a network segment — require Tier 2 analyst approval for classified threat types. The policy is defined once. Every containment action routes through it.

**In Vessels:** Fleet diversions that exceed a cost threshold require CFO approval. Voyage amendment recommendations surface in the Lyte action queue with all context attached and sit pending until the approval is recorded.

**In Terra:** AI underwriting recommendations require a senior analyst review before advancing to the LOI stage. The Covenant Policy gate ensures no deal moves forward on AI recommendation alone.

**In PRISM Counsel:** Court filings, settlement authorizations above a defined threshold, and external counsel engagements all carry attorney-of-record approval requirements. The Covenant Policy enforces unauthorized practice of law boundaries — AI cannot file, sign, or commit on behalf of an attorney structurally.

---

## Primitive 4 — Decision Simulation

[IMAGE: 05-decision-simulation-panel.png — Decision Simulation confidence intervals and scenario comparison in Lyte, 1440×900, dark mode]

**What it does:** Runs probabilistic modeling before consequential action — producing confidence intervals, sensitivity analysis, and scenario comparisons.

**Why it matters:** AI systems are typically backward-looking. They analyze what happened and recommend what to do based on historical patterns. Decision Simulation is forward-looking. It models what could happen under different choices before the operator commits.

This is not a simple expected-value calculator. It runs Monte Carlo simulation across configurable parameter ranges and produces a probability distribution of outcomes. Operators see the spread, not just the point estimate. Sensitivity analysis shows which inputs drive the most variance.

**In Aegis:** Before executing a SOAR playbook for a potential ransomware event, Decision Simulation models two paths: contain and investigate vs. isolate immediately. It produces probability-weighted outcome ranges for mean time to recovery, data exposure risk, and operational disruption cost. The operator chooses with the distribution visible.

**In Vessels:** Before fixing a time charter rate, Decision Simulation models rate trajectory scenarios against the vessel's open position window. The confidence interval for the current rate vs. a 30-day wait is shown explicitly. The P&L operator acts with the probability landscape in view.

**In Terra:** Before bidding on a distressed asset, Decision Simulation models IRR distributions across renovation cost scenarios and exit cap rate ranges. The operator sees not just "expected return" but "return range at the 10th and 90th percentile."

**In PRISM Counsel:** Before authorizing a settlement or litigation strategy, Decision Simulation models the probability distribution of outcomes — settlement ranges, expected legal spend, and time-to-resolution under different strategy choices. The matter lead sees the risk landscape before committing to a path.

---

## Primitive 5 — Workflow Engine

[IMAGE: 06-workflow-engine-orchestration.png — Workflow Engine multi-step process view in Alloy, 1440×900, dark mode]

**What it does:** Provides durable multi-step process orchestration with agent coordination and checkpoint recovery.

**Why it matters:** Complex decisions are not single actions. They are processes — with multiple steps, multiple actors, handoffs between human and AI, and the possibility of failure at any point. A workflow that fails silently halfway through is worse than no workflow. The Workflow Engine makes processes durable and auditable.

Each workflow is defined declaratively: steps, actors, conditions, timeouts, and recovery paths. Checkpoint recovery means a workflow that is interrupted can be resumed from the last verified step, not restarted from scratch. Agent coordination means AI steps and human steps are first-class citizens of the same orchestration graph.

**In Aegis:** An incident response workflow spans AI triage, analyst review, containment action, forensic preservation, stakeholder notification, and post-incident report generation. Each step is tracked, attributed, and recoverable. If the analyst is unavailable, the workflow routes to the backup approver.

**In Vessels:** A port of call change workflow — vessel diversion due to weather or geopolitical risk — spans AI route recommendation, CFO approval, charter party notification, port authority coordination, and ETA update. Multi-party, multi-step, governed.

**In Terra:** A deal workflow spans AI underwriting, senior analyst review, LOI drafting, counterparty negotiation, due diligence package assembly, and closing. Each stage has defined approval requirements and produces Proof Chain entries.

**In PRISM Counsel:** A matter workflow spans intake, conflict check, triage, AI-assisted research, attorney review, drafting, opposing counsel exchange, court filing, and resolution. Each step is tracked, attributed, and recoverable. AI handoffs to attorneys are first-class workflow events.

---

## Primitive 6 — Event Fabric

[IMAGE: 07-event-fabric-cross-domain.png — Event Fabric cross-domain signal routing diagram, 1440×900, dark mode]

**What it does:** Normalizes, routes, and correlates signals from across all domain packs — creating cross-domain intelligence from otherwise siloed data streams.

**Why it matters:** Most enterprise software is domain-local. A maritime data platform does not know about a legal exposure in the same organization. A security platform does not know about a sanctions hit on a supplier the treasury team just flagged. The Event Fabric breaks that siloing structurally.

Signals from every domain are normalized to a common schema and published to the Event Fabric. Subscriptions across domains can route events to correlated intelligence workstreams. AI agents can subscribe to cross-domain signal combinations.

**Example:** A vessel flagged in Vessels for dark AIS behavior — potential sanctions exposure — publishes an event to the Event Fabric. PRISM Counsel subscribes to sanctions-related vessel events. A matter is automatically opened in PRISM Counsel for legal chain-of-custody review. The maritime operator and the legal team both see the event, linked, in their respective surfaces.

**Example:** A SOC alert in Aegis about a credential breach involving a counterparty — publishes to the Event Fabric. Terra subscribes to counterparty security events for deals in due diligence. The real estate deal team sees a risk flag on their active deal automatically, without anyone manually forwarding an email.

The Event Fabric is what makes the cross-domain intelligence claim real rather than theoretical.

---

## The Same Six, Every Domain

[IMAGE: 08-command-portal-multi-domain.png — Unified Command cross-domain dashboard, 1440×900, dark mode]

The point of primitives is that they generalize. You do not build a different Proof Chain for Aegis and a different one for Vessels. You build one Proof Chain. Every domain writes to it. Every compliance team reads from it. Every audit request against any surface produces the same quality of chain of custody.

Same for the Outcome Graph. Same for Covenant Policy. Same for Decision Simulation. Same for the Workflow Engine. Same for the Event Fabric.

This is what "one platform, many domains" means at the architectural level. It is not marketing positioning. It is a structural property of the codebase.

---

## Monday: Inside a Governed Decision

Monday's post is an operator-lens narrative — one decision, start to finish, across all nine steps of the governed decision loop. A sanctions alert in Vessels. What does the operator see? What does the AI recommend? What does the simulation show? What does the Proof Chain record?

It is the most concrete thing in the series — and the right frame for practitioners who want to understand what this looks like in practice before evaluating it for their organization.

---

## Design Partner Program

We are in the design partner phase — working with a small number of operators in security, maritime, real estate, and legal to co-design the platform. If you are evaluating governance infrastructure for AI-assisted operations, start here:

**inquiries@szlholdings.com**

---

## Links

- Platform: [szlholdings.com](https://szlholdings.com)
- GitHub: [github.com/stephenlutar2-hash/szl-holdings-platform](https://github.com/stephenlutar2-hash/szl-holdings-platform)
- Medium: [@stephen_38454](https://medium.com/@stephen_38454)
- Substack: [szlholdings.substack.com](https://szlholdings.substack.com)
- LinkedIn: [linkedin.com/in/stephen-l-279315240](https://linkedin.com/in/stephen-l-279315240)

---

*Post 2 of 3. [Post 1 — Thursday: The accountability gap](https://szlholdings.substack.com). Post 3 — Monday: From signal to proof.*
