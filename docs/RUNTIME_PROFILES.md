# Precision Evolution Runtime — Runtime Profiles

> Honest capability detection: PER never claims acceleration it cannot verify.

## Philosophy

A system that silently falls back from FP8 to CPU without telling the operator is
deceptive. PER makes the active precision profile explicit at every level:

- The capability detector logs its decision at startup
- The Diagnostics UI surfaces profile, device flags, and backend health
- All simulated telemetry is labelled `simulated: true`
- The `PRECISION_PROFILE` env var is sanity-checked against detected hardware;
  if the override is impossible, PER falls back to `cpu_safe` and logs a warning

---

## Profile Reference

### `cpu_safe` (default on Replit)

- Execution: CPU, single-process, no special hardware
- Throughput: ~10–50 tok/s (estimate; workload-dependent)
- Cache: in-memory, LRU
- Use for: development, demo, CI, Replit deployments

### `cuda_bf16`

- Requires: NVIDIA GPU (Ampere series or later, i.e. RTX 3090, A100, …)
- CUDA visible: `nvidia-smi` must show a device
- BF16 tensor cores available
- Throughput: ~1,000–5,000 tok/s depending on model size and batch

### `cuda_fp8_linear`

- Requires: NVIDIA Hopper architecture (H100 / H200)
- FP8 linear layers via Transformer Engine or equivalent
- Throughput: up to 2× BF16 on compatible workloads

### `cuda_fp8_linear_kv`

- Requires: NVIDIA Hopper (H100 / H200)
- FP8 linear layers + KV-cache quantisation
- Best throughput for long-context inference

### `remote_accelerated`

- Execution offloaded to a remote GPU service
- Requires: `REMOTE_INFERENCE_HEALTH_URL` and `REMOTE_INFERENCE_URL`
- The capability detector pings the health endpoint; if unhealthy, falls back to `cpu_safe`
- Adapter: `NvidiaInferenceAdapter`

### `future_blackwell_path`

- Reserved for NVIDIA Blackwell (B100 / B200) when available
- Not yet activated in any adapter
- Capability detector will auto-select if Blackwell hardware is detected

---

## Detection Logic

```
detectCapabilities()
  1. If EVOLUTION_MODE=simulation:
       Skip all hardware checks; return cpu_safe with simulated=true
  2. Run: nvidia-smi --query-gpu=name --format=csv,noheader
       If fails → cudaAvailable=false
       If succeeds → cudaAvailable=true
  3. If cudaAvailable:
       Run: nvidia-smi --query-gpu=compute_cap --format=csv,noheader
       compute_cap >= 8.0 → bf16Supported=true (Ampere or later)
       compute_cap >= 9.0 → fp8Supported=true (Hopper or later)
  4. If INFERENCE_BACKEND=nvidia_nim or PRECISION_PROFILE=remote_accelerated:
       GET REMOTE_INFERENCE_HEALTH_URL → set remoteBackendHealthy
  5. Select profile (highest available):
       fp8Supported → cuda_fp8_linear
       bf16Supported → cuda_bf16
       remoteHealthy → remote_accelerated
       default → cpu_safe
  6. If PRECISION_PROFILE env override is set:
       Validate override is achievable given detected capabilities
       Warn and fall back to cpu_safe if hardware unavailable
  7. Return CapabilitySnapshot object
```

### Current Scope Note

BF16 and FP8 detection uses `nvidia-smi --query-gpu=compute_cap` to inspect compute capability (8.0+ for BF16, 9.0+ for Hopper FP8). This covers the standard verification path. When running in simulation mode, all hardware flags are skipped and the snapshot is marked `simulated: true`.

---

## Env Override

```
PRECISION_PROFILE=cpu_safe   # safe default — always works
PRECISION_PROFILE=cuda_bf16  # only valid if CUDA Ampere hardware is present
```

Attempting to force `cuda_fp8_linear` on a Replit CPU environment will:
1. Log a warning: `PRECISION_PROFILE override 'cuda_fp8_linear' not achievable; falling back to cpu_safe`
2. Set active profile to `cpu_safe`
3. Mark `simulated: true` in runtime health snapshot

---

## Adding a New Profile

1. Add the profile string to the union type in `packages/evolution-core/src/capability/index.ts`
2. Add detection logic in `detectCapabilities()`
3. Add a matching adapter in `packages/evolution-core/src/adapters/`
4. Add a description row to this document and to `PRECISION_EVOLUTION_ARCHITECTURE.md`
5. Add the profile to the Diagnostics page description map
