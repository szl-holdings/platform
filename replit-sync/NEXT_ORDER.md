<!-- MASTER ORDER 2026-06-16 (run at hotel). Exhaustive: P1 merge ready PRs #476/#477, P2 light OMEN, P3 useful-work+harness, P4 killinchu/router efficiency, P5 UDS/mesh/fleet/Pepr/Zarf live verify, P6 cleanup, P7 NEW governed code-as-action agentic frontier. Full body below. Estate editable to 06-20 01:00 ET. -->

# FORGE MASTER ORDER — run when founder reaches hotel — 2026-06-16 ~16:25 ET

Doctrine v11 (hard): never fabricate a 200/joule/receipt/signature/digest/label; joules MEASURED only via real NVML; reachable=REAL-PROBE-ONLY (never fake a node up); never claim combined/fused VRAM (horizontal scale only); Lambda=Conjecture 1; never commit a key; never touch lutar-lean (keystone); honest BLOCKED beats fake green; never weaken/bypass a doctrine or Banned-token CI gate (fix wording instead). FREEZE: held to 2026-06-20 01:00 ET (= 05:00 UTC), lift 2026-06-21 23:59 ET. Estate EDITABLE until then — normal main work + non-hotfix PRs land now.

GitHub: use bash api_credentials=["github"] (org-admin; never ask for token). git identity stephenlutar2-hash <stephenlutar2@gmail.com>, commit -s (DCO).

NOTE ON DISPATCH: the forge-auto poll currently reports dispatch_mode with ok=False — it PARSES NEXT_ORDER but does not auto-execute. So the CTO pre-built the two BLOCKER fixes as ready PRs (below). When you (founder/Forge) run this at the hotel, EXECUTE the steps directly. If you want auto-dispatch fixed, see FORGE_DISPATCH_WIRING.md (set a working FORGE_DISPATCH_CMD on the box poll).

=================================================================
## PRIORITY 1 — MERGE THE TWO READY BLOCKER PRs (verified clean, all CI green)
=================================================================
Both are MERGEABLE, DCO-signed, all checks green (44 SUCCESS / 0 fail). Review then merge to main:
- PR #477  fix(frontier): stop minting a signed receipt per /frontier/manifest GET + cache build
    Branch fix/frontier-manifest-no-sign-per-get. Fixes the 4-8s manifest BLOCKER + chain pollution. Cold build now ~73ms, warm <1ms; GET no longer appends to the provenance chain (test added).
    MERGE: gh pr merge 477 --repo szl-holdings/a11oy --squash
- PR #476  fix(energy): energy-loop OMEN falls back to hardened node IP (single source of truth)
    Branch fix/omen-energy-loop-node-fallback. Energy loop now resolves OMEN to 100.70.130.45:11434 (== hardened) when env unset; reachability still REAL-PROBE-ONLY; standby unchanged. 22 tests pass.
    MERGE: gh pr merge 476 --repo szl-holdings/a11oy --squash
AFTER MERGE: confirm box auto-redeploys to new main HEAD (GET /api/a11oy/v1/honest git_sha == GitHub HEAD), then VERIFY:
- /api/a11oy/v1/frontier/manifest returns <500ms warm AND the provenance chain length does NOT grow on repeated GETs.
- All other surfaces still 200 (route guard covers this).

=================================================================
## PRIORITY 2 — LIGHT OMEN AS THE 3RD LUNG (the box->OMEN tailnet path)
=================================================================
OMEN side is CONFIRMED good (founder screenshots): Ollama listening 0.0.0.0:11434, RTX 4060 Ti ready, local /api/tags 200, model resident, tailscale host=betterwithage 100.70.130.45. But the BOX cannot reach it: /compute-pool-hardened shows omen-betterwithage detail=timeout. This is a box<->OMEN tailnet PATH issue, not Ollama. RUN FROM THE BOX (plain network diagnostic — NOT founder-gated, do NOT skip):
1. tailscale status | grep -i betterwithage   (is OMEN a peer from the box? direct/relay?)
2. tailscale ping 100.70.130.45  AND  tailscale ping betterwithage
3. nc -vz -w 5 100.70.130.45 11434   (TCP open?)
4. curl -m 8 http://100.70.130.45:11434/api/tags   (HTTP 200 + model list?)
5. ping -c 3 100.70.130.45
DECIDE from real output:
- ping fails entirely -> OMEN/box on different tailnets or identity not shared -> founder fixes in tailnet admin console; report the exact peer state.
- ping OK but TCP 11434 refused/filtered -> OMEN host firewall on the tailscale adapter. The founder's inbound rule had EdgeTraversalPolicy=Block / maybe wrong profile. Founder runs (Admin PowerShell on OMEN):
      New-NetFirewallRule -DisplayName "Ollama Tailnet v2" -Direction Inbound -LocalPort 11434 -Protocol TCP -Action Allow -Profile Any -EdgeTraversalPolicy Allow
  then re-probe step 3/4 from the box.
- TCP open but curl fails -> box resolver cached old dead state -> restart/clear the hardened resolver cache (or redeploy box), re-check /compute-pool-hardened flips omen reachable=true.
- BOTH 3 & 4 succeed -> path open: force the hardened resolver to re-probe; confirm omen reachable=true.
THEN (only after a real box-side 200): with PR #476 merged, OMEN auto-resolves to the right IP. Set persisted env on the box + restart a11oy so the energy loop breathes it:
      A11OY_OMEN_BASE_URL=http://100.70.130.45:11434
      A11OY_OMEN_STANDBY=0
VERIFY: /api/a11oy/v1/energy/operator/status nodes_computing INCLUDES omen-betterwithage; gpu_nodes_reachable rises; OMEN mints node=omen MEASURED receipts (real RTX NVML — chaski stays PENDING_EXPORTER). REAL PROBE ONLY. On success send_notification 'OMEN 3rd lung LIT'.

=================================================================
## PRIORITY 3 — USEFUL-WORK LOOP + ENERGY HARNESS (make every joule build something)
=================================================================
Today the loop runs REAL inference on THROWAWAY content (canned _GEN_PROMPTS/_EMBED_TEXTS at szl_energy_operator.py:218-231) and discards output, while a11oy_org_rag.py (RAG) starves for embeddings. Implement (open normal PRs, keep gentle backpressure on the sole chaski lung):
A. CORPUS EMBEDDING: replace throwaway embeds with REAL un-embedded SZL corpus chunks (a11oy_org_rag.py corpus dir / INDEX.json), WRITE vectors into the live RAG dense index. Honest fallback to canned if corpus/model unavailable — NEVER fabricate an indexed chunk.
B. DEMO-WARM QUERIES: precompute+cache embeddings for the exact stage queries (A11OY_DEMO_WARM_QUERIES) so demo RAG is instant.
C. CARBON/PRICE-AWARE MODULATION (the harness): the loop already fetches grid price (_update_grid_price szl_energy_operator.py:734) + harvest posture exposes should_soak/grid_price_posture/renewable% but NEVER acts. Wire it: should_soak=true -> SOAK (drain corpus backlog); grid_price_posture=expensive -> THROTTLE to baseline+demo-warm, defer batch. Expose work_mode honestly in /energy/operator/status. Respect in-flight cap + inter-job sleep (szl_energy_operator.py:52).
D. (roadmap, post-demo) carbon-attested receipts (stamp gCO2/kWh at compute, MODELED until a live feed) + live carbon feed (carbon_feed_live currently false / static 380). Note only.
Keep MEASURED gating exactly as szl_energy_operator.py:644-672. Useful work changes WHAT is computed, not HOW joules are measured.

=================================================================
## PRIORITY 4 — ECOSYSTEM EFFICIENCY (killinchu + router) — from 2 Opus-4.8 audits
=================================================================
KILLINCHU (devteam/KILLINCHU_EFFICIENCY_AUDIT.md) — pre-freeze LOW risk:
- A1 [BLOCKER] wrap killinchu_osint.py:240 (and :861) urllib.urlopen in asyncio.to_thread (mirror feeds_realdata.py:1221) — kills the up-to-30s loop stall on ?fresh=1//osint/status. Test the 13 OSINT views after.
- A2 [BLOCKER] same for killinchu_backend.py:512 live() — the 12s ADS-B stall.
- A3 precompute+cache the 27 WarHacker demo receipts at boot/warmer (killinchu_warhacker_demos.py:3424) — instant stage replay, deterministic/honest. Verify cached==fresh.
- A4 extend warmer (killinchu_osint.py:1481 start_warmer) to also tick backend.live()+feeds at boot.
- DO NOT pre-freeze: A5 cold-start lazy-mount refactor (~90 serial imports; scipy.stats 1.4s at killinchu_posture_topology.py:2907) — defer post-demo. DO NOT add torch/sklearn to the Dockerfile (re-introduces a 4.5s import; prod falls back to numpy honestly).
- Pre-flight: verify Space secrets set (TAVILY_API_KEY, AISSTREAM_*, HF tokens, SZL_COSIGN_PRIVATE_PEM).
SZL-ROUTER (devteam/SZL_ROUTER_EFFICIENCY_AUDIT.md) — pre-freeze LOW risk:
- B1 add exact-hash cache to /v1/embeddings (core.py:410-473, around POST :441; reuse _HARVEST_CACHE TTL pattern). Mark served_by:"cache" honestly. (Keep chat caching post-freeze.)
- B2 connection keep-alive pool for upstream calls (core.py:277-291,381-393; coordinator mesh_coordinator.py:306-318) — preserve Groq Cloudflare-UA handling at core.py:282-284.
- B3 STAGE (only if provably default-off/byte-identical on reactive turns; else post-freeze): wire the EXISTING energy/carbon brain (should_soak_wasted_energy / harvest_status / fabric_status, core.py:620-741) into route ordering FOR BATCH/PROACTIVE traffic only — add a batch flag (core.py:310-323, app.py:88-95), default OFF. Signal is sovereign:false-safe.
- POST-DEMO: B4 cached liveness probe (core.py:329/316, 15s TTL); B5 coalesce/dedup concurrent embeddings; B6 least-load tie-break (cleanest pre-freeze = config-only: point A11OY_MODEL_BASE_URL at MeshCoordinator); B7 greenest-node tilt; B8 stream passthrough (app.py:94).

=================================================================
## PRIORITY 5 — UDS / MESH / FLEET / PEPR / ZARF — verify FULLY operational + tested
=================================================================
CI is all GREEN already (devteam/UDS_ECOSYSTEM_VERIFY_20260616.md): bundle publish SUCCESS + prove-bundle-install SUCCESS (oci://ghcr.io/szl-holdings/szl-uds-bundle:uds-v0.3.0, 91d54bc7); zarf-package-sign SUCCESS; mesh conformance/SBOM/doctrine/scorecard SUCCESS across uds-mesh/szl-mesh; szl-fleet-overlay green; a11oy readiness/contracting/clean-deploy guards SUCCESS. HONEST SCOPE: prove-install tests each member individually pullable+signature-verified+deployable on clean k3d (NOT five-co-resident — doctrine).
CLOSE THE "fully operational + tested" GAP (run a real live multi-member deploy, post-merge):
- Stand up a clean k3d cluster; uds pull the published bundle; Zarf init + core-base; uds deploy the mesh-ready a11oy package (packages/a11oy/zarf-mesh-ready.yaml) + szl-sentra 0.2.0 + szl-amaru 0.2.0.
- Confirm the Pepr operator reconciles the UDS Package CRs (pods Available, no CrashLoop).
- Confirm mesh members ENROLL (szl_mesh quorum — see szl-mesh QUORUM_README / hello-mesh example).
- Run the FLEET restore drill (box-scripts/tests/restore-fleet.sh) and confirm it passes.
- Report each as PASS/FAIL honestly; if k3d co-residency isn't in scope/time, say so honestly (don't claim five-co-resident).

=================================================================
## PRIORITY 6 — CLEANUP
=================================================================
- platform#390 (Dependabot vite) — ALREADY CLOSED by CTO (broke build + failed required DCO). No action.
- HF a11oy Space: BUILD_ERROR root cause (missing web/dns.html) was found+fixed; Space is RUNNING 200 (docker). Optional: convert to the static front-door staged at platform/replit-sync/hf-a11oy-static/ via the org GitHub->HF sync (the Perplexity HF token can only PR). Only if you want the lighter always-green front door; the docker Space is healthy now.
- STALE BRANCH PRUNE (szl-uds-deployment has 20+ diverged branches; likely squash-merged). For EACH non-main branch: check if its PR is MERGED (gh pr list --state merged --head <branch>); if the PR merged, delete the branch (git push origin --delete <branch> OR gh api -X DELETE repos/szl-holdings/szl-uds-deployment/git/refs/heads/<branch>). DO NOT delete a branch whose PR is open or that has no merged PR (could be unmerged work). Do the same prune for a11oy + platform. Report what you deleted vs kept.

=================================================================
## VERIFY + REPORT (append to replit-sync/forge-perplexity-update-20260616.md)
=================================================================
Per priority: PRs merged (#476/#477) + box redeploy aligned; OMEN probe outputs + lung lit or exact founder step; useful-work PR# + RAG index growth + work_mode; killinchu/router PR#s + before/after timing; UDS live-deploy PASS/FAIL (Pepr reconcile, mesh enroll, fleet restore); branches pruned. Full live re-sweep: all box surfaces 200, all 6 HF Spaces 200, energy running, box==GitHub HEAD. Honest doctrine v11 — never fabricate a 200/joule/receipt/PASS. If anything can't land clean before freeze (06-20 01:00 ET), park it post-demo and say so.

=================================================================
## PRIORITY 7 — NEW AGENTIC FRONTIER: GOVERNED CODE-AS-ACTION (from 4x Opus-4.8 architecture team)
=================================================================
Founder ingested SpatialClaw (code-as-action) + a public "production-ai-app" layout. Fashion thinking: LEARN, make it ORIGINAL SZL, never copy. Full synthesis spec: devteam/SZL_GOVERNED_AGENTIC_ARCHITECTURE.md (+ AGENT_BRAIN_SPEC.md, AGENT_SAFETY_EVAL_SPEC.md, SHOWCASE_STRUCTURE_SPEC.md, FULLY_AGENTIC_GAP.md).

THESIS: "Governed Code-as-Action" — an agent that composes->inspects->revises code on a PERSISTENT SANDBOXED kernel, where every code action is doctrine-gated BEFORE running and emits a SIGNED Khipu receipt with MEASURED joules into the energy ledger. Neither reference has governance; SZL has governance and lacked the cognitive loop. The gap is a WIRING gap not a capability gap — we have the organs (ledger, provenance, mesh, RAG, restraint gates), we need the thinking loop on top.

P0 (headline, ~3-4 day demoable slice — open PRs, pre-freeze if clean else stage):
- Build a11oy_governed_kernel.py: a PERSISTENT sandboxed Python kernel (vars live across steps), reusing a11oy_code_engine's isolation primitives (_static_screen/_FORBIDDEN_* :340, _sandbox_exec :364). a11oy_code_engine.governed_turn already does a P1-P6 gated+signed loop SINGLE-SHOT — extend to persistent multi-cell.
- Gate EVERY cell: HARD deny-by-default security gate (extend banned tokens with key/env/ledger/signer bans) ABOVE advisory Lambda/restraint (Conjecture 1, <1.0, can only tighten never override a hard DENY) + szl_lambda_tripwire.run_gate_check. Action runs only when gate_allow AND trust_pass.
- Each cell mints a signed Khipu receipt with MEASURED joules via OperatorDaemon._commit + the live wire_operator_to_ledger (PR #465). Reuse szl_provenance_receipt, szl_khipu, _a11oy_sign_receipt. NO write-on-GET.
- Routes /api/a11oy/v1/agent/code/* — register BEFORE the SPA catch-all; ADD to DEMO_CRITICAL_ROUTES.
- DEMO: a BLOCKED malicious cell (socket exfil + key theft -> hard-gate DENY, no exec, signed deny-receipt) next to an ALLOWED NumPy compose->inspect (runs, signed receipt, MEASURED/SAMPLE energy) — same governed path. Governance, not theater.
- HONEST: subprocess-tier isolation now (container/microVM = ROADMAP); Lambda advisory; joules MEASURED only with real NVML else SAMPLE; no accuracy claims without the golden eval.

P1 (pre-freeze, low risk): the router embeddings cache + energy/carbon batch routing (Priority 4 B1/B3) ALSO serve this agent. Per-step signed cost receipt. GITHUB SHOWCASE (zero behavior change): promote 4 moat layers to top-level folders (provenance/ governance/[+execution_guard] energy/[+carbon] supply-chain/[+SBOM]); add ONE canonical Mermaid architecture diagram to a11oy README linking LIVE surfaces (/frontier /governance /console /api/a11oy/v1/honest); restructure AGENTS.md + add .claude/rules/*.md (doctrine, code-style, testing, provenance, security, honest-status) so Forge/Claude Code inherit honest-label + deny-by-default discipline. Items here are docs+diagram+re-export shims — no behavior moves.

P2 (post-demo): robust self-correcting retrieval (document_grader), real query-decomposition planner, persistent agent memory, full golden-dataset eval (szl_tau_eval), sandbox hardening to container/microVM.

EXECUTION NOTE: the GCAK P0 slice is the single highest-leverage thing for the demo + beyond — it's the references' best idea made impossible-for-them-to-match by SZL's governance, and it's a LIVE watchable receipt-minting loop. Build it as proper PRs (DCO -s), each verified, register-before-SPA, extend route guard, no chain pollution on GET, ledger durability env (SZL_ENERGY_LEDGER_PATH) kept. Never overclaim; honest doctrine v11.
