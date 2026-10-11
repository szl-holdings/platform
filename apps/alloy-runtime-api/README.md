# Alloy runtime API contract

## Production status: HOLD

The current tasks, memory, workflows, search, evaluation, Atelier, Ouroboros,
Lutar, embedding, reranking, and index implementations are process-local,
stubbed, or lack durable evidence. They are available for development and
contract testing, but are not production execution authorities.

With `NODE_ENV=production`, `/readyz` returns HTTP 503 and every authenticated
API route is stopped at a shared boundary with
`PRODUCTION_CAPABILITY_UNAVAILABLE` before validation, identifier creation, or
state mutation. The compatibility beacon also returns 503. `/health` and
`/healthz` remain liveness-only; `/docs` includes the active production HOLD.

Production startup requires `ALLOY_API_KEY` and `ALLOY_API_TENANT_ID`. The API
key is compared in constant time and bound to that tenant, so a caller cannot
select another tenant. Remove the HOLD only after durable tenant stores,
qualified execution backends, and a durable evidence ledger are wired and
verified.
