---
name: Lean + Mathlib builds are not session-sized
description: Why `lake build` against a mathlib-dependent package shouldn't be a live workflow
---

A `lakefile.lean` that does `require mathlib from git @ "vX.Y.Z"` will, on a fresh
checkout, do a full `git clone` of leanprover-community/mathlib4 (hundreds of MB)
followed by a from-source compile that takes multiple hours on a single CPU.

**Why:** Mathlib has no prebuilt binary cache reachable from a sandboxed runner
unless you wire up `lake exe cache get` (Mathlib's reservoir cache), and even
then the cache fetch is large. A "first run" inside a session-bounded environment
will not finish.

**How to apply:**
- Do not promise the user a green `lake build` workflow in-session unless `lake
  exe cache get` is already wired AND has been verified to complete.
- For machine-checked-formula packages, prefer making the lean step a one-shot
  CI check (e.g. `.replit` `isValidation = true` is enough) rather than a
  long-running workflow that occupies a slot in the 10-workflow cap.
- elan + the specific Lean toolchain (`leanprover/lean4:vX.Y.Z`) installs in
  seconds via the official elan installer; that part IS session-sized. It's the
  Mathlib dependency that isn't.
