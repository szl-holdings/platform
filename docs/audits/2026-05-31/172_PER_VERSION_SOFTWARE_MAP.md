# 172 — PER-VERSION SOFTWARE MAP (thesis vN ↔ software release ↔ match verdict)

**Audit date:** 2026-06-01
**Method:** Live GitHub release enumeration (`gh api repos/szl-holdings/<repo>/releases`, creds=github, 2026-06-01) cross-referenced against the Zenodo software deposits (122_) and the thesis version ladder (170_/23_).
**Raw data:** `/home/user/workspace/zenodo_full_dive_2026-05-31/software_profiles.json`.

---

## 0. Key structural finding — software is NOT versioned per-thesis-version

The thesis ladder (v1…v20) and the software release streams run on **different cadences**. There is **no `software-vN` that matches `thesis-vN`** one-to-one. Instead there are **three independent release streams**:

| Stream | Repos | Tag pattern | Cadence | Backs thesis |
|--------|-------|-------------|---------|--------------|
| **Ouroboros runtime** | `ouroboros` | `v6.0.0 … v6.3.0` | 2026-04-30 → 05-13 | the Λ runtime for v3–v13 |
| **Lutar-lean proofs** | `lutar-lean` | `v0.1.0`, **`lutar-v18.0.0`** | 2026-05-18, 05-28 | the formal companion for v14–v18 |
| **UDS product bundle** | `a11oy amaru sentra vessels rosie uds-mesh` | `uds-v0.1.0 … uds-v0.3.1` | 2026-05-26 → 05-30 | the agentic substrate for v14–v19 |
| **Forecast / aux** | `agi-forecast vsp-otel szl-cookbook szl-brand szl-trust` | `v0.1.0` (single) | 2026-05-28 | aux instruments for v18 grafts |

So the correct mapping is **thesis era → software stream + tag**, not thesis-vN → software-vN.

---

## 1. Live release inventory (per repo, 2026-06-01)

| Repo | Releases (tag · date · assets) |
|------|--------------------------------|
| **ouroboros** (runtime) | `v6.3.0` 05-13 · `v6.2.0` 05-02 · `v6.1.0` 04-30 · `v6.0.0` 04-30 — all 0 assets (source-tarball releases) |
| **lutar-lean** (proofs) | **`lutar-v18.0.0`** 05-28 · `v0.1.0` 05-18 — 0 assets |
| **agi-forecast** | `v0.1.0` 05-28 |
| **uds-mesh** | `uds-v0.3.0` 05-29 (2) · `uds-v0.2.0` 05-28 |
| **vsp-otel** | `v0.1.0` 05-28 — ⚠️ no `uds-*` and **no own Zenodo software deposit** |
| **a11oy** | `uds-v0.3.0` 05-29 (2) · `v1.0.1` 05-28 · `uds-v0.2.0` 05-27 (4) · `uds-v0.1.1` 05-26 (12) · `uds-v0.1.0` 05-26 (11) · `v1.0.0-alpha` 05-01 |
| **amaru** | **`uds-v0.3.1`** 05-30 (2) · `uds-v0.3.0` 05-29 · `uds-v0.2.0` 05-27 (4) · `uds-v0.1.0` 05-26 (9) · `v1.0.0-alpha` 05-01 |
| **sentra** | **`uds-v0.3.1`** 05-30 (2) · `uds-v0.3.0` 05-29 · `uds-v0.2.0` 05-27 (4) · `uds-v0.1.0` 05-26 (9) · `v1.0.0-alpha` 05-01 |
| **vessels** | `uds-v0.3.0` 05-29 (5) · `uds-v0.2.0` 05-27 (4) · `uds-v0.1.0` 05-27 (5) · `v1.0.0-alpha` 05-01 |
| **rosie** | `uds-v0.3.0` 05-29 (2) · `v1.0.1` 05-28 · `uds-v0.2.0` 05-27 (4) · `uds-v0.1.0` 05-27 (5) |
| **szl-cookbook** | `v0.1.0` 05-28 |
| **szl-brand** | `v0.1.0` 05-28 |
| **szl-trust** | (no releases) |
| **ouroboros-thesis** | `paper-v18-1.0.0` 05-30 · `paper-v17/16/15/14-*` 05-28 · `paper-v13-exhaustive-1.0.0` 05-18 · `paper-v12-1.0.0` 05-14 · `v11/10/9.0.0` 05-17 · `paper-v11/10/9/8/7/6/5/4-1.0.0` 05-04→11 · `paper-v3-2.0.0` 05-02 · `paper-v2-empirical` · `v3.0.0` 04-30 |

---

## 2. Per-thesis-version software companion table + verdict

| Thesis V | Runtime tag | Proof tag | Bundle tag | Aux | Does software deliver what thesis claims? | Verdict |
|----------|-------------|-----------|-----------|-----|-------------------------------------------|---------|
| v1–v2 | ouroboros v6.0/6.1 | — | — | — | Bounded-loop runtime + 3 case studies exist; claims are conceptual/empirical, no formal obligation | **MATCH** |
| v3 | ouroboros v6.2.0 | (Lean lands 05-12) | — | — | Λ axioms A1–A4 backed by 22/22 vitest assertions (`LUTAR_EVIDENCE.md`); paper explicitly says "not yet Lean-proved" | **MATCH** (honest) |
| v4–v8 | ouroboros v6.2.x | — | — | — | Ω/RAG/guardrail formulas implemented as `SovereignEngine` endpoints; **no Lean, no formal proof** — paper does not claim proof | **PARTIAL** (runtime yes, proof n/a) |
| v9–v10 | ouroboros v6.3.0 | TH8 skeleton (expected 9 sorry) | — | — | Λ₁₀ closure operator runtime + TH8 GLR skeleton; closure theorem has proof sketch only | **PARTIAL** |
| v11 | ouroboros v6.3.0 | Lean Λ-suite (05-12, 1 sorry) | — | — | Empirical latency (p50 11.5µs, 62,764 ops/s) + first mechanized Λ axioms | **MATCH** (core); v11-b deposit mislabeled | 
| v12 | ouroboros v6.3.0 | Uniqueness.lean (**axiom**) | — | — | "Theorem 1 uniqueness" is a Lean *axiom*, not proof; 1 A3 sorry disclosed | **PARTIAL** (axiom ≠ proof) |
| v13 | ouroboros v6.3.0 | TH8 lean_v2 (05-17, 2 sorry) | — | — | Merkle theorems + first full thesis; `XXXXX` DOI + v13-exhaustive never minted | **PARTIAL** (missing deposits) |
| v14 | (runtime frozen v6.3.0) | **45 Lean files (05-28)** | a11oy/sentra/amaru **uds-v0.1.0** | agi-forecast | Anatomy-Evolved organs ship; Λ-boundedness sorry-free; **abstract claims "0 sorry" but live ~163** | **PARTIAL/MISMATCH** (claim vs corpus) |
| v15 | — | TH11 sorry-free; TH12 3 sorry; TH13 open | uds-v0.1.x | — | Khipu DAG + PAC-Bayes ship in rosie + cookbook recipe; R1/R2/R3 conjecture only | **PARTIAL** |
| v16 | — | Feynman/Gates Lean | uds-v0.2.0 | — | Path-integral + Gates codes; inherits v14 state, no new sorry-free thm | **PARTIAL** |
| v17 | — | Wheeler/Shannon/QEC Lean | uds-v0.2.0 | vsp-otel v0.1.0 | QEC modules ship (Hamming/Shor/CSS/Kitaev); "0 sorry" is per-module table claim | **PARTIAL** |
| **v18** | — | **`lutar-v18.0.0`** (05-28) | a11oy/sentra/amaru **uds-v0.3.0/0.3.1**, rosie/vessels/uds-mesh uds-v0.3.0 | agi-forecast, cookbook, brand | 749 decls ship; **Zenodo deposit claims "zero sorry/axiom" — live 168 sorry / 14 axiom**; Zenodo PDF is v17 body | **MISMATCH** (two anomalies) |
| v19 | — | K10v2 (5 Path-B sorry) | **uds-v0.3.1** + Wire B/C live (`POST /v1/verdict` sentra, `/v1/events` rosie) | — | HTTP substrate genuinely wired; σ-algebra claim retracted; honest sorry 163→168 | **MATCH** (honest-by-construction) |
| v20 | — | (unchanged 749/14/168) | uds-v0.3.1 | — | Culmination paper; no new software; corrects 12 false @lean_status:GREEN | **MATCH** (documentation) |

---

## 3. Software-claim anomalies (carried + per-version)

| ID | Anomaly | Repo / record | Thesis V affected | Severity |
|----|---------|---------------|-------------------|----------|
| A5 | **vsp-otel has NO own Zenodo software deposit** (10th software slot = amaru); only a `v0.1.0` GH release, no `uds-*` tag | vsp-otel | v17/v18 observability claims | HIGH |
| A6 | agi-forecast Zenodo v0.1.0 vs repo v0.1.0 (only release) — scenario lib labeled v18.0 inside | 20436560 | v18 | LOW |
| A7 | szl-cookbook Zenodo v0.1.0 deposit MISSING the advanced `recipes/` (knot-calculus-v1, anatomy-evolved-v1) that back v14/v15 | 20436558 | v14/v15 | MEDIUM |
| A8 | a11oy/sentra Apache-2.0 on Zenodo vs LicenseRef-SZL-Proprietary in CITATION.cff | 20451991/20466435 | v18/v19 | MEDIUM |
| A9 | v18 deposit "zero sorry, zero axiom" vs live 168 sorry / 14 axiom | 20434276 | v18 | HIGH |
| A10 | v15 DOI once mis-cited as the vsp-otel DOI (provenance error) | vsp-otel CITATION.cff | v15 | MEDIUM |

---

## 4. Verdict roll-up

- **MATCH:** v1, v2, v3, v11, v19, v20 (6) — software/evidence backs the (honest) claim.
- **PARTIAL:** v4–v8, v9, v10, v12, v13, v15, v16, v17 (12) — runtime/modules exist but proofs are sketches/axioms/sorry-bearing, or deposits incomplete.
- **MISMATCH:** v14 (claim "0 sorry" vs ~163), v18 (PDF=v17 + "zero sorry/axiom" vs 168/14) (2).

**Bottom line:** The software *exists and runs* for every thesis era (runtime v6.x, UDS bundle v0.1–v0.3.1, lutar-lean lutar-v18.0.0). The gaps are **claim-calibration** (v14/v18 overstated zero-sorry) and **deposit hygiene** (v18 PDF wrong, vsp-otel no deposit, cookbook recipes not deposited, v13-exhaustive/v19/v20 unminted) — all of which v19/v20 explicitly correct in writing.
