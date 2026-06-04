# Workflow Execution — How Alloy Works

## What Is a Workflow?
A workflow is a defined sequence of actions with triggers, conditions, approval gates, and audit logging. Alloy orchestrates workflows across the entire SZL platform.

## Lifecycle
```
Define → Configure → Trigger → Execute → Approve → Complete → Audit
```

## Key Concepts

### Triggers
What starts a workflow:
- Manual trigger (operator clicks "run")
- Time-based schedule
- Data event (new record, status change)
- External webhook

### Actions
What happens in a workflow:
- Data operations (create, update, query)
- AI inference (evidence retrieval, recommendation)
- Notifications (alert, email, in-app)
- Integrations (API calls to external services)

### Approval Gates
Where humans review:
- Critical actions pause for human approval
- Approver sees evidence, context, and proposed action
- Approve or reject with recorded rationale
- Everything logged permanently

### Audit Trail
What gets recorded:
- Who triggered the workflow
- What each step did
- Who approved (or rejected)
- What the outcome was
- When everything happened
- Evidence used for decisions

## Best Practices
1. Every workflow should have an owner
2. Every critical action should have an approval gate
3. Every workflow should have a documented purpose
4. Workflows should be reviewed quarterly
5. Unused workflows should be deactivated

## Examples
- **Signal triage**: Incoming signal → AI analysis → Proposed priority → Human review → Assignment
- **Deal approval**: Deal submitted → Compliance check → Senior review → Approved/Rejected → Audit log
- **Content publish**: Article drafted → Editor review → Legal check → Publish → Distribution
