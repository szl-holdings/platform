# Dependency lock evidence

The image has separate, hash-enforced dependency graphs:

- `requirements-base.lock`: Python 3.14 development-only CPU stub.
- `requirements-gpu.lock`: Python 3.11, Linux x86-64, CUDA 13.0 runtime.
- `requirements-flash-attn.lock`: optional FlashAttention source-build delta.

The default GPU graph deliberately uses PyTorch SDPA. FlashAttention is only
installed when `SUBSTRATE_INSTALL_FLASH_ATTN=1`; a requested build fails closed
if its locked source artifact cannot compile.

The Python metadata mirrors that boundary: `.[gpu]` installs the default graph,
while FlashAttention requires the additional `.[flash-attn]` extra.

## Regeneration

Use `uv==0.12.19`. Resolve each lock from an empty cache so cached index
metadata cannot change the allowed artifact set:

```bash
cd apps/substrate-inference

UV_CACHE_DIR="$(mktemp -d)" uv pip compile requirements-base.in \
  --python-version 3.14 \
  --python-platform x86_64-manylinux_2_28 \
  --generate-hashes \
  --emit-index-url \
  --emit-index-annotation \
  --output-file requirements-base.lock

UV_CACHE_DIR="$(mktemp -d)" uv pip compile requirements-gpu.in \
  --python-version 3.11 \
  --python-platform x86_64-manylinux_2_28 \
  --torch-backend cu130 \
  --extra-index-url https://download.pytorch.org/whl/cu130 \
  --generate-hashes \
  --emit-index-url \
  --emit-index-annotation \
  --output-file requirements-gpu.lock

UV_CACHE_DIR="$(mktemp -d)" uv pip compile requirements-flash-attn.in \
  --python-version 3.11 \
  --python-platform x86_64-manylinux_2_28 \
  --no-deps \
  --generate-hashes \
  --emit-index-url \
  --emit-index-annotation \
  --output-file requirements-flash-attn.lock

sha256sum requirements-base.lock requirements-flash-attn.lock \
  requirements-gpu.lock > requirements-locks.sha256
python scripts/verify_dependency_locks.py
```

`requirements-flash-attn.in` names `einops` explicitly because the optional
delta is compiled without dependencies and installed after the complete GPU
lock. Its other runtime dependency, `torch`, is already present in that graph.

CI verifies declarations, exact pins, artifact hashes, index policy, lock
digests, and Docker's `--require-hashes` installs. It emits deterministic
CycloneDX documents for the default and FlashAttention variants, records their
SHA-256 digests, and uploads all three files as one review artifact.
