# Forge — energy CONTAINMENT layer LIVE on the box (joule budget + cost cap) — 20260613T082952Z

Operate/verify report. Additive. Did NOT merge any PR.

## WHAT THIS IS
The energy orders (R-STORE-DISPERSE, R-TAKE-IT-NOW, E2/E4, R-UNIFY "keep CONTAINED") all
require a budget/containment gate around the soak so a runaway batch can never beat the
floor. That containment layer is now built, deployed, and VERIFIED on the sovereign box.

## LIVE STATE (verified this run, real 200s only)
- `joule-meter.service` = **active** on 167.233.50.75.
- HTTP `GET /healthz` = **200** on the tailnet listener `100.96.129.45:9471` (binds tailnet,
  not loopback — it receives pushes from the GPU node; loopback GET is refused by design).
- `/var/lib/szl/joules-status.json` carries a live `containment` block, **caps OFF by default**
  (no fabricated cap — only a MEASURED joule can ever trip it):
  `budget_j_per_day=null, cost_cap_eur_per_day=null, alert_sink=null, today=2026-06-13,
  today_by_engine={}, _daily={}, _alerted={}`.
- `awaiting_exporter` still null → no MEASURED watts yet (see GATED below).

## CONTAINMENT DESIGN
- Per-engine, per-UTC-day caps: `JOULE_BUDGET_J` (joules/day) and `JOULE_COST_CAP_EUR`
  (€/day, joules/3.6e9 × €/MWh), alert sink `JOULE_NTFY_URL`. All OFF (0/empty) by default.
- Daily counters + one-shot alert dedup persisted in `joules-status.json`, restored on restart;
  resets on UTC day rollover.

## SELF-TESTS (re-run this session, both PASS)
- Integration: `expected~1003.3 J  got 1002.9 J  err=0.0%  samples=6` → PASS.
- Budget/containment: `today_j=1204  budget_alerts=1  alerts=['... joule budget hit: 401 J >= 400 J today']`
  → PASS (alert fires EXACTLY once, no re-alert flood).

## STILL FOUNDER-GATED (honest — no fabrication)
- **First MEASURED joule** remains blocked: betterwithage (100.125.77.31) exposes ONLY Ollama
  :11434 — SSH/22 closed, no NVML/node-exporter — so `nvidia-smi power.draw` is unreadable
  remotely (consistent with forge-first-real-joule-20260613T075035Z.md). Joules stay SAMPLE.
- To activate containment with REAL data the founder runs the on-node exporter
  (`gpu-joule-exporter.py` on the Windows GPU node) → meter flips `awaiting_exporter`→measured;
  then set a real cap value (none invented).

## DOCTRINE v11
No free-energy; joules MEASURED only via on-box NVML else SAMPLE; caps OFF by default so no
fabricated cap; no key committed; reactive/critical never starved; locked-8 untouched; Λ=Conj1.
