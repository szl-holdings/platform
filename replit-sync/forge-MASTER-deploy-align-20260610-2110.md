# Forge MASTER Deploy + Align Order — 2026-06-10 ~21:10 EDT
**From:** CTO (Computer)  **To:** Forge (Replit build env)
**Mandate (founder):** make a11oy, killinchu, a-11-oy.com/Hetzner, Hugging Face, and the UDS payload + mesh ALL deployable and ALIGNED. Think for yourself where the runbook leaves a choice. **T-6 to Defense Unicorns Warhacker (June 16–19).** Doctrine hard-gate applies to everything.

This is the single "make it real everywhere" order. It supersedes the open deploy items in prior orders. Sections A–E are the five surfaces; F is the cross-surface alignment gate; G is doctrine.

---

## STATE AT HANDOFF (verified by me tonight)
- **a11oy**: HF Space RUNNING; CI all-green (drift guards + Contract-matrix + hf-module-drift all ✓). Console = **143 tabs** including 6 brand-new research tabs I shipped: `receiptfp`, `capfsm`, and the 4 genius 3D tabs `ouro_spiral` / `abacus_manifold` / `consensus_basin` / `gemstones_frontier` (all live-verified, 0 JS errors, doctrine-clean, 0 runtime CDN). GitHub↔HF byte-identical.
- **killinchu**: HF Space RUNNING; CI green EXCEPT `build-push` (GHCR uds-v0.2.0 private-registry gap — see B). Your per-tab Research/Sources panel (commit aef6a313) is live.
- **anatomy**: HF Space RUNNING (served at `szlholdings-anatomy.static.hf.space`).
- **Drift**: I healed two shared-file drifts your commits introduced — `corpus/doctrine/a11oy__HONEST_DISCLOSURE.md` and `corpus/formulas/a11oy__docs__theorem-runtime-manifest.json` — synced byte-identical across a11oy GH+HF and killinchu GH+HF. Both drift guards GREEN. **Going forward: when you edit a shared corpus/szl_* file in one repo, mirror it to the other in the same push** (or the guard reds).
- **a-11-oy.com**: reachable (hourly uptime cron confirmed 7:41 PM EDT).

---

## A. a-11-oy.com / HETZNER — make the box serve the current build (YOU/founder, needs root)
Box `167.233.50.75`. The sandbox cannot SSH; this is yours.
1. **One-time autodeploy install** (idempotent installer already in repo):
   ```bash
   ssh root@167.233.50.75
   curl -fsSL https://raw.githubusercontent.com/szl-holdings/a11oy/main/ops/install-a11oy-autodeploy.sh | sudo bash
   ```
   This wires the box to pull `main` and serve the current a11oy (systemd + watcher). Confirm it serves the **143-tab console** (the 6 new research tabs must appear) and `cathedral.html` shows **locked-8** {F1,F4,F7,F11,F12,F18,F19,F22}.
2. **TLS**: confirm the cert on a-11-oy.com has >21 days validity (the twice-daily sentinel warns under 21d). Renew via certbot if needed.
3. **Self-hosted brain (flips Chaski stub→live)**: set the box's `SZL_LOCAL_LLM_URL` to the Qwen2.5-Coder-32B-AWQ endpoint (and the same as an HF Space secret — see C). Until set, Chaski is an honest labeled stub; do NOT relabel it "live" until the endpoint answers.
4. **Align check after deploy**: `cathedral.html` / `/console` served on a-11-oy.com must be byte-equivalent in doctrine + tab set to the HF Space and GitHub `main`. If you changed anything on the box, push it back to GitHub so the three stay aligned (no box-only drift).

## B. HUGGING FACE — keep Spaces aligned + close the GHCR gap
1. **Byte-identical rule**: HF Spaces do NOT auto-sync from GitHub. Any shared module or served file you change in GitHub must be POSTed to the HF Space (`huggingface.co/api/spaces/SZLHOLDINGS/<app>/commit/main`, NDJSON). Docker Spaces need a rebuild (commit triggers it; `restart?factory=true` after Dockerfile/COPY change).
2. **killinchu GHCR `build-push` (the one red CI)**: this is the uds-v0.2.0 image push to the private registry — founder-gated credentials. Either (a) provide the GHCR push token so the workflow can publish `ghcr.io/szl-holdings/killinchu:uds-v0.2.0`, or (b) keep it explicitly documented as a known gap in HONEST_GAPS.md §1 (it already is). The UDS bundle (D) needs this image to exist in GHCR to deploy killinchu to a cluster.
3. **Secrets**: ensure `A11OY_HMAC_KEY` (a11oy Space) and `ROSIE_HMAC_KEY` (the verifier) carry the SAME 32-byte value (per the HONEST_DISCLOSURE I just synced) — otherwise receipts verify as TAMPERED. Set `SZL_LOCAL_LLM_URL` on the a11oy Space if using the self-hosted brain.

## C. a11oy + killinchu APP UPGRADES (you own the killinchu Python console; I own a11oy static)
- **a11oy**: I've shipped the 4 research 3D tabs (sandbox-buildable). The BACKEND pieces behind them are yours (see E): wire real `loop_depth` into the command-log so `ouro_spiral` shows true depth (not a proxy); expose a `/api/chaski/routing-graph` endpoint so `abacus_manifold` + the tripartite hypergraph use live GNN scores; add per-receipt `votes/round` so `consensus_basin` uses real convergence; add a live router-metrics endpoint so `gemstones_frontier` overlays the real router shape (currently SAMPLE).
- **killinchu** (`killinchu_elite_console.py`, your file): A1 — rename codename API routes `/api/killinchu/v1/{rosie,amaru}/...` → honest roles (`operator/*`, `osint/*`), keep 308 aliases one release (a 429/500 currently echoes the codename URL to the user). A2 — differentiate the two "Maritime Picture" tab titles (`u_maritime` vs `maritime`). Consider porting the 4 research-3D tab ideas to killinchu where they fit counter-UAS C2 (e.g. consensus_basin over the C2 receipt DAG; routing hypergraph over sensor→effector chains). Keep the effector SIMULATED.

## D. UDS PAYLOAD + MESH — make the bundle deployable end-to-end (repo: szl-holdings/szl-uds-deployment)
The repo is mesh-ready (`MESH_READY.md`, `UDS_DEPLOY_RUNBOOK.md`, root `zarf.yaml` + `uds-bundle.yaml` + `tasks.yaml`; bundles/{a11oy,killinchu,prove-organs,szl-full-stack,szl-uds-bundle,szl-warhacker}; capabilities/{doctrine-completeness-zarf,reed-solomon-zarf,szl-governance}). It interoperates with UDS Core via public APIs only (Apache-2.0, copies no AGPL). To make it actually deployable:
1. **Cluster bring-up** (k3d local or the demo cluster):
   ```bash
   uds deploy oci://ghcr.io/defenseunicorns/packages/uds/core:1.5.0-upstream --confirm   # prerequisite (AGPL, theirs)
   uds run   # or: uds deploy <our bundle> --confirm  (see UDS_DEPLOY_RUNBOOK.md §1)
   ```
2. **Images must exist in GHCR**: the bundle references `ghcr.io/szl-holdings/{a11oy,killinchu}:<tag>`. Resolve B.2 (push uds-v0.2.0) so `uds deploy` can pull. Until then the bundle builds but can't run killinchu.
3. **Pepr governance capability** (`capabilities/szl-governance`): deploy the SZL Pepr module so UDS Package CRs enforce our gates; **Lula/OSCAL** compliance assessment runs as the `doctrine-completeness-zarf` capability. Confirm `uds zarf package create` + `uds zarf package deploy` both succeed for `capabilities/reed-solomon-zarf.yaml` and `doctrine-completeness-zarf.yaml`.
4. **Sign + verify** (founder-gated, do NOT self-merge): cosign-sign the uds-v0.3.0 artifacts + Rekor transparency log; this is the `uds-sign-release.yml` / `zarf-build-and-sign.yml` path. SLSA wording stays "L1 honest · L2 build-attested · L3 roadmap".
5. **Mesh align**: the deployed mesh's served a11oy/killinchu must match GitHub `main` (same tab set, same doctrine). Add a post-deploy smoke check (the readiness-harness probe runner) that hits the in-cluster service and confirms locked-8 + Λ=Conjecture 1 + 0 codenames.

## E. BACKEND RESEARCH UPGRADES (from the two cluster reports — pick up where I handed off)
Full detail + formula mappings: `team/CLUSTER_RESEARCH_2026-06-10.md` and `team/CLUSTER_RESEARCH_PHYSICS_MATH_2026-06-10.md`. Priority order:
1. **Chaski tripartite routing GNN** (GraphRouter, ICLR 2025) — task×capability×agent graph from Khipu history, edge-prediction `(c*,a*)=argmax[λê−(1−λ)ĉ]`, inductive. Expose `/api/chaski/routing-graph` so my `abacus_manifold` + a future tripartite-3D tab read live scores.
2. **Loop-depth metadata** (Ouro/McLeish) — add `loop_depth: R` to command-log entries when running looped-LM capabilities; flips `ouro_spiral` from proxy to true depth. Apply Antizana's `UniversalTransformerCache` fix before deploying any Ouro-class model under Chaski.
3. **Per-receipt consensus metadata** (`votes`/`round`/`confirmations`) — flips `consensus_basin` from chain-depth proxy to real EqR convergence. Khipu BFT stays Conjecture 2.
4. **MPP-style capability embeddings** (Polymathic/Jeff Shen) — compute shared cross-domain capability embeddings, cache UMAP coords in knowledge.json → enables the "physics latent space" tab (Viz #5). Router-R1 think-route loop + sqlite-zstd receipt compression as before.
5. **Abacus/xVal numeric encoding** in the routing-envelope + receipt verifier (F22 monotonic ordering of quality scores).

## F. CROSS-SURFACE ALIGNMENT GATE (the definition of "aligned" — verify before declaring done)
GitHub `main` == HF Space == a-11-oy.com/Hetzner == UDS bundle payload == deployed mesh, on ALL of:
- same **tab set** (143 on a11oy incl. the 6 new research tabs) and same served HTML;
- shared `szl_*.py` + corpus/doctrine + corpus/formulas files **byte-identical** across a11oy↔killinchu (both drift guards green);
- **locked-8** exactly {F1,F4,F7,F11,F12,F18,F19,F22}; **Λ=Conjecture 1**; **Khipu=Conjecture 2**; **SLSA L1 honest·L2 attested·L3 roadmap**;
- **0 user-visible codenames**; Chaski is the agent surface; trust never 100%; 0 runtime CDN; effector SIMULATED;
- CI green on both repos (killinchu `build-push` is the only acceptable known-gap red until B.2).

## G. DOCTRINE HARD GATE (never violate, on every surface)
locked-proven = EXACTLY 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ kernel c7c0ba17. Λ unconditional uniqueness = Conjecture 1 (machine-checked FALSE); Theorem U conditional is fine. Khipu BFT = Conjecture 2. SLSA: never bare L3/FedRAMP/IronBank/CMMC/ATO without "roadmap". NO user-visible codenames (amaru/rosie/sentra/jarvis) — internal API-alias/sanitization tables OK; agent surface = Chaski. Trust never 100%. 0 runtime CDN (vendor in-image). No fabricated data (label SAMPLE/SIMULATED/proxy/stub). killinchu effector SIMULATED. GitHub↔HF byte-identical on shared modules; ast.parse .py before push. NEVER commit a key. NEVER weaken a gate. No bandaids. No Lean self-merge.

## WHAT TO SEND BACK
Per surface (A–E): done/blocked + commit shas or the specific credential/root-access you need from the founder. Confirm the F alignment gate passes. For the founder-gated items (Hetzner root, GHCR token, cosign/Rekor signing, UDS cluster) say exactly what you need and I'll relay.
**Let's go — make it real, make it aligned, keep it honest.**
