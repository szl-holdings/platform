<!-- doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header. -->
# SZL / Lutar Formula Corpus — V4 Audit

**Date:** 2026-05-05
**Author:** Stephen Paul Lutar Jr. (audit performed by the project agent)
**Scope:** every Lutar / Ouroboros / Propeller / AMI / Ξ formula present
in this monorepo and in `attached_assets/`, mapped to its canonical
implementation, with a recommendation on whether it has been "instilled"
or still lives only on paper.

---

## 1. Inventory

### 1.1 Formal papers (`papers/` — LaTeX)

| File | Formula(s) | Status |
|---|---|---|
| `paper-01-lutar-omega-formalism.tex` | `L_Ω` 7-signature physics hierarchy (`L1 = E/mc²` … `L7 = L6·𝟙[∂_tQ=0]`), Bekenstein gate, ICRC, sacred-geometry coherence | **Instilled** as `lib/lutar-formulas/src/omega.ts → physicsSignatures()` |
| `paper-02-prisca-graphrag.tex` | Prisca GraphRAG retrieval coupling | Not yet ported (out of scope for this audit) |
| `paper-03-hermetic-ai-safety.tex` | Hermetic safety axioms feeding Λ | Referenced by `lutar.ts` axiom block |
| `paper-04-sefirot-kabbalah-hopfield.tex` | Sefirot ↔ Hopfield mapping | Theory only |
| `paper-05-free-energy-predictive-coding.tex` | Friston FE ↔ `L4` coupling | Documented in `omega.ts` header |
| `paper-06-tawa-sae-interpretability.tex` | Tawa sparse-autoencoder probe | Theory only |
| `paper-07-epr-bell-sacred-geometry.tex` | EPR/Bell ↔ sacred-geometry phase | Theory only |
| `paper-08-scaling-grokking-bifurcation.tex` | Scaling-law bifurcation | Theory only |
| `paper-09-propeller-sota-routing.tex` | `P_Λ = ρ_I · A_ω · Δv_L · 2/(1+v_out/v_in) · cosθ` | **Instilled** as `lib/lutar-formulas/src/propeller.ts` |
| `paper-10-ultra-routing-xi-unification.tex` | `Ξ = L_Ω · P_Λ · σ(Ā_lang) · 1/(1+H_dialog)` | **Instilled** as `lib/lutar-formulas/src/xi.ts` and `router.ts` |

### 1.2 Reference implementations (`vendor/ouroboros-py/`)

| Path | Formula | Status |
|---|---|---|
| `ouroboros/invariant.py` | `Λ = C^α H^β R^γ F^δ` (4-axis) and `Λ₅` (5-axis with Gauß closure G) | **Ported** to `lib/lutar-formulas/src/lutar.ts` (TypeScript) — Egyptian-fraction decomposition reproduced bit-for-bit using Fibonacci–Sylvester + bigint reconstruction |
| `ouroboros/thales.py` | Thales/closure invariant on outcome graphs | Not yet ported (Python-only — scoring service) |
| `ouroboros/reconciliation.py` | Egyptian-fraction primitives | Logic re-implemented in `lutar.ts` (`decomposeUnitFraction`, `reconstructFraction`) |
| `examples/lutar_demo.py` | Worked Λ example | Mirrored in `lib/lutar-formulas/README.md` |

### 1.3 Attached payloads (`attached_assets/Pasted-…`)

These are large one-file Python payloads from earlier ideation
sessions. Their formulas are now consolidated into the TS package.

| Payload (timestamp) | Formula(s) extracted | Where it lives now |
|---|---|---|
| `…A11OY-ULTRA-…1777887104332` | `L1..L6`, `MODES`, `propeller`, `A_lang`, `RouteDecision` | `omega.ts`, `propeller.ts`, `arbitrage.ts`, `router.ts` |
| `…A11OY-CHAT-ULTRA-…1777888540816..659065` (4 versions, latest = 659065) | + `Ξ` (Xi), `dialog_entropy`, `MODES.chat`, agent handoffs | `xi.ts`, `router.ts`, `OMEGA_MODES.chat` |
| `…A11OY-PROPELLER-DRIVE-…1777886376560` | `P_Λ` initial ideation | `propeller.ts` (with notes preserved) |
| `…A11OY-STATE-OF-THE-ART-…1777886007968 / 1777886396038` | Lutar-Omega sketch | `omega.ts` |
| `…a11oy-master-v1-v32-py-…1777882803661` | Aggregated v1..v32 evolution | Notes folded into `omega.ts` MODES table |
| `…A11OY-CODEX-UNLOCK-EVOLVED-…1777962757870` | Codex unlock probe | `research/codex-unlock/a11oy_codex_unlock_v2.py` (already in repo) |
| `…A11OY-AMI-FORMULA-PAYLOAD-…1777963715032 / 1777965282341` | `AMI_v2 = (Λ^.22 K^.16 W^.16 T^.14 M^.14 E^.10 P^.08)·e^(-0.7N - 0.5D)·G` | **Not instilled** — see §3 |

### 1.4 Other in-repo references

* `dossier/zenodo/papers_v3_ouroboros-thesis-v3.md` — narrative ground for Λ axioms; quoted in `lutar.ts` header.
* `dossier/zenodo/V4_OUTLINE.md` — outline this audit fulfils for Section 4.
* `lib/a11oy-fabric/src/schema.ts` — Pydantic-equivalent zod shapes for `BusinessSignal`, `Outcome`, etc. — not mathematical, not duplicated here.
* `lib/a11oy-fabric-py/` — Python substrate; `pyproject.toml` was previously contaminated with an `a11oy-ami` console script (now removed).

---

## 2. Cross-formula coupling map

```
                  ┌─────────────────────┐
                  │  evidence axes      │
                  │  (C, H, R, F, G)    │
                  └──────────┬──────────┘
                             │  lutar.ts
                             ▼
                       Λ  /  Λ₅  ────────────┐
                                              │ feeds "trust" axis
                                              ▼
   model · query  ──► omega.ts ──► L_Ω ──► router.ts (Ξ)
        │                                     ▲ ▲
        │                                     │ │
        ├────► propeller.ts ──► P_Λ ──────────┘ │
        │                                       │
        └────► arbitrage.ts ──► A_lang ──┬──────┘
                                          │
                                  σ(Ā_lang) multiplier
                                          │
                                          ▼
                          chat history ──► dialogEntropy
                                          │
                                  1/(1 + H) turn weight
```

`Ξ` is therefore the keystone: it is the only score that touches every
other formula. Maximising Ξ is the canonical "best decision" criterion
for any agentic loop in the platform.

---

## 3. Recommendations

### Adopt
1. **`@workspace/lutar-formulas`** as the canonical home for every
   formula above. All future product code should import from it.
2. **Ξ as the routing knob** — every artifact's "Choose model" call
   should go through `routeWithXi(models, req)`. Sentra's
   sentient-layer cards can render the resulting `decision.reason`
   string verbatim.
3. **Λ₅ for evidence trust badges** — replace ad-hoc "trust %"
   numbers with the bound-witnessed `lutarInvariant5(...).invariant`.

### Defer
1. **AMI formula payload (v1.0).** Useful as an external scoring tool
   but does not belong in product code (it scans a repo for evidence
   knots and emits a permission gate). Keep it as a CLI-only artifact
   in a separate repo, or add it under `scripts/` if you want it
   accessible from the Replit shell — but **not** as a library
   dependency.
2. **Physics `L_Ω` (paper-01).** Implemented for completeness in
   `omega.ts → physicsSignatures()`, but no product surface should
   depend on it until an experimental platform exists. Treat as
   reference, not runtime.

### Investigate
1. **Thales closure (`vendor/ouroboros-py/ouroboros/thales.py`).**
   The only formula not yet on the TS side. Worth porting once the
   Outcome graph in `lib/a11oy-fabric` is wired live.
2. **Prisca GraphRAG (paper-02).** When a real retrieval stack is
   built (likely as a fork of FlexCache + outcome-graph), reify the
   coupling constants as a new module `lib/lutar-formulas/src/prisca.ts`.

---

## 4. Provenance & reproducibility

* Every TypeScript symbol in `lib/lutar-formulas/` carries a header
  comment naming the originating paper or payload file.
* Egyptian-fraction tests live in the `vendor/ouroboros-py/tests/`
  invariant suite; the TypeScript port is byte-equivalent on the
  reference vector `(0.92, 0.81, 0.74, 0.88, 0.79)`.
* This audit document is versioned as part of the dossier and should be
  cited in any future Zenodo upload as the V4 implementation appendix.

---

## 5. What was *not* in scope

* Replicating the LaTeX papers as MDX/static pages.
* Building a UI explorer for the formulas (`apps/lutar-explorer` is a
  reasonable follow-up but is not implied by this audit).
* Re-running the AMI scoring tool against the live monorepo.
* Sentra's product-level UI overhaul (tracked separately as task
  #4749 + the existing "Investor zoom-out audit" follow-up).
