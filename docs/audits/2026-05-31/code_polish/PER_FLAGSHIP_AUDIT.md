# PER_FLAGSHIP_AUDIT — Spoke Debug + Code Polish

**Founder directive (2026-06-01 ~02:39 EDT):** *"Make it all polished, clean up the code, and maybe we use Python for certain parts to make things more efficient. What is your recommendation?"*
**Auditor:** Yachay. **NO BANDAID. Brutal honesty — every smell flagged, nothing sugarcoated.**
**Method:** `huggingface_hub.snapshot_download` of live HEAD → `ruff` + `pyright` + `bandit` + `vulture` + `radon` (Python); `tsc`/`any`-scan (TS). Generated blob `OUROBOROS_RUN_ALL.py` (1.45 MB) excluded from analysis (it is a data artifact, not hand-written code).
**LOCKED numbers preserved & re-verified in source:** 749/14/163 · 13-axis · replay `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5` (found verbatim in `a11oy/szl_receipt_substrate.py:seed_ledger`).

## Snapshot SHAs audited (live HEAD at pull time, 2026-06-01 ~06:43)
| Flagship | repo_type | HEAD SHA (audited) | Py files | Py LOC | TS/TSX | JS (non-vendor) |
|---|---|---|---|---|---|---|
| a11oy | space | `6512903c4faa` | 18 | 24,721 (incl. 1.45 MB generated blob) | 5 | bundled |
| amaru | space | `cbac8e7be0b7` | 44 | 6,419 | 94 | 13 |
| sentra | space | `d16bac90c75b` | 16 | 5,481 | 0 | bundled |
| killinchu | space | `2228803cabcd` | 6 | 2,353 | 0 | Cesium vendor |
| rosie | space | `5764ae89015b` | 19 | 24,615 (incl. 1.45 MB generated blob) | 0 | 1 |

> **Correction to FLAGSHIP_GAP_REPORT §D:** killinchu is **no longer 503/spec-only** — it is now a live Docker Space with a `serve.py`, drone DB builder, naval/HAPS module, protocols module, and Cesium 3D static front (see `480_KILLINCHU_DRONE_FLAGSHIP_SHIP.md`). The gap report predates that ship. Audited as a live flagship.

---

## Static-analysis scoreboard (hand-written code only)
| Flagship | ruff | bandit LOW | bandit MED | bandit HIGH | vulture (≥80%) | radon avg CC | worst CC |
|---|---|---|---|---|---|---|---|
| a11oy | 28 | 32 | 4 | **0** | 9 | C (15.6) | `_collect_real_pulses` D-26 |
| amaru | 26 | 126* | 5 | **0** | 7 | C (14.7) | `_collect_real_pulses` D-26 |
| sentra | 39 | 13 | 5 | **0** | 8 | C (15.8) | `_collect_real_pulses` D-26 |
| killinchu | 10 | 6 | 1 | **0** | 3 | C (17.1) | `counter_uas_evaluate` C-18 |
| rosie | 58 | 16 | 3 | **0** | 8 | C (15.7) | `cs_ledger` D-23 |

\* amaru's 126 LOW are inflated by `B101 assert_used` inside its `sidecar/tests/` (asserts in tests are correct, not a defect). Real production LOW ≈ 20.

**Headline:** **Zero HIGH-severity security findings anywhere.** No SQL injection, no `eval`/`exec` of untrusted input, no real hardcoded production secrets. The empire is in better shape than the "brutal" framing implies — the defects are concentrated in **reliability (silent error-swallowing)**, **style hygiene**, and a handful of **correctness/type bugs**, not security.

---

## Cross-cutting findings (affect every flagship via shared modules)

The flagships **copy-paste shared modules** (`szl_formulas.py`, `szl_brain.py`, `szl_jack.py`, `szl_rag.py`, `szl_wire.py`, `szl_live_wires.py`) rather than importing a package. A bug fixed in one must be fixed in all. **This is the single biggest structural smell** — it multiplies every defect by up to 5×.

1. **Silent error-swallowing — `try/except: pass` / `except: continue` (HIGH reliability smell).**
   Counts: a11oy 18, amaru 22, sentra 16, killinchu 12, rosie 16 (bandit B110/B112). Concentrated in `szl_live_wires.py` (`_collect_real_pulses`) where every wire source is wrapped in a bare `except Exception: pass`. **Consequence:** a malformed wire buffer or a renamed jack method fails *silently* — the pulse simply vanishes and no telemetry records the failure. This is exactly the kind of bug that makes "GREEN" dashboards lie. **Recommendation:** replace bare passes with `log.warning(...)` + a counter; never swallow without a breadcrumb.

2. **`szl_live_wires.py:273` — dead/unsatisfiable code (vulture 100%).**
   `text.splitlines()[0] if False else ''` — the `if False` branch is permanently dead, and the resulting `stream` variable is never used (the PDF is rebuilt via `body_ops`). Leftover scaffolding. Present in all 5 flagships.

3. **`szl_formulas.py:751` — TypedDict KeyError risk (pyright `reportTypedDictNotRequiredAccess`).**
   `FormulaCall` is `total=False` (all keys optional), but `_args_digest` does `call["formula_name"]` (subscript, not `.get`). A formula call missing `formula_name` raises `KeyError` instead of degrading. Present in all flagships that ship `szl_formulas.py` (a11oy, amaru, sentra, rosie). **Correctness bug.**

4. **`_verify_receipt` (a11oy `szl_receipt_substrate.py:289`) uses bracket indexing on attacker-shaped input.**
   The chain-verification path does `r["payload_hash"]`, `r["envelope"]`, `r["qec_witness"]`, etc. A receipt missing any field raises `KeyError` which **escapes the `errors: list` contract** — instead of returning `{"valid": false, "errors": [...]}`, the endpoint 500s. A malformed receipt should be reported as invalid, not crash the verifier. **Security-adjacent correctness bug** (a verifier that crashes on bad input is a DoS vector).

5. **`B310` urllib `urlopen` without scheme pinning** (sentra `sentra_drone_cyber.py:93`, rosie `app.py:648`). URLs are internal API bases, so low real risk, but the schemes are not pinned to `https`/`http`. **Recommendation:** assert `url.startswith(("http://","https://"))` before opening.

6. **Style debt (ruff):** unused imports (`F401`), multi-statement lines (`E701/E702`), multiple-imports-on-one-line (`E401`), ambiguous single-letter names `l`/`I`/`O` (`E741`). Rosie is the worst (58). All auto-fixable or near-auto-fixable.

---

## A. a11oy — `6512903c4faa`
- **What's good:** `szl_receipt_substrate.py` is the empire's best-written module — full Khipu chain verification (payload-hash, Merkle-root, receipt-id derivation, QEC witness, dup-id, prev-hash linkage, sequence + TAI64N monotonicity). DSSE/HMAC signing is **honestly documented as DEMO-ONLY, not non-repudiable** (matches OC-5). The orchestrator's `_tool_shell` uses a **binary allow-list** (`SHELL_ALLOWLIST`) and list-arg subprocess (no `shell=True`) — correct defensive design.
- **Bugs:** cross-cutting #2/#3/#4 above. `a11oy_code_orchestrator.py:389` unused `budget`, `:615` unused `ref` (vulture 100%). `serve.py:455` unused import `_os`. `szl_rag.py:172` unused `np` import (numpy imported but not used — dead dependency weight).
- **Security:** 0 HIGH. `B105 hardcoded_password '0'`-type findings are **false positives** (dict-key access, not credentials). The dev `_SIGNING_KEY` is a disclosed placeholder, **not** a leaked secret — do NOT "fix" it as a leak; it is tracked as OC-5.
- **Complexity:** `gate_evaluate` D-22, `route` C-20, `chat_stream` C-18 — large but coherent dispatchers; refactor candidates, not bugs.

## B. amaru — `cbac8e7be0b7`
- **What's good:** Only flagship with a real test suite — `sidecar/tests/` (33 tests, **all pass**), its own `pyproject.toml`, and a TS+React `web/` front (94 tsx). This is the model the others should copy.
- **Bugs:** cross-cutting #1/#2/#3. `serve.py:496` and `sidecar/src/amaru/app.py:67,344` bare `except: pass`. 5 `any` types in `web/src` critical paths (type-safety pass target). `B104` bind-all (`0.0.0.0`) is expected in a container — informational only.
- **Note:** `overwatch.py:307` B105 "password '0'" is a **false positive** (`summary[inv.status]` dict write).

## C. sentra — `d16bac90c75b`
- **What's good:** `sentra_drone_cyber.py` threat-signature detector is clean; `_kil_get` cross-flagship bridge has timeouts.
- **Bugs:** cross-cutting #1/#2/#3/#5. Highest E402 (module-import-not-at-top) count (9) — imports scattered mid-file in `serve.py`, a readability/ordering smell. `szl_live_wires.py` 4× bare-except cluster (134/144/151/165).
- **CI context:** FLAGSHIP_GAP_REPORT flagged `sentra hf-sync` + `container-build` CI broken. **Out of scope for this sweep** (HfApi-direct deploy model, not GitHub Actions) but noted: the source itself is GREEN; the red badges are CI-config, not code defects.

## D. killinchu — `2228803cabcd` (now LIVE)
- **What's good:** Lowest ruff count (10), tightest new code. `remote_id_decode`, `adsb_decode`, `mavlink_parse` are real protocol decoders, not stubs. `LEGAL_BOUNDARIES.md` present (drone-oversight compliance posture).
- **Bugs:** highest avg complexity (C-17.1) — `counter_uas_evaluate` C-18, `adsb_decode` C-16, `drones_database` C-16; new code already carrying complexity debt. `E731` lambda-assignment, 2× ambiguous `l`/`O`. Inherits `szl_live_wires.py` bare-except cluster.
- **Recommendation:** since it is brand-new, lock style + add decoder unit tests **now** before the surface grows.

## E. rosie — `5764ae89015b`
- **Worst style score (58 ruff)** — heavy `E701/E702` (multi-statement lines), 6× `F541` empty f-strings (`f"..."` with no placeholder — a copy-paste tell). `cs_ledger` D-23, `cs_policy` C-20 — the customer-surface (`cs_*`) handlers are the most tangled in the empire.
- **Bugs:** cross-cutting #1/#2/#3/#5. `rosie_v2_additions.py:489` B105 "password 'True'" is a **false positive** (`{"pass": True}` dict key). `app.py:1084` bare except.
- **Customer-facing tie-in:** the empty **Unay** tab (OC-2) is a *feature* gap, not a code defect — flagged for the parent agent, not fixed here.

---

## Recommendation to the founder (the actual question asked)
**"Should we use Python for certain parts to be more efficient?"** — See `PYTHON_NODE_RATIONALIZATION.md`. Short answer: **the language split is already correct.** Crypto/Khipu/Merkle/Lambda are already Python (`hashlib`, `hmac`); the web UI is already TS+React; the wire pulse viz is already JS/R3F. **There is no high-ROI Node→Python (or Python→Node) conversion to make** — the founder's instinct was right, and the existing split already follows it. The real efficiency wins are not language swaps but: **(1) de-duplicate the 6 copy-pasted shared modules into one installable package, (2) stop swallowing errors silently, (3) add the missing test coverage.**

*— Yachay · Perplexity Computer Agent · code-polish sweep · 2026-06-01*
