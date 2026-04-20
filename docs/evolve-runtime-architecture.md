# AEEP Runtime Architecture

## Overview

AEEP is a multi-layer, evidence-first platform. Every agent run is scoped to a typed
RunContext, passes through the capability resolver and policy guard, and produces an
immutable ledger entry.

---

## Package Topology

```
packages/
  shared-contracts/      ← All shared TypeScript types (roles, workflows, evidence, policy)
  agent-core/            ← RunContext factory, capability resolver
  workflow-runtime/      ← Run engine, step executor, approval gate
  retrieval-core/        ← Query planner, hybrid fusion, reranker
  memory-core/           ← Working memory, episodic store, TTL management
  evidence-ledger/       ← Immutable append-only ledger, ProofEnvelope assembly
  policy-guard/          ← Policy rule evaluation, verdict resolution
  domain-profiles/       ← 6 domain profile definitions (Lyte, Vessels, Terra, Aegis, PRISM, Carlota)
  design-system/         ← UI component library (tokens, shell, layout, data, evidence, form, feedback)
  platform-metrics-registry/ ← Metrics schema, registry, validation
```

---

## Request Flow

```
1. Trigger (manual | scheduled | event | API)
   ↓
2. Workflow Runtime: createWorkflowRun(descriptor, { profileId })
   → Assigns runId, traceId per step via agent-core
   ↓
3. For each step:
   a. Capability Resolver (agent-core): resolveCapability(role, toolId)
   b. Policy Guard: engine.evaluate(request)
      → allowed → proceed
      → requires-approval → pause, emit approval request
      → blocked → halt run
   c. Tool execution
   d. Evidence Ledger: append(LedgerEntry with ProofEnvelope)
   ↓
4. EvidenceSynthesizer: compilePackage(entries)
   ↓
5. Delivery (API, UI, brief, digest)
```

---

## Agent Role Wiring

8 typed roles are defined in `shared-contracts/src/agent-roles.ts`:

| Role | Default Autonomy | Key Capabilities |
|---|---|---|
| MissionPlanner | supervised | task.decompose, task.delegate |
| RetrievalStrategist | full | retrieval.search, rerank, queryRewrite |
| MemoryCustodian | supervised | memory.read/write/forget/expire |
| ToolOrchestrator | supervised | wildcard (with explicit denies) |
| PolicyGuardian | read-only | policy.evaluate, audit.read |
| ExecutionSupervisor | supervised | run.monitor, run.halt, run.escalate |
| EvidenceSynthesizer | full | evidence.compile, cite, scoreConfidence |
| Evaluator | full | eval.run, score, compareBaseline |

---

## Workflow Registry

10 starter workflows defined in `shared-contracts/src/workflow-types.ts`:

| Workflow | Category | Policy Tier |
|---|---|---|
| `ingest_source` | data | medium |
| `rebuild_index` | data | high |
| `verify_index_health` | data | low |
| `investigate_signal` | intelligence | medium |
| `prepare_executive_brief` | intelligence | medium |
| `compile_case_timeline` | intelligence | high |
| `review_property_risk` | intelligence | medium |
| `generate_operational_digest` | operational | low |
| `rotate_profile_version` | governance | critical |
| `run_eval_suite` | evaluation | low |

---

## Domain Profile Scoping

All retrieval, memory, and workflow runs are scoped to a domain profile.
6 profiles: `lyte | vessels | terra | aegis | prism | carlota`
Each profile defines: index namespaces, primary workflows, policy tier, agent roles.

---

## Evidence and Traceability

Every material operation produces a `LedgerEntry` with a `ProofEnvelope`:
- `traceId` — unique per run, step-level
- `sources[]` — retrieval citations with score and URI
- `toolCalls[]` — tool ID, input/output summary, duration, status
- `confidence` — high | medium | low | contradiction
- `freshness` — fresh | aging | stale | unknown
- `policyVerdict` — allowed | requires-approval | blocked | override
- `approvalId` — if human approval was required

Ledger entries are **immutable** (`Object.freeze`). Mutation throws.

---

## Approval Gate

When a policy verdict is `requires-approval`:
1. Run pauses at the step
2. `ApprovalRequest` is emitted (stored in policy-guard or external store)
3. Human reviewer approves or rejects via `/admin/approvals` screen
4. Run resumes (approved) or halts (rejected)

All approval decisions are written to the evidence ledger.
