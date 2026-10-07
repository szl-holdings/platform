# Inference Engine — Substrate Integration Layer

This directory contains the engine runtime and the small checked-in `ollm`
compatibility adapter used by the Substrate Inference FastAPI service. The
adapter delegates model loading and generation to Hugging Face Transformers.

## Architecture

```
engine/
├── __init__.py           # Public API: SubstrateRuntime, EngineMode
├── runtime.py            # Core engine bridge (oLLM ↔ Substrate)
└── README.md             # This file
```

The `SubstrateRuntime` class auto-detects the execution environment:

- **LIVE mode**: When `torch`, a GPU backend, and the exact checked-in adapter
  are available, the runtime delegates to Transformers for model loading and
  generation. Production also requires an admitted immutable model revision.

- **STUB mode**: When either dependency is missing (CPU-only dev, CI, etc.),
  the runtime returns clearly-labelled stub responses. All API contracts
  remain identical so the rest of the stack (Command dashboard, AI Control
  Plane, model router) can be developed and tested without GPU hardware.
  STUB mode is rejected at production startup, reports
  `development-stub` on `/health`, and never passes `/ready`.

## Checked-in adapter boundary

`engine/ollm/` contains four tracked files, including the compatibility adapter,
package metadata, and retained MIT license. It is not a full upstream checkout,
and the legacy `vendor.sh` helper is not a production build or provenance
receipt. Production packaging must use the reviewed tracked source and prove its
own source/dependency identities; it must not substitute an ambient `ollm`
package. Runtime import checks enforce the tracked adapter path and version.

## Production Setup

```bash
# 1. Install CUDA toolkit (driver >= 525, CUDA >= 12.1)

# 2. Install the checked-in adapter for local development:
cd apps/substrate-inference
pip install -e engine/ollm

# 3. Install Substrate service dependencies:
pip install -r requirements.txt

# 4. Start the service:
python -m src.main
```

## Environment Variables

| Variable                  | Default                    | Description                           |
|---------------------------|----------------------------|---------------------------------------|
| `SUBSTRATE_INFERENCE_PORT`| `8070`                     | FastAPI listen port                   |
| `SUBSTRATE_MODELS_DIR`    | `~/.substrate/models`      | Directory for model weight cache      |
| `SUBSTRATE_CACHE_DIR`     | `~/.substrate/cache`       | Reserved cache directory              |
| `SUBSTRATE_MAX_CONCURRENT`| `4`                        | Max concurrent inference requests     |
| `SUBSTRATE_DEFAULT_MODEL` | *(empty)*                  | Model to auto-load at startup         |
| `SUBSTRATE_MODEL_REVISIONS_JSON` | *(empty)*             | Registry id → exact 40-char commit SHA|
| `SUBSTRATE_API_KEY`       | *(none)*                   | Bearer credential for `/v1/*`, `/health` |
| `SUBSTRATE_INFERENCE_ENV` | *(unspecified)*            | `production`, `development`, or `test`|
| `SUBSTRATE_INFERENCE_AUTH_BYPASS` | `false`            | Dev/test-only explicit auth bypass    |

Production startup requires both a bearer credential and a detected live oLLM
engine. `/healthz` is minimal public liveness, `/health` is authenticated
diagnostics, and `/ready` returns 200 only after the live engine has loaded at
least one model; it is always 503 in STUB mode.
Production also requires at least one immutable model-revision mapping and
rejects a model load when that registry id has no exact commit SHA. Responses
report the server-selected revision; callers cannot supply or relabel it.

The checked-in engine disables remote model code. The Docker build uses SDPA by
default; set `--build-arg SUBSTRATE_INSTALL_FLASH_ATTN=1` only when the build
environment is expected to compile FlashAttention. That opt-in fails the build
on installation error instead of silently producing a different image.

SSD KV-cache offload and explicit CPU-layer offload are not implemented by the
checked-in adapter. Supplying `ssd_cache_dir` or a non-zero
`cpu_offload_layers` value fails closed. Standard Transformers `device_map`
behavior is not evidence of either advertised legacy capability.

## Supported Models

| Model ID                  | HuggingFace Mapping                      |
|---------------------------|------------------------------------------|
| `llama-3.3-70b-instruct`  | `meta-llama/Llama-3.3-70B-Instruct`      |
| `llama-3.1-8b-instruct`   | `meta-llama/Llama-3.1-8B-Instruct`       |
| `qwen3-next-80b`          | `Qwen/Qwen3-Next-80B`                    |
| `gemma3-12b`              | `google/gemma-3-12b-it`                  |
| `gpt-oss-20b`             | `gpt-oss/GPT-OSS-20B`                    |
| `voxtral-small-24b`       | `mistralai/Voxtral-Small-24B`            |

These are registry mappings, not proof that every model fits or works on the
same hardware. Each model/revision needs an artifact-verified GPU qualification
and observed memory/latency receipt before promotion.

## License

The vendored oLLM upstream library under `engine/ollm/` is MIT-licensed and
retains its license file. The surrounding Substrate integration is governed by
the repository's `LicenseRef-SZL-Proprietary` license.

## Release packaging hold

The Python dependency files currently contain version ranges and there is no
committed, hashed lock for the base or GPU dependency graph. The Dockerfile also
installs that unresolved graph. Treat the image as non-reproducible and keep
production promotion on HOLD until CI installs an exact locked graph and proves
a clean rebuild digest and SBOM. An exact Hub commit alone does not verify the
downloaded model artifact set; promotion also requires file-digest verification
and a real model/GPU execution receipt from that exact image.
