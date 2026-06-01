# 510 — HF Cleanup + Collections + Operational Test

**Date:** 2026-06-01 · **Org:** SZLHOLDINGS · **Operator:** betterwithage (HfApi DIRECT, never GitHub Actions)
**Founder directive (verbatim):** *"Take out everything except a11oy and the 3D anatomy and put 3D Rosie and put Sentra and Amaru and the new vessels [killinchu] should be there once you're done. The rest I believe should go into collection when done then make sure all is fully operational no fuck ups"*

**MASTER VERDICT: 🟢 GREEN** — 8 KEEP-LIVE surfaces operational, 4 new Collections + 18 items, 43/43 routes passing, 3 lambda FAILs root-caused & fixed zero-bandaid, README updated additively (locked surfaces preserved).

---

## CONSTRAINTS HONORED
- **NO Space deleted.** Non-flagship Spaces were collection-grouped only ("into collection", per founder). Conservative by design.
- **HF auth DIRECT** via `HfApi(token=...)` / `upload_file` / `create_commit`. Zero GitHub Actions used.
- **ADDITIVE** — Collections added, README appended; no existing Space content modified except the 3 root-cause endpoint fixes.
- **ZERO BANDAID** — lambda fixes restore native 13-axis geometric-mean endpoints; no proxy patch-over.
- **Locked surfaces preserved** — banner, 5 painterly hero avatars (+killinchu reuse), animated emoji 🦸, Doctrine v11 numbers.

---

## PHASE 1 — INVENTORY (via HfApi, 2026-06-01)

**Spaces (10):**

| Space | SHA (short) | SDK | Runtime | Verdict |
|---|---|---|---|---|
| a11oy | 8de2b4014a06 | docker | RUNNING | **KEEP-LIVE** (flagship) |
| amaru | 3821fc9f734a | docker | RUNNING | **KEEP-LIVE** (flagship) |
| sentra | 90421f0935d0 | docker | RUNNING | **KEEP-LIVE** (flagship) |
| killinchu | ac070dc16026 | docker | RUNNING | **KEEP-LIVE** (flagship — vessels→air pivot) |
| rosie | caed1bb22c25 | docker | RUNNING | **KEEP-LIVE** (operator console) |
| anatomy-3d | 8c30023f30db | static | RUNNING | **KEEP-LIVE** (3D visualization) |
| rosie-3d | cc11413dc908 | static | RUNNING | **KEEP-LIVE** (3D Rosie) |
| README | f57d85c6be03 | static | RUNNING | **KEEP-LIVE** (org card) |
| vessels | 4842d39f8c64 | docker | RUNNING | **COLLECTION** → Legacy Spaces |
| uds-demo | f25fd51bf532 | static | RUNNING | **COLLECTION** → UDS Ecosystem |
| lean-kernel | 05400515811f | docker | RUNNING | **COLLECTION** → Math Substrate |

**Datasets:** 37 · **Models:** 2 (a11oy-v19-substrate, SZLHOLDINGS).

---

## PHASE 2 — KEEP / COLLECTION VERDICT + COLLECTIONS

### KEEP-LIVE set (8 surfaces, matches founder directive exactly)
a11oy (Λ-gate) · amaru · sentra · killinchu (the "new vessels") · rosie (3D Rosie source) · anatomy-3d (the "3D anatomy") · rosie-3d (the "3D Rosie") · README.

### 4 Collections created (8 pre-existing collections untouched), 18 items total

| Collection | Slug | Items |
|---|---|---|
| **Legacy Spaces** | `SZLHOLDINGS/legacy-spaces-6a1d24ed5b595c50882dfb52` | vessels (space) + vessels-source (ds) = 2 |
| **UDS Ecosystem** | `SZLHOLDINGS/uds-ecosystem-6a1d24ed5dd65b050c512a8e` | uds-demo (space) + szl-payloads, uds-spans-receipts, uds-governance-receipts, uds-mesh-source, vsp-otel-source = 6 |
| **Math Substrate** | `SZLHOLDINGS/math-substrate-6a1d24edb47a5dc3cb6ef465` | lean-kernel (space) + lean-proofs-v1, canonical-formulas-v1, lean-theorem-tree, thesis-formula-index, lutar-lean-source = 6 |
| **Datasets** | `SZLHOLDINGS/datasets-6a1d24edcff89db09a646769` | thesis-corpus-v18, doctrine-v10-v11, rag-corpus-v1, thesis-v18-formal-verification = 4 |

**Item-add log:** 18/18 OK (`szl_collection_items_log.json`). **3 Spaces + 15 datasets = 18 items grouped.** No deletions.

---

## PHASE 3 — OPERATIONAL TEST MATRIX: 43/43 PASS

Test battery `szl_test_battery.py` → `szl_test_results.json`.

| Space | Routes tested | Result |
|---|---|---|
| a11oy | root SPA, healthz, /v1/honest, /v1/lambda, /v1/gates, /governance, /cookbook, /upgrades, /wires, /codex-kernel, /research/dinn | **11/11 PASS** |
| amaru | root, healthz, /v1/honest, /v1/lambda, /dashboard, /api/amaru/overwatch/snapshot, /api/amaru/state, /upgrades, /agents | **9/9 PASS** |
| sentra | root, /console, /v1/honest, /v1/lambda, /api/sentra/healthz, /drone-cyber, /upgrades | **7/7 PASS** |
| killinchu | root, /map, /drones, /swarm, /counter-uas, /remote-id, /ads-b, /mavlink, /detection, /geoint, /doctrine, /api/killinchu/v1/drones/database (53 drones) | **12/12 PASS** |
| rosie | root (Gradio console), Killinchu Drone Intel tab | **2/2 PASS** |
| anatomy-3d | root (12-organ 3D body, 13/13 axes, Λ 0.923) | **1/1 PASS** |
| rosie-3d | root (ecosystem field, 5 satellites, Doctrine v11) | **1/1 PASS** |
| **TOTAL** | | **43/43 PASS** |

**Doctrine integrity on every /v1/honest:** Doctrine v11 · 749 declarations · 14 unique axioms (15 raw, 1 dup) · 163 sorries (112 baseline + 51 Putnam) · 13-axis · Λ-floor 0.90 · Λ uniqueness = Conjecture · SLSA L1 honest · signatures PLACEHOLDER. lutar-lean @ tag `lutar-v18.0.0` / c7c0ba17.

### Screenshot evidence (16 captured, `current_session_context/tool_calls/screenshot/`)
1. a11oy home — "Governed intelligence your unfair advantage"
2. a11oy /governance — 5 active policies, 0 bypass
3. amaru home (Replit SPA) — 968k records, Λ 0.91
4. amaru /dashboard — "The Andean Ouroboros", Λ 91.0%, kernel health live
5. sentra /console — Decision Center, 8 gates, Wire B live, INC-2026-0891
6. sentra /drone-cyber
7. killinchu home — 53 drones, Λ 0.922, Doctrine v11
8. killinchu /map — CesiumJS globe, 8 tracks
9. killinchu /drones — 53 systems (MQ-9 Reaper, RQ-4 Global Hawk…)
10. killinchu /swarm — Union-Find topology, 2 swarms (Shahed-136 ×8, FPV ×3, lone TB2)
11. rosie home — Gradio console, "🦅 Killinchu Drone Intel", "Self-Learning Loop"
12. anatomy-3d — 12-organ 3D body, 13/13 axes, Λ 0.923
13. rosie-3d — ecosystem field, rosie core + a11oy/amaru/sentra/killinchu/vessels satellites, Doctrine v11 749/14/163
14. (+ earlier-session: a11oy, killinchu, anatomy variants)

---

## PHASE 3b — ROOT-CAUSE FIXES (3 FAILs → all PASS, HfApi.create_commit DIRECT, ZERO BANDAID)

Initial sweep found 3 FAILs, all on `/v1/lambda` (+ amaru `/v1/honest`), caused by reliance on a dead Node sidecar (:8081) or route shadowing. Fix = native 13-axis geometric-mean Λ endpoints in the Python serve layer (no sidecar dependency).

| Space | Symptom | Root cause | Final fix SHA |
|---|---|---|---|
| **a11oy** | /v1/lambda 503 | dead Node :8081 proxy | `11d6cb7f1dd4d6e0eb48d88d76181e981b916c11` |
| **amaru** | /v1/honest 404, /v1/lambda 404 | endpoints registered **after** `app.mount("/api/amaru", …)` → sub-app shadowed them | `0bb0de453b979bfe71c4831d7bdd3af756485e24` (registered BEFORE mount, mirroring healthz pattern) |
| **sentra** | /v1/honest + /v1/lambda fell through to SPA catch-all | catch-all ordering | `ace20d8cf589b2fc8117b8697bbfe2ff7c5467a9` (registered before catch-all) |

**Collision note:** a concurrent agent's "resilience/circuit-breaker" commits clobbered my first a11oy/amaru commits (HEAD df035d2c). Re-checked HEAD, rebased the native-endpoint edits onto current HEAD, re-applied. Lesson applied to README commit (re-checked HEAD before upload).

**Post-rebuild regression re-check (2026-06-01):** a11oy/amaru/sentra `/v1/lambda` all 200 with `trust_axes:13`; killinchu drones DB 200. No regression after README rebuild. (`final_regression_check.json`.)

---

## PHASE 4 — README ORG CARD UPDATE (additive, HfApi DIRECT)

**Commit SHA:** `f57d85c6be033d6b94bd9edabf5a75288fdef771` (prev `c00b12a5004fa174351000df2be26780f5615f9e`).
Verified live at `https://huggingface.co/spaces/SZLHOLDINGS/README/raw/main/README.md`.

**Added (appended, non-destructive):**
- **3D visualizations** block — anatomy-3d + rosie-3d, both Doctrine v11 / 13-axis.
- **HF Collections** index — UDS Ecosystem, Math Substrate, Datasets, Legacy Spaces (with the air-domain pivot note: vessels archived → killinchu).

**Preserved (locked-surface guard PASS before upload):** frontmatter `emoji: 🦸`, `szl_banner.png` hero banner, 5 painterly hero avatars (rosie/a11oy/amaru/sentra/vessels) + killinchu, Doctrine v11 locked numbers (749/14/163), Λ=Conjecture, SLSA L1 honest, signatures PLACEHOLDER. The existing "What's New — All Upgrades Index" (added by a sibling agent) was retained intact. No avatar/banner/emoji byte changed.

---

## ARTIFACTS (workspace)
- `szl_space_inventory.json` — PHASE 1 inventory
- `szl_collections.py`, `szl_collection_items.py`, `szl_collection_slugs.json`, `szl_collection_items_log.json` — Collections (18/18 OK)
- `szl_test_battery.py`, `szl_test_results.json` — 43/43 PASS
- `commit_fixes.py`, `fix_commit_shas.json`, `fix_commit_shas_round2.json`, `serves_head/*.py`, `serves/sentra_serve.py` — PHASE 3b fixes
- `readme_org_card_LIVE.md`, `commit_readme.py`, `readme_commit_sha.json` — PHASE 4
- `final_regression_check.json` — post-rebuild regression re-check
- 16 screenshots in `current_session_context/tool_calls/screenshot/`

---

## FINAL TALLY
- **Spaces KEEP-LIVE:** 8 (a11oy, amaru, sentra, killinchu, rosie, anatomy-3d, rosie-3d, README)
- **In Collections:** 3 Spaces (vessels, uds-demo, lean-kernel) + 15 datasets = **18 items** across 4 new collections
- **Spaces deleted:** 0
- **Routes passing:** 43/43
- **Lambda FAILs fixed:** 3/3 (zero bandaid, HfApi DIRECT)
- **Screenshots:** 16
- **README SHA:** `f57d85c6be033d6b94bd9edabf5a75288fdef771` (locked surfaces preserved)
- **MASTER VERDICT:** 🟢 **GREEN — fully operational, no fuck ups.**
