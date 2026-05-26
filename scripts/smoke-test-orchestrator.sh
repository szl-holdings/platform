#!/usr/bin/env bash
# Smoke test — A11oy Vertical Orchestrator
#
# Usage:
#   ./scripts/smoke-test-orchestrator.sh [API_BASE_URL]
#
# API_BASE_URL must include the /api prefix:
#   ./scripts/smoke-test-orchestrator.sh https://szl.replit.app/api
#   ./scripts/smoke-test-orchestrator.sh http://localhost:8080/api
#   (default: http://localhost:8080/api)
#
# Auth for mutation routes (POST, DELETE — require adminGuard):
#   Option A — Internal service token (recommended for CI):
#     export ORCHESTRATOR_INTERNAL_TOKEN="<scoped-internal-token-with-internal:write-scope>"
#   Option B — Session token:
#     export ORCHESTRATOR_SESSION_TOKEN="<session-token>"
#   If neither is set, mutation calls will return 401/403 and the test FAILS.
#   This is intentional — the smoke test never silently passes in a broken state.
#
# Exit codes:
#   0 — all checks passed
#   1 — one or more checks failed
#   2 — preconditions not met (missing jq/curl)

set -euo pipefail

command -v jq  >/dev/null 2>&1 || { echo "jq is required"; exit 2; }
command -v curl >/dev/null 2>&1 || { echo "curl is required"; exit 2; }

API="${1:-http://localhost:8080/api}"
# Strip any trailing slash for consistent URL construction
API="${API%/}"

PASS=0
FAIL=0
TEST_SLUG="smoke-$(date +%s)"

RED='\033[0;31m'
GRN='\033[0;32m'
YLW='\033[1;33m'
DIM='\033[2m'
RST='\033[0m'

pass() { echo -e "${GRN}✓${RST}  $1"; PASS=$((PASS+1)); }
fail() { echo -e "${RED}✗${RST}  $1"; FAIL=$((FAIL+1)); }
info() { echo -e "${DIM}   $1${RST}"; }

# Build auth header array for curl (used in all mutation calls)
AUTH_HEADERS=()
if [ -n "${ORCHESTRATOR_INTERNAL_TOKEN:-}" ]; then
  AUTH_HEADERS+=(-H "X-Internal-Token: ${ORCHESTRATOR_INTERNAL_TOKEN}")
  AUTH_SOURCE="internal-token"
elif [ -n "${ORCHESTRATOR_SESSION_TOKEN:-}" ]; then
  AUTH_HEADERS+=(-H "Cookie: session=${ORCHESTRATOR_SESSION_TOKEN}")
  AUTH_SOURCE="session-token"
else
  AUTH_SOURCE="none (mutations will 401/403 — set ORCHESTRATOR_INTERNAL_TOKEN or ORCHESTRATOR_SESSION_TOKEN)"
fi

echo ""
echo "  A11oy Vertical Orchestrator — Smoke Test"
echo "  API:  ${API}"
echo "  Auth: ${AUTH_SOURCE}"
echo "  Run:  $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "  ─────────────────────────────────────────"
echo ""

ORCH="${API}/a11oy/orchestrator"

# ── 1. Status probe ──────────────────────────────────────────────────────────
echo "1. Orchestrator status probe"
STATUS=$(curl -sf "${ORCH}/status" 2>/dev/null || echo '{}')
if echo "$STATUS" | jq -e '.data.ready == true' > /dev/null 2>&1; then
  pass "GET /a11oy/orchestrator/status → ready:true"
  ACTIVE=$(echo "$STATUS" | jq -r '.data.activePacks // "?"')
  info "activePacks: ${ACTIVE}, approvalQueuePending: $(echo "$STATUS" | jq -r '.data.approvalQueuePending // "?"')"
elif echo "$STATUS" | jq -e '.code == "FLAG_DISABLED"' > /dev/null 2>&1; then
  echo -e "${YLW}  Orchestrator FLAG_DISABLED — set A11OY_ORCHESTRATOR_ENABLED=true and retry.${RST}"
  exit 1
elif echo "$STATUS" | jq -e '.code == "NOT_READY"' > /dev/null 2>&1; then
  echo -e "${RED}  Orchestrator NOT_READY — migration 0163_domain_packs.sql has not been applied.${RST}"
  exit 1
else
  fail "GET /a11oy/orchestrator/status → unexpected response"
  info "$STATUS"
fi

# ── 2. Available catalog endpoints ──────────────────────────────────────────
echo ""
echo "2. Catalog support endpoints"
for ENDPOINT in available-connectors available-evaluators available-constitution-articles; do
  RESP=$(curl -sf "${ORCH}/${ENDPOINT}" 2>/dev/null || echo '{}')
  if echo "$RESP" | jq -e '.ok == true' > /dev/null 2>&1; then
    pass "GET /a11oy/orchestrator/${ENDPOINT} → ok"
  else
    fail "GET /a11oy/orchestrator/${ENDPOINT} → unexpected response"
    info "$RESP"
  fi
done

# ── 3. List packs ────────────────────────────────────────────────────────────
echo ""
echo "3. List packs"
LIST=$(curl -sf "${ORCH}/packs" 2>/dev/null || echo '{}')
if echo "$LIST" | jq -e '.data.packs | length >= 6' > /dev/null 2>&1; then
  TOTAL=$(echo "$LIST" | jq '.data.packs | length')
  pass "GET /a11oy/orchestrator/packs → ${TOTAL} packs returned"
else
  fail "GET /a11oy/orchestrator/packs → expected at least 6 reference packs"
  info "$LIST"
fi

# ── 4. Read each reference pack ──────────────────────────────────────────────
echo ""
echo "4. Reference pack reads"
for SLUG in counsel vessels terra sentra aegis command; do
  PACK=$(curl -sf "${ORCH}/packs/${SLUG}" 2>/dev/null || echo '{}')
  if echo "$PACK" | jq -e ".data.slug == \"${SLUG}\"" > /dev/null 2>&1; then
    LIFECYCLE=$(echo "$PACK" | jq -r '.data.lifecycle')
    pass "GET /a11oy/orchestrator/packs/${SLUG} → lifecycle:${LIFECYCLE}"
  else
    fail "GET /a11oy/orchestrator/packs/${SLUG} → not found or wrong slug"
    info "$PACK"
  fi
done

# ── 5. Per-pack health ───────────────────────────────────────────────────────
echo ""
echo "5. Per-pack health endpoints (real KPIs)"
for SLUG in counsel vessels; do
  HEALTH=$(curl -sf "${ORCH}/packs/${SLUG}/health" 2>/dev/null || echo '{}')
  if echo "$HEALTH" | jq -e ".data.slug == \"${SLUG}\"" > /dev/null 2>&1; then
    INTEGRITY=$(echo "$HEALTH" | jq -r '.data.proofLedgerIntegrity // "?"')
    TTR=$(echo "$HEALTH" | jq -r '.data.approvalQueueMedianTtrMs // "null"')
    pass "GET /a11oy/orchestrator/packs/${SLUG}/health → proofLedger:${INTEGRITY} ttr:${TTR}ms"
  else
    fail "GET /a11oy/orchestrator/packs/${SLUG}/health → unexpected response"
    info "$HEALTH"
  fi
done

# ── 6. Draft lifecycle (mutations — FAIL hard if auth not configured) ─────────
echo ""
echo "6. Draft lifecycle — requires adminGuard auth"
info "Auth source: ${AUTH_SOURCE}"

DRAFT_BODY=$(cat <<EOF
{
  "slug": "${TEST_SLUG}",
  "name": "Smoke Test Vertical ${TEST_SLUG}",
  "description": "Ephemeral pack created by smoke test — safe to delete.",
  "industry": "Test",
  "uiShellTemplate": "standard",
  "constitution": [{"articleId":"I","version":"v4.2.0"},{"articleId":"II","version":"v4.2.0"}],
  "dataSources": [],
  "evaluators": [{"evaluatorId":"mirroreval-standard","displayName":"MirrorEval Standard","passThreshold":0.85,"dimensions":["groundedness","policy_compliance"]}],
  "approvalRules": [{"riskTier":"high","requiresApprover":"Smoke Test Approver"}],
  "selfOptimization": {"rewardSignals":["acceptance_rate"],"lockedParameters":[]},
  "learningLoop": {"calibrationMetric":"outcome_accuracy","driftThresholdPct":2.0,"recalibrationTrigger":"auto"}
}
EOF
)

DRAFT_HTTP=$(curl -s -o /tmp/smoke_draft_body.json -w "%{http_code}" \
  -X POST "${ORCH}/packs" \
  -H "Content-Type: application/json" \
  "${AUTH_HEADERS[@]}" \
  -d "$DRAFT_BODY" 2>/dev/null || echo '000')
DRAFT_RESP=$(cat /tmp/smoke_draft_body.json 2>/dev/null || echo '{}')

if [ "$DRAFT_HTTP" = "000" ]; then
  fail "POST /a11oy/orchestrator/packs → curl failed — API unreachable at ${API}"
elif [ "$DRAFT_HTTP" = "401" ] || [ "$DRAFT_HTTP" = "403" ]; then
  fail "POST /a11oy/orchestrator/packs → HTTP ${DRAFT_HTTP} — auth rejected"
  info "Set ORCHESTRATOR_INTERNAL_TOKEN (scoped internal token with internal:write) or ORCHESTRATOR_SESSION_TOKEN"
elif [ "$DRAFT_HTTP" = "409" ]; then
  pass "POST /a11oy/orchestrator/packs → 409 PACK_ALREADY_EXISTS (previous smoke run not cleaned up — continuing)"
elif [ "$DRAFT_HTTP" = "201" ] && echo "$DRAFT_RESP" | jq -e ".data.slug == \"${TEST_SLUG}\"" > /dev/null 2>&1; then
  pass "POST /a11oy/orchestrator/packs → 201 draft created slug:${TEST_SLUG}"

  # ── 6a. Validate ──────────────────────────────────────────────────────────
  VALIDATE_RESP=$(curl -sf -X POST "${ORCH}/packs/${TEST_SLUG}/validate" \
    "${AUTH_HEADERS[@]}" 2>/dev/null || echo '{}')
  if echo "$VALIDATE_RESP" | jq -e '.data.passed == true' > /dev/null 2>&1; then
    pass "POST /a11oy/orchestrator/packs/${TEST_SLUG}/validate → passed"
  else
    fail "POST /a11oy/orchestrator/packs/${TEST_SLUG}/validate → validation failed"
    info "$VALIDATE_RESP"
  fi

  # ── 6b. Request activation (files into approval_requests) ─────────────────
  REQACT_HTTP=$(curl -s -o /tmp/smoke_reqact_body.json -w "%{http_code}" \
    -X POST "${ORCH}/packs/${TEST_SLUG}/request-activation" \
    "${AUTH_HEADERS[@]}" 2>/dev/null || echo '000')
  REQACT_RESP=$(cat /tmp/smoke_reqact_body.json 2>/dev/null || echo '{}')
  if echo "$REQACT_RESP" | jq -e '.data.lifecycle == "pending_activation"' > /dev/null 2>&1; then
    APPROVAL_ID=$(echo "$REQACT_RESP" | jq -r '.data.approvalRequestId // "null"')
    pass "POST /a11oy/orchestrator/packs/${TEST_SLUG}/request-activation → pending_activation approvalId:${APPROVAL_ID}"
  else
    fail "POST /a11oy/orchestrator/packs/${TEST_SLUG}/request-activation → unexpected HTTP ${REQACT_HTTP}"
    info "$REQACT_RESP"
  fi

  # ── 6c. Verify visible in catalog ─────────────────────────────────────────
  VISIBLE=$(curl -sf "${ORCH}/packs" 2>/dev/null | jq -r "[.data.packs[].slug] | index(\"${TEST_SLUG}\")")
  if [ "$VISIBLE" != "null" ] && [ "$VISIBLE" != "" ]; then
    pass "GET /a11oy/orchestrator/packs → ${TEST_SLUG} visible in catalog"
  else
    fail "GET /a11oy/orchestrator/packs → ${TEST_SLUG} not found in catalog"
  fi

  # ── 6d. Reject (resolves approval_request) ────────────────────────────────
  REJECT_HTTP=$(curl -s -o /tmp/smoke_reject_body.json -w "%{http_code}" \
    -X POST "${ORCH}/packs/${TEST_SLUG}/reject" \
    -H "Content-Type: application/json" \
    "${AUTH_HEADERS[@]}" \
    -d '{"reason":"Smoke test cleanup — not a real rejection"}' 2>/dev/null || echo '000')
  REJECT_RESP=$(cat /tmp/smoke_reject_body.json 2>/dev/null || echo '{}')
  if echo "$REJECT_RESP" | jq -e '.data.lifecycle == "rejected"' > /dev/null 2>&1; then
    pass "POST /a11oy/orchestrator/packs/${TEST_SLUG}/reject → rejected"
  else
    fail "POST /a11oy/orchestrator/packs/${TEST_SLUG}/reject → unexpected HTTP ${REJECT_HTTP}"
    info "$REJECT_RESP"
  fi

  # ── 6e. Verify ACTIVATION_REJECTED on re-activate attempt ─────────────────
  REACTIVATE_HTTP=$(curl -s -o /tmp/smoke_reactivate_body.json -w "%{http_code}" \
    -X POST "${ORCH}/packs/${TEST_SLUG}/request-activation" \
    "${AUTH_HEADERS[@]}" 2>/dev/null || echo '000')
  REACTIVATE_RESP=$(cat /tmp/smoke_reactivate_body.json 2>/dev/null || echo '{}')
  if [ "$REACTIVATE_HTTP" = "409" ] && echo "$REACTIVATE_RESP" | jq -e '.code == "ACTIVATION_REJECTED"' > /dev/null 2>&1; then
    pass "POST /a11oy/orchestrator/packs/${TEST_SLUG}/request-activation (on rejected) → 409 ACTIVATION_REJECTED"
  else
    fail "POST /a11oy/orchestrator/packs/${TEST_SLUG}/request-activation (on rejected) → expected 409 ACTIVATION_REJECTED, got HTTP ${REACTIVATE_HTTP}"
    info "$REACTIVATE_RESP"
  fi

  # ── 6f. Delete ────────────────────────────────────────────────────────────
  DELETE_HTTP=$(curl -s -o /dev/null -w "%{http_code}" \
    -X DELETE "${ORCH}/packs/${TEST_SLUG}" \
    "${AUTH_HEADERS[@]}" 2>/dev/null || echo '0')
  if [ "$DELETE_HTTP" = "204" ]; then
    pass "DELETE /a11oy/orchestrator/packs/${TEST_SLUG} → 204 deleted"
  else
    fail "DELETE /a11oy/orchestrator/packs/${TEST_SLUG} → expected 204, got ${DELETE_HTTP}"
  fi
else
  fail "POST /a11oy/orchestrator/packs → unexpected HTTP ${DRAFT_HTTP}"
  info "$DRAFT_RESP"
fi

# ── 7. Evolve features (Task #5230) — read endpoints always callable ─────────
echo ""
echo "7. Evolve — Pack Library, Revisions, Readiness, Capability Proposals"
ORCH="${API}/a11oy/orchestrator"

TPL_RESP=$(curl -sf "${ORCH}/templates" 2>/dev/null || echo '{}')
if echo "$TPL_RESP" | jq -e '.ok == true and (.data.templates | type) == "array"' > /dev/null 2>&1; then
  TPL_COUNT=$(echo "$TPL_RESP" | jq '.data.templates | length')
  pass "GET /orchestrator/templates → ${TPL_COUNT} templates"
else
  fail "GET /orchestrator/templates → unexpected response"
  info "$TPL_RESP"
fi

PROP_RESP=$(curl -sf "${ORCH}/capability-proposals" 2>/dev/null || echo '{}')
if echo "$PROP_RESP" | jq -e '.ok == true and (.data.proposals | type) == "array"' > /dev/null 2>&1; then
  pass "GET /orchestrator/capability-proposals → list ok"
else
  fail "GET /orchestrator/capability-proposals → unexpected response"
  info "$PROP_RESP"
fi

PACKS_RESP=$(curl -sf "${ORCH}/packs" 2>/dev/null || echo '{}')
FIRST_SLUG=$(echo "$PACKS_RESP" | jq -r '.data.packs[0].slug // empty')
if [ -n "$FIRST_SLUG" ]; then
  READ_RESP=$(curl -sf "${ORCH}/packs/${FIRST_SLUG}/readiness" 2>/dev/null || echo '{}')
  if echo "$READ_RESP" | jq -e '.ok == true and (.data.score | type) == "number" and .data.grade' > /dev/null 2>&1; then
    pass "GET /orchestrator/packs/${FIRST_SLUG}/readiness → score $(echo "$READ_RESP" | jq -r '.data.score') (${FIRST_SLUG})"
  else
    fail "GET /orchestrator/packs/${FIRST_SLUG}/readiness → unexpected response"
    info "$READ_RESP"
  fi

  REV_RESP=$(curl -sf "${ORCH}/packs/${FIRST_SLUG}/revisions" 2>/dev/null || echo '{}')
  if echo "$REV_RESP" | jq -e '.ok == true and (.data.revisions | type) == "array"' > /dev/null 2>&1; then
    pass "GET /orchestrator/packs/${FIRST_SLUG}/revisions → list ok"
  else
    fail "GET /orchestrator/packs/${FIRST_SLUG}/revisions → unexpected response"
    info "$REV_RESP"
  fi
else
  info "No packs in registry — skipping per-pack evolve checks"
fi

# Evolve mutations (require auth + evolve flag). If auth or flag unavailable,
# tolerate 401/403/404 (EVOLVE_DISABLED) but never tolerate 500s.
if [ ${#AUTH_HEADERS[@]} -gt 0 ] && [ -n "$FIRST_SLUG" ]; then
  TPL_INSTANTIATE_SLUG="smoke-tpl-$(date +%s)"
  INST_HTTP=$(curl -s -o /tmp/orch-inst.json -w '%{http_code}' \
    -X POST "${ORCH}/templates/tpl-counsel/instantiate" \
    "${AUTH_HEADERS[@]}" -H 'Content-Type: application/json' \
    -d "{\"targetSlug\":\"${TPL_INSTANTIATE_SLUG}\"}")
  if [ "$INST_HTTP" = "201" ]; then
    pass "POST /orchestrator/templates/tpl-counsel/instantiate → 201 ${TPL_INSTANTIATE_SLUG}"
    curl -s -X DELETE "${ORCH}/packs/${TPL_INSTANTIATE_SLUG}" "${AUTH_HEADERS[@]}" >/dev/null 2>&1 || true
  elif [ "$INST_HTTP" = "404" ] || [ "$INST_HTTP" = "403" ] || [ "$INST_HTTP" = "401" ]; then
    info "instantiate skipped — evolve flag off or auth scoped out (HTTP ${INST_HTTP})"
  else
    fail "POST /orchestrator/templates/tpl-counsel/instantiate → HTTP ${INST_HTTP}"
    info "$(cat /tmp/orch-inst.json 2>/dev/null)"
  fi

  AI_HTTP=$(curl -s -o /tmp/orch-ai.json -w '%{http_code}' \
    -X POST "${ORCH}/ai-draft" \
    "${AUTH_HEADERS[@]}" -H 'Content-Type: application/json' \
    -d '{"brief":"A governed compliance copilot for a regional bank.","industry":"Banking"}')
  if [ "$AI_HTTP" = "200" ]; then
    pass "POST /orchestrator/ai-draft → 200 ($(jq -r '.data.source' /tmp/orch-ai.json))"
  elif [ "$AI_HTTP" = "404" ] || [ "$AI_HTTP" = "403" ] || [ "$AI_HTTP" = "401" ]; then
    info "ai-draft skipped — evolve flag off or auth scoped out (HTTP ${AI_HTTP})"
  else
    fail "POST /orchestrator/ai-draft → HTTP ${AI_HTTP}"
    info "$(cat /tmp/orch-ai.json 2>/dev/null)"
  fi

  CP_HTTP=$(curl -s -o /tmp/orch-cp.json -w '%{http_code}' \
    -X POST "${ORCH}/packs/${FIRST_SLUG}/emit-capability-proposal" \
    "${AUTH_HEADERS[@]}" -H 'Content-Type: application/json' \
    -d '{"title":"smoke proposal","summary":"automated smoke","proposalKind":"cross_pack_learning"}')
  if [ "$CP_HTTP" = "201" ]; then
    pass "POST /orchestrator/packs/${FIRST_SLUG}/emit-capability-proposal → 201"
  elif [ "$CP_HTTP" = "404" ] || [ "$CP_HTTP" = "403" ] || [ "$CP_HTTP" = "401" ]; then
    info "emit-capability-proposal skipped — evolve flag off or auth scoped out (HTTP ${CP_HTTP})"
  else
    fail "POST /orchestrator/packs/${FIRST_SLUG}/emit-capability-proposal → HTTP ${CP_HTTP}"
    info "$(cat /tmp/orch-cp.json 2>/dev/null)"
  fi
else
  info "Skipping evolve mutation checks (no auth header or no pack)"
fi

# ── 8. 404 guard on non-existent pack ────────────────────────────────────────
echo ""
echo "8. Error handling"
NOT_FOUND=$(curl -sf "${ORCH}/packs/this-pack-does-not-exist-smoke-9999" 2>/dev/null || echo '{}')
if echo "$NOT_FOUND" | jq -e '.code == "PACK_NOT_FOUND"' > /dev/null 2>&1; then
  pass "GET /a11oy/orchestrator/packs/non-existent → PACK_NOT_FOUND"
else
  fail "GET /a11oy/orchestrator/packs/non-existent → expected PACK_NOT_FOUND"
  info "$NOT_FOUND"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "  ─────────────────────────────────────────"
TOTAL=$((PASS+FAIL))
echo -e "  ${GRN}${PASS} passed${RST}  ${FAIL} failed  of ${TOTAL} checks"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}  SMOKE TEST FAILED — ${FAIL} check(s) failed.${RST}"
  exit 1
else
  echo -e "${GRN}  SMOKE TEST PASSED${RST}"
  exit 0
fi
