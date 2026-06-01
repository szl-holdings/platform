# @workspace/guardian

Guardian is the **unified policy engine and approval tier manager** for the SZL Agentic Cognitive Operating Intelligence Platform.

## Contract

Guardian defines eight policy tiers that map to real business risk levels. Every agent action must pass through Guardian's decision engine before execution. The default behavior is **deny** when no tier is set.

### Policy Tiers

| Tier | Risk Level | Description |
|------|-----------|-------------|
| `advisory-only` | 1 | Recommendations only, no state changes |
| `internal-workflow` | 2 | Internal ops, data reads, drafts |
| `operator-assisted` | 3 | Human operator confirms before commit |
| `executive-facing` | 4 | Visible to executive stakeholders |
| `regulated-workflow` | 5 | Regulated domains: financial, legal, health, privacy |
| `external-client-facing` | 6 | Reaches external clients/third parties |
| `autonomous-reversible` | 7 | Autonomous but fully reversible |
| `human-approval-mandatory` | 8 | Always requires explicit human approval |

### Decision Engine Behavior

- **Deny-by-default**: if no `tier` is set on the request, the decision is always `deny`.
- **Tier 8 always requires approval**: `human-approval-mandatory` never auto-allows regardless of rules.
- Rules are evaluated in priority order (lower number = higher priority).
- Disabled rules are skipped.

### API Surface

```typescript
import { GuardianDecisionEngine, PolicyTierSchema } from '@workspace/guardian';

const engine = new GuardianDecisionEngine();

engine.addRule({
  id: 'allow-internal',
  name: 'Allow internal workflow',
  tier: 'internal-workflow',
  conditions: [],
  action: 'allow',
  priority: 10,
  enabled: true,
  tags: [],
});

const result = engine.decide({
  requestId: 'req-001',
  agentId: 'my-agent',
  action: 'write-record',
  tier: 'internal-workflow',
  context: {},
});
// result.outcome: 'allow' | 'deny' | 'require-approval'
```

## Non-goals

- Guardian does not persist rules to a database (use a persistence adapter in app code).
- Guardian does not execute approvals — it signals that approval is required. The approval workflow is in Alloy.
- Guardian does not replace domain-level authorization (row-level security, RBAC).

## Absorption

This package absorbs and re-exports `@szl-holdings/policy-engine` as a compatibility shim. Apps that currently import from `@szl-holdings/policy-engine` can migrate to `@workspace/guardian` incrementally.
