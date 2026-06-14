# SZL Forge — TOP ORDER (re-pinned 2026-06-14): AGENTIC PINN + PHYSICAL-BOUNDS on real GPU

**→ Read `replit-sync/FORGE-INSTRUCTION-agentic-pinn-bounds-20260614.md` FIRST.** The agentic-PINN +
fundamental-physics-bounds certifier (the doctrine-safe "energy / quantum / black-hole" frontier) is now
MESHED into a11oy's governed surface (`/api/a11oy/v1/pinn/*`, a11oy#360 MERGED; engine vendored in
platform#382). UPGRADE/ENHANCE it on real GPU: feed MEASURED NVML energy via `nvml_hook.forge_job()`, write
`physical_bounds_certificate.json` + `agentic_decision_trail.json` so the console flips SAMPLE→MEASURED, run
the loop on stiffer PDEs (deny-by-default Λ-gate + signed per-round receipt kept), and sign the certificate
through the khipu/szl_lake DSSE path. HONEST INVERSE of free-energy — never an over-unity claim. Then the
standing alignment job below.

---

# SZL Forge — ORDER: handle the rest (post-full-QA alignment + gated queue)

Read replit-sync/FREEZE.json first. Dispatch is still OFF (dispatch_mode:none) until the founder runs
WIRE_IT_UP.sh — REPORT these until then; execute once dispatch is on. The founder HAS brought the GPU
up: the ecosystem is now sovereign (sovereign:true/where:gpu/gpu_reachable:true, Qwen2.5 via vLLM over
Tailscale, base a11oy.net) on a11oy + killinchu — verified honest (no half-state). Keep it that way.

## STATE AFTER TODAY'S FULL QA/DEBUG/STRESS/SMOKE (all green, verified live)
- Perf fixed: /feeds/vessels/stats 17.5s->0.26s (parallel+cache+single-flight); /feeds/aircraft 14s->0.4s
  (cache+single-flight). mesh/write now validates (422 on garbage, never signs garbage).
- Gaps fixed: uds-bundles gitleaks red->green (allow on published cosign pubkey fp); killinchu HF
  szl_khipu_consensus.py stale-5 -> canonical locked-8 mirrored + hf-sync allowlist updated.
- copy-sync-lockstep guard GREEN on a11oy+killinchu (permanent fix for the COPY<->mirror class).
- Mobile: all surfaces 0 overflow / 0 console errors at 390px. szl-mesh live + operational
  (/elite/mesh, real 3-of-4 quorum, CRDT convergence, re-hashable receipts).

## YOUR ALIGNMENT JOB (report now; execute when dispatch on)
1. Keep CI green across szl-holdings/{a11oy,killinchu,szl-mesh,khipu-consensus,uds-bundles,szl-fleet-overlay}
   incl. the lockstep guard + gitleaks + hf-sync paths-guard. Known-intentional reds (lambda-bounty,
   founder-gated llama-cpp wheel / banned-token) report-but-don't-alarm.
2. Keep GitHub<->HF byte-identical on all shared + maritime + mesh + feeds modules; re-mirror via
   workflow_dispatch if a per-push detect gate skips a module. Keep the lockstep guard green.
3. Keep the GPU-sovereign posture honest: sovereign:true ONLY with a live gpu_reachable probe. If the
   Tailscale link flaps, it must honestly degrade (offline/fallback) — never a half-state. Notify if you
   ever see sovereign:true with gpu_reachable:false (that's a defect).
4. szl-fleet-overlay: confirm the peat-mesh node packages build; amaru/rosie/sentra are internal-only
   (HONEST_ROLES.md) — keep them out of any user-visible served surface.

## GATED QUEUE (founder approval / after freeze — see PROPOSALS.md)
- Author canonical .github DOCTRINE_V11.md (P-C-a) + reconcile org FORGE_BUILD_BRIEF stale-5 (P-2-c) +
  lutar-lean lean_numbers stale-5 (P-2-d).
- Run szl-mesh across REAL separate nodes (box + Space + peer over Tailscale), not just in-process.
- Air-gap UDS deploy proof run + bundle-level SLSA attestation (P-2-a/P-2-b).
- AISStream key -> Asia vessel theaters LIVE (SZL_AISSTREAM_API_KEY in Space secrets).

## DOCTRINE HARD GATE
locked=8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17 · Λ=Conjecture 1 · Khipu=Conjecture 2 (soft-safety AP,
never claim unconditional BFT proven) · trust never 100% · SLSA "L1 honest·L2 attested·L3 roadmap" · no
user-visible codenames · effector SIMULATED · no vessel control · real data LIVE/FORECAST/OSINT/SAMPLE
labeled · 0 runtime CDN · GitHub<->HF byte-identical · lockstep guard green · sovereign only on live probe ·
never commit a key · box=founder gate.

## FREEZE activates 06-16. Alignment/report now; read-only in the window. NOTIFY on: CI red (real),
byte-drift, lockstep/gitleaks red, codename leak, half-state sovereign, or fabricated data.
