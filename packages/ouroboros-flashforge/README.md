# @workspace/flashforge

Kernel-discipline primitives 61-64. Conceptually adapted (not derived in code) from
the architectural ideas behind FlashInfer (high-performance GPU kernel library for LLM
serving). FlashInfer is Apache 2.0; we reimplement the concepts as Ouroboros primitives
applied to general invariant-preserving computation, not GPU kernels.

## Primitives

- 61 capability-matrix — admissibility of an operation across declared targets
- 62 backend-arbiter — deterministic backend selection given a capability matrix and policy
- 63 jit-cache — receipted memoization of compiled artifacts with provenance
- 64 aot-prebuild — declared pre-compile manifest with verifiable coverage

## Inspiration

FlashInfer (NVIDIA + community, Apache 2.0) — `https://github.com/flashinfer-ai/flashinfer`
Windows port — `https://github.com/SystemPanic/flashinfer-windows`

We borrowed three architectural ideas:

1. A capability matrix that maps (operation, target) to admissibility (their SM75-SM12.0+ table).
2. A multi-backend arbiter that picks the best implementation per (op, target) pair.
3. The split between JIT (compile on first use, cache) and AOT (pre-built, ship binaries).

We did NOT copy code, kernels, headers, build scripts, or wheels. This package is original
TypeScript that lifts those ideas to a generic invariant-preserving substrate.
