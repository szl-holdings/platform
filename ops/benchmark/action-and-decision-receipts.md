# Action & Decision Receipts

**Last updated:** April 2026
**Purpose:** Define the receipt model for every decision and action in the governed loop

---

## Concept

Every consequential action in SZL produces two receipts:
1. **Decision Receipt** — records who decided, what evidence was considered, what was approved
2. **Action Receipt** — records what was executed, by whom/what, how long it took, what the outcome was

These receipts are inspired by Stripe's idempotency-key + request-ID pattern: every mutation gets a traceable, immutable record.

---

## Decision Receipt Schema

```
DecisionReceipt {
  receiptId: string (UUID)
  correlationId: string
  decisionType: "approve" | "reject" | "escalate" | "override" | "defer"
  decidedBy: {
    userId: string
    roles: string[]
    tenantId: string
  }
  evidenceConsidered: Array<{
    type: string
    id: string
    label: string
    confidence: number
  }>
  simulationSummary: {
    scenarioId: string
    iterations: number
    primaryMetricP50: number
    primaryMetricP95: number
  }
  policyVerdict: {
    effect: "allow" | "deny"
    matchedPolicies: string[]
    reason: string
  }
  rationale: string (optional, human-provided)
  timestamp: ISO-8601
  proofChainId: string
}
```

---

## Action Receipt Schema

```
ActionReceipt {
  receiptId: string (UUID)
  correlationId: string
  decisionReceiptId: string (links to the decision that authorized this action)
  action: string
  executor: {
    type: "human" | "agent" | "system"
    id: string
    name: string
  }
  status: "completed" | "failed" | "partial" | "cancelled"
  durationMs: number
  inputs: Record<string, unknown>
  outputs: Record<string, unknown>
  timestamp: ISO-8601
  proofChainId: string
}
```

---

## Competitive Patterns

### Stripe: Request ID + Idempotency Key
Stripe assigns a unique `request_id` to every API call and supports `Idempotency-Key` headers for safe retries. SZL's receipt model extends this pattern: every decision and action gets a unique receipt ID linked to a correlation chain.

### Palantir: Action audit trail
Palantir Foundry logs user actions on objects, but the audit trail is flat — it records *what* happened, not *why* it happened. SZL's decision receipt captures the *evidence considered*, *simulation result*, and *policy verdict* — the full "why" chain.

### Vanta: Compliance evidence
Vanta captures evidence that controls are met. SZL's proof chain captures evidence that *decisions* were governed — a broader scope covering AI recommendations, human overrides, and real-world outcomes.

---

## UX Integration

| Surface | Receipt Display |
|---------|----------------|
| Lyte Command | Decision timeline with expandable receipts |
| CORTEX Mobile | Push notification with receipt summary; full receipt in detail view |
| Audit Tab | Searchable receipt log with correlation ID filter |
| API | `GET /api/decisions/:correlationId/receipts` returns the full receipt chain |
| Export | PDF/CSV export of receipt chain for external compliance |

---

## Why This Matters for Series A

Investors evaluating SZL can inspect the receipt model and understand:
1. Every decision is traceable — no informal approvals
2. Every action is attributable — human or agent, with timing
3. Every outcome is measurable — predicted vs. actual, with variance
4. The system is self-improving — outcomes feed back into confidence calibration

This is the structural argument for "governed" as a category qualifier, not a marketing adjective.
