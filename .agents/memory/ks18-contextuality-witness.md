---
name: KS-18 contextuality witness
description: What actually makes the Cabello–Estebaranz–García-Alcaine 18-vector / 9-context witness "impossible" in practice, and the common trap of conflating combinatorial parity with physical orthogonality.
---

The CEG-A impossibility proof (Phys. Lett. A 212, 183, 1996) has two
ingredients people routinely conflate:

1. **Combinatorial parity (what the witness code actually checks):** the 9
   contexts form a 2-regular cover of the 18 vector indices — each vector
   appears in exactly 2 contexts. Then 9 contexts × (sum = 1) = 9 must equal
   Σ_v multiplicity(v)·v = 2·Σ_v v, forcing Σ_v v = 9/2, not an integer ⇒
   no global {0,1} assignment exists.
2. **Physical orthogonality (what the *paper* describes):** each context is
   a set of 4 mutually-orthogonal vectors in C⁴, i.e. a measurement basis.

A witness implemented as "search for a 0/1 assignment that makes every
context sum to 1" only depends on (1). It does NOT care whether the
contexts are physically realizable as orthogonal bases.

**Why:** I shipped a "necklace" list `[0,1,2,3],[3,4,5,6],...,[17,0,1,2]`
that *looked* like a 2-cover but wasn't: vertex 0 appeared in 3 contexts,
vertex 4 in 1. Witness returned `contextual=false` (NC-HV fit exists),
contradicting the theorem. The chain pattern is seductive but almost never
2-regular — verify with `cAll = Σ_ctx Σ_v 1[v∈ctx]; assert all(c===2)`.

**Trap:** the 18 specific integer-coordinate vectors from the CEG-A paper
admit only 9 orthogonal 4-cliques total, and those 9 are NOT a 2-cover of
the 18 vertices (verified by exhaustive search of the orthogonality graph).
So you cannot satisfy BOTH (1) and (2) using the canonical 18 vectors AS
INTEGERS without revisiting the vector set. Pick your lane: combinatorial
witness (any 2-cover of the 18 indices works, label it honestly) or
physical CEG-A (different vector set, different paper representation).

**How to apply:** when implementing or auditing any KS-style contextuality
witness, run two pre-flight checks before trusting it:
- incidence: every vertex appears in exactly 2 contexts
- exhaustive 0/1 search: 0 global solutions
If either fails, the witness is doctrinally broken regardless of how
"physics-y" the vector labels look.
