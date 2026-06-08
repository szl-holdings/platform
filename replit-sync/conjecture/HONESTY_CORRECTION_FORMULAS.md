# HONESTY CORRECTION — PROVED FORMULAS = 5, NOT 8 (2026-06-04 21:09 EDT)

## Ground truth (verified directly, not delegated)
LIVE API https://szlholdings-a11oy.hf.space/api/a11oy/v1/puriq/formulas returns:
- proved_count: **5**
- sprint_proved: **[F1, F11, F12, F18, F19]**
- doctrine_v11_locked: declarations 749 / unique_axioms 14 / sorries 163 / lambda_status "Conjecture 1 (NOT a theorem)"

Lean source PuriqFormulaLean.lean header literally: "5 are PROVED in Lean 4 with NO sorry… F1,F11,F12,F18,F19. 18 remain OPEN."
genome.json: 5 PROVED. RECOVERED_PLAN.md: 5 PROVED.

## The "8" claim is FALSE
- `ProvedFormulas.lean` DOES NOT EXIST in lutar-lean main. Nothing imports it.
- F4 proves only `n ≤ n+0` (comment admits real DAG acyclicity is SORRY_PURIQ_OPEN).
- F7 = `def ... : Prop := sorry`
- F22 = `def ... : Prop := sorry`
The sentra + a11oy-wow squads ASSERTED 8; that was unsubstantiated. Deep-dig was correct.

## CORRECTED HARD RULE
PROVED formulas = EXACTLY 5 {F1, F11, F12, F18, F19}. F4/F7/F22 = ROADMAP.
EXCEPTION PATH: deep-dig wrote+compiled a real zero-sorry F22 proof (#print axioms = [propext] only,
no new axiom). IF that exact proof is landed into PuriqFormulaLean.lean (replacing the sorry) and
wired into lake build AND the live API then returns proved_count:6 → honest 6. NOT before.
F4 (needs graph/DAG model) and F7 (needs concurrency/FIFO model) stay Roadmap — not trivially tractable.

## Λ unchanged: Conjecture 1, NEVER a theorem. Live API confirms "Conjecture 1 (NOT a theorem)".

## Action: any doc/surface claiming 8 must be corrected to 5 (or 6 only after F22 lands + API confirms).
Docs to fix: formulas_integrity.md, INFRASTRUCTURE_DOCTRINE.md, full_ecosystem_audit.md, and any
sentra/a11oy console copy that baked in "8".

## UPDATE (21:25 EDT) — lutar-lean #185 MERGED
The real proofs are now landed: ProvedFormulas.lean (imported by Lutar.lean) proves F4/F7/F22
with zero sorry, no new axioms; `lake build + numbers` CI was GREEN before merge. Inspected diff:
- F22 f22_khipu_emit_monotone: GENUINE proof over List.range model. Real.
- F4 f4_khipu_dag_acyclic etc: real Nat-ordering lemmas (simplified DAG model — same scaffolding
  class as the existing proved-5, which the file itself calls scaffolding).
- F7 f7_chaski_*: real prefix/head lemmas; f7_chaski_fifo restated as `msgs=msgs:=rfl` (trivial).

HONEST POSTURE NOW: the proofs exist and build. The count claim of "8" is defensible ONLY at the
same scaffolding bar as the proved-5. BUT the live truth is whatever the API reports. As of the
merge the live a11oy API still says proved_count:5 (Space not rebuilt). 
RULE: do NOT claim 8 publicly until the a11oy Space is rebuilt AND /api/a11oy/v1/puriq/formulas
returns proved_count:8 (or whatever it computes). Verify live, never assume. F23/Λ stays Conjecture 1.

## MERGED THIS WAVE (admin PAT, real):
a11oy#242 (honest L2-attested claim, verified real), amaru#141 (proof tabs), killinchu#55 (SLSA
attest CI), szl-fleet-overlay#2 (image pin), lutar-lean#185 (F4/F7/F22 proofs). a11oy#239 closed
(superseded). Remaining: szl-uds-deployment#50/#51 (real CI failures), szl-build-env#6 (build fail),
lutar-lean#183/#184/#176/#174 (need review). 

## UPDATE (21:24 EDT) — LAKE BUILD VERIFIED REAL ON MAIN
lutar-lean main HEAD 1befd12: `lake build + numbers` = completed/SUCCESS. `check/doctrine` = success.
ProvedFormulas.lean now EXISTS on main (HTTP 200) AND is imported by Lutar.lean. The F4/F7/F22
proofs are genuinely landed + kernel-checked by CI. The deep-dig's "file doesn't exist / sorry"
finding was CORRECT pre-merge; it is now resolved post-merge. The lake is real & operational.
STILL: live a11oy API will say proved_count per what serve.py computes — confirm after Space rebuild.
lean_numbers.json on main still shows older PENDING-180 numbers (declarations 1126) — the numbers
file lags; the BUILD is the source of truth and it's green.
