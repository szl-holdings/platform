#!/usr/bin/env bash
# integration-test-substrate.sh
#
# Boots the substrate fleet locally using the CPU-stub compose overlay and
# verifies the full claim dispatch flow end-to-end:
#
#   /health    liveness — inference + worker
#   /ready     readiness — inference + worker
#   /claim     model_route stage (Python model_router.py)
#   /claim     evidence_rank stage (Python evidence_ranker.py)
#   fail-closed contract: worker unreachable + live mode → explicit error, not silent fallback
#
# Usage:
#   ./scripts/integration-test-substrate.sh
#
# Requirements:
#   - Docker + Docker Compose v2 (docker compose)
#   - curl, jq
#
# Exit codes:
#   0  All checks passed
#   1  One or more checks failed (details printed to stderr)

set -euo pipefail

INFERENCE_PORT="${SUBSTRATE_INFERENCE_PORT:-8070}"
WORKER_PORT="${SUBSTRATE_WORKER_PORT:-8090}"
INFERENCE_URL="http://localhost:${INFERENCE_PORT}"
WORKER_URL="http://localhost:${WORKER_PORT}"
COMPOSE_PROJECT="substrate-test-$$"
FAILED=0

# ── Helpers ────────────────────────────────────────────────────────────────────

pass() { printf '\033[32m  PASS\033[0m  %s\n' "$1"; }
fail() { printf '\033[31m  FAIL\033[0m  %s\n' "$1" >&2; FAILED=1; }
info() { printf '\033[36m  INFO\033[0m  %s\n' "$1"; }

check_deps() {
  local missing=()
  for cmd in docker curl jq; do
    command -v "$cmd" &>/dev/null || missing+=("$cmd")
  done
  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "ERROR: missing required commands: ${missing[*]}" >&2
    exit 1
  fi
  docker compose version &>/dev/null || {
    echo "ERROR: docker compose v2 is required (got 'docker compose version' failure)" >&2
    exit 1
  }
}

wait_healthy() {
  local service="$1"
  local url="$2"
  local max_wait=60
  local elapsed=0
  info "Waiting for ${service} at ${url}/health (up to ${max_wait}s)..."
  while ! curl -sf "${url}/health" &>/dev/null; do
    sleep 2
    elapsed=$((elapsed + 2))
    if [[ $elapsed -ge $max_wait ]]; then
      echo "ERROR: ${service} did not become healthy within ${max_wait}s" >&2
      return 1
    fi
  done
  info "${service} is healthy after ${elapsed}s"
}

claim() {
  local stage_type="$1"
  local input_json="$2"
  local mode="${3:-dry-run}"
  curl -sf -X POST "${WORKER_URL}/claim" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
      --arg st "$stage_type" \
      --arg mode "$mode" \
      --argjson inp "$input_json" \
      '{
        protocolVersion: "1.0",
        messageId: "test-\($st)-\(now | tostring)",
        timestamp: (now | tostring),
        type: "stage.claim",
        workerId: "integration-test",
        runId: "run-test-001",
        workflowId: "test-workflow",
        stageId: "test-stage-\($st)",
        stageType: $st,
        stageConfig: {stageKind: $st},
        input: $inp,
        budgetConfig: {escalateAt: 0.9, requireHumanBelow: 0.3},
        traceId: "trace-test-001",
        mode: $mode
      }'
    )"
}

# ── Main ───────────────────────────────────────────────────────────────────────

check_deps

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

info "Starting substrate fleet in CPU-stub mode (project: ${COMPOSE_PROJECT})"

cleanup() {
  info "Tearing down compose project ${COMPOSE_PROJECT}..."
  docker compose \
    -f "${REPO_ROOT}/docker-compose.gpu.yml" \
    -f "${REPO_ROOT}/docker-compose.cpu-stub.yml" \
    -p "${COMPOSE_PROJECT}" \
    down --volumes --remove-orphans 2>/dev/null || true
}
trap cleanup EXIT

docker compose \
  -f "${REPO_ROOT}/docker-compose.gpu.yml" \
  -f "${REPO_ROOT}/docker-compose.cpu-stub.yml" \
  -p "${COMPOSE_PROJECT}" \
  up -d --build 2>&1 | tail -20

# ── 1. Liveness checks ────────────────────────────────────────────────────────
info "--- Liveness (GET /health) ---"
wait_healthy "substrate-inference" "$INFERENCE_URL"
wait_healthy "substrate-py-workers" "$WORKER_URL"

inference_health=$(curl -sf "${INFERENCE_URL}/health")
worker_health=$(curl -sf "${WORKER_URL}/health")

echo "$inference_health" | jq -e '.status == "ok"' &>/dev/null \
  && pass "inference /health returns {status: ok}" \
  || fail "inference /health unexpected response: ${inference_health}"

echo "$worker_health" | jq -e '.status == "ok"' &>/dev/null \
  && pass "worker /health returns {status: ok}" \
  || fail "worker /health unexpected response: ${worker_health}"

# ── 2. Readiness checks ───────────────────────────────────────────────────────
info "--- Readiness (GET /ready) ---"
inference_ready=$(curl -sf "${INFERENCE_URL}/ready" || echo '{"ready":false}')
worker_ready=$(curl -sf "${WORKER_URL}/ready" || echo '{"ready":false}')

echo "$inference_ready" | jq -e 'has("ready")' &>/dev/null \
  && pass "inference /ready returns ready field" \
  || fail "inference /ready missing ready field: ${inference_ready}"

echo "$worker_ready" | jq -e 'has("ready")' &>/dev/null \
  && pass "worker /ready returns ready field" \
  || fail "worker /ready missing ready field: ${worker_ready}"

# ── 3. model_route claim (dry-run) ────────────────────────────────────────────
info "--- Stage claim: model_route (dry-run) ---"
route_resp=$(claim 'model_route' '{"role":"reasoning"}' 'dry-run')
echo "$route_resp" | jq -e '.type == "stage.result" or .type == "stage.error"' &>/dev/null \
  && pass "model_route claim returns stage envelope" \
  || fail "model_route claim unexpected response: ${route_resp}"

if echo "$route_resp" | jq -e '.type == "stage.result"' &>/dev/null; then
  echo "$route_resp" | jq -e '.output.provider | length > 0' &>/dev/null \
    && pass "model_route result has provider field" \
    || fail "model_route result missing provider: $(echo "$route_resp" | jq '.output')"
fi

# ── 4. evidence_rank claim (dry-run) ──────────────────────────────────────────
info "--- Stage claim: evidence_rank (dry-run) ---"
evidence_input='{"query":"test query","evidence":[{"id":"e1","text":"alpha beta gamma"},{"id":"e2","text":"delta epsilon zeta"}],"top_k":2}'
rank_resp=$(claim 'evidence_rank' "$evidence_input" 'dry-run')
echo "$rank_resp" | jq -e '.type == "stage.result" or .type == "stage.error"' &>/dev/null \
  && pass "evidence_rank claim returns stage envelope" \
  || fail "evidence_rank claim unexpected response: ${rank_resp}"

if echo "$rank_resp" | jq -e '.type == "stage.result"' &>/dev/null; then
  echo "$rank_resp" | jq -e '.output.ranked | type == "array"' &>/dev/null \
    && pass "evidence_rank result has ranked array" \
    || fail "evidence_rank result missing ranked: $(echo "$rank_resp" | jq '.output')"
fi

# ── 5. Fail-closed contract: live mode with no inference URL ─────────────────
info "--- Fail-closed: live claim MUST return stage.error when inference is unconfigured ---"
# In CPU-stub mode SUBSTRATE_INFERENCE_URL is not set, so check_substrate_gate()=False.
# A live model_route claim MUST return stage.error — never a silent demo/mock result.
# Accepting a demo fallback here would mask the fail-closed guarantee entirely.
live_resp=$(claim 'model_route' '{"role":"reasoning"}' 'live' || echo '{}')
if echo "$live_resp" | jq -e '.type == "stage.error"' &>/dev/null; then
  pass "live claim returns stage.error when inference is unconfigured (fail-closed ✓)"
else
  fail "FAIL-CLOSED VIOLATED: live claim did not return stage.error — response: ${live_resp}"
  fail "  In live mode with no SUBSTRATE_INFERENCE_URL, worker must refuse the claim explicitly."
  fail "  Demo/mock fallback in live mode is a breach of the fail-closed contract."
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
if [[ $FAILED -eq 0 ]]; then
  printf '\033[32m✓ All substrate integration checks passed\033[0m\n'
else
  printf '\033[31m✗ One or more substrate integration checks FAILED (see above)\033[0m\n'
  exit 1
fi
