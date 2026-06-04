# Substrate Policy Model

## Overview

The substrate enforces governance by topology, not runtime checks. The **compiler** is the primary control; runtime policy evaluation is defense-in-depth.

## Policy Profile

Every workflow declares a `PolicyProfile`:

```typescript
const policy = definePolicy({
  id: "lyte-ops-policy",
  name: "Lyte Operations Policy",
  highRiskCategories: ["financial", "deletion", "write-external", "infrastructure"],
  policyIds: ["pol-001", "pol-002"],
  minimumApprovalTier: "operator",
});
```

## High-Risk Side Effect Categories

| Category | Risk Level | Default Approval Required |
|---|---|---|
| `read-only` | None | No |
| `write-internal` | Low | No |
| `notification` | Low-Medium | No |
| `write-external` | High | Yes |
| `financial` | High | Yes |
| `deletion` | High | Yes |
| `escalation` | High | Yes |
| `infrastructure` | Critical | Yes |

## Compiler Enforcement (Primary Control)

The compiler traverses the DAG and for each `Decide` or `ToolCall` stage that has a high-risk side effect, verifies that an `ApprovalGate` with sufficient tier exists in the ancestor chain.

**If this check fails, `compile()` throws `SubstrateCompilerError` — the workflow cannot be started.**

```
Retrieve → Reason → Verify → ApprovalGate → Decide(sideEffects: ["financial"])
                                  ↑
                       This gate satisfies the compiler check
```

```
Retrieve → Reason → Decide(sideEffects: ["financial"])
                         ↑
              COMPILER ERROR: no gate in ancestor chain
```

## Approval Tiers

| Tier | Description |
|---|---|
| `operator` | Any logged-in operator |
| `manager` | Manager or above |
| `executive` | Executive or above |
| `board` | Board-level approval |

Tiers are ordered: operator < manager < executive < board. A gate with tier `manager` satisfies a policy requiring tier `operator`.

## Runtime Policy Check (Defense-in-Depth)

At runtime, before each stage executes, the engine calls `policyAdapter.evaluate()`. This invokes the `@szl-holdings/policy-engine` package's registered policies. A runtime block is logged as a telemetry event but does not replace the compiler check.

## Approval Gate Lifecycle

```
Pipeline running
  → ApprovalGate stage reached
  → submitApprovalAction() called → approvals-inbox entry created
  → PipelineRun.status = "pending-approval"
  → Pipeline paused

Operator approves in inbox
  → runtime.resume(runId, approvedBy)
  → Gate stage marked completed
  → Pipeline resumes from next stage
```
