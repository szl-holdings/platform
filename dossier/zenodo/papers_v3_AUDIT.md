# GitHub Audit — What v3 Can and Cannot Prove

**Audit date:** 2026-05-02
**Auditor:** Perplexity Computer (this session)
**Scope:** All repos under `stephenlutar2-hash` and `szl-holdings`, fresh clones, tests run on this machine
**Method:** clone → install → run tests → grep for cross-repo dependencies → classify each test as Type A (behavioural proof) or Type B (schema/regression/marketing)
**Bottom line:** **One repo carries proof. The rest is described, not proven.**

---

## Repo inventory (12 repos audited)

| Repo | Visibility | Files | Tests | Status |
|---|---|---|---|---|
| `szl-holdings/ouroboros` | public | ~40 ts/json/md | **172/172 pass** | ✅ Proves Λ + runtime contract |
| `szl-holdings/ouroboros-thesis` | public | v2 paper + v2 experiments harness | 0 runnable here | v1+v2 papers, v2 harness needs full workspace |
| `szl-holdings/szl-holdings-platform` | public | 1.1 GB monorepo, 47 dirs | 400 declared | ⚠️ See §4 — does NOT import the Λ runtime |
| `szl-holdings/.github` | public | profile only | 0 | Org profile, no proofs |
| `szl-holdings/a11oy` | public | 4 (README + LICENSE + NOTICE + SECURITY) | 0 | README-only placeholder |
| `szl-holdings/amaru` | public | 4 | 0 | README-only placeholder |
| `szl-holdings/sentra` | public | 4 | 0 | README-only placeholder |
| `szl-holdings/counsel` | public | 4 | 0 | README-only placeholder |
| `szl-holdings/terra` | public | 4 | 0 | README-only placeholder |
| `szl-holdings/vessels` | public | 4 | 0 | README-only placeholder |
| `szl-holdings/carlota-jo` | public | 4 | 0 | README-only placeholder |
| `stephenlutar2-hash/stephenlutar2-hash` | public | README + screenshots | 0 | Personal profile |

---

## §1 — `szl-holdings/ouroboros` (the proof-bearing repo)

**Commit verified:** `5f6ee65b58331bc4b955aa90e5662f12a0d96d70` on `main`
**Author of latest restore:** Stephen Paul Lutar Jr. \<stephenlutar2@gmail.com\>
**Test command run:** `pnpm install && npx vitest run`
**Outcome:**

```
Test Files  6 passed (6)
     Tests  172 passed (172)
  Duration  1.28s
```

### 1.1 Test files and what each proves

| File | Tests | What kind |
|---|---|---|
| `packages/ouroboros/src/lutar-invariant-proof.test.ts` | **22** | **Type A — behavioural proof of Λ axioms** |
| `packages/ouroboros/src/runtime-contract.test.ts` | 41 | **Mixed** — ~30 Type A behavioural, ~11 Type B schema |
| `packages/ouroboros/src/runtime-contract.v4.test.ts` | 29 | **Mostly Type B schema regression** |
| `packages/ouroboros/src/v6-payload.test.ts` | 35 | **Type B schema regression** + ~10 Type A permission gating |
| `packages/ouroboros/src/gov-readiness.test.ts` | 28 | **Type B** — pins the audit scorecard data exactly |
| `src/runtime-contract.test.ts` | 17 | Duplicate-source regression of the v3 runtime |

### 1.2 The 22 Λ tests — what is proven (Type A, line-by-line from the source)

These are genuine behavioural witnesses: they compute Λ on explicit inputs and assert the axiom holds. **A failing test would falsify the corresponding axiom on the points exercised.**

**A1 Monotonicity (4)** — for each of the 9 axes, lifting that axis weakly raises Λ; lowering it weakly lowers Λ; strict monotonicity holds when weight is positive. Tested at `X_TYPICAL = [0.7]×9` under both equal and Egyptian weights.

**A2 Zero-pinning (4)** — any single axis at 0 with positive weight collapses Λ to 0; multiple zero axes also yield 0; a zero-weight axis at 0 does NOT collapse Λ (the `0^0 = 1` definitional edge case). The implementation uses an explicit short-circuit before log-domain evaluation.

**A3 Egyptian inspectability (4)** — `W_EGYPTIAN = [1/3, 1/3, 1/9, 6×(1/27)]` is a multiset of unit fractions summing to exactly 1 in rational arithmetic (verified to 12 decimals); each weight is bit-exact reproducible across two independent computation paths (direct division vs. exp-of-log); on uniform inputs `x = [0.5]×9`, Λ = 0.5 exactly.

**A4 Page-curve concavity (4)** — Λ is concave along a line segment between two interior points (5 interpolation values t ∈ {0.1, 0.25, 0.5, 0.75, 0.9}); second-difference test on a stress segment (one axis varying 0.1→1.0 in 11 steps) is non-positive within 1e-10; AM-GM corollary Λ ≤ Σ wᵢxᵢ holds on 4 representative inputs; equality when all axes equal.

**Boundary / sanity (6)** — Λ(perfect)=1 under both weight sets; Λ(typical)=0.7 (uniform inputs); the headline result Λ(degraded with one axis at 0.1) ≈ 0.707 < arithmetic mean ≈ 0.811; symmetry under axis permutation; the 9 axis labels match the runtime declaration; both standard weight sets sum to 1.

### 1.3 What §1 does NOT prove
- **Not a formal-logic proof.** No Lean, Coq, or Isabelle mechanization. These are numerical witnesses only.
- **Not proof over all of [0,1]⁹.** Tests evaluate at a finite set of points; the axioms could fail at unsampled points (though the math says they don't).
- **The 9 axis labels are runtime commitments**, not theorems. Any 9 non-negative scalars in [0,1] form a valid input.

### 1.4 Other Type A behavioural proofs in this repo (~50 total)

These prove how the runtime *behaves* on explicit inputs:

- **Proof-route resolver** (5 tests) — claim types route to the correct PRF_* artifact set
- **Risk-tier escalation gate** (6 tests) — R1/R2/R3/R4 tier policies behave as declared (auto-continue, await-approval, force-escalate, replay bypass)
- **Almanac cycle advancer** (4 tests) — madrid/paris/grolier/review cycles tick deterministically at correct intervals; same input → same state
- **Domain-pack dispatcher** (5 tests) — task type → pack mapping; tier ceiling enforcement; v3+v4 = 12 packs registered
- **Operator approval gate** (2 tests) — default-deny vs. auto-grant providers behave as declared
- **Operational modes** (3 tests) — advisory/replay_audit forbid execution; approval_gated only auto-runs R1; semi_autonomous auto-runs R1+R2
- **Tool permission matrix (v6)** (~10 tests) — pack permissions are deny-by-default; check function honours the matrix; R3 mutating requires approval
- **Sandbox policy (v6)** (4 tests) — trusted_internal / bounded_code_exec / external_network classes have correct rights
- **v6 routing** (5 tests) — task type → pack ID mapping resolves to registered packs

### 1.5 Type B regression tests in the runtime (~120 total)

These pin **what the schema declares**, not how a system behaves. They prevent silent edits to a constant; they do not prove anything is implemented:

- "registry has exactly 9 entries" — pins `VALIDATOR_REGISTRY.length === 9`
- "declares the full v6 16-service shared runtime list" — string equality on a constant array
- "manifest count matches the array length" — internal consistency of two constants
- "Sentra contract matches v4 JSON exactly" — deep-equal against a JSON file
- All 28 `gov-readiness.test.ts` tests — pin the scorecard text and integer scores (e.g. "A11oy scores 72/100") as static data

These are useful as anti-drift guards but **must not be cited as proof of implementation**. The v3 paper §5.2 already says this explicitly. ✅ keep.

---

## §2 — `szl-holdings/ouroboros-thesis` (papers + experiment harness)

**Commit:** `709d54d77b9c0bb9715050d3b51b7027811dbd0d`
**Contents:**
- `ouroboros-thesis-v2.md` (27 KB) + `.docx` — v2 paper source
- `ouroboros-runtime-contract.v2.json` (13 KB) — v2 schema spec
- `CITATION.cff` — properly formed citation file pointing at v2 DOI 10.5281/zenodo.19934129
- `v2/experiments/` — TypeScript harness with frontier-sweep, sync-bench, fixtures
- `v2/study/` — protocol, consent form, randomization for an audit-readability study

### 2.1 What's runnable here
- `v2/experiments/frontier-sweep/sweep.test.ts` — 3 unit tests on the Pareto extractor (computePareto). These do not depend on the runtime.
- `v2/experiments/frontier-sweep/sweep.ts` — full sweep harness, **but depends on `@szl-holdings/ouroboros: workspace:*`** which only resolves inside the platform monorepo. **In a fresh clone these experiments do not run.**

### 2.2 What v2 proves (already DOI-stamped at 10.5281/zenodo.19934129)
- Position paper v1 (DOI 10.5281/zenodo.19867281) and v2 empirical companion (DOI 10.5281/zenodo.19934129) are both real, cited, and live.
- v2 introduces the loop-budget Pareto frontier methodology and the audit-readability study protocol.

### 2.3 What v2 does NOT prove
- The Pareto sweep results themselves (results tables in v2 paper §5.1, §5.2, §5.3 are placeholders per the PAYLOAD.md README — the harness was shipped but not run-and-published).
- The audit-readability study (protocol exists; the actual study has not been run).

---

## §3 — The 7 product repos (a11oy, amaru, sentra, counsel, terra, vessels, carlota-jo)

**Verified by file listing on each:**

```
LICENSE
NOTICE
README.md
SECURITY.md
```

**Each repo contains exactly 4 files. Zero source code. Zero tests.**

These are **README-stage placeholders** establishing the brand and reserving the namespace. The README descriptions claim things ("recursive threat modeling", "sanctions screening", "AI-assisted underwriting") but no code in these repos backs the claims.

The v3 paper §7 limitation #4 already states this: *"the seven product repositories are README-stage placeholders at the time of writing."* ✅ accurate.

**For the paper:** these repos cannot be cited as evidence of anything except "the namespaces are reserved and the public READMEs match the platform's marketing." Do not claim implementation.

---

## §4 — `szl-holdings/szl-holdings-platform` (the big monorepo)

**Size:** 1.1 GB, 47 top-level directories
**Test files declared:** 400 (`.test.ts`, `.test.tsx`, `.spec.ts`)
**Top concentrations:**
- 86 tests in `artifacts/api-server/src/routes/__tests__`
- 77 tests in `artifacts/api-server/src/__tests__`
- 30 tests in `tests/e2e`
- 21 tests in `tests/api`
- 15 tests in `artifacts/api-server/src/lib/__tests__`
- 14 tests in `tests/components`

### 4.1 Critical finding — does the platform USE the Lutar runtime?

**No.** Searched every `package.json` outside `node_modules`:

```
$ grep -l '"@szl-holdings/ouroboros"' $(find . -name package.json | grep -v node_modules)
(no matches)
```

**No `package.json` declares `@szl-holdings/ouroboros` as a dependency.** The text "ouroboros" appears only in:
- `artifacts/api-server/src/routes/ouroboros.ts` — an HTTP route that returns marketing/manifest data about the Ouroboros runtime, not code that calls into it
- `routes/stephen.ts`, mobile founder pages, profile pages — display copy about you and the work
- `audit/inventory/media.json`, manifest JSONs — text references in manifests
- `scripts/github/...` — GitHub stargazing tooling

**There is no `lambda(`, `Λ`, `geometricMean`, or weighted-geometric aggregator implementation in the platform source.** The matches for `aggregator` are unrelated (CISO threat aggregator, log aggregator, signal aggregator — none are Λ).

### 4.2 Implication for v3 paper

This was correctly framed in v3 §7 limitation #4: *"They consume the runtime as a dependency; they do not constitute fielded validations of Λ."* But the audit is even stricter:

- **The platform repo does not currently consume the runtime as a dependency at all.** There is no `package.json` with `@szl-holdings/ouroboros` listed.
- The runtime is **published standalone**, ready to be consumed, and *would* work as a dependency — but the platform monorepo has not yet wired it in.

**Recommendation for v3 paper §7:** weaken claim #4 from "consume the runtime as a dependency" to "the seven product repositories are README-stage placeholders, and the platform monorepo references the runtime as a peer artifact but does not yet import it as a code dependency." This is the strictly-true statement the audit supports.

### 4.3 What the 400 platform tests DO prove

I did not run the full platform suite — installing 1.1 GB of deps and resolving the workspace would take significant time and is not needed for v3 (which is about Λ). What can be said *from file inventory alone*:

- A real production-shaped TypeScript monorepo exists, with API server, mobile app, multiple artifacts, e2e/api/component test partitions, biome+oxlint, turbo build, drizzle migrations, Playwright e2e setup.
- The `release:check` script in root `package.json` declares a multi-stage gate (verify env, verify claims, unit tests, smoke, mock audit, route audit, deps audit, brand check). The existence of this gate is a stronger artefact than a single test file because it shows production discipline.
- **None of this is evidence for Λ specifically.** It's evidence the surrounding business has substance, but the v3 paper is about Λ, not about the platform.

**Recommendation for v3 paper:** if the user wants to cite the platform at all, add a single sentence under "Surrounding work, not part of this paper's claims": *"The author also maintains a 1.1 GB TypeScript monorepo (`szl-holdings/szl-holdings-platform`) with ~400 test files spanning a production API server, e2e suite, and 8 product artifacts. That repository is engineering-in-progress and does not yet integrate the Λ runtime; it is mentioned only to clarify scope, not as evidence for the axioms in this paper."* — this is honest and forecloses any later "where's the platform?" question.

---

## §5 — What the v3 paper can claim, audit-supported

### 5.1 Claims fully supported by code that runs (✅ keep)
1. Λ definition: weighted geometric mean over 9 axes, log-domain implementation with explicit zero-pinning short-circuit.
2. The 22 axiom witnesses for A1, A2, A3, A4 + boundary, all green at commit `5f6ee65`.
3. The Egyptian decomposition `[1/3, 1/3, 1/9, 6×(1/27)]` sums to 1, is bit-exact reproducible, and is mathematically a multiset of unit fractions.
4. The AM-GM corollary holds numerically on the tested inputs.
5. The full ouroboros runtime ships 172 tests, all green, on a fresh clone with `pnpm install && npx vitest run`.
6. The runtime contract has Type A behavioural proofs for: proof-route resolution, risk-tier gating, almanac cycle advancement, domain-pack dispatch, operator approval, operational modes, v6 tool permission matrix, v6 sandbox policy, v6 routing.
7. v1 (DOI 10.5281/zenodo.19867281) and v2 (DOI 10.5281/zenodo.19934129) papers are real, cited, public, and connected via CITATION.cff.

### 5.2 Claims that need to be softened or qualified (⚠️ amend in v3)
1. **§7 #4 "no deployed product"** — strengthen: not only no deployed product, but the platform monorepo does not yet consume the runtime as a code dependency. (Audit found zero `package.json` references.)
2. **§5 wording about "the runtime ships eight modules"** — that's accurate at runtime level, but the paper should clarify these are TypeScript source modules with passing unit tests, not a deployed service.

### 5.3 Claims the user might be tempted to add but the audit does NOT support (❌ do not add)
1. ❌ "The platform validates Λ in production." — the platform doesn't import Λ.
2. ❌ "v4 validator registry / v6 16-service runtime are implemented as runnable services." — they're TypeScript constants with schema-regression tests. Type B, not Type A. Already correctly excluded from v3 claims.
3. ❌ "Audited by NYSTEC." — was procurement counseling, not audit. Already correctly stated in v3 §7 #3.
4. ❌ "Used by [any government agency]." — no such evidence. Empire APEX engagement was counseling.
5. ❌ "Production users / customers." — no evidence in any repo.

### 5.4 What can be added to v3 if you want more pages

**Only material the audit supports:**

1. **Expanded §5 (~2 extra pages)** — walk through 2-3 of the runtime's other Type A behavioural test groups (proof-route resolver; risk-tier gate; almanac cycle advancer). These are real, run, green. They surround Λ in the runtime that ships with the paper. They're not Λ proofs, but they show Λ lives inside a coherent runtime contract that has its own tests.

2. **Empirical sensitivity study (~3 extra pages, NEW CODE)** — I can write a Python script that calls Λ on tens of thousands of synthetic 9-axis points, plots Λ vs. arithmetic mean vs. min, plots the "single weak axis" property quantitatively, and ships the script in `papers/v3/experiments/`. Honest and reproducible. **This is new code, not from your repos — but it would be added under your authorship.**

3. **Reproducibility appendix (~1 extra page)** — exact pinned versions of node, pnpm, vitest; SHA-256 of `lutar-invariant-proof.test.ts`; SHA-256 of `package.json`; commit hash. Anyone can verify byte-for-byte.

**That gets us to ~14-15 pages of audit-supported content.** Not 30. Not "thesis-length." But every claim backed by code that runs.

---

## §6 — Recommendation

The most defensible v3 is **a tighter, expanded version of the current 8-page paper, growing to ~14-15 pages with audit-supported additions only:**

1. Keep the current 8 pages as-is (already audit-clean).
2. Add §5.x — three additional Type A test groups walked through (~2 pp).
3. Add §6 — empirical sensitivity study, written and run in this session (~3 pp).
4. Add Appendix A — full reproducibility manifest with file SHAs (~1 pp).
5. Strengthen §7 limitation #4 with the platform-doesn't-import-runtime finding.

**Do not add:**
- Lean mechanization (cannot verify here)
- Worked deployment case studies (no deployments)
- Comparison to "industry baselines" (no fielded comparison data)
- Anything about the platform consuming Λ (it doesn't yet)

This keeps the paper at "every page earns its place" and gives a clean Zenodo deposit.

---

## §7 — Confidence statement

I am confident in the §1.2 line-by-line proof analysis (read the source, ran the tests, count and pass rate match the LUTAR_EVIDENCE.md document and the commit message).

I am confident in the §3 product-repo-emptiness finding (file count is 4 per repo, listed exhaustively).

I am confident in the §4.1 platform-doesn't-import-runtime finding (grepped every `package.json` outside `node_modules`).

I did NOT run the 400 platform tests in this audit. The §4.3 statement is based on file inventory and the root-level `package.json` script declarations, not on having run them. This is a known limitation of this audit pass; happy to run any subset of platform tests on request.
