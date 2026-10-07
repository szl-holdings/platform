# Alloy vector worker runtime contract

The production process runs compiled JavaScript and refuses to start without
`AEF_S2S_SECRET`. Inject that value with the deployment secret manager; it is
never baked into the image.

`GET /health` and `GET /healthz` are liveness endpoints. `GET /readyz` is the
traffic-readiness authority. The exact configured reference expected for future
promotion is
`Xenova/all-MiniLM-L6-v2@751bff37182d3f1213fa05d7196b954e230abad9`
at 384 dimensions, but configuration identity and one inference are not a
qualification receipt or artifact-integrity proof. Therefore every backend,
including that pinned local configuration, currently returns HTTP 503 in
production. Orchestrators and load balancers must use `/readyz`.

The default `local-cpu` backend uses `Xenova/all-MiniLM-L6-v2` through
Transformers.js and ONNX Runtime, pinned to immutable Hugging Face revision
`751bff37182d3f1213fa05d7196b954e230abad9` (public API observation on
2026-10-06). A fresh runtime therefore needs one of these explicitly
provisioned paths:

- outbound HTTPS access to the model files and redirects used by the configured
  Hugging Face model, plus a writable cache; or
- a pre-populated persistent cache mounted at `AEF_HF_CACHE_DIR`, with
  `AEF_HF_ALLOW_REMOTE_MODELS=false` to prove offline operation.

`AEF_HF_MODEL_ID` selects a different model and `AEF_HF_CACHE_DIR` selects the
cache location. A model-ID override is rejected unless
`AEF_HF_MODEL_REVISION` is also set to its immutable 40-hex commit SHA. The
default cache is the Transformers.js cache under the runtime user's home
directory and is ephemeral in the image unless a volume is mounted. Custom
models remain development-only even with an immutable revision. Production
promotion requires the allowlisted configuration plus the exact model digest,
cache provenance, and a qualification receipt that this worker can validate.

`AEF_EMBED_BACKEND=external-http` requires `AEF_EMBED_ENDPOINT`,
`AEF_EMBED_API_KEY`, and an immutable `AEF_EMBED_MODEL_REF`. Its transport and
response contract can be exercised in development, but it remains on
production HOLD because this worker does not yet verify an external promotion
receipt. The `deterministic-cpu` backend is suitable for tests and seed data
only; it carries no semantic signal and cannot be used as production readiness
evidence. Caller-selected model identities are rejected.
