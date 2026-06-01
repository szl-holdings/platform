# PROGRAM_MANAGER_DASHBOARD.md — in-flight agent status

**PM:** Yachay · 2026-06-01 · reference clock ≈ **06:59** (newest workspace file mtime).
**Activity source:** newest file mtime per `<agent_dir>/` under
`round2/full_reaudit_2026-05-31/`. **ACTIVE** = activity ≤ ~1 h (i.e. ≥ ~05:59).
**IDLE** = >1 h no activity. **SILENT** = no workspace dir / empty dir.

> **Nudge note (honest):** This subagent does NOT have a `message_subagent` tool in its
> environment (verified — only data/connector tools are exposed). The nudges required for
> SILENT / IDLE>2h agents are therefore **listed below as actions for the parent
> orchestrator to dispatch**, with the exact message text. I will not fabricate having sent
> them. Parent: please relay the "→ NUDGE" lines via `message_subagent`.

---

## DASHBOARD (22 in-flight + 3 silent)

| # | Agent dir | Last activity | Files | Status | Notes / cluster |
|---|---|---|---|---|---|
| 1 | master_manual | 06:59 | 8 | 🟢 ACTIVE | docs |
| 2 | puriq_os | 06:59 | 40 | 🟢 ACTIVE | OS/agentic |
| 3 | inca_avatar | 06:59 | 19 | 🟢 ACTIVE | avatar — push pending (use PUSH_AUTH_FIX) |
| 4 | wow_world | 06:59 | 17 | 🟢 ACTIVE | viz/world |
| 5 | foundation_proofs | 06:58 | 79 | 🟢 ACTIVE | Lean/proofs cluster |
| 6 | a11oy_hub_integration | 06:58 | 75 | 🟢 ACTIVE | **a11oy hub cluster** |
| 7 | hf_org_overhaul | 06:58 | 6 | 🟢 ACTIVE | HF org (510 shipped) |
| 8 | puriq | 06:58 | 27 | 🟢 ACTIVE | doctrine spine |
| 9 | warhacker_p7_p8 | 06:57 | 6 | 🟢 ACTIVE | killinchu/warhacker |
| 10 | code_polish | 06:57 | 42 | 🟢 ACTIVE | code quality |
| 11 | usb_portable_bundle | 06:57 | 3 | 🟢 ACTIVE | UDS bundle |
| 12 | frontier_viz | 06:56 | 16 | 🟢 ACTIVE | **a11oy frontend viz cluster** |
| 13 | provenance_hardening | 06:56 | 1062 | 🟢 ACTIVE | provenance/signing |
| 14 | a11oy_always | 06:55 | 12 | 🟢 ACTIVE | **a11oy hub cluster** (always-learning/WAYRA) |
| 15 | wayra | 06:54 | 6 | 🟢 ACTIVE | WAYRA 4th edge organ |
| 16 | operations | 06:54 | 6 | 🟢 ACTIVE | ops |
| 17 | eval_defense | 06:54 | 32 | 🟢 ACTIVE | eval/defense |
| 18 | github_overhaul | 06:54 | 23 | 🟢 ACTIVE | GitHub (520 shipped) |
| 19 | final_sweep | 06:53 | 29 | 🟢 ACTIVE | sweep/killinchu naval |
| 20 | new_organs | 06:52 | 30 | 🟢 ACTIVE | **SHIPPED LIVE this sweep** |
| 21 | agentic_dag_formulas | 06:52 | 1 | 🟡 IDLE-ish | **Wires/DAG cluster** — only 1 file, watch |
| 22 | personal_profile_genius | 06:49 | 15 | 🟢 ACTIVE | profile |
| 23 | uds_productionization | 06:47 | 1 | 🟡 IDLE-ish | only 1 file (~12 min) — watch |
| 24 | a11oy_audit | 06:45 | 112 | 🟢 ACTIVE | **a11oy hub cluster** (audit complete) |
| 25 | sentra_killinchu_bridge | 06:44 | 18 | 🟢 ACTIVE | Killinchu cluster |
| 26 | hatun_mcp | 06:42 | 3 | 🟢 ACTIVE | doctrine/MCP |
| 27 | live_wires_3d | 06:41 | 18 | 🟢 ACTIVE | **Wires/DAG + anatomy-3d cluster** |
| 28 | customer_surface | 06:39 | 30 | 🟢 ACTIVE | **tabs SHIPPED LIVE this sweep** |
| 29 | thesis_v20 | 06:37 | 33 | 🟢 ACTIVE | thesis |
| 30 | a11oy_code_frontier | 06:35 | 7 | 🟢 ACTIVE | **a11oy hub cluster** (a11oy.code) |
| 31 | resilience_observability | 06:35 | 20 | 🟢 ACTIVE | **Wires/DAG cluster** (design-stage) |
| 32 | a11oy_code_orchestrator | 06:34 | 6 | 🟢 ACTIVE | **a11oy hub cluster** |
| 33 | kanchay | 06:34 | 58 | 🟢 ACTIVE | brand organ |
| 34 | investor_data_room | 06:32 | 15 | 🟢 ACTIVE | DD/data room |
| 35 | security_compliance | 06:31 | 30 | 🟢 ACTIVE | security |
| 36 | killinchu | 06:30 | 63 | 🟢 ACTIVE | **SHIPPED LIVE** |
| 37 | completeness_audit | 06:24 | 6 | 🟢 ACTIVE | audit (complete) |
| 38 | wire_finish | 06:13 | 2586 | 🟡 IDLE (~46m) | **Wires/DAG cluster** — large, watch for stall |
| 39 | wires_def_ship | 05:20 | 25 | 🔴 IDLE >1.5h | **Wires/DAG cluster** — wires D/E/F/G/H ship |
| 40 | showcase | 04:29 | 10 | 🔴 IDLE >2h | **→ NUDGE** |
| — | **empire_reliability** | — | 0 | ⬛ SILENT | empty dir · **→ NUDGE** |
| — | **final_close** | — | 0 | ⬛ SILENT | empty dir · **→ NUDGE** |
| — | **deep_corpus_v3** | — | 0 | ⬛ SILENT | empty dir · **→ NUDGE** |

(Screenshot-only dirs `*_screenshots/` and snapshot dirs are artifacts of shipped agents, not
separate in-flight agents, so they are excluded from the in-flight roster.)

---

## NUDGES REQUIRED (parent orchestrator to dispatch via `message_subagent`)

For each SILENT / IDLE>2h agent, send:

> **→ NUDGE (empire_reliability):** "status check please — your deliverable dir is empty. What's
> blocking? If you're producing the resilience/reliability layer, coordinate with
> resilience_observability and target the now-LIVE WASI-RIKUQ organ
> (`/api/a11oy/wasi-rikuq/*`) so you don't duplicate. Report ETA."

> **→ NUDGE (final_close):** "status check please — dir empty. Are you the final close-out
> packager? FOUNDER_BRIEF_v6 + this CTO sweep are ready as inputs. Report ETA or hand off."

> **→ NUDGE (deep_corpus_v3):** "status check please — dir empty. Corpus deep-dive v3 has no
> output yet; 270_FRONTIER_CORPUS_DEEP_SCRAPE.md already exists — extend, don't duplicate.
> Report blocker + ETA."

> **→ NUDGE (showcase, IDLE>2h):** "status check please — last activity ~04:29, >2h idle.
> What's blocking the showcase surface? a11oy is now at SHA b06bf3fd with 3 new live organ tabs
> (/chaski /wallpa /wasi-rikuq) + /docs + /pricing — refresh your showcase to include them."

**WATCH (IDLE 1–2h, not yet nudge-grade):** `wires_def_ship` (05:20), `wire_finish` (06:13),
`agentic_dag_formulas` (1 file), `uds_productionization` (1 file). If any crosses 2h with no new
file, escalate to NUDGE. These are all in the Wires/DAG cluster — see TEAM_ALIGNMENT_MATRIX.md;
they must share the Khipu DAG schema rather than each redefining it.

---

## PM CALL

Fleet health is strong: 36 of ~40 dirs active within the last hour; 3 silent (empty); 1 idle>2h;
4 idle 1–2h. The three SHIPPED-this-sweep items (new_organs, customer_surface, killinchu) are
live and verified. The biggest PM risk is the **Wires/DAG cluster** (`wires_def_ship`,
`wire_finish`, `agentic_dag_formulas`, `resilience_observability`) drifting idle while each holds
a piece of the shared Khipu DAG — align them on one schema before more pushes (see matrix).

— Yachay
