# AEEP Evidence Model

## Principle

Every material AI result carries a **ProofEnvelope** — a structured, immutable record
of why the result appeared, what sources backed it, what policy ran, and what decision was made.

This is not an audit log. This is the primary data model. The UI renders evidence by default.

---

## ProofEnvelope Schema

```typescript
ProofEnvelope {
  traceId: string            // Unique per run step — format: aeep_<role>_<ts>_<seq>
  sessionId?: string
  workflowRunId?: string
  stepId?: string
  agentRole?: AgentRoleId

  sources: SourceCitation[]  // All retrieval citations used
  toolCalls: ToolCallRecord[] // All tools called during the step

  confidence: ConfidenceLevel   // high | medium | low | contradiction
  freshness: FreshnessLevel     // fresh | aging | stale | unknown

  policyVerdict?: PolicyVerdict  // allowed | requires-approval | blocked | override
  policyReason?: string
  approvalId?: string           // Set when human approval was required

  generatedAt: string
}
```

---

## SourceCitation Schema

```typescript
SourceCitation {
  sourceId: string
  sourceUri?: string
  chunkId?: string
  title?: string
  score: number              // 0–1 retrieval score
  profileVersion?: string
  retrievalPath?: string     // e.g. "hybrid → rrf → cross-encoder"
  retrievedAt: string
}
```

---

## LedgerEntry Schema

```typescript
LedgerEntry {
  entryId: string            // le_<ts>_<seq>
  traceId: string
  entityType: string         // "workflow_run" | "search" | "memory" | ...
  entityId: string
  action: string
  actor?: string
  actorRole?: AgentRoleId
  envelope: ProofEnvelope
  immutable: true            // Frozen — mutation throws
  timestamp: string
}
```

---

## Confidence Scoring Rules

| Level | Condition |
|---|---|
| `high` | All sources score ≥ 0.85, no contradictions, fresh |
| `medium` | Mixed scores, or one source aging/stale, or some gaps |
| `low` | Primary sources score < 0.65, or stale, or incomplete |
| `contradiction` | Sources present conflicting factual claims |

---

## Freshness TTL Defaults

| Level | Age |
|---|---|
| `fresh` | Retrieved within 4 hours |
| `aging` | 4–24 hours old |
| `stale` | > 24 hours old |
| `unknown` | No retrieval timestamp available |

---

## EvidencePackage

Compiled output of multiple LedgerEntries:

```typescript
EvidencePackage {
  packageId: string
  title?: string
  entries: LedgerEntry[]
  overallConfidence: ConfidenceLevel  // Worst-case across entries
  overallFreshness: FreshnessLevel    // Worst-case across entries
  generatedAt: string
  generatedBy?: string
  workflowRunId?: string
}
```

`overallConfidence` uses conservative fusion: if any entry is `contradiction`, package is `contradiction`.
`overallFreshness`: if any entry is `stale`, package is `stale`.

---

## UI Surface Rules

Every screen that renders an AI result **must** surface:
1. `EvidencePanel` or equivalent — showing traceId, sources, policy verdict
2. Confidence badge — via `StatusBadge` with `success | warning | error` variant
3. Freshness indicator — via `StatusBadge` or inline indicator
4. Policy verdict — `allowed | requires-approval | blocked`

Screens that deliberately omit evidence must have a documented exception.
