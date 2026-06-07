# Lyte Differentiation Brief
**Version:** 1.0 · **Date:** April 19, 2026 · **Status:** Strategy — for investor diligence, enterprise sales, and engineering alignment.

---

## Executive Summary

Every "AI ops" vendor ships observability or automation. None ship governed decision infrastructure. Lyte's moat is the combination that none of them have packaged cleanly: a **proof-chain on every card**, **adversarial validation before promotion**, **constitution-as-code governance**, **entity-first ontology**, and **autonomy modes** that let operators dial between observe-only and auto-execute. This brief maps the competitive landscape, names the five moves only Lyte makes, and sets a 90-day roadmap for deepening the moat.

---

## Part 1: Competitive Landscape — What Each Reference Does Well (and Where It Fails)

### 1.1 Anthropic — Agentic Patterns, Constitutional AI, and MCP

**What they've published well:**
- **Subagents and tool use** — Anthropic's agentic patterns (https://www.anthropic.com/engineering/building-effective-agents) define how multi-step agents should call tools, observe results, and continue. The pattern: think → call tool → observe → continue → emit structured output.
- **Constitutional AI** — Constitutional classifiers are runtime defenses against universal jailbreaks, separately from the model (https://www.anthropic.com/news/constitutional-classifiers). The principle: encode a constitution, apply it at inference time, never rely on model weight alone.
- **Model Context Protocol (MCP)** — An open standard for typed, permissioned, schema-bound tool exposure. Enables any agent to call any tool without custom integration work.
- **Prompt caching and project memory** — Context compaction and long-lived project memory so agents don't start from scratch on each session.
- **ASL tiers** — AI Safety Levels (ASL-1 through ASL-4) are the canonical capability-tier governance framework. Each tier gates what the model is allowed to do.

**Where Anthropic falls short for enterprise operators:**
- Constitutional AI is a *model-level* defense — it doesn't give operators a workspace-scoped policy DSL that governs what actions are permitted per tenant.
- MCP is a tool-exposure protocol, not an action-governance layer. It says "here's how to call the tool" but not "here's who may call it, under what conditions, with what approval requirements."
- Anthropic publishes excellent patterns but does not ship an end-to-end governed decision system as a product. The operator has to assemble it.
- No native proof-chain, adversarial validation, or autonomy-mode model that survives a compliance review.

**Lyte's delta:** We take Anthropic's constitutional principle and operationalize it as a machine-readable workspace constitution per tenant — not just a model-level filter, but a full policy DSL that governs every decision card, specifies approval requirements, and blocks auto-execute outside defined scope. Our six adversarial validation checks run before any card is promoted, producing a replayable evidence record.

---

### 1.2 New Relic — AI Monitoring

**What they've published well:**
- New Relic's AI Monitoring (https://newrelic.com/platform/ai-monitoring) captures every LLM invocation: model, prompt class, input/output tokens, latency, cost, finish reason, and feedback loop.
- The "golden signal" model — latency, traffic, errors, saturation — applied to AI: token throughput, error rate, cost per call, model availability.
- Trace-level visibility into multi-model handoffs so you can see where a chain stalls.

**Where New Relic falls short:**
- New Relic records *what happened* — it doesn't govern *what is allowed to happen*. It's retrospective observability, not prospective policy.
- AI Monitoring has no concept of a decision card, recommendation, or approval workflow. It tells you how many tokens you burned; it doesn't tell you whether the recommendation was evidence-backed or policy-compliant.
- No adversarial validation, no evidence graph, no autonomy modes.
- The intended user is a platform engineer, not an operational decision-maker.

**Lyte's delta:** We adopt New Relic's run telemetry model (model, tool, handoff, latency, cost, tokens per call) and embed it *inside* every decision card as the run trace. A decision-maker can inspect the full trace without switching tools. The Run Console surfaces the same data at a platform level. And unlike New Relic, our run data is connected to the proof-chain and audit event — so you can answer: "Did the operator who approved this card see a run that was within policy?"

---

### 1.3 Palantir Foundry — Ontology and AIP (Kinetic Actions)

**What they've published well:**
- Palantir's Foundry Ontology (https://www.palantir.com/docs/foundry/ontology/overview) is the best reference implementation of entity-first operations. Objects (Aircraft, Patient, Shipment), typed properties, links with provenance, and kinetic "action types" that are policy-gated operations on ontology objects.
- Palantir AIP runs scheduled and event-driven workflows over the Ontology to produce ranked recommendations.
- Action types as first-class governance constructs — not just API calls, but named, typed, policy-bound operations with attribution.

**Where Palantir falls short:**
- Foundry is a closed, proprietary platform requiring an enterprise contract. The ontology is Foundry-specific and does not run on standard infrastructure.
- Palantir's sales motion is top-down government and defense — not mid-market operators who need governed AI without a Foundry contract.
- No adversarial validation layer before recommendation promotion. Palantir AIP recommends; it doesn't challenge its own recommendations before surfacing them.
- The "proof-chain" concept exists implicitly in Foundry's lineage tracking, but it is not surfaced as a first-class operator artifact with a replayable audit ID.

**Lyte's delta:** We take the entity-first principle (ontology objects with typed properties, links, and policy-bound actions) and implement it on open infrastructure (PostgreSQL + TypeScript). Our entities are domain-portable across Lyte, Aegis, Vessels, Terra, and Counsel without platform lock-in. And we add the layer Palantir lacks: adversarial validation and a visible proof-chain on every recommendation before a human acts.

---

### 1.4 Datadog — LLM Observability

**What they've published well:**
- Datadog LLM Observability (https://docs.datadoghq.com/llm_observability/) traces LLM applications at the span level — prompt, completion, tool call, embedding, retrieval, agent invocations.
- Flame graphs for LLM chains, token usage heatmaps, cost attribution by model and team.
- Evals integration: run named evaluations against traces and surface failure rates per eval dimension.

**Where Datadog falls short:**
- Like New Relic, Datadog is retrospective infrastructure telemetry applied to AI. It answers "what happened to my LLM calls?" not "was this recommendation sound, policy-compliant, and evidence-backed?"
- No governance model. No approval workflows. No autonomy modes.
- The unit of analysis is a span or trace — not a decision card with a proof-chain.
- Evals in Datadog are model-quality metrics (accuracy, latency), not decision-quality metrics (evidence coverage, adversarial validation pass rate, policy compliance).

**Lyte's delta:** We adopt Datadog's span model for the run trace embedded in each decision card — capturing model call, tool call, handoff, latency, tokens, and cost per step. Then we go three layers deeper: we validate the recommendation before promoting it, we attach the run trace to the decision card's proof-chain, and we record the human approval decision with an immutable audit event. The result is an end-to-end accountability record that Datadog cannot produce.

---

### 1.5 Splunk Mission Control — Unified SOC Operations

**What they've published well:**
- Splunk Mission Control unifies detection, investigation, and response into a single SOC workflow. Detections → triage queue → investigation → playbook execution → case closure.
- Risk-Based Alerting (RBA) aggregates raw alerts into risk scores per entity, reducing alert fatigue.
- SOAR playbooks as codified response procedures — not just alerts, but actionable workflows.

**Where Splunk falls short:**
- Splunk is purpose-built for security operations. It cannot be applied to business observability (approval chain stalls, revenue risk, workflow bottlenecks) without heavy custom integration.
- No cross-domain intelligence — a Splunk deployment for security doesn't speak to a Splunk deployment for operations.
- The "decision" in Splunk is a closed/resolved case, not a governed recommendation with a proof-chain and autonomy mode.
- No adversarial validation, no constitutional policy engine.

**Lyte's delta:** We take Splunk's workflow model (detection → triage → playbook → closure) and generalize it to any operational domain. The Decision Center is the unified triage surface — not just for security incidents but for any high-stakes business decision. And our governance layer enforces what actions are permitted at each step, regardless of domain.

---

### 1.6 Structured Analytic Techniques — Intelligence Tradecraft

**Inspiration from professional intelligence analysis:**
- **Analysis of Competing Hypotheses (ACH)** — explicitly enumerate competing explanations for observed data, rate each against the evidence, eliminate those that contradict the strongest evidence.
- **Key Assumptions Check** — before acting on a recommendation, enumerate all assumptions it rests on and test each one.
- **Devil's Advocacy** — assign a role to argue against the leading hypothesis; surface blind spots before commitment.
- **Indicators and Warnings (I&W)** — pre-define what observable conditions would falsify a current assessment or trigger escalation.

**What the intelligence community gets right:**
- Recommendations are never accepted without an adversarial check of the underlying reasoning.
- Confidence is expressed numerically with explicit uncertainty bounds, not as a binary.
- Evidence is classified by source quality, freshness, and reliability — not treated as monolithic.

**What enterprise software gets wrong:**
- AI recommendations are presented without any mechanism to challenge them. "The AI said X" becomes the rationale.
- Confidence scores exist but are not accompanied by what would change the score.
- No falsification prompt: "What would have to be true for this recommendation to be wrong?"

**Lyte's delta:** Our adversarial validation layer directly implements structured analytic technique principles: contradiction check (ACH), stale-data check (I&W freshness), missing-evidence check (key assumptions), policy check (I&W redlines), confidence-floor check (numeric uncertainty), and falsification prompt (devil's advocacy). These run automatically before every decision card is promoted to "ready for review" — not as a manual analyst exercise, but as a systematic pre-promotion gate.

---

## Part 2: The Five Things Only Lyte Does

### Move 1: Proof-Chain on Every Card

Every decision card Lyte surfaces carries a complete, replayable proof-chain:

| Element | What It Proves |
|---|---|
| Evidence items | Which signals drove this recommendation, from which sources, with what freshness and confidence |
| Run trace | Every model call, tool call, and handoff — with model name, latency, token count, and cost |
| Adversarial validation results | Six structured checks passed before the card was promoted |
| Policy state | Which rules applied, what was permitted, what was blocked |
| Audit event ID | Immutable record of the card's lifecycle — creation, promotion, action taken |

No other product packages all five elements as a first-class operator artifact. Observability tools (New Relic, Datadog) give you the run trace. Governance platforms (IBM watsonx) give you policy state. Intelligence platforms (Palantir) give you entity provenance. Lyte gives you all of them, linked, on every card.

**Why it matters:** Enterprise buyers facing compliance review need to answer "why did the system recommend this and who approved it?" Lyte answers this with a single click. Every competitor requires assembling the answer from multiple disconnected systems.

### Move 2: Adversarial Validation Before Promotion

Before a decision card reaches "ready for review," it must pass six structured checks:

| Check | Question Answered |
|---|---|
| Contradiction check | Does any evidence item directly contradict the recommendation? |
| Stale-data check | Is any evidence item older than its freshness threshold? |
| Missing-evidence check | Are there required evidence types absent from the chain? |
| Policy check | Does the recommended action fall within the workspace constitution? |
| Confidence-floor check | Is the composite confidence score above the workspace minimum? |
| Falsification prompt | What observable condition would invalidate this recommendation? |

Each check returns a structured pass/fail with explanation. A card with any failing check is held in "validation-pending" state with the failure reason visible to operators.

**Why it matters:** This implements intelligence tradecraft (ACH, key assumptions check, devil's advocacy) as a systematic software gate, not a manual process. It catches bad recommendations before they reach a human decision-maker — reducing approval fatigue and improving decision quality. No other AI ops vendor ships this.

### Move 3: Autonomy Modes — Observable Governance Dial

Every decision card carries an autonomy mode that specifies how much authority the system has to act:

| Mode | What It Means |
|---|---|
| `observe` | System detects and logs; no recommendation surfaced |
| `recommend` | Recommendation surfaced; no execution path exposed |
| `draft` | Draft action prepared; requires explicit human initiation |
| `execute-with-approval` | Execution path open; requires named human approval |
| `auto-execute` | Execution proceeds without human review, within policy bounds |

The autonomy mode is set by the workspace constitution per action category. Auto-execute is only available within explicit policy bounds — the constitution file specifies which action types and severity levels are eligible.

**Why it matters:** This is the governance dial that enterprise buyers want: they can start in `recommend` mode to build trust, promote specific action types to `execute-with-approval` as confidence grows, and reserve `auto-execute` for high-frequency, low-risk actions with full audit trail. No competitor surfaces this as a first-class UI element on every card.

### Move 4: Entity-First Ontology Across Domains

Lyte's core ontology defines entities that are shared across all domain packs:

**Core entities:** Organization · User · Team · System · Application · Workflow · Case · Matter · Vessel · Property · Asset · Contract · Vendor · Signal · Recommendation · Action · Approval · Policy · Evidence · Run · Memory

Each entity carries: `provenance`, `freshness`, `confidence`, `sensitivity_tier`, `owner`, `impact_score`, and linked evidence. Domain packs (Aegis, Vessels, Terra, Counsel) extend these base types with domain-specific fields rather than replacing them.

**Why it matters:** When a maritime risk signal (Vessels) and a compliance approval stall (Lyte) both affect the same vendor entity, Lyte can correlate them without manual integration. Palantir's Foundry ontology does this well — but only within Foundry. Lyte's ontology runs on standard PostgreSQL and TypeScript, making it portable across deployment environments and accessible to any operator without platform lock-in.

### Move 5: Constitution-as-Code Governance

Each workspace has a machine-readable constitution file that specifies:

```json
{
  "workspace_id": "ws_...",
  "version": "1.0",
  "required_approvals": {
    "execute-with-approval": { "roles": ["operator", "admin"], "sla_minutes": 60 },
    "auto-execute": { "roles": [], "sla_minutes": 0 }
  },
  "action_redlines": ["notify_external_party", "delete_record", "submit_regulatory_filing"],
  "autonomy_ceilings": {
    "critical": "execute-with-approval",
    "high": "execute-with-approval",
    "medium": "recommend",
    "low": "auto-execute"
  },
  "confidence_floor": 0.75,
  "freshness_max_hours": 24
}
```

The policy engine loads this constitution and evaluates every proposed decision against it — returning `allow`, `require-approval`, or `block` with reasons before any card reaches a human. A simulation mode evaluates policy without persisting — enabling policy testing and "what if we lower the confidence floor?" analysis.

**Why it matters:** IBM watsonx.governance offers AI lifecycle governance as a platform product. Anthropic's Constitutional AI is a model-level filter. Neither gives enterprise operators a self-service policy DSL they can edit in version control, test in simulation mode, and deploy per workspace. Lyte's constitution is a TypeScript-readable JSON file that fits in a repo, passes a diff review, and produces auditable outcomes.

---

## Part 3: The Wedge Narrative

### The Problem We Enter On

Enterprises run critical decisions through approval chains that fail silently. A VP departs; their approvals don't redirect. A compliance check blocks an automated action; no one knows why. An AI recommendation surfaces without evidence; operators can't trust it. The signal is buried in a tool no one reads. The action never happens. The cost compounds.

**The wedge:** Lyte enters on **approval chain intelligence** — making stalled approvals visible, attributable, and actionable. This is a specific, undeniable problem in any organization running complex workflows. It has a measurable financial cost (ARR at risk from stalled deals, compliance exposure from delayed approvals, operational drag from blocked workflows). And it doesn't require a full platform sale — a single workflow owner can feel the value in week one.

### The Expansion Motion

Once Lyte owns approval chain intelligence, the expansion is natural:
1. **Approval chain** → **full decision workflow** — every step from signal to action
2. **Decision workflow** → **entity graph** — who owns what, what's connected to what
3. **Entity graph** → **cross-domain intelligence** — maritime risk + compliance stall + vendor risk in one surface
4. **Cross-domain intelligence** → **domain pack upsell** — Aegis for security, Vessels for maritime, Terra for real estate

Each step deepens the data moat. Each approved decision is a training signal. Each audit event is an accountability record. Each domain pack adds entities that enrich the shared ontology.

### The Buyer Story

For a **VP of Operations** at a $50M revenue company with 3 stalled enterprise deals:

> "I know approvals are stuck. I don't know why, or who owns them, or what it's costing me. I need something that finds the stall, names the owner, and gives me a clear action — with proof I can show my board."

Lyte answers: "Here's the stall. Here's the cost. Here's the recommended action, backed by 6 pieces of evidence, validated against your policy, ready for your approval."

For a **CISO** at an enterprise with a SOC team:

> "I need AI to help triage — but I can't have it act without governance. I need to know what evidence it used, what it checked, and who approved it before it did anything."

Lyte answers: "Every recommendation carries its proof-chain. Six adversarial checks ran before it reached your queue. Your constitution defines what auto-execute is permitted. Everything else requires your approval."

For an **investor** in an AI-enabled enterprise software company:

> "What's the moat? Why can't OpenAI or Palantir or Salesforce do this?"

Lyte answers: "OpenAI is a model company. They won't ship a workspace constitution DSL, adversarial validation gates, and a multi-domain ontology as an operator product. Palantir does the ontology but requires Foundry and targets defense. Salesforce automates workflows but has no proof-chain and no policy engine that enterprises can inspect. We're the intersection of three things no one has packaged: intelligence tradecraft + AI observability + governed execution — on open infrastructure, deployable in any enterprise environment."

---

## Part 4: 90-Day Follow-On Roadmap

The Decision Center v1 (this task) delivers the core proof-chain, adversarial validation, and autonomy modes. The following surfaces deepen the moat over the next 90 days.

| Priority | Surface | What It Adds to the Moat |
|---|---|---|
| **P1** | **Run Console** | First-class inspection of every model call, tool call, handoff, latency, token count, and cost — drill from a decision card into the full execution trace. Differentiates from Datadog by connecting run data to governance outcomes. |
| **P1** | **Policy Center** | Visual editor for workspace constitutions — view active rules, run simulations, version-control changes, see policy application history. Makes constitution-as-code accessible to non-engineers. |
| **P1** | **Signals Console (live)** | Wire real signal ingestion adapters to the Signals Console — starting with webhook-based business events and CRM state changes. Move from seeded signals to live signals. |
| **P2** | **Evidence Viewer** | Deep-dive surface for every evidence item attached to a decision — source document, retrieval excerpt, freshness score, provenance chain, related entities. Answers "where did this come from?" |
| **P2** | **Memory Studio** | Browse and manage saved playbooks, reusable heuristics, and org-level memory artifacts. Each memory item carries trust score, freshness, and scope. Enables institutional knowledge capture. |
| **P2** | **Eval Lab** | Run named evaluation scenarios against decision engine outputs — golden task pass rates, policy compliance rates, citation presence rates, adversarial validation pass rates. Track regression over model updates. |
| **P2** | **Audit Ledger** | Immutable, queryable event stream of every decision lifecycle event — card creation, validation results, approval decisions, executions, and outcomes. Designed for compliance export. |
| **P3** | **Entity Graph (enriched)** | Add entity-to-entity evidence links with confidence scores. Show blast radius of a decision across connected entities. Surface "cross-domain impact" when a maritime risk affects a compliance entity. |
| **P3** | **Domain Pack Adapters** | Wire real signal ingestion from Aegis (security events), Vessels (AIS data), and Terra (distress signals) into the unified decision engine. Each adapter adds domain-specific evidence types and validation rules. |
| **P3** | **Multi-tenant Policy Center** | Per-workspace constitution management via API — enables enterprise tenants to maintain their own policy DSLs without platform access. Foundation for SOC 2 Type II audit evidence. |

---

## Citations

All sources are public as of April 2026. No proprietary, paywalled, or unauthorized material is referenced.

- Anthropic agentic patterns — https://www.anthropic.com/engineering/building-effective-agents
- Anthropic Constitutional Classifiers — https://www.anthropic.com/news/constitutional-classifiers
- Anthropic Constitutional AI — https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback
- Anthropic ASL tiers — https://www.anthropic.com/news/anthropics-responsible-scaling-policy
- Anthropic Model Context Protocol — https://www.anthropic.com/news/model-context-protocol
- New Relic AI Monitoring — https://newrelic.com/platform/ai-monitoring
- Palantir Foundry Ontology — https://www.palantir.com/docs/foundry/ontology/overview
- Palantir AIP — https://www.palantir.com/docs/foundry/aip/overview
- Datadog LLM Observability — https://docs.datadoghq.com/llm_observability/
- Splunk Mission Control — https://www.splunk.com/en_us/products/mission-control.html
- Splunk Risk-Based Alerting — https://lantern.splunk.com/Security/Product_Tips/Enterprise_Security/Using_risk-based_alerting_in_Splunk_Enterprise_Security
- IBM watsonx.governance — https://www.ibm.com/products/watsonx-governance
- OpenTelemetry GenAI Semantic Conventions — https://opentelemetry.io/docs/specs/semconv/gen-ai/
- OWASP LLM Top 10 — https://owasp.org/www-project-top-10-for-large-language-model-applications/
- MITRE ATLAS — https://atlas.mitre.org/
- Analysis of Competing Hypotheses — Richards Heuer, "Psychology of Intelligence Analysis," CIA Center for the Study of Intelligence, 1999 (declassified, public)
- Structured Analytic Techniques — Heuer & Pherson, "Structured Analytic Techniques for Intelligence Analysis," 3rd ed., CQ Press, 2021

---

*This brief is the strategy anchor for Lyte's Series A diligence narrative. Reviewed and updated on every Decision Center milestone.*
