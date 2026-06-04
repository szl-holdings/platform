# Workflows & Execution — SZL Holdings

## Alloy Workflow Engine

Alloy is the execution fabric that powers workflow orchestration across all SZL products.

### Workflow Lifecycle
```
Define → Configure → Trigger → Execute → Approve → Complete → Audit
```

### Workflow Components

| Component | Description |
|-----------|-------------|
| **Workflow** | A defined sequence of actions with triggers and conditions |
| **Run** | A specific execution of a workflow |
| **Action** | A discrete step within a workflow |
| **Approval** | A human-in-the-loop gate requiring explicit approval |
| **Skill** | A reusable capability that workflows can invoke |
| **Signal** | An event that can trigger a workflow |

### Approval Flows
- Critical actions require explicit human approval
- Approval requests appear in the pending approvals queue
- Approved actions are executed and audit-logged
- Rejected actions are logged with rejection reason

### Audit Trail
Every workflow action generates an immutable audit record:
- Who triggered it
- What was executed
- When it happened
- What the outcome was
- Who approved it (if applicable)

## AI Decision Workflows
1. Evidence retrieval (hybrid search + reranking)
2. Policy check (9 validated tool schemas)
3. Decision proposal (propose-only mode)
4. Human review and approval
5. Execution with audit logging
6. Outcome recording

## Distribution OS Workflows
- Article: draft → in-review → approved → published → archived
- Lead: new → qualified → warm → needs-followup → proposal-candidate → closed-won/lost
- Campaign: active → paused → completed → archived
- Automation runs: scheduled trigger → execute → log output
