<!-- NEXT_ORDER updated 2026-06-16 02:10 ET by CTO. FOUNDER GREEN-LIGHT: GO. Forge: read this top order first; Task 1 (fix .static probe URLs) is the priority. -->

# FORGE GREEN-LIGHT WIRE-UP ORDER — 2026-06-16 02:10 ET — FOUNDER SAYS GO

Doctrine v11 (hard): never fabricate a 200/joule/receipt/signature/digest/label; joules MEASURED only via real NVML, else MODELED/SAMPLE/PENDING_EXPORTER labeled honestly; reachable=REAL-PROBE-ONLY (never fake a node up); never claim combined/fused VRAM (horizontal scale only); Lambda=Conjecture 1 (advisory, never "proven trust"); never commit a key; never touch lutar-lean (keystone); honest BLOCKED beats fake green; never weaken/bypass a doctrine or Banned-token CI gate — fix wording instead. FREEZE arms 2026-06-18 15:00 ET; inside freeze only hotfix/* branches that pass the gates.

## STATE I VERIFIED RIGHT NOW (2:09 AM ET — keep it true)
- ALL box surfaces 200: /healthz /frontier /orbital /holographic /energy-ops /energy-holographic /pnt /pinn /fabric /governance /console /elite /signature-is-not-proof /harvest /estate-hologram. ALL API 200: /honest /frontier/manifest /energy/operator/status /energy/ledger /compute-pool /restraint/info /pnt/limits. killinchu/elite 200.
- ENERGY loop running:true, stub_mode:false, jobs_done 32,341, joules_measured_total 982,577 J MEASURED, tokens 15.2M. nodes_computing=[rtx-betterwithage, chaski]; omen-betterwithage standby. jtoken MEASURED.
- LEDGER chain.ok=true, length 264, links+receipts intact. persistence path /data/szl_energy_ledger.jsonl, survives_redeploy:true, label MEASURED — i.e. the HF persistent volume IS mounted now. KEEP it that way; the chain must NOT reset to seq 0 on the next redeploy. Prove with a redeploy + seq-continues check.
- chaski by_node: real jobs computed (4,906) but joules_label PENDING_EXPORTER (no per-node NVML reading yet). That is HONEST and correct — do NOT fake chaski joules. If/when a real per-node meter attributes joules to chaski, flip it to MEASURED; until then PENDING_EXPORTER stays.
- All main CI green (a11oy, killinchu, lutar-lean, anatomy, szl-uds-deployment, uds-mesh). UDS bundle published + keyless-signed (Sigstore OIDC) + SBOM-attested: oci://ghcr.io/szl-holdings/szl-uds-bundle:uds-v0.3.0.

## TASK 1 — FIX FALSE-ALARM PROBE URLS (do this first; it's a real regression source)
The anatomy and energy HF Spaces were converted from STATIC to DOCKER (sdk=docker, stage=RUNNING, public). Their old hostnames szlholdings-anatomy.static.hf.space and szlholdings-energy.static.hf.space now 404. The LIVE correct URLs are:
- anatomy: https://szlholdings-anatomy.hf.space  (200 — bare root serves)
- energy:  https://szlholdings-energy.hf.space   (200 — bare root serves; it has NO /healthz route, so probe the bare root, not /healthz)
ACTION: grep the repos + replit-sync probe scripts/configs for ".static.hf.space" referencing anatomy or energy and update them to the docker URLs above. This stops the watchdog/digest from firing a false "space DOWN" alarm during the demo window. Report every file you changed. (Do NOT touch szlholdings-anatomy bare-vs-static notes that are intentionally documented as historical.)

## TASK 2 — KEEP EVERY SURFACE GREEN (each tick, monitor-only inside freeze)
Probe all surfaces in the STATE list. All must stay 200 with honest labels. The demo-critical route guard test (tests/test_demo_critical_routes.py) is your tripwire — if a route is dropped during any refactor, CI must go red. Do NOT auto-fix a regression silently; surface it in the report with the failing route + the commit that dropped it.

## TASK 3 — RECEIPT PERSISTENCE PROOF (close the demo-reset risk for good)
persistence now reports survives_redeploy:true on /data. PROVE it end-to-end: note current chain length (264+), trigger a redeploy, then confirm chain length CONTINUES (does not reset to 0 / genesis) and chain.ok stays true. Append the before/after seq to the report. If a redeploy ever resets it, that means the /data mount dropped — report EPHEMERAL honestly, do NOT fake continuity.

## TASK 4 — OMEN 3rd LUNG (founder-side bind; auto-join on real probe only)
OMEN (100.70.130.45) is standby — founder-side Ollama bind/firewall (bound 127.0.0.1, needs 0.0.0.0:11434 + inbound TCP 11434). The box probe timeout is already raised (#467) and proved this is NOT a box issue. Do NOT mark OMEN reachable unless a real probe to http://100.70.130.45:11434/api/tags returns 200 with a model list. The instant the founder fixes the bind it should auto-join nodes_computing as the 3rd lung — confirm by REAL PROBE only, then report it lit.

## TASK 5 — chaski DURABILITY (you already have the runbook — execute + prove)
chaski is wired as the 2nd energy lung and reachable now. Per replit-sync/energy_engine/R_CHASKI_BOOT_AND_KEEP_ALIVE_*.md, install a systemd unit OR supervisor restart-loop so Ollama on the chaski Repl auto-restarts (it died once after ~22h). PROVE with a kill-and-recover test. If neither survives a Replit recycle, the ONE founder step is the Replit "Always On" toggle — report the exact click-path (Replit -> replit-chaski Repl -> Tools/Settings -> Always On). Everything else is yours. chaski dropping is HONEST (rtx keeps breathing) — clean `offline`, no alarm.

## TASK 6 — FRONTIER EVOLUTION (innovate; honest-labeled; the moat is governed provenance)
The public field just moved our way — fold it into the showcase WITHOUT copying anyone:
- OpenAI joined the C2PA steering committee + is embedding SynthID alongside Content Credentials (2026-05-19); Google announced C2PA verify + SynthID detect at I/O 2026. Provenance-for-content is now table stakes.
- arXiv 2606.00279 "Bit-Exact AI Inference Verification Without Performance Tradeoffs" + the Confidential-AI-Compute attestation wave: verifying AI workload claims for governance against covert adversaries.
OUR ORIGINAL ANGLE (frontier play #1 from research/FRONTIER_SCAN.md): "compute-side C2PA" — a signed, hash-chained PROVENANCE RECEIPT for every inference job (which node, which model, measured joules, timestamp, chain-linked), already minting into our /data ledger. That is the thing none of them ship: not content watermarking, not enclave attestation alone, but a verifiable GOVERNED-COMPUTE receipt chain. EVOLVE the /frontier hub + /frontier/manifest to make this explicit:
  a) On /frontier, add an honest "Why this is the frontier" panel contrasting content-provenance (C2PA/SynthID) vs OUR compute-provenance receipt chain — cite the public moves as context, claim ONLY what our ledger proves (chain-linked MEASURED receipts; MODELED orbital; ROADMAP composite). No overclaim.
  b) Add a /api/a11oy/v1/frontier/manifest tile or field for "compute-provenance-receipt" that points at a real, verifiable ledger receipt (link to /energy/ledger, show chain.ok + length). MEASURED label only where the joule reading is real; PENDING_EXPORTER for chaski.
  c) Keep the composite-receipt tile labeled ROADMAP until it's actually built — do not promote it.
Open a normal PR for this BEFORE the freeze (it's a showcase/front+back change, not a hotfix). If you can't land it clean before 15:00 ET 06-18, park it for post-demo — the current /frontier is already demo-ready.

## TASK 7 — GITHUB / HF / UDS ALIGNMENT (the "all of it aligned" ask)
- Confirm the frontier/orbital READMEs + UDS cross-links (#471) point at the LIVE URLs (a-11-oy.com/frontier, /orbital, the docker HF spaces above) — fix any stale .static links there too.
- UDS bundle stays published + keyless-signed; if uds-bundle-publish.yml or prove-bundle-install.yml goes red, report ref+digest+failing step honestly.
- Keep the GitHub org surface honest: locked=8, Lambda=Conjecture 1, Khipu BFT=Conjecture 2, SLSA L1 honest, joules MEASURED only via real exporter.

## FOUNDER ACTIONS (Forge: do NOT attempt — founder hardware/account)
A. PUBLISH HF SHOWCASE SPACE: SZLHOLDINGS/orbital does NOT exist yet (sdk=None). Publish spaces/orbital/ to SZLHOLDINGS/orbital (static) per spaces/orbital/PUBLISH_CHECKLIST.md -> szlholdings-orbital.hf.space. (HF persistent storage for a11oy is ALREADY enabled — persistence is live, thank you.)
B. OMEN bind (Windows PowerShell on the OMEN desktop): set OLLAMA_HOST=0.0.0.0:11434 (Machine scope) + New-NetFirewallRule inbound TCP 11434, restart Ollama (env must exist BEFORE serve starts). Decisive test from OMEN: curl http://100.70.130.45:11434/api/tags
C. Optional: orbital.a-11-oy.com subdomain DNS — /orbital already live on the main host.
D. Optional: Replit "Always On" for chaski IF Forge reports systemd/supervisor can't survive a Replit recycle.

## REPORT
Append to replit-sync/forge-perplexity-update-20260616.md + AUTO_STATE.json: (1) which .static probe URLs you fixed; (2) per-surface 200 truth; (3) persistence redeploy proof (before/after chain length); (4) OMEN real-probe state; (5) chaski durability method installed + kill-recover proof; (6) frontier-evolution PR number + status. Per-surface truth only. Honest doctrine v11.
