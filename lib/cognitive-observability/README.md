# Cognitive Observability

**Version:** 1.0  
**Date:** April 25, 2026  
**Owner:** Platform Engineering  
**Zone:** Eval/Training (trace capture); Inference (read-only metrics export)

---

## Purpose

Cognitive Observability captures the reasoning traces, confidence trajectories, and decision chains produced by AI agents during evaluation runs. It provides the data needed to:

- Detect reasoning drift between model versions
- Identify prompts that produce inconsistent or brittle reasoning
- Surface evidence-gap patterns (agent claims without grounded evidence)
- Track confidence calibration over time

**In eval runs:** Full trace capture (inputs, chain-of-thought, tool calls, outputs, scores)  
**In production:** Aggregated metrics only (confidence distribution, latency, error rate) — no raw traces stored in production to protect data privacy

---

## Trace Schema

```typescript
interface CognitiveTrace {
  trace_id: string;
  run_id: string;           // links to run-ledger
  prompt_id: string;
  prompt_version: string;
  model_id: string;
  scenario_id: string;

  reasoning_chain: {
    step: number;
    type: "observation" | "hypothesis" | "tool-call" | "synthesis" | "conclusion";
    content: string;
    confidence: number;       // 0–1 at this step
    evidence_refs: string[];  // cited evidence IDs
    duration_ms: number;
  }[];

  final_confidence: number;
  evidence_completeness: number;
  hallucination_flags: string[];  // specific claims flagged as ungrounded
  policy_checks: {
    check_id: string;
    passed: boolean;
    reason: string;
  }[];

  input_tokens: number;
  output_tokens: number;
  duration_ms: number;
  captured_at: string;          // ISO 8601
}
```

---

## Key Metrics

### Confidence Calibration

Tracks whether model confidence scores correlate with actual correctness. A well-calibrated model that says "0.9 confident" should be correct ~90% of the time.

| Lane | Calibration Score (April 2026) | Status |
|------|-------------------------------|--------|
| lyte | 0.88 | Calibrated |
| aegis | 0.91 | Calibrated |
| vessels | 0.84 | Acceptable |
| terra | 0.82 | Acceptable |
| counsel | 0.86 | Calibrated |

### Reasoning Drift

Measures change in reasoning chain structure between prompt versions. High drift (> 0.3) flags a version for additional human review before promotion.

### Evidence Gap Rate

Percentage of conclusions in a trace that lack grounded evidence references. Target: < 5%.

| Lane | Evidence Gap Rate (April 2026) |
|------|-------------------------------|
| core | 2.1% |
| aegis | 3.4% |
| lyte | 2.8% |
| vessels | 4.2% |
| counsel | 1.9% |

---

## Access

Cognitive traces are stored in `generated/arena-results/<run-id>/traces/` and are:
- Available to `platform-engineer` and `compliance` roles
- Compressed after 90 days
- Never exposed in production API responses
- Subject to the same retention policy as Run Ledger entries
