# UI_INTERACTION_TESTS — a11oy click-through

**Audit date:** 2026-06-01 · **Author:** Yachay · **Agent:** Perplexity Computer Agent
**Method:** Headless page-render screenshots (`screenshot_page`) + direct exercise of the underlying button endpoints (curl/TestClient), since the buttons' network calls are the meaningful unit under test.

> ⚠️ Captured during an active concurrent RESET deployment (see FINAL_REPORT "Concurrent Collision"). UI renders were taken at commit `eca56619`/`df035d2c`; the governed-API buttons regressed to 503 after the concurrent RESET overwrote `serve.py`.

---

## Landing page (`/`) — screenshot `01_landing_root.png`
| Element | Action | Expected | Observed |
|---|---|---|---|
| Top nav: Architecture / Applications / Resources / Platform / Now Board | client-side route change | renders section, no full reload | **PASS** — wouter routing, 200 |
| "Request access" button | CTA | opens access flow | renders (CTA present) |
| "What decision needs governing?" + **Execute** | submits a decision to the gate | gate evaluation result | wired to `/api/a11oy/v1/policy/evaluate` |
| Hero, painterly avatars, animated emojis | — | **NOT modified** (per HARD RULE) | preserved |

## "Try it live" panel (landing / `/substrate`)
| Button | Endpoint | Pre-fix | After my fix (`8af6e2b6`) | After concurrent RESET |
|---|---|---|---|---|
| **Evaluate policy** | `POST /v1/policy/evaluate` | 503 ❌ | **200 allow λ=1.0, real DSSE receipt** ✅ | 503 ❌ (RESET reverted) |
| **View ledger** | `GET /v1/ledger` | 503 ❌ | **200, 4 hash-chained receipts** ✅ | 503 ❌ (RESET reverted) |
| **Verify chain** | `POST /v1/verify` | 503 ❌ | **200 valid:true** ✅ | 503 ❌ (RESET reverted) |

## Evidence Ledger (`/evidence`) — screenshot `02_evidence_ledger.png`
| Element | Action | Observed |
|---|---|---|
| Status pills (22/22 PASS, 749 declarations, 14 unique axioms, 163 tracked sorries, Λ uniqueness = Conjecture 1, SLSA L1) | render | **PASS** — LOCKED numbers correct |
| GitHub source links (`szl-holdings/ouroboros/LUTAR_EVIDENCE.md`, test file) | click → GitHub | **resolve 200** (verified) |
| Per-claim table (PROVEN/AXIOM/CONJECTURE rows w/ Lean `file:line`) | render | **PASS** — A2=IsHomogeneous, A4=IsBounded present |
| Honest "Discrepancy — Aggregator definition not yet unified" callout | render | **PASS** — honest disclosure, neither side hidden |

## Ouroboros Run-All (`/run-all`) — screenshot `03_run_all_ouroboros.png`
| Element | Action | Observed |
|---|---|---|
| **"▶ Run all 32 module self-tests"** button | `POST /api/a11oy/internal/run-all` | **PASS (pre-collision)** — exit_code 0, **32 green / 0 red**, real subprocess |
| **"List modules"** button | `GET /api/a11oy/internal/run-all?list=1` | **PASS** — returns 32 real module filenames |
| GREEN/RED/modules/duration counters | populate from JSON | wired to real runner JSON |
| "What is honest right now" disclosure box | render | **PASS** — honest scope statement |
| ORCID `0009-0001-0110-4173` link | click | resolves |

## a11oy.code console (`/a11oy-code`)
| Element | Endpoint | Observed |
|---|---|---|
| Chat / router input | `/api/a11oy/code/*` (concurrent orchestrator) | **503** — concurrent orchestrator import failing in RESET build (their in-flight work) |

## `/console/` (legacy)
| Observed |
|---|
| Renders SPA **"404 Page not found"** (screenshot `00_console_404.png`) — stale path, app lives at `/`. Cosmetic dead link. |

---

## Summary
- **SPA navigation & rendering: PASS** — landing + 149 routes render, nav works, hero/avatars preserved.
- **Governance/proof consoles (evidence, run-all): PASS** — real artifacts, real subprocess execution, working external links.
- **"Try it live" gate buttons: PASS after my fix, then REGRESSED by concurrent RESET** to 503.
- **a11oy.code console: 503** — concurrent workstream's orchestrator not yet healthy (their in-flight migration).
- **`/console/` 404 + 6 fabricated-data demo pages (MOCK_HUNT F-1): flagged**, not yet fixed (rebuild blocked + collision).
