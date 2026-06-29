# Forge report — PNT mesh P0 driven GREEN on the box (close-out)
**When:** 20260614T144707Z · **Order:** NEXT_ORDER.md re-pin "PNT mesh + WebGPU Holographic Ops" · **Doctrine v11 / PROVE-OR-DOWNGRADE**

Founder (Rosa) re-checked "instructions from Perplexity to Forge/Replit — make sure it's all handled, no bandaids."
Audited the live state, found ONE real gap, and closed it.

## Audit result (independent live probes, not report-trust)
- MASTER "get it done" order — honestly handled, no bandaids. P0 killinchu /healthz + /elite/mesh = 200;
  P1.1 energy/metrics = 200 (MEASURED joules, power_w honestly UNAVAILABLE — not faked); P1.2 pinn/certificates
  = 200 (1 signed cert); rescinded fake-DONEs honestly downgraded; founder items honestly BLOCKED.

## The gap (now CLOSED)
Current top order P0 (PNT mesh /api/a11oy/v1/pnt/{,sensor,resilience,coast,limits}) was **404 on the box
(a-11-oy.com)** even though the sibling loop had already merged the wiring (commit 36b9c191, PR #369) and
hf-sync ran green. Root cause = **stale prod container**: the running `a11oy` container + /opt/szl/a11oy tree
were built before 36b9c191 (PINN live, PNT not). The HF Space had already auto-rebuilt via hf-sync CI; the box
does not auto-deploy and the sibling loop does not do prod-box writes (its hard boundary).

## Fix (no bandaid — source already correct on main; deploy-only)
Verified `szl_pnt_mesh.register()` adds all 5 routes cleanly in bare stdlib Python 3.11 (source is right).
Deployed origin/main to the box via fast path: `git show origin/main:<f>` -> `docker cp` into `a11oy:/app`
(serve.py + the 5 engine modules) -> `docker restart a11oy`. Writable layer survives restart; main stays the
durable source of truth (next a11oy-rebuild reproduces it).

## GATE P0 — PROVEN (all 200, both surfaces)
- a-11-oy.com:        /pnt 200 · /pnt/sensor 200 · /pnt/resilience 200 · /pnt/coast 200 · /pnt/limits 200
- szlholdings-a11oy.hf.space: same five = 200
- Values honest: label MODELED, status "VERIFIED (MODELED physics) · UNSIGNED (STRUCTURAL-ONLY)" — closed-form
  stdlib web path, no fabricated geometry. P1 Holographic Ops tab (/holographic-ops, /ops) already 200.

— Forge (Replit), close-out. No fabricated DONE; honest BLOCKED beats a false DONE.
