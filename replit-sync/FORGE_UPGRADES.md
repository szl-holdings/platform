# FORGE UPGRADES & RECOMMENDATIONS — beyond the open PRs (2026-06-10)

**From:** Perplexity Computer (parent) → Forge. Companion to `FORGE_MASTER_DIRECTIVE.md` and dispatch issue #338.
**Rule:** every item honest at Series-A scrutiny. Numbers from `lean_numbers.json`/`lutar-lean`. Λ=Conjecture 1. SLSA L1. Mobile+tablet mandatory. Conventional Commits + DCO. CI green for a real reason.

## A. Hygiene / supply-chain (high ROI, low risk)
1. **Sweep the truncated-SHA class bug.** The platform commit-lint pin was 39 chars (fixed in #332). Grep every repo's workflows for action pins ≠ 40 hex chars and fix — this class of bug silently breaks gates org-wide.
   `grep -rhoE "uses: [^ ]+@[a-f0-9]+" .github/workflows | awk '{n=split($2,a,"@"); if(length(a[2])>6 && length(a[2])<40) print}'`
2. **Replicate the Grype stale-DB fix (#73)** to any other repo whose CVE/SCA gate embeds a vendored DB (install scanner + refresh DB before scan, fail honestly on findings not DB-age).
3. **Roll the doctrine pre-check** (`.github/scripts/doctrine_precommit.sh`, advisory) to the remaining product repos (vessels, terra, prism-counsel, sentra/aegis) so overclaims are caught pre-push. Keep it warn-only; CI `doctrine-check.yml` stays authoritative.
4. **Single-source the numbers everywhere.** Now that `lean_numbers.json` carries `locked_formula_count: 8`, refactor surfaces that still hardcode the count to read the canonical file at build time. Kills future 5/8-style drift permanently.

## B. Flagship availability (open issues #314/#317/#319/#322 — amaru/rosie/sentra/a11oy unhealthy)
5. **Warm-flagship health.** Four flagships report unhealthy. Wire the existing warm-flagships workflow to honest readiness probes; when a service is PAUSED/503 the console shows the real state (never mock). Tie a receipt to each recovery.

## C. anatomy v4 deepen-further (genius-tier, all additive, sovereign)
6. **Per-organ "dissect detail"**: inline the exact Lean permalink + verbatim `#print axioms` line per instilled formula (data already in `data.js`). Receipt-overlay each interaction to a Khipu-style provenance entry.
7. **Formula Atlas → cross-link to lutar-lean**: each of the 54 cards deep-links to its theorem/sorry in `lutar-lean@c7c0ba17`. Honest tier badges from `data.js` only.
8. **Forecast honesty hardening**: keep the maturity timeline driven solely by `KERNEL`/data.js strings; never predict a future locked count. Add a "what would move F-x to LOCKED" note sourced only from documented roadmap.

## D. Real-time intelligence (per LIVE_SOURCES_VERIFIED + CAPABILITY_TAB_MAP)
9. **Wire every flagship tab to live data** (server-side polls, jittered, honest cached/stale): NVD + CISA KEV (cve/kev), Yahoo v8 + Coinbase + Treasury (finance), GitHub REST + HF models + Hatun-MCP `tools/list`=25 (threats/arena/llm/mcp), killinchu routes/ROE/fusion (mission/fleet/mesh). Mobile/tablet per directive.

## E. Lean / proof program (statement-only until kernel-verified)
10. **Wave24**: admissibility-certification soundness (conditional, axiom-clean); connect Wave23 BFT to the signed execution certificate; first honest Semantic Linearizability definition + one proven property. Never relabel CONJECTURE/EXPERIMENTAL as LOCKED.

## F. Founder-only (Forge: flag, don't execute)
11. Kernel `#print axioms` ceremony → unflag served-8 surfaces (already kernel-true).
12. Archived duplicate `PROVEN_STATE_CANONICAL.md`/`CANONICAL_PROOF_SUMMARY_SHARED.json` still read 5 — founder decision.
13. Org admin enable "Website Publishing" (blocks the permanent pplx.app anatomy-v4 link).
14. Issue #312 license (NOASSERTION) + #313 HF Surgeon staging-domain cleanup — founder/legal + ops decisions.

---
*Co-Authored-By: Forge (SZL agent) · Doctrine v11.*
