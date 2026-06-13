## R-ADOPT-AND-FINISH (TOP — adopt MIT pieces cleanly + finish the estate; Vast LATER per founder) — DEPLOY, do NOT merge
FASHION-THINKING doctrine (founder + agent agreed): take what is OPENLY LICENSED (MIT/Apache), rebuild it SZL-native
WITH ATTRIBUTION, transform-by-proof; NEVER copy NO-LICENSE code (all-rights-reserved = injecting infringing code =
kills the provenance moat). Two Opus PRs incoming into platform/tools/: (a) szl_estate_auditor.py (approach inspired
by jkdevcode/repo-inspector, MIT, attributed) — automated per-repo health/alignment; (b) szlctl.py (ergonomics
inspired by jkdevcode smart-job-cli + gh-follow-sync, MIT, attributed) — one ops CLI (surfaces/prs/fabric/forge/
posture). When they land: rebuild/deploy as needed; keep the ATTRIBUTION + NOTICE intact (this is what keeps us clean).
MAINTAIN an attribution manifest replit-sync/ADOPTED_OSS.md listing each adopted upstream + its license + commit +
how we transformed it. NO no-license repo enters the tree.
FINISH (before Vast): (1) keep /compute-pool 200. (2) get the 404 surfaces to 200 FROM MAIN (merges landed: #341/
#342/#344 on main, #343 content on main): /ayni, /research/prereg, /research/verify, /research/{id}, /harvest/
datacenters. (3) push NEW HF static Space SZLHOLDINGS/energy from /home/user/workspace/hf_energy_space/. (4) CHASKI:
per R-CHASKI-GET-ONLINE-NOW bring its Ollama up durable on the replit-chaski box (100.76.58.50), verify real 200,
route as 2nd SAMAY lung, gpu_nodes 1->2, add heartbeat; report raw proof or the exact blocker. (5) rebuild a11oy
image FROM MAIN so the live loop is the permanent version.
HOLD: do NOT prompt for VAST_API_KEY — founder will provide it LATER as the final go-live switch once everything is
green. Keep the marketplace agent armed, do not list yet.
DOCTRINE v11: openly-licensed-only + attribution + transform-by-proof, never plagiarize; joules MEASURED only via
exporter (212J); ONE loop/ledger/Ayni; chaski reachable only on real 200; no free-energy (#239/#240 Ayni); energy
!= data; consent only; NOT mining; research=process-verification NO psi claim; locked=8; Λ=Conj1; Khipu=Conj2; no
key/seed; do NOT merge. Adopt clean, finish the estate, Vast is the last switch.

## R-CHASKI-GET-ONLINE-NOW (TOP — founder: get chaski online, Forge do ALL of it) — DEPLOY, do NOT merge
Verified: chaski {kind:tailnet-gpu, endpoint:http://100.76.58.50:11434, reachable:false, detail:URLError, offline
~22h}. It is a REPLIT machine (replit-chaski) on the founder tailnet that FORGE operates — so this is FORGE to do.
URLError = Ollama not running. FORGE DO ALL: (1) on the chaski Replit box: install Ollama if needed; export
OLLAMA_HOST=0.0.0.0:11434; start `ollama serve` as a DURABLE/background service (it died after 22h — make it
persistent, systemd/supervisor/always-on, not one-shot); ollama pull qwen2.5-coder:7b (or deepseek-distill/llama
that fits); confirm `ollama list`. (2) VERIFY: curl http://100.76.58.50:11434/v1/models -> 200 (only then is it up;
probe-driven, no fabrication). (3) ROUTE: /compute-pool flips chaski reachable=true + gpu_nodes_reachable 1->2;
register chaski as 2nd SAMAY lung in szl_anatomy_loop (the ONE loop, now on main): betterwithage primary, chaski
2nd; prefer betterwithage, spill to chaski when up + cheap window; energy-gate both; chaski joules to SAME ledger
(measured if exporter else SAMPLE). (4) DURABILITY: Ollama auto-restart + add chaski to heartbeat so a drop is
caught not silent. (5) SURFACE honestly (reachable only on real 200) in /compute-pool + /anatomy/loop + HF energy
Space; report raw curl 200 + ollama list + gpu_nodes 1->2 to replit-sync. If the Replit box truly cannot keep an
Ollama/GPU process (plan/tier limit), say so plainly with the exact blocker for the founder — never leave it
silently offline or fake it up. Full order: replit-sync/energy_engine/R_CHASKI_GET_ONLINE_NOW.md
DOCTRINE v11: chaski reachable ONLY on real 200; ONE loop/ledger/Ayni (2nd lung not new loop); joules MEASURED only
via real per-node exporter else SAMPLE; sovereign only on own metal; reactive never starves; no free-energy
(#239/#240 Ayni); open-weight only; no key; do NOT merge. Get chaski up + durable + routed, verify with real 200.

## R-MERGES-LANDED-HOLD-VAST (TOP — update: a11oy stack is PERMANENT on main; HOLD Vast until fully ready) — DEPLOY, do NOT merge
FOUNDER DIRECTION: do NOT list on Vast.ai yet — get the WHOLE estate finished + aligned FIRST, then flip the
earning switch LAST as the final step. So: keep the marketplace agent ARMED but DO NOT prompt for VAST_API_KEY as
the next action; the key is the last step after everything else is green.
MERGES LANDED (founder/agent did the permanence gate): a11oy #341 (/anatomy/loop), #342 (dark-surfaces register),
#344 (research infra) are MERGED to main; #343 YARQA consolidation content is ON main (closed as superseded — verified
szl_anatomy_loop.py on main has the circulatory consolidation). So szl_anatomy_loop.py + szl_dark_surfaces_register.py
+ szl_research_infra.py are ALL on main now. FORGE: rebuild+push the a11oy image FROM MAIN (cleaner than the deploy
branch) so the live loop is the permanent main version.
STILL FINISH (before we flip Vast): (1) fix/confirm /compute-pool stays 200 (it recovered from a transient 000).
(2) Get the 404 surfaces to 200 from the main build: /ayni, /research/prereg, /research/verify, /research/{id},
/harvest/datacenters. (3) Push the NEW HF static Space SZLHOLDINGS/energy from /home/user/workspace/hf_energy_space/.
(4) WAKE CHASKI (2nd SAMAY lung): on 100.76.58.50 OLLAMA_HOST=0.0.0.0:11434 + ollama serve; /compute-pool flips
gpu_nodes 1->2 on real 200 probe. (5) Report what is green so the founder can decide the canonical loop receipt
schema and THEN provide VAST_API_KEY as the final go-live step.
DOCTRINE v11: joules MEASURED only via exporter (212J); ONE loop/ledger/Ayni; chaski reachable only on real 200; no
free-energy (#239/#240 Ayni); energy != data; consent only; NOT mining; research=process-verification NO psi claim;
revenue ESTIMATE no guarantee; locked=8; Λ=Conj1; Khipu=Conj2; no key/seed; do NOT merge. Vast is the LAST switch.

# SZL Forge — NEXT ORDER

## ORDER: FREEZE HOLD (demo window)

A demo freeze is armed. **Read `replit-sync/FREEZE.json` first and obey it.**

- From `activates_at` (2026-06-16 00:00 ET) through `lifts_at` (2026-06-19): go **READ-ONLY**.
  - DO: monitor (healthz, drift, doctrine grep, CI status), report status to AUTO_STATE.
  - DO NOT: commit, deploy, NDJSON-commit to HF, factory-restart for changes, auto-merge
    dep PRs, auto-sync drift, edit doctrine, touch signed artifacts, or touch the box.
  - Recovery-only: a Space that is SLEEPING/errored may be restarted to its last-good build
    (healing, not a change). No code change.
- Before `activates_at`: you may continue normal queued software-side work, but the estate is
  already verified-GO — prefer monitoring + small safe items over large refactors this close in.
- HOTFIX during freeze: only for a demo-blocking defect WITH explicit founder approval, minimal,
  byte-identical GitHub↔HF, ast.parse/node-check first, re-verified live, logged. Never touch
  signed artifacts/box/doctrine gates without founder.

## DOCTRINE (frozen state — never alter)
locked = 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ kernel c7c0ba17 · Λ = Conjecture 1 ·
Khipu = Conjecture 2 · trust never 100% · SLSA "L1 honest · L2 attested · L3 roadmap" ·
no user-visible codenames · effector SIMULATED · 0 runtime CDN · never commit a key.

## POST-FREEZE QUEUE (do NOT start until founder unfreezes — see PROPOSALS.md)
1. Air-gap UDS deploy proof (Raven proof). 2. Bundle-level SLSA L2 attestation.
3. Doctrine v11 reconciliation in org .github + szl-doctrine. 4. Progressive-delivery pipeline.
