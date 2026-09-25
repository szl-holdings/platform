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
        -> exact Hub revision snapshot
        -> LFS size + SHA-256 verification
        -> CAS media size + SHA-256 verification
        -> Qwen2.5-Omni processor
        -> final-layer last-non-padding hidden state
        -> L2 normalization
     -> Evidence Ledger entry per item
     -> receipt-bound response
```

There is no text-hash fallback, no model alias, no mutable Hub `main`, no remote media fetch, and no silent projection. Failure of any identity or policy gate fails the request.

## Internal runtime configuration

Install only in the GPU/evaluation image:

```bash
pip install -e 'services/substrate-py-workers[ovis]'
```

Required evaluation variables:

```text
OVIS_OMNI_ENABLED=1
OVIS_PROMOTION_STATE=EVALUATION_HOLD
OVIS_ASSET_ROOT=/var/lib/szl/cas
OVIS_VERIFY_ARTIFACTS=1
OVIS_INTERNAL_API_KEY=<secret>
```

The TypeScript API points at the Python worker with:

```text
SUBSTRATE_MULTIMODAL_EMBED_URL=http://substrate-py-workers:8090
SUBSTRATE_MULTIMODAL_API_KEY=<same secret>
OVIS_EMBED_PATH=/aef/ovis/embed
OVIS_HEALTH_PATH=/aef/ovis/health
```

Production additionally requires all of the following and refuses startup otherwise:

```text
OVIS_PROMOTION_STATE=QUALIFIED
OVIS_QUALIFICATION_RECEIPT_SHA256=<64-hex Forge receipt digest>
OVIS_VERIFY_ARTIFACTS=1
OVIS_INTERNAL_API_KEY=<secret>
```

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
