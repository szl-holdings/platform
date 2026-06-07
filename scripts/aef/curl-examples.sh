#!/usr/bin/env bash
# scripts/aef/curl-examples.sh
# AEF curl examples — run one section at a time or source into your shell.
# Requires: curl, jq (for pretty output)

AEF_BASE="${AEF_BASE_URL:-http://localhost:4200}"
AEF_KEY="${AEF_API_KEY:-dev-insecure-key}"
TENANT="${AEF_TENANT:-szl-internal}"

echo "=== Health ==="
curl -s "${AEF_BASE}/health" | jq .

echo ""
echo "=== API Docs ==="
curl -s "${AEF_BASE}/docs" | jq '{service: .service, endpoints: [.endpoints[] | .path]}'

echo ""
echo "=== Embed — dense vectors ==="
curl -s -X POST "${AEF_BASE}/v1/embed" \
  -H "Authorization: Bearer ${AEF_KEY}" \
  -H "X-Tenant-ID: ${TENANT}" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "curl-embed-001",
    "tenantId": "'"${TENANT}"'",
    "profileId": "vessels_maritime_risk",
    "texts": [
      "IMO 9123456 vessel MV Example departed Port of Rotterdam 2024-03-01",
      "MMSI 123456789 AIS gap detected Indian Ocean dark vessel spoofing"
    ]
  }' | jq '{model, dimensions, count: (.vectors | length), sample_vector_length: (.vectors[0].vector | length)}'

echo ""
echo "=== Rerank — cross-encoder scoring ==="
curl -s -X POST "${AEF_BASE}/v1/rerank" \
  -H "Authorization: Bearer ${AEF_KEY}" \
  -H "X-Tenant-ID: ${TENANT}" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "curl-rerank-001",
    "tenantId": "'"${TENANT}"'",
    "profileId": "vessels_maritime_risk",
    "query": "IMO 9123456 vessel sanctions OFAC",
    "candidates": [
      {"id": "c1", "text": "Vessel IMO 9123456 MV Example added to OFAC SDN list 2024-Q3"},
      {"id": "c2", "text": "Port call Rotterdam March 2024 no deficiencies found"},
      {"id": "c3", "text": "Classification certificate renewed by DNV valid 2026"}
    ],
    "topK": 3
  }' | jq '.results | map({rank, id, score})'

echo ""
echo "=== Hybrid Search — RRF fusion with provenance ==="
curl -s -X POST "${AEF_BASE}/v1/hybrid-search" \
  -H "Authorization: Bearer ${AEF_KEY}" \
  -H "X-Tenant-ID: ${TENANT}" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "curl-search-001",
    "tenantId": "'"${TENANT}"'",
    "profileId": "vessels_maritime_risk",
    "query": "IMO 9123456 vessel port history Gulf of Mexico sanctions",
    "topK": 5,
    "denseWeight": 0.6,
    "keywordWeight": 0.4,
    "includeProvenance": true
  }' | jq '{hits: (.hits | length), processingMs, top_hit: .hits[0]}'

echo ""
echo "=== Ingest — document ingestion ==="
curl -s -X POST "${AEF_BASE}/v1/ingest" \
  -H "Authorization: Bearer ${AEF_KEY}" \
  -H "X-Tenant-ID: ${TENANT}" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "curl-ingest-001",
    "tenantId": "'"${TENANT}"'",
    "documents": [
      {
        "sourceId": "doc-curl-001",
        "title": "IMO 9123456 Vessel Risk Assessment Q3 2024",
        "content": "The vessel MV Example, IMO 9123456, MMSI 123456789, flagged Panama, was subject to a Port State Control inspection at the Port of Rotterdam on 2024-03-01. The inspection found no deficiencies. The vessel has a clean OFAC SDN record as of the search date. Classification society DNV certificate valid until 2026-01-15. AIS data shows regular port calls in the Gulf of Mexico throughout Q1-Q2 2024.",
        "contentType": "text/plain",
        "profileId": "vessels_maritime_risk",
        "metadata": {"imo": "9123456", "mmsi": "123456789", "flag": "Panama"}
      }
    ],
    "chunkSize": 100,
    "chunkOverlap": 20
  }' | jq '{totalChunksIndexed, results}'

echo ""
echo "=== Index Rebuild — queue a rebuild job ==="
curl -s -X POST "${AEF_BASE}/v1/index/rebuild" \
  -H "Authorization: Bearer ${AEF_KEY}" \
  -H "X-Tenant-ID: ${TENANT}" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "curl-rebuild-001",
    "tenantId": "'"${TENANT}"'",
    "fullRebuild": false
  }' | jq '{jobId, status}'

echo ""
echo "=== Index Verify — check integrity ==="
curl -s -X POST "${AEF_BASE}/v1/index/verify" \
  -H "Authorization: Bearer ${AEF_KEY}" \
  -H "X-Tenant-ID: ${TENANT}" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "curl-verify-001",
    "tenantId": "'"${TENANT}"'",
    "sourceIds": ["doc-curl-001"]
  }' | jq '{verified, chunksVerified, missingChunks}'

echo ""
echo "=== Eval Run — retrieval quality assessment ==="
curl -s -X POST "${AEF_BASE}/v1/evals/run" \
  -H "Authorization: Bearer ${AEF_KEY}" \
  -H "X-Tenant-ID: ${TENANT}" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "curl-eval-001",
    "tenantId": "'"${TENANT}"'",
    "profileId": "vessels_maritime_risk",
    "datasetId": "vessels-maritime-risk-golden-v1",
    "queries": [
      {
        "queryId": "mar-q001",
        "query": "IMO 9123456 vessel port history Gulf of Mexico",
        "relevantChunkIds": ["chunk-imo-9123456-port-history", "chunk-imo-9123456-manifest"]
      }
    ],
    "topK": 10,
    "metrics": ["ndcg", "recall", "precision", "mrr"]
  }' | jq '{profileId, queryCount, metrics}'

echo ""
echo "=== OpenAI Drop-in — compatible embeddings endpoint ==="
curl -s -X POST "${AEF_BASE}/v1/openai/embeddings" \
  -H "Authorization: Bearer ${AEF_KEY}" \
  -H "X-Tenant-ID: ${TENANT}" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "The vessel MV Example, IMO 9123456, departed Port of Rotterdam",
    "model": "aef-embed-cpu-v1"
  }' | jq '{object, model, "embedding_dims": (.data[0].embedding | length), usage}'

echo ""
echo "=== Metrics ==="
curl -s "${AEF_BASE}/metrics" | jq '{requests: .requests.total, errors: .requests.errors, p95Ms: .latency.p95Ms}'
