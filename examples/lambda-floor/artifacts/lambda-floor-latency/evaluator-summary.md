# lambda-floor — CPU-portion microbenchmark (T_gate_cpu)

> **Scope.** This measures only the pure `evaluateLambdaFloor()` function
> that the Pepr Validate handler calls per AdmissionReview. It does **not**
> include kube-apiserver request handling or the webhook network RTT. For
> the full §05 end-to-end p95, run `scripts/run-cluster-latency.sh` on a
> reference t3.medium (see `PR_DESCRIPTION.md` row 4).

| metric | value |
| --- | --- |
| samples | 100,000 (warmup: 5,000) |
| p50 | 0.000462 ms |
| **p95** | **0.00096 ms** |
| p99 | 0.001352 ms |
| max | 1.2241 ms |
| mean | 0.000833 ms |
| host CPU | INTEL(R) XEON(R) PLATINUM 8581C CPU @ 2.30GHz @ 2300 MHz |
| host arch | x64 / linux 6.17.5 |
| node | v24.13.0 |
| doctrine | V6 (replay-root 1ed4d253e876…) |
| collected | 2026-05-25T04:17:09.275Z |

Raw samples: `evaluator-samples.ndjson` (1-in-1000 trace).
Host record: `host.json`.
