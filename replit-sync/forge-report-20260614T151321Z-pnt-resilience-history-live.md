# Forge report — UPGRADES wave GATE U1 (history) DONE + live

**When:** 2026-06-14 (after the PNT-mesh P0 close-out)
**Doctrine:** v11 LOCKED · Λ = Conjecture 1 · PROVE-OR-DOWNGRADE

## What was actually open (verified live, not trusted from the auto-loop report)
The forge-auto executor marked the whole UPGRADES wave "DONE", but live HF probing
showed otherwise. Honest live state before this pass:
- `/api/a11oy/v1/pnt/limits` -> 200, already lists BOTH pillars (U4 main gate already GREEN).
- `/holo`, `/estate-hologram`, `/holographic-ops` -> 200 (P1 Holographic Ops already landed).
- `/api/a11oy/v1/pnt/resilience/history` -> **404** (U1 history portion genuinely OPEN).
- `/api/a11oy/v1/verify`, `/compute-pool`, `/estate` -> 404 (U2 needs FA-001 key; U3 hex
  heightmap needs a live GPU tailnet probe; /estate is the FLY-HIGH standing order).

## DONE this pass — GATE U1 (history)
Added `/api/a11oy/v1/pnt/resilience/history` in `szl_pnt_mesh.py`:
- Every `/pnt/resilience` evaluation is recorded as a REAL MODELED closed-form fusion
  verdict — content id = sha256(canonical verdict json)[:16].
- In-process last-N ring (cap 256) + best-effort JSONL persistence under the data dir
  (`A11OY_DATA_DIR` / `/data/a11oy` / `/opt/szl/a11oy-data`); the response states which
  is in force. On an empty ring it seeds two genuine verdicts (clean ALLOW + spoof DENY).
- Honesty: entries stay MODELED. The MEASURED upgrade is the Dev2 GPU detector over the
  TEXBAT-class library — NOT faked here.

## PROOF (PROVE-OR-DOWNGRADE)
- TestClient on a FastAPI app: all 6 `/pnt/*` routes 200 (incl. /resilience/history);
  no 422 (handlers annotated `req: Request`).
- Module selftest: ok=true (now asserts 6 routes + non-empty MODELED content-addressed history).
- copy-sync lockstep guard: GREEN (no new files; Dockerfile already COPYs the module).
- Merged to a11oy main: PR #372 squash-merged, GitHub-signed sha 2885ed21.
- **LIVE:** szlholdings-a11oy.hf.space/api/a11oy/v1/pnt/resilience/history -> 200,
  count=2, label=MODELED, content-addressed cids present.

## Honestly NOT done (reported, never faked)
- **U1 MEASURED certs** (GPU sensor/coast sweep on rtx-betterwithage): RECOMMENDED —
  no GPU on this host; sensor/coast stay honestly MODELED.
- **U2 DSSE-signed PNT certs + unified /verify**: BLOCKED on FA-001 Ed25519 key (founder-held).
- **U3 estate-hologram hero / hex-heightmap live node count / Λ-gate ticker**: needs
  `/compute-pool` fed by a live per-GPU `gpu_reachable` probe (RTX-4000 rig founder-gated).
- **FLY-HIGH /api/a11oy/v1/estate self-describing index**: standing order, deferred
  (explicitly "after the current waves").

— Forge · Doctrine v11 LOCKED · Λ = Conjecture 1
