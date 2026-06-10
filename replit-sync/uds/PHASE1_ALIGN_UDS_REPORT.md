# PHASE-1 STABILIZE — GitHub↔HF Alignment + UDS Payload/Mesh Report

**Mandate:** `team/PHASE1_ALIGN_UDS_MANDATE.md`
**Date:** 2026-06-08
**Agent:** Perplexity Computer Agent (Phase-1 stabilize subagent)
**Status:** ✅ COMPLETE — all three tasks done, every endpoint live-verified (HTTP 200 / honest 412), honesty doctrine intact.

---

## EXECUTIVE SUMMARY

| Task | Outcome |
|------|---------|
| **TASK 1** — Deploy 3 staged a11oy non-Code files (HF + GitHub) | ✅ Deployed both sides; a11oy Code IDE still **live** (`mode:"live"`, screenshot) |
| **TASK 2** — Full GitHub↔HF alignment (a11oy + killinchu + anatomy) | ✅ a11oy 5/5 aligned · killinchu 9/9 aligned · anatomy = HF-only (no GitHub mirror exists), live & codename-clean |
| **TASK 2** — QUORUM sweep deployed both sides | ✅ **CONSENSUS HOLDS 4/4** live; UDS-facing pages codename-clean |
| **TASK 3** — UDS `theorem_ref` + `lake_receipt` + honest mesh | ✅ Wired into the real UDS decision payload (`szl_khipu_consensus.py`), deployed, live-verified |
| **HONESTY DOCTRINE** | ✅ locked-5 = exactly {F1,F11,F12,F18,F19} @ c7c0ba17 · Λ = Conjecture 1 · BFT = Conjecture 2 OPEN · Defense Unicorns NOTICE intact · 0 fabricated consensus |

---

## TASK 1 — STAGED a11oy FILES DEPLOYED

Three staged non-Code files deployed to the HF a11oy Space (commit API) and pushed to GitHub `szl-holdings/a11oy`. The live Code engine files (`a11oy_code_orchestrator.py` / `a11oy_code.py` / `a11oy_code_ide.html`) were **NOT touched**.

- HF commit: `5538c40ff38c20f99fceb92546d521ac02949f4a`
- Files: `a11oy_formula_endpoints.py`, `a11oy_formulas_page.py`, `pages_console.html`
- Honesty pre-check: no banned codenames; locked-5 not inflated; CF-22/CF-23 labeled experimental; Λ = Conjecture 1; 0 runtime CDN.

**a11oy Code IDE still live (mandate gate):**
```
GET https://szlholdings-a11oy.hf.space/api/a11oy/code/healthz  → HTTP 200
{"status":"ok","component":"a11oy.code orchestrator","doctrine":"v12 (v11+PURIQ)",
 "mode":"live", ... "built_by":"Perplexity Computer Agent"}
```
Screenshot: `_align/evidence/a11oy_code_ide_mode_live.png`

**a11oy main healthz:** `GET /api/a11oy/healthz` → 200, doctrine v11, declarations 749 / axioms 14 / sorries 163, experimental scope honestly "NOT folded into the locked count of 5; Λ stays Conjecture 1".

---

## TASK 2 — FULL GitHub↔HF ALIGNMENT TABLE

Method: fetch HF copy (`huggingface.co/spaces/SZLHOLDINGS/<sp>/resolve/main/<f>`) + GitHub copy
(`api.github.com/repos/szl-holdings/<repo>/contents/<f>`), compare **sha256 of decoded content**.

### a11oy — `szl-holdings/a11oy` ↔ `SZLHOLDINGS/a11oy`

| File | GitHub sha256 | HF sha256 | Aligned? | Action |
|------|---------------|-----------|----------|--------|
| `a11oy_formula_endpoints.py` | `1b356bbf…d5e4e7` | `1b356bbf…d5e4e7` | ✅ YES | Deployed (Task 1) |
| `a11oy_formulas_page.py` | `5d115275…61cf0` | `5d115275…61cf0` | ✅ YES | Deployed (Task 1) |
| `pages_console.html` | `ca77d089…77ea2` | `ca77d089…77ea2` | ✅ YES | Deployed (Task 1; was new on GitHub) |
| `serve.py` | `f049de86…b650e` | `f049de86…b650e` | ✅ YES | Already aligned |
| `a11oy_code_orchestrator.py` | `a2fb6c71…c13459` | `a2fb6c71…c13459` | ✅ YES | Synced GitHub→HF canonical earlier (HF_TOKEN env fallbacks); NOT edited (Code engine left live) |

**a11oy result: 5/5 aligned.**

### killinchu — `szl-holdings/killinchu` ↔ `SZLHOLDINGS/killinchu`

| File | GitHub sha256 | HF sha256 | Aligned? | Action |
|------|---------------|-----------|----------|--------|
| `killinchu_fusion.py` | `c22b9729…16b3c` | `c22b9729…16b3c` | ✅ YES | Synced (QUORUM sweep + theorem_ref helpers) deployed both sides |
| `killinchu_elite_console.py` | `820a1fb7…ad6ef7` | `820a1fb7…ad6ef7` | ✅ YES | Surgically-fixed console (`quorum_without_amaru` removed → `q.quorum_possible`) deployed both sides |
| `szl_khipu_consensus.py` | `ed5b39a6…85fdf` | `ed5b39a6…85fdf` | ✅ YES | **TASK 3** theorem_ref + lake_receipt added; deployed both sides |
| `live_wires_3d.js` | `4ceb51c3…1cba4f` | `4ceb51c3…1cba4f` | ✅ YES | Sweep (`\mathrm{YACHAY}`, SISTER_LABELS) deployed both sides |
| `static/uds.html` | `5b5350ef…84a772` | `5b5350ef…84a772` | ✅ YES | Honest role keys deployed both sides |
| `static/uds-compliance.html` | `e1a43ded…a3b3e4` | `e1a43ded…a3b3e4` | ✅ YES | Deployed both sides |
| `web/v4_fleet_panel.html` | `fc7569f6…9b4e4f` | `fc7569f6…9b4e4f` | ✅ YES | Deployed both sides |
| `web/operator.html` | `cfa85264…c4a5a1c` | `cfa85264…c4a5a1c` | ✅ YES | Deployed both sides |
| `serve.py` | `41b24343…a8045` | `41b24343…a8045` | ✅ YES | Already aligned (live serve.py is the richer canonical) |

**killinchu result: 9/9 aligned (GH==HF for every key file).**
- HF commit (7-file QUORUM-sweep sync): `0c39450f417be1c098191fee706027b7b530be3d`
- HF commit (TASK 3 consensus payload): `4cbcc65cbf7bedf98026291093f5eee0c52e30f9`
- GitHub: pushes confirmed OK (consensus blob `9ab8113fc9`).

### anatomy — `SZLHOLDINGS/anatomy` (static Space)

**Finding: there is NO GitHub mirror for anatomy.** `szl-holdings/anatomy` returns HTTP 404 and is absent from all 28 repos in the `szl-holdings` org. The static site files (`index.html`/`app.js`/`data.js`) do not exist as a synced repo anywhere (the `platform/packages/anatomy-contracts` and `ouroboros/docs/anatomy` paths are JSON schemas / PDFs, not the static site). Anatomy is HF-Space-only.

| File | HF sha256 | GitHub | Aligned? | Action |
|------|-----------|--------|----------|--------|
| `index.html` | `ee51227a…666e48a` | (no repo) | N/A — HF canonical | None (no GitHub side to sync) |
| `app.js` | `0719a14b…8a1bd229` | (no repo) | N/A — HF canonical | None |
| `data.js` | `1ff7d8e3…2b3997` | (no repo) | N/A — HF canonical | None |

Anatomy Space is **RUNNING** (subdomain `szlholdings-anatomy`, sdk static). The live-served `data.js` sha (`1ff7d8e3…2b3997`) **exactly matches** the HF resolve copy → the live Space serves the canonical file.

**Anatomy codename honesty:** `data.js` `key:'amaru'` / `key:'sentra'` are **internal object keys**; the user-visible rendered label is `quechua:` → `YACHAY` (cortex) / `CHAPAQ` (egress). In `app.js`, `amaru`/`sentra` appear only as JS variable names and `organByKey('amaru')` lookups; every rendered surface uses `.quechua` (line 206 vessel labels `from.quechua`/`to.quechua`; line 309 `$('p-quechua').textContent = o.quechua`; line 372 tooltip). `index.html` has zero occurrences. **Anatomy is user-visible codename-clean** (matches QUORUM report §103/§109).

---

## TASK 3 — UDS PAYLOAD + MESH

### Where the real UDS decision payload lives

The live UDS aggregator routes — `POST /api/killinchu/uds/v1/mission/execute` and `POST /consensus/verify` — are registered by `szl_khipu_consensus.register()`, mounted **early** in `serve.py` (line ~200) so they win route precedence over the later-loaded `killinchu_fusion.py` (line ~1295). Therefore the canonical UDS decision payload is the `receipt` dict built in `run_consensus()` inside `szl_khipu_consensus.py` — that is where `theorem_ref` + `lake_receipt` had to be wired (not fusion).

### Changes to `szl_khipu_consensus.py` (deployed both sides)

1. **Theorem provenance constants** — `LOCKED_KERNEL_SHA="c7c0ba17"`, `EXPERIMENTAL_KERNEL_SHA="044eb098"`, `LOCKED_FIVE=["F1","F11","F12","F18","F19"]`, `_CONSENSUS_THEOREM_REF` (consensus → Khipu Conjecture 2, maturity `conjecture`, OPEN), `_consensus_lake_receipt()`.
2. **`theorem_ref` + `lake_receipt`** injected into the consensus `receipt` (`run_consensus`) and into the `consensus/verify` response (`verify_consensus_receipt`).
3. Compile + honesty asserts pass: `locked_proven_count == 5`, formulas exactly `{F1,F11,F12,F18,F19}`, consensus `maturity == "conjecture"`, `axioms_clean == False` for the conjecture tier.

### Live verification (HTTP)

```
GET  /api/killinchu/uds/v1/healthz          → 200  (4/4 quorum, theorem_ref + lake_receipt)
GET  /api/killinchu/uds/v1/theorem/registry → 200  (full registry: consensus/lambda_gate/kl/pinsker/threshold_policy)
POST /api/killinchu/uds/v1/mission/execute  → 412  (HONEST: 0-of-4, no fabricated consensus) + theorem_ref + lake_receipt present
POST /api/killinchu/uds/v1/consensus/verify → 412  (HONEST: verified=false) + theorem_ref + lake_receipt present
GET  /api/killinchu/v1/mesh/state           → 200  (honest roles, 0 codename leaks)
```

The **412** on `mission/execute` / `consensus/verify` is the honest, correct behavior: the Byzantine fan-out requires real per-organ cosign signatures, and with none collected it returns `decision:"rejected"`, `khipu_consensus:"0-of-4"` rather than fabricating a passing consensus. The theorem provenance is attached to the payload regardless of decision outcome.

### healthz quorum (live)
```
quorum: total 4, needed 3, healthy 4, quorum_possible true, fault_tolerant true, tolerates_faults 1
healthy_roles: ["Policy","Reasoning","Orchestrator","Field Node"]   →  CONSENSUS HOLDS 4/4
```

### theorem_ref (consensus decision class, live)
```json
{"decision_class":"consensus","theorem":"Khipu Conjecture 2 (Byzantine quorum safety)",
 "lean":"Lutar/KhipuConsensus.lean::khipu_consensus_safety","maturity":"conjecture",
 "kernel_sha":"044eb098","honest_note":"Byzantine BFT safety is OPEN (Conjecture 2) — stated, not a theorem."}
```

### lake_receipt (live)
```json
{"locked_kernel_sha":"c7c0ba17","experimental_kernel_sha":"044eb098",
 "locked_proven_formulas":["F1","F11","F12","F18","F19"],"locked_proven_count":5,
 "print_axioms_assertion":"#print axioms over the locked-5 … reports NO sorryAx / NO extra axioms (axiom-clean). … Λ = Conjecture 1 (machine-checked FALSE). Byzantine BFT = Conjecture 2 (OPEN).",
 "cited":[{"decision_class":"consensus","maturity":"conjecture","axioms_clean":false},
          {"decision_class":"lambda_gate","theorem":"CUT-2","maturity":"conditional","axioms_clean":false},
          {"decision_class":"threshold_policy","theorem":"F12 — locked","maturity":"locked","axioms_clean":true}]}
```

### Mesh — honest roles, codename-clean
`GET /api/killinchu/v1/mesh/state` → `mesh_organs: ["Orchestrator (a11oy)","Reasoning","Policy","Field Node (killinchu)","Operator"]`, doctrine v11, experimental scope honestly "NOT folded into the locked count of 5; Λ stays Conjecture 1". **Zero** amaru/sentra/rosie/jarvis leaks.

Live UDS-facing page sweep: `static/uds.html` 0 codename leaks · `web/v4_fleet_panel.html` 0 · `live_wires_3d.js` 8 raw occurrences, ALL internal (SISTERS routing keys, `SISTER_LABELS` map, code comments); the rendered node label uses `SISTER_LABELS[s]` (amaru→YACHAY etc.) and the wire factor renders `\mathrm{YACHAY}` — **user-visible rendering is clean** (matches QUORUM report §70-71 ruling).

---

## HONESTY / DOCTRINE COMPLIANCE

| Doctrine rule | Status |
|---------------|--------|
| locked-proven = EXACTLY 5 {F1,F11,F12,F18,F19} @ c7c0ba17 — never inflated | ✅ `locked_proven_count:5`, exact set, in payload + assertion |
| Λ (Lambda) = Conjecture 1 unconditionally (machine-checked FALSE) | ✅ healthz `lambda_status:"Conjecture 1 (NOT a theorem)"`; lake_receipt note |
| CUT-1/CUT-2 conditional | ✅ registry `lambda_gate` maturity `conditional`; CUT-2 the conditional repair |
| Byzantine BFT = Conjecture 2 OPEN | ✅ consensus theorem_ref maturity `conjecture`, honest_note "OPEN — stated, not a theorem" |
| Only locked-5 asserted axiom-clean; CF-22/CF-23/CUT-2 experimental, NOT folded | ✅ `axioms_clean:true` only for locked F12; conjecture/conditional → `false` |
| SLSA hybrid-honest + doctrine 749/14/163 untouched | ✅ healthz `slsa:"L1 (honest)"`, doctrine_numbers 749/14/163 |
| No fabricated data; SIMULATED labeled; no fake consensus | ✅ mission/execute returns honest 412 / 0-of-4 instead of faking a pass |
| NO user-visible amaru/sentra/rosie/jarvis | ✅ rendered surfaces clean; residuals are internal keys/keyids/comments only |
| 0 runtime CDN | ✅ (a11oy staged files pre-checked) |
| No GPL/AGPL adoption (uds-core pattern-only) | ✅ (no new GPL/AGPL deps) |
| Defense Unicorns non-affiliation NOTICE intact | ✅ live healthz `notice:"Killinchu / UDS Edition — independent SZL Holdings work referencing Defense Unicorns' Unicorn Delivery Service (USPTO Serial 99831126). SZL Holdings is not affiliated with Defense Unicorns. … See: https://defenseunicorns.com/uds"` |

**Residual codenames left in place (internal, NOT user-visible — per QUORUM_RENAME_REPORT §4 & §70-71):**
`szl_khipu_consensus.py` ORGAN_PUBKEYS / `-cosign` keyids + per-organ verdict-reason diagnostics (cryptographic routing); `live_wires_3d.js` SISTERS routing keys + SISTER_LABELS map (renders honest labels); anatomy `data.js`/`app.js` object keys (render `.quechua`); elite-console scrubText safety net. None render a banned codename to a user.

---

## DELIVERABLE CHECKLIST

1. ✅ Staged a11oy files deployed (HF `5538c40f…` + GitHub); a11oy Code still live (screenshot `_align/evidence/a11oy_code_ide_mode_live.png`).
2. ✅ Full alignment table — a11oy 5/5, killinchu 9/9 aligned; anatomy = HF-only canonical (no GitHub mirror) & live codename-clean.
3. ✅ UDS `theorem_ref` + `lake_receipt` wired into the real decision payload (`szl_khipu_consensus.py`), deployed (HF `4cbcc65c…` + GitHub `9ab8113f`), live-verified; mesh honest 4-role + Operator, codename-clean.
4. ✅ This report.

### Evidence files
- `_align/evidence/killinchu_uds_healthz_live.png` — live UDS healthz (4/4, theorem_ref, lake_receipt, Defense Unicorns NOTICE)
- `_align/evidence/killinchu_mesh_state_live.png` — live mesh honest roles
- `_align/evidence/a11oy_code_ide_mode_live.png` — a11oy Code IDE `mode:"live"`
- `_align/kc_gh_sha.txt` / `_align/kc_hf_sha.txt` — killinchu alignment hashes (9/9 match)
- `_align/a11oy_gh_sha.txt` / `_align/a11oy_hf_sha.txt` — a11oy alignment hashes (5/5 match)
- `_align/anatomy_hf/{index.html,app.js,data.js}` — anatomy HF canonical copies

### Source URLs (live)
- a11oy Space: https://szlholdings-a11oy.hf.space  · GitHub: https://github.com/szl-holdings/a11oy
- killinchu Space: https://szlholdings-killinchu.hf.space  · GitHub: https://github.com/szl-holdings/killinchu
- anatomy Space: https://szlholdings-anatomy.static.hf.space  (no GitHub mirror)
- Defense Unicorns NOTICE ref: https://defenseunicorns.com/uds (USPTO Serial 99831126)
