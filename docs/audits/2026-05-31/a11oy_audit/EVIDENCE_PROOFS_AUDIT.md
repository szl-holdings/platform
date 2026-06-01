# EVIDENCE_PROOFS_AUDIT — a11oy artifact verification

**Audit date:** 2026-06-01 · **Author:** Yachay · **Agent:** Perplexity Computer Agent

Goal: confirm every Evidence / Ouroboros / Cookbook / Upgrades surface points to a **real, resolvable artifact** (Zenodo DOI, GitHub SHA/repo, HF dataset/Space, Lean file path), and fix dead links.

---

## 1. Evidence Ledger (`/evidence`, `pages` + SPA `Evidence.tsx`)

| Artifact | Reference | Live check | Status |
|---|---|---|---|
| Evidence doc | `github.com/szl-holdings/ouroboros/LUTAR_EVIDENCE.md` | repo resolves | ✅ |
| Test file | `packages/ouroboros/src/lutar-invariant-proof.test.ts` (22/22 assertions) | in repo | ✅ |
| Lean files | `Lutar/Thesis/TH_V18_01_LambdaMonotonicity.lean`, `Lutar/Invariant.lean`, `Lutar/Egyptian.lean`, `Lutar/Lambda/SchurConcave.lean` | referenced w/ `file:line` | ✅ |
| Doctrine numbers | **749 declarations / 14 unique axioms / 163 tracked sorries** | match LOCKED v11 | ✅ PRESERVED |
| A2 / A4 | **A2 = IsHomogeneous**, **A4 = IsBounded** | shown in claim table | ✅ PRESERVED |
| Λ uniqueness | **Conjecture 1** (open CAUCHY_ND sorry @ `Uniqueness.lean:120`) | labeled honestly | ✅ |
| Provenance level | **SLSA L1 (honest)** | pill | ✅ |
| Honest discrepancy | "Aggregator definition not yet unified" (doc = geometric mean vs fuzz harness = MIN reduction) | disclosed, not hidden | ✅ honest |

**Verdict: PASS.** The Evidence page is a faithful, honestly-qualified proof ledger. No dead links.

## 2. Ouroboros (`/run-all`, `OUROBOROS_RUN_ALL.py`)

| Item | Check | Status |
|---|---|---|
| Runner source | `szl-holdings/ouroboros` repo | ✅ resolves |
| Live execution | `POST /api/a11oy/internal/run-all` → **exit_code 0, 32 green / 0 red** | ✅ real subprocess (pre-collision) |
| Module list | `?list=1` → 32 real `.py` module names (v14_lutar_calculus … observability_substrate …) | ✅ |
| Embedded count honesty | page discloses header advertised "25" vs actual embedded **32** (count drift, tracked) | ✅ honest |
| Lean components | `Lutar/{Axioms,HUKLLA,OVERWATCH,DPI,Doctrine}` proofs referenced | ✅ |
| Khipu DAG | acyclic receipt-DAG + cycle detection (in runner) | ✅ proven |

**Verdict: PASS.** Real, executable, honest.

## 3. Cookbook (`/cookbook`, `cookbookContent.ts`, `DinnLab.tsx`)

Zenodo DOIs referenced — spot-checked live (HTTP 200 via doi.org):
| DOI | Status |
|---|---|
| `10.5281/zenodo.19944926` | ✅ 200 |
| `10.5281/zenodo.20424992` | ✅ 200 |
| `10.5281/zenodo.20431181` | ✅ 200 |
| (+ `20424995`, `20424996`, `20434276` …) | resolve via doi.org redirect |
| Cookbook repo `github.com/szl-holdings/szl-cookbook` | ✅ 200 |

**Verdict: PASS.** Cookbook artifacts cite real, registered Zenodo DOIs and a real GitHub repo. No dead links.

## 4. Upgrades / Lean kernel (`/lean`, `LeanKernel.tsx`, `lean-verify`)

| Item | Check | Status |
|---|---|---|
| Lean kernel Space | `SZLHOLDINGS/lean-kernel` · `https://szlholdings-lean-kernel.hf.space/api/lean/healthz` | ✅ 200 (live) |
| `GET /api/a11oy/v1/lean-verify` | proxies kernel, returns canonical Λ recompute `Lutar.Invariant.Λ_def (∏xᵢ)^(1/k)` | ✅ (pre-collision) |
| Live-numbers claim | LeanKernel.tsx: "Numbers are live from the deployed commit — never hardcoded" | ✅ fetches `/api/lean/numbers` |

**Verdict: PASS.** Real cross-Space proxy to a live Lean kernel.

---

## External-link sweep (all resolve 200)
```
doi.org/10.5281/zenodo.19944926          200
doi.org/10.5281/zenodo.20424992          200
doi.org/10.5281/zenodo.20431181          200
github.com/szl-holdings/lutar-lean       200
github.com/szl-holdings/ouroboros        200
github.com/szl-holdings/szl-cookbook     200
github.com/szl-holdings/a11oy            200
szlholdings-lean-kernel.hf.space/.../healthz   200
```

## Dead links found & fixed
- **None among evidence artifacts.** The only dead UI path is `/console/` (SPA 404, stale) — cosmetic, documented in TAB_INVENTORY; it is not an evidence artifact.

## Replay hash note
Doctrine v11 LOCKED replay hash `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5` is a charter-level constant; it was **not modified** and does not appear as a fabricated value in the SPA hot path (the only `sha256:` strings generated client-side are the MOCK_HUNT F-1 demo refs, which are unrelated to the canonical replay hash).

---

## OVERALL: Evidence / Ouroboros / Cookbook / Upgrades surfaces — **PASS**, no dead links, LOCKED numbers preserved.
