# FORGE MASTER WORK-ORDER — make it real & operational — 2026-06-10 (~17:50 EDT, T-6 to Warhacker)
**Perplexity (parent, autonomous) → Forge / Replit · canonical path: `platform/replit-sync/`**

> This is the SINGLE consolidated work-order. It supersedes the task lists in earlier
> `forge-*` payloads (state + doctrine refreshed below). Everything parent could do
> autonomously is DONE; this file is only the work that needs YOUR environment
> (a real cluster, signing keys, the Hetzner box, a full monorepo clone, or founder approval).

## 0. DOCTRINE — CURRENT HARD GATE (use THIS; supersedes any "locked=5" in older docs)
- **locked-proven = EXACTLY 8** = {F1, F4, F7, F11, F12, F18, F19, F22} @ kernel `c7c0ba17`,
  theorem `locked_count_eight` (by `decide`, no axioms). F4/F7/F22 are GENUINE non-vacuous proofs
  (F4 = Khipu DAG acyclicity, F7 = Chaski FIFO order, F22 = emit monotonicity). ~185 experimental
  (Waves 11–22) stay experimental — NEVER fold into the 8; NEVER inflate beyond 8.
- **Λ unconditional uniqueness = Conjecture 1** (machine-checked FALSE); conditional = Theorem U (axiom-free).
  **Khipu BFT safety = Conjecture 2** (Wave23 conditional only).
- **SLSA**: "L1 honest · L2 build-attested on a11oy/killinchu container images · L3 roadmap". NEVER write a bare
  `SLSA L3` / `SLSA L2` / FedRAMP / Iron Bank / CMMC / ATO claim without an exemption word
  ("roadmap" / "not yet earned" / "target→roadmap" / verified-organ evidence ref). The org doctrine guard
  greps for this in EVERY repo's prose.
- No user-visible codenames (amaru/rosie/sentra/jarvis → Provenance Anchor/Operator/Policy; Quechua organ
  names Yuyay/Yawar/Puriq/Chaski/Yachay OK; agent surface = Chaski). Trust never 100%. 0 runtime CDN.
  No fabricated data (label SAMPLE/SIMULATED/stub). killinchu effector SIMULATED. GitHub↔HF byte-identical
  on shared modules. Never commit a key. Never weaken a gate. No Lean self-merge. SZL Zenodo DOIs only (no external citations).

## 1. WHAT PARENT ALREADY SHIPPED THIS SESSION (do NOT redo)
- locked 5→8 across kernel + a11oy /console + killinchu /elite + HF org card + GitHub org profile + anatomy
  + a-11-oy.com `cathedral.html` + K9 ops. Honest/formulas tabs fixed (badges + chart slices). Verified live.
- **Operator widget = Chaski**: vendored `static-vendor/a11oy-operator-widget.js` (0 CDN, no codenames),
  injected on EVERY served HTML surface via additive serve.py middleware in BOTH apps, wired to live
  `/api/a11oy/code/chat|agent` + v4 ledger. Byte-identical both apps. **Do NOT re-add the old rosie CDN script.**
- 243 tabs swept one-by-one (a11oy 136 / killinchu 107) + anatomy — all render, no bandaids.
- killinchu build fix: added missing `szl_connectors/{data_sources,identity}/__init__.py` (canonical from a11oy)
  → Dockerfile build-file guard GREEN. lutar-lean axiom-hygiene gate fixed (a "sorry-free" comment false-positive).
- Both drift guards GREEN; 13 shared modules byte-identical; 3 HF Spaces RUNNING.

## 2. YOUR TASKS — make the remaining pieces REAL & OPERATIONAL

### A. a-11-oy.com live (Hetzner) — HIGHEST VISIBILITY
GitHub main `cathedral.html` is locked-8, but the Hetzner box (167.233.50.75) still SERVES the old 5-set.
The auto-deploy timer isn't picking up commits. **On the box, as root, ONCE:**
```
curl -fsSL https://raw.githubusercontent.com/szl-holdings/a11oy/main/ops/install-a11oy-autodeploy.sh | sudo bash
```
This installs a systemd timer that polls GitHub main every 3 min and runs `a11oy-rebuild`. After it, a-11-oy.com
serves locked-8 + the Chaski widget within ~3 min of any push. Verify: `curl -s https://a-11-oy.com | grep -o "F1, F4, F7"`.

### B. Self-hosted brain — flips Chaski from labeled-stub to live (NO provider token, our own weights)
`szl_llm_registry.py` already has an `szl-local` provider reading env `SZL_LOCAL_LLM_URL`. On the RTX box:
1. `ollama pull qwen2.5-coder:32b` (or vLLM serving the AWQ build). Apache-2.0, fits a 24–32GB GPU.
2. Expose as OUR endpoint via Cloudflare Tunnel → `https://brain.a-11-oy.com` with OUR OWN bearer (not a provider key).
3. Set Space secrets on SZLHOLDINGS/{a11oy,killinchu}: `SZL_LOCAL_LLM_URL` (+ `SZL_LOCAL_LLM_KEY`).
4. Update the `szl-local` registry `model_slug` placeholder → `qwen2.5-coder:32b` so routing receipts stay truthful.
Chaski flips stub→live the instant the secret resolves. (Honest line: we run open weights we legally downloaded;
we do NOT claim to have trained any frontier model — the moat is the governance, not the weights.)

### C. UDS PUSH — full Zarf/Pepr/Lula + K9 against a real cluster (needs k3d/kind — parent has no cluster)
Detailed sequence is in `platform/replit-sync/forge-uds-push-20260610.md`. Summary, one-by-one:
1. `k3d cluster create szl` (or kind). Confirm `kubectl get nodes` Ready.
2. Build each Zarf package: `zarf package create` in szl-fleet-overlay + uds-bundles (zarf.yaml/uds-bundle.yaml
   are validated + well-formed; image tags are pinned, NOT `:latest`).
3. `uds deploy` the bundle(s) in dependency order; confirm Pepr admission policies load + Lula/OSCAL validates.
4. Bring up the **K9 ops interface** against the live cluster (the K9 surface already exists + pulls real HF/GitHub
   status and shows locked-8; point it at the cluster). Test each panel one-by-one; label anything not-yet-wired SAMPLE.
5. Keep SLSA wording L1-honest / L2-on-organ-images / L3-roadmap throughout. Receipts: honest SIMULATED until a real
   signing key is wired (see D).

### D. Signing PRs (FOUNDER-APPROVAL gate — rebase + tee up, do NOT self-merge the signed pieces)
- szl-uds-deployment **#57** (verify receipt signing — Ed25519 verifier) + **#51** (cosign SLSA-L2 bundle —
  wording MUST stay "roadmap / not yet earned"): `git rebase origin/main` each, resolve conflicts, push, get CI green.
  Then they wait on the founder for the cosign-keyless/Rekor ceremony. #51 is an over-claim risk until L2 is actually earned.

### E. CI hygiene Forge can clear (with your build env)
1. **platform `check / doctrine` RED** — the org doctrine guard (reusable workflow in `.github`) flags unexempted
   prose. Run it LOCALLY on a full clone: `.github/scripts/doctrine_precommit.sh` (or `make doctrine`), which mirrors
   Invariants 1–3 (doctrine-version drift, Λ-as-theorem, bare SLSA L2/L3). Parent already scoped several
   `replit-sync/` lines; there is at least one more **bare `SLSA L3`** survivor in the monorepo prose (likely an
   `artifacts/*/src` product page or a status doc) — find it with the guard's exact Invariant-3 grep and scope it
   "roadmap" or name a verified organ's evidence file. Also clears the platform `Tests` red.
2. **szl-cookbook #68** (dependabot npm bump) — `build-and-test` is RED; fix the recipe build (run `npm ci && npm test`
   in `recipes/anatomy-evolved-v1/code` + `recipes/knot-calculus-v1/code`), then merge.
3. **lambda-bounty #3** — `git rebase origin/main` (it's dirty), then merge (doctrine-positive Conjecture-1 caveats).
4. **uds-mesh "Release Please"** red — your call; release-please config/branch hygiene.
5. **killinchu GHCR Build + Push (uds-v0.2.0)** — known private-GHCR/image-pin gap (HONEST_GAPS.md §1); founder-gated
   (make the package public or wire the pull secret).

### F. Wave24 Lean (branch only, NO self-merge)
Admissibility-certification soundness (conditional, axiom-clean); connect Wave23 BFT to the signed execution
certificate; first honest Semantic Linearizability definition + one proven property. Statement-only until kernel-verified.


### G. lutar-lean Lake build — regenerate VERIFIED_THEOREMS.md (needs the Lean build env)
The kernel is sound: `locked_count_eight` proves and the axiom-hygiene gate PASSES (parent fixed a
"sorry-free" comment false-positive at commit `861357ea`). The Lake build now fails ONLY at the
"Drift gate (VERIFIED_THEOREMS.md out of date vs build)" step — the committed `VERIFIED_THEOREMS.md`
is stale vs the build (which now includes the genuine F4/F7/F22 proofs). Parent cannot regenerate it
(no Lean/Mathlib toolchain + the generated artifact download redirects to blob storage the sandbox
can't reach). **You (or the CI) fix it in one step:**
```
lake build
python3 .github/scripts/gen_verified_theorems.py --repo-path . --out VERIFIED_THEOREMS.md
git add VERIFIED_THEOREMS.md && git commit -s -m "chore(verified): regen VERIFIED_THEOREMS.md vs build (locked-8 / F4,F7,F22 real)" && git push
```
(Or: download the `verified-theorems-861357ea…` artifact from the failed run and commit it as `VERIFIED_THEOREMS.md`.)
This is NOT a content edit — it's the build's own machine-generated ledger. After it, the Lake build goes green.

## 3. HANDSHAKE
After each push, list changed served files in `replit-sync/SYNC_STATUS.md` so parent mirrors to HF byte-identical +
factory-restart. Never both edit the same file in one window. Real live data only. Report to `replit-sync/forge-report-<date>.md`.
Conventional Commits + DCO (`git commit -s`); SHA-pinned actions; squash-merge; one branch per task.
