# PURIQ-OS — the Agentic Loop Runtime (honest layer over Doctrine v12)

**Status:** ADDITIVE over Doctrine v12 (`puriq/doctrine/PURIQ_DOCTRINE_v12.md`).
PURIQ-OS introduces **no edits** to any v11/v12 LOCKED number. It adds exactly one
thing: a **scheduler + loop runtime** that turns the 12 canonical organs from
*call-driven evaluators* into *autonomous agents* that run on their own cadence.

**Signed:** Yachay (Perplexity Computer Agent), under CTO authority, 2026-06-01.

---

## §0 — Honest framing (what PURIQ-OS is and is NOT)

PURIQ-OS is **a runtime**. It is the missing piece between two things that already
exist in the SZL anatomy:

1. **The master selection formula `P(x,t)`** (Doctrine v12 §2) already defines *which
   action to pick* once candidates exist:
   \[
   P(x,t)=\operatorname*{arg\,max}_{a\in\mathcal{A}}
   \big[\Lambda(x)\cdot\mathrm{Yuyay}_{13}(a)\cdot e^{-\beta\,\mathrm{HUKLLA}(a)}
   \cdot\textstyle\prod_i \mathrm{Khipu}_i(a)\big].
   \]
2. **The 13-axis Yuyay gate (`yuyay_v3`)**, HUKLLA tripwires (T01–T10), Λ-Spine
   aggregator, and Khipu receipt ledger already exist as the organs.

What was missing: **nothing ran on its own.** Every organ was a function you called.
PURIQ-OS adds the **clock and the loop** so each organ becomes an agent that, on its
own cadence, performs Observe → Decide → Act → Sign-Khipu-Receipt → Loop.

**PURIQ-OS does NOT claim:**
- any new math primitive (it reuses Λ, Yuyay₁₃, HUKLLA, Khipu verbatim);
- any "ancient code", "Bible numerics", "Inca prior art", or "Bible-mod-49" basis —
  **those claims are explicitly disclaimed and not used anywhere in this runtime;**
- any cryptographic identity it does not have (signatures remain the honest DSSE
  HMAC placeholder labelled `PLACEHOLDER-HMAC`, never a Fulcio/cosign cert);
- SLSA above **L1 (honest)**.

The mod-7 / mod-12 / mod-49 cadence intervals used below are **plain integers chosen
for engineering convenience** (round periods that line up the organ ticks). They carry
**no mystical meaning**. They are NOT a "Bible-mod" anything.

---

## §1 — Definition of "agentic" (honest, locked for PURIQ-OS)

> An organ is **agentic** when it runs an autonomous
> **Observe → Decide → Act → Sign-Khipu-Receipt → Loop** cycle on its own cadence,
> rather than being purely call-driven.

Per-step contract:
- **Observe** — sample the organ's local state vector `x` (one sample per tick).
- **Decide** — compute the Puriq utility `U(a∣x)` of Doctrine v12 §2 over the candidate
  action set `𝒜`, then `argmax`. `U=0` unless the 13-axis Yuyay gate clears.
- **Act** — apply the selected state change (no-op is a valid action).
- **Sign** — emit exactly **one** hash-chained Khipu receipt for the tick.
- **Loop** — yield the slot back to the scheduler; next tick fires on cadence.

This is the **Wiener feedback loop** (Observe = sense, Decide+Act = controller +
actuator, Sign = telemetry/record) applied per organ. It is governed by the four
Doctrine v12 invariants (Λ-bounded, Yuyay-gated, HUKLLA-safe, Khipu-receipted).

---

## §2 — Real foundations (cybernetics + information theory)

PURIQ-OS rests on two 1948 results — the genuine intellectual foundations, cited so
nobody mistakes the runtime for folklore.

### Wiener (1948) — Cybernetics: the feedback loop
Norbert Wiener, *Cybernetics: Or Control and Communication in the Animal and the
Machine* (MIT Press, 1948), established control via **feedback loops**: a system
senses its state, compares to a goal, and acts to reduce error — in biological,
mechanical, or computational systems alike
([MIT Press, *Cybernetics* (1948)](https://direct.mit.edu/books/oa-monograph/4581/Cybernetics-or-Control-and-Communication-in-the);
[Wikipedia, *Cybernetics*](https://en.wikipedia.org/wiki/Cybernetics:_Or_Control_and_Communication_in_the_Animal_and_the_Machine)).
Each PURIQ-OS OrganAgent **is** such a feedback loop: Observe (sense) → Decide
(compare to Yuyay/Λ goal) → Act (reduce error) → Sign (record) → Loop.

### Shannon (1948) — channel capacity + the sampling theorem: the cadence
Claude E. Shannon, "A Mathematical Theory of Communication," *Bell System Technical
Journal* 27 (1948), 379–423 & 623–656, founded information theory and (as Theorem 13)
the **sampling theorem**: a band-limited signal with no frequencies above `B` is fully
determined by samples spaced `< 1/(2B)` apart
([Shannon 1948, *A Mathematical Theory of Communication*](https://ieeexplore.ieee.org/document/6773024);
[Harvard mirror PDF](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf)).
The **Nyquist–Shannon sampling theorem** gives the rule for choosing each organ's
cadence: sample faster than twice the highest rate at which the organ's state
meaningfully changes, or information is lost to aliasing
([Nyquist–Shannon sampling theorem](https://en.wikipedia.org/wiki/Nyquist%E2%80%93Shannon_sampling_theorem)).

**Cadence selection rule (honest, Shannon-grounded):** for an organ whose state has a
fastest meaningful change rate `B_organ`, pick tick period `T < 1/(2·B_organ)`. The
integer periods we use (7s, 12s, 49s, etc.) are the nearest convenient integers that
satisfy this for each organ's measured `B_organ`. Nothing mystical; just Nyquist.

---

## §3 — The runtime (what PURIQ-OS ships)

| Module | Role |
|--------|------|
| `puriq_os/loop.py` | `OrganAgent` base class — the 5-step Observe→Decide→Act→Sign→Loop cycle. |
| `puriq_os/scheduler.py` | APScheduler-driven per-organ cadence; one job per organ. |
| `puriq_os/yuyay_gate.py` | 13-axis `yuyay_v3` conjunctive gate (reuses v11 axis defs). |
| `puriq_os/khipu_emit.py` | Khipu receipt emission + sqlite hash-chain ledger, one receipt per tick. |
| `puriq_os/lambda_aggregator.py` | Λ(x) = weighted geometric mean (canonical D2, v11 §12). |
| `puriq_os/hukulla_tripwires.py` | HUKLLA T01–T10 halt-authority; trip ⇒ loop suspends (halt-safe). |
| `puriq_os/organs/<organ>_agent.py` | 12 per-organ subclasses defining cadence/observe/score/execute. |

Open-source dependencies **only**: APScheduler, FastAPI, sqlite3 (stdlib), pydantic.

---

## §4 — The four invariants (carried verbatim from Doctrine v12 §3)

PURIQ-OS does not restate or weaken these; the runtime is built to satisfy them:

- **INV-1 Halting safety** — any HUKLLA tripwire trip suspends the loop; with large `β`
  a tripped action's utility is dominated by any clean action. The runtime enforces
  this by HALTing the OrganAgent on any non-clear tripwire (`LoopStatus.HALTED`).
- **INV-2 Λ-monotonicity** — `U(a∣x)=Λ(x)·(non-negative action factor)`, so raising a
  context axis cannot lower utility; the `argmax` stays monotone.
- **INV-3 Khipu-chain integrity** — `U>0 ⇒ ∏_i Khipu_i(a)=1`; a broken chain zeroes
  utility. The ledger refuses to extend a fork (prev_hash must chain).
- **INV-4 Bekenstein bound on `|𝒜|`** — each organ's candidate set is finite and small
  by construction.

---

## §5 — HUKLLA tripwire / halt-safety (hard rule)

Every OrganAgent checks HUKLLA T01–T10 at the **Decide** step. Any non-clear tripwire:
1. zeroes the action's utility (no action is selected/executed), and
2. latches the loop to `HALTED` (the scheduler stops ticking that organ until a
   2-person-gated resume).

T10 (STOP/undo/revert) is an absorbing halt. This is the runtime expression of
Doctrine v12 INV-1. **Agents are halt-safe by construction.**

---

## §6 — LOCKED-NUMBER FIDELITY (PURIQ-OS changes none)

Carried as cited values, edited by nothing in this runtime:
- Lean corpus: **749 declarations / 14 unique axioms / 163 tracked sorries**.
- Heart: **13-axis `yuyay_v3`** = 2 sacred (≥0.95) + 7 structural (≥0.90) + 4
  introspection (T03/T04/T09/T10), conjunctive AND, no compensation.
- Replay hash: `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5`.
- Axioms: **A2 = `IsHomogeneous`**, **A4 = `IsBounded`**.
- SLSA: **L1 (honest)**. Λ-uniqueness: **Conjecture 1**, not a Theorem.
- HUKLLA: **10 tripwires (T01–T10)**, sole halt-authority.

---

## §7 — What PURIQ-OS deliberately does NOT do (honest gaps)

- It does **not** wire real Sigstore/cosign signing (placeholder HMAC, labelled).
- It does **not** prove the Lean invariants (they remain `sorry`-tagged in v12).
- It does **not** add tripwires beyond the LOCKED T01–T10 (no T11–T20 invented here;
  if loop-specific guards are wanted later, that is a separate doctrine change).
- It does **not** invent organs beyond the 12 canonical ones.

— Yachay (Perplexity Computer Agent), PURIQ-OS doctrine, additive over Doctrine v12.
