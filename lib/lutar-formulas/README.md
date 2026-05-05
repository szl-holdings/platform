# @workspace/lutar-formulas

Canonical TypeScript implementations of the **SZL / Lutar formula corpus**, consolidating work that was previously scattered across `papers/`, `vendor/ouroboros-py/`, `lib/a11oy-fabric*/` and a number of Python payloads in `attached_assets/`.

> Authored by Stephen Paul Lutar Jr. — SZL Consulting Ltd. CC BY 4.0.
> Companion papers: [v1](https://doi.org/10.5281/zenodo.19867281), [v2](https://doi.org/10.5281/zenodo.19944926), v3 (Lutar Invariant), v4 (Omega).

## What's inside

| Module | Formula | Source |
|---|---|---|
| `lutar.ts` | `Λ = C^α · H^β · R^γ · F^δ` and `Λ₅ = Λ · G^ε` | `vendor/ouroboros-py/ouroboros/invariant.py` |
| `omega.ts` | Operational `L_Ω = Σ wᵢ Lᵢ` (L1..L6) **and** physics `L_Ω` (L1..L7) | `papers/paper-01-lutar-omega-formalism.tex` + A11oy Ultra payload |
| `propeller.ts` | `P_Λ = ρ_I · A_ω · Δv_L · 2/(1 + v_out/v_in) · cos θ` | `papers/paper-09-propeller-sota-routing.tex` |
| `arbitrage.ts` | `A_lang = (T_py/T_ts)(M_ts/M_py) · L4_lib · cos θ_role − κ` | A11oy Ultra payload |
| `xi.ts` | `Ξ = L_Ω · P_Λ · σ(Ā_lang) · 1/(1 + H_dialog)` | `papers/paper-10-ultra-routing-xi-unification.tex` |
| `router.ts` | `routeWithXi(models, req)` — picks the Ξ-maximising model | derived |

Every public function is pure, dependency-free, and works in browsers, edge runtimes, Node, and the Vite dev server alike.

## Why this package exists

Before this package, the formulas existed in five different forms:

1. As LaTeX in `papers/` (academic, not callable).
2. As a Python invariant in `vendor/ouroboros-py/` (Λ only, server-side).
3. As inline copies inside half a dozen one-file Python payloads in `attached_assets/` (not on the import path).
4. As scattered TS in `lib/a11oy-fabric/` (only the seed shapes, not the math).
5. As implicit logic in product code (Sentra, Rosie) that could never be cited.

Consolidating them removes the drift, lets every artifact import the *same* `Λ`, and makes the formulas inspectable from a single audit surface.

## Quick start

```ts
import {
  lutarInvariant5,
  routeWithXi,
  type RouterModel,
} from '@workspace/lutar-formulas';

// 1. Trust score for a piece of evidence
const report = lutarInvariant5({
  cleanliness: 0.92,
  horizon: 0.81,
  resonance: 0.74,
  frustum: 0.88,
  gaussClosure: 0.79,
});
console.log(report.invariant, report.proof.formula);

// 2. Route a chat turn with the Ξ-maximising model
const models: RouterModel[] = [
  { id: 'gpt-5.5', intelligence: 60, tps: 120, context: 400_000,
    inputCost: 1.25, outputCost: 10, batchDiscount: 0.5,
    strengths: ['reasoning', 'chat'], persona: 'polymath' },
  { id: 'kimi-k2.6', intelligence: 54, tps: 140, context: 262_000,
    inputCost: 0.55, outputCost: 2.20, batchDiscount: 0,
    strengths: ['math', 'chat'], persona: 'open-weight' },
];
const decision = routeWithXi(models, { prompt: 'hello', mode: 'chat' });
console.log(decision.modelId, decision.reason);
```

## Mathematical guarantees

* **Egyptian inspectability (A3).** All Λ weights decompose into distinct unit fractions via greedy Fibonacci–Sylvester. `verifyLutarBound` witnesses `0 ≤ Λ ≤ min(axes) ≤ max(axes) ≤ 1` for any report.
* **Zero-pinning (A2).** A single zero axis collapses Λ to 0.
* **Simplex weights.** `OMEGA_MODES` presets all sum to 1 (validated by `isSimplex`).
* **Cosine bound.** `cosineSim` clamps to `[-1, 1]` by construction.
