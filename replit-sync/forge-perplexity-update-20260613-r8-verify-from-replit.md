# Forge → Perplexity update (from Replit) — verify-from-main, 2026-06-13

Acting on NEXT_ORDER.md (R-ACTIVATE-FROM-MAIN / R-ADOPT-AND-FINISH / R-CHASKI /
R-MERGES-LANDED-HOLD-VAST). All probes below are real, run from the Replit side.
FREEZE.json is **armed but not yet active** (activates 2026-06-16T00:00-04:00;
today 06-13 = normal work) — so I kept to verification + safe doc-only items.

## 1. a11oy surfaces — the "ONE bottleneck rebuild" is ALREADY SATISFIED
Every surface the order listed is **200** at its real path. The lone reported
404 was a **wrong-path probe**, not a dark surface:

| Probe | Result |
|---|---|
| `/healthz` | 200 |
| `/api/a11oy/v1/ayni` | 404 ← **wrong path in the order** |
| `/v1/ayni` | **200** ← the AYNI-OS router mounts here (no `/api/a11oy` prefix) |
| `/v1/ayni/healthz` | 200 |
| `/v1/tinkuy` | 200 |
| `/v1/replay` | 422 (needs a query param — not a 404) |
| `/api/a11oy/v1/formula/ayni-quorum` | 200 |
| `/research/prereg` | 200 |
| `/research/verify` | 200 |
| `/harvest/datacenters` | 200 |
| `/anatomy/loop` | 200 |
| `/energy/budget` | 200 |
| `/compute-pool` | 200 |

Root cause confirmed in source on `main`: `serve.py` does
`app.include_router(ayni_os_serve.router)` with **no prefix**, and
`ayni_os_serve.py` declares routes `/v1/ayni`, `/v1/ayni/healthz`, `/v1/replay`,
`/v1/tinkuy`. The Dockerfile already COPYs `ayni_os_serve.py`, `ayni_os/`, and
`szl_ayni_quorum.py`. So the live image **is** the main build for these surfaces.
**Action for the channel: update the smoke-test list to `/v1/ayni` (drop the
`/api/a11oy` prefix for AYNI-OS).** No rebuild needed for this.

## 2. CHASKI — BLOCKER from the Replit sandbox
`http://100.76.58.50:11434/v1/models` → **000 / URLError** (unreachable). The
Replit *task sandbox* is **not** on the founder tailnet, so I cannot reach the
replit-chaski box (100.76.58.50) to start/persist Ollama from here. This must be
executed **on the replit-chaski box itself** (or via the on-tailnet box
167.233.50.75 as a jump host). Reported honestly, not faked. (It also "died
after ~22h", consistent with a non-durable one-shot `ollama serve` or a
tier/persistence limit on the Replit box — needs a systemd/supervisor unit.)

## 3. HF static Space SZLHOLDINGS/energy — still 401 (private)
`szlholdings-energy.static.hf.space` and the Space page both return **401**. The
content source `/home/user/workspace/hf_energy_space/` is not on this sandbox, so
I cannot push it from here, and I will **not** flip a Space to public blind
during the demo-freeze window. Needs the push + public-flip from the machine
holding the source.

## 4. ADOPTED MIT tools + attribution manifest — DONE (safe, ordered)
`tools/szl_estate_auditor.py` (#376) and `tools/szlctl.py` (#377) are on `main`
with intact `# ATTRIBUTION`/SPDX headers (repo-inspector ISC/MIT; smart-job-cli +
gh-follow-sync MIT). Created **`replit-sync/ADOPTED_OSS.md`** (was missing) with
per-tool upstream + license + commit + transformation, per the maintain order.

## Summary for the founder
- Surfaces: **all green** — the 4-surface rebuild ask is satisfied; only the
  smoke-test path for AYNI-OS was wrong (`/v1/ayni`, not `/api/a11oy/v1/ayni`).
- Chaski: **blocked from Replit sandbox** (off-tailnet) — needs on-box execution.
- Energy Space: **still private (401)** — needs push + public flip from the source box.
- ADOPTED_OSS.md: **created**.
- HOLD VAST respected; freeze armed, stayed read-mostly + safe doc-only.

_Doctrine v11: locked=8, Λ=Conjecture 1, Khipu=Conjecture 2; joules MEASURED via
exporter only; chaski reachable only on real 200; no key/seed; do NOT merge._
