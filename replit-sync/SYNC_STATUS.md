# SYNC STATUS — Perplexity → Forge — 2026-06-08 (UPDATE: Wave23 conditional BFT safety + full eyes-on)

**NEW (~18:35 EDT):** Conjecture-2 (Khipu BFT safety) now has an axiom-clean CONDITIONAL agreement theorem — `Lutar/Wave23/QuorumSafety.lean`, PR #214 (OPEN, base main, head 36c8abcf, NOT self-merged). Under {n≥3f+1, |faulty|≤f, |Qᵢ|≥n−f, honest non-equivocation} ⟹ no split-brain. 5 decls axiom-clean (⊆ {propext,Classical.choice,Quot.sound}), no sorry, lake build EXIT 0, drift unchanged. Unconditional stays Conjecture 2 (sharp boundary). CUT-1 last formula was already DONE (Wave22/#212 merged). Λ stays Conjecture 1. Locked stays EXACTLY 5.

**FULL EYES-ON DONE:** a11oy (82 surfaces) + killinchu (34) + anatomy — every surface, 0 page/console errors, 0 visible codenames, 3D framed, live data, doctrine honest. Both apps + anatomy fully operational.

**FORGE ASKS** (full detail in `replit-sync/conjecture/_FORGE_BRIEF_2026-06-08.md`):
1. Verify + (with founder sign-off) MERGE PR #214 (we did NOT self-merge).
2. Fix the one pre-existing CI-infra RED: re-pin `amannn/action-semantic-pull-request@0723387f` (unresolvable SHA) — blocks title-lint only; all substantive gates green.
3. AFTER merge: instill the Wave23 conditional-safety card into a11oy kbformulas+brain2, killinchu u_proofs, anatomy panel (one honest card; coordinate to keep GitHub↔HF byte-identical).
4. Lean next targets: canonicalHistory-level safety, Liveness/Conjecture-3 (partial-synchrony), full non-binary Pinsker, full Aczél–Maksa CUT-1.

New files this push: `replit-sync/conjecture/{_FORGE_BRIEF_2026-06-08,WAVE23_FRONTIER_STATEMENT,BFT_SAFETY_RESEARCH,BFT_WAVE23_REPORT}.md` + updated `PROVEN_STATE_CANONICAL.md`.

---

# SYNC STATUS — Perplexity → Forge — 2026-06-08 (FINAL, Amaru done)

**Perplexity build is COMPLETE and fully aligned. Forge: clear to run your 2 drift fixes now.**

## What just shipped (since the payload manifest)
- AMARU "Provenance & Trust Anchor" vertical (5 tabs) — LIVE in a11oy, browser-verified, 0 errors, NO codename visible.
  Tabs: Public-Ledger Anchor (real CT logs 3/3 + BTC tip), Post-Quantum Signing (honest live-vs-roadmap), Receipt Provenance Graph 3D, Tamper/Audit Verifier (tamper CAUGHT), Anchor Health (UDS 4/4).
  Backend: a11oy_amaru_feeds.py -> /api/a11oy/v1/provenance/* (codename kept out of network tab too).

## ALIGNMENT — VERIFIED GREEN
- GitHub szl-holdings <-> HF SZLHOLDINGS: BYTE-IDENTICAL on all touched files (a11oy: console.html, serve.py, Dockerfile, a11oy_amaru_feeds.py, a11oy_deva_feeds.py, a11oy_vertical_feeds.py; killinchu: console, serve.py, Dockerfile). md5-verified.
- Both Spaces RUNNING. a11oy /console = 200 (912KB). killinchu /elite = 200 (744KB).
- UDS mesh quorum 4/4 (possible=true, status ok). UDS payload Apache-2.0 + "NOT affiliated with Defense Unicorns". Theorem registry = 5.

## FORGE: GO
- Your 2 queued drift fixes (resync HF HONEST_DISCLOSURE.md to GitHub's "Λ=Conjecture 1 · SLSA L1 honest · L2 build-attested (Rekor) · L3+ roadmap" line; refresh STATUS.md) are SAFE to apply now — Amaru is deployed, no in-flight a11oy edits from Perplexity side.
- Keep GitHub<->HF byte-identical after your push.

## OPEN ITEM (founder controls): DSSE cosign signing is unsigned in the live runtime (no SZL_COSIGN_PRIVATE_*_PEM secret on the Spaces). Affects ALL verticals. Tamper still caught via SHA3-256 hash-chain. Setting the secret turns signing green with no redeploy (code already wired). 
