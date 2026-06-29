# SZL Forge — ORDER: finish the SIGNATURE + upgrade wave (PROVE-OR-DOWNGRADE in force)

Dispatch is GREEN. Box + HF /pinn are MEASURED (real NVML, verified). The prove-or-downgrade rule from
FORGE-INSTRUCTION-prove-or-downgrade-20260614.md is STILL IN FORCE: mark DONE only with a checkable
artifact (pushed commit SHA, HTTP 200 from a named endpoint, or a real verifying signature); else
RECOMMENDED or BLOCKED. NEVER narration-as-DONE. Open a draft PR per build item and report its number.

## P0 — FINISH ITEM B: sign the certificate (UNSIGNED -> signed)
The cert is still `VERIFIED (physical bounds) · UNSIGNED (STRUCTURAL-ONLY)` and /verify shows keyid:none.
Run the MEASURED cert through the existing khipu/szl_lake Ed25519 DSSE signer with the FA-001 key in the
box secret store; PAE -> sign -> append to the khipu chain. Then:
```bash
curl -s https://a-11-oy.com/api/a11oy/v1/verify | python3 -m json.tool | head -20
curl -s https://a-11-oy.com/api/a11oy/v1/pinn/certificate | python3 -c 'import sys,json;print(json.load(sys.stdin).get("status"))'
```
**GATE B:** /verify returns a real DSSE receipt (keyid + signature that verifies) AND cert status drops
"UNSIGNED". If FA-001 is NOT in the secret store -> mark **BLOCKED: needs founder FA-001 key drop** and
STOP. Do NOT fabricate a signature or digest.

## P1 — UPGRADES (each = its own draft PR; mark DONE only with the PR number + green checks)
1. **PINN coverage:** extend the agentic solver from 1D heat to 2D heat + 1D Burgers on the GPU; keep the
   deny-by-default Λ-gate + signed per-round receipt. Report rel-L2 per round per PDE. (draft PR in platform)
2. **Energy exporter (real):** wire nvidia-smi power.draw -> a /metrics endpoint so joules_consumed in
   EVERY receipt is MEASURED, not just the PINN cert. Verify: curl the /metrics, show a real watt reading.
3. **Certificate history:** add /api/a11oy/v1/pinn/certificates (last N signed certs, content-addressed)
   so the proof is auditable over time, not just the latest. Verify: HTTP 200 + >=1 entry.
4. **Bounds badge on the console:** small honest "PHYSICALLY BOUNDED · MEASURED · SIGNED/UNSIGNED" badge on
   the a11oy energy console reading live from /pinn/certificate. Verify: render 200, label matches API.
5. **2nd-GPU role-split:** chaski (2nd lung) is UP — run the Λ-gate governor inference on chaski while the
   PINN solve runs on rtx-betterwithage; report both endpoints' tags 200. Honest fallback if a link flaps.

## P2 — the 15-item wave (agent-loop, BFT quorum, SZL-NEMO, OSCAL, auto-review...)
Stay RECOMMENDED with a concrete per-item plan UNLESS you open a real draft PR — then report the PR number.
These are multi-PR efforts; do NOT mark DONE in one pass. NEVER self-merge a lutar-lean keystone PR.

## DOCTRINE v11 (HARD)
No fabricated DONE/flags/signatures/digits. MEASURED energy only (real exporter). Honest inverse of
free-energy, never over-unity. Λ = Conjecture 1 (advisory). SLSA L1 honest. Sovereign own-metal. 0 runtime
CDN. Never commit a key. Honest BLOCKED beats a false DONE.

— Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> · Doctrine v11 LOCKED · Λ = Conjecture 1
