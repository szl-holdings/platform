# SZL Forge — ORDER: szl-mesh alignment + keep-it-live (NEW: the mesh is now REAL & operational)

Read replit-sync/FREEZE.json first (not yet active → alignment allowed). Note: Forge dispatch is still
OFF (dispatch_mode:none) until the founder runs WIRE_IT_UP.sh — until then REPORT these, don't execute.

## CONTEXT (what just shipped — verify + keep aligned)
szl-mesh went from spec-only to REAL & operational. A 5-Opus-dev wave shipped:
- szl-holdings/szl-mesh: real NODE RUNTIME (src/szl_mesh/) — CRDT two-track state, DSSE-receipted state
  transitions, doctrine-gated enrollment, a multi-node demo that CONVERGES byte-identical (python -m szl_mesh.demo).
- Real 3-of-4 KHIPU QUORUM wired from khipu-consensus (ECDSA-P256 DSSE; matches deterministic test vectors;
  3-of-4 canonical, 2-bad NOT canonical). Byzantine corroboration = soft-safety AP (Khipu BFT unconditional
  = Conjecture 2, NEVER claimed proven).
- killinchu: killinchu_mesh.py serving /api/killinchu/v1/mesh/{topology,nodes,enroll,write,quorum,
  receipt/<id>/canonical,revoke,status} — REAL in-process 3-4 node mesh, re-hashable receipts.
- Live surface https://szlholdings-killinchu.hf.space/elite/mesh (real topology, quorum lights, receipt
  re-hash MATCH + tamper demo, doctrine-gated enroll).
- PERMANENT FIX: copy-sync-lockstep-guard CI now GREEN on a11oy + killinchu — fails the build if a module
  is COPY'd but not mirrored / imported but not COPY'd (the bug that broke us 3x today).

## YOUR ALIGNMENT JOB (report now; execute once dispatch is on)
1. GITHUB: szl-mesh + khipu-consensus + killinchu main CI green; the lockstep guard green on a11oy+killinchu;
   if Dev 2's quorum is still on branch dev2/quorum-wiring, confirm it's merged to szl-mesh main cleanly.
2. HF: killinchu Space RUNNING on latest; killinchu_mesh.py + the mesh view byte-identical GitHub↔HF and in
   serve.py register + Dockerfile COPY + hf-sync APP_FILES (the guard enforces this — keep it green).
3. szl-fleet-overlay (peat-mesh nodes, Helm/Zarf/k3d): confirm the 5-surface overlay packages still build;
   confirm amaru/rosie/sentra in chart templates are INTERNAL package names only (not user-visible) — if any
   leak to a served surface, flag for founder. Do NOT mass-rename infra.
4. a11oy.net / box: founder-gated. When the GPU secret + dispatch are wired (founder's runbook + WIRE_IT_UP.sh),
   the box can run a real mesh node too — report posture, don't touch the box.

## UPGRADE QUEUE (after freeze / founder approval)
- Run the mesh across REAL separate nodes (box + a Space + a peer) over Tailscale, not just in-process.
- Graduate szl-mesh specs 03/07 (skip-layer aggregation, governance metrics) from design → impl.
- Bundle the mesh into the UDS fleet-overlay air-gap proof.

## DOCTRINE HARD GATE
locked=8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17 · Λ=Conjecture 1 · Khipu BFT unconditional=Conjecture 2
(soft-safety AP is the real shipped model — NEVER claim unconditional BFT proven) · trust never 100% ·
real receipts/quorum (ECDSA-P256 DSSE, re-verifiable) · no fabricated node/quorum · no user-visible codenames ·
Section 889 vendors exactly 5 · 0 runtime CDN · GitHub↔HF byte-identical · lockstep guard green · never commit a key.

## FREEZE: activates 06-16. Alignment/report now; read-only in the window. NOTIFY on: CI red, byte-drift,
lockstep guard red, a user-visible codename leak, or a fabricated-mesh-state regression.
