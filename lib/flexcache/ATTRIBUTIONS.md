# Attributions

`@szl-holdings/flexcache` is an original TypeScript implementation. None of its
source code is copied from any third party. However, the core API shape and
several concepts are adapted from the following project:

## NVIDIA FlexTensor

- Repository: https://github.com/ai-dynamo/flextensor
- License: Apache License 2.0
- Copyright (c) 2025-2026, NVIDIA CORPORATION & AFFILIATES.

### What was adapted

| FlexTensor concept | FlexCache equivalent |
| --- | --- |
| `OffloadConfig` (Pydantic model) | `FlexCacheConfig` (TypeScript object) |
| `discovery_iters` / `profiling_iters` | `discoveryIters` / `profilingIters` |
| `include_patterns` / `exclude_patterns` (wildcards) | `includePatterns` / `excludePatterns` (glob-style) |
| Strategy registry (`GreedyStrategy`, `KnapsackStrategy`, `AdaptiveStrategy`) | `Strategy` union type with three implementations |
| GPU / CPU memory tiering | Hot (Map / RAM) / Warm (IndexedDB / Map) / Cold (remote loader) tiers |
| Profile persistence (save/load) | `manager.exportProfile()` / `importProfile()` |
| Lazy model init from saved profile | Pre-warm hot tier on init from prior profile |

### What was NOT carried over

- All PyTorch, CUDA, GPU memory allocation, and shared-memory IPC code.
- The Python type system, decorators, Pydantic validators.
- Tensor-specific concepts: pinned memory, layer tracing, `trap_tensor_mode`,
  knapsack-with-bytes-budget, etc. — instead we use entry-count budgeting
  and pluggable size estimators.

This adaptation is published under Apache-2.0, the same license as FlexTensor,
and the NOTICE file ships with the package as required by the license.
