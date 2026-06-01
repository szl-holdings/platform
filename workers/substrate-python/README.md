# SZL Substrate — Python Worker (Phase 1)

Reference Python worker for the Sovereign Execution Substrate.

## Start

```bash
pip install -r requirements.txt
uvicorn src.main:app --host 0.0.0.0 --port 8001
```

## Health check

```
GET /health
```

## Claim a stage

```
POST /claim
Content-Type: application/json

{
  "protocolVersion": "1.0",
  "messageId": "...",
  "timestamp": "...",
  "type": "stage.claim",
  "workerId": "caller",
  "runId": "run-abc",
  "workflowId": "opportunity-audit",
  "stageId": "retrieve-lyte-data",
  "stageType": "Retrieve",
  "stageConfig": { "topK": 10, "minRelevanceScore": 0.5 },
  "input": { "query": "lyte service anomalies" },
  "budgetConfig": { "escalateAt": 0.5, "requireHumanBelow": 0.3 },
  "traceId": "..."
}
```

## Supported stage types

- `Retrieve` — heavy corpus retrieval with pgvector / Elasticsearch

Phase 2 will add: OCR, geospatial, eval grading.
