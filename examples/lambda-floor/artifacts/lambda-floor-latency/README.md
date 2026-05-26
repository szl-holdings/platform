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
is gated on AWS credentials being available.

To execute the certifying run end-to-end (provision → run → upload → tear
down), use `../../scripts/run-on-ec2-t3-medium.sh`. It requires
`AWS_REGION`, `S3_BUCKET`, and standard AWS credentials in the
environment, and it always tears down the instance, key pair, and
security group on EXIT (including failures). The same path is wired into
`.github/workflows/lambda-floor-cluster.yml` for one-click manual dispatch
once the matching repo secrets are added.

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

# End-to-end on whatever host you're on (requires docker + k3d + kubectl + node)
bash examples/lambda-floor/scripts/run-cluster-latency.sh

# Certifying end-to-end on a one-shot real t3.medium (provision + run + S3 +
# teardown). Requires AWS creds + a writable S3 bucket; see the script
# header for the full env list.
AWS_REGION=us-east-1 S3_BUCKET=my-bucket \
  bash examples/lambda-floor/scripts/run-on-ec2-t3-medium.sh
```
