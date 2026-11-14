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

The default package suite is offline. It does not import the local CPU backend
or attempt to fetch ONNX model weights:

```bash
pnpm --filter @workspace/aef-evals vitest run
```

Real-vector evaluation is a separate, explicit operation. It may download the
immutable model revision through the vector worker and fails if that model is
unavailable; it never attempts a download and then converts the failure into a
successful skip:

```bash
AEF_EVALS_REQUIRE_REAL=1 pnpm --filter @workspace/aef-evals exec vitest run src/eval-real-vectors.test.ts
```
