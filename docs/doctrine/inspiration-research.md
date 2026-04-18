# SZL Doctrine — Inspiration Research
**Date:** April 18, 2026  
**Purpose:** Capture web research used to ground the SZL Doctrine in the strongest public patterns in agent runtimes, observability, evidence graphs, policy-aware action systems, and enterprise SaaS demo discipline. This is a clean-room synthesis — no proprietary code, prompts, or designs were copied.

---

## Research Sources

### 1. Agent Observability: LangSmith and Langfuse

**Sources:**
- LangSmith documentation: https://docs.smith.langchain.com/
- Langfuse documentation: https://langfuse.com/docs
- Langfuse GitHub: https://github.com/langfuse/langfuse

**What we studied:** Both platforms provide trace-level observability for LLM applications — capturing inputs, outputs, latency, token counts, and model versions for every agent invocation. Langfuse uses an open telemetry-compatible event schema. LangSmith adds evaluation and human feedback loops.

**What we borrowed at the pattern level:**
- The concept of a "run tree" — each AI invocation is a node in a parent-child trace, not a flat log line. SZL's proof-chain should adopt a similar hierarchical trace structure so a decision can be inspected at the signal level, the agent reasoning level, and the action execution level.
- Tagging every trace with model version, provider, and latency — SZL's AI gateway should emit this as structured metadata.

**What we deliberately rejected:**
- Both tools are observability layers bolted onto existing LLM frameworks. SZL's governance loop is more fundamental — it is not just observing what the AI did but enforcing what the AI is allowed to do before it acts. Passive tracing is not sufficient.
- Langfuse's "scoring" is retrospective human annotation. SZL needs prospective policy evaluation (before execution), not retrospective scoring.

**What we're doing differently:** SZL's Proof Chain is not a log of what happened — it is an attribution-first, pre-execution policy evaluation system. The audit trail is a byproduct of governance, not the purpose of it.

---

### 2. Feature Flags: OpenFeature

**Sources:**
- OpenFeature specification: https://openfeature.dev/specification/
- OpenFeature SDK docs: https://openfeature.dev/docs/reference/concepts/

**What we studied:** OpenFeature is a vendor-neutral specification for feature flag evaluation. It defines a standard SDK interface (provider, hook, evaluation context) that works with any backend (LaunchDarkly, Flagsmith, GrowthBook, etc.). Hooks allow pre/post-evaluation side effects — useful for logging and telemetry.

**What we borrowed at the pattern level:**
- The concept of an evaluation context (user, org, environment) as first-class input to flag decisions. SZL's feature flag catalog in `packages/config` adopts this pattern: flags are evaluated against `{ orgId, role, runtimeMode }` context, not just environment variables.
- The hook model — flag evaluations should emit an event so the proof chain can record which features were active when a decision was made.

**What we deliberately rejected:**
- OpenFeature's focus is on shipping code gradually; it is not inherently about policy governance. SZL's "Covenant Policy" is not a feature flag — it is an architectural constraint on AI action. Conflating the two would dilute the governance model.

**What we're doing differently:** SZL separates feature flags (what the UI shows) from Covenant Policies (what the AI can do). The feature flag catalog controls surface-level behavior; policy-engine enforces execution constraints. They are different primitives.

---

### 3. Telemetry Standards: OpenTelemetry GenAI Semantic Conventions

**Sources:**
- OTel GenAI semantic conventions (draft): https://opentelemetry.io/docs/specs/semconv/gen-ai/
- OTel specification: https://opentelemetry.io/docs/specs/otel/

**What we studied:** The OpenTelemetry project's GenAI working group is defining standardized attribute names for LLM spans: `gen_ai.system`, `gen_ai.request.model`, `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens`, `gen_ai.response.finish_reason`. This creates vendor-neutral telemetry that works with any OTel backend (Datadog, Honeycomb, Grafana Tempo).

**What we borrowed at the pattern level:**
- Adopting the GenAI attribute naming convention in SZL's AI gateway so traces are compatible with standard OTel collectors. This future-proofs observability as the platform scales.
- The span hierarchy: a "root span" for the full governance loop (signal → outcome) with child spans for each phase (agent reasoning, policy evaluation, action execution).

**What we deliberately rejected:**
- OTel GenAI conventions are entirely about token usage and model metadata. They say nothing about governance, attribution, or policy. SZL needs a superset that adds actor attribution, policy decisions, and outcome linkage.

**What we're doing differently:** SZL's Proof Chain emits OTel-compatible spans for the AI phases, but adds SZL-specific attributes: `szl.actor.type` (human/agent/system), `szl.policy.decision` (approved/denied/deferred), `szl.decision.id` (linkage to Outcome Graph). This is additive, not a replacement.

---

### 4. Ontology-Driven Operations: Palantir Foundry / Ontology

**Sources:**
- Palantir ontology documentation: https://www.palantir.com/docs/foundry/ontology/overview/
- Palantir AIP: https://www.palantir.com/platforms/aip/

**What we studied:** Palantir Foundry's Ontology is a semantic layer that maps raw data objects (Aircraft, Patient, Order) to business entities with typed properties and relationships. Palantir AIP's "Action Types" are pre-defined, policy-gated operations that agents can execute on ontology objects. The Ontology enforces type safety and provenance at the data model level.

**What we borrowed at the pattern level:**
- The entity-first approach: operations should be typed against business entities (Fleet, Voyage, Property, Engagement), not raw database records. SZL's `packages/ontology` captures this pattern.
- Action Types as first-class governance constructs — not just API calls, but named, policy-bound operations with attribution. SZL's action-engine adopts this model.

**What we deliberately rejected:**
- Palantir's Ontology is a closed, proprietary system that requires Foundry as the platform. SZL is building on open standards (PostgreSQL, OTel, OpenFeature, standard TypeScript) to remain infrastructure-agnostic.
- Palantir's enterprise sales motion is top-down government/defense. SZL's initial motion is mid-market operators who need governed AI without a Foundry contract.

**What we're doing differently:** SZL's ontology is a TypeScript-native package (`packages/ontology`) that defines entity types and relationships without requiring a proprietary platform. It is designed to be portable across Replit, Azure, and self-hosted PostgreSQL.

---

### 5. SLO-Based Observability: Datadog / Grafana

**Sources:**
- Datadog SLO documentation: https://docs.datadoghq.com/monitors/service_level_objectives/
- Grafana SLO plugin: https://grafana.com/docs/grafana/latest/dashboards/slos/

**What we studied:** Service Level Objectives (SLOs) define a target reliability level (e.g., 99.9% uptime) and track error budget consumption against it. Datadog's SLO monitors alert when error budget is burning too fast, enabling proactive reliability management. Grafana's approach adds composite SLOs that aggregate across multiple services.

**What we borrowed at the pattern level:**
- The concept that uptime claims on marketing pages should be derived from real SLO monitors, not hardcoded values. This directly addresses the Command status page gap (P2-003).
- Error budget as a forcing function for release discipline — the release gates document (`docs/RELEASE_GATES.md`) should reference error budget burn as a deployment blocker.

**What we deliberately rejected:**
- SLO monitoring alone does not address governance — a system can have 99.9% uptime while making ungoverned AI decisions. SZL's reliability story must include governance reliability (are the approval gates working?), not just infrastructure uptime.

**What we're doing differently:** SZL will define a "Governance SLO" alongside infrastructure SLOs: what percentage of consequential AI recommendations went through the full approval gate in the last 30 days? This is a novel metric that Datadog does not define by default.

---

### 6. Demo-Mode Discipline in Enterprise SaaS

**Sources:**
- Salesforce demo environment best practices (internal documentation pattern, widely published)
- Retool demo data standards: https://retool.com/
- Common pattern from SaaS demo engineering blogs (e.g., Intercom, HubSpot engineering blogs)

**What we studied:** Enterprise SaaS companies maintain dedicated "demo orgs" with seed data that is always fresh, clearly labeled, and consistent. The best practice is: (1) demo data is never real customer data, (2) demo environments are isolated from production, (3) demo state can be reset with one click, (4) every screen shows a visible "Demo" or "Sandbox" indicator.

**What we borrowed at the pattern level:**
- The "one-click demo reset" capability as a P1 requirement, not a nice-to-have. If a demo breaks mid-presentation, the presenter must recover in under 60 seconds.
- A persistent demo mode banner (not just on maps or AIS data, but on all seeded views) so investors never mistake demo data for production metrics.
- "Sandbox" mode as a first-class product feature that prospects can self-serve — not just a presenter-controlled environment.

**What we deliberately rejected:**
- Demo environments that are entirely separate from production code. SZL's "demo mode" should run on the same code path as production, with `RUNTIME_MODE=demo` flipping behavior. Separate demo codebases create drift and maintenance burden.

**What we're doing differently:** SZL's `DemoModeBanner`, `DataProvenance` component, and `RUNTIME_MODE` env system are already aligned with this best practice. The gap is consistent application across all artifacts (see P2-009).

---

## Summary: What We're Building That Doesn't Exist Elsewhere

| Pattern | Existing tools | SZL's approach |
|---|---|---|
| AI observability | LangSmith, Langfuse (retrospective tracing) | Proof Chain (pre-execution governance + attribution audit) |
| Feature flags | OpenFeature, LaunchDarkly | Feature flags + Covenant Policy as separate primitives |
| Telemetry | OTel GenAI conventions (token/model metadata) | OTel-compatible + actor attribution + policy decision events |
| Ontology | Palantir Foundry (proprietary) | TypeScript-native, infrastructure-agnostic |
| Reliability | Datadog SLOs (infrastructure uptime) | Infrastructure SLOs + Governance SLOs (approval gate integrity) |
| Demo discipline | Separate demo orgs | Same codebase, RUNTIME_MODE flag, consistent DemoModeBanner |
