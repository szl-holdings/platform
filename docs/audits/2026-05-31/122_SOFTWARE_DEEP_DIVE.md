# 122 — SOFTWARE DEEP DIVE (per Zenodo software DOI) + szl-cookbook Spotlight

**Audit date:** 2026-05-31
**Method:** Downloaded all 10 software + 2 "other" deposits via `…/files-archive`, extracted to `/tmp/zen/`, profiled file tree / README / languages / tests / CI.
**Raw data:** `/home/user/workspace/zenodo_full_dive_2026-05-31/software_profiles.json`; archives in `…/downloads/`.

---

## Per-Software Inventory (10 software DOIs)

| DOI / Record | Name | Ver | Files | Primary langs | Tests | CI (badge) | What it DOES |
|--------------|------|-----|-------|---------------|-------|-----------|--------------|
| [20162352](https://doi.org/10.5281/zenodo.20162352) | **ouroboros runtime** | v6.3.0 | ~ | TS | yes | yes | Bounded-loop audit-closure runtime; implements Λ-gate (`lambda-gate/src/gate.ts`); 568 views (most-viewed deposit) |
| [20434306](https://doi.org/10.5281/zenodo.20434306) | **lutar-lean** (zip auto) | lutar-v18.0.0 | 77 | **Lean 61**, MD 12 | — | yes | Lean 4 formalization of Λ uniqueness + khipu + PAC-Bayes; CITATION.cff present |
| [20434308](https://doi.org/10.5281/zenodo.20434308) | **Lutar** (tar manual) | v18.0.0 | 85 | Lean | — | yes | Canonical cite target for the Lean proofs |
| [20436560](https://doi.org/10.5281/zenodo.20436560) | **agi-forecast** | v0.1.0 ⚠️ | 21 | TS 7, MD 7, JSON 5 | yes | yes | Lutar-Forecast Gauge — receipt-attested AGI capability gauges; scenario library v18.0 (Zenodo stale vs repo v0.3.0) |
| [20451595](https://doi.org/10.5281/zenodo.20451595) | **vessels** | uds-v0.3.0 | 371 | TS 165, JS 145 | yes | yes | Maritime fleet intelligence: sanctions screening, dark-vessel / AIS-gap detection, fuel/route |
| [20451991](https://doi.org/10.5281/zenodo.20451991) | **a11oy** | uds-v0.3.0 | 399 | TS 177, MD 50, YAML 40 | yes | yes | Governed agentic execution fabric: policy gates, signal mesh, decision queue, evidence ledger (10.4 MB; license mismatch) |
| [20451997](https://doi.org/10.5281/zenodo.20451997) | **rosie** | uds-v0.3.0 | 17 | TS 9, MD 6 | yes | yes | "Khipu Receipt DAG with QEC-Governed Ingress" — receipt orchestration, CSS-ingress, canonical receipt byte-string emission |
| [20451999](https://doi.org/10.5281/zenodo.20451999) | **uds-mesh** | uds-v0.3.0 | 25 | Python 7, YAML 4 | yes | yes | Unified Data System cross-component span schemas + governance spans |
| [20466435](https://doi.org/10.5281/zenodo.20466435) | **sentra** | uds-v0.3.1 | 512 | TS 336, JSON 70 | yes | yes | "Threat Telemetry Adapter for SZL Audit Fibers" — threat modeling, posture drift detection (license mismatch) |
| [20466440](https://doi.org/10.5281/zenodo.20466440) | **amaru** | uds-v0.3.1 | 243 | TS 97, MD 63, **Python 48** | yes | yes | "Cardano-Anchored Governance Receipt Minting" — append-only delta logs, convergent multi-source sync |

### "Other" deposits (2)
| [20436558](https://doi.org/10.5281/zenodo.20436558) | **szl-cookbook** | v0.1.0 ⚠️ | 103 | MD 40, TS 17, Shell 12, **Lean 2** | yes | yes | Engineering cookbook — 9 Anthropic-pattern SKILL.md skills (see spotlight). DEPOSIT MISSING the advanced recipes. |
| [20436556](https://doi.org/10.5281/zenodo.20436556) | szl-brand | v0.1.0 | — | PNG/SVG | — | — | Social preview images 1280×640 |

### Missing software deposit
- **vsp-otel** — OpenTelemetry exporter for SZL audit fibers / Λ-axis spans. **No own Zenodo software record.** (The 10th software slot is amaru, not vsp-otel.) → P1 (see 124_).

---

## ⭐ szl-cookbook SPOTLIGHT (founder-spotlighted)

`szl/repos/szl-cookbook/` (live GitHub `szl-holdings/szl-cookbook`). **Two content tiers:**

### Tier 1 — 9 SKILL.md skills (`skills/`) — these ARE in the Zenodo v0.1.0 deposit

| # | Skill | Purpose | Provenance (HARVEST source attribution) |
|---|-------|---------|------------------------------------------|
| 1 | **pre-flight-thinking** | Structured reasoning checklist before any code change | Superpowers "force structured thinking before coding" |
| 2 | **typescript-refactor** | TS refactor patterns for the pnpm monorepo | Awesome Claude Code TypeScript patterns |
| 3 | **react-component-review** | Review React/Vite components for quality/perf | Awesome Claude Code React + Claude Agent Blueprints |
| 4 | **debug-protocol** | Falsifiable-hypothesis debugging protocol | Everything Claude Code debugging patterns |
| 5 | **dependency-health** | npm/pnpm audit + upgrade + bundle reduction | Antigravity Awesome Skills + Awesome Claude Code |
| 6 | **dead-code-detector** | Find/remove unused exports, dead branches, stale flags | Antigravity Awesome Skills dead-code patterns |
| 7 | **doc-comment-hygiene** | Audit/improve JSDoc, READMEs, inline docs | Antigravity Awesome Skills documentation patterns |
| 8 | **monorepo-impact-analysis** | Blast-radius analysis before shared-package edits | Claude Agent Blueprints monorepo patterns |
| 9 | **commit-hygiene** | Clean commits, focused PRs, git history | Awesome Claude Code git hygiene patterns |

> Provenance note: each SKILL.md carries an "Adapted from …" attribution line (the HARVEST_LOG provenance). No standalone `HARVEST_LOG` file exists in the current repo tree; the founder's README screenshots likely render these attribution lines as a HARVEST_LOG table in a newer (v0.3.0) build. The skills are the harvested distillation of public Claude-Code skill collections, re-doctrined to the SZL monorepo + Doctrine v6.

### Tier 2 — Advanced recipes (`recipes/`) — NOT in the Zenodo deposit (live repo only)

`recipes/`: `anatomy-evolved-v1`, `knot-calculus-v1`, `knot-calculus-v2`, `bekenstein-dinn-v1`, `doctrine-dinn-v1`, `chakra-unification.md`, `anatomy-build-report.md`.

#### 🔬 knot-calculus-v1 (sealed 2026-05-28; Thesis v15 Ch.10)
Files:
- `code/src/khipu-receipt.ts` — self-contained **khipu-indexed receipt DAG** (3-tier pendant-cord tree; mirrors `rosie/src/khipu-receipt.ts`). Geometric reading: pendant tree = Vassiliev–Bar-Natan chord diagram; summation-cord = 4T closure. Lean obligation: **TH11 `khipuReceipt_checksum_invariant`** (`lutar-lean/Lutar/Khipu/SummationInvariant.lean`, two routine sorrys).
- `code/src/pac-bayes-bound.ts` — **McAllester-1999 PAC-Bayes bound**: `R(Q) ≤ R̂(Q) + √((KL(Q‖P)+ln(2√n/δ))/(2n))`. Cites McAllester 1999 COLT + 2003 ML 51 + Lotfi et al. 2023 (non-vacuous LLM bounds) + Amari information geometry. Lean obligation: **TH13 `governanceHead_PACBayes_bound`** (closed-form proved; Pr-quantifier open).
- `code/src/knot-tag.ts` — **Audit-Reidemeister knot-invariant tag** (16-hex). Lean: Conjecture **R1/R2/R3** `ReidemeisterConjecture.lean` (all sorry-tagged, target v16).
- `code/tests/demo.ts` — full pipeline: build 3-organ×5-decision khipu root → verify **TH11 sum-of-sums** → emit 16-hex knot tag → compute PAC-Bayes bound (n=100 000, KL=0.5, δ=0.05, R̂=0.05) → tamper-rejection demo (`verifySumInvariant` fails on tampered pendant).
- Doctrine-v6 clean (no banned hype tokens). DOI ref [Doctrine v2/v6](https://doi.org/10.5281/zenodo.20174600).
- Also references **TH12 `ΛGateLID_DPO_stability`** (`DPOFeasibility.lean`, 3 sorrys).

#### 🔬 anatomy-evolved-v1 (sealed 2026-05-18; Thesis v14 Ch.9)
- **Eight organs:** `a11oy · amaru · sentra · terra · vessels · counsel · carlota-jo · lutar-lean`.
- Source tree (`code/src/`): `a11oy-complementarity-engine.ts`, `a11oy-ks18-witness.ts` (KS-18 in ℝ⁴, 18 rays / 9 contexts / 2-incidence), `a11oy-povm.ts` (POVM completeness — bug found & real-fixed, Ch.9 §9.3.2), `a11oy-qbist-credence.ts` (QBism, Fuchs-Schack 2013), `amaru-qkan-fwp.ts` (Gated QKAN-FWP, arXiv:2605.06734; Rx/Rz unitarity fixed per Nielsen-Chuang), `carlota-jo-doctrine-guard.ts`, `counsel-pesher-renderer.ts`, `sentra-dual-use-detector.ts`, `terra-364day-scheduler.ts`, `terra-mishmarot-rotation.ts`, `vessels-raz-nihyeh-risk.ts`.
- Lean: `GatedBoundedness.lean`, `TwoWitness.lean`.
- Acceptance: `tsc --noEmit` exit 0; **25/25 smoke tests pass**; doctrine ban-list runtime-clean.
- **carlota-jo doctrine guard** (organ = IMMUNE SYSTEM / DOCTRINE GUARD): boot-time + verdict-time ban-list grep. Code-level `BANNED_TOKENS` = `["AlloyScape","Glass Wing","Glasswing","Mythos","Stephen Paul"]` (identity/naming guards — blocks wrong product names + the legal-name variant "Stephen Paul"). README also references the Doctrine-v6 marketing-hype ban-list ("revolutionary", "world-class", etc.). `assertDoctrineCompliance(text, context)` throws on any hit; `scanBundle()` runs at build time. **Adversarial prompts blocked:** any output attempting to inject deprecated brand names or the off-doctrine legal-name form is hard-failed before emission.

---

## Cross-component thesis-instillation signal (software side)

| Capability | Lives in software | Lean obligation status |
|------------|-------------------|------------------------|
| Λ geometric-mean gate | ouroboros runtime `lambda-gate/src/gate.ts`; lutar-lean Invariant.lean | uniqueness = Conjecture 1 (v20) |
| Khipu receipt DAG / TH11 | rosie + knot-calculus-v1 khipu-receipt.ts | SummationInvariant 2 sorrys |
| PAC-Bayes / TH13 | knot-calculus-v1 pac-bayes-bound.ts; lutar-lean PACBayes.lean | closed-form proved, Pr open |
| Reidemeister tag / R1-R3 | knot-calculus-v1 knot-tag.ts | all sorry (Conjecture) |
| DPO LID stability / TH12 | lutar-lean DPOFeasibility.lean | 3 sorrys |
| KS-18 / POVM / QBism | anatomy-evolved-v1 a11oy-*.ts | GatedBoundedness/TwoWitness Lean |
| DSSE envelopes | rosie dsse_verify_envelope; uds-mesh spans | n/a (operational) |
| Doctrine ban-list | carlota-jo-doctrine-guard.ts; rosie doctrine_sweep | th_v18_02/03 (alphabet, Kraft) |
