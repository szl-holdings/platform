# Decisioning & Governance Platform

## Overview

The SZL Decisioning Platform is a three-engine system that turns raw signals into governed, explainable, executable action. The engines are designed to be composed: the Decision Engine ranks and explains, the Policy Engine governs and guardrails, and the Action Engine executes and audits.

```
Signal Input
    │
    ▼
┌─────────────────────────────┐
│      Decision Engine        │
│  • Signal ranking           │
│  • Business impact scoring  │
│  • Urgency + confidence     │
│  • Recommendation output    │
└────────────┬────────────────┘
             │ Ranked Recommendations
             ▼
┌─────────────────────────────┐
│       Policy Engine         │
│  • Hierarchical rules       │
│  • Tenant → Domain → Action │
│  • allow / approve /        │
│    escalate / block         │
│  • Built-in guardrails      │
└────────────┬────────────────┘
             │ Governed Recommendation
             ▼
┌─────────────────────────────┐
│       Action Engine         │
│  • Workflow execution       │
│  • Manual / semi-auto /     │
│    autonomous modes         │
│  • Dry run + simulation     │
│  • Approval gates           │
│  • Rollback hooks           │
│  • Immutable audit trail    │
└─────────────────────────────┘
```

---

## Packages

### `@szl-holdings/decision-engine`

**Location:** `packages/decision-engine/`

Converts raw signals into ranked, explainable recommendations.

#### Key exports

| Export | Description |
|--------|-------------|
| `rankSignalGroups(groups, weights?)` | Rank groups of signals into recommendations sorted by priority |
| `computePriorityScore(params)` | Compute a 0–100 priority score given impact, urgency, confidence, SLA, and cross-domain risk |
| `scoreBusinessImpact(impact)` | 0–1 score from financial exposure, reputational risk, regulatory flag, entity count, blast radius |
| `evaluateSignalBatch(batch, buildGroups, weights?)` | Full evaluation pipeline from a `SignalBatch` |

#### Scoring Dimensions

The priority score (0–100) is a weighted sum of:

| Dimension | Default Weight | How Measured |
|-----------|---------------|--------------|
| Business Impact | 35% | Financial exposure, reputational risk, regulatory flag, entity count, cross-domain blast radius |
| Urgency | 25% | `routine` / `moderate` / `urgent` / `critical` mapped to 0.2–1.0 |
| Confidence | 20% | AI/model confidence score 0–1 |
| SLA Proximity | 10% | Time remaining vs. total SLA window |
| Cross-Domain Risk | 10% | Number of unique domains affected |

#### Recommendation Output

Every `Recommendation` includes:
- `title`, `summary`, `reasoning` — human-readable explanation
- `sourceSignals` — every signal that contributed
- `confidence` — model confidence (0–1)
- `urgency` — `routine | moderate | urgent | critical`
- `priority` — ranked score (0–100)
- `businessImpact` — financial, reputational, regulatory, blast radius
- `suggestedAction`, `suggestedOwner` — actionable routing
- `evidence[]` — structured evidence tuples (label, value, source)
- `policyState` — `unchecked | allowed | requires_approval | blocked`
- `approvalState` — `none | pending | approved | rejected | escalated`
- `executionStatus` — `none | queued | running | completed | failed | rolled_back`

---

### `@szl-holdings/policy-engine`

**Location:** `packages/policy-engine/`

Hierarchical policy evaluation determining what can be recommended, auto-executed, escalated, or blocked.

#### Key exports

| Export | Description |
|--------|-------------|
| `checkAction(request)` | Evaluate a single action against all registered policies |
| `evaluatePolicies(policies, request)` | Evaluate a custom policy set |
| `registerPolicy(policy)` | Register a new policy at runtime |
| `unregisterPolicy(policyId)` | Remove a policy |
| `getRegisteredPolicies()` | List all registered policies |
| `BUILT_IN_GUARDRAILS` | Pre-configured safety guardrails |

#### Policy Hierarchy

Policies are evaluated in priority order (highest first) across three scopes:

1. **Tenant scope** — applies to all actions for a specific tenant
2. **Domain scope** — applies to all actions within a domain (e.g., `aegis`, `terra`)
3. **Action scope** — applies to specific action types or classes

#### Policy Effects

| Effect | Behavior |
|--------|----------|
| `allow` | Action proceeds without restriction |
| `audit_only` | Action proceeds; a governance record is written |
| `require_approval` | Execution paused until approved by `requiredApproverRole` |
| `escalate` | Action routed to `escalateTo` for review |
| `block` | Action is hard-stopped with a policy violation record |

#### Built-in Guardrails

Four safety guardrails fire before any AI recommendation:

1. **High-Cost Autonomous Execution Guard** — `require_approval` (admin) for autonomous actions > $10,000
2. **Regulatory Exposure Escalation Guard** — `require_approval` (compliance) for actions with regulatory flag
3. **Cross-Domain Critical Action Guard** — `require_approval` (ops) for critical-urgency actions
4. **Low Confidence Autonomous Block** — `block` autonomous execution with confidence < 0.5

#### Policy Evaluation Result

```typescript
interface PolicyEvaluationResult {
  effect: PolicyEffect;
  allowed: boolean;
  requiresApproval: boolean;
  requiredApproverRole?: string;
  escalationTarget?: string;
  matchedPolicies: Array<{ policyId; ruleName; effect }>;
  violations: Array<{ policyId; policyName; reason }>;
  reasoning: string;
  evaluatedAt: number;
}
```

---

### `@szl-holdings/action-engine`

**Location:** `packages/action-engine/`

Turns policy-approved recommendations into executable, auditable workflows.

#### Key exports

| Export | Description |
|--------|-------------|
| `executeWorkflow(params)` | Execute a workflow definition |
| `registerStepHandler(name, fn)` | Register a step handler by name |
| `registerRollbackHandler(name, fn)` | Register a rollback handler by name |
| `recordRun(run)` | Store a run in immutable history |
| `listRuns(options?)` | Query execution history |
| `getRunById(runId)` | Fetch a specific run |
| `getAuditTrail(runId)` | Fetch the immutable audit trail for a run |
| `getHistoryStats()` | Aggregate stats (total, completed, failed, rolled_back, pending_approval) |

#### Execution Modes

| Mode | Description |
|------|-------------|
| `manual` | Every step requires human trigger |
| `semi_auto` | Steps run automatically; approval gates pause at designated steps |
| `autonomous` | All steps execute without human intervention (guardrails still apply) |

#### Special Run Types

- **Dry run** (`isDryRun: true`) — validates the workflow definition and produces a summary without side effects
- **Simulation** (`isSimulation: true`) — predicts outcomes and estimates costs without executing

#### Workflow Run Schema

Key fields on a `WorkflowRun`:

```typescript
{
  runId: string;                    // UUID
  workflowId: string;
  executionMode: ExecutionMode;
  isDryRun: boolean;
  isSimulation: boolean;
  status: 'pending_approval' | 'running' | 'completed' | 'failed' | 'rolled_back' | 'cancelled';
  steps: StepExecutionRecord[];
  approvalState: 'none' | 'pending' | 'approved' | 'rejected';
  policyEvaluation: PolicyEvaluationResult;
  auditTrail: Array<{
    at: number;
    actor?: string;
    action: string;
    detail?: string;
    immutable: true;           // All entries are immutable
  }>;
  startedAt: number;
  completedAt?: number;
}
```

#### Rollback

Rollback policy is set per workflow (`none | step | full`). When a step fails:
- `step` — only the failed step's rollback handler is called
- `full` — all preceding completed steps are rolled back in reverse order
- `none` — no rollback; workflow is marked failed

---

## API Routes

All routes are mounted at `/api/decisioning/`.

### Signal Evaluation

```
POST /api/decisioning/evaluate
```

Takes signal groups, ranks them through the Decision Engine, and runs each recommendation through the Policy Engine.

**Request body:**
```json
{
  "groups": [
    {
      "domain": "szl-holdings",
      "signals": [...],
      "businessImpact": { "financialExposureUsd": 4200000, ... },
      "confidence": 0.82,
      "suggestedAction": "Initiate portfolio rebalancing review"
    }
  ]
}
```

**Response:** Ranked recommendations with `policyState` and `policyEvaluation` attached.

### Policy Check

```
POST /api/decisioning/check-policy
```

Evaluate a policy gate for any action without executing it.

### Workflow Execution

```
POST /api/decisioning/execute
```

Execute a registered workflow. The Action Engine runs the policy check, applies guardrails, and returns either a run result or an approval request.

**Parameters:**
- `workflowId` — ID of a registered workflow
- `isDryRun` — simulate without side effects
- `isSimulation` — predict outcomes
- `approvedBy` — pre-approved actor (skips approval gate)

### Workflow Registry

```
GET /api/decisioning/workflows
```

List all registered workflow definitions.

### Execution History

```
GET /api/decisioning/runs               — list runs
GET /api/decisioning/runs/:runId        — get run with full audit trail
```

### Policy Management

```
GET  /api/decisioning/policies          — list registered policies (auth required)
POST /api/decisioning/policies          — register policy (admin/super_admin only)
```

### Engine Stats

```
GET /api/decisioning/stats
```

---

## Lyte Integration

The Decisioning Command surface (`/decisioning`) is available in the SZL Holdings Dashboard. It shows:

- Live recommendations ranked by the Decision Engine
- Policy state badge per recommendation (allowed / requires approval / blocked)
- Evidence panel with source attribution
- Owner assignment
- Dry run and execute actions
- Execution result panel with audit trail

---

## Integration Patterns

### From a Domain Pack

```typescript
import { rankSignalGroups } from "@szl-holdings/decision-engine";
import { checkAction } from "@szl-holdings/policy-engine";
import { executeWorkflow, recordRun } from "@szl-holdings/action-engine";

// 1. Rank signals into recommendations
const recs = rankSignalGroups(signalGroups);

// 2. Policy-check the top recommendation
const policy = checkAction({
  action: recs[0].suggestedAction,
  domain: recs[0].domain,
  subject: { roles: ["analyst"] },
  resource: { type: "recommendation" },
  confidence: recs[0].confidence,
  urgency: recs[0].urgency,
});

// 3. Execute if allowed
if (policy.allowed && !policy.requiresApproval) {
  const result = await executeWorkflow({ definition, approvedBy: "system" });
  recordRun(result.run);
}
```

### Adding a Custom Policy

```typescript
import { registerPolicy } from "@szl-holdings/policy-engine";

registerPolicy({
  id: "terra-acquisition-review",
  name: "Terra Acquisition Amount Gate",
  scope: "domain",
  domain: "terra",
  priority: 5000,
  isActive: true,
  rules: [{
    id: "rule-large-acquisition",
    name: "Require approval for large acquisitions",
    conditions: [
      { field: "estimatedCostUsd", operator: "gt", value: 5000000 },
    ],
    effect: "require_approval",
    requiredApproverRole: "exec",
    reason: "Acquisitions over $5M require executive sign-off.",
    priority: 5000,
  }],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
```

---

## Design Principles

1. **Deterministic rules fire first.** Guardrails and registered policies evaluate before any AI recommendation influences execution.
2. **AI recommends, policy governs, humans approve.** The AI output is always subject to policy evaluation before reaching an owner.
3. **Autonomous execution is explicit, not default.** The policy engine blocks autonomous execution of high-cost, low-confidence, or regulatory-exposed actions.
4. **Every execution is replayable.** The immutable audit trail records every step, approval decision, and rollback action with timestamps and actor attribution.
5. **Dry run and simulation are first-class.** Every workflow supports dry run (no side effects) and simulation (predicted outcomes) before commit.
