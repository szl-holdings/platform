# SZL Zoom-Out Gap Audit — 2026-06-11 ~00:30 EDT (CTO/Computer)
Full-estate scan after the quantum-bio v5 push. 30 repos, 3 Spaces, all CI + open PRs reviewed. "Did I miss anything?" — here is everything.

## ✅ HEALTHY / DONE (verified live this scan)
- **3 HF Spaces RUNNING** (a11oy, killinchu, anatomy) — confirmed via API.
- **a11oy**: 0 RED CI; BUILD_ERROR permanently fixed (resilient Dockerfile); 144 tabs incl. 6 research tabs + Λ-v5 endpoints.
- **killinchu**: only RED = `build-push` (founder-gated GHCR, known); evidence/readiness un-hung; Λ-v5 endpoints live.
- **anatomy**: v5 live (coherence/bioenergetic/Λ-v5/compass panel), 0 CI red.
- **Λ-v5 qbio endpoints** live on BOTH apps, two-ion reconciled to **121.5 mV** (was 127); module byte-identical (drift guards green).
- **Thesis** in `szl-papers/papers/SZL_THESIS_v5.md` (CITATION.cff exists). **Lean v5** in `lutar-lean`.
- **Public sites** (szlholdings-site, docs-site, szl-brand): all CI GREEN — clean base for the landing-page upgrade.
- **szl-uds-deployment**: 0 RED, mesh-ready bundle.

## 🟢 FIXED DURING THIS SCAN (caught a real regression I introduced)
- **lutar-lean `check / doctrine` was RED** — my `SZL_v5.lean` header ("Lambda-invariant closure theorems") tripped Invariant-2 (Lambda-near-theorem without a Conjecture-1 disclaimer). **Fixed**: reworded header to explicitly call lambdaVal the v5 ENGINEERING gate, NOT lambdaUniqueness, Λ stays Conjecture 1. **Doctrine check now GREEN** (commit 3f6debb0).

## 🔴 REAL GAPS (actionable — handed to Forge, founder-creds where noted)
1. **platform: 12 RED CI** — root cause now pinpointed: **vitest/typecheck fails on `moduleResolution: node16/nodenext`** requiring explicit `.js` extensions on relative imports (e.g. `./organizations` → `./organizations.js`, `./auth.js`). Plus e2e-app (counsel/carlota-jo/sentra) + 7 Lighthouse. This is a real build fix (codemod the relative imports to add `.js`), needs the pnpm/turbo Forge env. **NOT just "no test files."**
2. **a11oy PR #303** (align locked-8 in Dockerfile/operator_organ/amaru-DEPLOY) — `mergeable but blocked`, 2 RED (wheel-guard, Build+SBOM), and its **Dockerfile diff is STALE vs my resilience fix** → merging risks reverting the BUILD_ERROR fix. **Do NOT auto-merge; rebase onto current main first**, re-verify it doesn't touch the `A11OY_REQUIRE_LOCAL_LLM` block.
3. **lutar-lean open PRs**: #221 (anchor CI-green theorems into szl-lake) + #223 (EXPERIMENTAL killinchu ADS-B kernel-checked) = mergeable but blocked on **lake build** (Forge env). #224 (Putnam sampler) = **dirty/merge-conflict**, needs rebase.
4. **DOI not minted**: CITATION.cff is generic — no Zenodo DOI for the v5 thesis yet. **Needs founder Zenodo token** → mint DOI, update CITATION.cff, cross-link from anatomy v5 panel + a11oy honest tab.

## 🟡 FOUNDER/FORGE-GATED (cannot do from sandbox — itemized in the CTO master order)
- Hetzner root redeploy (a-11-oy.com autodeploy script) · GHCR push token (killinchu uds-v0.2.0) · cosign/Rekor signing (uds-v0.3.0) · `SZL_LOCAL_LLM_URL` brain secret (flips Chaski stub→live) · UDS cluster deploy (k3d + Zarf/UDS/Pepr/K9/Lula) · lake build to regen VERIFIED_THEOREMS.md.

## 📋 IN-FLIGHT (already specced to Forge in forge-CTO-MASTER-20260611.md)
All §A–I of the CTO master order: every-tab-unique+live-wiring audit, all-3D upgrades (anvaka/vasturiano/deck.gl, build order A2→A3→A1→A4→A5), genius landing page + user-friendliness (marketers/directors + Opus 4.8), theory evolutions (QM top-6), DeSci/Zenodo hooks, backend endpoints (loop_depth, routing-graph, votes/round, router-metrics). Research reports synced to `platform/replit-sync/research/`.

## NOTHING-MISSED CHECKLIST (the zoom-out)
- [x] All 30 repos inventoried; only 4 open PRs total (the 35 "killinchu issues" are tracking, not PRs).
- [x] All Spaces healthy + aligned (drift guards green on a11oy + killinchu).
- [x] Recent shipped work verified solid; one regression (lutar-lean doctrine) caught + fixed.
- [x] Platform reds root-caused to a specific fixable typecheck issue (not vague).
- [x] DOI/CITATION gap identified (founder-gated).
- [x] Landing/site repos confirmed green for the upgrade.
- [x] No silent BUILD_ERROR / stalled Space / unmerged-safe-PR left unaddressed.

## RECOMMENDED NEXT (priority order for Forge)
1. Rebase + re-verify a11oy #303 (protect the Dockerfile resilience fix), then merge.
2. Codemod platform relative imports → `.js` (clears vitest/typecheck), re-run suite.
3. lake build lutar-lean → regen VERIFIED_THEOREMS.md → unblock #221/#223; rebase #224.
4. Mint Zenodo DOI for the thesis (founder token) → update CITATION.cff.
5. Execute CTO master order §A–C (tab wiring + 3D + landing) with the dev pair.
