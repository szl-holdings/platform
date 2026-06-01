# RUNTIME_SOURCE_INDEX — PURIQ-OS

**Signed:** Yachay (Perplexity Computer Agent), 2026-06-01. Additive over Doctrine v12.

Canonical runtime lives at **`/home/user/workspace/szl_puriq_os/`**. A verified mirror
is copied into this deliverables dir at `RUNTIME_SOURCE_honest/` and into the staged
a11oy patch at `pending_patches/szl_puriq_os_to_a11oy/puriq_os/`.

## Core runtime (`szl_puriq_os/puriq_os/`)

| File | Purpose |
|------|---------|
| `loop.py` | `OrganAgent` base class — the 5-step Observe→Decide→Act→Sign→Loop cycle; `utility_U` (Doctrine v12 §2). |
| `scheduler.py` | `PuriqScheduler` — APScheduler interval jobs per organ + deterministic `run_synthetic` clock. |
| `yuyay_gate.py` | 13-axis `yuyay_v3` conjunctive gate (2 sacred ≥0.95, 7 structural ≥0.90, 4 introspection). |
| `khipu_emit.py` | `KhipuLedger` + `KhipuReceipt` — DSSE-shaped, sqlite hash-chain, one receipt per tick, threadsafe. |
| `hukulla_tripwires.py` | HUKLLA T01–T10 sole halt-authority (no invented T11–T20). |
| `lambda_aggregator.py` | Λ(x) weighted geometric mean (canonical D2, v11 §12). |
| `replay_hash.py` | Honest yuyay_v3 replay-hash gate — BLOCKs until the real v11 artifact matches. |
| `app.py` | FastAPI app — `/v1/puriq/*` endpoints + read-only `/agentic` tab. |
| `daemon.py` | Real autonomous loop: APScheduler mode + bare `while`-loop mode (`--bare`). |
| `__init__.py` | Package exports + LOCKED-number table. |

## Organs (`szl_puriq_os/puriq_os/organs/`) — 12 canonical

`amaru_agent.py` (7s), `yuyay_agent.py` (12s), `yawar_agent.py` (12s),
`hukulla_agent.py` (7s), `kallpa_agent.py` (49s), `khipu_agent.py` (12s),
`lambda_agent.py` (49s), `otel_vsp_agent.py` (7s), `kanchay_agent.py` (12s),
`hatun_agent.py` (49s), `sumaq_agent.py` (12s), `killinchu_bridge_agent.py` (7s).
Registry + `build_all()` in `organs/__init__.py`.

## Tests (`szl_puriq_os/tests/`) — 17 passing

| File | Proves |
|------|--------|
| `test_loop_and_receipts.py` | 100 cycles → 100 receipts; Yuyay gate rejects sub-threshold; chain persists+reloads; no-compensation. |
| `test_hukulla_halt.py` | tripwire latches HALTED; halted organ keeps receipting; T07 2-person gate; exactly 10 tripwires. |
| `test_organs_cadence.py` | exactly 12 organs; declared cadences; each ticks+receipts; synthetic scheduler respects cadence. |
| `test_replay_and_api.py` | replay-hash BLOCKs (absent/mismatch); FastAPI health/replay/loop/status/agentic/404. |

## Run

```bash
cd /home/user/workspace/szl_puriq_os
python3 -m pytest -q                                  # 17 passed
python3 -m puriq_os.replay_hash                        # honest BLOCK (exit 2)
python3 -m puriq_os.daemon --bare --max-seconds 9      # real while-loop, ticks organs
PURIQ_DB=ledger.sqlite python3 -m uvicorn puriq_os.app:app   # serve /agentic + /v1/puriq/*
```
