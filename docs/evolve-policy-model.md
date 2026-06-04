# AEEP Policy Model

## Principle

Policy in AEEP is **declarative, evaluated per operation, and always produces an immutable audit record**.
No operation that modifies production data, index state, or agent behavior may bypass policy evaluation.

---

## Policy Verdict Types

| Verdict | Meaning | Effect |
|---|---|---|
| `allowed` | Operation is permitted without intervention | Proceed immediately |
| `requires-approval` | Operation requires human review before execution | Pause run, emit ApprovalRequest |
| `blocked` | Operation is prohibited | Halt run, log, alert |
| `override` (audit only) | Allowed after approved override (post-hoc) | Audit trail only |

---

## Policy Tiers

| Tier | Examples | Default Autonomy |
|---|---|---|
| `low` | Read-only, eval suites, digests | Full — no approval required |
| `medium` | Brief delivery, signal investigation, ingest | Supervised — some operations need approval |
| `high` | Index rebuild, case timeline, profile operations | Approval required for mutations |
| `critical` | Profile version rotation, bulk deletion | Always requires explicit approval |

---

## Baseline Policy Rules

Defined in `packages/policy-guard/src/engine.ts`:

| Rule ID | Action | Verdict |
|---|---|---|
| POL-001 | Index rebuild | requires-approval (operator) |
| POL-002 | Profile version rotation | requires-approval (operator, owner) |
| POL-003 | Executive brief delivery | requires-approval (reviewer) |
| POL-004 | Bulk memory deletion | blocked |
| POL-005 | Index namespace clear | requires-approval (operator) |

---

## PolicyCheckRequest Schema

```typescript
PolicyCheckRequest {
  actionType: string
  agentRole?: AgentRoleId
  toolId?: string
  workflowId?: WorkflowId
  resourceType?: string
  resourceId?: string
  traceId: string
  metadata?: Record<string, unknown>
}
```

---

## ApprovalRequest Lifecycle

```
1. PolicyGuardian evaluates → verdict: requires-approval
2. WorkflowRuntime pauses step
3. ApprovalRequest created:
   { approvalId, workflowRunId, stepId, policyId, requestedBy, status: "pending" }
4. Operator reviews in /admin/approvals
5. Operator approves or rejects
6. WorkflowRuntime resumes (approved) or halts (rejected)
7. LedgerEntry written with approvalId, reviewedBy, reviewedAt
```

---

## Governance Rules for Agent Roles

Policy is layered: capability-level (agent-core) AND rule-level (policy-guard).

1. **Capability check** (agent-core): Is this tool permitted for this role at all?
2. **Rule check** (policy-guard): Even if permitted, does this specific action trigger a rule?

Both must pass. A tool permitted by capability can still be blocked by a policy rule.

---

## Audit Requirements

All policy evaluations where `auditRequired: true` must produce a LedgerEntry.
Blocked and requires-approval verdicts always produce a LedgerEntry regardless of rule config.
