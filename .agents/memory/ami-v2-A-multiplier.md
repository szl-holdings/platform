---
name: AMI v2 Adversarial Resistance multiplier
description: How the antivenom A factor is wired into the AMI gate and why critical matches must hard-BLOCK rather than down-weight.
---

The AMI v2 score is the seven-axis geometric mean multiplied by `e^(-0.7N - 0.5D) · G · A`, where `A ∈ [0.10, 1.00]` is the antivenom Adversarial Resistance multiplier. Catalogue penalties are applied **once per family** (not once per regex hit) so two patterns from the same family can't compound against each other.

**Why:** without the family-dedup, a single jailbreak with many synonyms drives `A → 0` and floods governance with cascading BLOCKs that look like a fabric bug. The fix is structural — do not "tune" the penalties, dedup at the family level.

**How to apply:**
- Treat `A ≤ 0.15` as a hard gate: the AMI evaluator returns `gate = BLOCK` regardless of the other seven axes. Do **not** rely on the geometric mean alone to drag the score under the BLOCK threshold; the multiplier can be partially offset by a high Λ axis and the call slips through.
- The antivenom fabric is on the chat **hot path** — call `match()` synchronously per user turn, never spawn it async. It returns `{ adversarialResistance: 1, matches: [] }` when input is empty, so the hot-path cost when nothing matches is one regex scan per entry.
- The forced-block branch lives in `artifacts/api-server/src/a11oy/formulas/ami-formula.ts::evaluateChatAmi` — any new caller (sentra-cortex-api re-imports a separate copy) must be updated in lockstep or the gate decoheres across surfaces.
