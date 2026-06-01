# TEAM_ALIGNMENT_MATRIX.md — who owns what, who reads what

**CTO/PM:** Yachay · 2026-06-01. Goal: agents on overlapping surfaces coordinate (don't fight).
The single most contended surface is **`SZLHOLDINGS/a11oy/serve.py`** — multiple agents register
routers there. The a11oy_audit deliverable already documented a real **concurrent write collision**
(7 commits RESET serve.py and reverted its fixes to 503). Treat serve.py as a shared resource with
the discipline below.

---

## CLUSTER 1 — a11oy HUB (highest collision risk)

**Members:** `a11oy_hub_integration`, `a11oy_audit`, `a11oy_code_orchestrator`,
`a11oy_code_frontier`, `a11oy_always`, `wayra`, `frontier_viz`, `new_organs` (shipped),
`customer_surface` (shipped).

**Shared file (contended):** `SZLHOLDINGS/a11oy/serve.py` + `Dockerfile`.

| File / surface | Owner | Readers / dependents |
|---|---|---|
| `serve.py` mount order (the spine) | a11oy_hub_integration | EVERYONE who adds a router |
| `wayra_serve.py` (/wayra + /api/a11oy/v1/wayra/*) | wayra / a11oy_always | hub |
| `a11oy_code_orchestrator.py` (/api/a11oy/code/*) | a11oy_code_orchestrator | a11oy_code_frontier (UI) |
| `szl_chaski/wallpa/wasi_rikuq.py` (/api/a11oy/{organ}/*) | new_organs (SHIPPED) | hub, wasi-rikuq←resilience |
| `console/*.html` static tabs (/docs,/pricing) | customer_surface (SHIPPED) | hub (static root = console/) |
| `pages/*.html` organ tabs | new_organs / hub | frontier_viz (3D embeds) |
| SPA `console/assets/*` (the React app) | frontier_viz / hub | all tab pages |

**RULE OF THE ROAD (mandatory, prevents the collision a11oy_audit hit):**
1. **One writer at a time** for `serve.py`. Before editing, `space_info().sha`; after, re-read and
   diff. If SHA changed under you, rebase your edit onto the new serve.py — never blind-overwrite.
2. **Always mount EARLY** (after the a11oy.code block, before the `/api/a11oy/{path}` Node proxy
   and before `@app.get("/{full_path:path}")`), inside a try/except so a missing module can never
   take down the SPA. Mirror the WAYRA / a11oy.code pattern exactly.
3. **Never delete or reorder existing routes.** ADDITIVE only.
4. **Dockerfile is explicit per-file COPY** — every new root `.py` needs its own COPY line.
5. Page routes go before the SPA catch-all; the catch-all stays LAST.

---

## CLUSTER 2 — KILLINCHU (already shipped; keep additive)

**Members:** `killinchu` (SHIPPED, SHA `43e422fc`), `sentra_killinchu_bridge`, `warhacker_p7_p8`,
`final_sweep` (naval/HAPS), plus the satellites/drone-twin/anatomy work folded into killinchu.

| Surface | Owner | Readers |
|---|---|---|
| `SZLHOLDINGS/killinchu` Space (/api/killinchu/v1/*) | killinchu | bridge, warhacker |
| vessels→killinchu aliases (`/api/vessels/*` preserved) | killinchu | vessels (baseline GREEN) |
| Sentra↔Killinchu shared `event_id` / Khipu correlation | sentra_killinchu_bridge | both flagships |
| `szl-sentra-detect` vendored libs | sentra_killinchu_bridge | every drone surface |
| Warhacker packs (P7/P8) | warhacker_p7_p8 | killinchu legal/`/legal` page |

**Coordination:** killinchu is LIVE — all of these must be **additive aliases / vendored libs**,
never edits that could 503 killinchu. The bridge owns the cross-flagship Khipu correlation and is
the single source for "one Book of Evidence across flagships" (honest: correlation today, durable
single store still to be wired).

---

## CLUSTER 3 — LEAN / DOCTRINE (coordinate stub additions)

**Members:** `puriq` (charter+doctrine v12/v13), `foundation_proofs`, `thesis_v20`, `hatun_mcp`,
plus the Lean corpus referenced as doctrine_v11_corpus / khipu_soundness / agentic_formulas /
ancient_corpus in the directive.

| Surface | Owner | Readers |
|---|---|---|
| `PuriqLean.lean` §9 organ stubs (sorry-tagged) | puriq | foundation_proofs, new_organs (factor defs) |
| LOCKED counts 749/14/163 | puriq doctrine | EVERYONE — verbatim, never edit |
| `PURIQ_CHARTER.md` HARD RULES | puriq | all agents (read at phase start) |
| Thesis v20 culmination | thesis_v20 | investor_data_room |
| Hatun doctrine artifacts/schemas | hatun_mcp / puriq | a11oy gate manifest |

**RULE:** Lean stub additions are **additive `sorry`-tagged obligations OUTSIDE the locked 163
counter** until an integration agent folds them in (then the counter moves, e.g. 163→166), exactly
as the v12 invariants did. **Never silently change 163.** One PR per stub set; `lean PuriqLean.lean`
parse-check must pass (full `lake build` is blocked on absent Mathlib deps — document, don't fake).

---

## CLUSTER 4 — WIRES / DAG (share ONE Khipu DAG schema)

**Members:** `wire_finish`, `wires_def_ship`, `agentic_dag_formulas`, `resilience_observability`,
`live_wires_3d`. (Several are IDLE — see PM dashboard; align before they each re-define the schema.)

| Surface | Owner | Readers |
|---|---|---|
| Khipu DAG node schema `sha256(payload‖parents)` + DSSE PLACEHOLDER envelope | wire_finish / `szl_wire.py` | resilience (breaker receipts), wasi-rikuq, bridge |
| Wires D/E/F/G/H ship | wires_def_ship | live_wires_3d (visual), a11oy policy wire D |
| Agentic DAG formulas | agentic_dag_formulas | puriq doctrine, resilience |
| `live_wires_3d.js` 3D scene (anatomy) | live_wires_3d | anatomy-3d Space (entry is `main.js` — see note) |
| Circuit breaker / chaos receipts | resilience_observability | wasi-rikuq organ (`/api/a11oy/wasi-rikuq/chaos` is LIVE) |

**RULE:** There is **one** Khipu DAG schema (`szl_wire.py`: `SIGNATURE_PLACEHOLDER`, SHA-256 link).
Every wire/DAG/resilience agent **imports** it; none forks it. resilience_observability should land
its breaker as receipts on this DAG and surface verdicts through the now-live WASI-RIKUQ organ
rather than building a parallel store. **Anatomy-3D note:** the live `anatomy-3d` Space serves
`main.js`, NOT `live_wires_3d.js` — `live_wires_3d` owner must confirm the real served entry before
pushing (this is why the anatomy V3 patch was HELD this sweep).

---

## CROSS-CLUSTER DEPENDENCIES (the wiring between clusters)

- **WASI-RIKUQ** (Cluster 1, live) consumes **resilience_observability** (Cluster 4) breaker/chaos
  receipts and **sentra** (Cluster 2) health → it is the observability single-pane the
  completeness_audit asked for (`/dashboard/everything` candidate).
- **puriq doctrine** (Cluster 3) defines the `[0,1]` organ factors that **new_organs** (Cluster 1)
  implement and **agentic_dag_formulas** (Cluster 4) formalize.
- **investor_data_room** reads outputs from ALL clusters (SHAs, route tables, scorecard) — it is a
  pure consumer; give it this sweep's FOUNDER_BRIEF_v6 + CTO_SCORECARD as inputs.

— Yachay
