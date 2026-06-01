# SLO — rosie

> Doctrine v11 LOCKED · declarations 749 / axioms 14 / sorries 163 · locked_at `c7c0ba17`
> Source of truth: `https://szlholdings-rosie.hf.space/healthz`

## Service Level Objectives

| Objective | Target |
|---|---|
| Availability (monthly) | **99.5%** |
| p99 `/healthz` latency | **≤ 500 ms** |
| p99 `/khipu/sign` latency | **≤ 800 ms** |
| Signed-receipt success rate | **≥ 99.9%** |
| Wire-D verification success | **100%** |
| Error budget | **3.6 h / month** |

## Error budget math

- Availability target 99.5% over a 30-day (43,200 min) window.
- Allowed downtime = 0.5% × 43,200 min = **216 min = 3.6 h/month**.
- Budget is consumed by: hard 5xx on `/healthz`, failed Wire-D verification,
  signed-receipt failures, or `/khipu/sign` p99 breaches sustained > 5 min.

## Measurement

- **Availability**: blackbox probe of `/healthz` every 60 s (status Space + hourly snapshot job).
- **Latency**: p99 over rolling 1 h from the OTel collector (`/v1/metrics`) and probe `time_total`.
- **Signed-receipt success**: ratio of `200` responses with a valid DSSE envelope on `/khipu/sign`.
- **Wire-D verification**: every signed receipt re-verified against the published cosign pub key; any
  failure is a 100%-target breach and pages immediately.

## Baseline (measured 2026-06-01, UTC)

- `/healthz` HTTP `200`, observed total latency ≈ **316 ms** (well within 500 ms p99 target).
- Doctrine numbers verified verbatim in `/healthz` body: declarations 749 / axioms 14 / sorries 163.

## Alerting

| Condition | Severity | Action |
|---|---|---|
| `/healthz` 5xx or unreachable | RED | Page on-call; consume error budget |
| Doctrine numbers != 749/14/163 | RED | Page on-call (doctrine drift) |
| p99 `/healthz` > 500 ms for 5 min | AMBER | Investigate; track budget |
| p99 `/khipu/sign` > 800 ms for 5 min | AMBER | Investigate signer path |
| Signed-receipt success < 99.9% (1 h) | RED | Page; halt releases |
| Wire-D verification < 100% | RED | Page immediately; freeze |

## Rollback

On sustained RED, follow `platform/docs/runbooks/rollback.md` and run
`platform/scripts/rollback_flagship.sh rosie <previous-sha>`.
