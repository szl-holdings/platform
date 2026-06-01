# 62 — CURSOR RE-INSTILL TARGET LIST (ordered work queue by Space)

**Definition:** A re-instill target is a MERGED Cursor PR whose substantive content (gates, proofs, features, anatomy, codex, pages, UDS, doctrine, design, fixes) landed in a Space-feeding GitHub repo but is **NOT present in the currently-deployed HF Space**, because the Spaces were rebuilt independently from Replit / hand-authored commits.

**Total re-instill targets: 57** across 7 Spaces.

Priority order: **a11oy → amaru → sentra → vessels → rosie → uds-demo → README**.

## → Space: `a11oy`  (live HEAD 78ce32f6 (packet baseline be0ba928))
*29 PRs · +22,963/-2,373 · 254 file-changes*

| Rank | PR | Cat | Title | +/- | Key files | Integration note |
|------|----|-----|-------|-----|-----------|-------------------|
| 1 | [#134](https://github.com/szl-holdings/a11oy/pull/134) | doctrine | feat: ecosystem OS doctrine — anatomy/formula/runtime m | +5127/-12 | `README.md`, `benchmarks/benchmark-map.json`, `docs/AUTONOMOUS_LEARNING_DOCTRINE.md`, `doc | Sync doctrine doc into Space README/console copy |
| 2 | [#130](https://github.com/szl-holdings/a11oy/pull/130) | feature | feat(docs): ecosystem stage matrix (Cursor handoff) | +3759/-1 | `.github/workflows/tests.yml`, `docs/ECOSYSTEM_STAGE_MATRIX.md`, `docs/ecosystem-stage-mat | Port feature code into Space build (Dockerfile vendor or SPA route) |
| 3 | [#75](https://github.com/szl-holdings/a11oy/pull/75) | page | docs(showcase): polish Hugging Face diligence packet | +3552/-689 | `.github/workflows/huggingface.yml`, `CHANGELOG.md`, `README.md`, `docs/SERIES_A_DILIGENCE | Add page/route/showcase to Space SPA |
| 4 | [#117](https://github.com/szl-holdings/a11oy/pull/117) | gate | feat(gates): wire 8 GREEN Lean theorems as TypeScript g | +3331/-0 | `src/gates/composition_overhead.ts`, `src/gates/css_bridge.ts`, `src/gates/delayed_choice_ | Vendor gate source + wire into Space build / API surface |
| 5 | [#69](https://github.com/szl-holdings/a11oy/pull/69) | feature | build(ops): operationalize A11oy GitHub and Hugging Fac | +3214/-112 | `.github/workflows/doctrine.yml`, `.github/workflows/huggingface.yml`, `.gitignore`, `CHAN | Port feature code into Space build (Dockerfile vendor or SPA route) |
| 6 | [#83](https://github.com/szl-holdings/a11oy/pull/83) | gate | feat: harden investor demo, HF showcase, and policy gat | +1698/-35 | `.github/workflows/doctrine.yml`, `.github/workflows/huggingface.yml`, `.github/workflows/ | Vendor gate source + wire into Space build / API surface |
| 7 | [#139](https://github.com/szl-holdings/a11oy/pull/139) | feature | docs: harden investor demo and HF showcase | +405/-72 | `.github/workflows/tests.yml`, `README.md`, `docs/ECOSYSTEM.md`, `docs/INVESTOR_DEMO.md` + | Port feature code into Space build (Dockerfile vendor or SPA route) |
| 8 | [#123](https://github.com/szl-holdings/a11oy/pull/123) | codex | feat(a11oy): Hugging Face ecosystem manifest (Cursor) | +363/-690 | `README.md`, `docs/MATH_LINEAGE_RUNTIME_MAP.md`, `docs/huggingface-ecosystem-manifest.json | Ship manifest/registry JSON into Space static assets |
| 9 | [#118](https://github.com/szl-holdings/a11oy/pull/118) | gate | feat(a11oy): runtime functional upgrades — formulas exp | +238/-25 | `.github/dependabot.yml`, `.github/workflows/slsa.yml`, `.github/workflows/tests.yml`, `RE | Vendor gate source + wire into Space build / API surface |
| 10 | [#136](https://github.com/szl-holdings/a11oy/pull/136) | gate | ci: Doctrine v7 §14 namespace-leak PR gate (post-cursor | +238/-0 | `.github/workflows/namespace-leak-check.yml`, `.github/workflows/tests.yml`, `scripts/chec | Vendor gate source + wire into Space build / API surface |
| 11 | [#129](https://github.com/szl-holdings/a11oy/pull/129) | proof | feat: theorem-to-runtime manifest — machine-readable ev | +205/-0 | `docs/theorem-runtime-manifest.json`, `package.json`, `scripts/build_operational_payload.p | Carry proof/manifest artifact into Space evidence bundle |
| 12 | [#74](https://github.com/szl-holdings/a11oy/pull/74) | gate | Add operational validation gate | +106/-63 | `.github/workflows/operational.yml`, `.gitignore`, `artifacts/a11oy-uds/build-attestations | Vendor gate source + wire into Space build / API surface |
| 13 | [#112](https://github.com/szl-holdings/a11oy/pull/112) | proof | docs(coordination): lutar-lean doc-comment drift proxy  | +106/-0 | `coordination/LUTAR_LEAN_DOC_COMMENT_API_DRIFT_STATUS_2026-05-29.md`, `coordination/proxy- | Carry proof/manifest artifact into Space evidence bundle |
| 14 | [#102](https://github.com/szl-holdings/a11oy/pull/102) | proof | docs(coordination): lutar-lean API drift proxy source f | +97/-0 | `coordination/LUTAR_LEAN_SIMPLE_API_DRIFT_STATUS_2026-05-29.md`, `coordination/proxy-patch | Carry proof/manifest artifact into Space evidence bundle |
| 15 | [#132](https://github.com/szl-holdings/a11oy/pull/132) | gate | feat: emit DSSE receipts from formula gates (Cursor han | +94/-303 | `packages/policy/src/gates/__tests__/policy_gates.test.ts`, `packages/policy/src/gates/ind | Vendor gate source + wire into Space build / API surface |
| 16 | [#94](https://github.com/szl-holdings/a11oy/pull/94) | uds | docs: UDS frontier gap map (Cursor proxy) | +90/-1 | `docs/INVESTOR_DEMO.md`, `docs/UDS_FRONTIER_GAP_MAP.md`, `huggingface/README.md`, `scripts | Mirror UDS bundle docs/scripts into uds-demo Space |
| 17 | [#68](https://github.com/szl-holdings/a11oy/pull/68) | fix | SUPERSEDED: fix(core): restore KS18 parity cover | +83/-14 | `CHANGELOG.md`, `web/packages/a11oy-core/src/quantum/__tests__/kochen-specker-18.test.ts`, | Re-apply fix in Space build (verify regression not reintroduced) |
| 18 | [#89](https://github.com/szl-holdings/a11oy/pull/89) | gate | feat: harden investor demo, HF showcase, policy gates,  | +79/-45 | `.github/workflows/fuzz.yml`, `.github/workflows/operational.yml`, `README.md`, `artifacts | Vendor gate source + wire into Space build / API surface |
| 19 | [#127](https://github.com/szl-holdings/a11oy/pull/127) | doctrine | docs: ancient texts formula lineage — provable provenan | +78/-1 | `docs/ANCIENT_TEXTS_FORMULA_LINEAGE.md`, `docs/INVESTOR_DEMO.md`, `huggingface/README.md`, | Sync doctrine doc into Space README/console copy |
| 20 | [#105](https://github.com/szl-holdings/a11oy/pull/105) | feature | feat(a11oy): harden investor demo + HF showcase (Cursor | +31/-24 | `README.md`, `docs/INVESTOR_DEMO.md`, `huggingface/README.md`, `package.json` +2 | Port feature code into Space build (Dockerfile vendor or SPA route) |
| 21 | [#93](https://github.com/szl-holdings/a11oy/pull/93) | feature | docs: add deep-dive HF Space showcase link | +16/-0 | `README.md` | Port feature code into Space build (Dockerfile vendor or SPA route) |
| 22 | [#108](https://github.com/szl-holdings/a11oy/pull/108) | gate | test(a11oy): harden policy gate formula instillation (C | +11/-274 | `.github/workflows/tests.yml`, `package.json`, `packages/policy/src/gates/index.ts` | Vendor gate source + wire into Space build / API surface |
| 23 | [#133](https://github.com/szl-holdings/a11oy/pull/133) | gate | docs: clarify adversarial robustness gate scope (Cursor | +11/-1 | `.github/workflows/tests.yml`, `packages/policy/src/gates/adversarialRobustness_gate.ts` | Vendor gate source + wire into Space build / API surface |
| 24 | [#99](https://github.com/szl-holdings/a11oy/pull/99) | page | docs: avoid linking private HF deep-dive space (Cursor  | +9/-3 | `README.md` | Add page/route/showcase to Space SPA |
| 25 | [#92](https://github.com/szl-holdings/a11oy/pull/92) | gate | docs: clarify adversarial robustness gate scope [PhD au | +8/-1 | `packages/policy/src/gates/adversarialRobustness_gate.ts` | Vendor gate source + wire into Space build / API surface |
| 26 | [#103](https://github.com/szl-holdings/a11oy/pull/103) | gate | docs(a11oy): clarify adversarial robustness gate scope  | +8/-1 | `packages/policy/src/gates/adversarialRobustness_gate.ts` | Vendor gate source + wire into Space build / API surface |
| 27 | [#119](https://github.com/szl-holdings/a11oy/pull/119) | doctrine | fix(slsa): truth-correction — L3 badges → L1 (SBOM + DC | +4/-4 | `.github/workflows/slsa.yml`, `README.md`, `package.json` | Sync doctrine doc into Space README/console copy |
| 28 | [#107](https://github.com/szl-holdings/a11oy/pull/107) | uds | ci(a11oy): operational readiness validation + UDS bundl | +2/-1 | `.github/workflows/operational.yml`, `huggingface/README.md` | Mirror UDS bundle docs/scripts into uds-demo Space |
| 29 | [#111](https://github.com/szl-holdings/a11oy/pull/111) | fix | fix(dependabot): remove missing github-actions label | +0/-1 | `.github/dependabot.yml` | Re-apply fix in Space build (verify regression not reintroduced) |

## → Space: `amaru`  (live HEAD 8b7f0364 (packet 51b0fc22))
*3 PRs · +4,018/-84 · 26 file-changes*

| Rank | PR | Cat | Title | +/- | Key files | Integration note |
|------|----|-----|-------|-----|-----------|-------------------|
| 1 | [#56](https://github.com/szl-holdings/amaru/pull/56) | feature | feat: standalone web frontend + HF Spaces deployment +  | +3983/-84 | `.gitignore`, `AGENTS.md`, `deploy/huggingface/Dockerfile`, `deploy/huggingface/README.md` | Port feature code into Space build (Dockerfile vendor or SPA route) |
| 2 | [#55](https://github.com/szl-holdings/amaru/pull/55) | feature | Add AGENTS.md with Cursor Cloud development instruction | +31/-0 | `AGENTS.md` | Port feature code into Space build (Dockerfile vendor or SPA route) |
| 3 | [#64](https://github.com/szl-holdings/amaru/pull/64) | feature | chore(license): add SPDX-License-Identifier headers (am | +4/-0 | `deploy/huggingface/serve.py` | Port feature code into Space build (Dockerfile vendor or SPA route) |

## → Space: `sentra`  (live HEAD 998aabb9)
*2 PRs · +2,585/-339 · 103 file-changes*

| Rank | PR | Cat | Title | +/- | Key files | Integration note |
|------|----|-----|-------|-----|-----------|-------------------|
| 1 | [#56](https://github.com/szl-holdings/sentra/pull/56) | feature | feat: add standalone dev environment with workspace stu | +1944/-339 | `.github/workflows/slsa.yml`, `.gitignore`, `AGENTS.md`, `biome.json` +96 | Port feature code into Space build (Dockerfile vendor or SPA route) |
| 2 | [#65](https://github.com/szl-holdings/sentra/pull/65) | feature | feat(forecasts): witnessed forecasting with Madhava err | +641/-0 | `src/forecasts/__init__.py`, `src/forecasts/test_witnessed.py`, `src/forecasts/witnessed.p | Port feature code into Space build (Dockerfile vendor or SPA route) |

## → Space: `vessels`  (live HEAD 2c6e80ae)
*3 PRs · +4,174/-3 · 102 file-changes*

| Rank | PR | Cat | Title | +/- | Key files | Integration note |
|------|----|-----|-------|-----|-----------|-------------------|
| 1 | [#41](https://github.com/szl-holdings/vessels/pull/41) | feature | feat: set up standalone dev environment with workspace  | +4159/-0 | `.gitignore`, `biome.json`, `package.json`, `pnpm-lock.yaml` +96 | Port feature code into Space build (Dockerfile vendor or SPA route) |
| 2 | [#51](https://github.com/szl-holdings/vessels/pull/51) | feature | docs: add deep-dive HF Space showcase link | +13/-0 | `README.md` | Port feature code into Space build (Dockerfile vendor or SPA route) |
| 3 | [#52](https://github.com/szl-holdings/vessels/pull/52) | doctrine | fix(docs): repair broken URLs in README [doctrine v6 li | +2/-3 | `README.md` | Sync doctrine doc into Space README/console copy |

## → Space: `rosie`  (live HEAD 46804b59)
*2 PRs · +56/-0 · 3 file-changes*

| Rank | PR | Cat | Title | +/- | Key files | Integration note |
|------|----|-----|-------|-----|-----------|-------------------|
| 1 | [#32](https://github.com/szl-holdings/rosie/pull/32) | feature | Add AGENTS.md with Cursor Cloud development instruction | +48/-0 | `AGENTS.md` | Port feature code into Space build (Dockerfile vendor or SPA route) |
| 2 | [#39](https://github.com/szl-holdings/rosie/pull/39) | feature | chore(license): add SPDX-License-Identifier headers (ro | +8/-0 | `src/axis-value-option.ts`, `src/khipu-receipt.ts` | Port feature code into Space build (Dockerfile vendor or SPA route) |

## → Space: `uds-demo`  (live HEAD 096f8dac)
*3 PRs · +43/-2 · 3 file-changes*

| Rank | PR | Cat | Title | +/- | Key files | Integration note |
|------|----|-----|-------|-----|-----------|-------------------|
| 1 | [#31](https://github.com/szl-holdings/uds-mesh/pull/31) | feature | Add AGENTS.md with Cursor Cloud development instruction | +37/-0 | `AGENTS.md` | Port feature code into Space build (Dockerfile vendor or SPA route) |
| 2 | [#45](https://github.com/szl-holdings/uds-mesh/pull/45) | uds | chore(license): add SPDX-License-Identifier headers (ud | +4/-0 | `uds_v18_24_substrate.py` | Mirror UDS bundle docs/scripts into uds-demo Space |
| 3 | [#44](https://github.com/szl-holdings/uds-mesh/pull/44) | fix | ci(release-please): update pinned .github SHA — fix wor | +2/-2 | `.github/workflows/release-please.yml` | Re-apply fix in Space build (verify regression not reintroduced) |

## → Space: `README`  (live HEAD d758f7d5 (packet 97b69bd8))
*15 PRs · +8,384/-29 · 44 file-changes*

| Rank | PR | Cat | Title | +/- | Key files | Integration note |
|------|----|-----|-------|-----|-----------|-------------------|
| 1 | [#74](https://github.com/szl-holdings/.github/pull/74) | anatomy | feat(anatomy-alive): Perplexity cross-organ integration | +3136/-0 | `coordination/ANATOMY_ALIVE_HARNESS.md`, `coordination/anatomy_alive/README.md`, `coordina | Reflect organ/anatomy content in Space landing + console |
| 2 | [#40](https://github.com/szl-holdings/szl-brand/pull/40) | feature | feat: Transform szl-brand into a real Python SDK with p | +1780/-21 | `.gitignore`, `AGENTS.md`, `pyproject.toml`, `src/szl_brand/__init__.py` +10 | Port feature code into Space build (Dockerfile vendor or SPA route) |
| 3 | [#86](https://github.com/szl-holdings/.github/pull/86) | feature | docs(coordination): CURSOR_MASTER_DIRECTIVE — Series-A  | +683/-0 | `coordination/CURSOR_MASTER_DIRECTIVE.md` | Port feature code into Space build (Dockerfile vendor or SPA route) |
| 4 | [#97](https://github.com/szl-holdings/.github/pull/97) | doctrine | docs(coordination): Cursor master directive FINAL 2026- | +525/-0 | `coordination/CURSOR_MASTER_DIRECTIVE_FINAL_2026-05-30.md` | Sync doctrine doc into Space README/console copy |
| 5 | [#83](https://github.com/szl-holdings/.github/pull/83) | proof | feat(coordination): Cursor instillation operational pla | +472/-0 | `coordination/CURSOR_INSTILLATION_OPERATIONAL_PLAN.md` | Carry proof/manifest artifact into Space evidence bundle |
| 6 | [#82](https://github.com/szl-holdings/.github/pull/82) | feature | feat(coordination): CTO+PM consolidated 30-day operatio | +469/-0 | `coordination/CURSOR_CTO_PM_OPERATIONAL_PLAN.md` | Port feature code into Space build (Dockerfile vendor or SPA route) |
| 7 | [#89](https://github.com/szl-holdings/.github/pull/89) | feature | [CURSOR DIRECTIVE] INSTILL ALL THEORIES — Tier 0-4 ship | +309/-0 | `cursor-directives/CURSOR_INSTILL_ALL_THEORIES_2026-05-29.md` | Port feature code into Space build (Dockerfile vendor or SPA route) |
| 8 | [#90](https://github.com/szl-holdings/.github/pull/90) | feature | [CURSOR MASTER] ONE-OF-ONE Directive — 28 PhD agents co | +262/-0 | `cursor-directives/CURSOR_ONE_OF_ONE_MASTER_2026-05-30.md` | Port feature code into Space build (Dockerfile vendor or SPA route) |
| 9 | [#73](https://github.com/szl-holdings/.github/pull/73) | uds | chore(coordination): UDS v0.3.0 release-cut directive f | +238/-0 | `coordination/CURSOR_RELEASE_PAYLOAD_ADDENDUM.md` | Mirror UDS bundle docs/scripts into uds-demo Space |
| 10 | [#72](https://github.com/szl-holdings/.github/pull/72) | anatomy | chore(coordination): Cursor Phase 1 — innovate & evolve | +176/-0 | `coordination/CURSOR_INNOVATE_AND_EVOLVE_PHASE_1.md` | Reflect organ/anatomy content in Space landing + console |
| 11 | [#79](https://github.com/szl-holdings/.github/pull/79) | doctrine | chore(coordination): Cursor full throttle — all tracks  | +142/-0 | `coordination/CURSOR_FULL_THROTTLE_NO_PHASES.md` | Sync doctrine doc into Space README/console copy |
| 12 | [#68](https://github.com/szl-holdings/.github/pull/68) | anatomy | chore(coordination): P0 directive — make anatomy real + | +112/-0 | `coordination/CURSOR_DIRECTIVE_ANATOMY_REAL_2026-05-29.md` | Reflect organ/anatomy content in Space landing + console |
| 13 | [#39](https://github.com/szl-holdings/szl-brand/pull/39) | feature | Add AGENTS.md with Cursor Cloud development environment | +41/-0 | `AGENTS.md` | Port feature code into Space build (Dockerfile vendor or SPA route) |
| 14 | [#56](https://github.com/szl-holdings/.github/pull/56) | feature | docs: add AGENTS.md with Cursor Cloud development instr | +34/-0 | `AGENTS.md` | Port feature code into Space build (Dockerfile vendor or SPA route) |
| 15 | [#81](https://github.com/szl-holdings/.github/pull/81) | doctrine | fix(docs): repair broken anatomy PDF links in org profi | +5/-8 | `profile/README.md` | Sync doctrine doc into Space README/console copy |
