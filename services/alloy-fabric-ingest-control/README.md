# Alloy fabric ingest-control runtime contract

## Production status: HOLD

The current checkpoint and approval stores are single-process JSON files. They
do not provide the transactional durability, concurrency control, or qualified
evidence ledger required for production workflow claims. With
`NODE_ENV=production`, `/readyz` and authorized control operations return HTTP
503 with `INGEST_CONTROL_PRODUCTION_UNAVAILABLE` before any workflow runs.

Production startup requires both `AEF_S2S_SECRET` and
`AEF_S2S_TENANT_ID`. The credential is bound to that tenant, Bearer tokens are
compared in constant time, and new checkpoints persist their tenant owner.
Resume, approval resolution, and approval listing reject foreign or legacy
unowned records with the same not-found shape. `GET /health` and `/healthz` are
liveness only.

Development mode can exercise the local workflow machinery. Remove the HOLD
only after a tenant-scoped durable state backend and durable evidence ledger
are implemented and verified.
