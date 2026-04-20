# @workspace/aef-evals

Evaluation harness for the Alloy Embedding Fabric. Measures retrieval quality against golden fixture sets using standard IR metrics.

## Metrics

| Metric | Function |
|---|---|
| nDCG@k | `computeNdcgAtK(retrieved, relevant, k)` |
| Recall@k | `computeRecallAtK(retrieved, relevant, k)` |
| Precision@k | `computePrecisionAtK(retrieved, relevant, k)` |
| MRR | `computeMrr(retrieved, relevant)` |
| Latency (p50/p95/p99) | `computeLatencyPercentiles(latenciesMs)` |

## Fixture Sets

Six golden fixture sets are included — one per SZL Holdings vertical:

- `maritimeFixtures` — `vessels_maritime_risk`
- `legalFixtures` — `prism_legal_matter`
- `realEstateFixtures` — `terra_real_estate_intel`
- `cyberFixtures` — `aegis_security_incident`
- `complianceFixtures` — `lyte_governance_ops`
- `advisoryFixtures` — `carlota_private_advisory`

## Usage

```typescript
import { runEval, maritimeFixtures, printEvalResult } from "@workspace/aef-evals";

const result = await runEval(maritimeFixtures, myRetrievalAdapter, {
  topK: 10,
  metrics: ["ndcg", "recall", "precision", "mrr"],
});

printEvalResult(result);
```

## Running

```bash
pnpm --filter @workspace/aef-evals vitest run
```
