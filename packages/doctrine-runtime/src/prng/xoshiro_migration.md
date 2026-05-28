# xoshiro256** Migration Guide

## Overview

This document describes the migration from legacy `Math.random()` and `node:crypto`-seeded
ad-hoc LCG nonces to the **xoshiro256\*\*** PRNG defined in `xoshiro256ss.ts`.

**Doctrine v6 §10.2** mandates a reproducible, statistically sound PRNG for all nonce
and simulation workloads that do not require cryptographic security.

**Reference:** Blackman, D., & Vigna, S. (2021). *Scrambled Linear Pseudorandom Number
Generators.* ACM TOMS 47(4). doi:[10.1145/3460772](https://doi.org/10.1145/3460772)

---

## When to Use xoshiro256** vs. `node:crypto`

| Use case | Generator |
|---|---|
| Policy nonce / simulation / shuffle | `xoshiro256ss.ts` |
| Session tokens, API keys, secrets | `node:crypto.randomBytes()` |
| Test determinism / reproducibility | `xoshiro256ss.ts` (with fixed seed) |
| Key material / TLS | `node:crypto` only |

xoshiro256** **is not cryptographically secure** — it passes statistical tests but
its state can be reconstructed from output [1]. Never use it for secret generation.

---

## Migration Steps

### 1. Replace `Math.random()`

**Before:**
```typescript
const jitter = Math.random() * 100;
```

**After:**
```typescript
import { Xoshiro256StarStar } from "../prng/xoshiro256ss.js";
const prng = new Xoshiro256StarStar(Date.now());
const jitter = prng.nextFloat() * 100;
```

For reproducible tests, pass a fixed seed:
```typescript
const prng = new Xoshiro256StarStar(42n);
```

---

### 2. Replace ad-hoc LCG / seeded hash nonces

**Before:**
```typescript
function weakNonce(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0; // LCG — fails statistical tests
}
```

**After:**
```typescript
import { Xoshiro256StarStar } from "../prng/xoshiro256ss.js";
const g = new Xoshiro256StarStar(seed);
const nonce = g.nextUint32();
```

---

### 3. Parallel streams via `jump()`

For multi-threaded / worker-pool simulations, initialise one generator per
worker using `jump()` so streams are guaranteed non-overlapping (2^128-step gap):

```typescript
import { Xoshiro256StarStar } from "../prng/xoshiro256ss.js";

const WORKER_COUNT = 8;
const generators: Xoshiro256StarStar[] = [];
const root = new Xoshiro256StarStar(masterSeed);
for (let i = 0; i < WORKER_COUNT; i++) {
  generators.push(new Xoshiro256StarStar(root.getState().s0));
  root.jump();
}
```

Each `generators[i]` produces a statistically independent stream.

---

### 4. Serialise / restore state for reproducibility

```typescript
const g = new Xoshiro256StarStar(seed);
// ...advance...
const checkpoint = g.getState();          // save
// ...continue...
g.setState(checkpoint);                   // restore — replay from checkpoint
```

Serialise `checkpoint` to JSON (all four fields are `bigint`; use `.toString()`
for JSON and `BigInt(str)` to restore).

---

### 5. Filling byte buffers

```typescript
const buf = new Uint8Array(32);
g.fillBytes(buf);
// buf is now filled with pseudo-random bytes (little-endian uint64 chunks)
```

---

## Statistical Properties (per [1])

| Property | xoshiro256** |
|---|---|
| State size | 256 bits |
| Period | 2^256 − 1 |
| BigCrush | Passes all tests |
| PractRand | Passes to ≥ 32 TiB |
| Equidistribution | 64-bit, order 4 |
| Jump polynomial | 2^128 steps |

---

## Known-Answer Test Vectors

See `xoshiro_kat.test.ts` (15 tests) for self-consistency regression vectors.
Run with:

```bash
npx tsx --test runtime/prng/xoshiro_kat.test.ts
```

---

## References

1. Blackman, D., & Vigna, S. (2021). Scrambled Linear Pseudorandom Number Generators.
   *ACM Transactions on Mathematical Software*, 47(4), 1–32.
   doi:[10.1145/3460772](https://doi.org/10.1145/3460772)

2. Vigna, S. Reference C implementation (public domain).
   https://prng.di.unimi.it/xoshiro256starstar.c

3. Doctrine v6 §10.2 "PRNG selection for nonce generation" (internal).
