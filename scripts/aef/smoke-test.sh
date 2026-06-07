#!/usr/bin/env bash
# scripts/aef/smoke-test.sh
# Alloy Embedding Fabric — smoke test script
# Starts alloy-fabric-api on port 4200 (via tsx), runs each endpoint, exits non-zero on any failure.
set -euo pipefail

AEF_BASE="${AEF_BASE_URL:-http://localhost:4200}"
AEF_KEY="${AEF_API_KEY:-dev-insecure-key}"
TENANT="${AEF_SMOKE_TENANT:-szl-smoke-test}"
PASS=0
FAIL=0

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

assert_http() {
  local label="$1"
  local expected_status="$2"
  local method="$3"
  local path="$4"
  local body="${5:-}"

  local args=(
    -s -o /tmp/aef_smoke_body -w "%{http_code}"
    -X "$method"
    -H "Authorization: Bearer $AEF_KEY"
    -H "X-Tenant-ID: $TENANT"
    -H "Content-Type: application/json"
  )

  if [[ -n "$body" ]]; then
    args+=(-d "$body")
  fi

  local actual_status
  actual_status=$(curl "${args[@]}" "${AEF_BASE}${path}")

  if [[ "$actual_status" == "$expected_status" ]]; then
    echo -e "${GREEN}PASS${NC} [$label] → HTTP $actual_status"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}FAIL${NC} [$label] → expected HTTP $expected_status, got HTTP $actual_status"
    echo "       Body: $(cat /tmp/aef_smoke_body | head -c 300)"
    FAIL=$((FAIL + 1))
  fi
}

assert_no_auth() {
  local label="$1"
  local expected_status="$2"
  local method="$3"
  local path="$4"

  local actual_status
  actual_status=$(curl -s -o /tmp/aef_smoke_body -w "%{http_code}" -X "$method" "${AEF_BASE}${path}")

  if [[ "$actual_status" == "$expected_status" ]]; then
    echo -e "${GREEN}PASS${NC} [$label] → HTTP $actual_status"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}FAIL${NC} [$label] → expected HTTP $expected_status, got HTTP $actual_status"
    echo "       Body: $(cat /tmp/aef_smoke_body | head -c 300)"
    FAIL=$((FAIL + 1))
  fi
}

echo "==========================================="
echo "  AEF Smoke Test — $AEF_BASE"
echo "==========================================="

# Health and infrastructure
assert_no_auth "/health — status ok"               "200" "GET" "/health"
assert_no_auth "/ready — ready probe"              "200" "GET" "/ready"
assert_no_auth "/metrics — metrics endpoint"       "200" "GET" "/metrics"
assert_no_auth "/docs — API docs"                  "200" "GET" "/docs"

# Auth check
echo ""
echo "--- Auth boundary ---"
SAVE_KEY="$AEF_KEY"
AEF_KEY="bad-key"
assert_http "/v1/embed — rejects bad token" "401" "POST" "/v1/embed" '{}'
AEF_KEY="$SAVE_KEY"

# Missing tenant
echo ""
echo "--- Tenant boundary ---"
actual=$(curl -s -o /tmp/aef_smoke_body -w "%{http_code}" \
  -X POST -H "Authorization: Bearer $AEF_KEY" -H "Content-Type: application/json" \
  -d '{"requestId":"r1","texts":["test"],"tenantId":""}' \
  "${AEF_BASE}/v1/embed")
if [[ "$actual" == "400" ]]; then
  echo -e "${GREEN}PASS${NC} [/v1/embed — rejects empty tenant] → HTTP $actual"
  PASS=$((PASS + 1))
else
  echo -e "${RED}FAIL${NC} [/v1/embed — rejects empty tenant] → expected 400, got $actual"
  FAIL=$((FAIL + 1))
fi

# Core API endpoints
echo ""
echo "--- Core API ---"
assert_http "/v1/embed" "200" "POST" "/v1/embed" \
  '{"requestId":"smoke-embed-001","tenantId":"'"$TENANT"'","texts":["The vessel MV Example departed Rotterdam with cargo manifest ref MAN-2024-001","IMO 9123456 port call history Singapore Q3 2024"]}'

assert_http "/v1/rerank" "200" "POST" "/v1/rerank" \
  '{"requestId":"smoke-rerank-001","tenantId":"'"$TENANT"'","query":"vessel IMO 9123456 sanctions","candidates":[{"id":"c1","text":"Vessel MV Example IMO 9123456 flagged on OFAC SDN list"},{"id":"c2","text":"Port call record Rotterdam March 2024"},{"id":"c3","text":"Classification certificate renewed"}],"topK":2}'

assert_http "/v1/hybrid-search" "200" "POST" "/v1/hybrid-search" \
  '{"requestId":"smoke-search-001","tenantId":"'"$TENANT"'","profileId":"vessels_maritime_risk","query":"IMO 9123456 vessel port history sanctions","topK":5,"denseWeight":0.6,"keywordWeight":0.4,"includeProvenance":true}'

assert_http "/v1/ingest — 202 accepted" "202" "POST" "/v1/ingest" \
  '{"requestId":"smoke-ingest-001","tenantId":"'"$TENANT"'","documents":[{"sourceId":"doc-smoke-001","content":"The vessel MV Example IMO 9123456 departed Rotterdam on 2024-03-01. Port state control inspection found no deficiencies. Classification society certificate valid until 2026-01-15.","contentType":"text/plain","metadata":{"imo":"9123456"}}],"chunkSize":50,"chunkOverlap":10}'

assert_http "/v1/index/rebuild — 202 queued" "202" "POST" "/v1/index/rebuild" \
  '{"requestId":"smoke-rebuild-001","tenantId":"'"$TENANT"'","fullRebuild":false}'

assert_http "/v1/index/verify" "200" "POST" "/v1/index/verify" \
  '{"requestId":"smoke-verify-001","tenantId":"'"$TENANT"'"}'

assert_http "/v1/evals/run" "200" "POST" "/v1/evals/run" \
  '{"requestId":"smoke-eval-001","tenantId":"'"$TENANT"'","profileId":"vessels_maritime_risk","datasetId":"vessels-maritime-risk-golden-v1","queries":[{"queryId":"q1","query":"IMO 9123456 vessel port history","relevantChunkIds":["chunk-a","chunk-b"]}],"topK":5,"metrics":["ndcg","recall"]}'

assert_http "/v1/openai/embeddings" "200" "POST" "/v1/openai/embeddings" \
  '{"input":"The vessel MV Example IMO 9123456","model":"aef-embed-cpu-v1"}'

# Validation errors
echo ""
echo "--- Validation ---"
assert_http "/v1/embed — empty texts rejected" "400" "POST" "/v1/embed" \
  '{"requestId":"r1","tenantId":"'"$TENANT"'","texts":[]}'

assert_http "/v1/rerank — empty candidates rejected" "400" "POST" "/v1/rerank" \
  '{"requestId":"r1","tenantId":"'"$TENANT"'","query":"test","candidates":[]}'

echo ""
echo "==========================================="
echo "  Results: $PASS passed, $FAIL failed"
echo "==========================================="

if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi
