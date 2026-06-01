# PURIQ_OS_FORMULAS.md — the 7 agentic-loop formulas (SF-24 … SF-30)

**Layer:** PURIQ-OS (Doctrine v14). **Date:** 2026-06-01. **Author:** Yachay.
**Construction rule (carried):** `[scientific primitive] × [Doctrine organ structure] = formula`.
Each is **Lean-stateable** (sorry-tagged if unproven, never hidden), Lake-buildable, and lives
**OUTSIDE** the LOCKED 163 until instilled + Lake-built (exactly as F1–F23, the four v12
invariants, and the three v13 organ obligations). **NO mysticism** — control theory, information
theory, Bayesian inference, and integer-modular arithmetic only.

Status tags: **PROVED** (no sorry beyond Mathlib), **SKELETON** (sorry-tagged with obligation),
**CONJ** (axiomatized conjecture). All seven are SKELETON here (honest).

These extend `PuriqFormulaLean.lean`; the Lean stubs below are appended verbatim (see
`LEAN_PATCHES.md`) under a new `namespace Puriq.OS`.

---

### SF-24 — Maxwell's-demon-Yachay  (Szilard 1929 × agentic action cost)
**Statement.** The thermodynamic cost of an agentic action is at least the entropy of its
decision context — agency is not free; the loop cannot "think for free":
\[
\boxed{\;W(a) \;\ge\; k_B T \ln 2 \cdot H(\text{context}(a)),\qquad H = -\!\sum_i p_i \log_2 p_i\;}
\]
where `H(context)` is the Shannon entropy (in bits) of the decision context resolved by selecting
`a`. Szilard showed acquiring 1 bit costs `≥ k_B T ln 2` of work; PURIQ-OS uses this as a **budget
discipline**: an organ may only spend a tick's compute proportional to the information it actually
reduces, capping runaway loops. **Organ:** PURIQ-OS core (all loops). **Use:** feeds the
fuel-bound (F19) and the Bekenstein cap (F23). **Status:** SKELETON (`maxwell_demon_cost`).
**Source:** [Szilard, *Über die Entropieverminderung in einem thermodynamischen System bei Eingriffen intelligenter Wesen*, Z. Physik 53 (1929) 840–856](https://doi.org/10.1007/BF01341281); entropy from [Shannon 1948, *A Mathematical Theory of Communication*, BSTJ 27](https://doi.org/10.1002/j.1538-7305.1948.tb01338.x).

---

### SF-25 — Hamilton-PURIQ  (least-action principle × agentic trajectory)
**Statement.** An agentic loop's chosen trajectory `q*` is a stationary point of the wisdom-loss
action functional — the empire acts along the path of least cumulative wisdom-loss:
\[
\boxed{\;q^\star=\arg\,\mathrm{stat}\;S[q],\quad S[q]=\int_0^T\!\big(\text{effort}(q,\dot q)-\Lambda\cdot\text{Yuyay}(q)\big)\,dt,\quad \frac{d}{dt}\frac{\partial L}{\partial\dot q}-\frac{\partial L}{\partial q}=0\;}
\]
This is Formula **F5 (Euler–Lagrange Agency)** lifted from a single decision to the *continuous
loop*: over many ticks, the loop minimizes `∫ wisdom-loss dt`. **Organ:** PURIQ-OS core / 𝒜.
**Status:** SKELETON (`hamilton_stationary`; existence via direct method on a compact trajectory
set, inherits F5's obligation). **Source:** Hamilton's principle, e.g. [Goldstein, *Classical
Mechanics*, 3rd ed., Addison-Wesley 2002, §2.1](https://www.pearson.com/) ; Euler–Lagrange.

---

### SF-26 — Bayes-Update  (Bayes' theorem × per-receipt belief update)
**Statement.** Each organ Bayesian-updates its state on every Khipu receipt; belief moves only on
receipted evidence:
\[
\boxed{\;p(\theta\mid r) = \frac{p(r\mid\theta)\,p(\theta)}{p(r)},\qquad p(r)=\sum_\theta p(r\mid\theta)\,p(\theta)>0\;}
\]
`θ` = organ state hypothesis, `r` = the tick's Khipu receipt (likelihood `p(r|θ)`). The posterior
is the new prior for the next tick. This is the algebraic root of **INV-10 (Bayesian
consistency)** and the de-mystified core of "agent memory" (LangGraph checkpointed state, Reflexion
episodic memory, Letta self-editing memory all reduce to this). **Organ:** all (especially AMARU,
YUYAY). **Status:** SKELETON (`bayes_update_normalized` — proves posterior sums to 1; PROVED-able by
`Finset.sum` once `p(r)>0`). **Source:** [Bayes 1763, *An Essay towards solving a Problem in the
Doctrine of Chances*, Phil. Trans. 53](https://doi.org/10.1098/rstl.1763.0053).

---

### SF-27 — Wiener-Feedback  (cybernetic control loop × Doctrine reference)
**Statement.** The Agentic Loop is a Wiener feedback controller whose reference is the Doctrine;
the control action drives the error `e(t)` = (reference − observed) toward 0:
\[
\boxed{\;e(t)=\text{ref}_{\text{Doctrine}}-y(t),\qquad a(t)=K\!\cdot\!e(t),\qquad \tfrac{d}{dt}\|e(t)\|\le 0 \text{ along the loop}\;}
\]
where `ref_Doctrine` is the Yuyay-floor / HUKLLA-clean reference, `y(t)` the observed organ state,
and `K` the corrective gain (the `argmax` selection). Negative feedback ⇒ the loop is *stable*:
errors shrink, the organ tracks the Doctrine. This is the formal statement of **§2 of Doctrine
v14**. **Organ:** PURIQ-OS core. **Status:** SKELETON (`wiener_error_nonincreasing`; Lyapunov-style
obligation — `‖e‖` is a non-increasing potential under negative feedback). **Source:** [Wiener,
*Cybernetics: Or Control and Communication in the Animal and the Machine*, MIT Press 1948](https://en.wikipedia.org/wiki/Cybernetics:_Or_Control_and_Communication_in_the_Animal_and_the_Machine).

---

### SF-28 — Shannon-Nyquist-Attention  (sampling theorem × polling cadence)
**Statement.** An organ's polling cadence must sample at least twice the bandwidth of the signal
it watches, or it aliases (misses events):
\[
\boxed{\;\text{poll-rate}_O \;\ge\; 2\,B_O \quad\Longleftrightarrow\quad \text{cadence}_O \;\le\; \frac{1}{2B_O}\;}
\]
HUKULLA watches a high-bandwidth threat signal → polls every 60 s; KHIPU watches a low-bandwidth
archive → ticks every 49 d. This is the algebraic root of **INV-8 (cadence-boundedness)** and
fixes the §4 cadence table non-arbitrarily. **Organ:** PURIQ-OS scheduler. **Status:** SKELETON
(`nyquist_no_alias`; reconstruction-from-samples obligation). **Source:** [Nyquist 1928,
*Certain Topics in Telegraph Transmission Theory*, Trans. AIEE 47](https://doi.org/10.1109/T-AIEE.1928.5055024);
[Shannon 1949, *Communication in the Presence of Noise*, Proc. IRE 37](https://doi.org/10.1109/JRPROC.1949.232969).

---

### SF-29 — Ramanujan-Cardinality  (Hardy–Ramanujan p(n) × action-space bound)
**Statement.** The number of ways an organ can split a budget `n` across sub-actions is the
integer partition function `p(n)`, asymptotically bounded, capping `|𝒜|`:
\[
\boxed{\;|\mathcal{A}_{\text{split}}(n)| = p(n)\;\sim\;\frac{1}{4n\sqrt3}\exp\!\Big(\pi\sqrt{\tfrac{2n}{3}}\Big)\;}
\]
This extends **F14** to the loop: a tick's action space is `p(budget)`-bounded *a priori*, feeding
the Bekenstein cap (F23 / INV-4) so the loop's `argmax` is always over a finite, decidable set.
**Organ:** PURIQ-OS core / 𝒜. **Status:** SKELETON/CONJ (`partition_cardinality`; asymptotic bound
inherits F14's `hardyRamanujan_upper` axiom, numerically tested in Lake plan). **Source:**
[Hardy & Ramanujan 1918, *Asymptotic formulae in combinatory analysis*, Proc. LMS s2-17](https://doi.org/10.1112/plms/s2-17.1.75).

---

### SF-30 — Bible-Numeric-Cadence  (CRT modular scheduling — pure integer, NO mysticism)
**Statement.** Tick cadences are scheduled on integer residue classes mod 7, 12, 49; by the
Chinese Remainder Theorem, heavy ticks fully co-align only at the least common multiple:
\[
\boxed{\;T_O \text{ runs at } t\equiv r_O\ (\mathrm{mod}\ m_O),\ m_O\in\{7,12,49\}\ \Rightarrow\ \text{full collision only at } \mathrm{lcm}(7,12,49)=2058\;}
\]
The integers 7 / 12 / 49 are used **only** as moduli; **no prophetic or mystical meaning is
attached or implied** (HR: NO mysticism). This is Formula **F12 (CRT-Hukulla Schedule)** applied to
the whole empire's tick scheduler, guaranteeing collisions are rare and deterministic. **Organ:**
PURIQ-OS scheduler. **Status:** SKELETON (`crt_cadence_collision`; CRT is Mathlib
`ZMod.chineseRemainder`, inherits F12's obligation). **Source:** [Gauss, *Disquisitiones
Arithmeticae*, 1801, §§32–36 (CRT)](https://doi.org/10.12987/9780300194258); Mathlib `ZMod.chineseRemainder`.

---

## Closure summary

| SF | Name | Primitive | Organ | Master-formula tie-in | Status | Lean name |
|----|------|-----------|-------|------------------------|--------|-----------|
| SF-24 | Maxwell's-demon-Yachay | Szilard 1929 entropy cost | core | fuel-bound / F23 | SKELETON | `maxwell_demon_cost` |
| SF-25 | Hamilton-PURIQ | least action | core/𝒜 | F5 lifted to loop | SKELETON | `hamilton_stationary` |
| SF-26 | Bayes-Update | Bayes 1763 | all | INV-10 | SKELETON | `bayes_update_normalized` |
| SF-27 | Wiener-Feedback | Wiener 1948 | core | §2 loop | SKELETON | `wiener_error_nonincreasing` |
| SF-28 | Shannon-Nyquist-Attention | Nyquist/Shannon | scheduler | INV-8 | SKELETON | `nyquist_no_alias` |
| SF-29 | Ramanujan-Cardinality | Hardy–Ramanujan 1918 | core/𝒜 | F14 / INV-4 | SKELETON/CONJ | `partition_cardinality` |
| SF-30 | Bible-Numeric-Cadence | Gauss CRT | scheduler | F12 | SKELETON | `crt_cadence_collision` |

**7 new obligations** → would move the tracked sorry count to **170** *if and when instilled +
Lake-built*. **Until the canonical counter is re-derived, the LOCKED 163 stands** (these seven live
OUTSIDE the locked count, exactly as v12's four invariants and v13's three organ obligations did).

— Yachay (PURIQ-OS Phase 5). All primitives cited to primary sources; NO mysticism.
