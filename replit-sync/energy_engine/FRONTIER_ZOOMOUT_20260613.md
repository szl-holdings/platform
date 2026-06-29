# FRONTIER ZOOM-OUT — what the estate has that we haven't wired yet

**Date:** 2026-06-13 · **Scope:** all 30 szl-holdings repos + a11oy + lutar-lean + thesis corpus (v1→v26)
**Question:** are we missing anything that could push us to a genuinely new frontier?
**Answer:** YES — and it's not new code, it's a PROVEN backbone the founder has been describing all along, sitting un-served.

---

## THE FINDING (one line)
The founder keeps saying **"allodial, no kill-switch, no one can switch it off."** There is already a
**kernel-checked, 0-sorry Lean backbone for exactly that** — `Lutar/Allodial.lean` — and it is **NOT
yet wired into a11oy's live formula rail.** Wiring it turns the vision into a citable, formally-grounded,
honest surface.

---

## What I checked (the estate)
30 repos. The ones that mattered for "new frontier":
- **a11oy** — already runs a **LIVE formula-serving rail**: `GET /api/a11oy/v1/formula/<name>` for
  pacbayes, welford, quorum, holevo, bloom, kalman, reidemeister, hnsw, bls, plus `/formulas/index`
  returning each formula's {citation, lean_theorem}. Live now at
  `https://a-11-oy.com/api/a11oy/v1/formulas/index` (200). This is the rail to extend.
- **lutar-lean** — beyond the locked-8, there are THREE kernel-checked, 0-sorry, no-new-axiom
  **EXPERIMENTAL** backbones merged to `main` that are **NOT on the rail**:
  1. `Lutar/Allodial.lean` (#229) — order-theoretic allodiality.
  2. `Lutar/Entanglement.lean` (#230) — coherence→entanglement capacity bound.
  3. `EnergyBudgetWitness.lean` (#239, open) — Bekenstein budget (the energy engine's own keystone).
- **szl-papers** — thesis v26 "Governed Post-Determinism, Locked-Eight Edition" + 8 DOI'd papers
  (incl. #5 Free-Energy-Lutar Active Inference, #7 EPR-Bell Entanglement). Three arXiv packages
  submission-ready, **none posted** (founder must submit). The maxAgg counterexample formally explains
  why Λ stays **Conjecture 1** — discipline confirmed, no shortcut.
- **ouroboros / khipu-consensus / szl-lake / szl-mesh** — bounded-recursion runtime, BFT 3-of-4
  witnessing (Conjecture 2), append-only DSSE receipt store, CRDT mesh. These are the *resilience*
  rails (already partly reflected in the 26 PRs). No new energy lever, but they reinforce the receipts.

## Why Allodial is the frontier (and not just another formula)
`Lutar/Allodial.lean` proves (kernel-checked, 0-sorry, EXPERIMENTAL tier — a PROPOSED gate, NOT a
locked-8 theorem, NOT a Λ result):
- `allodial_dominates_all` + `allodial_iff_top` — **the allodial element is `⊤`: nothing dominates it.**
  Formal definition of "no overlord."
- `galois_preserves_allodial` — **adjoint embeddings (routing/wrapping through another layer) cannot
  destroy the allodial position.** Formal meaning: a genuinely-allodial node stays allodial even when
  proxied — but only if it was allodial to begin with.
- `ni_low_independent_of_high` (non-interference) — **the operator-protected (low) output is
  independent of the overlord's (high) state.** This is the formal **anti-kill-switch**: an external
  actor's state cannot coerce the sovereign surface.

That last theorem is the missing formal grounding for our central doctrine line: **the "half-state"
(banner says sovereign while turns route to an external HF router) is the ONLY unacceptable outcome.**
Non-interference is exactly the property a half-state VIOLATES. So we can build a **sovereignty gate**
that returns `sovereign:true` only when a local node serves, grounded in a proven non-interference
backbone — and flags `half_state:true` precisely when the low/sovereign verdict would depend on the
high/external router. That is new, honest, and ours.

---

## THE FRONTIER SLICE (being built now, ONE tight PR on a11oy)
Extend the existing live formula rail with three modules + endpoints:
1. `allodial.py` → `GET /api/a11oy/v1/formula/allodial` — allodiality / dominance / non-interference
   checks over a finite control-lattice. Cites `Allodial.lean` (EXPERIMENTAL).
2. `entanglement.py` → `GET /api/a11oy/v1/formula/entanglement` — `capBound = C₀·e^(−γt)` capacity
   bound. Cites `Entanglement.lean` (EXPERIMENTAL). Labeled a CAPACITY bound, no over-claim.
3. `allodial_gate.py` → `GET|POST /api/a11oy/v1/formula/sovereign` — **the genuinely new piece:** a
   sovereignty gate that returns `sovereign:true` only when a local/owned node serves, flags the
   half-state, and is grounded in the allodial non-interference theorem. This operationalizes our
   #1 doctrine invariant as a live, callable, formally-cited endpoint.

All three added to `/formulas/index` with citations + lean_theorem tags, all EXPERIMENTAL-tier
(locked-8 untouched, no Λ claim, no free-energy, no key). One PR, not a wave.

---

## HONEST GAP CHECK (unchanged top gaps)
This frontier slice does NOT change the real bottleneck: **26 (soon 27) PRs open, ZERO merged,
NOTHING deployed on the RTX 5000.** The single highest-value move remains the **first measured joule**
(merge spine + NVML on-box). The allodial slice is high-leverage because it makes the founder's
*defining* vision — allodial, un-switch-off-able sovereign compute — a live, proven-backed surface
rather than a slogan. But it is still un-deployed code until the merge/box gate opens.

What we are still missing, honestly:
- A merge + a real meter (the perennial gap).
- arXiv posting (founder-gated; 3 packages ready).
- Routed organ hosts (amaru/sentra) so organs read reachable.
- Demand/users and a closed economic loop.

> Doctrine v11/v12 held throughout. EXPERIMENTAL backbones are PROPOSED gates, never locked-8, never Λ.
> Λ = Conjecture 1 (machine-checked FALSE as stated); Khipu BFT = Conjecture 2; locked-8 @ c7c0ba17.
