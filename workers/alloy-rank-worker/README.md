# Alloy rank worker runtime contract

## Production status: HOLD

The available `lexical-overlap` and `score-passthrough` modes are development
heuristics, not qualified reranking models. With `NODE_ENV=production`,
`/readyz` and authenticated `/rerank` requests return HTTP 503 with
`RANKING_BACKEND_UNAVAILABLE`; no rankings or model claims are emitted.

`GET /health` and `GET /healthz` are liveness-only endpoints. The worker
requires `AEF_S2S_SECRET`, parses one exact Bearer token, and compares its digest
in constant time. Development behavior remains available for offline contract
tests. Remove the production HOLD only after an immutable model artifact and
its qualification evidence are wired and verified.
