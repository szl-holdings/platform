## R-JACK-IN (TOP — founder: TEST THE JACK BEFORE THE WIRING) — probe every energy/data jack, then wire, ALL GPU-side tests on the box
Founder directive: probe each jack live and confirm it responds BEFORE building any adapter against it.
The agent sandbox CANNOT reach the Tailscale GPU, so ALL GPU-box jacks (NVML/vLLM/Chaski/systemd) are
yours to probe+wire+test on the box. Full order: replit-sync/energy_engine/R_JACK_IN_ORDER.md.
AGENT-SANDBOX PROBES ALREADY DONE (off-box jacks, 2026-06-13):
  - J2a aWATTar (api.awattar.de/v1/marketdata, no key): PASS — LIVE and showing NEGATIVE PRICES NOW
    (-1.11 and -4.92 Eur/MWh). This is REAL stranded/curtailed power: the grid is paying to offload.
    The harvest signal the founder described is real and confirmed.
  - J2b CAISO OASIS (oasis.caiso.com/oasisapi PRC_LMP): PASS — HTTP 200.
  - J5 WattTime v3 (api.watttime.org/v3): 401 — reachable, needs token; stays SAMPLE until keyed (never commit).
FORGE PROBES FIRST on the box (before wiring): J1 NVML `nvidia-smi --query-gpu=power.draw,...` (live watts?),
J3 vLLM (`vllm --version`; does a 32b fit RTX 5000 VRAM? be ready to drop to 14b/7b), J4 systemd+daemon import.
Report the PHASE-A probe table FIRST; only wire jacks that PASSED. Then PHASE-B wire+test, leading with
JACK 1 = FIRST MEASURED JOULE: serve one qwen2.5-coder:7b turn, capture power.draw before/after,
joules = W x seconds, emit ONE receipt through the Bekenstein /v1/energy/budget gate with
joules_label:"measured" (on-box NVML path only; everything off-box stays SAMPLE). JACK 2: map aWATTar
NEGATIVE price -> posture negative-price -> scheduler ADMITS batch in the negative window, DEFERS in an
expensive one. JACK 3: vLLM + /metrics slack. JACK 4: systemd resident daemon + Chaski reactive preempt.
Report raw test output per jack with honest MEASURED-vs-SAMPLE labels to replit-sync/forge-jackin-report-<UTCstamp>.md.
Doctrine: no free-energy; joules SAMPLE until a real meter; sovereign only when local serves (half-state
forbidden); never commit a key; Λ=Conj1; locked-8 untouched. You do NOT merge; never --admin lutar-lean.
The single demo slice = JACK 1 producing one MEASURED joule on the box.

## R-FRONTIER (zoom-out finding) — ALLODIAL backbone is PROVEN but un-served; now wired (PR #337)
Zoom-out across all 30 repos + a11oy + lutar-lean + thesis v1->v26 found the real frontier lever: the
founder's central "allodial, no kill-switch, no one can switch it off" vision already has a KERNEL-CHECKED,
0-sorry Lean backbone (Lutar/Allodial.lean #229, EXPERIMENTAL tier) that was NOT served anywhere. a11oy
already runs a LIVE formula rail (GET /api/a11oy/v1/formula/<name> + /formulas/index, live at
https://a11oy.net/api/a11oy/v1/formulas/index 200). We extended that rail with ONE tight PR:
  a11oy #337 (feat/allodial-frontier-formulas, +994, OPEN, NOT merged) adds:
   - /api/a11oy/v1/formula/allodial  (allodiality/dominance/non-interference; cites Allodial.lean #229 EXPERIMENTAL)
   - /api/a11oy/v1/formula/entanglement (capBound=C0*e^(-gamma*t) CAPACITY bound; cites Entanglement.lean #230 EXPERIMENTAL)
   - /api/a11oy/v1/formula/sovereign (NEW SOVEREIGNTY GATE: sovereign:true ONLY when local_node_serving;
     banner-sovereign + external routing -> half_state:true,sovereign:false; grounded in the proven
     non-interference theorem ni_low_independent_of_high). This operationalizes our #1 doctrine invariant
     (the half-state is the ONLY unacceptable outcome) as a live, formally-cited endpoint.
  Self-tests green: allodial ok:true/12, entanglement ok:true/9, gate ok:true/10. EXPERIMENTAL-tier throughout:
  locked-8 untouched, NO Lambda claim, NO free-energy, NO key. Brief: replit-sync/energy_engine/FRONTIER_ZOOMOUT_20260613.md.
MERGE ORDER for #337: it only adds new formula modules + index entries on the existing rail (disjoint from
the energy stack); merge any time after a11oy #328 lands (same file a11oy_formula_endpoints.py touched lightly).
This does NOT change the real bottleneck: 27 PRs open, ZERO merged, NOTHING on the RTX 5000 — first measured
joule still the top operational move.

## R-ENGINE-V2 (supersedes R-ENERGY) — Full agentic-GPU engine: 26 PRs ready
The engine is now COMPLETE across **26 open PRs** (FE+BE+3 Lean proofs) — built, self-tested,
doctrine-clean, NONE agent-merged. This includes the finishing wave the founder asked for:
3D HOLOGRAPHIC command bridge (a11oy #336, web/hologram.html, Three.js living-organism view),
real data sources (platform #369: NVML measured-joule path + LIVE aWATTar price feed + CAISO),
unified /v1/engine/status (a11oy #335), and the organ-bus end-to-end (platform #367).
Full order + merge sequence + box bring-up: replit-sync/energy_engine/DEPLOY_ORDER_V2.md
(companion: UNIFIED_BUILD_ORDER.md, CTO_STATUS.md, HOLOGRAM_NOTES.md, REAL_SOURCES.md, ENGINE_STATUS.md).
Engine = RTX 5000 @ betterwithage.
PRs by repo:
  lutar-lean #239/#240/#241 (KEYSTONE proofs — founder-gated, NEVER --admin merge);
  platform #356/#357/#358/#359/#360/#361/#362/#363/#364/#365/#366/#367/#368/#369;
  a11oy #328/#329/#330/#331/#332/#334/#335/#336; anatomy #7.
Merge bottom-up: proofs first; then platform spine #356->#357->organ/swarm stack->#369;
then a11oy #328->receipt/console/dashboard/status->#334->#336; then anatomy #7.
Box: confirm Ollama, vLLM upgrade (qwen2.5-coder:32b :8000), systemd the daemon (resident,
Restart=always — survives laptop off), wire Chaski reactive ingress + /metrics slack.
CTO PRIORITY: the #1 gap is NOT more code — it's that 26 PRs are open, ZERO merged, NOTHING
deployed. FREEZE new frontiers; ship ONE vertical slice deployed+MEASURED: merge spine
(#239,#356,#357,#369,#328), bring up daemon on-box, wire NVML power.draw -> joules -> emit ONE
MEASURED receipt through the Bekenstein /v1/energy/budget gate, show it on the hologram. That
single slice = first measured joule = proves the whole thesis.
joules stay SAMPLE until a real meter (aWATTar price is the only LIVE real signal today).
Reactive never starves; sovereign only when local serves; consent-only swarm; never commit a key;
Λ=Conj1; Khipu BFT=Conj2; locked-8 untouched. The half-state is the ONLY unacceptable outcome.

## R-ENERGY (was TOP) — Proven Energy Engine: 13 PRs ready, deploy to the RTX 5000
The full agentic-GPU energy engine is BUILT + PROVEN + WIRED across 13 open PRs (FE+BE+2 Lean
proofs), all doctrine-clean, none agent-merged. Complete order + merge sequence + box bring-up:
replit-sync/energy_engine/FORGE_ENERGY_ENGINE_ORDER.md. Engine = RTX 5000 @ betterwithage.
PRs: lutar-lean #239/#240 (keystone proofs); a11oy #328/#329/#330/#331/#332; platform
#356/#357/#358/#359/#360/#361. Merge bottom-up (proofs, then platform #356->#357->rest, then a11oy
#328->rest). Then box: confirm Ollama, vLLM upgrade (qwen2.5-coder:32b :8000), systemd the daemon,
wire Chaski reactive ingress + /metrics slack. joules stay SAMPLE until a real meter. Reactive never
starves; sovereign only when local serves; consent-only swarm; never commit a key; Λ=Conj1; locked-8
untouched. The half-state is the ONLY unacceptable outcome.

## R-FREEPOWER (vision + software-now) — free brains, stranded energy, allodial, no kill-switch
Founder vision: free open-weight brains (China has the answers) + free/owned ENERGY from what the
world WASTES (curtailed wind/solar, negative-price power, flared gas, surplus micro-hydro, biogas,
waste heat) -> allodial sovereign compute no one can switch off. Researched + cited specs:
replit-sync/ALLODIAL_FREE_COMPUTE_VISION.md + replit-sync/STRANDED_ENERGY_SOVEREIGN_COMPUTE.md.

DO NOW [Forge] (software-first, no hardware needed):
1) FREE TIERS into the LiteLLM router as zero-cost fallback model_names (keys via secret store,
   NEVER committed): Zhipu GLM-Flash (PERMANENTLY free, open.bigmodel.cn/api/paas/v4), SiliconFlow
   free (Qwen3-8B/DeepSeek-R1-Distill, api.siliconflow.cn/v1), Groq free, GitHub Models, OVH Kepler
   anon (no key), NVIDIA NIM. Label every free-tier turn served_by + sovereign:false (honest).
2) OWN THE WEIGHTS: mirror glm-4.6 + qwen2.5-coder:32b + a deepseek coder to the SZL HF org (open
   weights = ours forever, no landlord).
3) ENERGY-AWARE SCHEDULER: gate heavy/batch inference + model pulls to cheap/negative-price /
   off-peak windows (grid-price feed or simple off-peak time window); LOG the energy window used.
4) PROVENANCE RECEIPT: add served_by + energy_source fields to the turn receipt now (value "grid"
   today) so the honest-power plumbing exists for when stranded-energy nodes come online.

[Founder] Tier-0 solar+LiFePO4 anchor (Mac mini M4) = unkillable allodial floor; then scout ONE
behind-the-meter curtailed-renewable / micro-hydro partner (WinDC/Soluna/Greensparc model) for a
real stranded-energy sovereign node. SZL edge: governed, verifiable open-weight inference on
energy others waste — "honest AI on honest power," carbon-cutting, no grid, no kill-switch.

DOCTRINE: open-weight only; never commit a key; sovereign:true ONLY on own metal; free/grid tiers
honest sovereign:false; energy_source claims must be REAL (no greenwashing); half-state forbidden.

## R-RESILIENCE (HIGH) — make the ecosystem ALWAYS-good, laptop-independent (no SPOF)
Founder: "make sure the GPU keeps the whole ecosystem going no matter what... if laptop goes off
we always good." Full researched spec: replit-sync/SOVEREIGN_RESILIENCE_FABRIC.md.

PROBLEM: everything hangs on ONE node (100.125.77.31 betterwithage over Tailscale). Laptop off or
GPU asleep -> sovereignty drops. NO redundancy.

DO (Forge parts now; founder parts flagged):
1) [Forge] Stand up a LiteLLM proxy (self-hosted, OpenAI-compatible) as the SINGLE stable endpoint
   the app calls. Config local-priority fallback: code -> [code-bonus(betterwithage) -> code-cloud
   (RunPod) -> code-router(HF)]. Point A11OY_MODEL_BASE_URL at the proxy, not a single Ollama.
   num_retries:2, timeout:30. This alone removes the hard single-Ollama dependency.
2) [Forge] In the orchestrator, report served_by (tier-A/B/C/D) + real base_url + cost on EVERY
   turn; sovereign:true only when a LOCAL tier served, sovereign:false (honest) on the HF tier.
   posture: green=multi-node-sovereign, yellow=only-router-left/maint, red=down. KEEP_ALIVE=-1.
3) [FOUNDER] Add an ALWAYS-ON 24GB dedicated GPU as Tier-A primary (GPU Mart RTX Pro 4000 ~$159-199/mo
   flat, zero cold-start, 99.9% SLA), Ollama + qwen2.5-coder:32b + llama3.1:8b, join the tailnet.
   This is the anchor that makes us laptop-independent. (Forge can configure it once it exists.)
4) [FOUNDER+Forge] Tailscale HA: >=2 subnet routers so the tailnet survives any node dropping.

PROVE: kill the betterwithage node -> a real /code/chat/stream turn STILL serves (from Tier A or
honestly from router with served_by labeled), healthz never shows the half-state. open-weight only;
never commit a key (RUNPOD_KEY/A11OY_GPU_TOKEN via secret store); locked=8; Λ=Conj1; BFT=Conj2.

# NEXT_ORDER — Perplexity → Forge (2026-06-13 ~05:35 UTC / 2026-06-13 01:35 ET)

FULL ESTATE ALIGNMENT for the June 18 demo. Founder directive: align it ALL — GitHub, Hugging Face,
Hetzner/a11oy.net, killinchu — wired to REAL LIVE PROVABLE DATA, synchronized to ONE truth across every
surface, pushing to new frontiers. Perplexity side built/elevated the front-ends as previews (SZL landing
[family ribbon REMOVED], killinchu site, 3D Verification Sky, Verify-it-yourself) all bound to live endpoints
+ honest SAMPLE fallback, CTO doctrine-clean. Founder runs the box GPS step at home. Doctrine v11 throughout.
Box/Hetzner prod = founder-approved (granted for R0).

## ONE-TRUTH SYNC (highest priority — the honesty thesis depends on it)
Every surface must show the SAME live facts: locked=8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17, Λ=Conjecture 1,
Khipu=Conjecture 2, SLSA L1 honest + L2 attested (L3 roadmap), effector SIMULATED, trust never 100%. Reconcile
ANY surface still off (the org .github/FORGE_BUILD_BRIEF.md still says "5" — founder confirm→update to 8).

## R0 (URGENT) — a11oy.net sovereign OVERCLAIM half-state. Honest fix = redeploy current a11oy main
(#324/#327 already make it honest) + sudo a11oy-rebuild (NO GPU needed → healthz reads sovereign:false/hf-router,
overclaim gone). Optional sovereign upgrade: serve open-weight on betterwithage + set A11OY_MODEL_BASE_URL/
A11OY_GPU_LABEL(/A11OY_GPU_TOKEN for vLLM) + rebuild → sovereign:true, local tag, no cost_usd.
## R0b #323 autodeploy loop + commit real a11oy-rebuild to ops/. ## R7 run WIRE_IT_UP.sh AS ROOT on
167.233.50.75 + /etc/forge-perplexity.env (unblocks hands-off dispatch).

## ALIGN — GITHUB
G1. Keep GitHub↔HF byte-identical on shared szl_*.py/.js (drift guards green). ast.parse/node --check before push.
G2. szl_core shared lib (verticals/receipts/health/connectors/governance_client) used by a11oy + killinchu;
    feed responses BYTE-IDENTICAL (golden-file tests); killinchu effector stays OUT (SIMULATED structural).
G3. De-commit stale organs/amaru/.hf-mirror/serve.py (generated + git-ignored; CI fails if a committed mirror returns).
G4. When founder approves: receive the 4 static front-ends (SZL landing, killinchu site, Verify, Sky) into repos
    (szlholdings-site for landing; a killinchu-site repo/host; verify + sky as Spaces/Pages), point domains,
    finalize cross-links + swap the Verify QR placeholder to the real published URL.

## ALIGN — HUGGING FACE  (see /home/user/workspace/team/HF_ELEVATE_PLAN.md for the full punch-list)
H1. Org face: upload the new SZL orbital-mark AVATAR; set "AI & ML interests" line; prune 10 collections → 2-4 pinned
    (a11oy / killinchu / proofs / 3D); strengthen the SZLHOLDINGS/README org card.
H2. Per-Space cards: on-brand emoji + honest short_description + colorFrom/colorTo (navy/coral; killinchu navy/gold/teal)
    for a11oy, killinchu, anatomy, README, hatun-mcp, khipu-constellation, llm-router-live, yarqa.
H3. LIVE-DATA HF frontier (provable): publish/refresh a Space that EMBEDS the live receipt-DAG (the Verification Sky)
    and an org-card/README that RE-VERIFIES a real receipt in the visitor's browser (a11oy CORS is already OPEN;
    /receipt/<id>/canonical works → 6/6 SHA-256 MATCH). A number→Lean-theorem card linking a live count to locked_count_eight.
H4. Space deploys: NDJSON-commit byte-identical + factory restart + verify live oid==blob sha (mirror sometimes skips republish).

## ALIGN — HETZNER / a11oy.net  (box, founder-approved)
X1. R0 honest-degrade rebuild (above) — remove the overclaim. X2. optional sovereign GPU. X3. confirm nginx serves
the current build + the public verify API (CORS GET) so browsers can re-hash. X4. autodeploy timer (#323).

## ALIGN — KILLINCHU
K1. Public verify API parity with a11oy: CORS-enabled GET + /receipt/<id>/canonical so the killinchu site + Verify can
    re-hash a real DSSE verdict in-browser (currently /khipu/sign is real but needs CORS+canonical GET = "LIVE after this").
K2. Confirm real drones&vessels data (Remote ID/ADS-B/MAVLink decoders, 53 fingerprints, maritime/vessel fusion) returns
    honest live/SAMPLE-labeled data for the new killinchu site to embed. K3. effector stays SIMULATED, human-on-the-loop.

## PUBLIC VERIFY API (B2, powers every "verify it yourself" surface) — make the browser-fetch path solid on BOTH apps:
read-only, CORS GET, timeouts; endpoints a11oy /api/a11oy/v1/{honest,formulas,gates,qbio/lambda,qbio/summary,ledger,
receipt/<id>/canonical}; killinchu /api/killinchu/v1/{honest,...}, /counter-uas/evaluate, /khipu/sign|verify,
/receipt/export, /receipt/<id>/canonical. Every field LABELED; never fabricate.

## CARRIED: Pepr real single-key DSSE verify (label "single-key DSSE verified; threshold=P2 roadmap, ledger=P3 roadmap");
serve.py serialized refactor into szl_core (exclusive lock, small PRs); SLSA L1->L3 needs cosign key (founder);
finance lineage (Polygon.io + Frankfurter, yfinance LABELED).

## HARD RULES: never keystone self-merge; never commit a key; never weaken a gate (PURIQ/cosign/Rekor); label live only
on real 200; locked=8; Λ=Conjecture 1; BFT=Conjecture 2; effector SIMULATED; 0 runtime CDN; no fabricated data.
The LIVE consoles (/console, /elite) visual restyle is DEFERRED past June 18 by founder/CTO — do NOT restyle them now;
back-end + box + deploys + HF + alignment only. For cosign-signed artifact / Rekor / warn->enforce / MAJOR dep bump:
notify the founder for approval, never auto.
