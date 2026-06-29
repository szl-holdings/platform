# FORGE INSTRUCTION — EXECUTE: drive the 3 founder-gated items to done (TAWANTIN fabric)

**Founder green light 2026-06-15 ~20:30 ET: "do it all, no bandaids, no stalls."** Full box+repo access; execute, don't recommend. FREEZE activates **2026-06-18 15:00 ET** (afternoon demo) — build window open.

Doctrine v11 HARD GATES (never weaken): locked = EXACTLY 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17; Λ=Conjecture 1; Khipu=Conjecture 2; SLSA L1 honest/L2 attested/L3 roadmap; trust never 100%; effectors SIMULATED; 0 runtime CDN; **NEVER claim fused VRAM (horizontal scale only)**; **orbital=ROADMAP, never operational**; never commit a key; honest BLOCKED beats fake green. The half-state is the only unacceptable outcome.

## STATE (verified 2026-06-15 ~20:28 ET)
- Flagships GREEN: a11oy HEAD 21393984 (envelope regression FIXED — 8 governed surfaces back to status=REAL), killinchu green. All 4 HF Spaces RUNNING.
- TAWANTIN fabric LIVE: a-11-oy.com/tawantin + /fabric (200, real page). Name = TAWANTIN ("four united parts"); Chaski=messenger, Khipu=ledger (no collision with locked F7 Chaski-FIFO).
- TAWANTIN Zarf bundle shipped + schema-valid: szl-uds-deployment bundles/tawantin (commit 4b6fbbcf), additive, guard-compatible.
- Mesh: 2 sovereign GPUs reachable (laptop rtx-betterwithage + chaski 100.102.173.88). Energy MEASURED ~843k J climbing, stub_mode:false, per-node labels live.
- Multi-GPU coordinator shipped + tested: szl-router mesh_coordinator.py (3652c7b9), runnable, not yet the production front.
- Parallel cleanup in flight (interactive session): secondary-repo CI reds, lutar-lean sorry-gate, allowlist prune, naming fold.

## THE 3 FOUNDER-GATED ITEMS — DRIVE TO DONE (you have box access)
### 1. OMEN node green (last sovereign GPU)
The box lists omen-betterwithage but probes reachable=false/timeout at 100.70.130.45:11434. The OMEN is VERIFIED serving (llama3.1:8b 100% GPU, listening [::]:11434). D3 shipped the resolver fix (a11oy e39fb290) supporting env-pins. ACTION on the box: set
`A11OY_GPU_NODE_OMEN_BETTERWITHAGE_IP=100.70.130.45` and `A11OY_GPU_NODE_CHASKI_IP=100.102.173.88`, redeploy from current main, re-press the energy operator. Then CONFIRM the box's real TCP probe to 100.70.130.45:11434 connects (tailnet route live). If it connects -> omen flips reachable:true by REAL probe (gpu_nodes_reachable -> 3). If it does NOT connect, that's an honest tailnet-route issue (founder hardware) — report it; never bluff the node up.

### 2. Coordinator live-cutover (laptop freed to travel)
Run szl-router mesh_coordinator.py on the box (docs/MESH_COORDINATOR.md, port 11500) and set `A11OY_MODEL_BASE_URL -> http://<box>:11500/v1` so model traffic load-balances across the reachable sovereign GPUs with honest provenance. PROVE: a request returns x-szl-serve-tier + served_by + sovereign(true only owned metal); a down node is never claimed as serving.

### 3. cosign-sign the bundles with FA-001 (founder-held key)
Recut + publish + sign the TAWANTIN bundle (bundles/tawantin) AND the szl-warhacker bundle from current main with the founder FA-001 key (uds publish -> cosign sign -> cosign verify with .github/cosign.pub -> uds deploy air-gap proof). Commands in bundles/tawantin/README.md + cosign/UDS_COSIGN_FOUNDER_HANDOFF.md. NEVER commit the key. This is the only step that needs the founder's hand on the key.

## PROVE-IT (real public curls in your forge-report: code+content-type+bytes)
- [ ] compute-pool-hardened: gpu_nodes_reachable target 3 (OMEN+chaski+laptop) by REAL probe; honest reason if a node can't route.
- [ ] energy/operator/status: joules MEASURED climbing, stub_mode:false, by_node labeled.
- [ ] /tawantin + /fabric 200 real page; /honest git_sha == a11oy main HEAD; doctrine v11 locked 8 c7c0ba17 Λ=Conjecture 1.
- [ ] all repos CI green (flagships + secondaries the interactive devs are fixing); shared modules byte-identical.
- [ ] coordinator answering on /v1 with honest provenance; A11OY_MODEL_BASE_URL repointed.
- [ ] TAWANTIN + warhacker bundles signed + cosign verify PASS (founder step).

## HARD GATES (founder approval, never auto): FA-001 key, Rekor, warn->enforce, MAJOR dep bump.
NOTIFY founder (stephenlutar2@gmail.com) on real milestones: 'SZL: 3 sovereign GPUs LIVE + coordinator wired' / 'TAWANTIN bundle signed' / honest BLOCKED with the exact failing command. Do NOT return vague RECOMMENDED. Honest BLOCKED beats fake green.
