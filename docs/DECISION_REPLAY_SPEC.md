# SZL Holdings — Decision Replay Specification

## Purpose

Decision Replay enables any consequential decision to be fully reconstructed from its trace. Auditors, operators, and compliance teams can walk through exactly what triggered a recommendation, what data was used, what model participated, what policy gates applied, who approved, and what happened after execution.

## Implementation

Packages: `packages/replay-core`, `packages/trace-graph`

## Replay Anatomy

A complete replay contains:

### 1. Trigger Context
- What signal initiated the decision
- Signal source, value, and threshold
- Domain of origin
- Timestamp

### 2. Data Context
- What data/entities were queried
- Query parameters and result summaries
- Data freshness (staleness indicators)
- Source system references

### 3. Model/Tool Context
- Which AI models were invoked
- Input prompts (sanitized)
- Output responses
- Confidence scores
- Token consumption
- Latency

### 4. Policy Context
- Which policies were evaluated
- Policy results (permit/deny/escalate)
- Risk tier determination
- Required approval level

### 5. Approval Context
- Who was asked to approve
- Approval request timestamp
- Approval/rejection decision
- Rationale provided
- Escalation chain (if applicable)

### 6. Execution Context
- What action was taken
- Execution timestamp
- Side effects (API calls, DB writes, notifications)
- Success/failure status

### 7. Verification Context
- Post-execution verification results
- Expected vs. actual state comparison
- Anomaly flags

### 8. Outcome Context
- Measured business outcome
- Predicted vs. actual deviation
- Outcome classification (positive/negative/neutral)

## Replay Interface

```typescript
interface DecisionReplay {
  decision_id: string;
  domain: string;
  started_at: string;
  completed_at: string;
  status: "completed" | "in_progress" | "failed" | "rolled_back";
  steps: ReplayStep[];
  proof_chain_hash: string;
  integrity_verified: boolean;
}

interface ReplayStep {
  sequence: number;
  type: "signal" | "analysis" | "recommendation" | "simulation" | "policy" | "approval" | "execution" | "verification" | "outcome";
  timestamp: string;
  actor: ActorIdentity;
  input_summary: string;
  output_summary: string;
  evidence_refs: string[];
  duration_ms: number;
  children?: ReplayStep[];
}
```

## Integrity

Each replay is verified against the Proof Chain:
- Every replay step must have a corresponding proof chain entry
- Proof chain hashes must form an unbroken chain
- Replay hash must match the proof chain's cumulative hash

## UI Surfaces

- **Decision Theater** (Command portal): Visual timeline walkthrough of the full replay
- **Trace Graph viewer**: Interactive graph showing step relationships and cascades
- **Audit export**: Downloadable replay report for compliance review
