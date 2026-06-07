# oLLM Engine — Substrate Integration Layer

This directory contains the engine runtime that bridges the Substrate Inference
FastAPI service to the upstream oLLM library.

## Architecture

```
engine/
├── __init__.py           # Public API: SubstrateRuntime, EngineMode
├── runtime.py            # Core engine bridge (oLLM ↔ Substrate)
└── README.md             # This file
```

The `SubstrateRuntime` class auto-detects the execution environment:

- **LIVE mode**: When `torch` (with CUDA) and `ollm` are both installed,
  the runtime delegates to `ollm.AutoInference` for real GPU inference,
  including model loading, chat completion, and streaming.

- **STUB mode**: When either dependency is missing (CPU-only dev, CI, etc.),
  the runtime returns clearly-labelled stub responses. All API contracts
  remain identical so the rest of the stack (Command dashboard, AI Control
  Plane, model router) can be developed and tested without GPU hardware.

## Vendoring oLLM

Run the vendor script to clone the upstream oLLM source into this directory:

```bash
cd apps/substrate-inference
./engine/vendor.sh
```

This creates `engine/ollm/` containing the pinned upstream source (default: v0.4.2).
The vendored source is `.gitignore`d to keep the repo lightweight; CI/deploy scripts
should run the vendor script as a build step.

To override the version: `OLLM_VERSION=v0.5.0 ./engine/vendor.sh`

## Production Setup

```bash
# 1. Install CUDA toolkit (driver >= 525, CUDA >= 12.1)

# 2. Vendor and install oLLM:
cd apps/substrate-inference
./engine/vendor.sh
pip install -e engine/ollm

# — or install from PyPI (if published): —
# pip install ollm==0.4.2

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
| `SUBSTRATE_CACHE_DIR`     | `~/.substrate/cache`       | SSD cache for KV offload              |
| `SUBSTRATE_MAX_CONCURRENT`| `4`                        | Max concurrent inference requests     |
| `SUBSTRATE_DEFAULT_MODEL` | *(empty)*                  | Model to auto-load at startup         |

## Supported Models

| Model ID                  | HuggingFace Mapping                      | VRAM Est. |
|---------------------------|------------------------------------------|-----------|
| `llama-3.3-70b-instruct`  | `meta-llama/Llama-3.3-70B-Instruct`      | ~8 GB     |
| `llama-3.1-8b-instruct`   | `meta-llama/Llama-3.1-8B-Instruct`       | ~5 GB     |
| `qwen3-next-80b`          | `Qwen/Qwen3-Next-80B`                    | ~6 GB     |
| `gemma3-12b`              | `google/gemma-3-12b-it`                   | ~3 GB     |
| `gpt-oss-20b`             | `gpt-oss/GPT-OSS-20B`                    | ~4 GB     |
| `voxtral-small-24b`       | `mistralai/Voxtral-Small-24B`             | ~5 GB     |

VRAM estimates are for oLLM's layer-by-layer loading with SSD-offloaded KV cache.
Actual usage depends on context length, batch size, and offload configuration.

## License

The oLLM upstream library is MIT-licensed.
The Substrate integration layer in this directory is part of the SZL Holdings codebase.
