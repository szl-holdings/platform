# 60 — CURSOR PR FULL INVENTORY (every PR, all fields)

**Scope:** Every Cursor-attributable PR across all szl-holdings repos. Cursor commits land via the founder account `stephenlutar2-hash`; attribution is by branch prefix `cursor/`, proxy branches `perplexity/cursor-*` / `chore/cursor-*`, and titles containing "Cursor".

**Totals:** 111 Cursor PRs · 95 MERGED · 2 OPEN · 14 CLOSED. Merged diff: +73,538 / -4,231 across 1,118 file-changes.

**Live HF SHAs (current HEAD):** a11oy=78ce32f6 (packet baseline be0ba928) · amaru=8b7f0364 (packet 51b0fc22) · sentra=998aabb9 · vessels=2c6e80ae · rosie=46804b59 · uds-demo=096f8dac · README=d758f7d5 (packet 97b69bd8)

**Liveness method:** HF Spaces are independent git repos rebuilt by hand / from Replit pulls (verified: a11oy Space ships a compiled 133-page console SPA + Dockerfile, NOT the GitHub repo `src/gates/*.ts`, `packages/policy/`, `docs/*`, or theorem manifests). A merged Cursor PR into a Space-feeding repo is therefore **NOT automatically live** — its source must be re-instilled into the Space build.

| Repo | PR# | Title | State | Merged | Branch→Base | Cat | Dest Space | +/- | Files | Merge SHA | Live? | Re-instill | URL |
|------|-----|-------|-------|--------|-------------|-----|-----------|-----|-------|-----------|-------|-----------|-----|
| a11oy | 67 | Document SZL org repository map | MERGED | 2026-05-29 | cursor/organize-org-repo→main | other | a11oy | +154/-1 | 4 | ee6e17b9c3 | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/a11oy/pull/67) |
| a11oy | 68 | SUPERSEDED: fix(core): restore KS18 parity cover | MERGED | 2026-05-29 | cursor/fix-ks18-cover-64→main | fix | a11oy | +83/-14 | 3 | a2a0ef8349 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/68) |
| a11oy | 69 | build(ops): operationalize A11oy GitHub and Hugging Face payload hub | MERGED | 2026-05-29 | cursor/fix-ks18-cover-cl→main | feature | a11oy | +3214/-112 | 28 | 4a0591d81e | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/69) |
| a11oy | 70 | Improve org repository sync helper | MERGED | 2026-05-29 | cursor/import-replit-pro→main | other | a11oy | +4606/-13 | 59 | 43104ecfc5 | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/a11oy/pull/70) |
| a11oy | 71 | chore: set up dev environment with test infrastructure | MERGED | 2026-05-29 | cursor/dev-env-setup-db9→main | infra | a11oy | +9025/-28 | 13 | 1d9ab5fecd | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/a11oy/pull/71) |
| a11oy | 74 | Add operational validation gate | MERGED | 2026-05-29 | cursor/operational-valid→main | gate | a11oy | +106/-63 | 5 | a6a537bbe0 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/74) |
| a11oy | 75 | docs(showcase): polish Hugging Face diligence packet | MERGED | 2026-05-29 | cursor/hf-showcase-643f→main | page | a11oy | +3552/-689 | 13 | 831ee29876 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/75) |
| a11oy | 83 | feat: harden investor demo, HF showcase, and policy gates | MERGED | 2026-05-29 | cursor/investor-demo-rea→main | gate | a11oy | +1698/-35 | 29 | 30421b70b0 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/83) |
| a11oy | 89 | feat: harden investor demo, HF showcase, policy gates, and UDS ops | MERGED | 2026-05-29 | cursor/investor-demo-rea→main | gate | a11oy | +79/-45 | 9 | 6aca5bbd37 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/89) |
| a11oy | 91 | docs: clarify adversarial robustness gate scope | CLOSED |  | cursor/investor-demo-rea→main | gate | a11oy | +8/-1 | 1 | — | N/A (not merged) | — | [link](https://github.com/szl-holdings/a11oy/pull/91) |
| a11oy | 92 | docs: clarify adversarial robustness gate scope [PhD audit] | MERGED | 2026-05-29 | cursor/phd-audit-adversa→main | gate | a11oy | +8/-1 | 1 | 663e7c3eb1 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/92) |
| a11oy | 93 | docs: add deep-dive HF Space showcase link | MERGED | 2026-05-29 | cursor/perplexity-deep-d→main | feature | a11oy | +16/-0 | 1 | 3b120ea400 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/93) |
| a11oy | 94 | docs: UDS frontier gap map (Cursor proxy) | MERGED | 2026-05-30 | cursor/uds-frontier-gap-→main | uds | a11oy | +90/-1 | 5 | c918745299 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/94) |
| a11oy | 99 | docs: avoid linking private HF deep-dive space (Cursor proxy) | MERGED | 2026-05-30 | cursor/hf-deep-dive-stag→main | page | a11oy | +9/-3 | 1 | 1290e19821 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/99) |
| a11oy | 100 | docs(coordination): latest Cursor proxy handshake (2026-05-29) | MERGED | 2026-05-30 | cursor/latest-proxy-hand→main | coord/docs | a11oy | +77/-0 | 1 | 2c847afac6 | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/a11oy/pull/100) |
| a11oy | 101 | docs(coordination): agi-forecast FG-pipeline proxy source files | MERGED | 2026-05-30 | cursor/proxy-agi-forecas→main | coord/docs | a11oy | +1910/-0 | 2 | fc3c9f93da | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/a11oy/pull/101) |
| a11oy | 102 | docs(coordination): lutar-lean API drift proxy source files | MERGED | 2026-05-30 | cursor/proxy-lutar-simpl→main | proof | a11oy | +97/-0 | 2 | c1de4044b9 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/102) |
| a11oy | 103 | docs(a11oy): clarify adversarial robustness gate scope (Cursor proxy) | MERGED | 2026-05-30 | cursor/adversarial-robus→main | gate | a11oy | +8/-1 | 1 | 49ea0d67d7 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/103) |
| a11oy | 104 | docs(coordination): Cursor daily status 2026-05-29 | MERGED | 2026-05-30 | cursor/coordination-stat→main | coord/docs | a11oy | +62/-0 | 1 | 00f472597d | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/a11oy/pull/104) |
| a11oy | 105 | feat(a11oy): harden investor demo + HF showcase (Cursor proxy, 25 file | MERGED | 2026-05-30 | cursor/investor-demo-rea→main | feature | a11oy | +31/-24 | 6 | fceaa50cc4 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/105) |
| a11oy | 106 | docs(coordination): Cursor latest status (lutar + agi) | MERGED | 2026-05-30 | cursor/latest-status-lut→main | coord/docs | a11oy | +58/-0 | 1 | 2ef8fe5b1c | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/a11oy/pull/106) |
| a11oy | 107 | ci(a11oy): operational readiness validation + UDS bundle docs (Cursor  | MERGED | 2026-05-30 | cursor/operational-audit→main | uds | a11oy | +2/-1 | 2 | 3bacba1e7d | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/107) |
| a11oy | 108 | test(a11oy): harden policy gate formula instillation (Cursor proxy) | MERGED | 2026-05-30 | cursor/policy-gates-hard→main | gate | a11oy | +11/-274 | 3 | 7e81a915ce | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/108) |
| a11oy | 109 | [DUPE — close, see -scope-2f18] adversarial robustness clarify | CLOSED |  | cursor/adversarial-robus→main | other | a11oy | +8/-1 | 1 | — | N/A (not merged) | — | [link](https://github.com/szl-holdings/a11oy/pull/109) |
| a11oy | 111 | fix(dependabot): remove missing github-actions label | MERGED | 2026-05-30 | cursor/fix-dependabot-la→main | fix | a11oy | +0/-1 | 1 | e569b679fa | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/111) |
| a11oy | 112 | docs(coordination): lutar-lean doc-comment drift proxy source files | MERGED | 2026-05-30 | cursor/proxy-lutar-doc-c→main | proof | a11oy | +106/-0 | 2 | 5ae492c533 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/112) |
| a11oy | 113 | docs(coordination): AdversarialRobustness chain-scope proxy source fil | MERGED | 2026-05-30 | cursor/proxy-lutar-robus→main | coord/docs | a11oy | +108/-0 | 2 | 7c2ab88149 | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/a11oy/pull/113) |
| a11oy | 117 | feat(gates): wire 8 GREEN Lean theorems as TypeScript gates + vitest t | MERGED | 2026-05-30 | cursor/wire-8-green-theo→main | gate | a11oy | +3331/-0 | 16 | 5437ae7eb3 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/117) |
| a11oy | 118 | feat(a11oy): runtime functional upgrades — formulas exported, TH4-TH7  | MERGED | 2026-05-30 | cursor/frontier-function→main | gate | a11oy | +238/-25 | 21 | f1d215122f | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/118) |
| a11oy | 119 | fix(slsa): truth-correction — L3 badges → L1 (SBOM + DCO) (Cursor doct | MERGED | 2026-05-30 | cursor/slsa-truth-correc→main | doctrine | a11oy | +4/-4 | 3 | 1254dc4f5f | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/119) |
| a11oy | 120 | docs(coordination): Cursor current one-of-one execution status | MERGED | 2026-05-30 | cursor/current-status-on→main | coord/docs | a11oy | +53/-0 | 1 | f6bb9a56c4 | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/a11oy/pull/120) |
| a11oy | 123 | feat(a11oy): Hugging Face ecosystem manifest (Cursor) | MERGED | 2026-05-30 | cursor/hf-ecosystem-mani→main | codex | a11oy | +363/-690 | 8 | 89ab7fca8f | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/123) |
| a11oy | 127 | docs: ancient texts formula lineage — provable provenance, doctrine v6 | MERGED | 2026-05-30 | cursor/ancient-texts-for→main | doctrine | a11oy | +78/-1 | 5 | a36a0fd0e8 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/127) |
| a11oy | 129 | feat: theorem-to-runtime manifest — machine-readable evidence map (Cur | MERGED | 2026-05-30 | cursor/theorem-runtime-m→main | proof | a11oy | +205/-0 | 5 | 0d0bc23cab | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/129) |
| a11oy | 130 | feat(docs): ecosystem stage matrix (Cursor handoff) | MERGED | 2026-05-30 | cursor/ecosystem-stage-m→main | feature | a11oy | +3759/-1 | 10 | b6022993d4 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/130) |
| a11oy | 132 | feat: emit DSSE receipts from formula gates (Cursor handoff) | MERGED | 2026-05-30 | cursor/policy-gate-recei→main | gate | a11oy | +94/-303 | 3 | eb1901d00b | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/132) |
| a11oy | 133 | docs: clarify adversarial robustness gate scope (Cursor PhD audit) | MERGED | 2026-05-30 | cursor/adversarial-robus→main | gate | a11oy | +11/-1 | 2 | d04117bd1d | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/133) |
| a11oy | 134 | feat: ecosystem OS doctrine — anatomy/formula/runtime map, benchmark m | MERGED | 2026-05-30 | cursor/ecosystem-os-doct→main | doctrine | a11oy | +5127/-12 | 46 | c0b9525c3a | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/134) |
| a11oy | 136 | ci: Doctrine v7 §14 namespace-leak PR gate (post-cursor-drift audit) | MERGED | 2026-05-30 | audit/namespace-leak-ci-→main | gate | a11oy | +238/-0 | 3 | 0c4a554acd | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/136) |
| a11oy | 139 | docs: harden investor demo and HF showcase | MERGED | 2026-05-30 | cursor/evidence-first-in→main | feature | a11oy | +405/-72 | 20 | 77c90305b4 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/a11oy/pull/139) |
| a11oy | 142 | docs: evidence-first investor demo (Cursor handoff, unsigned) | CLOSED |  | cursor/evidence-first-in→main | page | a11oy | +224/-34 | 17 | — | N/A (not merged) | — | [link](https://github.com/szl-holdings/a11oy/pull/142) |
| .github | 54 | chore(coordination): cursor PR queue handoff 2026-05-29 | MERGED | 2026-05-29 | chore/cursor-handoff-202→main | coord/docs | README | +126/-0 | 1 | 9c627800e9 | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/.github/pull/54) |
| .github | 55 | chore(coordination): cursor roadmap v2 — walk the thesis, innovate + e | MERGED | 2026-05-29 | chore/cursor-roadmap-v2→main | coord/docs | README | +697/-0 | 2 | 420a61d751 | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/.github/pull/55) |
| .github | 56 | docs: add AGENTS.md with Cursor Cloud development instructions | MERGED | 2026-05-29 | cursor/setup-dev-env-24a→main | feature | README | +34/-0 | 1 | 1f4df1f2b2 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/.github/pull/56) |
| .github | 57 | chore(coordination): cursor credentials + access (HF_TOKEN now on all  | MERGED | 2026-05-29 | chore/cursor-credentials→main | coord/docs | README | +177/-0 | 1 | e51b7b7b5d | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/.github/pull/57) |
| .github | 58 | chore(coordination): cursor MCP setup for HF | MERGED | 2026-05-29 | chore/cursor-mcp-hf-setu→main | infra | README | +389/-0 | 1 | 05205f077b | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/.github/pull/58) |
| .github | 67 | chore(coordination): P0 directive for Cursor — instill 5 formulas toda | MERGED | 2026-05-29 | chore/cursor-directive-f→main | coord/docs | README | +99/-0 | 1 | 3c335ffb74 | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/.github/pull/67) |
| .github | 68 | chore(coordination): P0 directive — make anatomy real + operational | MERGED | 2026-05-29 | chore/cursor-directive-a→main | anatomy | README | +112/-0 | 1 | ce4b77855b | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/.github/pull/68) |
| .github | 71 | chore(coordination): cursor wake-up — 7 PRs merged + status check | MERGED | 2026-05-30 | chore/cursor-wake-up-202→main | coord/docs | README | +128/-0 | 1 | 1a08601eee | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/.github/pull/71) |
| .github | 72 | chore(coordination): Cursor Phase 1 — innovate & evolve, anatomy-alive | MERGED | 2026-05-30 | chore/cursor-phase-1-inn→main | anatomy | README | +176/-0 | 1 | 38a93c7dfa | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/.github/pull/72) |
| .github | 73 | chore(coordination): UDS v0.3.0 release-cut directive for Cursor | MERGED | 2026-05-30 | chore/cursor-release-pay→main | uds | README | +238/-0 | 1 | 997d430ef1 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/.github/pull/73) |
| .github | 74 | feat(anatomy-alive): Perplexity cross-organ integration harness [Phase | MERGED | 2026-05-29 | cursor/perplexity-anatom→main | anatomy | README | +3136/-0 | 17 | 51a0f351e7 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/.github/pull/74) |
| .github | 75 | feat(coordination): CURSOR_AGI_FORECAST_OPERATIONAL — agi-forecast com | OPEN |  | cursor-agi-forecast-oper→main | feature | README | +556/-0 | 1 | — | N/A (not merged) | — | [link](https://github.com/szl-holdings/.github/pull/75) |
| .github | 76 | chore(coordination): proxy Cursor's daily-status to .github | MERGED | 2026-05-30 | chore/proxy-cursor-daily→main | coord/docs | README | +62/-0 | 1 | e06ac1ad21 | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/.github/pull/76) |
| .github | 77 | chore(coordination): clarify Cursor write access (org app has it; runt | MERGED | 2026-05-30 | chore/cursor-write-acces→main | coord/docs | README | +61/-0 | 1 | 012f045736 | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/.github/pull/77) |
| .github | 78 | chore(coordination): Cursor Phase 2 — innovate & evolve, full Series-A | MERGED | 2026-05-30 | chore/cursor-phase-2-inn→main | coord/docs | README | +151/-0 | 1 | a232c2220b | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/.github/pull/78) |
| .github | 79 | chore(coordination): Cursor full throttle — all tracks parallel, doctr | MERGED | 2026-05-30 | chore/cursor-full-thrott→main | doctrine | README | +142/-0 | 1 | 0d6b894483 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/.github/pull/79) |
| .github | 80 | chore(coordination): Cursor work NOW — org profile 404s + full-throttl | MERGED | 2026-05-30 | chore/cursor-work-now→main | coord/docs | README | +62/-0 | 1 | 7cfe725a05 | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/.github/pull/80) |
| .github | 81 | fix(docs): repair broken anatomy PDF links in org profile README [doct | MERGED | 2026-05-29 | cursor/perplexity-fix-or→main | doctrine | README | +5/-8 | 1 | b013c41502 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/.github/pull/81) |
| .github | 82 | feat(coordination): CTO+PM consolidated 30-day operational plan for Cu | MERGED | 2026-05-30 | cursor/perplexity-cto-pm→main | feature | README | +469/-0 | 1 | 256b57eecf | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/.github/pull/82) |
| .github | 83 | feat(coordination): Cursor instillation operational plan — theorems+fo | MERGED | 2026-05-30 | chore/cursor-instillatio→main | proof | README | +472/-0 | 1 | b7e2ece211 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/.github/pull/83) |
| .github | 84 | docs(coordination): CURSOR_READ_THESE_TWO_FIRST pointer | MERGED | 2026-05-30 | perplexity/cursor-read-t→main | coord/docs | README | +98/-0 | 1 | 98f3bfd8d3 | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/.github/pull/84) |
| .github | 86 | docs(coordination): CURSOR_MASTER_DIRECTIVE — Series-A one-shot buildo | MERGED | 2026-05-30 | perplexity/cursor-master→main | feature | README | +683/-0 | 1 | 5579058e61 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/.github/pull/86) |
| .github | 87 | docs(coordination): Perplexity handoff to Cursor — 2026-05-29 evening  | MERGED | 2026-05-30 | perplexity/cursor-handof→main | coord/docs | README | +395/-0 | 1 | 01375c9150 | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/.github/pull/87) |
| .github | 89 | [CURSOR DIRECTIVE] INSTILL ALL THEORIES — Tier 0-4 ship plan (CTO+PM+P | MERGED | 2026-05-30 | cursor/instill-all-theor→main | feature | README | +309/-0 | 1 | b10923be54 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/.github/pull/89) |
| .github | 90 | [CURSOR MASTER] ONE-OF-ONE Directive — 28 PhD agents consolidated, Tie | MERGED | 2026-05-30 | cursor/one-of-one-master→main | feature | README | +262/-0 | 1 | 9b23a8ce75 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/.github/pull/90) |
| .github | 97 | docs(coordination): Cursor master directive FINAL 2026-05-30 (Doctrine | MERGED | 2026-05-30 | perplexity/cursor-master→main | doctrine | README | +525/-0 | 1 | de1985a265 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/.github/pull/97) |
| szl-brand | 38 | Add AGENTS.md with cloud-specific development instructions | CLOSED |  | cursor/setup-dev-environ→main | feature | README | +35/-0 | 1 | — | N/A (not merged) | — | [link](https://github.com/szl-holdings/szl-brand/pull/38) |
| szl-brand | 39 | Add AGENTS.md with Cursor Cloud development environment instructions | MERGED | 2026-05-29 | cursor/setup-dev-environ→main | feature | README | +41/-0 | 1 | c21194e4eb | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/szl-brand/pull/39) |
| szl-brand | 40 | feat: Transform szl-brand into a real Python SDK with procedural gener | MERGED | 2026-05-29 | cursor/setup-dev-environ→main | feature | README | +1780/-21 | 14 | 4e901ada37 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/szl-brand/pull/40) |
| amaru | 55 | Add AGENTS.md with Cursor Cloud development instructions | MERGED | 2026-05-29 | cursor/dev-env-setup-b53→main | feature | amaru | +31/-0 | 1 | 6bed336a84 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/amaru/pull/55) |
| amaru | 56 | feat: standalone web frontend + HF Spaces deployment + dev environment | MERGED | 2026-05-29 | cursor/dev-env-setup-b53→main | feature | amaru | +3983/-84 | 24 | 80eb25c274 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/amaru/pull/56) |
| amaru | 64 | chore(license): add SPDX-License-Identifier headers (amaru) | MERGED | 2026-05-29 | cursor/perplexity-fix-sp→main | feature | amaru | +4/-0 | 1 | b18ca5cd0a | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/amaru/pull/64) |
| szl-cookbook | 42 | docs: add AGENTS.md with Cursor Cloud development instructions | MERGED | 2026-05-29 | cursor/dev-env-setup-3bf→main | feature | none(cookbook) | +50/-0 | 1 | 7b4000f278 | GitHub main only (repo feeds no HF Space | — | [link](https://github.com/szl-holdings/szl-cookbook/pull/42) |
| szl-cookbook | 43 | fix(ci): unblock anatomy-evolved-ci — TS2769 reduce typing + .ts exten | MERGED | 2026-05-29 | cursor/fix-anatomy-ci-3b→main | anatomy | none(cookbook) | +5/-6 | 4 | ce6b5a6868 | GitHub main only (repo feeds no HF Space | — | [link](https://github.com/szl-holdings/szl-cookbook/pull/43) |
| agi-forecast | 35 | docs: add AGENTS.md with Cursor Cloud development instructions | MERGED | 2026-05-29 | cursor/add-agents-md-db9→main | feature | none(forecast) | +22/-0 | 1 | 7f554d20c9 | GitHub main only (repo feeds no HF Space | — | [link](https://github.com/szl-holdings/agi-forecast/pull/35) |
| agi-forecast | 42 | feat(runtime): FG-S1-S4 receipt pipeline (Cursor proxy) | CLOSED |  | cursor/agi-forecast-fg-p→main | feature | none(forecast) | +1789/-4 | 8 | — | N/A (not merged) | — | [link](https://github.com/szl-holdings/agi-forecast/pull/42) |
| lutar-lean | 99 | fix(lean): API drift in QEC, Wheeler, Shannon (Cursor proxy, Tier A it | CLOSED |  | cursor/lean-simple-api-d→main | proof | none(lean) | +4/-4 | 3 | — | N/A (not merged) | — | [link](https://github.com/szl-holdings/lutar-lean/pull/99) |
| lutar-lean | 101 | fix(lean): doc-comment + CSSBridge drift — SCITT, Adinkra, CSSBridge ( | CLOSED |  | cursor/lean-doc-comment-→main | proof | none(lean) | +6/-7 | 3 | — | N/A (not merged) | — | [link](https://github.com/szl-holdings/lutar-lean/pull/101) |
| lutar-lean | 102 | fix(lean): scope iterated robustness chain obligation (Cursor proxy) | CLOSED |  | cursor/lean-robustness-c→main | proof | none(lean) | +11/-34 | 1 | — | N/A (not merged) | — | [link](https://github.com/szl-holdings/lutar-lean/pull/102) |
| lutar-lean | 103 | fix(lean): combined triage batch — 13 modules with real lake build evi | CLOSED |  | cursor/combined-triage-b→main | proof | none(lean) | +133/-219 | 13 | — | N/A (not merged) | — | [link](https://github.com/szl-holdings/lutar-lean/pull/103) |
| lutar-lean | 104 | fix(lean): combined triage v2 — 15 modules, expanded red-surface reduc | CLOSED |  | cursor/combined-triage-v→main | proof | none(lean) | +184/-350 | 15 | — | N/A (not merged) | — | [link](https://github.com/szl-holdings/lutar-lean/pull/104) |
| lutar-lean | 106 | fix(lean): KERNEL GREEN — lake build 4973/4973 (Cursor proxy, supersed | MERGED | 2026-05-30 | cursor/kernel-green-2026→main | proof | none(lean) | +281/-759 | 20 | 2d91c4acd4 | GitHub main only (repo feeds no HF Space | — | [link](https://github.com/szl-holdings/lutar-lean/pull/106) |
| lutar-lean | 114 | feat(kernel): Cursor kernel-green proxy patches (combined triage v2) [ | CLOSED |  | proxy/cursor-kernel-gree→main | feature | none(lean) | +0/-0 | 0 | — | N/A (not merged) | — | [link](https://github.com/szl-holdings/lutar-lean/pull/114) |
| vsp-otel | 35 | feat: standalone development environment setup | MERGED | 2026-05-29 | cursor/dev-environment-s→main | feature | none(otel) | +1938/-1 | 12 | 7808f95a85 | GitHub main only (repo feeds no HF Space | — | [link](https://github.com/szl-holdings/vsp-otel/pull/35) |
| vsp-otel | 43 | feat(otel): szl.anchor_formula.id auto-injection per OTel SemConv | MERGED | 2026-05-29 | cursor/perplexity-l4-anc→main | feature | none(otel) | +199/-2 | 2 | ac772cb84c | GitHub main only (repo feeds no HF Space | — | [link](https://github.com/szl-holdings/vsp-otel/pull/43) |
| platform | 211 | docs: add Cursor Cloud specific instructions to AGENTS.md | MERGED | 2026-05-29 | cursor/env-setup-agents-→main | feature | none(platform) | +37/-0 | 1 | c8da683d2b | GitHub main only (repo feeds no HF Space | — | [link](https://github.com/szl-holdings/platform/pull/211) |
| platform | 212 | docs: add Cursor Cloud specific development instructions to AGENTS.md | MERGED | 2026-05-29 | cursor/env-setup-2e1d→main | feature | none(platform) | +379/-516 | 4 | 69bad5d558 | GitHub main only (repo feeds no HF Space | — | [link](https://github.com/szl-holdings/platform/pull/212) |
| platform | 213 | docs: add Cursor Cloud development environment setup instructions | MERGED | 2026-05-29 | cursor/env-setup-3a7f→main | feature | none(platform) | +53/-49 | 1 | d88d2a606b | GitHub main only (repo feeds no HF Space | — | [link](https://github.com/szl-holdings/platform/pull/213) |
| platform | 234 | docs(readme): correct module count 30 → 32 GREEN modules | MERGED | 2026-05-29 | cursor/perplexity-fix-re→main | fix | none(platform) | +2/-2 | 1 | efefa67167 | GitHub main only (repo feeds no HF Space | — | [link](https://github.com/szl-holdings/platform/pull/234) |
| ouroboros | 32 | feat(agentic): a11oy-core orchestrator + MCP server + Cursor/Claude/Re | MERGED | 2026-05-17 | feat/agentic/a11oy-core→main | feature | none(thesis) | +3456/-0 | 31 | 169385bb12 | GitHub main only (repo feeds no HF Space | — | [link](https://github.com/szl-holdings/ouroboros/pull/32) |
| ouroboros | 69 | docs: add AGENTS.md with Cursor Cloud dev environment instructions | CLOSED |  | cursor/dev-env-setup-065→main | feature | none(thesis) | +46/-0 | 1 | — | N/A (not merged) | — | [link](https://github.com/szl-holdings/ouroboros/pull/69) |
| ouroboros | 70 | Add AGENTS.md with Cursor Cloud development environment instructions | CLOSED |  | cursor/devenv-setup-e5fc→main | feature | none(thesis) | +36/-0 | 1 | — | N/A (not merged) | — | [link](https://github.com/szl-holdings/ouroboros/pull/70) |
| ouroboros | 71 | docs: add AGENTS.md with Cursor Cloud development instructions | MERGED | 2026-05-29 | cursor/add-agents-md-db9→main | feature | none(thesis) | +34/-0 | 1 | 087dc0579f | GitHub main only (repo feeds no HF Space | — | [link](https://github.com/szl-holdings/ouroboros/pull/71) |
| ouroboros | 72 | Add AGENTS.md with Cursor Cloud development instructions | MERGED | 2026-05-29 | cursor/dev-environment-s→main | feature | none(thesis) | +2096/-22 | 3 | 1706fcbcb6 | GitHub main only (repo feeds no HF Space | — | [link](https://github.com/szl-holdings/ouroboros/pull/72) |
| ouroboros | 83 | ci(release-please): update pinned .github SHA — fix workflow file issu | MERGED | 2026-05-29 | cursor/perplexity-fix-re→main | fix | none(thesis) | +2/-2 | 1 | e3f8ed684e | GitHub main only (repo feeds no HF Space | — | [link](https://github.com/szl-holdings/ouroboros/pull/83) |
| ouroboros-thesis | 105 | docs: add AGENTS.md with Cursor Cloud development instructions | MERGED | 2026-05-29 | cursor/dev-env-setup-b62→main | feature | none(thesis) | +34/-0 | 1 | 53ea94fd45 | GitHub main only (repo feeds no HF Space | — | [link](https://github.com/szl-holdings/ouroboros-thesis/pull/105) |
| rosie | 32 | Add AGENTS.md with Cursor Cloud development instructions | MERGED | 2026-05-29 | cursor/dev-environment-s→main | feature | rosie | +48/-0 | 1 | 22116b9287 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/rosie/pull/32) |
| rosie | 39 | chore(license): add SPDX-License-Identifier headers (rosie) | MERGED | 2026-05-29 | cursor/perplexity-fix-sp→main | feature | rosie | +8/-0 | 2 | c5fdc90f45 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/rosie/pull/39) |
| sentra | 54 | chore: set up standalone development environment | MERGED | 2026-05-29 | cursor/dev-environment-s→main | infra | sentra | +4224/-0 | 100 | 5a188bd8da | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/sentra/pull/54) |
| sentra | 56 | feat: add standalone dev environment with workspace stub packages | MERGED | 2026-05-29 | cursor/dev-env-setup-7cd→main | feature | sentra | +1944/-339 | 100 | 0cd3473ff6 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/sentra/pull/56) |
| sentra | 64 | docs(agents): Cursor Cloud pnpm 11 and tooling gotchas | MERGED | 2026-05-30 | cursor/cloud-dev-env-doc→main | coord/docs | sentra | +5/-0 | 1 | b18a1e5cbb | GitHub-only (coordination/infra — not Sp | — | [link](https://github.com/szl-holdings/sentra/pull/64) |
| sentra | 65 | feat(forecasts): witnessed forecasting with Madhava error envelope [Ph | MERGED | 2026-05-29 | cursor/perplexity-l7-wit→main | feature | sentra | +641/-0 | 3 | 4d2887ad0b | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/sentra/pull/65) |
| szl-uds-deployment | 3 | docs: Cursor Cloud development environment guide (AGENTS.md) | OPEN |  | cursor/dev-env-setup-78a→master | page | uds-demo | +4336/-0 | 2 | — | N/A (not merged) | — | [link](https://github.com/szl-holdings/szl-uds-deployment/pull/3) |
| uds-mesh | 31 | Add AGENTS.md with Cursor Cloud development instructions | MERGED | 2026-05-29 | cursor/setup-dev-environ→main | feature | uds-demo | +37/-0 | 1 | 6640550384 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/uds-mesh/pull/31) |
| uds-mesh | 32 | Ecosystem architecture: a11oy as one-of-one + vessels tracking + AGENT | CLOSED |  | cursor/setup-dev-environ→main | other | uds-demo | +31/-0 | 1 | — | N/A (not merged) | — | [link](https://github.com/szl-holdings/uds-mesh/pull/32) |
| uds-mesh | 44 | ci(release-please): update pinned .github SHA — fix workflow file issu | MERGED | 2026-05-29 | cursor/perplexity-fix-re→main | fix | uds-demo | +2/-2 | 1 | 5d4093d3ca | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/uds-mesh/pull/44) |
| uds-mesh | 45 | chore(license): add SPDX-License-Identifier headers (uds-mesh) | MERGED | 2026-05-29 | cursor/perplexity-fix-sp→main | uds | uds-demo | +4/-0 | 1 | 3c87c52042 | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/uds-mesh/pull/45) |
| vessels | 41 | feat: set up standalone dev environment with workspace stubs | MERGED | 2026-05-29 | cursor/dev-env-setup-f96→main | feature | vessels | +4159/-0 | 100 | 80850fd06a | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/vessels/pull/41) |
| vessels | 51 | docs: add deep-dive HF Space showcase link | MERGED | 2026-05-29 | cursor/perplexity-deep-d→main | feature | vessels | +13/-0 | 1 | b0843afd2d | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/vessels/pull/51) |
| vessels | 52 | fix(docs): repair broken URLs in README [doctrine v6 link integrity sw | MERGED | 2026-05-29 | cursor/perplexity-fix-br→main | doctrine | vessels | +2/-3 | 1 | f5a6337abb | NOT LIVE in Space (Space rebuilt from Re | **YES** | [link](https://github.com/szl-holdings/vessels/pull/52) |

## Per-PR changed-file detail

### a11oy#67 — Document SZL org repository map
- State **MERGED** · merged 2026-05-29 · branch `cursor/organize-org-repos-dcfe` → `main` · category **other** · dest **a11oy** · +154/-1 · 4 files · mergeSHA `ee6e17b9c3`
- Signals: `branch:cursor/organize-org-repos-dcfe` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `.gitignore`
  - `README.md`
  - `docs/org-repo-map.md`
  - `scripts/clone-org-repos.sh`
- https://github.com/szl-holdings/a11oy/pull/67

### a11oy#68 — SUPERSEDED: fix(core): restore KS18 parity cover
- State **MERGED** · merged 2026-05-29 · branch `cursor/fix-ks18-cover-643f` → `main` · category **fix** · dest **a11oy** · +83/-14 · 3 files · mergeSHA `a2a0ef8349`
- Signals: `branch:cursor/fix-ks18-cover-643f` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `CHANGELOG.md`
  - `web/packages/a11oy-core/src/quantum/__tests__/kochen-specker-18.test.ts`
  - `web/packages/a11oy-core/src/quantum/kochen_specker_18.ts`
- https://github.com/szl-holdings/a11oy/pull/68

### a11oy#69 — build(ops): operationalize A11oy GitHub and Hugging Face payload hub
- State **MERGED** · merged 2026-05-29 · branch `cursor/fix-ks18-cover-clean-643f` → `main` · category **feature** · dest **a11oy** · +3214/-112 · 28 files · mergeSHA `4a0591d81e`
- Signals: `branch:cursor/fix-ks18-cover-clean-643f` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `.github/workflows/doctrine.yml`
  - `.github/workflows/huggingface.yml`
  - `.gitignore`
  - `CHANGELOG.md`
  - `CITATION.cff`
  - `README.md`
  - `deploy/MANIFEST.json`
  - `docs/ECOSYSTEM.md`
  - `docs/PROVENANCE.md`
  - `docs/ecosystem-registry.json`
  - `docs/huggingface.md`
  - `huggingface/README.md`
  - `package.json`
  - `pnpm-lock.yaml`
  - `pnpm-workspace.yaml`
  - `scripts/build_operational_payload.py`
  - `scripts/ecosystem_audit.py`
  - `scripts/payload_manifest.py`
  - `scripts/prepare_huggingface_payload.py`
  - `tsconfig.base.json`
  - `web/catalog-info.yaml`
  - `web/packages/a11oy-connection/package.json`
  - `web/packages/a11oy-connection/tsconfig.json`
  - `web/packages/a11oy-core/package.json`
  - `web/packages/a11oy-core/src/governance/__tests__/lid-check.test.ts`
  - `web/packages/a11oy-core/src/index.ts`
  - `web/packages/a11oy-core/tsconfig.json`
  - `web/src/data/ecosystem-registry.json`
- https://github.com/szl-holdings/a11oy/pull/69

### a11oy#70 — Improve org repository sync helper
- State **MERGED** · merged 2026-05-29 · branch `cursor/import-replit-project-dcfe` → `main` · category **other** · dest **a11oy** · +4606/-13 · 59 files · mergeSHA `43104ecfc5`
- Signals: `branch:cursor/import-replit-project-dcfe` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `.gitignore`
  - `README.md`
  - `artifacts/a11oy-uds/PUBLISH-WALKTHROUGH.md`
  - `artifacts/a11oy-uds/README.md`
  - `artifacts/a11oy-uds/RELEASE.md`
  - `artifacts/a11oy-uds/build-attestations/ATTESTATIONS.json`
  - `artifacts/a11oy-uds/docs/ARCHITECTURE.md`
  - `artifacts/a11oy-uds/docs/OPERATOR-QUICKSTART.md`
  - `artifacts/a11oy-uds/docs/SECURITY.md`
  - `artifacts/a11oy-uds/docs/UDS-BUNDLE.md`
  - `artifacts/a11oy-uds/package.json`
  - `artifacts/a11oy-uds/release-keys/a11oy-uds-dev.pub`
  - `artifacts/a11oy-uds/scripts/build.sh`
  - `artifacts/a11oy-uds/scripts/verify-attestations.mjs`
  - `artifacts/a11oy-uds/scripts/verify-manifest.mjs`
  - `artifacts/a11oy-uds/scripts/write-attestations.mjs`
  - `artifacts/a11oy-uds/scripts/write-manifest.mjs`
  - `artifacts/a11oy-uds/uds-bundle.yaml`
  - `artifacts/a11oy-uds/zarf.yaml`
  - `docs/operational-receipt-substrate.md`
  - `docs/org-repo-map.md`
  - `packages/perception-loop/README.md`
  - `packages/perception-loop/package.json`
  - `packages/perception-loop/src/__tests__/liveness.test.ts`
  - `packages/perception-loop/src/__tests__/privacy.test.ts`
  - `packages/perception-loop/src/envelope.ts`
  - `packages/perception-loop/src/index.ts`
  - `packages/perception-loop/src/liveness.ts`
  - `packages/perception-loop/src/pipeline.ts`
  - `packages/perception-loop/tsconfig.json`
  - `packages/perception-loop/vitest.config.ts`
  - `packages/receipt-substrate/README.md`
  - `packages/receipt-substrate/package.json`
  - `packages/receipt-substrate/src/cli.ts`
  - `packages/receipt-substrate/src/index.ts`
  - `packages/receipt-substrate/src/receipt_substrate.test.ts`
  - `packages/sequence-pipeline/README.md`
  - `packages/sequence-pipeline/package.json`
  - `packages/sequence-pipeline/src/__tests__/staged.test.ts`
  - `packages/sequence-pipeline/src/__tests__/wilson-ci.test.ts`
  - `packages/sequence-pipeline/src/index.ts`
  - `packages/sequence-pipeline/src/staged.ts`
  - `packages/sequence-pipeline/src/tabulated-statistic.ts`
  - `packages/sequence-pipeline/src/wilson-ci.ts`
  - `packages/sequence-pipeline/tsconfig.json`
  - `packages/sequence-pipeline/vitest.config.ts`
  - `packages/sparse-attention-kit/README.md`
  - `packages/sparse-attention-kit/package.json`
  - `packages/sparse-attention-kit/src/__tests__/sparse-attention-kit.test.ts`
  - `packages/sparse-attention-kit/src/contradiction-probe.ts`
  - `packages/sparse-attention-kit/src/envelope.ts`
  - `packages/sparse-attention-kit/src/index.ts`
  - `packages/sparse-attention-kit/src/io-budget.ts`
  - `packages/sparse-attention-kit/src/receipts.ts`
  - `packages/sparse-attention-kit/src/recorded-router.ts`
  - `packages/sparse-attention-kit/src/two-level-commit.ts`
  - `packages/sparse-attention-kit/tsconfig.json`
  - `scripts/clone-org-repos.sh`
  - `scripts/release/lib/stage-v2-packages.sh`
- https://github.com/szl-holdings/a11oy/pull/70

### a11oy#71 — chore: set up dev environment with test infrastructure
- State **MERGED** · merged 2026-05-29 · branch `cursor/dev-env-setup-db9b` → `main` · category **infra** · dest **a11oy** · +9025/-28 · 13 files · mergeSHA `1d9ab5fecd`
- Signals: `branch:cursor/dev-env-setup-db9b` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `.gitignore`
  - `AGENTS.md`
  - `a11oy-knowledge.schema.json`
  - `jest.config.js`
  - `package-lock.json`
  - `package.json`
  - `packages/a11oy-knowledge/package-lock.json`
  - `policies/vertical`
  - `tsconfig.base.json`
  - `tsconfig.json`
  - `web/packages/a11oy-core/package-lock.json`
  - `web/packages/a11oy-core/package.json`
  - `web/packages/a11oy-core/vitest.config.ts`
- https://github.com/szl-holdings/a11oy/pull/71

### a11oy#74 — Add operational validation gate
- State **MERGED** · merged 2026-05-29 · branch `cursor/operational-validation-gate-dcfe` → `main` · category **gate** · dest **a11oy** · +106/-63 · 5 files · mergeSHA `a6a537bbe0`
- Signals: `branch:cursor/operational-validation-gate-dcfe` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `.github/workflows/operational.yml`
  - `.gitignore`
  - `artifacts/a11oy-uds/build-attestations/ATTESTATIONS.json`
  - `docs/operational-receipt-substrate.md`
  - `scripts/validate-operational.sh`
- https://github.com/szl-holdings/a11oy/pull/74

### a11oy#75 — docs(showcase): polish Hugging Face diligence packet
- State **MERGED** · merged 2026-05-29 · branch `cursor/hf-showcase-643f` → `main` · category **page** · dest **a11oy** · +3552/-689 · 13 files · mergeSHA `831ee29876`
- Signals: `branch:cursor/hf-showcase-643f` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `.github/workflows/huggingface.yml`
  - `CHANGELOG.md`
  - `README.md`
  - `docs/SERIES_A_DILIGENCE.md`
  - `docs/huggingface.md`
  - `huggingface/README.md`
  - `package.json`
  - `pnpm-lock.yaml`
  - `scripts/build_operational_payload.py`
  - `scripts/prepare_huggingface_payload.py`
  - `scripts/publish_huggingface_payload.py`
  - `tsconfig.base.json`
  - `web/packages/a11oy-core/package.json`
- https://github.com/szl-holdings/a11oy/pull/75

### a11oy#83 — feat: harden investor demo, HF showcase, and policy gates
- State **MERGED** · merged 2026-05-29 · branch `cursor/investor-demo-readiness-2f18` → `main` · category **gate** · dest **a11oy** · +1698/-35 · 29 files · mergeSHA `30421b70b0`
- Signals: `branch:cursor/investor-demo-readiness-2f18` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `.github/workflows/doctrine.yml`
  - `.github/workflows/huggingface.yml`
  - `.github/workflows/tests.yml`
  - `.gitignore`
  - `CITATION.cff`
  - `README.md`
  - `docs/ECOSYSTEM.md`
  - `docs/INVESTOR_DEMO.md`
  - `docs/PERPLEXITY_BRIEF.md`
  - `docs/PROVENANCE.md`
  - `docs/SERIES_A_DILIGENCE.md`
  - `docs/WARHACKER_UDS_PROOF_POINT.md`
  - `docs/ecosystem-readiness-report.json`
  - `docs/huggingface.md`
  - `huggingface/EVAL_TRACE_SAMPLE.jsonl`
  - `huggingface/INNOVATIONS_DEEP_DIVE.md`
  - `huggingface/INTEGRATION_QUICKSTART.md`
  - `huggingface/INVESTOR_BRIEF.md`
  - `huggingface/README.md`
  - `huggingface/SHOWCASE.md`
  - `huggingface/VERIFICATION.md`
  - `package.json`
  - `packages/policy/src/gates/__tests__/policy_gates.test.ts`
  - `packages/policy/src/gates/falsePosition_gate.ts`
  - `packages/policy/src/gates/index.ts`
  - `scripts/build_ecosystem_readiness.py`
  - `scripts/build_operational_payload.py`
  - `scripts/prepare_huggingface_payload.py`
  - `scripts/publish_huggingface_payload.py`
- https://github.com/szl-holdings/a11oy/pull/83

### a11oy#89 — feat: harden investor demo, HF showcase, policy gates, and UDS ops
- State **MERGED** · merged 2026-05-29 · branch `cursor/investor-demo-readiness-2f18` → `main` · category **gate** · dest **a11oy** · +79/-45 · 9 files · mergeSHA `6aca5bbd37`
- Signals: `branch:cursor/investor-demo-readiness-2f18` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `.github/workflows/fuzz.yml`
  - `.github/workflows/operational.yml`
  - `README.md`
  - `artifacts/a11oy-uds/README.md`
  - `artifacts/a11oy-uds/docs/OPERATOR-QUICKSTART.md`
  - `artifacts/a11oy-uds/docs/UDS-BUNDLE.md`
  - `docs/operational-receipt-substrate.md`
  - `huggingface/README.md`
  - `pnpm-workspace.yaml`
- https://github.com/szl-holdings/a11oy/pull/89

### a11oy#91 — docs: clarify adversarial robustness gate scope
- State **CLOSED** · merged — · branch `cursor/investor-demo-readiness-2f18` → `main` · category **gate** · dest **a11oy** · +8/-1 · 1 files · mergeSHA `—`
- Signals: `branch:cursor/investor-demo-readiness-2f18` · Live: N/A (not merged)
- Files:
  - `packages/policy/src/gates/adversarialRobustness_gate.ts`
- https://github.com/szl-holdings/a11oy/pull/91

### a11oy#92 — docs: clarify adversarial robustness gate scope [PhD audit]
- State **MERGED** · merged 2026-05-29 · branch `cursor/phd-audit-adversarial-robustness-docs` → `main` · category **gate** · dest **a11oy** · +8/-1 · 1 files · mergeSHA `663e7c3eb1`
- Signals: `branch:cursor/phd-audit-adversarial-robustness-docs` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `packages/policy/src/gates/adversarialRobustness_gate.ts`
- https://github.com/szl-holdings/a11oy/pull/92

### a11oy#93 — docs: add deep-dive HF Space showcase link
- State **MERGED** · merged 2026-05-29 · branch `cursor/perplexity-deep-dive-link-a11oy` → `main` · category **feature** · dest **a11oy** · +16/-0 · 1 files · mergeSHA `3b120ea400`
- Signals: `branch:cursor/perplexity-deep-dive-link-a11oy` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `README.md`
- https://github.com/szl-holdings/a11oy/pull/93

### a11oy#94 — docs: UDS frontier gap map (Cursor proxy)
- State **MERGED** · merged 2026-05-30 · branch `cursor/uds-frontier-gap-map-2f18` → `main` · category **uds** · dest **a11oy** · +90/-1 · 5 files · mergeSHA `c918745299`
- Signals: `title:cursor;branch:cursor/uds-frontier-gap-map-2f18` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `docs/INVESTOR_DEMO.md`
  - `docs/UDS_FRONTIER_GAP_MAP.md`
  - `huggingface/README.md`
  - `scripts/build_operational_payload.py`
  - `scripts/prepare_huggingface_payload.py`
- https://github.com/szl-holdings/a11oy/pull/94

### a11oy#99 — docs: avoid linking private HF deep-dive space (Cursor proxy)
- State **MERGED** · merged 2026-05-30 · branch `cursor/hf-deep-dive-staged-safe-2f18` → `main` · category **page** · dest **a11oy** · +9/-3 · 1 files · mergeSHA `1290e19821`
- Signals: `title:cursor;branch:cursor/hf-deep-dive-staged-safe-2f18` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `README.md`
- https://github.com/szl-holdings/a11oy/pull/99

### a11oy#100 — docs(coordination): latest Cursor proxy handshake (2026-05-29)
- State **MERGED** · merged 2026-05-30 · branch `cursor/latest-proxy-handshake-2f18` → `main` · category **coord/docs** · dest **a11oy** · +77/-0 · 1 files · mergeSHA `2c847afac6`
- Signals: `title:cursor;branch:cursor/latest-proxy-handshake-2f18` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `coordination/CURSOR_PROXY_HANDSHAKE_2026-05-29.md`
- https://github.com/szl-holdings/a11oy/pull/100

### a11oy#101 — docs(coordination): agi-forecast FG-pipeline proxy source files
- State **MERGED** · merged 2026-05-30 · branch `cursor/proxy-agi-forecast-fg-pipeline-2f18` → `main` · category **coord/docs** · dest **a11oy** · +1910/-0 · 2 files · mergeSHA `fc3c9f93da`
- Signals: `branch:cursor/proxy-agi-forecast-fg-pipeline-2f18` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `coordination/AGI_FORECAST_PROXY_STATUS_2026-05-29.md`
  - `coordination/proxy-patches/agi-forecast-fg-pipeline.patch`
- https://github.com/szl-holdings/a11oy/pull/101

### a11oy#102 — docs(coordination): lutar-lean API drift proxy source files
- State **MERGED** · merged 2026-05-30 · branch `cursor/proxy-lutar-simple-api-drift-2f18` → `main` · category **proof** · dest **a11oy** · +97/-0 · 2 files · mergeSHA `c1de4044b9`
- Signals: `branch:cursor/proxy-lutar-simple-api-drift-2f18` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `coordination/LUTAR_LEAN_SIMPLE_API_DRIFT_STATUS_2026-05-29.md`
  - `coordination/proxy-patches/lutar-lean-simple-api-drift.patch`
- https://github.com/szl-holdings/a11oy/pull/102

### a11oy#103 — docs(a11oy): clarify adversarial robustness gate scope (Cursor proxy)
- State **MERGED** · merged 2026-05-30 · branch `cursor/adversarial-robustness-scope-2f18` → `main` · category **gate** · dest **a11oy** · +8/-1 · 1 files · mergeSHA `49ea0d67d7`
- Signals: `title:cursor;branch:cursor/adversarial-robustness-scope-2f18` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `packages/policy/src/gates/adversarialRobustness_gate.ts`
- https://github.com/szl-holdings/a11oy/pull/103

### a11oy#104 — docs(coordination): Cursor daily status 2026-05-29
- State **MERGED** · merged 2026-05-30 · branch `cursor/coordination-status-2026-05-29-2f18` → `main` · category **coord/docs** · dest **a11oy** · +62/-0 · 1 files · mergeSHA `00f472597d`
- Signals: `title:cursor;branch:cursor/coordination-status-2026-05-29-2f18` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `coordination/CURSOR_DAILY_STATUS_2026-05-29.md`
- https://github.com/szl-holdings/a11oy/pull/104

### a11oy#105 — feat(a11oy): harden investor demo + HF showcase (Cursor proxy, 25 files)
- State **MERGED** · merged 2026-05-30 · branch `cursor/investor-demo-readiness-signed-2f18` → `main` · category **feature** · dest **a11oy** · +31/-24 · 6 files · mergeSHA `fceaa50cc4`
- Signals: `title:cursor;branch:cursor/investor-demo-readiness-signed-2f18` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `README.md`
  - `docs/INVESTOR_DEMO.md`
  - `huggingface/README.md`
  - `package.json`
  - `scripts/build_operational_payload.py`
  - `scripts/prepare_huggingface_payload.py`
- https://github.com/szl-holdings/a11oy/pull/105

### a11oy#106 — docs(coordination): Cursor latest status (lutar + agi)
- State **MERGED** · merged 2026-05-30 · branch `cursor/latest-status-lutar-agi-2f18` → `main` · category **coord/docs** · dest **a11oy** · +58/-0 · 1 files · mergeSHA `2ef8fe5b1c`
- Signals: `title:cursor;branch:cursor/latest-status-lutar-agi-2f18` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `coordination/CURSOR_LATEST_STATUS_2026-05-29.md`
- https://github.com/szl-holdings/a11oy/pull/106

### a11oy#107 — ci(a11oy): operational readiness validation + UDS bundle docs (Cursor proxy)
- State **MERGED** · merged 2026-05-30 · branch `cursor/operational-audit-gaps-2f18` → `main` · category **uds** · dest **a11oy** · +2/-1 · 2 files · mergeSHA `3bacba1e7d`
- Signals: `title:cursor;branch:cursor/operational-audit-gaps-2f18` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `.github/workflows/operational.yml`
  - `huggingface/README.md`
- https://github.com/szl-holdings/a11oy/pull/107

### a11oy#108 — test(a11oy): harden policy gate formula instillation (Cursor proxy)
- State **MERGED** · merged 2026-05-30 · branch `cursor/policy-gates-hardening-2f18` → `main` · category **gate** · dest **a11oy** · +11/-274 · 3 files · mergeSHA `7e81a915ce`
- Signals: `title:cursor;branch:cursor/policy-gates-hardening-2f18` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `.github/workflows/tests.yml`
  - `package.json`
  - `packages/policy/src/gates/index.ts`
- https://github.com/szl-holdings/a11oy/pull/108

### a11oy#109 — [DUPE — close, see -scope-2f18] adversarial robustness clarify
- State **CLOSED** · merged — · branch `cursor/adversarial-robustness-clarify-2f18` → `main` · category **other** · dest **a11oy** · +8/-1 · 1 files · mergeSHA `—`
- Signals: `branch:cursor/adversarial-robustness-clarify-2f18` · Live: N/A (not merged)
- Files:
  - `packages/policy/src/gates/adversarialRobustness_gate.ts`
- https://github.com/szl-holdings/a11oy/pull/109

### a11oy#111 — fix(dependabot): remove missing github-actions label
- State **MERGED** · merged 2026-05-30 · branch `cursor/fix-dependabot-label-config-2f18` → `main` · category **fix** · dest **a11oy** · +0/-1 · 1 files · mergeSHA `e569b679fa`
- Signals: `branch:cursor/fix-dependabot-label-config-2f18` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `.github/dependabot.yml`
- https://github.com/szl-holdings/a11oy/pull/111

### a11oy#112 — docs(coordination): lutar-lean doc-comment drift proxy source files
- State **MERGED** · merged 2026-05-30 · branch `cursor/proxy-lutar-doc-comment-api-drift-2f18` → `main` · category **proof** · dest **a11oy** · +106/-0 · 2 files · mergeSHA `5ae492c533`
- Signals: `branch:cursor/proxy-lutar-doc-comment-api-drift-2f18` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `coordination/LUTAR_LEAN_DOC_COMMENT_API_DRIFT_STATUS_2026-05-29.md`
  - `coordination/proxy-patches/lutar-lean-doc-comment-api-drift.patch`
- https://github.com/szl-holdings/a11oy/pull/112

### a11oy#113 — docs(coordination): AdversarialRobustness chain-scope proxy source files
- State **MERGED** · merged 2026-05-30 · branch `cursor/proxy-lutar-robustness-chain-scope-2f18` → `main` · category **coord/docs** · dest **a11oy** · +108/-0 · 2 files · mergeSHA `7c2ab88149`
- Signals: `branch:cursor/proxy-lutar-robustness-chain-scope-2f18` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `coordination/LUTAR_LEAN_ROBUSTNESS_CHAIN_SCOPE_STATUS_2026-05-29.md`
  - `coordination/proxy-patches/lutar-lean-robustness-chain-scope.patch`
- https://github.com/szl-holdings/a11oy/pull/113

### a11oy#117 — feat(gates): wire 8 GREEN Lean theorems as TypeScript gates + vitest tests
- State **MERGED** · merged 2026-05-30 · branch `cursor/wire-8-green-theorems-as-gates` → `main` · category **gate** · dest **a11oy** · +3331/-0 · 16 files · mergeSHA `5437ae7eb3`
- Signals: `branch:cursor/wire-8-green-theorems-as-gates` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `src/gates/composition_overhead.ts`
  - `src/gates/css_bridge.ts`
  - `src/gates/delayed_choice_closure.ts`
  - `src/gates/doctrine_entropy.ts`
  - `src/gates/halt_eligibility.ts`
  - `src/gates/kitaev_surface.ts`
  - `src/gates/scitt_mask_entropy.ts`
  - `src/gates/th1_composition.ts`
  - `test/gates/composition_overhead.test.ts`
  - `test/gates/css_bridge.test.ts`
  - `test/gates/delayed_choice_closure.test.ts`
  - `test/gates/doctrine_entropy.test.ts`
  - `test/gates/halt_eligibility.test.ts`
  - `test/gates/kitaev_surface.test.ts`
  - `test/gates/scitt_mask_entropy.test.ts`
  - `test/gates/th1_composition.test.ts`
- https://github.com/szl-holdings/a11oy/pull/117

### a11oy#118 — feat(a11oy): runtime functional upgrades — formulas exported, TH4-TH7 lookup, tamper-evident receipts, policy gates packaged (Cursor)
- State **MERGED** · merged 2026-05-30 · branch `cursor/frontier-functional-upgrades-2f18` → `main` · category **gate** · dest **a11oy** · +238/-25 · 21 files · mergeSHA `f1d215122f`
- Signals: `title:cursor;branch:cursor/frontier-functional-upgrades-2f18` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `.github/dependabot.yml`
  - `.github/workflows/slsa.yml`
  - `.github/workflows/tests.yml`
  - `README.md`
  - `docs/INVESTOR_DEMO.md`
  - `docs/UDS_FRONTIER_GAP_MAP.md`
  - `huggingface/README.md`
  - `package.json`
  - `packages/a11oy-knowledge/src/index.ts`
  - `packages/a11oy-knowledge/src/theorems.ts`
  - `packages/a11oy-knowledge/src/theorems_lookup.test.ts`
  - `packages/policy/README.md`
  - `packages/policy/package.json`
  - `packages/policy/policy_loader.ts`
  - `packages/policy/src/gates/index.ts`
  - `packages/policy/src/index.ts`
  - `packages/receipt-substrate/src/index.ts`
  - `packages/receipt-substrate/src/receipt_substrate.test.ts`
  - `scripts/build_operational_payload.py`
  - `scripts/prepare_huggingface_payload.py`
  - `web/packages/a11oy-core/src/index.ts`
- https://github.com/szl-holdings/a11oy/pull/118

### a11oy#119 — fix(slsa): truth-correction — L3 badges → L1 (SBOM + DCO) (Cursor doctrine v6)
- State **MERGED** · merged 2026-05-30 · branch `cursor/slsa-truth-correction-2f18` → `main` · category **doctrine** · dest **a11oy** · +4/-4 · 3 files · mergeSHA `1254dc4f5f`
- Signals: `title:cursor;branch:cursor/slsa-truth-correction-2f18` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `.github/workflows/slsa.yml`
  - `README.md`
  - `package.json`
- https://github.com/szl-holdings/a11oy/pull/119

### a11oy#120 — docs(coordination): Cursor current one-of-one execution status
- State **MERGED** · merged 2026-05-30 · branch `cursor/current-status-one-of-one-2f18` → `main` · category **coord/docs** · dest **a11oy** · +53/-0 · 1 files · mergeSHA `f6bb9a56c4`
- Signals: `title:cursor;branch:cursor/current-status-one-of-one-2f18` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `coordination/CURSOR_CURRENT_STATUS_ONE_OF_ONE_2026-05-30.md`
- https://github.com/szl-holdings/a11oy/pull/120

### a11oy#123 — feat(a11oy): Hugging Face ecosystem manifest (Cursor)
- State **MERGED** · merged 2026-05-30 · branch `cursor/hf-ecosystem-manifest-2f18` → `main` · category **codex** · dest **a11oy** · +363/-690 · 8 files · mergeSHA `89ab7fca8f`
- Signals: `title:cursor;branch:cursor/hf-ecosystem-manifest-2f18` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `README.md`
  - `docs/MATH_LINEAGE_RUNTIME_MAP.md`
  - `docs/huggingface-ecosystem-manifest.json`
  - `docs/huggingface.md`
  - `huggingface/README.md`
  - `package.json`
  - `scripts/build_operational_payload.py`
  - `scripts/prepare_huggingface_payload.py`
- https://github.com/szl-holdings/a11oy/pull/123

### a11oy#127 — docs: ancient texts formula lineage — provable provenance, doctrine v6 (Cursor)
- State **MERGED** · merged 2026-05-30 · branch `cursor/ancient-texts-formula-lineage-2f18` → `main` · category **doctrine** · dest **a11oy** · +78/-1 · 5 files · mergeSHA `a36a0fd0e8`
- Signals: `title:cursor;branch:cursor/ancient-texts-formula-lineage-2f18` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `docs/ANCIENT_TEXTS_FORMULA_LINEAGE.md`
  - `docs/INVESTOR_DEMO.md`
  - `huggingface/README.md`
  - `scripts/build_operational_payload.py`
  - `scripts/prepare_huggingface_payload.py`
- https://github.com/szl-holdings/a11oy/pull/127

### a11oy#129 — feat: theorem-to-runtime manifest — machine-readable evidence map (Cursor)
- State **MERGED** · merged 2026-05-30 · branch `cursor/theorem-runtime-manifest-2f18` → `main` · category **proof** · dest **a11oy** · +205/-0 · 5 files · mergeSHA `0d0bc23cab`
- Signals: `title:cursor;branch:cursor/theorem-runtime-manifest-2f18` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `docs/theorem-runtime-manifest.json`
  - `package.json`
  - `scripts/build_operational_payload.py`
  - `scripts/prepare_huggingface_payload.py`
  - `scripts/validate_theorem_runtime_manifest.py`
- https://github.com/szl-holdings/a11oy/pull/129

### a11oy#130 — feat(docs): ecosystem stage matrix (Cursor handoff)
- State **MERGED** · merged 2026-05-30 · branch `cursor/ecosystem-stage-matrix-2f18` → `main` · category **feature** · dest **a11oy** · +3759/-1 · 10 files · mergeSHA `b6022993d4`
- Signals: `title:cursor;branch:cursor/ecosystem-stage-matrix-2f18` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `.github/workflows/tests.yml`
  - `docs/ECOSYSTEM_STAGE_MATRIX.md`
  - `docs/ecosystem-stage-matrix.json`
  - `docs/huggingface-ecosystem-manifest.json`
  - `docs/huggingface-ecosystem-manifest.schema.json`
  - `package.json`
  - `scripts/audit_huggingface_ecosystem.py`
  - `scripts/build_ecosystem_stage_matrix.py`
  - `scripts/build_operational_payload.py`
  - `scripts/prepare_huggingface_payload.py`
- https://github.com/szl-holdings/a11oy/pull/130

### a11oy#132 — feat: emit DSSE receipts from formula gates (Cursor handoff)
- State **MERGED** · merged 2026-05-30 · branch `cursor/policy-gate-receipt-emission-2f18` → `main` · category **gate** · dest **a11oy** · +94/-303 · 3 files · mergeSHA `eb1901d00b`
- Signals: `title:cursor;branch:cursor/policy-gate-receipt-emission-2f18` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `packages/policy/src/gates/__tests__/policy_gates.test.ts`
  - `packages/policy/src/gates/index.ts`
  - `packages/policy/src/gates/receipt.ts`
- https://github.com/szl-holdings/a11oy/pull/132

### a11oy#133 — docs: clarify adversarial robustness gate scope (Cursor PhD audit)
- State **MERGED** · merged 2026-05-30 · branch `cursor/adversarial-robustness-clarify-2f18` → `main` · category **gate** · dest **a11oy** · +11/-1 · 2 files · mergeSHA `d04117bd1d`
- Signals: `title:cursor;branch:cursor/adversarial-robustness-clarify-2f18` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `.github/workflows/tests.yml`
  - `packages/policy/src/gates/adversarialRobustness_gate.ts`
- https://github.com/szl-holdings/a11oy/pull/133

### a11oy#134 — feat: ecosystem OS doctrine — anatomy/formula/runtime map, benchmark map, validation scripts
- State **MERGED** · merged 2026-05-30 · branch `cursor/ecosystem-os-doctrine-2f18` → `main` · category **doctrine** · dest **a11oy** · +5127/-12 · 46 files · mergeSHA `c0b9525c3a`
- Signals: `branch:cursor/ecosystem-os-doctrine-2f18` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `README.md`
  - `benchmarks/benchmark-map.json`
  - `docs/AUTONOMOUS_LEARNING_DOCTRINE.md`
  - `docs/CROSS_REPO_HANDOFF_READINESS.md`
  - `docs/ECOSYSTEM.md`
  - `docs/ECOSYSTEM_OPERATING_SYSTEM.md`
  - `docs/GITHUB_ENTERPRISE_ACCESS_RUNBOOK.md`
  - `docs/INVESTOR_DEMO.md`
  - `docs/PHASE_COMPLETION_REPORT.md`
  - `docs/PUBLIC_PATTERN_SYNTHESIS.md`
  - `docs/action-contract-manifest.json`
  - `docs/anatomy-formula-runtime-map.json`
  - `docs/benchmark-evolution-doctrine.md`
  - `docs/controls-evidence-map.json`
  - `docs/cross-repo-handoff-manifest.json`
  - `docs/github-enterprise-access-checklist.json`
  - `docs/phase-completion-manifest.json`
  - `docs/public-pattern-source-manifest.json`
  - `huggingface/README.md`
  - `huggingface/SHOWCASE.md`
  - `huggingface/test-results/MANIFEST.json`
  - `huggingface/test-results/README.md`
  - `package.json`
  - `packages/policy/README.md`
  - `packages/policy/package.json`
  - `packages/policy/src/contracts/__tests__/autonomous_learning_contracts.test.ts`
  - `packages/policy/src/contracts/__tests__/controls_contracts.test.ts`
  - `packages/policy/src/contracts/__tests__/cross_repo_handoff_contracts.test.ts`
  - `packages/policy/src/contracts/autonomous_learning.ts`
  - `packages/policy/src/contracts/controls.ts`
  - `packages/policy/src/contracts/cross_repo_handoff.ts`
  - `packages/policy/src/contracts/index.ts`
  - `packages/policy/src/index.ts`
  - `packages/receipt-substrate/src/index.ts`
  - `scripts/audit_github_access_permissions.py`
  - `scripts/build_operational_payload.py`
  - `scripts/prepare_huggingface_payload.py`
  - `scripts/validate_action_contract_manifest.py`
  - `scripts/validate_anatomy_formula_runtime_map.py`
  - `scripts/validate_benchmark_map.py`
  - `scripts/validate_controls_evidence_map.py`
  - `scripts/validate_cross_repo_handoff_manifest.py`
  - `scripts/validate_github_access_checklist.py`
  - `scripts/validate_hf_test_results_manifest.py`
  - `scripts/validate_phase_completion_manifest.py`
  - `scripts/validate_public_pattern_manifest.py`
- https://github.com/szl-holdings/a11oy/pull/134

### a11oy#136 — ci: Doctrine v7 §14 namespace-leak PR gate (post-cursor-drift audit)
- State **MERGED** · merged 2026-05-30 · branch `audit/namespace-leak-ci-check-2026-05-30` → `main` · category **gate** · dest **a11oy** · +238/-0 · 3 files · mergeSHA `0c4a554acd`
- Signals: `title:cursor` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `.github/workflows/namespace-leak-check.yml`
  - `.github/workflows/tests.yml`
  - `scripts/check_namespace_leak.sh`
- https://github.com/szl-holdings/a11oy/pull/136

### a11oy#139 — docs: harden investor demo and HF showcase
- State **MERGED** · merged 2026-05-30 · branch `cursor/evidence-first-investor-demo-signed-2026-05-30` → `main` · category **feature** · dest **a11oy** · +405/-72 · 20 files · mergeSHA `77c90305b4`
- Signals: `branch:cursor/evidence-first-investor-demo-signed-2026-05-30` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `.github/workflows/tests.yml`
  - `README.md`
  - `docs/ECOSYSTEM.md`
  - `docs/INVESTOR_DEMO.md`
  - `docs/PERPLEXITY_BRIEF.md`
  - `docs/PROVENANCE.md`
  - `docs/SERIES_A_DILIGENCE.md`
  - `docs/SERIES_A_MARKET_EVIDENCE.md`
  - `docs/SUBSTRATE_REALITY_MAP.md`
  - `docs/ecosystem-readiness-report.json`
  - `huggingface/DEMO_RECEIPT_SAMPLE.jsonl`
  - `huggingface/EVAL_TRACE_SAMPLE.jsonl`
  - `huggingface/INNOVATIONS_DEEP_DIVE.md`
  - `huggingface/INVESTOR_BRIEF.md`
  - `huggingface/README.md`
  - `huggingface/SHOWCASE.md`
  - `huggingface/VERIFICATION.md`
  - `scripts/build_ecosystem_readiness.py`
  - `scripts/build_operational_payload.py`
  - `scripts/prepare_huggingface_payload.py`
- https://github.com/szl-holdings/a11oy/pull/139

### a11oy#142 — docs: evidence-first investor demo (Cursor handoff, unsigned)
- State **CLOSED** · merged — · branch `cursor/evidence-first-investor-demo-2026-05-30` → `main` · category **page** · dest **a11oy** · +224/-34 · 17 files · mergeSHA `—`
- Signals: `title:cursor;branch:cursor/evidence-first-investor-demo-2026-05-30` · Live: N/A (not merged)
- Files:
  - `README.md`
  - `docs/ECOSYSTEM.md`
  - `docs/INVESTOR_DEMO.md`
  - `docs/PERPLEXITY_BRIEF.md`
  - `docs/PROVENANCE.md`
  - `docs/SERIES_A_DILIGENCE.md`
  - `docs/ecosystem-readiness-report.json`
  - `huggingface/DEMO_RECEIPT_SAMPLE.jsonl`
  - `huggingface/EVAL_TRACE_SAMPLE.jsonl`
  - `huggingface/INNOVATIONS_DEEP_DIVE.md`
  - `huggingface/INVESTOR_BRIEF.md`
  - `huggingface/README.md`
  - `huggingface/SHOWCASE.md`
  - `huggingface/VERIFICATION.md`
  - `scripts/build_ecosystem_readiness.py`
  - `scripts/build_operational_payload.py`
  - `scripts/prepare_huggingface_payload.py`
- https://github.com/szl-holdings/a11oy/pull/142

### .github#54 — chore(coordination): cursor PR queue handoff 2026-05-29
- State **MERGED** · merged 2026-05-29 · branch `chore/cursor-handoff-2026-05-29` → `main` · category **coord/docs** · dest **README** · +126/-0 · 1 files · mergeSHA `9c627800e9`
- Signals: `title:cursor;branch:chore/cursor-handoff-2026-05-29` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `coordination/CURSOR_HANDOFF_PR_QUEUE_2026-05-29.md`
- https://github.com/szl-holdings/.github/pull/54

### .github#55 — chore(coordination): cursor roadmap v2 — walk the thesis, innovate + evolve
- State **MERGED** · merged 2026-05-29 · branch `chore/cursor-roadmap-v2` → `main` · category **coord/docs** · dest **README** · +697/-0 · 2 files · mergeSHA `420a61d751`
- Signals: `title:cursor;branch:chore/cursor-roadmap-v2` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `coordination/CURSOR_ROADMAP_v1_2026-05-29.md`
  - `coordination/CURSOR_ROADMAP_v2_2026-05-29.md`
- https://github.com/szl-holdings/.github/pull/55

### .github#56 — docs: add AGENTS.md with Cursor Cloud development instructions
- State **MERGED** · merged 2026-05-29 · branch `cursor/setup-dev-env-24a9` → `main` · category **feature** · dest **README** · +34/-0 · 1 files · mergeSHA `1f4df1f2b2`
- Signals: `title:cursor;branch:cursor/setup-dev-env-24a9` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `AGENTS.md`
- https://github.com/szl-holdings/.github/pull/56

### .github#57 — chore(coordination): cursor credentials + access (HF_TOKEN now on all 20 repos)
- State **MERGED** · merged 2026-05-29 · branch `chore/cursor-credentials-doc` → `main` · category **coord/docs** · dest **README** · +177/-0 · 1 files · mergeSHA `e51b7b7b5d`
- Signals: `title:cursor;branch:chore/cursor-credentials-doc` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `coordination/CURSOR_CREDENTIALS_AND_ACCESS.md`
- https://github.com/szl-holdings/.github/pull/57

### .github#58 — chore(coordination): cursor MCP setup for HF
- State **MERGED** · merged 2026-05-29 · branch `chore/cursor-mcp-hf-setup` → `main` · category **infra** · dest **README** · +389/-0 · 1 files · mergeSHA `05205f077b`
- Signals: `title:cursor;branch:chore/cursor-mcp-hf-setup` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `coordination/CURSOR_MCP_HF_SETUP.md`
- https://github.com/szl-holdings/.github/pull/58

### .github#67 — chore(coordination): P0 directive for Cursor — instill 5 formulas today
- State **MERGED** · merged 2026-05-29 · branch `chore/cursor-directive-formulas-today` → `main` · category **coord/docs** · dest **README** · +99/-0 · 1 files · mergeSHA `3c335ffb74`
- Signals: `title:cursor;branch:chore/cursor-directive-formulas-today` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `coordination/CURSOR_DIRECTIVE_FORMULAS_TODAY_2026-05-29.md`
- https://github.com/szl-holdings/.github/pull/67

### .github#68 — chore(coordination): P0 directive — make anatomy real + operational
- State **MERGED** · merged 2026-05-29 · branch `chore/cursor-directive-anatomy-real` → `main` · category **anatomy** · dest **README** · +112/-0 · 1 files · mergeSHA `ce4b77855b`
- Signals: `branch:chore/cursor-directive-anatomy-real` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `coordination/CURSOR_DIRECTIVE_ANATOMY_REAL_2026-05-29.md`
- https://github.com/szl-holdings/.github/pull/68

### .github#71 — chore(coordination): cursor wake-up — 7 PRs merged + status check
- State **MERGED** · merged 2026-05-30 · branch `chore/cursor-wake-up-2026-05-29` → `main` · category **coord/docs** · dest **README** · +128/-0 · 1 files · mergeSHA `1a08601eee`
- Signals: `title:cursor;branch:chore/cursor-wake-up-2026-05-29` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `coordination/CURSOR_WAKE_UP_2026-05-29.md`
- https://github.com/szl-holdings/.github/pull/71

### .github#72 — chore(coordination): Cursor Phase 1 — innovate & evolve, anatomy-alive
- State **MERGED** · merged 2026-05-30 · branch `chore/cursor-phase-1-innovate-evolve` → `main` · category **anatomy** · dest **README** · +176/-0 · 1 files · mergeSHA `38a93c7dfa`
- Signals: `title:cursor;branch:chore/cursor-phase-1-innovate-evolve` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `coordination/CURSOR_INNOVATE_AND_EVOLVE_PHASE_1.md`
- https://github.com/szl-holdings/.github/pull/72

### .github#73 — chore(coordination): UDS v0.3.0 release-cut directive for Cursor
- State **MERGED** · merged 2026-05-30 · branch `chore/cursor-release-payload-addendum` → `main` · category **uds** · dest **README** · +238/-0 · 1 files · mergeSHA `997d430ef1`
- Signals: `title:cursor;branch:chore/cursor-release-payload-addendum` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `coordination/CURSOR_RELEASE_PAYLOAD_ADDENDUM.md`
- https://github.com/szl-holdings/.github/pull/73

### .github#74 — feat(anatomy-alive): Perplexity cross-organ integration harness [Phase 1]
- State **MERGED** · merged 2026-05-29 · branch `cursor/perplexity-anatomy-alive-harness` → `main` · category **anatomy** · dest **README** · +3136/-0 · 17 files · mergeSHA `51a0f351e7`
- Signals: `branch:cursor/perplexity-anatomy-alive-harness` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `coordination/ANATOMY_ALIVE_HARNESS.md`
  - `coordination/anatomy_alive/README.md`
  - `coordination/anatomy_alive/anatomy_alive_demo.md`
  - `coordination/anatomy_alive/anatomy_alive_evidence.json`
  - `coordination/anatomy_alive/anatomy_alive_jsonld.json`
  - `coordination/anatomy_alive/anatomy_alive_run.log`
  - `coordination/anatomy_alive/diagrams/formula_witness_flow.png`
  - `coordination/anatomy_alive/diagrams/make_diagrams.py`
  - `coordination/anatomy_alive/diagrams/receipt_dag.html`
  - `coordination/anatomy_alive/diagrams/receipt_dag.png`
  - `coordination/anatomy_alive/diagrams/sequence_with_timing.md`
  - `coordination/anatomy_alive/diagrams/sequence_with_timing.png`
  - `coordination/anatomy_alive/expected_receipts.json`
  - `coordination/anatomy_alive/formula_witness_schema.json`
  - `coordination/anatomy_alive/requirements.txt`
  - `coordination/anatomy_alive/run_anatomy_alive.py`
  - `coordination/anatomy_alive/synthetic_trace.json`
- https://github.com/szl-holdings/.github/pull/74

### .github#75 — feat(coordination): CURSOR_AGI_FORECAST_OPERATIONAL — agi-forecast competitive moat directive
- State **OPEN** · merged — · branch `cursor-agi-forecast-operational-2026-05-29` → `main` · category **feature** · dest **README** · +556/-0 · 1 files · mergeSHA `—`
- Signals: `title:cursor;branch:cursor-agi-forecast-operational-2026-05-29` · Live: N/A (not merged)
- Files:
  - `coordination/CURSOR_AGI_FORECAST_OPERATIONAL.md`
- https://github.com/szl-holdings/.github/pull/75

### .github#76 — chore(coordination): proxy Cursor's daily-status to .github
- State **MERGED** · merged 2026-05-30 · branch `chore/proxy-cursor-daily-status-2026-05-29` → `main` · category **coord/docs** · dest **README** · +62/-0 · 1 files · mergeSHA `e06ac1ad21`
- Signals: `title:cursor;branch:chore/proxy-cursor-daily-status-2026-05-29` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `coordination/CURSOR_DAILY_STATUS_2026-05-29.md`
- https://github.com/szl-holdings/.github/pull/76

### .github#77 — chore(coordination): clarify Cursor write access (org app has it; runtime config issue)
- State **MERGED** · merged 2026-05-30 · branch `chore/cursor-write-access-clarification` → `main` · category **coord/docs** · dest **README** · +61/-0 · 1 files · mergeSHA `012f045736`
- Signals: `title:cursor;branch:chore/cursor-write-access-clarification` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `coordination/CURSOR_WRITE_ACCESS_CLARIFICATION.md`
- https://github.com/szl-holdings/.github/pull/77

### .github#78 — chore(coordination): Cursor Phase 2 — innovate & evolve, full Series-A
- State **MERGED** · merged 2026-05-30 · branch `chore/cursor-phase-2-innovate-evolve` → `main` · category **coord/docs** · dest **README** · +151/-0 · 1 files · mergeSHA `a232c2220b`
- Signals: `title:cursor;branch:chore/cursor-phase-2-innovate-evolve` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `coordination/CURSOR_PHASE_2_INNOVATE_AND_EVOLVE.md`
- https://github.com/szl-holdings/.github/pull/78

### .github#79 — chore(coordination): Cursor full throttle — all tracks parallel, doctrine v6 strict
- State **MERGED** · merged 2026-05-30 · branch `chore/cursor-full-throttle-no-phases` → `main` · category **doctrine** · dest **README** · +142/-0 · 1 files · mergeSHA `0d6b894483`
- Signals: `title:cursor;branch:chore/cursor-full-throttle-no-phases` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `coordination/CURSOR_FULL_THROTTLE_NO_PHASES.md`
- https://github.com/szl-holdings/.github/pull/79

### .github#80 — chore(coordination): Cursor work NOW — org profile 404s + full-throttle resume
- State **MERGED** · merged 2026-05-30 · branch `chore/cursor-work-now` → `main` · category **coord/docs** · dest **README** · +62/-0 · 1 files · mergeSHA `7cfe725a05`
- Signals: `title:cursor;branch:chore/cursor-work-now` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `coordination/CURSOR_WORK_NOW_2026-05-29.md`
- https://github.com/szl-holdings/.github/pull/80

### .github#81 — fix(docs): repair broken anatomy PDF links in org profile README [doctrine v6 link integrity sweep]
- State **MERGED** · merged 2026-05-29 · branch `cursor/perplexity-fix-org-profile-anatomy-404` → `main` · category **doctrine** · dest **README** · +5/-8 · 1 files · mergeSHA `b013c41502`
- Signals: `branch:cursor/perplexity-fix-org-profile-anatomy-404` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `profile/README.md`
- https://github.com/szl-holdings/.github/pull/81

### .github#82 — feat(coordination): CTO+PM consolidated 30-day operational plan for Cursor
- State **MERGED** · merged 2026-05-30 · branch `cursor/perplexity-cto-pm-operational-plan-2026-05-29` → `main` · category **feature** · dest **README** · +469/-0 · 1 files · mergeSHA `256b57eecf`
- Signals: `title:cursor;branch:cursor/perplexity-cto-pm-operational-plan-2026-05-29` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `coordination/CURSOR_CTO_PM_OPERATIONAL_PLAN.md`
- https://github.com/szl-holdings/.github/pull/82

### .github#83 — feat(coordination): Cursor instillation operational plan — theorems+formulas zoom-out
- State **MERGED** · merged 2026-05-30 · branch `chore/cursor-instillation-operational-plan` → `main` · category **proof** · dest **README** · +472/-0 · 1 files · mergeSHA `b7e2ece211`
- Signals: `title:cursor;branch:chore/cursor-instillation-operational-plan` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `coordination/CURSOR_INSTILLATION_OPERATIONAL_PLAN.md`
- https://github.com/szl-holdings/.github/pull/83

### .github#84 — docs(coordination): CURSOR_READ_THESE_TWO_FIRST pointer
- State **MERGED** · merged 2026-05-30 · branch `perplexity/cursor-read-these-two-first` → `main` · category **coord/docs** · dest **README** · +98/-0 · 1 files · mergeSHA `98f3bfd8d3`
- Signals: `title:cursor;branch:perplexity/cursor-read-these-two-first` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `coordination/CURSOR_READ_THESE_TWO_FIRST.md`
- https://github.com/szl-holdings/.github/pull/84

### .github#86 — docs(coordination): CURSOR_MASTER_DIRECTIVE — Series-A one-shot buildout (683 lines)
- State **MERGED** · merged 2026-05-30 · branch `perplexity/cursor-master-directive` → `main` · category **feature** · dest **README** · +683/-0 · 1 files · mergeSHA `5579058e61`
- Signals: `title:cursor;branch:perplexity/cursor-master-directive` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `coordination/CURSOR_MASTER_DIRECTIVE.md`
- https://github.com/szl-holdings/.github/pull/86

### .github#87 — docs(coordination): Perplexity handoff to Cursor — 2026-05-29 evening sweep
- State **MERGED** · merged 2026-05-30 · branch `perplexity/cursor-handoff-2026-05-29-evening` → `main` · category **coord/docs** · dest **README** · +395/-0 · 1 files · mergeSHA `01375c9150`
- Signals: `title:cursor;branch:perplexity/cursor-handoff-2026-05-29-evening` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `coordination/CURSOR_HANDOFF_2026-05-29_EVENING.md`
- https://github.com/szl-holdings/.github/pull/87

### .github#89 — [CURSOR DIRECTIVE] INSTILL ALL THEORIES — Tier 0-4 ship plan (CTO+PM+PMgr consolidated)
- State **MERGED** · merged 2026-05-30 · branch `cursor/instill-all-theories-2026-05-29` → `main` · category **feature** · dest **README** · +309/-0 · 1 files · mergeSHA `b10923be54`
- Signals: `title:cursor;branch:cursor/instill-all-theories-2026-05-29` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `cursor-directives/CURSOR_INSTILL_ALL_THEORIES_2026-05-29.md`
- https://github.com/szl-holdings/.github/pull/89

### .github#90 — [CURSOR MASTER] ONE-OF-ONE Directive — 28 PhD agents consolidated, Tier 0-4 ship plan
- State **MERGED** · merged 2026-05-30 · branch `cursor/one-of-one-master-2026-05-30` → `main` · category **feature** · dest **README** · +262/-0 · 1 files · mergeSHA `9b23a8ce75`
- Signals: `title:cursor;branch:cursor/one-of-one-master-2026-05-30` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `cursor-directives/CURSOR_ONE_OF_ONE_MASTER_2026-05-30.md`
- https://github.com/szl-holdings/.github/pull/90

### .github#97 — docs(coordination): Cursor master directive FINAL 2026-05-30 (Doctrine v6/v7)
- State **MERGED** · merged 2026-05-30 · branch `perplexity/cursor-master-directive-final-2026-05-30` → `main` · category **doctrine** · dest **README** · +525/-0 · 1 files · mergeSHA `de1985a265`
- Signals: `title:cursor;branch:perplexity/cursor-master-directive-final-2026-05-30` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `coordination/CURSOR_MASTER_DIRECTIVE_FINAL_2026-05-30.md`
- https://github.com/szl-holdings/.github/pull/97

### szl-brand#38 — Add AGENTS.md with cloud-specific development instructions
- State **CLOSED** · merged — · branch `cursor/setup-dev-environment-69a3` → `main` · category **feature** · dest **README** · +35/-0 · 1 files · mergeSHA `—`
- Signals: `branch:cursor/setup-dev-environment-69a3` · Live: N/A (not merged)
- Files:
  - `AGENTS.md`
- https://github.com/szl-holdings/szl-brand/pull/38

### szl-brand#39 — Add AGENTS.md with Cursor Cloud development environment instructions
- State **MERGED** · merged 2026-05-29 · branch `cursor/setup-dev-environment-7e9a` → `main` · category **feature** · dest **README** · +41/-0 · 1 files · mergeSHA `c21194e4eb`
- Signals: `title:cursor;branch:cursor/setup-dev-environment-7e9a` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `AGENTS.md`
- https://github.com/szl-holdings/szl-brand/pull/39

### szl-brand#40 — feat: Transform szl-brand into a real Python SDK with procedural generative identity
- State **MERGED** · merged 2026-05-29 · branch `cursor/setup-dev-environment-7e9a` → `main` · category **feature** · dest **README** · +1780/-21 · 14 files · mergeSHA `4e901ada37`
- Signals: `branch:cursor/setup-dev-environment-7e9a` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `.gitignore`
  - `AGENTS.md`
  - `pyproject.toml`
  - `src/szl_brand/__init__.py`
  - `src/szl_brand/__main__.py`
  - `src/szl_brand/cli.py`
  - `src/szl_brand/palette.py`
  - `src/szl_brand/preview.py`
  - `src/szl_brand/server.py`
  - `src/szl_brand/validate.py`
  - `tests/test_cli.py`
  - `tests/test_palette.py`
  - `tests/test_preview.py`
  - `tests/test_validate.py`
- https://github.com/szl-holdings/szl-brand/pull/40

### amaru#55 — Add AGENTS.md with Cursor Cloud development instructions
- State **MERGED** · merged 2026-05-29 · branch `cursor/dev-env-setup-b531` → `main` · category **feature** · dest **amaru** · +31/-0 · 1 files · mergeSHA `6bed336a84`
- Signals: `title:cursor;branch:cursor/dev-env-setup-b531` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `AGENTS.md`
- https://github.com/szl-holdings/amaru/pull/55

### amaru#56 — feat: standalone web frontend + HF Spaces deployment + dev environment setup
- State **MERGED** · merged 2026-05-29 · branch `cursor/dev-env-setup-b531` → `main` · category **feature** · dest **amaru** · +3983/-84 · 24 files · mergeSHA `80eb25c274`
- Signals: `branch:cursor/dev-env-setup-b531` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `.gitignore`
  - `AGENTS.md`
  - `deploy/huggingface/Dockerfile`
  - `deploy/huggingface/README.md`
  - `deploy/huggingface/deploy.sh`
  - `deploy/huggingface/serve.py`
  - `web/index.html`
  - `web/package-lock.json`
  - `web/package.json`
  - `web/src/_stubs/a11oy-orchestration/index.ts`
  - `web/src/_stubs/codex-kernel/index.ts`
  - `web/src/_stubs/design-system/tokens.css`
  - `web/src/_stubs/ouroboros-react/index.tsx`
  - `web/src/_stubs/ouroboros/index.ts`
  - `web/src/_stubs/shared-ui/badge.tsx`
  - `web/src/_stubs/shared-ui/button.tsx`
  - `web/src/_stubs/shared-ui/card.tsx`
  - `web/src/_stubs/shared-ui/contact-modal.tsx`
  - `web/src/_stubs/shared-ui/skeleton.tsx`
  - `web/src/_stubs/szl-doctrine-panels/index.tsx`
  - `web/src/_stubs/szl-doctrine/index.ts`
  - `web/src/index.css`
  - `web/tsconfig.json`
  - `web/vite.config.ts`
- https://github.com/szl-holdings/amaru/pull/56

### amaru#64 — chore(license): add SPDX-License-Identifier headers (amaru)
- State **MERGED** · merged 2026-05-29 · branch `cursor/perplexity-fix-spdx-headers-amaru` → `main` · category **feature** · dest **amaru** · +4/-0 · 1 files · mergeSHA `b18ca5cd0a`
- Signals: `branch:cursor/perplexity-fix-spdx-headers-amaru` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `deploy/huggingface/serve.py`
- https://github.com/szl-holdings/amaru/pull/64

### szl-cookbook#42 — docs: add AGENTS.md with Cursor Cloud development instructions
- State **MERGED** · merged 2026-05-29 · branch `cursor/dev-env-setup-3bf3` → `main` · category **feature** · dest **none(cookbook)** · +50/-0 · 1 files · mergeSHA `7b4000f278`
- Signals: `title:cursor;branch:cursor/dev-env-setup-3bf3` · Live: GitHub main only (repo feeds no HF Space)
- Files:
  - `AGENTS.md`
- https://github.com/szl-holdings/szl-cookbook/pull/42

### szl-cookbook#43 — fix(ci): unblock anatomy-evolved-ci — TS2769 reduce typing + .ts extension imports
- State **MERGED** · merged 2026-05-29 · branch `cursor/fix-anatomy-ci-3bf3` → `main` · category **anatomy** · dest **none(cookbook)** · +5/-6 · 4 files · mergeSHA `ce6b5a6868`
- Signals: `branch:cursor/fix-anatomy-ci-3bf3` · Live: GitHub main only (repo feeds no HF Space)
- Files:
  - `AGENTS.md`
  - `recipes/anatomy-evolved-v1/code/src/a11oy-ks18-witness.ts`
  - `recipes/anatomy-evolved-v1/code/tests/ks18_structure.ts`
  - `recipes/anatomy-evolved-v1/code/tests/rx_rz_unitarity.ts`
- https://github.com/szl-holdings/szl-cookbook/pull/43

### agi-forecast#35 — docs: add AGENTS.md with Cursor Cloud development instructions
- State **MERGED** · merged 2026-05-29 · branch `cursor/add-agents-md-db99` → `main` · category **feature** · dest **none(forecast)** · +22/-0 · 1 files · mergeSHA `7f554d20c9`
- Signals: `title:cursor;branch:cursor/add-agents-md-db99` · Live: GitHub main only (repo feeds no HF Space)
- Files:
  - `AGENTS.md`
- https://github.com/szl-holdings/agi-forecast/pull/35

### agi-forecast#42 — feat(runtime): FG-S1-S4 receipt pipeline (Cursor proxy)
- State **CLOSED** · merged — · branch `cursor/agi-forecast-fg-pipeline-2f18` → `main` · category **feature** · dest **none(forecast)** · +1789/-4 · 8 files · mergeSHA `—`
- Signals: `title:cursor;branch:cursor/agi-forecast-fg-pipeline-2f18` · Live: N/A (not merged)
- Files:
  - `.github/workflows/tests.yml`
  - `runtime/package-lock.json`
  - `runtime/src/dsse.ts`
  - `runtime/src/pipeline.test.ts`
  - `runtime/src/pipeline.ts`
  - `runtime/src/putnam_to_fg_wiring.ts`
  - `runtime/src/receipt.ts`
  - `runtime/tsconfig.json`
- https://github.com/szl-holdings/agi-forecast/pull/42

### lutar-lean#99 — fix(lean): API drift in QEC, Wheeler, Shannon (Cursor proxy, Tier A items 1+3+5)
- State **CLOSED** · merged — · branch `cursor/lean-simple-api-drift-2f18` → `main` · category **proof** · dest **none(lean)** · +4/-4 · 3 files · mergeSHA `—`
- Signals: `title:cursor;branch:cursor/lean-simple-api-drift-2f18` · Live: N/A (not merged)
- Files:
  - `Lutar/QEC/KitaevSurface.lean`
  - `Lutar/Shannon/DoctrineEntropy.lean`
  - `Lutar/Wheeler/DelayedChoiceClosure.lean`
- https://github.com/szl-holdings/lutar-lean/pull/99

### lutar-lean#101 — fix(lean): doc-comment + CSSBridge drift — SCITT, Adinkra, CSSBridge (Cursor proxy)
- State **CLOSED** · merged — · branch `cursor/lean-doc-comment-api-drift-2f18` → `main` · category **proof** · dest **none(lean)** · +6/-7 · 3 files · mergeSHA `—`
- Signals: `title:cursor;branch:cursor/lean-doc-comment-api-drift-2f18` · Live: N/A (not merged)
- Files:
  - `Lutar/DPI/SCITTMaskEntropy.lean`
  - `Lutar/Gates/Adinkra.lean`
  - `Lutar/QEC/CSSBridge.lean`
- https://github.com/szl-holdings/lutar-lean/pull/101

### lutar-lean#102 — fix(lean): scope iterated robustness chain obligation (Cursor proxy)
- State **CLOSED** · merged — · branch `cursor/lean-robustness-chain-scope-2f18` → `main` · category **proof** · dest **none(lean)** · +11/-34 · 1 files · mergeSHA `—`
- Signals: `title:cursor;branch:cursor/lean-robustness-chain-scope-2f18` · Live: N/A (not merged)
- Files:
  - `Lutar/Composition/AdversarialRobustness.lean`
- https://github.com/szl-holdings/lutar-lean/pull/102

### lutar-lean#103 — fix(lean): combined triage batch — 13 modules with real lake build evidence (Cursor proxy)
- State **CLOSED** · merged — · branch `cursor/combined-triage-batch-2026-05-29` → `main` · category **proof** · dest **none(lean)** · +133/-219 · 13 files · mergeSHA `—`
- Signals: `title:cursor;branch:cursor/combined-triage-batch-2026-05-29` · Live: N/A (not merged)
- Files:
  - `Lutar/Composition/AdversarialRobustness.lean`
  - `Lutar/Composition/CompositionOverhead.lean`
  - `Lutar/Composition/TH1_Composition.lean`
  - `Lutar/DPI/SCITTMaskEntropy.lean`
  - `Lutar/DPI/TH6_DPI_Soundness.lean`
  - `Lutar/Doctrine/CrossComponentInvariant.lean`
  - `Lutar/Gates/Adinkra.lean`
  - `Lutar/HUKLLA/HaltEligibility.lean`
  - `Lutar/QEC/CSSBridge.lean`
  - `Lutar/QEC/KitaevSurface.lean`
  - `Lutar/QEC/ShorReceiptCode.lean`
  - `Lutar/Shannon/DoctrineEntropy.lean`
  - `Lutar/Wheeler/DelayedChoiceClosure.lean`
- https://github.com/szl-holdings/lutar-lean/pull/103

### lutar-lean#104 — fix(lean): combined triage v2 — 15 modules, expanded red-surface reduction (Cursor proxy)
- State **CLOSED** · merged — · branch `cursor/combined-triage-v2-2026-05-29` → `main` · category **proof** · dest **none(lean)** · +184/-350 · 15 files · mergeSHA `—`
- Signals: `title:cursor;branch:cursor/combined-triage-v2-2026-05-29` · Live: N/A (not merged)
- Files:
  - `Lutar/Composition/AdversarialRobustness.lean`
  - `Lutar/Composition/CompositionOverhead.lean`
  - `Lutar/Composition/R1Tests.lean`
  - `Lutar/Composition/TH1_Composition.lean`
  - `Lutar/DPI/MerkleDAGBuild.lean`
  - `Lutar/DPI/SCITTMaskEntropy.lean`
  - `Lutar/DPI/TH6_DPI_Soundness.lean`
  - `Lutar/Doctrine/CrossComponentInvariant.lean`
  - `Lutar/Gates/Adinkra.lean`
  - `Lutar/HUKLLA/HaltEligibility.lean`
  - `Lutar/QEC/CSSBridge.lean`
  - `Lutar/QEC/KitaevSurface.lean`
  - `Lutar/QEC/ShorReceiptCode.lean`
  - `Lutar/Shannon/DoctrineEntropy.lean`
  - `Lutar/Wheeler/DelayedChoiceClosure.lean`
- https://github.com/szl-holdings/lutar-lean/pull/104

### lutar-lean#106 — fix(lean): KERNEL GREEN — lake build 4973/4973 (Cursor proxy, supersedes #104 #105)
- State **MERGED** · merged 2026-05-30 · branch `cursor/kernel-green-2026-05-29` → `main` · category **proof** · dest **none(lean)** · +281/-759 · 20 files · mergeSHA `2d91c4acd4`
- Signals: `title:cursor;branch:cursor/kernel-green-2026-05-29` · Live: GitHub main only (repo feeds no HF Space)
- Files:
  - `Lutar/Composition/AdversarialRobustness.lean`
  - `Lutar/Composition/CompositionOverhead.lean`
  - `Lutar/Composition/R1Tests.lean`
  - `Lutar/Composition/TH1_Composition.lean`
  - `Lutar/Correlator/MatchedFilter.lean`
  - `Lutar/DPI/MerkleDAGBuild.lean`
  - `Lutar/DPI/SCITTMaskEntropy.lean`
  - `Lutar/DPI/TH6_DPI_Soundness.lean`
  - `Lutar/Doctrine/CrossComponentInvariant.lean`
  - `Lutar/Gates/Adinkra.lean`
  - `Lutar/GraphLambda.lean`
  - `Lutar/HUKLLA/HaltEligibility.lean`
  - `Lutar/PRNG/K10v2_ReplayRoot.lean`
  - `Lutar/PositionAware.lean`
  - `Lutar/QEC/CSSBridge.lean`
  - `Lutar/QEC/KitaevSurface.lean`
  - `Lutar/QEC/ShorReceiptCode.lean`
  - `Lutar/Shannon/DoctrineEntropy.lean`
  - `Lutar/Topology/PersistentHomologyChain.lean`
  - `Lutar/Wheeler/DelayedChoiceClosure.lean`
- https://github.com/szl-holdings/lutar-lean/pull/106

### lutar-lean#114 — feat(kernel): Cursor kernel-green proxy patches (combined triage v2) [proxy from a11oy/cursor-proxy-lutar-*]
- State **CLOSED** · merged — · branch `proxy/cursor-kernel-green-from-a11oy-9519294` → `main` · category **feature** · dest **none(lean)** · +0/-0 · 0 files · mergeSHA `—`
- Signals: `title:cursor;branch:proxy/cursor-kernel-green-from-a11oy-9519294` · Live: N/A (not merged)
- https://github.com/szl-holdings/lutar-lean/pull/114

### vsp-otel#35 — feat: standalone development environment setup
- State **MERGED** · merged 2026-05-29 · branch `cursor/dev-environment-setup-23bb` → `main` · category **feature** · dest **none(otel)** · +1938/-1 · 12 files · mergeSHA `7808f95a85`
- Signals: `branch:cursor/dev-environment-setup-23bb` · Live: GitHub main only (repo feeds no HF Space)
- Files:
  - `.npmrc`
  - `AGENTS.md`
  - `package.json`
  - `pnpm-lock.yaml`
  - `pnpm-workspace.yaml`
  - `runtime/tsconfig.json`
  - `stubs/ouroboros-lambda-gate/index.d.ts`
  - `stubs/ouroboros-lambda-gate/index.js`
  - `stubs/ouroboros-lambda-gate/package.json`
  - `stubs/ouroboros-types/index.d.ts`
  - `stubs/ouroboros-types/index.js`
  - `stubs/ouroboros-types/package.json`
- https://github.com/szl-holdings/vsp-otel/pull/35

### vsp-otel#43 — feat(otel): szl.anchor_formula.id auto-injection per OTel SemConv
- State **MERGED** · merged 2026-05-29 · branch `cursor/perplexity-l4-anchor-formula-injection` → `main` · category **feature** · dest **none(otel)** · +199/-2 · 2 files · mergeSHA `ac772cb84c`
- Signals: `branch:cursor/perplexity-l4-anchor-formula-injection` · Live: GitHub main only (repo feeds no HF Space)
- Files:
  - `runtime/src/exporter.test.ts`
  - `runtime/src/exporter.ts`
- https://github.com/szl-holdings/vsp-otel/pull/43

### platform#211 — docs: add Cursor Cloud specific instructions to AGENTS.md
- State **MERGED** · merged 2026-05-29 · branch `cursor/env-setup-agents-md-45dc` → `main` · category **feature** · dest **none(platform)** · +37/-0 · 1 files · mergeSHA `c8da683d2b`
- Signals: `title:cursor;branch:cursor/env-setup-agents-md-45dc` · Live: GitHub main only (repo feeds no HF Space)
- Files:
  - `AGENTS.md`
- https://github.com/szl-holdings/platform/pull/211

### platform#212 — docs: add Cursor Cloud specific development instructions to AGENTS.md
- State **MERGED** · merged 2026-05-29 · branch `cursor/env-setup-2e1d` → `main` · category **feature** · dest **none(platform)** · +379/-516 · 4 files · mergeSHA `69bad5d558`
- Signals: `title:cursor;branch:cursor/env-setup-2e1d` · Live: GitHub main only (repo feeds no HF Space)
- Files:
  - `AGENTS.md`
  - `CITATION.cff`
  - `CONTRIBUTING.md`
  - `pnpm-lock.yaml`
- https://github.com/szl-holdings/platform/pull/212

### platform#213 — docs: add Cursor Cloud development environment setup instructions
- State **MERGED** · merged 2026-05-29 · branch `cursor/env-setup-3a7f` → `main` · category **feature** · dest **none(platform)** · +53/-49 · 1 files · mergeSHA `d88d2a606b`
- Signals: `title:cursor;branch:cursor/env-setup-3a7f` · Live: GitHub main only (repo feeds no HF Space)
- Files:
  - `AGENTS.md`
- https://github.com/szl-holdings/platform/pull/213

### platform#234 — docs(readme): correct module count 30 → 32 GREEN modules
- State **MERGED** · merged 2026-05-29 · branch `cursor/perplexity-fix-readme-module-count` → `main` · category **fix** · dest **none(platform)** · +2/-2 · 1 files · mergeSHA `efefa67167`
- Signals: `branch:cursor/perplexity-fix-readme-module-count` · Live: GitHub main only (repo feeds no HF Space)
- Files:
  - `README.md`
- https://github.com/szl-holdings/platform/pull/234

### ouroboros#32 — feat(agentic): a11oy-core orchestrator + MCP server + Cursor/Claude/Replit configs
- State **MERGED** · merged 2026-05-17 · branch `feat/agentic/a11oy-core` → `main` · category **feature** · dest **none(thesis)** · +3456/-0 · 31 files · mergeSHA `169385bb12`
- Signals: `title:cursor` · Live: GitHub main only (repo feeds no HF Space)
- Files:
  - `agentic/LIABILITY_AND_LIMITS.md`
  - `agentic/M2M_ENVELOPE.md`
  - `agentic/README.md`
  - `agentic/a11oy-core/src/envelope.ts`
  - `agentic/a11oy-core/src/index.ts`
  - `agentic/a11oy-core/tests/envelope.test.ts`
  - `agentic/agents/claude/CLAUDE.md`
  - `agentic/agents/claude/claude-code.config.json`
  - `agentic/agents/cursor/.cursorrules`
  - `agentic/agents/cursor/cursor.json`
  - `agentic/agents/replit/.replit`
  - `agentic/agents/replit/replit-agent.md`
  - `agentic/agents/replit/replit.nix`
  - `agentic/bot-reviewer/.github-workflows/bot-reviewer.yml`
  - `agentic/bot-reviewer/README.md`
  - `agentic/bot-reviewer/package.json`
  - `agentic/bot-reviewer/src/github-poster.test.ts`
  - `agentic/bot-reviewer/src/github-poster.ts`
  - `agentic/bot-reviewer/src/reviewer.test.ts`
  - `agentic/bot-reviewer/src/reviewer.ts`
  - `agentic/bot-reviewer/tsconfig.json`
  - `agentic/bot-reviewer/vitest.config.ts`
  - `agentic/formulas/package.json`
  - `agentic/formulas/src/index.ts`
  - `agentic/formulas/tests/formulas.test.ts`
  - `agentic/formulas/vitest.config.ts`
  - `agentic/mcp-server/src/index.ts`
  - `agentic/package.json`
  - `agentic/quickstart/bootstrap.sh`
  - `agentic/tsconfig.json`
  - `agentic/vitest.config.ts`
- https://github.com/szl-holdings/ouroboros/pull/32

### ouroboros#69 — docs: add AGENTS.md with Cursor Cloud dev environment instructions
- State **CLOSED** · merged — · branch `cursor/dev-env-setup-0655` → `main` · category **feature** · dest **none(thesis)** · +46/-0 · 1 files · mergeSHA `—`
- Signals: `title:cursor;branch:cursor/dev-env-setup-0655` · Live: N/A (not merged)
- Files:
  - `AGENTS.md`
- https://github.com/szl-holdings/ouroboros/pull/69

### ouroboros#70 — Add AGENTS.md with Cursor Cloud development environment instructions
- State **CLOSED** · merged — · branch `cursor/devenv-setup-e5fc` → `main` · category **feature** · dest **none(thesis)** · +36/-0 · 1 files · mergeSHA `—`
- Signals: `title:cursor;branch:cursor/devenv-setup-e5fc` · Live: N/A (not merged)
- Files:
  - `AGENTS.md`
- https://github.com/szl-holdings/ouroboros/pull/70

### ouroboros#71 — docs: add AGENTS.md with Cursor Cloud development instructions
- State **MERGED** · merged 2026-05-29 · branch `cursor/add-agents-md-db99` → `main` · category **feature** · dest **none(thesis)** · +34/-0 · 1 files · mergeSHA `087dc0579f`
- Signals: `title:cursor;branch:cursor/add-agents-md-db99` · Live: GitHub main only (repo feeds no HF Space)
- Files:
  - `AGENTS.md`
- https://github.com/szl-holdings/ouroboros/pull/71

### ouroboros#72 — Add AGENTS.md with Cursor Cloud development instructions
- State **MERGED** · merged 2026-05-29 · branch `cursor/dev-environment-setup-922d` → `main` · category **feature** · dest **none(thesis)** · +2096/-22 · 3 files · mergeSHA `1706fcbcb6`
- Signals: `title:cursor;branch:cursor/dev-environment-setup-922d` · Live: GitHub main only (repo feeds no HF Space)
- Files:
  - `AGENTS.md`
  - `agentic/pnpm-lock.yaml`
  - `runtime/types/pnpm-lock.yaml`
- https://github.com/szl-holdings/ouroboros/pull/72

### ouroboros#83 — ci(release-please): update pinned .github SHA — fix workflow file issue
- State **MERGED** · merged 2026-05-29 · branch `cursor/perplexity-fix-release-please-sha-ouroboros` → `main` · category **fix** · dest **none(thesis)** · +2/-2 · 1 files · mergeSHA `e3f8ed684e`
- Signals: `branch:cursor/perplexity-fix-release-please-sha-ouroboros` · Live: GitHub main only (repo feeds no HF Space)
- Files:
  - `.github/workflows/release-please.yml`
- https://github.com/szl-holdings/ouroboros/pull/83

### ouroboros-thesis#105 — docs: add AGENTS.md with Cursor Cloud development instructions
- State **MERGED** · merged 2026-05-29 · branch `cursor/dev-env-setup-b622` → `main` · category **feature** · dest **none(thesis)** · +34/-0 · 1 files · mergeSHA `53ea94fd45`
- Signals: `title:cursor;branch:cursor/dev-env-setup-b622` · Live: GitHub main only (repo feeds no HF Space)
- Files:
  - `AGENTS.md`
- https://github.com/szl-holdings/ouroboros-thesis/pull/105

### rosie#32 — Add AGENTS.md with Cursor Cloud development instructions
- State **MERGED** · merged 2026-05-29 · branch `cursor/dev-environment-setup-493f` → `main` · category **feature** · dest **rosie** · +48/-0 · 1 files · mergeSHA `22116b9287`
- Signals: `title:cursor;branch:cursor/dev-environment-setup-493f` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `AGENTS.md`
- https://github.com/szl-holdings/rosie/pull/32

### rosie#39 — chore(license): add SPDX-License-Identifier headers (rosie)
- State **MERGED** · merged 2026-05-29 · branch `cursor/perplexity-fix-spdx-headers-rosie` → `main` · category **feature** · dest **rosie** · +8/-0 · 2 files · mergeSHA `c5fdc90f45`
- Signals: `branch:cursor/perplexity-fix-spdx-headers-rosie` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `src/axis-value-option.ts`
  - `src/khipu-receipt.ts`
- https://github.com/szl-holdings/rosie/pull/39

### sentra#54 — chore: set up standalone development environment
- State **MERGED** · merged 2026-05-29 · branch `cursor/dev-environment-setup-c1ec` → `main` · category **infra** · dest **sentra** · +4224/-0 · 100 files · mergeSHA `5a188bd8da`
- Signals: `branch:cursor/dev-environment-setup-c1ec` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `.gitignore`
  - `AGENTS.md`
  - `a11oy/src/data/mythosDoctrine.ts`
  - `package.json`
  - `pnpm-lock.yaml`
  - `pnpm-workspace.yaml`
  - `stubs/a11oy-orchestration/index.ts`
  - `stubs/a11oy-orchestration/package.json`
  - `stubs/aef-contracts/index.ts`
  - `stubs/aef-contracts/package.json`
  - `stubs/aef-sdk/index.ts`
  - `stubs/aef-sdk/package.json`
  - `stubs/alloy-client/index.ts`
  - `stubs/alloy-client/package.json`
  - `stubs/alloy/index.ts`
  - `stubs/alloy/package.json`
  - `stubs/analytics/index.ts`
  - `stubs/analytics/package.json`
  - `stubs/api-client-react/index.ts`
  - `stubs/api-client-react/package.json`
  - `stubs/brand-registry/index.ts`
  - `stubs/brand-registry/package.json`
  - `stubs/codex-kernel/index.ts`
  - `stubs/codex-kernel/package.json`
  - `stubs/design-system/index.ts`
  - `stubs/design-system/package.json`
  - `stubs/design-system/tokens.css`
  - `stubs/env/index.ts`
  - `stubs/env/package.json`
  - `stubs/formulas/index.ts`
  - `stubs/formulas/package.json`
  - `stubs/graphql-client/index.ts`
  - `stubs/graphql-client/package.json`
  - `stubs/mcp-client/index.ts`
  - `stubs/mcp-client/package.json`
  - `stubs/observability/index.ts`
  - `stubs/observability/package.json`
  - `stubs/offline-engine/index.ts`
  - `stubs/offline-engine/package.json`
  - `stubs/omnia-shell/index.ts`
  - `stubs/omnia-shell/package.json`
  - `stubs/ouroboros-lambda-gate/index.ts`
  - `stubs/ouroboros-lambda-gate/package.json`
  - `stubs/ouroboros-types/index.ts`
  - `stubs/ouroboros-types/package.json`
  - `stubs/ouroboros/index.ts`
  - `stubs/ouroboros/package.json`
  - `stubs/payload/index.ts`
  - `stubs/payload/package.json`
  - `stubs/platform-registry/index.ts`
  - `stubs/platform-registry/package.json`
  - `stubs/prism-bus/index.ts`
  - `stubs/prism-bus/package.json`
  - `stubs/replit-auth-web/index.ts`
  - `stubs/replit-auth-web/package.json`
  - `stubs/security-headers/index.ts`
  - `stubs/security-headers/package.json`
  - `stubs/services/index.ts`
  - `stubs/services/package.json`
  - `stubs/shared-proxy/index.ts`
  - `stubs/shared-proxy/package.json`
  - `stubs/shared-ui/index.ts`
  - `stubs/shared-ui/package.json`
  - `stubs/szl-doctrine/index.ts`
  - `stubs/szl-doctrine/package.json`
  - `stubs/tokens/index.ts`
  - `stubs/tokens/package.json`
  - `web/biome.json`
  - `web/src/pages/emulation-scorecard.tsx`
  - `web/src/pages/endpoint-mesh.tsx`
  - `web/src/pages/enterprise-demo.tsx`
  - `web/src/pages/evidence-ledger.tsx`
  - `web/src/pages/evidence-vault.tsx`
  - `web/src/pages/executive-board-view.tsx`
  - `web/src/pages/executive-risk.tsx`
  - `web/src/pages/exposure-board.tsx`
  - `web/src/pages/federated-learning.tsx`
  - `web/src/pages/findings-page.tsx`
  - `web/src/pages/forecast.tsx`
  - `web/src/pages/forensics-timeline.tsx`
  - `web/src/pages/frontier-ai-threat-lab.tsx`
  - `web/src/pages/future-threat-horizon.tsx`
  - `web/src/pages/governance-review.tsx`
  - `web/src/pages/governance/agent-config.tsx`
  - `web/src/pages/governance/enterprise-governance.tsx`
  - `web/src/pages/governance/executive-reports.tsx`
  - `web/src/pages/governance/incident-analytics.tsx`
  - `web/src/pages/governance/trust-analytics.tsx`
  - `web/src/pages/governed-adversary-loop.tsx`
  - `web/src/pages/governed-cockpit.tsx`
  - `web/src/pages/hardening-controls.tsx`
  - `web/src/pages/hardware-root-of-trust.tsx`
  - `web/src/pages/hardware-supply-chain.tsx`
  - `web/src/pages/hunt-agents.tsx`
  - `web/src/pages/hunt-detail.tsx`
  - `web/src/pages/hunt.tsx`
  - `web/src/pages/identity-blast-radius.tsx`
  - `web/src/pages/identity-threat.tsx`
  - `web/src/pages/incident-commander.tsx`
  - `web/src/pages/incident-detail-v2.tsx`
- https://github.com/szl-holdings/sentra/pull/54

### sentra#56 — feat: add standalone dev environment with workspace stub packages
- State **MERGED** · merged 2026-05-29 · branch `cursor/dev-env-setup-7cd4` → `main` · category **feature** · dest **sentra** · +1944/-339 · 100 files · mergeSHA `0cd3473ff6`
- Signals: `branch:cursor/dev-env-setup-7cd4` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `.github/workflows/slsa.yml`
  - `.gitignore`
  - `AGENTS.md`
  - `biome.json`
  - `package.json`
  - `pnpm-workspace.yaml`
  - `stubs/szl-alloy/index.cjs`
  - `stubs/szl-alloy/index.mjs`
  - `stubs/szl-alloy/package.json`
  - `stubs/szl-holdings-alloy-client/index.cjs`
  - `stubs/szl-holdings-alloy-client/index.mjs`
  - `stubs/szl-holdings-alloy-client/package.json`
  - `stubs/szl-holdings-analytics/index.cjs`
  - `stubs/szl-holdings-analytics/index.mjs`
  - `stubs/szl-holdings-analytics/package.json`
  - `stubs/szl-holdings-api-client-react/index.cjs`
  - `stubs/szl-holdings-api-client-react/index.mjs`
  - `stubs/szl-holdings-api-client-react/package.json`
  - `stubs/szl-holdings-brand-registry/index.cjs`
  - `stubs/szl-holdings-brand-registry/index.mjs`
  - `stubs/szl-holdings-brand-registry/package.json`
  - `stubs/szl-holdings-design-system/index.cjs`
  - `stubs/szl-holdings-design-system/index.mjs`
  - `stubs/szl-holdings-design-system/package.json`
  - `stubs/szl-holdings-design-system/tokens/css.css`
  - `stubs/szl-holdings-env/index.cjs`
  - `stubs/szl-holdings-env/index.mjs`
  - `stubs/szl-holdings-env/package.json`
  - `stubs/szl-holdings-formulas/index.js`
  - `stubs/szl-holdings-formulas/package.json`
  - `stubs/szl-holdings-graphql-client/index.cjs`
  - `stubs/szl-holdings-graphql-client/index.mjs`
  - `stubs/szl-holdings-graphql-client/package.json`
  - `stubs/szl-holdings-mcp-client/index.cjs`
  - `stubs/szl-holdings-mcp-client/index.mjs`
  - `stubs/szl-holdings-mcp-client/package.json`
  - `stubs/szl-holdings-observability/index.cjs`
  - `stubs/szl-holdings-observability/index.mjs`
  - `stubs/szl-holdings-observability/package.json`
  - `stubs/szl-holdings-offline-engine/index.cjs`
  - `stubs/szl-holdings-offline-engine/index.mjs`
  - `stubs/szl-holdings-offline-engine/package.json`
  - `stubs/szl-holdings-omnia-shell/index.cjs`
  - `stubs/szl-holdings-omnia-shell/index.mjs`
  - `stubs/szl-holdings-omnia-shell/package.json`
  - `stubs/szl-holdings-payload/index.cjs`
  - `stubs/szl-holdings-payload/index.mjs`
  - `stubs/szl-holdings-payload/package.json`
  - `stubs/szl-holdings-platform-registry/index.cjs`
  - `stubs/szl-holdings-platform-registry/index.mjs`
  - `stubs/szl-holdings-platform-registry/package.json`
  - `stubs/szl-holdings-prism-bus/index.cjs`
  - `stubs/szl-holdings-prism-bus/index.mjs`
  - `stubs/szl-holdings-prism-bus/package.json`
  - `stubs/szl-holdings-replit-auth-web/index.cjs`
  - `stubs/szl-holdings-replit-auth-web/index.mjs`
  - `stubs/szl-holdings-replit-auth-web/package.json`
  - `stubs/szl-holdings-security-headers/index.cjs`
  - `stubs/szl-holdings-security-headers/index.mjs`
  - `stubs/szl-holdings-security-headers/package.json`
  - `stubs/szl-holdings-services/index.cjs`
  - `stubs/szl-holdings-services/index.mjs`
  - `stubs/szl-holdings-services/package.json`
  - `stubs/szl-holdings-shared-proxy/index.cjs`
  - `stubs/szl-holdings-shared-proxy/index.mjs`
  - `stubs/szl-holdings-shared-proxy/package.json`
  - `stubs/szl-holdings-shared-ui/index.cjs`
  - `stubs/szl-holdings-shared-ui/index.mjs`
  - `stubs/szl-holdings-shared-ui/package.json`
  - `stubs/szl-holdings-szl-doctrine/index.cjs`
  - `stubs/szl-holdings-szl-doctrine/index.mjs`
  - `stubs/szl-holdings-szl-doctrine/package.json`
  - `stubs/szl-ouroboros-lambda-gate/index.d.ts`
  - `stubs/szl-ouroboros-lambda-gate/index.js`
  - `stubs/szl-ouroboros-lambda-gate/package.json`
  - `stubs/szl-ouroboros-types/index.d.ts`
  - `stubs/szl-ouroboros-types/index.js`
  - `stubs/szl-ouroboros-types/package.json`
  - `stubs/workspace-a11oy-orchestration/index.cjs`
  - `stubs/workspace-a11oy-orchestration/index.mjs`
  - `stubs/workspace-a11oy-orchestration/package.json`
  - `stubs/workspace-aef-contracts/index.cjs`
  - `stubs/workspace-aef-contracts/index.mjs`
  - `stubs/workspace-aef-contracts/package.json`
  - `stubs/workspace-aef-sdk/index.cjs`
  - `stubs/workspace-aef-sdk/index.mjs`
  - `stubs/workspace-aef-sdk/package.json`
  - `stubs/workspace-codex-kernel/index.cjs`
  - `stubs/workspace-codex-kernel/index.mjs`
  - `stubs/workspace-codex-kernel/package.json`
  - `stubs/workspace-ouroboros/index.cjs`
  - `stubs/workspace-ouroboros/index.mjs`
  - `stubs/workspace-ouroboros/package.json`
  - `stubs/workspace-tokens/index.cjs`
  - `stubs/workspace-tokens/index.mjs`
  - `stubs/workspace-tokens/package.json`
  - `web/src/pages/emulation-scorecard.tsx`
  - `web/src/pages/endpoint-mesh.tsx`
  - `web/src/pages/enterprise-demo.tsx`
  - `web/src/pages/evidence-ledger.tsx`
- https://github.com/szl-holdings/sentra/pull/56

### sentra#64 — docs(agents): Cursor Cloud pnpm 11 and tooling gotchas
- State **MERGED** · merged 2026-05-30 · branch `cursor/cloud-dev-env-docs-b66b` → `main` · category **coord/docs** · dest **sentra** · +5/-0 · 1 files · mergeSHA `b18a1e5cbb`
- Signals: `title:cursor;branch:cursor/cloud-dev-env-docs-b66b` · Live: GitHub-only (coordination/infra — not Space payload)
- Files:
  - `AGENTS.md`
- https://github.com/szl-holdings/sentra/pull/64

### sentra#65 — feat(forecasts): witnessed forecasting with Madhava error envelope [Phase 1 L7]
- State **MERGED** · merged 2026-05-29 · branch `cursor/perplexity-l7-witnessed-forecast` → `main` · category **feature** · dest **sentra** · +641/-0 · 3 files · mergeSHA `4d2887ad0b`
- Signals: `branch:cursor/perplexity-l7-witnessed-forecast` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `src/forecasts/__init__.py`
  - `src/forecasts/test_witnessed.py`
  - `src/forecasts/witnessed.py`
- https://github.com/szl-holdings/sentra/pull/65

### szl-uds-deployment#3 — docs: Cursor Cloud development environment guide (AGENTS.md)
- State **OPEN** · merged — · branch `cursor/dev-env-setup-78ac` → `master` · category **page** · dest **uds-demo** · +4336/-0 · 2 files · mergeSHA `—`
- Signals: `title:cursor;branch:cursor/dev-env-setup-78ac` · Live: N/A (not merged)
- Files:
  - `AGENTS.md`
  - `pepr/package-lock.json`
- https://github.com/szl-holdings/szl-uds-deployment/pull/3

### uds-mesh#31 — Add AGENTS.md with Cursor Cloud development instructions
- State **MERGED** · merged 2026-05-29 · branch `cursor/setup-dev-environment-c5a3` → `main` · category **feature** · dest **uds-demo** · +37/-0 · 1 files · mergeSHA `6640550384`
- Signals: `title:cursor;branch:cursor/setup-dev-environment-c5a3` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `AGENTS.md`
- https://github.com/szl-holdings/uds-mesh/pull/31

### uds-mesh#32 — Ecosystem architecture: a11oy as one-of-one + vessels tracking + AGENTS.md
- State **CLOSED** · merged — · branch `cursor/setup-dev-environment-3708` → `main` · category **other** · dest **uds-demo** · +31/-0 · 1 files · mergeSHA `—`
- Signals: `branch:cursor/setup-dev-environment-3708` · Live: N/A (not merged)
- Files:
  - `AGENTS.md`
- https://github.com/szl-holdings/uds-mesh/pull/32

### uds-mesh#44 — ci(release-please): update pinned .github SHA — fix workflow file issue
- State **MERGED** · merged 2026-05-29 · branch `cursor/perplexity-fix-release-please-sha-uds-mesh` → `main` · category **fix** · dest **uds-demo** · +2/-2 · 1 files · mergeSHA `5d4093d3ca`
- Signals: `branch:cursor/perplexity-fix-release-please-sha-uds-mesh` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `.github/workflows/release-please.yml`
- https://github.com/szl-holdings/uds-mesh/pull/44

### uds-mesh#45 — chore(license): add SPDX-License-Identifier headers (uds-mesh)
- State **MERGED** · merged 2026-05-29 · branch `cursor/perplexity-fix-spdx-headers-uds-mesh` → `main` · category **uds** · dest **uds-demo** · +4/-0 · 1 files · mergeSHA `3c87c52042`
- Signals: `branch:cursor/perplexity-fix-spdx-headers-uds-mesh` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `uds_v18_24_substrate.py`
- https://github.com/szl-holdings/uds-mesh/pull/45

### vessels#41 — feat: set up standalone dev environment with workspace stubs
- State **MERGED** · merged 2026-05-29 · branch `cursor/dev-env-setup-f961` → `main` · category **feature** · dest **vessels** · +4159/-0 · 100 files · mergeSHA `80850fd06a`
- Signals: `branch:cursor/dev-env-setup-f961` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `.gitignore`
  - `biome.json`
  - `package.json`
  - `pnpm-lock.yaml`
  - `pnpm-workspace.yaml`
  - `scripts/generate-stubs.mjs`
  - `stubs/szl-holdings__alloy-client/catch-all.js`
  - `stubs/szl-holdings__alloy-client/index.js`
  - `stubs/szl-holdings__alloy-client/package.json`
  - `stubs/szl-holdings__analytics/catch-all.js`
  - `stubs/szl-holdings__analytics/index.js`
  - `stubs/szl-holdings__analytics/package.json`
  - `stubs/szl-holdings__api-client-react/catch-all.js`
  - `stubs/szl-holdings__api-client-react/index.js`
  - `stubs/szl-holdings__api-client-react/package.json`
  - `stubs/szl-holdings__brand-registry/catch-all.js`
  - `stubs/szl-holdings__brand-registry/index.js`
  - `stubs/szl-holdings__brand-registry/package.json`
  - `stubs/szl-holdings__design-system/catch-all.js`
  - `stubs/szl-holdings__design-system/index.js`
  - `stubs/szl-holdings__design-system/package.json`
  - `stubs/szl-holdings__design-system/proof__policy-mode-badge.js`
  - `stubs/szl-holdings__design-system/tokens__css.css`
  - `stubs/szl-holdings__document-intelligence/catch-all.js`
  - `stubs/szl-holdings__document-intelligence/index.js`
  - `stubs/szl-holdings__document-intelligence/package.json`
  - `stubs/szl-holdings__graphql-client/catch-all.js`
  - `stubs/szl-holdings__graphql-client/hooks.js`
  - `stubs/szl-holdings__graphql-client/index.js`
  - `stubs/szl-holdings__graphql-client/package.json`
  - `stubs/szl-holdings__graphql-client/provider.js`
  - `stubs/szl-holdings__mcp-client/catch-all.js`
  - `stubs/szl-holdings__mcp-client/index.js`
  - `stubs/szl-holdings__mcp-client/package.json`
  - `stubs/szl-holdings__monte-carlo/catch-all.js`
  - `stubs/szl-holdings__monte-carlo/index.js`
  - `stubs/szl-holdings__monte-carlo/package.json`
  - `stubs/szl-holdings__monte-carlo/scenario-pool.js`
  - `stubs/szl-holdings__monte-carlo/scenario-simulation.js`
  - `stubs/szl-holdings__monte-carlo/scenarios.js`
  - `stubs/szl-holdings__monte-carlo/schema.js`
  - `stubs/szl-holdings__observability/catch-all.js`
  - `stubs/szl-holdings__observability/configs.js`
  - `stubs/szl-holdings__observability/index.js`
  - `stubs/szl-holdings__observability/package.json`
  - `stubs/szl-holdings__observability/react.js`
  - `stubs/szl-holdings__offline-engine/catch-all.js`
  - `stubs/szl-holdings__offline-engine/index.js`
  - `stubs/szl-holdings__offline-engine/package.json`
  - `stubs/szl-holdings__omnia-shell/catch-all.js`
  - `stubs/szl-holdings__omnia-shell/index.js`
  - `stubs/szl-holdings__omnia-shell/package.json`
  - `stubs/szl-holdings__payload/catch-all.js`
  - `stubs/szl-holdings__payload/index.js`
  - `stubs/szl-holdings__payload/package.json`
  - `stubs/szl-holdings__platform-registry/catch-all.js`
  - `stubs/szl-holdings__platform-registry/domain-claims.js`
  - `stubs/szl-holdings__platform-registry/index.js`
  - `stubs/szl-holdings__platform-registry/package.json`
  - `stubs/szl-holdings__prism-bus/catch-all.js`
  - `stubs/szl-holdings__prism-bus/index.js`
  - `stubs/szl-holdings__prism-bus/package.json`
  - `stubs/szl-holdings__replit-auth-web/catch-all.js`
  - `stubs/szl-holdings__replit-auth-web/index.js`
  - `stubs/szl-holdings__replit-auth-web/package.json`
  - `stubs/szl-holdings__security-headers/catch-all.js`
  - `stubs/szl-holdings__security-headers/index.js`
  - `stubs/szl-holdings__security-headers/package.json`
  - `stubs/szl-holdings__services/catch-all.js`
  - `stubs/szl-holdings__services/index.js`
  - `stubs/szl-holdings__services/package.json`
  - `stubs/szl-holdings__shared-proxy/catch-all.js`
  - `stubs/szl-holdings__shared-proxy/index.js`
  - `stubs/szl-holdings__shared-proxy/package.json`
  - `stubs/szl-holdings__shared-ui/AppObservabilityPage.js`
  - `stubs/szl-holdings__shared-ui/DecisionCenter.js`
  - `stubs/szl-holdings__shared-ui/EmptyState.js`
  - `stubs/szl-holdings__shared-ui/RunConsole.js`
  - `stubs/szl-holdings__shared-ui/SourceHealthStrip.js`
  - `stubs/szl-holdings__shared-ui/UserButton.js`
  - `stubs/szl-holdings__shared-ui/admin-audit-trail.js`
  - `stubs/szl-holdings__shared-ui/agent-insights-widget.js`
  - `stubs/szl-holdings__shared-ui/ai-components.js`
  - `stubs/szl-holdings__shared-ui/ambient-intelligence.js`
  - `stubs/szl-holdings__shared-ui/analytics-provider.js`
  - `stubs/szl-holdings__shared-ui/animated-counter.js`
  - `stubs/szl-holdings__shared-ui/api-fetch.js`
  - `stubs/szl-holdings__shared-ui/app-mode-banner.js`
  - `stubs/szl-holdings__shared-ui/billing.js`
  - `stubs/szl-holdings__shared-ui/catch-all.js`
  - `stubs/szl-holdings__shared-ui/collaboration.js`
  - `stubs/szl-holdings__shared-ui/command-mode.js`
  - `stubs/szl-holdings__shared-ui/command-palette.js`
  - `stubs/szl-holdings__shared-ui/constellation-graph.js`
  - `stubs/szl-holdings__shared-ui/contact-modal.js`
  - `stubs/szl-holdings__shared-ui/cookie-banner.js`
  - `stubs/szl-holdings__shared-ui/copilot-configs.js`
  - `stubs/szl-holdings__shared-ui/copilot.js`
  - `stubs/szl-holdings__shared-ui/crdt-entity-panel.js`
  - `stubs/szl-holdings__shared-ui/data-export.js`
- https://github.com/szl-holdings/vessels/pull/41

### vessels#51 — docs: add deep-dive HF Space showcase link
- State **MERGED** · merged 2026-05-29 · branch `cursor/perplexity-deep-dive-link-vessels` → `main` · category **feature** · dest **vessels** · +13/-0 · 1 files · mergeSHA `b0843afd2d`
- Signals: `branch:cursor/perplexity-deep-dive-link-vessels` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `README.md`
- https://github.com/szl-holdings/vessels/pull/51

### vessels#52 — fix(docs): repair broken URLs in README [doctrine v6 link integrity sweep]
- State **MERGED** · merged 2026-05-29 · branch `cursor/perplexity-fix-broken-links-vessels` → `main` · category **doctrine** · dest **vessels** · +2/-3 · 1 files · mergeSHA `f5a6337abb`
- Signals: `branch:cursor/perplexity-fix-broken-links-vessels` · Live: NOT LIVE in Space (Space rebuilt from Replit; repo source not vendored)  · **RE-INSTILL TARGET**
- Files:
  - `README.md`
- https://github.com/szl-holdings/vessels/pull/52
