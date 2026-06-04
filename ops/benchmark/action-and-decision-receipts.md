# Action & Decision Receipt Schemas

**Status:** Canonical
**Source of truth:** `lib/db/src/schema/alloy.ts`, `lib/ai-engine/src/schemas/alloy-decision.ts`, `lib/db/src/schema/approvals.ts`
**Companion:** `operating-loop-spec.md`, `workflow-state-model.md`

---

## 0. Implementation status

This document defines the receipt contracts the platform commits to. As in `operating-loop-spec.md`, statements are tagged:

- **[Implemented]** — backed by current schema or runtime code.
- **[Target contract]** — the platform's stated commitment, currently enforced by convention or application-layer code rather than DB-level constraints. These are hardening targets, not aspirational fictions.

The decision receipt schema (`AlloyDecision`) is implemented as a TypeScript interface and persisted via `alloy_ai_decisions`; the action receipt structure within `alloyActions.result` is currently a convention applied by callers — schema-level shape enforcement is a target.

---

## 1. Purpose

A receipt is a structured, immutable record that answers: **what happened, who caused it, on what evidence, with what outcome, and how can it be verified?** The platform produces two receipt types:

- **Decision receipts** — recorded at DECIDE and APPROVE. Capture the recommendation, the evidence, the policy decision, the approver, and the rationale.
- **Action receipts** — recorded at ACT. Capture the execution outcome, side effects, external references, and timing.

Both receipt types are then anchored into the immutable audit chain at PROVE.

This document specifies the field-level schema for each receipt type, the provenance chain that links them, and the verification commitments.

---

## 2. Decision receipt

A decision receipt is a row in `alloy_ai_decisions` (table) corresponding to the `AlloyDecision` interface in `lib/ai-engine/src/schemas/alloy-decision.ts`. It is produced by an AI agent, a deterministic rule, or a human operator.

### 2.1 Schema (`AlloyDecision` v2.0.0)

| Field               | Type                          | Required | Description                                              |
|---------------------|-------------------------------|----------|----------------------------------------------------------|
| `decisionId`        | string (UUID)                 | ✅       | Stable identifier across the decision lifecycle          |
| `workflowId`        | string \| null                | ✅       | Owning workflow; null for ad-hoc decisions               |
| `signalIds`         | string[]                      | ✅       | Source signal references; non-empty for triaged input    |
| `recommendedAction` | string                        | ✅       | Concrete action verb + target ("escalate vessel IMO 9876543 to sanctions team") |
| `rationaleSummary`  | string                        | ✅       | One-paragraph human-readable explanation                 |
| `evidenceRefs`      | `EvidenceRef[]`               | ✅       | At least one; see §2.2                                   |
| `confidence`        | number ∈ [0, 1]               | ✅       | Model or rule confidence                                 |
| `ownerSuggestion`   | string \| null                | ⚪       | Recommended owner role or user                           |
| `approvalRequired`  | boolean                       | ✅       | Forced true for `riskLevel ∈ {P0, P1}` or `confidence < 0.5` |
| `riskLevel`         | enum {P0, P1, P2, P3, P4}     | ✅       | P0 = catastrophic, P4 = informational                   |
| `fallbackPlan`      | string \| null                | ⚪       | What to do if primary action fails or is rejected        |
| `modelRoute`        | string                        | ✅       | Model identifier or `"human"` or `"rule:<id>"`           |
| `schemaVersion`     | "2.0.0"                       | ✅       | Hard constant; bump triggers migration                   |
| `createdAt`         | ISO-8601 timestamp            | ✅       | Decision creation                                        |
| `status`            | enum (see §2.3)               | ✅       | Lifecycle state                                          |
| `approvedBy`        | string \| null                | ⚪       | Reviewer user ID                                         |
| `approvedAt`        | ISO-8601 \| null              | ⚪       | Approval timestamp                                       |
| `rejectedBy`        | string \| null                | ⚪       | Rejecter user ID                                         |
| `rejectedAt`        | ISO-8601 \| null              | ⚪       | Rejection timestamp                                      |
| `rejectionReason`   | string \| null                | ⚪       | Free-text rejection note                                 |
| `executedAt`        | ISO-8601 \| null              | ⚪       | Execution timestamp                                      |
| `executionOutcome`  | enum (see §2.4) \| null       | ⚪       | Final result                                             |
| `rawInput`          | string \| null                | ⚪       | Full raw input (model prompt or rule input)              |
| `rawOutput`         | string \| null                | ⚪       | Full raw output (model response or rule output)          |

### 2.2 EvidenceRef shape

[Implemented] Each `EvidenceRef` is a typed object (see `AlloyDecisionEvidenceRef` in `lib/ai-engine/src/schemas/alloy-decision.ts`):

```ts
interface AlloyDecisionEvidenceRef {
  refId: string;            // stable identifier for this evidence reference
  source: string;           // human-readable source name (e.g. "alloy.signals", "atlas.docs")
  sourceType:               // typed enum
    | "workflow"            // a prior or peer workflow
    | "audit"               // an audit row (e.g. an alloyAuditLog entry)
    | "signal"              // a row in alloySignals
    | "connector"           // an external connector record
    | "policy"              // a covenant policy reference
    | "prior_incident"      // a closed incident or workflow used as analogue
    | "playbook"            // a documented playbook or procedure
    | "retrieval";          // a retrieval-augmented context chunk
  content: string;          // the cited text or summary
  relevanceScore: number;   // ∈ [0, 1]
  timestamp: string | null; // ISO-8601 of the source artifact
  objectId: string | null;  // the typed object identifier (e.g. a signal id, doc id)
}
```

**[Target contract]** Decisions SHOULD have `evidenceRefs.length >= 1`. The current schema does not reject empty arrays at insert; agents and rules are expected to populate at least one entry, and decisions without evidence are flagged for review at the operator surface and in calibration metrics. DB-level enforcement is a hardening target.

### 2.3 Decision status lifecycle

```
proposed → pending_approval → approved → executed
    │             │                │
    │             ▼                ▼
    │         rejected          expired
    ▼
  expired (decision unused within TTL)
```

Status transitions are written to `alloy_ai_audit_log` with `endpoint`, `model`, `routeClass`, `confidence`, `latencyMs`, `approverUserId`, `approverRoles`.

### 2.4 Execution outcome enum

| Value      | Meaning                                                                  |
|------------|--------------------------------------------------------------------------|
| `pending`  | Execution not yet attempted                                              |
| `executed` | Action ran to completion; receipt populated                              |
| `failed`   | Action attempted and failed; `errorMessage` captured                     |
| `rejected` | Approval rejected the action; never executed                             |
| `expired`  | Approval not received within TTL; never executed                         |

---

## 3. Action receipt

An action receipt is the structured `result` field of a row in `alloyActions`. It captures what the execution actually did, in concrete machine-checkable terms.

### 3.1 Action row schema (relevant fields)

The schema column requirements (NOT NULL) and the loop's contractual requirements are listed separately to avoid conflating them:

| Field           | Type                                                       | DB NOT NULL | Loop contract |
|-----------------|------------------------------------------------------------|-------------|---------------|
| `id`            | serial                                                     | ✅          | required      |
| `externalId`    | text (unique)                                              | ⚪          | recommended   |
| `workflowId`    | integer (FK)                                               | ⚪ (nullable today) | [Target contract] required — orphan actions should not exist |
| `signalId`      | integer (FK)                                               | ⚪          | optional      |
| `type`          | enum {alert, notify, escalate, assign, resolve, suppress, review, remediate, report, custom} | ✅ | required      |
| `title`         | text                                                       | ✅          | required      |
| `description`   | text                                                       | ⚪          | recommended   |
| `status`        | enum {queued, in_progress, completed, failed, cancelled, skipped} | ✅ | required      |
| `priority`      | enum {low, medium, high, critical}                         | ✅          | required      |
| `assignedUserId`| integer (FK)                                               | ⚪          | optional      |
| `payload`       | jsonb (input parameters)                                   | ⚪          | recommended   |
| `result`        | jsonb (the action receipt — see §3.2)                      | ⚪          | [Target contract] required when `status = completed` |
| `errorMessage`  | text                                                       | ⚪          | required when `status = failed` (application invariant) |
| `dueAt`         | timestamp                                                  | ⚪          | optional      |
| `startedAt`     | timestamp                                                  | ⚪          | required when `status ≠ queued` |
| `completedAt`   | timestamp                                                  | ⚪          | required when `status` is terminal |
| `createdAt`     | timestamp                                                  | ✅          | required      |

### 3.2 Action receipt structure (the `result` JSON)

```jsonc
{
  "outcome": "success" | "partial" | "failure" | "no_op",
  "durationMs": 1234,
  "executedAt": "2026-04-16T13:05:22Z",
  "actorAttribution": {
    "actorType": "user" | "agent" | "system",
    "actorUserId": 42,
    "agentId": "agent:vessels-screening:v3",
    "delegatedBy": null | { "userId": 7, "role": "ops" }
  },
  "sideEffects": [
    {
      "kind": "notification" | "external_call" | "db_mutation" | "file_write" | "money_movement",
      "target": "slack:#vessels-ops",
      "summary": "Posted high-risk alert",
      "externalRef": "slack:msg:1729104522.001"
    }
  ],
  "externalRefs": [
    { "system": "salesforce", "id": "0067K00000abcDEF", "verb": "updated" }
  ],
  "metrics": {
    "itemsProcessed": 14,
    "errorsRecovered": 0
  },
  "errorMessage": null,
  "decisionId": "<linked AlloyDecision.decisionId>",
  "approvalId": 8732,
  "correlationId": "job:1729104500-abc"
}
```

**[Target contract] Required keys when `status = completed`:** `outcome`, `durationMs`, `executedAt`, `actorAttribution.actorType`, `correlationId`. The receipt is currently a free-form JSON payload at the schema level; this shape is enforced at the application layer in callers that produce action results, with schema-level validation (Zod or JSON Schema constraint) as the hardening target.

**Conditional requirements [Target contract]:**
- If `outcome = "failure"`, `errorMessage` MUST be present.
- If any `sideEffects[i].kind = "money_movement"`, `approvalId` MUST be present and reference an `approved` approval.
- If `actorAttribution.actorType = "user"`, `actorUserId` MUST be present.
- If `actorAttribution.actorType = "agent"`, `agentId` MUST be present.

### 3.3 Action status invariants

| Status         | Required additional fields                                    |
|----------------|---------------------------------------------------------------|
| `queued`       | `payload`                                                     |
| `in_progress`  | `startedAt`                                                   |
| `completed`    | `startedAt`, `completedAt`, `result.outcome`, `result.durationMs` |
| `failed`       | `startedAt`, `completedAt`, `errorMessage`                    |
| `cancelled`    | `errorMessage = "cancelled by <actorRef>"`                    |
| `skipped`      | `result.outcome = "no_op"` with `result.reason`               |

---

## 4. Provenance chain — linking decisions to actions

A complete loop traversal produces a verifiable provenance chain:

```
AlloySignal.id ──► AlloyWorkflow.id ──► AlloyDecision.decisionId ──► ApprovalRequest.id ──► AlloyAction.id ──► AuditChainEvent.eventHash
       │                  │                       │                          │                    │                       │
       └─ signalIds[] ◄──┼───────────────────────┘                          │                    │                       │
                          │                                                  │                    │                       │
                          └─ workflowId ◄──┬─────────────────────────────────┴─ resourceId        │                       │
                                            └──────────────────────────────────────────── workflowId                       │
                                                                                                                            │
                                                                  every transition writes ─────────────────────────────────┘
```

**Verifiability:** Given any `AlloyAction.id`, an analyst can:
1. Look up the action row, read `result.decisionId` and `result.approvalId`.
2. Look up the `AlloyDecision` row by `decisionId`, read `evidenceRefs[]` and `signalIds[]`.
3. Look up the `ApprovalRequest` row, read `approvedById`, `approvedAt`, and walk `approvalAuditTrail` for the full review history.
4. Look up the source signals by `signalIds[]`, read their `rawPayload`, `source`, and `createdAt`.
5. Walk `alloyAuditLog` filtered by `entityType IN ('signal','workflow','approval','action','artifact')` and `entityId` in the chain to retrieve the per-entity audit history. For loop transitions that have been mirrored to the hash-chained ledger, also walk `auditChainEvents` for tamper-evident proof. Note: per-entity coverage is comprehensive in `alloyAuditLog`; hash-chain mirroring is currently selective and is a [Target contract] hardening target — see `operating-loop-spec.md` §3.6.
6. Run `GET /audit-chain/verify` to confirm the chain is intact.

This is the structural commitment behind "every decision is provable, every action is attributable, every outcome is traceable."

---

## 5. Receipt retention and immutability

| Receipt type            | Storage                                | Retention             | Mutability                                  |
|-------------------------|----------------------------------------|-----------------------|---------------------------------------------|
| Decision receipt        | `alloy_ai_decisions`                   | Indefinite             | Status field updates only; payload immutable|
| Decision audit          | `alloy_ai_audit_log`                   | Indefinite             | Append-only                                 |
| Action receipt          | `alloyActions.result` (jsonb)          | Indefinite             | Set once on completion; immutable thereafter|
| Action audit            | `alloyAuditLog` (entityType=action)    | Indefinite             | Append-only                                 |
| Approval audit          | `approvalAuditTrail`                   | Indefinite             | Append-only                                 |
| Hash-chained audit      | `auditChainEvents`                     | Indefinite             | Append-only; SHA-256 chained; tamper-detectable |
| AI provenance proof     | `proofChain`                           | Indefinite             | Append-only                                 |

**[Implemented] Application-layer rule:** No `UPDATE` or `DELETE` route exists against any audit table (`alloyAuditLog`, `approvalAuditTrail`, `auditChainEvents`, `proofChain`, `alloy_ai_audit_log`). Audit rows are insert-only from the application.

**[Target contract] DB-layer rule:** Schema-level role separation should restrict application DB roles to INSERT-only on audit tables. This is a hardening target; today the protection is enforced at the route layer.

---

## 6. Receipt presentation requirements (operator UX)

This document does not specify operator UX, but the receipts must be presentable to non-technical operators. Minimum requirements for any UI rendering a receipt:

- Decision receipt MUST display: `recommendedAction`, `rationaleSummary`, `confidence` (as %), `riskLevel`, `evidenceRefs[]` (clickable links), `modelRoute`, `approvedBy` if applicable, `approvedAt` if applicable.
- Action receipt MUST display: `outcome`, `durationMs`, `actorAttribution`, `sideEffects[]` (human-readable summaries), `externalRefs[]`.
- Hash chain link MUST display: the `eventHash` (truncated to first 16 chars + ellipsis), with hover/click revealing the full hash and a "verify chain" action.

The operator differentiation task specifies the visual layout; this spec specifies the data contract.

---

## 7. Compatibility

All field names, types, and constraints in this spec correspond to columns and Zod schemas that already exist in production. No schema changes required.
