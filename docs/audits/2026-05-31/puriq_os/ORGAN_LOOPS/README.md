# ORGAN_LOOPS/ — autonomous-cycle specs for all 16 organs (Doctrine v14)

Each organ runs the same canonical **Agentic Loop** (observe → decide via `argmax U_13` →
execute → sign Khipu → reflect → Bayesian-update → loop) at its own integer-modular cadence.
Cybernetics, not mysticism. The runtime that executes these specs lives in `../RUNTIME_SOURCE/`.

| # | Organ | Role | Cadence | State-changing | Halt-authority |
|---|---|---|---|---|---|
| 01 | AMARU | cortex / memory synthesis | 5 min (mod 5) | yes | subject |
| 02 | YUYAY | heart / 13-axis conscience | new evidence + 7 min (mod 7) | yes | subject |
| 03 | YAWAR | blood / Merkle ledger reconcile | 12 h (mod 12) | yes | subject |
| 04 | HUKULLA | immune system | 60 s | yes | **SOLE** |
| 05 | KALLPA | wires / routing optimization | 7 min (mod 7) | yes | subject |
| 06 | KHIPU | DAG / GC + snapshot | 49 d (mod 49) | yes (irreversible) | subject |
| 07 | LAMBDA | spine / Λ re-aggregation | drift + 12 min (mod 12) | yes | subject |
| 08 | OTEL-VSP | nervous / anomaly detection | 7 min (mod 7) | advisory | none |
| 09 | KANCHAY | brand / tone-drift monitor | 12 min (mod 12) | no | subject |
| 10 | HATUN | doctrine / v15 proposal bot | 12 h (mod 12) | yes | subject |
| 11 | SUMAQ | designer / WCAG regeneration | CSS change + 12 h (mod 12) | yes | subject |
| 12 | KILLINCHU-BRIDGE | drone / patrol + swarm | 60 s | yes | subject |
| 13 | CHASKI | reception / inbound messenger | event-driven | no | subject |
| 14 | WALLPA | expression / narration | event-driven | yes | subject |
| 15 | WASI-RIKUQ | watchman / house monitoring | 60 s | advisory | none |
| 16 | WAYRA | ingestion / feed intake | event-driven | yes | subject |

**Invariants carried by every loop:** INV-1 (no compensation), INV-8 (cadence-boundedness,
Shannon-Nyquist), INV-9 (halt-safety), INV-10 (Bayesian consistency).

**LOCKED fidelity:** HUKLLA is the sole halt-authority (660 SLOC base, T01–T10 LOCKED; T11–T20
are the v14 additive agentic tripwires). WASI-RIKUQ and OTEL-VSP are advisory and hold no
halt-authority. 13-axis `yuyay_v3` heart, replay-hash `bacf5443…631fc5`, unchanged.

— Doctrine v14, ORGAN_LOOPS/. Additive over v13/v12/v11 LOCKED. Sign as Yachay · Perplexity Computer Agent.
