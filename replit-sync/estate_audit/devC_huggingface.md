# SZL Holdings — Hugging Face Estate Audit (Dev C)

**Org:** `SZLHOLDINGS` (HF) / `szl-holdings` (GitHub) · **HF user:** betterwithage
**Audit date:** 2026-06-13 (UTC) · **Scope:** audit only — all HF pushes are Forge's job
**Doctrine:** report honestly; never claim live without a 200; static spaces 404 on bare domain by design.

## Verdict: FULLY OPERATIONAL

All 8 spaces returned HTTP 200 on their correct runtime URLs; all 22 datasets exist and are populated, including the three loop-critical datasets. One GitHub-side source-sync CI failure exists on an open a11oy PR (`szl_evidence_research.py` drift vs killinchu) but it does **not** affect any live runtime or the HF mirror.

---

## Spaces (8) — all probed for HTTP 200

| Space | SDK | API stage | Runtime URL probed | HTTP | State |
|---|---|---|---|---|---|
| killinchu | docker | RUNNING | https://szlholdings-killinchu.hf.space/ | 200 | **LIVE** |
| a11oy | docker | RUNNING | https://szlholdings-a11oy.hf.space/ | 200 | **LIVE** |
| yarqa | docker | RUNNING | https://szlholdings-yarqa.hf.space/ | 200 | **LIVE** |
| hatun-mcp | docker | RUNNING | https://szlholdings-hatun-mcp.hf.space/ | 200 | **LIVE** (MCP server) |
| cathedral | static | RUNNING | https://szlholdings-cathedral.static.hf.space/ | 200 | **LIVE** (bare .hf.space → 404 by design) |
| anatomy | static | RUNNING | https://szlholdings-anatomy.static.hf.space/ | 200 | **LIVE** (bare .hf.space → 404 by design) |
| khipu-constellation | static | RUNNING | https://szlholdings-khipu-constellation.static.hf.space/ | 200 | **LIVE** (bare .hf.space → 404 by design) |
| llm-router-live | static | RUNNING | https://szlholdings-llm-router-live.static.hf.space/ | 200 | **LIVE** (bare .hf.space → 404 by design) |

Notes:
- 4 docker spaces (killinchu, a11oy, yarqa, hatun-mcp) on `cpu-basic`, all RUNNING + 200 on bare `.hf.space/`.
- 4 static spaces (cathedral, anatomy, khipu-constellation, llm-router-live): 200 on `.static.hf.space/`; bare `.hf.space/` returns 404 — **expected/by design**, not an outage. anatomy confirmed LIVE at `szlholdings-anatomy.static.hf.space` as expected.
- **No space is DOWN, build-error, or dark.**

---

## Datasets (22) — all exist, none empty

| Dataset | Last modified (UTC) | Downloads | State |
|---|---|---|---|
| killinchu-osint-corpus | 2026-06-13 | 795 | OK (fresh) |
| a11oy-verifiable-corpus | 2026-06-12 | 63 | OK (fresh) |
| readiness-runs | 2026-06-11 | 1072 | OK |
| szl-lake | 2026-06-11 | 157 | OK |
| rag-corpus-v1 | 2026-06-07 | 104 | OK |
| **uds-governance-receipts** | 2026-06-03 | 138 | OK — loop-critical (see cross-check) |
| **canonical-formulas-v1** | 2026-06-03 | 386 | OK — loop-critical |
| doctrine-v10-v11 | 2026-06-03 | 388 | OK |
| lean-theorem-tree | 2026-06-03 | 98 | OK |
| ouroboros-arxiv-preprint | 2026-06-03 | 120 | OK |
| szl-artifacts | 2026-06-03 | 198 | OK |
| thesis-v18-formal-verification | 2026-06-03 | 357 | OK |
| uds-spans-receipts | 2026-06-03 | 210 | OK |
| why-we-lead | 2026-06-03 | 125 | OK |
| SZLHOLDINGS (org card) | 2026-06-03 | 150 | OK |
| szl-visual-identity | 2026-06-03 | 346 | OK |
| org-card-assets | 2026-06-03 | 34 | OK |
| uds-bundles-v1 | 2026-06-02 | 157 | OK |
| usb-bundle-v1 | 2026-06-02 | 47 | OK |
| **lean-proofs-v1** | 2026-06-01 | 466 | OK — loop-critical (oldest mtime, but populated 70 files) |
| thesis-corpus-v18 | 2026-06-01 | 422 | OK |
| k-verify-benchmark-v1 | 2026-06-03 | 67 | OK |

All datasets are public and non-empty. No empty/missing dataset detected.

### Loop cross-check (task #3) — energy loop persists receipts to `uds-governance-receipts`, validates against `canonical-formulas-v1` / `lean-proofs-v1`

| Dataset | Files | Total bytes | Health |
|---|---|---|---|
| uds-governance-receipts | 38 | 247,780 | HEALTHY — holds `extended-attestations.jsonl`; chain entries through 2026-06-17 (forward-dated plan entry); also v0.3.1 UDS bundle + span schemas + tests |
| canonical-formulas-v1 | 11 | 78,923 | HEALTHY — Lean `Formulas.lean` (19 KB) + python `formulas.py`/`composer.py` + tests |
| lean-proofs-v1 | 70 | 419,931 | HEALTHY — Lutar Lean tree (Banach/Brahmi/etc.), Axioms.lean present |

All three present and healthy. The receipt chain in `uds-governance-receipts` is intact (hash-linked `prev`/`step` fields observed). Last write 2026-06-03; **mild staleness note** (~10 days), but content is complete and the latest attestation timestamp is forward-dated, so this is not an error — flag as "confirm fresh on next loop run" only.

---

## GitHub ↔ HF mirror cross-check (task #4: a11oy + killinchu)

GitHub source repos: `szl-holdings/a11oy` and `szl-holdings/killinchu` (both public, both updated 2026-06-13).

**HF↔GitHub mirror is IN SYNC.** On open a11oy PR #341 (`feat/anatomy-circulation-loop`):
- ✅ `hf-module-drift / Source in sync with the live HF Space` → **PASS** (HF Space mirrors GitHub source — no HF drift)
- ❌ `Shared source files in sync with killinchu` (shared-source-sync) → **FAIL**

**Drift signal (GitHub-side only, not a runtime issue):**
- `drift: szl_evidence_research.py` — diverged between a11oy and killinchu and NOT allow-listed → causes the failing check (exit 1).
- 9 stale allow-list entries should be removed to re-tighten the guard: `a11oy_code_engine.py`, `cathedral.html`, `live_wires_3d.js`, `operator_shell_v4.py`, `serve.py`, `szl_alloy_models.py`, `szl_khipu_consensus.py`, `szl_live_wires.py`, `szl_llm_registry.py` (these are flagged as "NO LONGER diverged").

This failure is on a feature-branch PR's CI; the deployed mains and the live HF spaces are unaffected (both a11oy + killinchu spaces returned 200). It is a code-hygiene/governance gate, not an outage.

---

## FORGE TO-DO

### Spaces needing waking / rebuilding
- **NONE.** All 8 spaces are RUNNING and returned HTTP 200 on their correct runtime URLs. No space requires waking or rebuilding.

### Datasets needing refresh
- **NONE required for operation.** All 22 datasets exist and are populated.
- **Optional / watch-item:** `uds-governance-receipts`, `canonical-formulas-v1`, `lean-proofs-v1` last modified 2026-06-01–06-03 (~10 days). They are healthy and complete; just **confirm a fresh receipt write lands on the next energy-loop run** so the loop's "receipts.out" reflects current activity. No rebuild needed now.

### GitHub source-sync (not an HF push — for the owning eng to resolve, surfaced here as the drift signal)
- Resolve a11oy PR #341 failing **shared-source-sync** check: either sync `szl_evidence_research.py` between `szl-holdings/a11oy` and `szl-holdings/killinchu`, or add it to `.github/shared-file-drift-allow.txt` with a reason.
- Tidy `.github/shared-file-drift-allow.txt`: remove the 9 stale allow-list entries listed above to re-tighten the guard.
- No HF-side action: `hf-module-drift` passes, so HF spaces already mirror GitHub.

---

### Evidence (commands run)
- `GET https://huggingface.co/api/spaces?author=SZLHOLDINGS` and per-space `…/api/spaces/SZLHOLDINGS/<name>` (runtime.stage)
- `GET https://huggingface.co/api/datasets?author=SZLHOLDINGS&full=true` + per-dataset `/tree/main?recursive=true`
- `curl -sL -o /dev/null -w '%{http_code}'` against each space runtime URL (docker `.hf.space`, static `.static.hf.space`)
- `gh pr checks 341 -R szl-holdings/a11oy` and the failing job log (run 27463638040 / job 81181931221)
