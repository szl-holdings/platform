#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# In-cluster Pepr admission-latency harness for the `lambda-floor` capability.
#
# What this does (in order):
#   1. Stand up an ephemeral k3d cluster (single-node, 1 server).
#   2. Apply the AgentInvocation CRD.
#   3. Build the Pepr module (`pepr build`) and deploy the generated
#      webhook manifests (`pepr deploy`) so the admission webhook is wired
#      to the kube-apiserver — exactly the path real users get.
#   4. Wait for the webhook deployment to be Ready.
#   5. Run scripts/measure-admission-latency.mjs, which POSTs a batch of
#      AgentInvocation CRs and records the full kube-apiserver round-trip
#      time per request (this includes the webhook RTT — that is the §05
#      "end-to-end" budget).
#   6. Assert p95 ≤ 50 ms. Save the raw samples + summary as a CI artifact
#      under $ARTIFACT_DIR/lambda-floor-latency/.
#   7. Tear the cluster down (always, even on failure).
#
# Env knobs (all optional):
#   SAMPLES             default 200    number of AgentInvocation CRs to apply
#   P95_BUDGET_MS       default 50     hard ceiling for p95 latency
#   CLUSTER_NAME        default lambda-floor-bench
#   ARTIFACT_DIR        default ./artifacts   where to drop the CI artifact
#   KEEP_CLUSTER        default ""     if non-empty, skip teardown
#
# Local prerequisites: docker, k3d, kubectl, node ≥ 20, npx (for `pepr`).
# CI prerequisites: see .github/workflows/lambda-floor-cluster.yml.
# ---------------------------------------------------------------------------
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(cd "$HERE/.." && pwd)"
SAMPLES="${SAMPLES:-200}"
P95_BUDGET_MS="${P95_BUDGET_MS:-50}"
CLUSTER_NAME="${CLUSTER_NAME:-lambda-floor-bench}"
ARTIFACT_DIR="${ARTIFACT_DIR:-$MODULE_DIR/artifacts}"
OUT_DIR="$ARTIFACT_DIR/lambda-floor-latency"
mkdir -p "$OUT_DIR"

log() { printf '[lambda-floor-bench] %s\n' "$*" >&2; }

require() {
  for bin in "$@"; do
    command -v "$bin" >/dev/null 2>&1 || {
      echo "missing required tool: $bin" >&2
      exit 2
    }
  done
}
require docker k3d kubectl node npx

cleanup() {
  local rc=$?
  if [[ -z "${KEEP_CLUSTER:-}" ]]; then
    log "tearing down k3d cluster $CLUSTER_NAME"
    k3d cluster delete "$CLUSTER_NAME" >/dev/null 2>&1 || true
  else
    log "KEEP_CLUSTER set — leaving $CLUSTER_NAME running"
  fi
  exit "$rc"
}
trap cleanup EXIT

log "creating k3d cluster $CLUSTER_NAME"
k3d cluster create "$CLUSTER_NAME" \
  --servers 1 --agents 0 \
  --no-lb \
  --k3s-arg "--disable=traefik@server:0" \
  --wait

log "applying AgentInvocation CRD"
kubectl apply -f "$MODULE_DIR/crd/agent-invocation.yaml"
kubectl wait --for=condition=Established \
  crd/agentinvocations.doctrine.szl.io --timeout=60s

log "building Pepr module"
( cd "$MODULE_DIR" && npx --yes pepr build )

log "deploying Pepr module to cluster"
( cd "$MODULE_DIR" && npx --yes pepr deploy --confirm )

log "waiting for pepr admission webhook to be Ready"
kubectl -n pepr-system wait \
  --for=condition=Available deploy -l pepr.dev/controller=admission \
  --timeout=180s

log "running latency measurement (SAMPLES=$SAMPLES, P95_BUDGET_MS=$P95_BUDGET_MS)"
SAMPLES="$SAMPLES" \
P95_BUDGET_MS="$P95_BUDGET_MS" \
OUT_DIR="$OUT_DIR" \
  node "$HERE/measure-admission-latency.mjs"

log "samples + summary written to $OUT_DIR"
ls -la "$OUT_DIR" >&2
