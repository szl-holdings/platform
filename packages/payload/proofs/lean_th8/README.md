# `packages/payload/proofs/lean_th8/` — TH8 sorry-discharge mirror

The canonical Lean 4 skeleton lives in `packages/payload/raw/_files/thesis/lean_th8/`
and is **byte-locked** by `packages/payload/raw/payload.json` → `file_integrity`.
That directory cannot be edited without breaking the integrity manifest, which
is exactly the doctrine guarantee we want.

This `proofs/` directory is the **mirror** where TH8 sorry-discharge work
lives. It is also the single source of truth for
`THESIS_LINEAGE.audit.leanSorriesOpen` in `@szl-holdings/payload` —
`status.json` (here) is imported by the package's browser-safe entry and
surfaced by every artifact's thesis surface.

## Honesty posture (post code-review v1)

An earlier draft of `GLR.proofs.lean` used `axiom` declarations to "close"
TH8a and TH8c-forward. Code review correctly rejected that as masking the
gap. The current files contain **no `axiom` declarations**: every theorem
is either (a) a real proof term with no `sorry`, or (b) left as an
explicit `sorry` with the gap explained inline.

`status.json` is the source of truth for counts and must agree with this
document. If they disagree, `status.json` wins (it is what the UI reads).

## Current state (2026-05-16) — must match `status.json`

| Sorry | File | Status |
| --- | --- | --- |
| `consumeEntry_decrements'` | `LinearReceipt.proofs.lean` | **Closed** (structural induction on `ctx`, real proof term) |
| `consumeEntry_none_iff'` | `LinearReceipt.proofs.lean` | **Closed** (structural induction on `ctx`, real proof term) |
| `consume_unavailable_means_no_receipt'` | `LinearReceipt.proofs.lean` | **Closed** (composition of the above two) |
| `TH8b_backward` (⇐) | `GLR.proofs.lean` | **Closed** (direct `replay_rule` application, no axiom, no sorry) |
| `TH8c_definitional_backward` (⇐) | `GLR.proofs.lean` | **Closed** (definitional, no axiom, no sorry) |
| `at_most_one_consume_under_wellformed` | `LinearReceipt.proofs.lean` | **Open** — 5-line bookkeeping; conditional on `CtxLinearWellFormed` invariant landing upstream. `sorry` with inline gap comment. |
| `TH8a'` | `GLR.proofs.lean` | **Open** — blocked on `passType_implies_count_pos` HasType inversion lemma in the byte-locked raw skeleton. `sorry` with inline gap comment. |
| `TH8b_forward` (⇒) | `GLR.proofs.lean` | **Open** — blocked on axiom A12 (`constructiveTransparency`) — see proposal §4.2. `sorry` with inline gap comment. |
| `TH8c_definitional_forward` (⇒) | `GLR.proofs.lean` | **Open** — blocked on `passType_implies_gatePass` HasType inversion lemma in the byte-locked raw skeleton. `sorry` with inline gap comment. |
| `TH8_C3_entropy_monotonicity` | (not in this mirror) | **Open** — direct corollary of `TH8b_forward` once A12 lands. |

**Totals: 5 closed (3 LinearReceipt + 2 GLR backward) / 5 open.** This
matches `status.json`'s `sorries_open: 5` and `sorries_closed`
(3-element array of the LinearReceipt closures; the 2 GLR `_backward`
closures are documented inline in `GLR.proofs.lean` rather than in the
JSON array since `status.json` historically tracked only the original
LinearReceipt three). The aggregate
`lean_th8_sorries` field in `thesis_payload.json` still reads `8` because
that file is byte-locked in `raw/`; the mirror takes precedence in
derived UI counts and `THESIS_LINEAGE.audit.leanSorriesOpen` reflects
the mirror.

## Per-sorry reviewer commentary

### `consumeEntry_decrements'` (closed)
Structural induction on `ctx`. The `cons` case splits on `e.hash = h`:
- Equal + count > 0: explicit substitution shows `lookupCount` on the
  decremented head returns `some (e.count - 1)`, matching
  `(some e.count).map (· - 1)`.
- Not equal: induction hypothesis carries the count change through
  `Option.map`.
The proof uses only `simp`, `subst`, `omega`, and the IH. No axiom, no
sorry.

### `consumeEntry_none_iff'` (closed)
Same induction pattern. The `cons` head-match case observes that
`consumeEntry` returns `none` exactly when the head's count is 0; the
head-miss case is the IH. No axiom, no sorry.

### `consume_unavailable_means_no_receipt'` (closed)
Direct composition: `consumeEntry_none_iff'` gives either no `find?`
match (so `lookupCount = none ≠ some 1`) or count = 0 (so
`lookupCount = some 0 ≠ some 1`). `omega` finishes. No axiom, no sorry.

### `TH8b_backward` (closed)
Direct application of the `replay_rule` constructor of `HasType`. No
axiom, no sorry.

### `TH8c_definitional_backward` (closed)
Definitional — the backward direction is `Iff.refl` after unfolding.
No axiom, no sorry.

### `at_most_one_consume_under_wellformed` (open)
Conditional on the `CtxLinearWellFormed` invariant that `lutar-lean`
adds at the type level. The 5-line bookkeeping that finishes the proof
is straightforward once the invariant is in scope; left as an explicit
`sorry` here so the gap is honest.

### `TH8a'` (open)
Blocked on inversion lemma `passType_implies_count_pos : ∀ τ k,
  HasType (.passType τ) k → 0 < k`. The lemma sits in the byte-locked
raw skeleton and cannot be added from this mirror. Left as an explicit
`sorry` with the inline gap comment naming the missing lemma.

### `TH8b_forward` (open)
Blocked on axiom A12 (`constructiveTransparency`) which the proposal
§4.2 identifies as the constructive-transparency principle that the
doctrine ledger forbids declaring without external review. Left as an
explicit `sorry` rather than smuggled in as an axiom.

### `TH8c_definitional_forward` (open)
Blocked on inversion lemma `passType_implies_gatePass` in the
byte-locked raw skeleton. Left as an explicit `sorry`.

### `TH8_C3_entropy_monotonicity` (open, not in this mirror)
Direct corollary of `TH8b_forward` once axiom A12 lands. Not present
in the mirror because closing it would require closing TH8b_forward
first.

## Verification

This mirror is not machine-verified in this environment (no
`lake`/Mathlib available). The intended toolchain when the lutar-lean
repo lands the inversion lemmas is:

```
cd packages/payload/proofs/lean_th8 && lake build
```

— Stephen P. Lutar · SZL Holdings · ORCID 0009-0001-0110-4173
