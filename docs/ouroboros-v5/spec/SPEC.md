# Horizon Specification v0.1

This document is the contract between Horizon (the package) and any
Ouroboros surface (A11oy, Sentra, Amaru, future surfaces) that adopts it.

The contract is what makes the platform composable. If two surfaces both
emit Horizon primitives, they can interoperate without bespoke adapters.

---

## Five primitives

### 1. PageCurveInvariant — information conservation across a loop's lifetime

**Physics anchor.** Don Page (1993) showed the entropy of a subsystem of
dimension `D_A` of a random pure state in total dimension `D` is, on average,

  S_avg ≈ ln(D_A) − D_A² / (2 D)

For an evaporating black hole this implies the Hawking radiation entropy
rises, peaks near `D_A = √D`, and falls back to zero as the hole evaporates.
The turnover is the fingerprint of unitary (information-preserving) dynamics.

**Computational analog.** A bounded loop emits an externally-observable
state stream and an environment state stream. The runtime computes the
mutual information `I(L; E) = H(L) + H(E) − H(L, E)` in a sliding window.
A clean close requires:

1. There exists a unique tick `t*` (Page tick) at which entropy peaks.
2. The entropy series is non-decreasing on `[t_0, t*]` (within tolerance ε_m).
3. The entropy series is non-increasing on `[t*, t_close]` (within ε_m).
4. The residual entropy at `t_close` satisfies `S(t_close) ≤ ε`.

**Defaults.** ε = 0.05 bits, ε_m = 0.02 bits, window = 64 ticks.

**Failure mode.** A loop that closes with residual > ε is a **dirty close**:
it left state somewhere that was not reconciled. Sentra treats this as an
anomaly. Amaru flags it for replay.

### 2. NoHairContract — five-scalar canonical interface

**Physics anchor.** No-hair theorem (Israel/Carter/Robinson, 1967–1975):
a stationary black hole has exactly three observables — mass `M`, charge
`Q`, angular momentum `J`. All other information is invisible from outside.

**Computational analog.** Every closed loop exposes exactly:

| Field    | Type       | Meaning                                              |
|----------|------------|------------------------------------------------------|
| `mass`   | number ≥ 0 | Bounded work in normalized cost units                |
| `charge` | number     | Net policy obligation (signed; − = discharged)       |
| `spin`   | number ≥ 0 | Shannon entropy of input distribution, in bits       |
| `tier`   | 1 \| 2 \| 3 \| 4 | Risk tier at close                              |
| `hash`   | sha256 hex | Hash of the closed witness chain head                |

Wire form: `nohair/v1|mass=12.5|charge=-3|spin=2.31|tier=2|hash=…`.

**Composition rule.** Two loops compose iff:
- their tiers are compatible (same or `caller.tier <= callee.tier`),
- the caller's external-observable witness entries match the callee's
  expected inputs (verified by Sentra's inbound contract),
- the resulting composite no-hair state is a deterministic function of
  the components (no hidden state across the boundary).

### 3. DualWitness — internal/external complementarity

**Physics anchor.** Black-hole complementarity (Susskind, 't Hooft, ~1993):
infalling and external observers have two valid, mutually contradictory
descriptions; no single observer collects both.

**Computational analog.** Every loop maintains two hash-chained witness
chains:
- **internal:** first-person reasoning trace, including counterfactuals
- **external:** auditor's third-person trace — tool calls, side effects

**Consistency theorem.** For every internal entry with
`externallyObservable = true`, an external entry must exist within
`windowTicks` of it whose `(kind, payload-subset)` matches the internal claim.

**Failure mode.** A `complementarity violation` is an orphaned internal
claim with no matching external witness — proof of agent dishonesty or
system tampering.

### 4. EntanglementMetric — empirical loop-coupling graph

**Physics anchor.** Ryu-Takayanagi (2006): boundary entanglement entropy
equals minimal bulk surface area / (4 G_N). Entanglement is geometric.

**Computational analog.** For two loops `ℓ₁, ℓ₂`,

  S_ent(ℓ₁, ℓ₂) = H(ℓ₁) + H(ℓ₂) − H(ℓ₁, ℓ₂)

A11oy builds a weighted entanglement graph at runtime. Operations supported:
- `expectedDecoupled(a, b)` — fail when `S_ent > decoupledMaxBits` (default 0.1)
- `expectedCoupled(a, b)` — fail when `S_ent < coupledMinBits` (default 0.5)
- variation-of-information distance `d = H(L,E) − I(L;E)` is a true metric.

### 5. CapacityHorizon — holographic capacity bound

**Physics anchor.** Bekenstein-Hawking: `S_BH = A / (4 ℓ_P²)`. Maximum
information in a region is bounded by its boundary area, not its volume.

**Computational analog.** Capacity in bits per tick:

  C(ℓ) = α · |∂ℓ| · log₂(1 + T_ℓ / T_min)

where `|∂ℓ|` is the boundary cardinality (distinct integration points) and
`T_ℓ / T_min` is the throughput ratio. Schedule recommendation:

| Margin = observed − C(ℓ) | Recommendation |
|--------------------------|----------------|
| > +0.5 bits              | SPLIT          |
| within ±0.5 bits         | STEADY         |
| < −0.5 bits              | MERGE          |

---

## Versioning

Wire-level format strings carry a version prefix (`nohair/v1|…`). Bumping
to v2 is allowed only when the field set changes. Field reordering is not
a breaking change as long as the v-prefix is bumped.

The TypeScript types follow semver. Pre-1.0, every release is treated as
potentially breaking; consumers should pin exact versions.

---

## Constants and defaults (canonical)

```
PAGE_CURVE_EPSILON_DEFAULT       = 0.05 bits
PAGE_CURVE_MONOTONICITY_TOL      = 0.02 bits
PAGE_CURVE_WINDOW_DEFAULT        = 64 ticks
DUAL_WITNESS_WINDOW_TICKS        = 100
ENTANGLEMENT_DECOUPLED_MAX_BITS  = 0.1
ENTANGLEMENT_COUPLED_MIN_BITS    = 0.5
HORIZON_BAND_BITS                = 0.5
HORIZON_ALPHA_DEFAULT            = 1.0
GENESIS_HASH                     = "0" × 64
```

These are tunable per loop, but the runtime uses these values as the
operational baseline. Changes require a Falsification Ledger entry.
