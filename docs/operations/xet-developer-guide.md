# Hugging Face Xet — Developer Guide

**Owner:** Platform Engineering  
**Last updated:** 2026-05-04  
**Status:** AUTHORITATIVE

Xet is Hugging Face's chunk-deduplicated transport protocol for the Hub. It replaces the plain HTTP multipart upload/download path with content-addressed, delta-compressed transfers. For the SZL Holdings platform this means faster, cheaper model weight and dataset pulls in our Python substrate workers.

---

## Why Xet?

| Without Xet | With Xet |
|---|---|
| Every model file re-downloaded in full each run | Only changed chunks transferred (delta dedup) |
| No deduplication across model versions | Identical blocks across fine-tunes are fetched once |
| Single-threaded HTTP download | Parallel chunk transfer, saturates available bandwidth |

The Python `hf_xet` package (pulled in automatically by `huggingface_hub>=0.32.0`) handles the chunk-level protocol. The JavaScript `@huggingface/transformers` path benefits from Xet on the Hub server side automatically — no npm package exists and no client-side code change is needed.

---

## Prerequisites — `git-xet`

`git-xet` is the command-line companion that teaches Git to speak the Xet protocol for large-file pointers. Install it on your developer machine before committing any model or dataset file.

### macOS

```bash
brew install huggingface/tap/git-xet
```

### Linux (x86-64)

```bash
curl -sSL https://github.com/huggingface/xet-tools/releases/latest/download/git-xet-linux-x86_64.tar.gz \
  | tar -xz -C /usr/local/bin
```

### Windows (PowerShell)

```powershell
winget install HuggingFace.git-xet
# or download the MSI from https://github.com/huggingface/xet-tools/releases
```

### Verify

```bash
git xet --version
# git-xet X.Y.Z
```

### Activate for this repo

```bash
git xet install
```

This writes the Xet filter, diff, and merge drivers into your local `.git/config`. You only need to do this once per clone.

---

## Credentials

No new credential is required. Xet uploads and downloads authenticate using the same token already in your environment:

```
HF_TOKEN=hf_...
# or equivalently:
HUGGINGFACE_API_KEY=hf_...
```

Both variables are recognised by `hf_xet` and `git-xet`. See `docs/operations/environment-variables.md` Section 2 for the full credential reference.

---

## Committing model/dataset files

The root `.gitattributes` routes the following extensions through LFS/Xet automatically — no manual `git lfs track` step needed:

| Extension | Type |
|---|---|
| `*.safetensors` | SafeTensors model weights |
| `*.gguf` | GGUF quantised weights |
| `*.onnx` | ONNX exported models |
| `*.pt` / `*.pth` | PyTorch checkpoints |
| `*.ckpt` | Generic checkpoints |
| `*.h5` | Keras / HDF5 weights |
| `*.parquet` | Columnar dataset shards |
| `*.arrow` | Arrow dataset shards |
| `models/**/*.bin` | PyTorch/HF binary weights under `models/` |
| `datasets/**/*.bin` | Binary dataset shards under `datasets/` |

`*.bin` is **not** tracked at the root level because the extension is too broad — it matches compiled JavaScript and native binaries. The `.gitattributes` scopes `.bin` to the `models/` and `datasets/` directory trees which are the conventional locations for HuggingFace checkpoints stored in the legacy binary format. If you place `.bin` weights outside these directories, add a matching scoped pattern:

```
# in .gitattributes — add only for your specific model directory
my-custom-models/**/*.bin filter=lfs diff=lfs merge=lfs -text
```

### Recommended commit cadence

Per Hugging Face's guidance: **commit early and often** when working with large model files. Frequent incremental commits allow Xet to deduplicate across checkpoint iterations, keeping storage costs low. Avoid batching many changed weight files into a single commit.

---

## Verifying Xet attributes

After cloning or after modifying `.gitattributes`, confirm the routing is active:

```bash
git check-attr -a some-model.safetensors
# some-model.safetensors: filter: lfs
# some-model.safetensors: diff: lfs
# some-model.safetensors: merge: lfs

git check-attr -a my-dataset.parquet
# my-dataset.parquet: filter: lfs
# my-dataset.parquet: diff: lfs
# my-dataset.parquet: merge: lfs
```

---

## Python service startup check

The two Python substrate services (`workers/substrate-python`, `services/substrate-py-workers`) import `hf_xet` at startup and log whether the Xet backend is active. Look for this line in the service logs:

```
[xet] hf_xet 0.x.y loaded — Hugging Face Xet transport active
```

If you see a warning instead:

```
[xet] WARNING: hf_xet not importable (...)
```

Re-install requirements in the affected service:

```bash
pip install -r requirements.txt
python -c "import hf_xet; print(hf_xet.__version__)"
```

---

## Out of scope

- Publishing any model to the Hub — we do not push models today; this guide covers the pull-side rails only.
- Tuning `HF_XET_*` performance environment variables — defaults are appropriate for development. For high-throughput batch inference jobs, set `HF_HUB_ENABLE_HF_TRANSFER=1` (see [HF docs](https://huggingface.co/docs/huggingface_hub/guides/download#faster-downloads)).
- Installing `git-xet` on CI — this is a developer-machine tool; CI does not commit model files.

---

*Related: `docs/THIRD_PARTY_REGISTER.md` · `docs/operations/environment-variables.md` · `infra/runbooks/RUNBOOK_SECRETS.md` · `.gitattributes`*
