# 10_GITHUB_REPO_INVENTORY.md
## GitHub Repo Inventory — Full Re-Audit 2026-05-31
**Scope:** szl-holdings org (GitHub API) + all locally cloned repos  
**Audited:** 2026-05-31 (subagent run)

---

## A. LOCALLY CLONED REPOS

### 1. a11oy
- **Local path:** `/home/user/workspace/szl/repos/a11oy`
- **Status:** NO .git dir (snapshot clone — no git history)
- **Remote:** `https://github.com/szl-holdings/a11oy`
- **Latest SHA:** Unknown locally (no .git); GitHub API HEAD = `3e91d41df6b8a17e006e3f7491e1f0ff567cad00` (deployed SHA from HF audit)
- **Default branch:** main
- **Last commit date:** Unknown locally
- **Top-level:** CHANGELOG.md, CITATION.cff, CODE_OF_CONDUCT.md, CONTRIBUTING.md, GOVERNANCE.md, LICENSE, NOTICE, README.md, ROADMAP.md, SECURITY.md, `__tests__/`, `deploy/`, `docs/`, `packages/`, `social-preview.svg`, `web/`
- **Key subdirs:** `packages/` (a11oy-knowledge, knowledge, measurement, policy, qec-integrity), `web/` (full React/TypeScript app)
- **File counts:** Total: 304 | .py: 1 | .ts/.tsx: 143 | .lean: 0 | .yml/.yaml: 37 | Workflows: 6
- **Workflows:** ci.yml (Docs CI), codeql.yml (CodeQL), dco.yml (DCO), sbom.yml (SBOM), scorecard.yml (Scorecard), slsa.yml (SLSA Level 3 Provenance)
- **Notes:** `web/` contains full SPA with `mythosDoctrine.ts` marked `doctrine-scanner-exempt`. Has `packages/@szl-holdings/frontier-mythos` dep (workspace).

---

### 2. amaru
- **Local path:** `/home/user/workspace/szl/repos/amaru`
- **Latest SHA:** `649dd62169c47cf749191d92595541cd5a24e1c4`
- **Short:** `649dd62 chore(closeout): CITATION.cff — add version field + ORCID`
- **Branch:** `chore/series-a-citation-version`
- **Last commit date:** 2026-05-29 02:37:32 +0000
- **Remote:** `https://github.com/szl-holdings/amaru`
- **Top-level:** CHANGELOG.md, CITATION.cff, docs/, README.md, sidecar/, src/, tests/, web/
- **Key subdirs:** `src/` (amaru_scheduler.py, chakana_wiring.py, chakras/, qec/, yawar_bus.py), `web/` (TypeScript UI)
- **File counts:** Total: 235 | .py: 44 | .ts/.tsx: 86 | .lean: 0 | .yml/.yaml: 15 | Workflows: 6
- **Workflows:** ci.yml (Docs CI), codeql.yml, dco.yml, sbom.yml, scorecard.yml, slsa.yml

---

### 3. sentra
- **Local path:** `/home/user/workspace/szl/repos/sentra`
- **Latest SHA:** `605e57039ca6e154630c2e5878ad9a2398b34c23`
- **Short:** `605e570 fix(dual-use): implement permittedContexts downgrade + case-insensitive match; resolve workspace:* install blocker`
- **Branch:** `fix/dual-use-context-downgrade-and-workspace-protocol`
- **Last commit date:** 2026-05-31 15:47:45 +0000
- **Remote:** `https://github.com/szl-holdings/sentra`
- **Top-level:** CHANGELOG.md, CITATION.cff, docs/, NOTE_WORKSPACE_PROTOCOL.md, README.md, runtime/, src/, web/
- **Key subdirs:** `src/` (qec/, sentra_immune.py, tupu_replay_5x.py, tupu_verify.py), `web/` (Node/TS with Dockerfile)
- **File counts:** Total: 236 | .py: 3 | .ts/.tsx: 175 | .lean: 0 | .yml/.yaml: 15 | Workflows: 6
- **Workflows:** ci.yml (Docs CI), codeql.yml, dco.yml, sbom.yml, scorecard.yml, slsa.yml
- **Notes:** NOTE_WORKSPACE_PROTOCOL.md present (workspace:* blocker resolved). sentra web imports from mythosDoctrine.ts path in a11oy.

---

### 4. vessels
- **Local path:** `/home/user/workspace/szl/repos/vessels`
- **Latest SHA:** `5907e24cfc1cad8f4fb15734dd66e672cdd7c671`
- **Short:** `5907e24 chore(closeout): Series-A polish — README, CITATION.cff version, DCO`
- **Branch:** `chore/series-a-polish-readme-citation-dco`
- **Last commit date:** 2026-05-29 02:30:02 +0000
- **Remote:** `https://github.com/szl-holdings/vessels`
- **Top-level:** CHANGELOG.md, CITATION.cff, docs/, README.md, SECURITY.md, web/
- **Key subdirs:** `web/` (TypeScript/Node)
- **File counts:** Total: 200 | .py: 0 | .ts/.tsx: 163 | .lean: 0 | .yml/.yaml: 6 | Workflows: 4
- **Workflows:** ci.yml (Docs CI), codeql.yml, dco.yml, scorecard.yml
- **Notes:** Missing slsa.yml and sbom.yml vs other repos.

---

### 5. rosie
- **Local path:** `/home/user/workspace/szl/repos/rosie`
- **Latest SHA:** `24ba2db7d8747d3ca2415532cba75102bf7c1585`
- **Short:** `24ba2db feat(hf-deploy): Wasichaq-III — Tab 7 + widget v2.0.0 + sentra embed workflow`
- **Branch:** `chore/series-a-citation-security-fix`
- **Last commit date:** 2026-06-01 01:17:59 +0000
- **Remote:** `https://github.com/szl-holdings/rosie`
- **Top-level:** CHANGELOG.md, CITATION.cff, README.md, SECURITY.md, hf-deploy/, src/, tests/
- **Key subdirs:** `src/` (axis-value-option.ts, horus-eye-weights.ts, khipu-receipt.ts, qec/, rosie-widget.js), `hf-deploy/` (app_rosie_tab7.py, rosie-widget-v2.js, sentra_index.html)
- **File counts:** Total: 35 | .py: 1 | .ts/.tsx: 9 | .lean: 0 | .yml/.yaml: 9 | Workflows: 7
- **Workflows:** ci.yml (CI), codeql.yml, dco.yml, hf-deploy.yml (HF Deploy — Rosie Tab 7 + Widget v2 + Sentra Embed), sbom.yml, scorecard.yml, slsa.yml

---

### 6. vsp-otel
- **Local path:** `/home/user/workspace/szl/repos/vsp-otel`
- **Latest SHA:** `e20732edbcd8ea236596df8221463a8ca0091145`
- **Short:** `e20732e fix(claims): sync canonical numbers — 626/15/26/29 (readiness 2026-05-30)`
- **Branch:** `main`
- **Last commit date:** 2026-05-30 10:41:47 -0400
- **Remote:** `https://github.com/szl-holdings/vsp-otel`
- **Top-level:** AGENTS.md, CHANGELOG.md, CITATION.cff, README.md, package.json, runtime/, src/, stubs/, test/
- **Key subdirs:** `src/` (pipeline/, redaction/, sla/)
- **File counts:** Total: 49 | .py: 0 | .ts/.tsx: 17 | .lean: 0 | .yml/.yaml: 11 | Workflows: 7
- **Workflows:** ci.yml (CI), codeql.yml, dco.yml, fuzz.yml, sbom.yml, scorecard.yml, tests.yml

---

### 7. uds-mesh
- **Local path:** `/home/user/workspace/szl/repos/uds-mesh`
- **Latest SHA:** `2246a39c0d7bb2d2eebbb7f2838f2d42ddced832`
- **Short:** `2246a39 fix(claims): sync canonical numbers + land BFT caveat doc (readiness 2026-05-30)`
- **Branch:** `main`
- **Last commit date:** 2026-05-30 10:42:06 -0400
- **Remote:** `https://github.com/szl-holdings/uds-mesh`
- **Top-level:** AGENTS.md, CHANGELOG.md, CITATION.cff, bundles/, docs/, extended-attestations.jsonl, formula_receipts.py, pepr/, schemas/, tests/, uds-bundle.yaml, uds_v18_24_substrate.py
- **Key subdirs:** `pepr/`, `schemas/`, `bundles/`
- **File counts:** Total: 41 | .py: 7 | .ts/.tsx: 1 | .lean: 0 | .yml/.yaml: 14 | Workflows: 8
- **Workflows:** ci.yml (CI), codeql.yml, dco.yml, fuzz.yml, release-please.yml (Release Please), sbom.yml, scorecard.yml, tests.yml

---

### 8. agi-forecast
- **Local path:** `/home/user/workspace/szl/repos/agi-forecast`
- **Latest SHA:** `13ba21583306db2580506582903b71d2da58f7ed`
- **Short:** `13ba215 fix(docs): replace Bekenstein bound with Shannon entropy bound [PhD audit]`
- **Branch:** `phd-fix/ml/bekenstein-bound-correction`
- **Last commit date:** 2026-05-29 19:58:41 +0000
- **Remote:** `https://github.com/szl-holdings/agi-forecast`
- **Top-level:** CHANGELOG.md, CITATION.cff, README.md, SECURITY.md, runtime/
- **Key subdirs:** `runtime/src/` (brier.ts, derived.ts, gauge-types.ts, gauges.ts, server.ts, putnam-2025/)
- **File counts:** Total: 33 | .py: 0 | .ts/.tsx: 7 | .lean: 0 | .yml/.yaml: 7 | Workflows: 5
- **Workflows:** ci.yml (CI), codeql.yml, dco.yml, sbom.yml, scorecard.yml
- **Notes:** Bekenstein bound reference in README corrected to Shannon entropy bound per PhD audit. Branch not yet merged to main.

---

### 9. ouroboros (snapshot clone — no .git)
- **Local path:** `/home/user/workspace/szl/repos/ouroboros`
- **Status:** NO .git dir (snapshot clone)
- **Remote:** `https://github.com/szl-holdings/ouroboros`
- **Top-level:** CHANGELOG.md, CITATION.cff, agentic/, biome.json, docs/, package.json, packages/, pnpm-lock.yaml, runtime/, scripts/, src/, tsconfig.json, vitest.config.ts
- **Key subdirs:** `src/` (almanac.ts, consistency.ts, depth-allocator.ts, index.ts, loop-kernel.ts, proof-route.ts, risk-tier.ts, runtime-contract.test.ts, types.ts), `packages/ouroboros/`
- **File counts:** Total: 162 | .py: 0 | .ts/.tsx: 77 | .lean: 0 | .yml/.yaml: 11 | Workflows: 7
- **Workflows:** cflite_pr.yml (ClusterFuzzLite PR fuzzing), ci.yml (CI), dco.yml, doi-title-gate.yml (huklla-t11), sbom.yml, scorecard.yml, slsa.yml

### 9b. ouroboros-git (git clone via proxy)
- **Local path:** `/home/user/workspace/szl/git-repos/ouroboros-git`
- **Latest SHA:** `007d260067ddf5b9684a91d023bdb8b1f6aa2445`
- **Short:** `007d260 fix(audit): correct README/zenodo claims — DOI badge line, test count, Node version, Doctrine version`
- **Branch:** `perplexity/ouroboros-readiness-2026-05-30`
- **Last commit date:** 2026-05-30 10:43:27 -0400
- **Remote:** `https://git-agent-proxy.perplexity.ai/szl-holdings/ouroboros.git`
- **File counts:** Total: 176 | .py: 1 (OUROBOROS_RUN_ALL.py) | .ts/.tsx: 86 | .lean: 0 | .yml/.yaml: 15 | Workflows: 10
- **Additional vs snapshot:** AGENTS.md, OUROBOROS_RUN_ALL.py, codeql.yml, fuzz.yml, release-please.yml, tests.yml

---

### 10. dotgithub (.github org repo)
- **Local path:** `/home/user/workspace/szl/repos/dotgithub`
- **Latest SHA:** `be9b3047ba936f2db300c60b28a2c65b58be529f`
- **Short:** `be9b304 feat(coordination): CURSOR_INSTILLATION_OPERATIONAL_PLAN — theorems+formulas zoom-out`
- **Branch:** `chore/cursor-instillation-operational-plan`
- **Last commit date:** 2026-05-29 22:43:35 +0000
- **Remote:** `https://github.com/szl-holdings/.github`
- **Top-level:** AGENTS.md, assets/, coordination/, docs/, profile/, security.txt, templates/, WORKFLOWS.md
- **File counts:** Total: 114 | .py: 2 | .ts/.tsx: 0 | .lean: 0 | .yml/.yaml: 27 | Workflows: 21
- **Workflows:** ci.yml, codeql.yml, dco.yml, hf-daily-activity.yml, pin-check.yml, 16 reusable-*.yml files, sbom.yml, scorecard.yml, slsa.yml, tests.yml

---

### 11. szl-trust
- **Local path:** `/home/user/workspace/szl/repos/szl-trust`
- **Latest SHA:** `3f68c1a01ef1609edef6b32c08200ea08e2c3860`
- **Branch:** `chore/series-a-polish-readme-citation-dco`
- **Last commit date:** 2026-05-29 02:27:05 +0000
- **Remote:** `https://github.com/szl-holdings/szl-trust`
- **Top-level:** CITATION.cff, CODE_OF_CONDUCT.md, LICENSE, NOTICE, README.md, SECURITY.md, runs/
- **File counts:** Total: 27 | .py: 0 | .ts/.tsx: 0 | .lean: 0 | .yml/.yaml: 7 | Workflows: 6
- **Workflows:** ci.yml (ci), codeql.yml, dco.yml, doi-title-gate.yml (huklla-t11), sbom.yml, scorecard.yml

---

### 12. szl-cookbook
- **Local path:** `/home/user/workspace/szl/repos/szl-cookbook`
- **Latest SHA:** `a292a7a295dcb8a9d58272f19db96dabb15b2ebd`
- **Branch:** `chore/series-a-citation-security-fix`
- **Last commit date:** 2026-05-29 02:39:37 +0000
- **Remote:** `https://github.com/szl-holdings/szl-cookbook`
- **Top-level:** CHANGELOG.md, CITATION.cff, meta/, ops/, recipes/, skills/
- **File counts:** Total: 117 | .py: 0 | .ts/.tsx: 17 | .lean: 2 | .yml/.yaml: 9 | Workflows: 6
- **Workflows:** anatomy-evolved-ci.yml, ci.yml, codeql.yml, dco.yml, sbom.yml, scorecard.yml
- **Notes:** Contains `ops/REPLIT_HARDCODE_PAYLOAD/` with substantial banned-token audit records. Two .lean files (recipe scaffolding).

---

### 13. counsel
- **Local path:** `/home/user/workspace/szl/repos/counsel`
- **Latest SHA:** `fd5ad4ae247836dc4df789088e823558ab0038b0`
- **Branch:** `chore/series-a-polish-readme-citation-dco-v2`
- **Last commit date:** 2026-05-29 02:35:21 +0000
- **Remote:** `https://github.com/szl-holdings/counsel`
- **Top-level:** CHANGELOG.md, CITATION.cff, docs/, README.md, SECURITY.md, social-preview.svg
- **File counts:** Total: 18 | .py: 0 | .ts/.tsx: 0 | .lean: 0 | .yml/.yaml: 6 | Workflows: 5
- **Workflows:** ci.yml (Docs CI), codeql.yml, dco.yml, sbom.yml, scorecard.yml

---

### 14. terra
- **Local path:** `/home/user/workspace/szl/repos/terra`
- **Latest SHA:** `7fbabc2ee286b815375cd3cfbbbbeecb094049d9`
- **Branch:** `chore/series-a-polish-readme-citation-dco`
- **Last commit date:** 2026-05-29 02:30:01 +0000
- **Remote:** `https://github.com/szl-holdings/terra`
- **Top-level:** CHANGELOG.md, CITATION.cff, docs/, README.md, SECURITY.md, social-preview.svg
- **File counts:** Total: 17 | .py: 0 | .ts/.tsx: 0 | .lean: 0 | .yml/.yaml: 5 | Workflows: 4
- **Workflows:** ci.yml (Docs CI), codeql.yml, dco.yml, scorecard.yml

---

### 15. carlota-jo
- **Local path:** `/home/user/workspace/szl/repos/carlota-jo`
- **Latest SHA:** `e9d413710334b6152894a969b5b86c0d9f73fd21`
- **Branch:** `chore/series-a-polish-readme-citation-dco`
- **Last commit date:** 2026-05-29 02:29:59 +0000
- **Remote:** `https://github.com/szl-holdings/carlota-jo`
- **Top-level:** CHANGELOG.md, CITATION.cff, docs/, README.md, SECURITY.md, social-preview.svg
- **File counts:** Total: 17 | .py: 0 | .ts/.tsx: 0 | .lean: 0 | .yml/.yaml: 5 | Workflows: 4
- **Workflows:** ci.yml (Docs CI), codeql.yml, dco.yml, scorecard.yml

---

### 16. lutar-lean
- **Local path:** `/home/user/workspace/szl/lutar-lean`
- **Latest SHA:** `f3ae58085ecb79de09e622426bf82f661e1794bb`
- **Short:** `f3ae580 docs(lean): clarify Banach namespace rationale for LiuHuiPi.lean [PhD audit]`
- **Branch:** `phd-fix/history/liuhui-banach-namespace-comment`
- **Last commit date:** 2026-05-29 19:59:46 +0000
- **Remote:** `https://github.com/szl-holdings/lutar-lean.git`
- **Top-level:** CHANGELOG.md, CITATION.cff, Lutar.lean, Lutar/, Main.lean, MainRef.lean, README.md, RefVectors.lean, TH8/, docs/, lake-manifest.json, lakefile.lean, lean-toolchain, reference-vectors.json
- **Key subdirs:** `Lutar/` (62 .lean files — Axioms, Banach, Bound, Brahmi, Calibration, Composition, Correlator, Crt, DPI, DPOFeasibility, Doctrine, DoctrineV3, Egyptian, Feynman, Gates, GraphLambda, HUKLLA, Invariant, Khipu, Knot, Lambda, OVERWATCH, PACBayes, PRNG, PositionAware, Precision, Propagation, QEC, Shannon, Thresholds, Topology, Transduction, TwoWitness, Uniqueness, Wheeler)
- **File counts:** Total: 93 | .py: 0 | .ts/.tsx: 0 | .lean: 62 | .yml/.yaml: 8 | Workflows: 7
- **Workflows:** codeql.yml, dco.yml, doi-title-gate.yml, lean.yml (Lean kernel check), sbom.yml, scorecard.yml, slsa.yml
- **Notes:** No `Bekenstein.lean` file. TH6 (Bekenstein via DPI) proof is in `Lutar/DPI/TH6_DPI_Soundness.lean`.

---

### 17. thesis-repo (ouroboros-thesis)
- **Local path:** `/home/user/workspace/szl/thesis-repo`
- **Latest SHA:** `0c8577f97bed1a3bde9b1804ce7326cbe34a2164`
- **Short:** `0c8577f cross-link: add lean-proof-playground badge`
- **Branch:** `main`
- **Last commit date:** 2026-05-29 04:19:43 +0000
- **Remote:** `https://github.com/szl-holdings/ouroboros-thesis`
- **Top-level:** CHANGELOG.md, CITATION.cff, arxiv_pkg/, arxiv_pkg_v14/, docs/, figures/, ouroboros-runtime-contract.v2.json, ouroboros-thesis-v2.docx, ouroboros-thesis-v2.md, papers/, phd_thesis/, v2/, zenodo_pkg/
- **File counts:** Total: 291 | .py: 13 | .ts/.tsx: 6 | .lean: 16 | .yml/.yaml: 6 | Workflows: 5
- **Workflows:** ci.yml (Docs CI), docs-only-paths-guard.yml, doi-backfill.yml (DOI/Zenodo backfill — unnamed in YAML), doi-title-gate.yml (huklla-t11), scorecard.yml

### 17b. ouroboros-thesis-git (via proxy)
- **Local path:** `/home/user/workspace/szl/git-repos/ouroboros-thesis-git`
- **Latest SHA:** `60b4af96764c4ce07e7463f564bf940deb430c60`
- **Short:** `60b4af9 fix(doi-gate): separate Doctrine v7 from DOI line to unblock huklla-t11`
- **Branch:** `perplexity/ouroboros-thesis-doi-gate-fix-2026-05-30`
- **Last commit date:** 2026-05-30 14:47:21 +0000
- **Remote:** `https://git-agent-proxy.perplexity.ai/szl-holdings/ouroboros-thesis.git`
- **File counts:** Total: 376 | .py: 13 | .ts/.tsx: 6 | .lean: 16 | .yml/.yaml: 12 | Workflows: 11
- **Additional vs main:** arxiv_pkg_v15/, tex/, thesis.pdf, ouroboros-thesis-v18.pdf, AGENTS.md, codeql.yml, dco.yml, fuzz.yml, pages.yml, sbom.yml, tests.yml

---

### 18. szl-brand
- **Local path:** `/home/user/workspace/szl/repos/szl-brand`
- **Status:** NO .git dir (snapshot clone)
- **Remote:** `https://github.com/szl-holdings/szl-brand`
- **Top-level:** CHANGELOG.md, CITATION.cff, anatomy/, docs/, mockups/, motion/, posts/, pyproject.toml, social-previews/
- **File counts:** Total: 119 | .py: 9 | .ts/.tsx: 0 | .lean: 0 | .yml/.yaml: 7 | Workflows: 5
- **Workflows:** ci.yml, codeql.yml, dco.yml, sbom.yml, scorecard.yml

---

## B. REPOS IN szl-holdings ORG — NOT CLONED LOCALLY (FLAG)

These 4 repos exist in the szl-holdings GitHub org but have **no local clone** in `/home/user/workspace/szl/`:

| Repo | Description | Latest SHA | Last Updated | Branch |
|------|-------------|-----------|--------------|--------|
| **platform** | SZL Holdings monorepo — substrate runtime, agentic loops, MCP server (11 tools), reusable workflows. Doctrine v7 | `ef1f191378df5e718a5e667ef1254cdc269b81df` | 2026-05-31T21:44:24Z | main |
| **szl-uds-deployment** | SZL Governance Receipts — UDS running deployment (k3d + uds-cli + Pepr DSSE receipt policy) | `502d42f0c143729cae0447d9fb77bf6f5d4773af` | 2026-05-31T20:15:21Z | master |
| **du-upstream-contributions** | Staging repo for upstream contributions to Defense Unicorns (Pepr fail-CLOSED, Zarf, UDS). Doctrine v7 | `c0605f9ad95aabf0e5d27829c0971bc03cc26943` | 2026-05-31T21:21:27Z | main |
| **demo-repository** | Archived — internal template repository | `13572bfa6fe5be2ad4629add91ac3e7934d1c5b7` | 2026-05-05T13:42:47Z | main |

**⚠️ FLAGGED:** `platform` (size: 637,669 KB — largest repo), `szl-uds-deployment`, and `du-upstream-contributions` are active repos with commits as recent as 2026-05-31 and are NOT locally cloned. These must be pulled for a complete audit.

---

## C. SUMMARY TABLE

| Repo | Has .git | Latest SHA (short) | Branch | Last Commit | Total Files | .py | .ts/.tsx | .lean | Workflows |
|------|----------|-------------------|--------|-------------|-------------|-----|----------|-------|-----------|
| a11oy | NO | (3e91d41 from HF) | main | unknown | 304 | 1 | 143 | 0 | 6 |
| amaru | YES | 649dd62 | chore/series-a-citation-version | 2026-05-29 | 235 | 44 | 86 | 0 | 6 |
| sentra | YES | 605e570 | fix/dual-use-context-downgrade | 2026-05-31 | 236 | 3 | 175 | 0 | 6 |
| vessels | YES | 5907e24 | chore/series-a-polish | 2026-05-29 | 200 | 0 | 163 | 0 | 4 |
| rosie | YES | 24ba2db | chore/series-a-citation-security-fix | 2026-06-01 | 35 | 1 | 9 | 0 | 7 |
| vsp-otel | YES | e20732e | main | 2026-05-30 | 49 | 0 | 17 | 0 | 7 |
| uds-mesh | YES | 2246a39 | main | 2026-05-30 | 41 | 7 | 1 | 0 | 8 |
| agi-forecast | YES | 13ba215 | phd-fix/ml/bekenstein | 2026-05-29 | 33 | 0 | 7 | 0 | 5 |
| ouroboros (snap) | NO | (007d260 git) | perplexity/readiness | 2026-05-30 | 162 | 0 | 77 | 0 | 7 |
| ouroboros-git | YES | 007d260 | perplexity/ouroboros-readiness | 2026-05-30 | 176 | 1 | 86 | 0 | 10 |
| dotgithub (.github) | YES | be9b304 | chore/cursor-instillation | 2026-05-29 | 114 | 2 | 0 | 0 | 21 |
| szl-trust | YES | 3f68c1a | chore/series-a-polish | 2026-05-29 | 27 | 0 | 0 | 0 | 6 |
| szl-cookbook | YES | a292a7a | chore/series-a-citation-security | 2026-05-29 | 117 | 0 | 17 | 2 | 6 |
| counsel | YES | fd5ad4a | chore/series-a-polish-v2 | 2026-05-29 | 18 | 0 | 0 | 0 | 5 |
| terra | YES | 7fbabc2 | chore/series-a-polish | 2026-05-29 | 17 | 0 | 0 | 0 | 4 |
| carlota-jo | YES | e9d4137 | chore/series-a-polish | 2026-05-29 | 17 | 0 | 0 | 0 | 4 |
| lutar-lean | YES | f3ae580 | phd-fix/history/liuhui | 2026-05-29 | 93 | 0 | 0 | 62 | 7 |
| thesis-repo | YES | 0c8577f | main | 2026-05-29 | 291 | 13 | 6 | 16 | 5 |
| ouroboros-thesis-git | YES | 60b4af9 | perplexity/doi-gate-fix | 2026-05-30 | 376 | 13 | 6 | 16 | 11 |
| szl-brand (snap) | NO | unknown | main | unknown | 119 | 9 | 0 | 0 | 5 |
| **platform** | NOT CLONED | ef1f191 | main | 2026-05-31 | ~large | ? | ? | ? | 28 |
| **szl-uds-deployment** | NOT CLONED | 502d42f | master | 2026-05-31 | ? | ? | ? | ? | 7 |
| **du-upstream-contrib** | NOT CLONED | c0605f9 | main | 2026-05-31 | ? | ? | ? | ? | 1 |
| **demo-repository** | NOT CLONED | 13572bf | main | 2026-05-05 | ~small | ? | ? | ? | ? |
