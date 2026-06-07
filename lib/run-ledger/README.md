# Run Ledger

**Version:** 1.0  
**Date:** April 25, 2026  
**Owner:** Platform Engineering  
**Zone:** Eval/Training (append-only; read access from compliance and ops)

---

## Purpose

The Run Ledger is the append-only audit log for every evaluation run and batch job executed in the SZL Holdings platform. It provides:

- **Traceability** — every eval run is recorded with inputs, outputs, and scores
- **Rollback evidence** — when a prompt or model is rolled back, the ledger records why
- **Cost attribution** — every run records token cost and wall-clock time
- **Version provenance** — links prompt version → model version → eval suite version → score

The Run Ledger is **append-only**. Records cannot be modified or deleted. It operates in the eval/training zone and is never written to by the production inference path.

---

## Record Schema

```typescript
interface RunLedgerEntry {
  run_id: string;                   // UUID v4
  run_type: "eval" | "benchmark" | "regression" | "promotion-gate" | "rollback";
  status: "running" | "completed" | "failed" | "cancelled";

  subject: {
    type: "prompt" | "model" | "eval-suite";
    id: string;
    version: string;
  };

  suite: {
    id: string;
    version: string;
  };

  model_used: {
    id: string;
    version: string;
    provider: string;
  };

  environment: "eval" | "staging";  // never "production"
  run_mode: "eval";                  // always "eval" — enforced

  scores: {
    overall: number;                 // 0–1
    correctness: number;
    hallucination_resistance: number;
    policy_adherence: number;
    latency_p95_ms: number;
    evidence_completeness: number;
  };

  cost: {
    input_tokens: number;
    output_tokens: number;
    estimated_usd: number;
  };

  artifacts: {
    scores_path: string;             // relative path in generated/arena-results/
    traces_path: string;
    summary_path: string;
  };

  outcome: "promoted" | "blocked" | "flagged" | "informational" | "rollback-trigger" | null;
  outcome_notes: string;

  triggered_by: "schedule" | "pr" | "manual" | "rollback-event";
  operator: string;                  // user or "system"

  started_at: string;                // ISO 8601
  completed_at: string;
  duration_ms: number;
}
```

---

## Recent Run History (Last 14 Days)

| Run ID | Type | Subject | Version | Score | Outcome | Date |
|--------|------|---------|---------|-------|---------|------|
| `run-001-2026-04-23` | eval | core-policy-suite | 2.0.0 | 0.960 | informational | 2026-04-23 |
| `run-002-2026-04-23` | promotion-gate | policy-gate-evaluator | 1.0.0 | 0.970 | promoted | 2026-04-23 |
| `run-003-2026-04-22` | eval | lyte-decision-suite | 3.1.0 | 0.920 | informational | 2026-04-22 |
| `run-004-2026-04-22` | promotion-gate | signal-fusion | 3.0.0 | 0.930 | promoted | 2026-04-22 |
| `run-005-2026-04-21` | eval | aegis-triage-suite | 1.5.0 | 0.915 | informational | 2026-04-21 |
| `run-006-2026-04-21` | regression | security-incident-triage | 1.2.0 | 0.940 | informational | 2026-04-21 |
| `run-007-2026-04-20` | eval | maritime-core-suite | 2.0.0 | 0.905 | informational | 2026-04-20 |
| `run-008-2026-04-24` | eval | hallucination-regression | 1.0.0 | 0.780 | flagged | 2026-04-24 |

**Note:** `run-008` flagged `hallucination-detector@0.9.0` as `rollback-candidate`. Rollback evaluation in progress.

---

## Retention Policy

| Record Age | Retention Action |
|-----------|-----------------|
| 0–90 days | Full record, hot storage |
| 91–365 days | Full record, warm storage |
| 1–3 years | Aggregated scores only; trace artifacts compressed |
| > 3 years | Compliance archive only (legal hold override available) |

Retention is enforced by a scheduled audit retention job (planned for `ops/scripts/audit-retention.ts`; policy is active, automated enforcement is a Phase 8 CI item). Records under legal hold are exempt from compression or deletion.

---

## Cost Tracking

Monthly eval cost is tracked per suite and per lane:

| Lane | April 2026 Eval Cost (USD) | Budget Cap |
|------|--------------------------|-----------|
| core | $12.40 | $25 |
| lyte | $8.20 | $20 |
| aegis | $9.80 | $20 |
| vessels | $7.60 | $20 |
| terra | $6.10 | $15 |
| counsel | $4.30 | $15 |
| **Total** | **$48.40** | **$115** |

Alerts fire at 80% of each cap. At 100%, the eval runner pauses new runs and notifies Platform Engineering.

---

## Access Control

| Role | Read | Query | Append (system only) | Export |
|------|------|-------|---------------------|-------|
| `platform-engineer` | ✓ | ✓ | system | ✓ |
| `compliance` | ✓ | ✓ | — | ✓ |
| `ops` | ✓ | ✓ | — | — |
| `exec` | summary only | — | — | — |

No human role can append, modify, or delete records. Only the eval-os runner (service identity) appends records.
