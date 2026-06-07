# State of Platform Audit — Precision Evolution Runtime

**Prepared**: 2026-04-25  
**Author**: Precision Evolution Runtime initiative  
**Scope**: Full monorepo audit to inform PER integration decisions

---

## 1. Executive Summary

The SZL Holdings platform has a mature, nine-step governed decision loop (Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning) backed by a robust set of libraries. The building blocks for a governed AI evolution system exist but are scattered: eval infrastructure lives in `lib/ai-engine`, retrieval evals in `packages/aef-evals`, policy enforcement in `packages/policy-engine`, drift tracking in `lib/db/src/schema/drift_snapshots.ts`, and proof-chain immutability in `lib/proof-chain`. PER stitches these into a single, evidence-gated promotion control plane without duplicating any of them.

---

## 2. Application Structure

### Monorepo Layout

| Directory | Purpose |
|-----------|---------|
| `artifacts/` | User-facing surfaces (web, mobile, video, design) |
| `lib/` | Core runtime libraries and governance primitives |
| `packages/` | Shared workspace domain packages |
| `apps/` | Supporting microservices (embedding API, runtime API) |
| `services/` | Python worker services (substrate) |
| `workers/` | Serverless-style async workers |
| `docs/` | Technical documentation |

### Key Artifacts

| Artifact | Kind | Purpose |
|----------|------|---------|
| `artifacts/api-server` | web/API | Core Express 5 backend, ~357 route files |
| `artifacts/command` | web | Unified operator command surface (Operations + Strategy + Infrastructure) |
| `artifacts/pulse` | web | Executive briefing synthesis (LUMINA) |
| `artifacts/szl-holdings` | web | Flagship corporate dashboard |
| `artifacts/szl-holdings-mobile` | mobile | Expo mobile surface |

---

## 3. Frontend Architecture

### Command Artifact (`artifacts/command`)
- **Router**: Wouter with lazy-loaded pages
- **Layout**: `UnifiedLayout` with three workspace modes: Strategy, Operations, Infrastructure
- **Design System**: `@szl-holdings/design-system` + Tailwind CSS 4 + Framer Motion
- **State**: TanStack Query + localStorage persistence
- **Key pattern**: Route-based workspace detection drives accent colour and nav set

**Assessment**: Strong, consistent, enterprise-grade. The Operations workspace already owns eval-studio, eval-lab, eval-forge, governance, guardian-approvals, and policy pages. PER's four UI surfaces (Runtime Overview, Evaluation Console, Governance Console, Diagnostics) fit cleanly under a new **Evolution Runtime** section within Operations.

### Pulse Artifact (`artifacts/pulse`)
- Focused on executive consumption of AI briefs (LUMINA branding)
- Demo-PIN gated investor preview mode
- **Not chosen** for PER UI — too consumption-focused; PER is operator-controlled

---

## 4. Backend / API Services

### API Server (`artifacts/api-server`)
- Express 5, TypeScript, Zod validation via `validateBody`/`validateQuery` middlewares
- Route groups in `src/routes/groups/` provide clean domain separation
- `lazyMatch`/`lazyMount` for startup performance
- OpenTelemetry instrumentation via `lib/observability`
- Multi-tenant isolation via `tenant-scope.ts` middleware
- `lib/audit/src` for structured activity logging

**Assessment**: Solid route-group pattern. PER needs a new `evolution.ts` route group with typed Zod schemas.

### Alloy Runtime API (`apps/alloy-runtime-api`)
- High-performance inference API (not modified by PER; PER adds adapter interface that can call it)

---

## 5. Shared Libraries

### `lib/ai-engine`
| Module | Status | PER Role |
|--------|--------|---------|
| `src/learning/eval-pipeline.ts` | **Strong** — scheduled golden-set evals, calibration summaries, persist to `eval_runs` | **Reuse**: PER's evaluation console calls `getEvalHistory()` and `persistEvalReport()` |
| `src/learning/agent-corrections.ts` | **Strong** — agent-to-agent correction signals | **Preserve**: feeds PER reward signals as correction-weighted component |
| `src/fine-tuning/validation-gate.ts` | **Strong** — model regression gating with category comparison | **Elevate**: PER wraps this as one component of the full promotion gate |
| `src/connectors/adapters` | Partial — provider-specific connectors | **Preserve**: PER adapter interface is vendor-neutral above this layer |
| `src/evals/run-evals.ts` | **Strong** — golden-set runner | **Reuse** via eval-pipeline |

### `packages/aef-evals`
- Retrieval metric library (NDCG, MRR, recall@k)
- **Status**: Strong and well-tested
- **PER Role**: Reuse metric types for retrieval-quality dimension of reward composition

### `packages/policy-engine`
- Policy registry with `checkAction`, `evaluatePolicies`, built-in guardrails
- **Status**: Strong — evidence chains included per evaluation
- **PER Role**: PER promotion gate calls `evaluatePolicies` against candidate policy; critical governance failures block promotion

### `packages/aef-policy-guard`
- Tenant isolation, data redaction, retention enforcement
- **Status**: Strong
- **PER Role**: All PER evaluation traces pass through redaction before storage

### `packages/reflection-engine`
- Failure-mode analysis and skill derivation from execution traces
- **Status**: Strong — produces `qualityScore`, `failureMode`, `lesson`, `candidateSkill`
- **PER Role**: PER reward composer incorporates `qualityScore` from reflection; lessons feed calibration

### `packages/nvidia-adapters`
- NIM endpoint manager, NeMo hooks, agent profiler
- **Status**: Partial — NIM endpoints are pre-configured but no abstract adapter interface
- **PER Role**: **Elevate** by putting behind `InferenceBackendAdapter` interface — nvidia becomes one option, not the default contract

### `packages/cognitive-observability`
- OpenTelemetry, GenAI spans, business metrics, anomaly detection
- **Status**: Strong
- **PER Role**: PER diagnostic snapshots use `MetricCollector`; evaluation traces emit `GenAISpan`

### `lib/observability`
- Six Lenses observability: Signal, Impact, Anticipation, Topology, Posture, Velocity
- **Status**: Strong
- **PER Role**: PER runtime health snapshots map to Impact + Posture lenses

### `lib/proof-chain`
- `tagAIContent`, `reviewProof`, `getProofBundle` — immutable provenance records
- **Status**: Strong
- **PER Role**: Every promotion decision is tagged via `tagAIContent`; rollback events call `reviewProof`

### `lib/approvals`
- **Status**: Deprecated in favour of `@szl-holdings/covenant-policy`
- **PER Role**: PER uses `approvalRequestsTable` directly (Drizzle) for human-in-the-loop production promotion, not the deprecated lib wrapper

### `lib/audit/src`
- Structured activity logging, enriched audit, Express middleware
- **Status**: Strong
- **PER Role**: Every PER control-plane action calls `logActivity`

---

## 6. Database Schemas

### Existing tables PER reuses or extends

| Table | File | PER Use |
|-------|------|---------|
| `drift_snapshots` | `schema/drift_snapshots.ts` | PER drift layer reads baseline; PER writes per-candidate drift reports to new `per_drift_reports` table that mirrors fields |
| `audit_chain_events` | `schema/audit_chain_events.ts` | PER writes promotion decisions and rollback events here for chain integrity |
| `approval_requests` | `schema/approvals.ts` | PER promotion gate creates approval requests for production promotions |
| `approval_audit_trail` | `schema/approvals.ts` | PER reads trail to confirm human sign-off before activation |
| `governance_incidents` | `schema/governance.ts` | PER promotion gate creates incidents on critical governance failures |
| `eval_runs` | `schema/ai_evals.ts` | PER evaluation console reads existing eval history |
| `alloy_policy_versions` | `schema/alloy_policy_versions.ts` | PER candidate policies are linked to this table |

### New tables added by PER
All in `lib/db/src/schema/precision_evolution.ts`:
- `per_candidate_policies` — registered candidates with precision profile and state machine
- `per_evaluation_runs` — decoupled eval runs (separate from live policy serving)
- `per_evaluation_results` — per-case scored results
- `per_reward_breakdowns` — weighted reward component scores per run
- `per_calibration_runs` — warmup / dataset / post-update calibration executions
- `per_drift_reports` — per-candidate drift measurements (extends drift_snapshots pattern)
- `per_promotion_decisions` — evidence-gated promotion records
- `per_rollout_jobs` — decoupled rollout worker job records
- `per_rollout_traces` — per-job execution traces
- `per_runtime_health_snapshots` — device capability and runtime diagnostics

---

## 7. AI / Agent / Workflow Logic

- **Nine-Step Loop**: Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning — implemented across `lib/workflow-engine`, `packages/cognitive-runtime`, `lib/outcome-graph`
- **FORGE**: AIOps execution fabric in `packages/aef-workflow-runtime`
- **Reflection engine**: Post-execution analysis in `packages/reflection-engine`
- **PER complements this**: PER is the meta-level control plane that governs how the agent policies themselves evolve, not how individual decisions are made

---

## 8. Observability and Eventing

- OpenTelemetry traces via `lib/observability/src/otel.ts`
- Prism event bus (`packages/prism-bus`) for real-time distributed events
- GenAI telemetry spans for model calls
- **PER**: emits spans for each evaluation step and publishes drift alerts to Prism bus

---

## 9. Governance / Audit / Approval

- `lib/proof-chain`: Immutable content provenance (strong)
- `packages/policy-engine`: Runtime policy evaluation (strong)
- `lib/audit/src`: Structured logging (strong)
- `schema/approvals.ts`: Approval workflow tables (strong)
- `schema/audit_chain_events.ts`: Hash-chained audit log (strong)
- **Gap**: No unified control plane for governing the policies themselves. PER fills this gap.

---

## 10. Dead Code / Duplication / Fragility

| Item | Assessment |
|------|-----------|
| `lib/approvals` | Deprecated; PER uses table directly, not the lib |
| Inline fallback eval response in `validation-gate.ts` | Acceptable pattern, PER adds a dedicated simulation engine above this |
| NIM endpoints hardwired in `packages/nvidia-adapters` | PER adds adapter interface so NIM is one option; not removed, just wrapped |
| Scattered calibration logic | PER consolidates into `packages/evolution-core/src/calibration/` |

---

## 11. PER Integration Map

### Modules PER **Reuses** (unchanged)
- `lib/ai-engine/src/learning/eval-pipeline.ts` — `getEvalHistory`, `persistEvalReport`
- `lib/ai-engine/src/learning/agent-corrections.ts` — correction signals as reward input
- `packages/aef-evals` — metric computation types
- `packages/policy-engine` — governance failure detection in promotion gate
- `packages/aef-policy-guard` — trace redaction
- `lib/proof-chain` — promotion decision provenance
- `lib/audit/src` — control-plane activity logging
- `lib/observability` — metric collection and spans

### Modules PER **Elevates** (interface added above)
- `lib/ai-engine/src/fine-tuning/validation-gate.ts` — becomes one component of promotion gate
- `packages/nvidia-adapters` — becomes one runtime adapter implementation behind `InferenceBackendAdapter`
- `lib/db/src/schema/drift_snapshots.ts` — PER drift reports mirror and extend the pattern
- `packages/reflection-engine` — quality score feeds reward composer

### Modules PER **Preserves** (unchanged, not integrated)
- `lib/ai-engine/src/digital-twins/` — spatial twin logic is separate domain
- `lib/workflow-engine` — execution fabric; PER sits above it
- `lib/approvals` (deprecated) — PER uses DB tables directly

---

## 12. UI Host Decision

**Chosen: Command (`artifacts/command`)**

Rationale:
- Command is the operator control surface — the correct home for system-level governance of AI policies
- Already owns Eval Studio, Eval Forge, Policy Manager, Guardian Approvals, Trust Audit, Proof Chain Audit
- Operations workspace has the right accent colour (`#d4a054`) and nav pattern
- Pulse is consumption-focused (executive briefings); PER surfaces are operator-facing
- No new artifact needed; PER adds a new "Evolution Runtime" nav section under Operations

---

## 13. Originality Note (Phase 1.5 Research)

PER draws on publicly known systems-level ideas from the following domains. No code, prose, naming conventions, or benchmark numbers were copied from any third-party repository or blog post.

| Concept | Public Sources Consulted | PER Translation |
|---------|-------------------------|-----------------|
| Decoupled training/evaluation/serving | General MLOps literature (Sculley et al. 2015 "Hidden Technical Debt", Google SRE) | PER separates rollout jobs from active policy serving via `RolloutJobRunner` worker abstraction |
| Evidence-gated promotion | Continuous delivery literature, feature flag systems | PER's `PromotionGate` enforces minimum score + bounded drift + human approval before production activation |
| Precision-aware profiling | Hardware capability detection patterns in compiler literature | PER's `CapabilityDetector` produces honest runtime profile (`cpu_safe` → `remote_accelerated`) without asserting unsupported capabilities |
| Calibration and drift | Confidence calibration literature (Guo et al. 2017 "On Calibration of Modern Neural Networks") | PER implements warmup/dataset/post-update calibration runs with automatic safe fallback |
| Weighted reward composition | RLHF literature (Christiano et al. 2017), Constitutional AI (Bai et al. 2022) | PER's `RewardComposer` uses weighted components (correctness, citation fidelity, policy compliance, etc.) with explicit component attribution — original weights and components defined for this platform |
| Immutable audit trails | Blockchain provenance patterns, general audit literature | PER routes all promotion decisions through existing `lib/proof-chain` and `audit_chain_events` |

**Confirmation**: All code, naming, and prose in PER is original to this repository. No NVIDIA, vLLM, NeMo RL, Transformer Engine, DeepSeek, or third-party source was transcribed.
