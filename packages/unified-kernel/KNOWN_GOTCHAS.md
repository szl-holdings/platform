# KNOWN_GOTCHAS.md — unified-kernel

> Doctrine v11 LOCKED · 749/14/163.

---

## 1. Lambda (Λ) uniqueness is a Conjecture, NOT a theorem

The `compositeLambda` returned by `Λ_audit_closure` is computed as a geometric
mean of per-axiom scores. The UNIQUENESS claim (that only the geometric mean
satisfies axioms A1–A4) is **Conjecture 1** — it depends on an open
`CAUCHY_ND` sorry in `Lutar/Uniqueness.lean:120`.

Do NOT describe it as "proven" in docs, comments, or code. The CI
`doctrine-grep.yml` workflow fails on this.

---

## 2. Ouroboros vendored copy — do NOT replace with stubs

`loop/vendor_ouroboros/` is a byte-for-byte copy of the upstream
`@szl-holdings/ouroboros` kernel at tag `v6.3.0`. In the monorepo this resolves
as a `workspace:*` dep. The 218 upstream tests are the proof of correctness.

Never replace `runLoop` with a stub that returns `() => true`. The boot sequence
test (`kernel.test.ts`) asserts real execution.

---

## 3. Doctrine numbers are frozen until the next version bump

Do NOT change 749, 14, or 163 in any source file without:
1. A new Lean kernel build that changes the numbers.
2. A doctrine version bump (v11 → v12) across the monorepo.
3. CTO approval.

The `doctrine.yml` CI runs a grep-based scan on every PR.

---

## 4. `RUNTIME_CONTRACT_V4_MAX_STEPS = 12` is canonical

Do not bump the max step budget without a formal v5 contract. The value 12 is
referenced in the Ouroboros thesis (`TH_V18_01`) and several downstream tests.

---

## 5. Ed25519 keypair is ephemeral by default

`kernel.start()` generates a fresh Ed25519 keypair at boot if none is passed.
This means the init receipt signature is NOT portable across restarts unless
you pass a stable keypair via `KernelStartOptions.key`.

For production use, pass a persisted keypair. For tests, the ephemeral default is fine.

---

## 6. Codex-kernel v1.0.2 — 4 contracts are canonical

The `codex/` module runs exactly 4 governance contracts (codex-kernel v1.0.2).
Do not add a 5th without a codex version bump. The boot step 5 assertion checks
`results.length === 4`.

---

*Signed-off-by: stephenlutar2-hash <stephenlutar2@gmail.com>*
*Doctrine v11 LOCKED · 749/14/163.*
