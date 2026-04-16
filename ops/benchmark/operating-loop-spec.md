# Operating Loop Specification

**Last updated:** April 2026
**Purpose:** Map the canonical nine-step loop to concrete product patterns, data models, and UX affordances

---

## The Canonical Loop

```
Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning
```

---

## Step-by-Step Specification

### 1. Signal
**Primitive:** Event Fabric (PrismEventBus)
**Pattern source:** Palantir Foundry's ontology ingestion + Anduril Lattice's sensor mesh
**What happens:** Raw signals arrive from domain-specific sources — AIS transponders, SCADA sensors, property filings, legal dockets, market feeds.
**Data model:**
```
PrismBusEvent {
  id: string
  type: "domain_signal" | "cross_domain_correlation" | ...
  domain: "aegis" | "vessels" | "terra" | ...
  sourceId: string
  severity: "info" | "low" | "medium" | "high" | "critical"
  correlationId: string
  payload: Record<string, unknown>
  timestamp: number
}
```
**UX affordance:** Signal indicator with severity badge, source attribution, domain tag. Comparable to Linear's notification system — immediate, typed, actionable.
**Competitive delta:** Palantir ingests through ETL pipelines. SZL's Event Fabric is publish-subscribe with typed domains and built-in correlation IDs — closer to Stripe's webhook architecture than traditional ETL.

### 2. Context
**Primitive:** Event Fabric (bus.getHistory + correlation engine)
**Pattern source:** Palantir's ontology linking + Anduril's multi-domain fusion
**What happens:** The correlation engine matches signals across domains — an SSH intrusion in Aegis correlates with an AIS anomaly in Vessels based on temporal proximity, shared actors, or geographic overlap.
**UX affordance:** Cross-domain correlation card showing linked signals, confidence score, and evidence chain. Comparable to Cloudflare's security event timeline — dense, contextual, temporal.
**Competitive delta:** Most platforms correlate within a single domain. SZL's correlation spans Aegis + Vessels + Terra + PRISM Counsel simultaneously.

### 3. Recommendation
**Primitive:** Agent Gateway (AI inference with source attribution)
**Pattern source:** Palantir AIP's agent-driven recommendations + Stripe's structured response envelopes
**What happens:** The AI Agent Gateway generates a governed recommendation with full source attribution — model ID, provider, confidence score, input sources, and correlation ID.
**Data model:**
```
Recommendation {
  title: string
  confidence: number
  modelId: string
  modelProvider: string
  actions: string[]
  inputSources: Array<{ type, id, label }>
  correlationId: string
}
```
**UX affordance:** Recommendation card with confidence bar, source attribution panel, and suggested actions. Comparable to Linear's AI-generated issue descriptions — but with governance metadata.
**Competitive delta:** Copilots generate recommendations without attribution. SZL's recommendations carry model ID, confidence score, and cited evidence sources — making them auditable.

### 4. Simulation
**Primitive:** Decision Simulation (Monte Carlo engine)
**Pattern source:** Quantitative finance Monte Carlo + Palantir's scenario planning
**What happens:** Before any consequential action, the platform runs a Monte Carlo simulation using the domain-specific scenario definition — sampling input distributions, running the scenario's calculate function, and computing output statistics.
**Data model:**
```
MonteCarloResult {
  scenarioId: string
  iterations: number
  metrics: Record<string, { mean, p5, p25, p50, p75, p95, min, max, stdDev }>
  inputSensitivity: Array<{ inputId, label, impact }>
  durationMs: number
}
```
**UX affordance:** Distribution charts, sensitivity tornado diagram, percentile bands. Comparable to Bloomberg terminal risk views — but integrated into the decision flow.
**Competitive delta:** No competitor integrates Monte Carlo simulation directly into the decision pipeline. Palantir offers scenario planning but not probabilistic simulation with sensitivity analysis inline.

### 5. Policy
**Primitive:** Covenant Policy Engine
**Pattern source:** Anduril's Rules of Engagement (ROE) engine + Vanta's compliance evidence
**What happens:** The Covenant Policy Engine evaluates the proposed action against registered policies — checking roles, permissions, domains, conditions, and priority ordering.
**Data model:**
```
CovenantDecision {
  requestId: string
  effect: "allow" | "deny"
  allowed: boolean
  matchedPolicies: string[]
  reason: string
}
```
**UX affordance:** Policy verdict card with matched policies, approval requirements, and escalation path. Comparable to Vanta's compliance status panels — but for operational decisions, not just compliance controls.
**Competitive delta:** Most platforms have binary RBAC. SZL's Covenant engine supports policy simulation ("what would happen if..."), domain-scoped policies, and priority-based conflict resolution.

### 6. Execution
**Primitive:** Workflow Engine
**What happens:** The approved action is executed through the Workflow Engine — each step instrumented with timing, executor attribution, and completion status.
**UX affordance:** Execution timeline with step-by-step progress, executor badges, and duration metrics. Comparable to Vercel's deployment log — real-time, step-by-step, attributable.
**Competitive delta:** Workflow tools automate sequences. SZL's execution is instrumented with attribution (who/what executed each step) and timing (how long each step took).

### 7. Proof
**Primitive:** Proof Chain
**Pattern source:** Vanta/Drata evidence collection + blockchain-inspired immutable records
**What happens:** The Proof Chain captures an immutable record of the decision — content type, source class, confidence score, model attribution, review state, export safety, and cryptographic hash.
**UX affordance:** Proof chain card with SHA-256 hash, source attribution, audit trail timeline. Comparable to Drata's compliance evidence — but covering AI decisions, not just infrastructure controls.
**Competitive delta:** Vanta proves compliance. SZL proves decision provenance — who recommended, who approved, what evidence was used, what confidence was assigned.

### 8. Outcome
**Primitive:** Outcome Graph
**What happens:** The real-world result is recorded — predicted cost vs. actual cost, predicted timeline vs. actual timeline, decision status, and outcome result.
**UX affordance:** Outcome card with variance metrics, accuracy tracking, and feedback loop indicators.
**Competitive delta:** No competitor closes the loop from recommendation to outcome with quantitative variance tracking. This is SZL's most unique primitive.

### 9. Learning
**Primitive:** Outcome Graph (confidence calibration)
**What happens:** Historical outcomes feed back into the system — adjusting agent confidence scores, refining simulation parameters, and updating recommendation quality metrics.
**UX affordance:** Learning summary with confidence trends, calibration metrics, and improvement indicators.
**Competitive delta:** AI copilots are open-loop. SZL's Outcome Graph creates a closed-loop system where every decision improves future decisions.

---

## Loop Properties

| Property | Description | Why It Matters |
|----------|-------------|---------------|
| Completeness | All nine steps are instrumented | No decision escapes governance |
| Immutability | Proof Chain records are append-only | Decisions cannot be retroactively altered |
| Attribution | Every step records who/what acted | Full accountability chain |
| Measurability | Outcomes are quantitatively compared to predictions | System improves over time |
| Domain-agnostic | Same loop applies to Aegis, Vessels, Terra, etc. | One architecture, many domains |
