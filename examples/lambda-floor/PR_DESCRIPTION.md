# Draft PR — `defenseunicorns/pepr`

**Branch:** `szl/examples-lambda-floor`
**Base:** `main`
**Type:** `feat(examples)`

---

**title:** `feat(examples): lambda-floor Pepr capability (9-axis Λ admission gate)`

This PR adds a new example Pepr capability `lambda-floor` that gates
admission of `AgentInvocation` CRs on a 9-axis conjunctive Λ-floor
(`Λ_conj ≥ 0.90`, `moralGrounding ≥ 0.95`, `measurabilityHonesty ≥ 0.95`).
On any axis failure, the capability denies the request with reason
`MATURITY_GATE_BLOCKED`, mirroring the existing SZL Sentra pattern.

The gate evaluator is ported from SZL Holdings' a11oy runtime (production
since 2025-Q4) and is accompanied by the existing SZL OPA gateway test
pack as a cross-implementation proof-of-work, ported to Pepr's in-cluster
test runner.

Refs: SZL field gap **C4** (see SZL Holdings' Defense Unicorns proposal
§02 / §05).

## What's in the PR

- `examples/lambda-floor/package.json` — Pepr module manifest, Apache-2.0.
- `examples/lambda-floor/capabilities/lambda-floor.ts` — the capability.
- `examples/lambda-floor/crd/agent-invocation.yaml` — `AgentInvocation` CRD.
- `examples/lambda-floor/payload/lambda-floor-payload.json` — build-time
  slice of `packages/payload/raw/payload.json` → `doctrine`.
- `examples/lambda-floor/tests/lambda-floor.test.ts` — admission
  truth-table (pure evaluator).
- `examples/lambda-floor/tests/lambda-floor-opa-parity.test.ts` — SZL
  OPA Rego truth-table ported row-for-row against the same pure
  `decideAdmission` function the registered Pepr `Validate` handler
  invokes.
- `examples/lambda-floor/tests/lambda-floor-webhook-fixture.test.ts` —
  AdmissionReview-shape fixtures matching what kube-apiserver POSTs at
  the webhook; asserts the exact approve / deny / message responses.
- `examples/lambda-floor/README.md` — worked deny example.

## Acceptance criteria → evidence

| # | Criterion | Evidence |
| - | --------- | -------- |
| 1 | All-axes-pass admits | `tests/lambda-floor.test.ts` → "admits when all axes meet their floors" |
| 2 | Any axis fail → `MATURITY_GATE_BLOCKED` w/ axis name + value | `capabilities/lambda-floor.ts` `request.Deny(...)` + `tests/lambda-floor.test.ts` per-axis rows |
| 3 | SZL OPA pack ported as proof-of-work | `tests/lambda-floor-opa-parity.test.ts` (Rego truth-table parity) + `tests/lambda-floor-webhook-fixture.test.ts` (on-wire request shape) |
| 4 | p95 admission latency ≤ 50 ms on reference t3.medium | Measured end-to-end (incl. webhook RTT) by `scripts/run-cluster-latency.sh` (invoked via `pnpm run test:cluster`). The script stands up k3d, deploys this module with `pepr deploy`, applies a batch of `AgentInvocation` CRs, and asserts p95 ≤ 50 ms. CI: `.github/workflows/lambda-floor-cluster.yml` uploads the `lambda-floor-latency` artifact (raw `samples.ndjson` + `summary.json`/`summary.md`).<br><br>**Interim evidence pending reference-hardware run:**<br>• CPU-portion microbenchmark of the gate evaluator itself (hardware-portable): **p95 ≈ 0.001 ms / p99 ≈ 0.001 ms / max ≈ 1.2 ms** over 100,000 samples on x86_64 Xeon @ 2.3 GHz — see `artifacts/lambda-floor-latency/evaluator-summary.md` in this PR. The gate adds ≪ 1 ms to the admission path; the 50 ms budget is dominated by apiserver + webhook RTT, not by our code.<br>• Third-party network/apiserver headroom evidence — upstream `defenseunicorns/pepr` nightly Load Test on `ubuntu-latest` (2 vCPU, the closest GitHub-hosted analogue to a t3.medium) sustained **82,536 ConfigMap injects** in a single watcher run with watcher CPU ≤ 236 m: [`defenseunicorns/pepr` Actions run #26353858318 (2026-05-24)](https://github.com/defenseunicorns/pepr/actions/runs/26353858318).<br><br>**Linked run (reference t3.medium, end-to-end):** The certifying run is produced by `scripts/run-on-ec2-t3-medium.sh`, which provisions a one-shot t3.medium, executes `scripts/run-cluster-latency.sh` on it, uploads `samples.ndjson` + `summary.json` + `summary.md` to S3, and tears the instance + key pair + security group back down (always — trap on EXIT). The same path runs unattended in CI via `.github/workflows/lambda-floor-cluster.yml` (manual dispatch; requires repo secrets `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `LAMBDA_FLOOR_S3_BUCKET`). _Paste the S3 `summary.md` URL printed by either path here before merging._ |
| 5 | No new runtime deps outside Pepr SDK + `@noble/curves` (MIT) | `package.json` `dependencies` |

## License

Apache-2.0. On the SZL Doctrine V6 license allowlist
(`Apache-2.0`, `MIT`, `BSD-3-Clause`, `CC-BY-4.0`).

## Out of scope

- Plane 3 proof-ledger sidecar — emitted-to interface only (single-line
  JSON on stdout, `kind: "lambda-floor-audit"`).
- Helm/UDS-bundle packaging — this is an `examples/` capability;
  production packaging is a follow-on PR.
