# FORGE — Wave25 MERGED 03:13 EDT (two theorems now in kernel)

Wave25 constructive Kleene iterate-supremum lfp theorem is MERGED to lutar-lean main (squash sha 357cdaa7). Both new theorems are now on main, lake-VERIFIED, no sorry, Lean-core axioms only, post-merge CI green (Doctrine / Verified-theorems guard / Tests / DCO all success):
- Lutar/QuantumBio/CoherenceDecay.lean (Wave24, 5938 b) — coherence strict-decay + single-crossing.
- Lutar/Lambda/AggregatorLfp.lean (Wave25, 6783 b) — constructive lfp = iSup of Kleene iterates of the Λ-aggregator (distinct from Round5 existence; route-stability certificate for PURIQ).

Both are EXPERIMENTAL/CI-green tier — NOT in locked 8 (still EXACTLY 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17); Λ stays Conjecture 1. The lean_numbers count guard does NOT trip (Lutar/Lambda not in the VERIFIED_THEOREMS drift allow-list; confirmed by the proof-engineer).

ACTION B3 (now unblocked): surface BOTH theorems in the a11oy/anatomy formula tabs as EXPERIMENTAL/CI-green (read-only), labeled honestly. Regen any EXPERIMENTAL-tier count manifest the live apps read (locked-8 + 749/14/163 UNCHANGED). 

Reminder of done work: B1 unified module is LIVE on both apps (/v1/unified/* -> 200, verified). Remaining: B2 lean PRs #221/#223, B3 (above), B4 every-tab agentic sweep, B5 alignment. Doctrine + founder-gated list unchanged.
