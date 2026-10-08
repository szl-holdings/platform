# Alloy fabric API runtime contract

## Production status: HOLD

This service currently uses process-local storage and evidence state and has no
immutable qualification receipt for its embedding/reranking artifacts. It is
therefore a development/test surface, not a production-serving authority.
With `NODE_ENV=production`, liveness remains available for diagnosis, but
`/ready`, `/readyz`, and every protected `/v1/*` route return HTTP 503 with
`PRODUCTION_CAPABILITY_UNAVAILABLE`. No request is accepted into a deterministic
fallback, in-memory index, fabricated verification result, or best-effort
ledger path. Production startup also skips all smoke/development fixture
seeding. Remove this HOLD only after durable tenant storage, qualified model
artifacts, and a durable transactional evidence ledger are wired and verified.

The production process runs compiled JavaScript on Debian/glibc because its
default local embedding backend loads `onnxruntime-node`. It refuses to start
without `AEF_BEARER_TOKEN` or `AEF_API_KEY`; inject the credential through the
deployment secret manager. Production also requires `AEF_API_TENANT_ID`. Both
the API credential and optional `AEF_S2S_SECRET` are bound to that tenant;
header/body tenant values that do not match it are rejected before request
side effects.

Health probes and embedding requests have bounded aggregate limits of 6000
requests per minute. The tenant limiter uses the resolved authenticated tenant,
defaults to 60 requests per minute (`AEF_RATE_LIMIT_RPM`), and stores at most
4096 active tenant windows. Excess traffic or tenant capacity returns HTTP 429;
expired windows release capacity.

`GET /healthz` is liveness only. Outside production, `GET /readyz` loads the
configured embedding backend, performs one minimal inference, validates the
model identity, normalized vector, and dimensions, and returns HTTP 503 until
that succeeds. In production it remains 503 for the broader HOLD above. The
Docker healthcheck and every traffic router must use `/readyz`.

The local backend shares the vector worker contract: the default
`Xenova/all-MiniLM-L6-v2` model is pinned to revision
`751bff37182d3f1213fa05d7196b954e230abad9`. A fresh runtime needs Hugging Face
HTTPS egress and a writable cache, or a pre-populated persistent cache mounted
at `AEF_HF_CACHE_DIR` with `AEF_HF_ALLOW_REMOTE_MODELS=false`. A custom
`AEF_HF_MODEL_ID` requires a 40-hex `AEF_HF_MODEL_REVISION`. Caller-supplied
model labels that do not equal the active backend model are rejected and are
never written into evidence receipts.
