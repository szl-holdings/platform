# Substrate Replay & Counterfactual

## Replay Modes

| Mode | Description |
|---|---|
| `live` | Real execution, real adapters, real side effects |
| `dry-run` | Executes the graph, skips side effects, simulates ApprovalGate |
| `replay` | Re-runs a past run from journal; unchanged stages skip execution |
| `counterfactual` | Replay with model/policy substitution; produces decision diff |

## Replay CLI

```bash
# Standard replay (re-run from journal)
substrate replay <runId>

# Counterfactual: substitute model
substrate replay <runId> --counterfactual --model=claude-opus

# Counterfactual: substitute policy
substrate replay <runId> --counterfactual --policy=strict-v2

# Counterfactual: substitute both
substrate replay <runId> --counterfactual --model=gpt-4o --policy=strict-v2
```

## Typed API Endpoint

```typescript
import { handleReplayRequest } from "@szl/substrate/cli/replay";

// POST /substrate/replay
const response = await handleReplayRequest({
  runId: "abc-123",
  counterfactual: true,
  model: "claude-opus",
  workflow: myWorkflow,
});
// → { sourceRunId, replayRunId, diff, stableHashes, mismatchedStages }
```

## Counterfactual Diff Output

```
══════════════════════════════════════════════════════════════════════
COUNTERFACTUAL DIFF
Baseline:        run-abc-123
Counterfactual:  run-def-456
Model Swap:      claude-opus
Generated:       2026-04-19T12:00:00Z
──────────────────────────────────────────────────────────────────────
  [Retrieve] retrieve-lyte-data
    baseline:       status=completed conf=87.0%
    counterfactual: status=completed conf=87.0%
~ [Reason] reason-anomalies
    baseline:       status=completed conf=78.0%
    counterfactual: status=completed conf=84.2%
⚡ [Decide] decide-remediation
    baseline:       status=pending-approval conf=62.0%
    counterfactual: status=completed conf=81.5%
──────────────────────────────────────────────────────────────────────
Final Confidence Delta: +6.2%
Outcome Changed:        YES ⚡
══════════════════════════════════════════════════════════════════════
```

Legend:
- ` ` (space) — no significant difference
- `~` — differs (confidence delta > 5%)
- `⚡` — decision outcome changed

## Eval Console Integration

The `handleReplayRequest` function is the typed API endpoint that the Eval Console (Task #1173) will call. It returns `ReplayEndpointResponse` with the full `CounterfactualDiff` for side-by-side comparison.

When the Eval Console lands, it will:
1. Call `POST /api/substrate/replay` with the run ID and substitutions
2. Receive the `CounterfactualDiff` JSON
3. Render the side-by-side comparison in the console UI
