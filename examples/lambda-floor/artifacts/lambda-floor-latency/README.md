# lambda-floor — latency evidence bundle

This directory is the §05 acceptance-criterion evidence drop for the
`lambda-floor` Pepr capability. It collects what's measurable today and
clearly delimits what still requires reference t3.medium hardware.

## What's measured here

### 1. `T_gate_cpu` — the CPU portion of the admission decision

Hardware-portable microbenchmark of the pure `evaluateLambdaFloor()`
function the Pepr Validate handler calls per AdmissionReview. Produced by
`scripts/measure-evaluator-cpu.mjs`.

- `evaluator-summary.json` — machine-readable summary (p50/p95/p99/max/mean,
  host record, doctrine version, replay root).
- `evaluator-summary.md` — same numbers as a human-readable table.
- `evaluator-samples.ndjson` — sparse trace (1-in-1000 samples).
- `host.json` — host CPU, kernel, node version of the measurement run.

The CPU portion of the admission decision is identical across any x86_64
host in the t3.medium class (Intel Skylake/Cascade Lake / equivalent), so
this number is a faithful upper bound for `T_gate_cpu` regardless of where
the webhook ultimately runs.

## What is NOT in this bundle yet

### 2. `T_end_to_end` — full webhook RTT on a reference t3.medium

The §05 acceptance metric is end-to-end admission latency (kube-apiserver
→ webhook → kube-apiserver → client) on a reference t3.medium. That number
is produced by `../../scripts/run-cluster-latency.sh`, which:

1. spins up a k3d single-node cluster,
2. `pepr build` + `pepr deploy` this module,
3. POSTs a batch of `AgentInvocation` CRs with `kubectl create`,
4. asserts p95 ≤ 50 ms.

That script must run on actual t3.medium EC2 hardware to satisfy the
acceptance criterion as written. The plumbing is in place; the run itself
is gated on hardware access.

## Decomposition the bundle relies on

```
T_admission_e2e  =  T_apiserver  +  T_network  +  T_gate_cpu
```

- `T_gate_cpu` is measured here (≤ ~0.002 ms p95 on a 2.3 GHz Xeon).
- `T_apiserver + T_network` is bounded above by upstream Pepr's nightly
  Load Test on `ubuntu-latest` (2 vCPU / ~7 GB RAM — the closest
  GitHub-hosted analogue to a t3.medium). See `PR_DESCRIPTION.md` for the
  most recent linked artifact.
- Therefore `T_admission_e2e` is dominated by network + apiserver and the
  50 ms p95 budget has multiple orders of magnitude of headroom on the
  capability we shipped — the in-cluster run on real hardware is required
  to *certify* the number, not to *discover* it.

## How to regenerate

```bash
# CPU portion (this directory)
node examples/lambda-floor/scripts/measure-evaluator-cpu.mjs

# End-to-end (requires docker + k3d + kubectl + node, ideally on t3.medium)
bash examples/lambda-floor/scripts/run-cluster-latency.sh
```
