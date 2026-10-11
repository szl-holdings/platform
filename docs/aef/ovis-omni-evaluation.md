# Ovis-Omni governed multimodal retrieval lane

## Status

`EVALUATION_HOLD`. This change admits one immutable upstream candidate for controlled evaluation. It does **not** replace BGE-M3, does not publish an SZL derivative model, does not claim a live production deployment, and does not admit the publisher's optional 1024/512/256/128 projections because no corresponding projection artifact has been verified in the pinned repository revision.

Canonical candidate:

- model: `ATH-MaaS/Ovis-Omni-Embedding-3B`
- revision: `08547b8479edc10edc9878597438ebd076f74dff`
- native width: `2048`
- artifact-set digest: `4ea7bf104aaf758eb648ea5f954b0aa19575f4e28d286f59103dfe223f4b4926`
- manifest: `docs/aef/manifests/ovis-omni-embedding-3b.v1.json`

## Architecture

The existing BGE-M3 text path remains the production text baseline. Ovis is a separate multimodal workcell:

```text
client
  -> alloy-embedding-api /v1/multimodal/embed
     -> contract + tenant + policy gates
     -> strict MultimodalHttpEmbeddingClient
     -> substrate-py-workers /aef/ovis/embed
        -> promotion gate
        -> explicit flattened snapshot root
        -> admitted LFS size + SHA-256 verification
        -> CAS media size + SHA-256 verification
        -> Qwen2.5-Omni processor
        -> final-layer last-non-padding hidden state
        -> L2 normalization
     -> Evidence Ledger entry per item
     -> receipt-bound response
```

There is no text-hash fallback, no model alias, no mutable Hub `main`, no remote media fetch, and no silent projection. Failure of any identity or policy gate fails the request.

## Dependency and image boundary

The admitted runtime stack binds Accelerate `1.15.0`, Transformers `5.3.0`,
Torch `2.14.0`, and Qwen Omni Utils `0.0.9` across the candidate manifest,
Python package metadata, and runtime source. The process and authenticated
Ovis health endpoint check those installed distribution versions before the
model can be admitted. The complete Python resolution is in
`services/substrate-py-workers/uv.lock`; its SHA-256 is recorded in the
candidate manifest. Regenerate it only with an explicit candidate review:

```bash
uv lock --project services/substrate-py-workers
uv lock --check --project services/substrate-py-workers
```

The general Compose and Kubernetes worker definitions explicitly disable Ovis.
The isolated evaluation definitions are:

- `substrate/docker-compose.ovis-evaluation.yml.template`
- `services/substrate-py-workers/deploy/k8s-ovis-evaluation.yaml.template`
- `services/substrate-py-workers/deploy/render_ovis_deployment.py`

Both lanes require a separately published container image addressed as
`repository@sha256:<64-hex-digest>`, a file-mounted internal API key, a
read-only flattened model snapshot and CAS, single-request model execution,
artifact verification, and the literal promotion state `EVALUATION_HOLD`.
The renderer rejects tags and malformed digests for both formats:

```bash
python services/substrate-py-workers/deploy/render_ovis_deployment.py \
  --image "${OVIS_EVAL_IMAGE_REPOSITORY}@sha256:${OVIS_EVAL_IMAGE_DIGEST}" \
  --output /tmp/ovis-evaluation.yaml

python services/substrate-py-workers/deploy/render_ovis_deployment.py \
  --target compose \
  --image "${OVIS_EVAL_IMAGE_REPOSITORY}@sha256:${OVIS_EVAL_IMAGE_DIGEST}" \
  --output /tmp/docker-compose.ovis-evaluation.yml
```

This repository does not yet admit a GPU image recipe or a published image
digest for this candidate. Resolving the lock without installing the GPU extra
does not prove CUDA compatibility, model execution, retrieval quality, or an
image build. Image publication remains blocked until an owned build produces
an immutable digest and the supported hardware lane verifies it. Model
promotion additionally requires the qualification evidence below.

The Ovis execution receipt reports runtime version `1.0.1` for this hardening
contract. It still does not carry the container digest or dependency-lock
digest, so the receipt alone cannot identify an exact deployed build.

## Internal runtime configuration

Install only from the bound lock in a future GPU/evaluation image, and put the
resulting virtual environment first on the image `PATH`:

```bash
uv sync --project services/substrate-py-workers --locked --no-dev --extra ovis
```

Required evaluation variables:

```text
OVIS_OMNI_ENABLED=1
OVIS_MAX_CONCURRENCY=1
OVIS_PROMOTION_STATE=EVALUATION_HOLD
OVIS_ASSET_ROOT=/var/lib/szl/cas
OVIS_MODEL_SNAPSHOT_ROOT=/var/lib/szl/ovis-snapshot
OVIS_VERIFY_ARTIFACTS=1
OVIS_INTERNAL_API_KEY=<secret>
```

The isolated deployment lanes use `OVIS_INTERNAL_API_KEY_FILE` so the key can
be mounted from a container or Kubernetes secret without placing it in the
image or manifest.

With artifact verification enabled, `OVIS_MODEL_SNAPSHOT_ROOT` is mandatory
and must point at a flattened regular-file snapshot. A normal Hugging Face
cache snapshot uses symlinks into `blobs/` and is rejected. The current
candidate identity authenticates the three safetensor shards and
`tokenizer.json`; the supporting processor/config file set consumed by
Transformers has not yet been exhaustively inventoried and hash-bound. That
remaining inventory is a qualification and production blocker.

The authenticated Ovis health route checks the feature/promotion gates and
the four exact-pinned runtime distribution versions. HTTP 200 with status `cold`
means only that this configuration admission passed. It does not load the
model, verify the flattened snapshot, exercise a GPU, or establish model
readiness. Direct embedding requests are serialized by a process-local lock;
the admitted evaluation concurrency is exactly one.

Compose also requires UID/GID `1001`, a read-only root filesystem, dropped
capabilities, `no-new-privileges`, and a bounded writable `/tmp`. A future
image must satisfy those process and filesystem contracts before publication.

The TypeScript API points at the Python worker with:

```text
SUBSTRATE_MULTIMODAL_EMBED_URL=http://substrate-py-workers:8090
SUBSTRATE_MULTIMODAL_API_KEY=<same secret>
OVIS_EMBED_PATH=/aef/ovis/embed
OVIS_HEALTH_PATH=/aef/ovis/health
```

Production Ovis health and embedding requests additionally require all of the
following and fail closed otherwise:

```text
OVIS_PROMOTION_STATE=QUALIFIED
OVIS_QUALIFICATION_RECEIPT_SHA256=<64-hex Forge receipt digest>
OVIS_VERIFY_ARTIFACTS=1
OVIS_INTERNAL_API_KEY_FILE=/run/secrets/ovis/internal-api-key
```

The current qualification receipt gate validates only the presence and
64-hex shape of the configured digest. It does not yet retrieve or verify an
owned Forge receipt, so production qualification remains blocked.

## Media admission

The public contract accepts only `cas://sha256/<digest>` assets. The runtime resolves them under `${OVIS_ASSET_ROOT}/sha256/<digest>`, rejects symlinks and path escapes, verifies byte length and SHA-256, and then hands the local file URI to the processor.

Visual documents must arrive as governed rendered page images. Raw PDF execution is deliberately rejected until a page-selection and rendering receipt is part of the same proof chain.

## Qualification matrix

The Forge qualification run must compare Ovis against the current specialist stack rather than against publisher marketing numbers alone.

| Lane | Minimum owned evidence |
|---|---|
| text | BEIR-style and SZL vertical recall@nDCG, citation recovery, long-query behavior |
| visual documents | page-image retrieval, table/chart retrieval, OCR-corrupted queries, page-level citation accuracy |
| image | cross-modal text-to-image and image-to-text recall, near-duplicate resistance |
| audio | speaker/noise/language slices, timestamp-linked evidence recovery |
| video | frame/clip retrieval, temporal localization, long-video memory bounds |
| agent memory/tools | tool and GUI-state lookup, stale-memory rejection, tenant isolation |
| systems | TTFT, encode throughput, peak VRAM/RSS, batch curves, warm/cold load, artifact verification time |
| safety | prompt injection in media, malicious metadata, parser bombs, oversized inputs, CAS tampering |

Every result must bind the GitHub source SHA, model revision, artifact-set digest, tokenizer/processor identity, dependency lock, hardware, runtime configuration, raw repetitions, and scorer version.

## Authority and publication order

1. protected `platform/main` admits source and contracts;
2. `szl-forge` produces exact-head qualification receipts;
3. the GitHub-controlled Hugging Face publisher projects cards/artifacts only after admission;
4. `a-11-oy.com` may show capability only after the runtime is merged and deployed;
5. `a11oy.net` publishes the receipt, evaluation result, and known bounds.

Until those gates are satisfied, every downstream surface must render the candidate as `EVALUATION_HOLD`, not `LIVE`, `QUALIFIED`, or `PRODUCTION`.
