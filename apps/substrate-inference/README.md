# Substrate Inference Service

FastAPI boundary for the repository's checked-in Transformers adapter.
It exposes authenticated OpenAI-shaped chat/model routes while keeping public
liveness (`/healthz`), authenticated diagnostic health (`/health`), and public
fail-closed readiness (`/ready`) distinct.

Production startup requires:

- `SUBSTRATE_INFERENCE_ENV=production`;
- a secret-backed `SUBSTRATE_API_KEY` bound to `SUBSTRATE_API_TENANT_ID`;
- a distinct secret-backed `SUBSTRATE_MODEL_ADMIN_API_KEY` for global model
  load/unload operations;
- `SUBSTRATE_MODEL_REVISIONS_JSON` with at least one registry model mapped to
  an exact 40-character upstream commit SHA;
- a detected live GPU/checked-in adapter boundary (STUB mode is rejected); and
- explicit CORS origins (wildcards are rejected).

The adapter does not implement the advertised legacy SSD KV-cache or explicit
CPU-layer offload options; non-default requests for either are rejected. The
service makes no 8 GB/80B feasibility claim without model-specific GPU proof.

Inference calls and `/health` require `Authorization: Bearer <SUBSTRATE_API_KEY>`
plus the credential-bound `X-Tenant-ID`. Chat payload `tenant_id` must match
that header and binding. `/v1/models/load` and `/v1/models/unload` reject the
inference credential and require the separate model-administration credential.
`/healthz` is process liveness only; the image HEALTHCHECK uses `/ready` so a
STUB or unloaded engine cannot be advertised as ready. A model is
ready only after its server-owned registry id and immutable revision load into
the live engine. The development STUB returns labelled fixture responses but
always fails readiness.

An upstream commit SHA pins repository revision but is not, by itself, an
artifact-set verification or model qualification receipt. Production promotion
remains on HOLD until each admitted model has verified file digests plus an
observed GPU load/inference receipt for the release image.
Accordingly, production `/ready` and `/v1/chat/completions` return HTTP 503
`PRODUCTION_INFERENCE_UNQUALIFIED` before inference, even if an administrator
has loaded a revision-pinned model. Model load is configuration, not promotion.

See [engine/README.md](engine/README.md) for the engine boundary and environment
variables. The service dependency graph is range-based and has no committed,
hashed Python lock, so reproducible production packaging remains on release
HOLD until an exact clean-build digest and SBOM are proved.

The integration service is governed by the repository's
`LicenseRef-SZL-Proprietary` license. The separately identified vendored oLLM
source under `engine/ollm/` retains its upstream MIT license.
