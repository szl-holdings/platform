---
name: Putnam-harness closed-form Lean adapter
description: How `checkClosedFormStub` elaborates inside the lean-formulas Lake project, and why it doesn't relax the toolchain-unavailable honesty rule.
---

The putnam-harness has two Lean entry points, not one:

- `checkLeanStub` — standalone `lean <file>` against an ad-hoc temp dir.
  Used for proof-style problems where the stub is self-contained
  (`theorem … := by sorry`). Cannot resolve imports from the
  `lean-formulas` package.
- `checkClosedFormStub` — runs `lake env lean` with `cwd =
  packages/lean-formulas/`, so the stub can
  `import LeanFormulas.Putnam.Closed` and wrap its answer as a typed
  `ClosedFormClaim α`. Used for the small subset of Putnam problems
  with a closed-form numeric answer.

**Why:** standalone `lean` has no `LEAN_PATH` into the package's oleans;
without `lake env` the import fails and every closed-form stub looks
like a parse error, not an elaboration result. `lake env lean` resolves
imports against the package's default target (now includes
`Putnam.Closed`).

**How to apply:**
- Stubs are written into `packages/lean-formulas/.putnam-stubs/Stub_<hash>.lean`
  (gitignored) and removed after the call. Do NOT put them at the
  package root — `lake build` would try to compile them as part of the
  default target on the next run.
- Both entry points keep the honesty contract: lake/lean absent ⇒
  `toolchainAvailable: false, elaborated: false`. Never green a stub
  the toolchain didn't actually elaborate.
- `MatchesOfficial claim official := rfl` is the candidate's
  correctness witness. Elaboration alone proves the answer term has
  the right *type*; only the `rfl` proof against an official-answer
  constant proves it matches the key.
