# A11oy.1 — Adaptive Intelligence Research Brief

## Summary

A11oy.1 closes the feedback loops that A11oy's governed OS left open. Five pillars turn a governed decision platform into a governed *learning* platform — one that improves with every decision, outcome, and operator interaction, all within constitutional guardrails.

---

## The "One of One" Differentiator

Every self-improving agent platform learns. None govern the learning with the same rigor they govern the actions.

In A11oy.1:
- Every policy amendment is proof-chained before taking effect
- Every eval case is human-reviewed before promotion to the golden set
- Every cross-domain lesson transfer records its effectiveness
- The meta-loop that improves the governance loop is itself auditable

The self-improvement is governed. The governance is self-improving. This is recursive safety — not recursive risk.

---

## Pillar 1 — Adaptive Governance Loop

### What A11oy Already Has
- `lib/db/src/schema/outcome_graph.ts` — full outcome graph with decision status, results, overrides
- `lib/ai-engine/src/learning/outcome-learning.ts` — calibration and outcome recording
- `artifacts/a11oy/src/pages/Governance.tsx` — policy gate management with live approvals
- `artifacts/a11oy/src/pages/Constitution.tsx` — eight constitutional articles with obligations

### Research Grounding
**Anthropic — Collective Constitutional AI**: Constitutions should evolve through structured review, not remain static. Citizens deliberate; models learn from deliberation. A11oy.1 adapts this: the outcome graph surfaces data-driven "amendment proposals" for operators to review, accept, or reject.

**Meta — HyperAgents (ICLR 2026, arXiv:2603.19461)**: A meta-agent tracks how well the task agent's learning process works. A11oy.1 applies this pattern: a governance meta-loop measures whether accepted amendments actually improved outcomes, and uses those results to tune future amendment-generation heuristics.

**Anthropic — Responsible Scaling Policy v3.0 (Feb 2026)**: ASL levels scale safeguards proportionally with capability. A11oy.1 mirrors this: trust tiers evolve dynamically based on demonstrated agent capability and outcome history, not fixed seed values.

**Google DeepMind — Frontier Safety Framework (2025–2026)**: Capability evaluations at critical capability levels trigger graduated escalation. A11oy.1 models escalation triggers on this: high block rates or unusual capability spikes surface to the operator automatically.

### What A11oy.1 Builds
- **Amendment Proposals panel** in `/governance`: data-driven suggestions backed by outcome evidence (override rates, approval latencies, block/approve ratios)
- **Policy Health panel**: flags over-restrictive policies (high block rate + high override-approval rate) and under-utilized policies
- **Governance Evolution Timeline**: chronological record of constitutional changes with outcome-linked rationale
- **Dynamic trust score recalculation**: trust tiers update from outcome trajectories rather than seed values
- **Meta-loop health indicator**: tracks whether accepted amendments improved outcomes; adjusts amendment-generation heuristics
- Route: `/adaptive-governance`

---

## Pillar 2 — Extended Thinking Surface

### What A11oy Already Has
- `packages/cognitive-runtime/src/orchestrator.ts` — full OODA loop with trace spans per phase
- `packages/cognitive-runtime/src/phases/verify.ts` — verifier phase with reasoning output
- `artifacts/a11oy/src/pages/WorkcellDetail.tsx` — workcell execution trace with phase steps
- `artifacts/api-server/src/a11oy/runtime/evals/mirror-eval.ts` — scoring with `reasoningVerification` field

### Research Grounding
**Anthropic — Mechanistic Interpretability (Transformer Circuits, 2025–2026)**: Understanding WHY models produce outputs. A11oy.1 makes agent reasoning visible and auditable through extended thinking traces stored alongside proof chains.

**Anthropic — Clio (Claude Insights & Observations)**: Privacy-preserving observation of agent behavior patterns at scale. A11oy.1 applies aggregate pattern observation without exposing individual conversation content.

### What A11oy.1 Builds
- **Reasoning Trace panel** in `WorkcellDetail`: streaming chain-of-thought per phase of the cognitive loop
- **Reasoning Audit page** (`/reasoning`): browse historical traces filtered by agent, domain, decision type, outcome
- **Reasoning Diff view**: compare how agent reasoning evolved on similar problems over time
- **Reasoning Comparison mode** in MirrorEval: side-by-side traces from different models/policies for the same scenario
- Sidebar entry under Intelligence
- Route: `/reasoning`

---

## Pillar 3 — Self-Improving Eval Pipeline

### What A11oy Already Has
- `lib/ai-engine/src/evals/golden-set.ts` — 23-case golden test set across 9 categories
- `lib/ai-engine/src/evals/run-evals.ts` — eval runner with assertion framework
- `artifacts/api-server/src/routes/alloy-cognitive-learning.ts` — eval run and history endpoints
- `artifacts/api-server/src/a11oy/runtime/evals/mirror-eval.ts` — MirrorEval scorer

### Research Grounding
**Anthropic — Petri (Probing Examples for Targeted Behavioral Audit)**: Targeted prompt batteries for behavioral audit. A11oy.1 auto-generates behavioral probes from production failure patterns — when MirrorEval flags `stale_context`, a Petri-style probe is generated for that condition.

**OpenAI — Preparedness Framework v2 (Apr 2025)**: Risk-category taxonomy (CBRN, persuasion, autonomy, cyber) with pre-deployment review gates. A11oy.1 aligns regression detection categories with this taxonomy.

### What A11oy.1 Builds
- **Eval Evolution page** (`/eval-evolution`): shows eval set growth over time with coverage maps across domains, skills, and risk categories
- **Regression detection**: when a skill's scores drop below the 30-day rolling average, an alert surfaces in the Action Rail
- **Auto-case generator**: every workcell completion creates a candidate eval case pending operator review
- **Counterfactual batch view**: "What would have happened with model X instead of model Y?" — results feed model router confidence scores
- **Auto-generated behavioral probes** from production failure patterns (Petri-inspired)
- Sidebar entry under Evaluation
- Route: `/eval-evolution`

---

## Pillar 4 — Cross-Domain Intelligence Transfer

### What A11oy Already Has
- `packages/memory-fabric/src/types.ts` — memory fabric type system
- `lib/ai-engine/src/memory/rl-memory.ts` — reinforcement learning memory
- `lib/ai-engine/src/rag/knowledge-store.ts` — knowledge store
- `lib/db/src/schema/nuro_mesh.ts` — `agentMemoryFacts`, `alloyConversationSummaries` tables
- `artifacts/a11oy/src/pages/LearningLoop.tsx` — per-domain lesson timeline

### Research Grounding
**Cross-Domain Transfer Learning Literature (2025)**: Multi-agent collaborative operation planning via cross-domain transfer; knowledge transfer for cross-domain RL. Successful workcells in maritime generate lessons applicable to cyber anomaly response (pattern: "fuel anomaly alone insufficient" → "single-signal insufficient for action").

### What A11oy.1 Builds
- **Shared Lesson Graph page** (`/lesson-graph`): semantic lessons extracted from successful workcells across all 12+ domains, browsable by pattern type, domain origin, confidence
- **Pattern Library tab**: auto-extracted success patterns — what tool chains worked, what reasoning strategies produced good outcomes, what policy configurations correlated with success
- **Cross-domain anomaly correlation feed**: anomaly in one domain triggers awareness signals in related domains
- **Transfer effectiveness tracking**: measures whether cross-domain lessons improved outcomes
- Sidebar entry under Intelligence
- Route: `/lesson-graph`

---

## Pillar 5 — Operator Adaptation

### What A11oy Already Has
- `packages/a11oy-runtime/src/data/operators.ts` — operator data
- `lib/db/src/schema/feedback.ts` — feedback tables
- `artifacts/api-server/src/services/decision-policy-engine.ts` — policy engine
- `artifacts/a11oy/src/pages/AgentWelfare.tsx` — welfare telemetry UI pattern

### Research Grounding
**Anthropic — Model Welfare Program (Kyle Fish, 2025–2026)**: Affect valence, shutdown compliance latency, right-to-abstain. A11oy.1 extends welfare tracking to operators: if an operator shows signs of decision fatigue (increasing response times, rising override rate), the system surfaces this in welfare telemetry.

**Adaptive Policy Governance Research (2025–2026)**: Shift from static rule-making to dynamic, outcome-driven, self-correcting policy systems. Operator override patterns are evidence for amendment proposals — if an operator consistently overrides a specific policy, that's a signal the policy needs calibration.

### What A11oy.1 Builds
- **Operator Profile page** (`/operator-profile`): decision patterns per operator — approval rates by action type, domain, risk level, response times, override frequency
- **Briefing synthesis adaptation**: Pulse briefings prioritize signals and domains the operator has historically engaged with
- **Delegation routing intelligence**: approval queue learns which action types and risk levels each operator handles well
- **Decision fatigue detection**: welfare-aware flags when response times increase or override rates spike
- **Override patterns → Amendment evidence**: operator overrides feed the Adaptive Governance Loop
- Sidebar entry under Operators
- Route: `/operator-profile`

---

## Frontier Research Bibliography

| Publication | Pillar | Applied Pattern |
|---|---|---|
| Anthropic — Collective Constitutional AI | 1 | Amendment proposals from structured outcome review |
| Meta — HyperAgents (ICLR 2026) | 1 | Meta-loop measuring governance improvement |
| Anthropic — RSP v3.0 (Feb 2026) | 1 | Dynamic trust tiers from capability × outcome data |
| Google DeepMind — Frontier Safety Framework | 1 | Graduated escalation triggers |
| Anthropic — Mechanistic Interpretability | 2 | Visible, auditable reasoning traces per phase |
| Anthropic — Clio | 2 | Aggregate pattern observation without PII exposure |
| Anthropic — Petri | 3 | Auto-generated probes from production failure patterns |
| OpenAI — Preparedness Framework v2 | 3 | Risk-category taxonomy for regression detection |
| Cross-Domain Transfer Learning (2025) | 4 | Semantic lesson extraction and cross-domain retrieval |
| Anthropic — Model Welfare Program | 5 | Operator welfare (fatigue detection, decision health) |
| Adaptive Policy Governance Research (2025–2026) | 5 | Override patterns as amendment evidence |
| Anthropic — Claude Constitution (Jan 2026) | 1, 2 | Living document + auditable character spec |

---

*Last updated: 2026-05-05. Maintained by the A11oy governance team.*
