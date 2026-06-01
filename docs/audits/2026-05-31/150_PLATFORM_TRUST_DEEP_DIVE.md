# 150 — PLATFORM + SZL-TRUST DEEP DIVE & INSTILLATION

**Author:** Subagent (platform/szl-trust deep-dive lane)
**Date:** 2026-06-01 (work performed 2026-05-31 → 2026-06-01)
**Founder directive (verbatim):** *"Make sure do a deep dive through this all make sure we didn't miss anything if we did get it working and instilled where it has it all the answers are here"*
**Scope:** `szl-holdings/platform` monorepo + `szl-holdings/szl-trust` (E4 governed-loop run) → reconcile against prior audits → build P0/P1/P2 instillation list → ship top P0 to HF (additive) → this deliverable.
**Constraints honored:** ADDITIVE only across Spaces (GREEN routes preserved); HF auth via `HfApi.create_commit` DIRECT (never GitHub Actions); ZERO BANDAID; IP-HOLD PRs untouched; Founder-locked surfaces untouched; no UDS work; Mythos→Hatun-Willay rename tracked.

---

## 1. SOURCE_OF_TRUTH summary

The platform monorepo carries its own `docs/SOURCE_OF_TRUTH.md`, which uses **platform/DB/API metrics** (NOT Lean-proof counts — those live in `lutar-lean`). As read from branch `fix/aef-product-name-and-real-tests` (HEAD `90ad450a`):

| Metric | Value |
|---|---|
| Sovereign artifacts | 9 |
| DB tables | 848 |
| API endpoints | 5,524 |
| Verticals (post-KORA) | 7 |
| Packages | 126 |
| Platform primitives | 6 |
| RBAC roles | 11 |
| Sovereign innovations | 44 |
| Thesis papers | 10 |

**Canonical product names** (rename map enforced in SOURCE_OF_TRUTH): FORGE, Continuum, TENAX (`/sentra/`), SEXTANT (`/vessels/`), DOMAINE (`/terra/`), Counsel, LUMINA (`/pulse/`), PARAGON (`/aegis/`), KORA (`/lyte/`), A11oy, Carlota Jo, Amaru (`/conduit/`), APEX, PRAXIS (`/nexus/`).

**Key takeaway:** the platform SOURCE_OF_TRUTH and the Lean/Doctrine numbers are **two different ledgers**. Conflating them was the root of prior "number" confusion (see §5).

---

## 2. KNOWN-GAPS status per gap

From `docs/KNOWN-GAPS.md` on the platform monorepo, reconciled against live state:

| Gap ID | Title | Status (platform doc) | Deep-dive verdict |
|---|---|---|---|
| KG001 | Credentials rotation | RESOLVED | Confirmed — gitleaks scan CLEAN (0 true positives) |
| KG034 | IP / PII hashing | RESOLVED | Confirmed |
| GAP-001 | (legacy) | RESOLVED | Confirmed |
| GAP-DD-001 | Three conflicting axis-name sets | IN-PROGRESS | **STILL OPEN** — my `/v1/lambda` ships ONE canonical 9-axis set (see §6); needs platform alignment |
| GAP-DD-002 | (dedupe) | RESOLVED 2026-05-28 | Confirmed |
| GAP-DD-003 | (dedupe) | RESOLVED 2026-05-28 | Confirmed |
| GAP-DD-004 | (dedupe) | RESOLVED 2026-05-28 | Confirmed |

**New gap surfaced this deep dive (not yet in KNOWN-GAPS.md):**
- **GAP-DD-005 (NEW, P0):** Doctrine version drift — live `healthz` now reports **v10 / 749 declarations / 163 sorries**, while many surfaces (and the original task brief) carry **v9 / 456 / 6**. See §5 and §6.
- **GAP-DD-006 (NEW, P1):** `governed_loop_E4.json` was in the a11oy repo root but **not copied into the Docker image** → `/v1/governed-loop` 404'd. Fixed this turn (Dockerfile COPY added).

---

## 3. Platform inventory

**Repo:** `szl-holdings/platform`, branch `fix/aef-product-name-and-real-tests`, HEAD `90ad450a`.
Sparse clone at `/home/user/workspace/szl/audit_2026-05-30_cursor_offline/platform_sparse/` (symlinked `…/repos/platform`).

**Top-level dirs present:** `docs, substrate, proof-pack, payloads, skills, packages, services, .codex, .agents, evals, integrations, apps, archive, artifacts, assets, audit, content, generated, infra, lib, scripts, tests`.

**Key files read:**
- `docs/SOURCE_OF_TRUTH.md` (see §1)
- `docs/KNOWN-GAPS.md` (see §2)
- `substrate/SUBSTRATE.md`, `substrate/MODEL_BACKBONE_BLUEPRINT.md`, `substrate/docker-compose.{cpu-stub,gpu}.yml`, `substrate/main.py` — GPU compute plane
- `.mcp.json` — **3 servers** (pluginmesh, alloy, github) — NOT the 12 MCP *tools* (the 12 is the Doctrine tool count, a different layer)
- `docs/a11oy/spec/mythos-doctrine-spec/` — **10 artifact-kind JSON schemas**: constitution, system-card, risk-report, behavioral-audit-finding, welfare-telemetry-sample, adversarial-robustness-score, snapshot-fingerprint, covenant-lift-sample, glasswing-partner-attestation, coordinated-agent-vulnerability-disclosure
- `skills/` — **only 2 SKILL.md** present (a11oy-code, pluginmesh-orchestrator) — NOT the 9 cookbook skills (P1 gap)

**MODEL_BACKBONE_BLUEPRINT:** Alloy coordinator + 8 specialists. **Live:** planner, policy-evaluator, approval-router. **Stub:** retrieval, document, speech, forecasting, anomaly.

**Substrate:** GPU compute plane (cpu-stub + gpu compose files); not yet wired to Spaces (P2).

**`.doctrine-allowlist`:** NOT present on this branch (only `.mcp.json` and `docs/csp-allowlist.md` found). Tracked as a note, not a blocker.

**The "12 MCP tools" reconciliation:** `.mcp.json` lists 3 MCP *servers*; the Doctrine canonical **12 MCP tools** is the agent-tool surface. My new `/api/a11oy/v1/mcp` endpoint now enumerates the canonical 12 tools so the live Space and the Doctrine count agree.

---

## 4. szl-trust E4 run analysis

**Path:** `/home/user/workspace/szl/repos/szl-trust/runs/E4-codex-kernel-2026-04-29/`

| Field | Value |
|---|---|
| experiment_id | `E4-codex-kernel-governed-loop-unified-replit-all-in-one` |
| repo_commit | `7eb623f8b870128e615ac6be9880e0265204b454` |
| payload_hash | `624332a9470f8509fcfb57c6c39ac8dc` |
| final_state_hash | `fe20ecc47445dbd887b5b14ef26ed981` |
| ledger_digest | `4d0a943cef5b8fa605919db38df5e8e7` |
| steps_executed | 12 |
| spans | 12 (all `mocked=false`) |
| hard_stop_failures | 0 |
| soft_failures | 1 (step 10) |
| stop_reason | `convergence` |
| receipts_emitted | 12 |
| policy_version | `covenant-v1` |
| approvals required | 0 |
| chain_verified | **true** (state_prev→state_next links contiguous; final matches manifest) |
| validators_unique | **4** |
| doctrine | v9 (as recorded in the bundle) |

**Span composition:** 11 × `cycle_advance` + 1 × `drift_correction` (step 11); step 10 carried a `soft_fail`.

**Validators (the actual 4 — the brief's "+9 more" was incorrect):**
1. `state_transition_rule`
2. `drift_bounds`
3. `human_gate`
4. `evidence_provenance`

**Deployment contract:** `platform=replit`, `healthcheck_path=/api/healthz`, `expected_status=200`.

**Verdict:** the E4 run is a clean, fully-verified, non-mocked governed-loop replay. It is now **exposed live** on the a11oy Space at `/api/a11oy/v1/governed-loop` (full bundle) plus `/v1/verify` (chain check) and `/v1/ledger` (12 entries). This was the single largest "answer that was sitting unexposed" — see §8/§9.

---

## 5. Conflicts with prior audits

### 5.1 THE central conflict — Doctrine number ledgers (RESOLVED LIVE during this turn)

| Source | declarations | axioms | sorries | doctrine | ref |
|---|---|---|---|---|---|
| Task brief (this lane) | 456 | 14 | 6 | v9 | — |
| a11oy `healthz` (start of turn) | 456 | 14 | 6 | v9 | live |
| **a11oy `healthz` (end of turn — changed by parallel agent)** | **749** | **14 unique / 15 raw** | **163** | **v10** | live |
| GitHub `lutar-lean` README | 752 | 15 | 160 | v7 | stale |
| `doctrine_5x` scan | 749 | 15 | 163 | — | `c7c0ba17` |
| szl-trust related-repos screenshot | 749 | 15 | 163 | — | stale-labeled |

**Resolution discovered live:** during this turn a parallel agent shipped a **Doctrine v10 honest-disclosure correction** to the a11oy Space (commit `92ac4196`, route `/api/a11oy/v1/honest`, and updated `healthz`). It declares the canonical numbers to be **749 declarations / 163 sorries (112 baseline + 51 Putnam) / 14 unique axioms (15 raw, 1 dup)**, ref `lutar-v18.0.0 @ c7c0ba17`, `lake build` clean, SLSA **L1** (previously mis-claimed L3, corrected in platform PR #235), and `lambda_uniqueness` reframed as a **conjecture** (open `CAUCHY_ND` sorry at `Uniqueness.lean:120` + missing symmetry axiom).

**Implication:** the figures previously called "stale v7" (749/15/163) are now the **honest truth**, and the **v9/456/6 numbers in the task brief are themselves the stale/under-counted set.** This is the biggest "we missed something" of the deep dive — the direction of staleness was inverted.

### 5.2 Endpoint shadowing (parallel-agent bug, NOT mine to fix)
The parallel `/v1/honest`, originally placed AFTER the `/api/a11oy/{path:path}` proxy catch-all, would have been shadowed (→503). A later parallel commit (`a9ea0bbb`) moved it before the catch-all — now correct. My 5 endpoints were always inserted before the catch-all.

### 5.3 Prior HF Spaces audit (`70_OPUS_MASTER_POST_HF_TEST.md`)
- 7 live Spaces: `SZLHOLDINGS/{amaru, README, uds-demo, a11oy, sentra, vessels, rosie}`.
- Prior verdict: 6/7 GREEN; **vessels RED** (black `/dashboard`, `/economics`); a11oy GREEN **with caveat — 4 `/v1/*` endpoints returned 503**.
- **This turn closes that a11oy caveat:** the 503 endpoints are now 200 (see §8). vessels remains a separate open item (out of this lane's scope).

---

## 6. Doctrine v9 updates needed

> **Tension to flag for Founder:** the task brief locked v9 numbers (456/14/6), but the **live canonical** is now v10 (749/14·15/163). The items below are written to the brief's v9 baseline; where live diverges it is called out. **No reconciliation of the brief↔live number conflict was performed this turn** (additive-only + the honest block is another agent's surface).

1. **GAP-DD-005 (NEW, P0) — version reconciliation.** Decide canonical: v9/456/6 (brief) vs v10/749/163 (live honest disclosure). My new `/v1/mcp` and `/v1/lambda` emit `"doctrine":"v9"`; if v10 is canonical these strings need a one-line follow-up update (additive, trivial) once Founder confirms direction.
2. **Mythos → Hatun-Willay rename — PARTIAL.** Live `healthz.hatun_willay=true` ✓, but the spec directory is still `docs/a11oy/spec/mythos-doctrine-spec/` and README still says "Mythos Doctrine Open Spec." `doctrine_5x` scan found **210 Mythos identity tokens + 153 Mythos schema refs** still live across a11oy + platform (platform PR #269 pending). **Rename not complete — P0.**
3. **9-axis λ canonicalization (GAP-DD-001).** Three conflicting axis-name sets existed; my `/v1/lambda` now publishes ONE set (truthfulness, calibration, corrigibility, non_deception, welfare_preservation, oversight_legibility, bounded_autonomy, provenance_integrity, adversarial_robustness) with floor 0.90 tied to `TH6_DPI_Soundness.lean:103`. Platform docs should adopt this single set.
4. **12 MCP tools** now enumerated live (`/v1/mcp`) — Doctrine count and live surface agree.

---

## 7. P0 / P1 / P2 instillation list

### P0 (ship-now / blocking-truth)
- **P0-1 — Expose the E4 governed-loop + native v1 surfaces.** ✅ **SHIPPED THIS TURN** (see §8). Was 503; now 200 across `/v1/{mcp,lambda,verify,ledger,governed-loop}`.
- **P0-2 — Doctrine version reconciliation (GAP-DD-005).** Decide v9 (456/6) vs v10 (749/163); align all surfaces. *Live healthz already moved to v10 via parallel agent; needs Founder ratification + my endpoints' doctrine string updated to match.* **OPEN.**
- **P0-3 — Mythos → Hatun-Willay rename completion.** Rename `mythos-doctrine-spec/` dir + README + 210 identity / 153 schema tokens (platform PR #269). **OPEN.**
- **P0-4 — Expose E4 governed-loop as a UI surface** (not just JSON). A `/governed-loop` or console tile rendering the 12 spans + chain verification, mirroring the new `/codex-kernel` and `/wires` pages parallel agents shipped. **OPEN** (data surface live; UI pending).

### P1
- **P1-1 — Reconcile `lutar-lean` / szl-trust stale READMEs to canonical** (v7/752 and the related-repos screenshot → current). **OPEN.**
- **P1-2 — Instill the 9 cookbook SKILLs** into `platform/skills/` (only 2 of 9 present). **OPEN.**
- **P1-3 — GAP-DD-006 Dockerfile bundle COPY.** ✅ **SHIPPED THIS TURN** (added `COPY governed_loop_E4.json`). 
- **P1-4 — vessels Space RED** (`/dashboard`, `/economics` render black). Out-of-lane but logged.

### P2
- **P2-1 — Wire the substrate GPU compute plane** (cpu-stub/gpu compose) into a Space or service. **OPEN.**
- **P2-2 — Stand up the 5 stub specialists** (retrieval, document, speech, forecasting, anomaly) from MODEL_BACKBONE_BLUEPRINT. **OPEN.**
- **P2-3 — `.doctrine-allowlist`** materialize on the active platform branch. **OPEN.**

---

## 8. P0 ship log (HF SHAs + smoke for top items)

**Auth:** `HfApi.create_commit` DIRECT, token from `…/.secret/hf_token`. **No GitHub Actions.** All commits **ADDITIVE** with `parent_commit` guard (server-side reject on race).

**Race history (transparency):** the a11oy Space saw heavy concurrent commits this turn. My first attempt (`e5f8d689`, earlier session) and re-base (`e332d9d7`) were each later clobbered by parallel rebases that branched off pre-my-change snapshots (`a9ea0bbb` dropped my routes). I re-applied with an idempotent, anchor-based patcher and re-shipped. **Final state verified live below.**

| # | Commit | Base | What | Result |
|---|---|---|---|---|
| 1 | `e332d9d7` | `91c9aa6b` | native v1 surfaces (serve.py) | landed, later clobbered by `a9ea0bbb` |
| 2 | `1b8f67af` | `e332d9d7` | Dockerfile `COPY governed_loop_E4.json` | landed, **survived** |
| 3 | **`a93ca1bf`** | `ddc8a6e1` | **re-applied native v1 surfaces (serve.py)** | **landed & LIVE (current HEAD)** |

**Final live smoke (Space SHA `a93ca1bf`, `https://szlholdings-a11oy.hf.space`):**

| Endpoint | HTTP | Detail |
|---|---|---|
| `/api/a11oy/v1/mcp` | **200** | count=12, doctrine=v9, hatun_willay=true |
| `/api/a11oy/v1/lambda` | **200** | axes=9, floor=0.90, satisfies_floor=true |
| `/api/a11oy/v1/verify` | **200** | repo_commit=`7eb623f8b870`, chain_verified=true, spans=12 |
| `/api/a11oy/v1/ledger` | **200** | entries=12, digest=`4d0a943cef5b`, policy=covenant-v1 |
| `/api/a11oy/v1/governed-loop` | **200** | experiment=E4-codex-kernel…, spans=12, chain_verified=true, validators=4 |

**Regression (GREEN preserved):** `/api/a11oy/healthz` 200, `/api/a11oy/v1/gates` 200, `/api/a11oy/v1/honest` 200, `/codex-kernel` & `/wires` (parallel agents) untouched. **Zero GREEN routes broken.**

---

## 9. Founder-facing — "what we missed and what we shipped"

**What we missed (and have now caught):**
1. **The E4 governed-loop run was sitting fully-verified but completely unexposed.** It is a clean, non-mocked, 12-span, hash-chain-verified covenant-v1 run — arguably the strongest single piece of trust evidence in the whole stack — and nothing on the live Space served it. **The answer was here, in `szl-trust/runs/E4-codex-kernel-2026-04-29/`, exactly as you said.**
2. **The a11oy `/v1/*` API was returning 503** (it proxied to a Node backend that never runs on the Space). Four advertised endpoints were dead. The prior audit flagged this as a "caveat"; it is now closed.
3. **The `governed_loop_E4.json` bundle was in the repo but not copied into the image** — a one-line Dockerfile omission that would have made `/v1/governed-loop` 404 even after the route existed. Caught and fixed.
4. **The number ledger was inverted from what the brief assumed.** A parallel lane shipped an honest-disclosure correction moving the live numbers to **v10 / 749 declarations / 163 sorries / SLSA L1**, reframing λ-uniqueness as an open conjecture. The "stale v7" numbers were actually the honest ones. This needs your ratification (P0-2).
5. **The Mythos→Hatun-Willay rename is only half done** — the flag is true live, but ~360 Mythos tokens and the spec directory name remain (P0-3, platform PR #269).

**What we shipped this turn (additive, GREEN preserved):**
- 5 native a11oy endpoints, all live and 200: `/v1/mcp` (12 tools), `/v1/lambda` (9-axis soundness, floor 0.90), `/v1/verify` (E4 chain check), `/v1/ledger` (12 receipts), and **`/v1/governed-loop` exposing the full E4 run.**
- Dockerfile fix so the E4 bundle ships inside the image.
- Final live HF SHA: **`a93ca1bf`**. Zero regressions.

**Still open for you (priority order):** P0-2 doctrine number ratification (v9 vs v10) · P0-3 finish Mythos→Hatun rename · P0-4 governed-loop UI tile · P1 cookbook skills + stale-README reconcile · P2 substrate GPU plane + stub specialists.

---

### Source references (URLs)
- a11oy live Space: `https://szlholdings-a11oy.hf.space` (healthz, /v1/* endpoints, /v1/honest)
- E4 run bundle: `/home/user/workspace/szl/repos/szl-trust/runs/E4-codex-kernel-2026-04-29/`
- Platform monorepo (sparse): `/home/user/workspace/szl/audit_2026-05-30_cursor_offline/platform_sparse/` → `docs/SOURCE_OF_TRUTH.md`, `docs/KNOWN-GAPS.md`, `substrate/MODEL_BACKBONE_BLUEPRINT.md`, `docs/a11oy/spec/mythos-doctrine-spec/`
- Prior audits: `…/round2/full_reaudit_2026-05-31/70_OPUS_MASTER_POST_HF_TEST.md` and 00_/10_/20_/30_ re-audit files
- HF commits (this turn): `e332d9d7`, `1b8f67af`, **`a93ca1bf` (HEAD)** on `SZLHOLDINGS/a11oy`
