# 181 — Org `.github` Cross-Reference + Platform Agent-Config Dirs (Addendum to 180)

**Audit date:** 2026-05-31 (founder addendum, executed 2026-06-01 UTC)
**Author:** Platform Monorepo Every-File Audit subagent
**Companion file:** `180_PLATFORM_MONOREPO_EVERY_FILE.md` (the every-file audit)
**Founder addition:** "cross-reference platform docs against szl-holdings/.github org-level docs… If platform .github/ has different content than szl-holdings/.github org-level, flag the drift… for platform/.codex/ + .agents/ + .codex-plugin/ dirs — read each file… capture what agents are configured, what skills they have, and which surface they target."

**Sources:**
- Platform repo: local clone `/home/user/workspace/szl-platform/` (HEAD `ef1f191`, remote `github.com/szl-holdings/platform.git`)
- Org `.github` repo: cloned fresh from `github.com/szl-holdings/.github.git` to `/tmp/orggithub` (default branch, full read)

---

## Section A — Headline finding: the platform repo and the org `.github` repo tell two different stories

There is a **fundamental narrative/architecture drift** between the two repositories. They are NOT two views of the same system; they describe two different companies.

| Dimension | Platform repo (`.github/profile/README.md` + `copilot-instructions.md`) | Org `.github` repo (`profile/README.md` + `TRUST.md` + `DOCTRINE_V7.md`) |
|---|---|---|
| **What SZL is** | "Governed decision infrastructure layer" — a pnpm/React/Vite/Express **product monorepo** (A11oy fabric + 10 domain web apps + mobile) | "Formally-verified governance gate for agentic AI" — a **Lean 4 proof corpus** + DSSE receipt mesh deployed as **7 canonical Hugging Face Spaces** + 16 substrate repos |
| **Flagship** | A11oy (Now Board, Action Rail, Proof Ledger… 10 UI surfaces) | Λ aggregator proved in Lean against **749 declarations / 14 unique axioms / 168 sorries**; gate decisions emit DSSE receipts onto a Khipu Merkle DAG |
| **Tech stack named** | TypeScript, React 19, Vite 7, Tailwind 4, Express 5, PostgreSQL 16, Drizzle (644 tables), Expo | Lean 4 + Mathlib, FastAPI (amaru 7-chakra), Zarf/Pepr/cosign (vessels), OTel (vsp-otel), UDS bundles |
| **Compliance** | "No SOC2/HIPAA/FedRAMP claimed; roadmap" | EU AI Act Article 12 + NIST AI RMF (MANAGE); SLSA L1 honest |
| **DOI / proofs** | **NONE mentioned** | DOI 10.5281/zenodo.20434276, ORCID 0009-0001-0110-4173, lutar-lean proofs |
| **HF Spaces** | **NONE mentioned** | 7 canonical (a11oy, amaru, sentra, vessels, rosie, uds-demo, README) + 24 total live |
| **Doctrine** | not referenced | Doctrine v7 ENACTED 2026-05-30 (16 clauses, CI-grep-enforced) |
| **Repo self-name** | `szl-holdings/platform` | calls platform "Composing monorepo for the substrate runtime"; org README's templates still say `szl-holdings-platform` (stale) |

**Interpretation (ties directly to the 180 instillation-gap thesis):** The org `.github` repo is the **canonical, public, formally-verified "organism" story**. The platform repo is the **internal product-surface monorepo** whose `.github/profile/README.md` was written for an earlier "decision infrastructure" framing and has **not been re-instilled** with the Lean/receipt/HF-Space substrate identity. This is the same instillation gap documented in 180 (HF Spaces are independent `serve.py` reimplementations that don't import `@workspace/*`/`@szl/substrate`), now visible at the **identity/branding layer**.

---

## Section B — Which is canonical?

**Org-level `.github` is canonical / published-to-public.** Confirmed by:
- The org `profile/README.md` renders at `github.com/szl-holdings` (the org landing page).
- `TRUST.md`, `SECURITY.md`, `security.txt` are the org-wide trust-layer docs; `security.txt` is explicitly "Mirror of https://szlholdings.com/.well-known/security.txt".
- `WORKFLOWS.md` declares the org's **reusable** workflows that every repo "should consume… instead of redefining the same logic locally."
- `DOCTRINE_V7.md` says: "In any conflict between a clause of this doctrine and a standing CI configuration, workflow, or PR template, this doctrine takes precedence."

**Platform `.github/` is the internal, repo-scoped surface** — its own README is literally titled "GitHub Surface Map" and documents per-repo workflows, CODEOWNERS, and templates for the monorepo. The platform `.github/profile/README.md` is a **second, divergent org-profile draft** that should not both exist; only one org profile renders publicly (the org repo's).

> **DRIFT-1 (P1 — branding/identity):** Two different `profile/README.md` org-profile files exist (platform repo and org repo) with contradictory product framing. The platform one (decision-infrastructure / 10 web apps, no proofs/HF/DOI) is stale relative to the canonical org one (formally-verified gate / 7 HF Spaces / Lean 749). Only the org repo's profile renders at github.com/szl-holdings; the platform copy is internal but risks being mistaken for canonical.

---

## Section C — File-by-file cross-reference of the founder-named org docs

### C.1 `TRUST.md` (org) — no platform equivalent
Org trust-posture doc, governed by Doctrine v7 §2/§7. Every claim resolves to a link/SHA/run. Key contents:
- SLSA **L1 honest** (PR .github#103) — explicitly does NOT claim L2/L3.
- DCO sign-off enforced; CODEOWNERS default `@stephenlutar2-hash`.
- CodeQL success runs cited on `.github` (`d304951`) and `platform` (`90ad450`, run 26699466180).
- SSRF guard added in **platform PR #252**.
- **Live Lean numbers** verified at `lutar-lean@3de37e5`: **626 declarations, 14 unique axioms, 189 sorries** — note this DIFFERS from the org profile README's **749 / 14 / 168** and from `.github/data/lean_numbers.json`'s **749 / 14 unique / 163 raw / 146 noncomment**. → see DRIFT-3.
- "Deliberately NOT claimed": no SOC2/ISO, no "trusted by" list, no unbacked badge.

**Platform equivalent:** none. Platform has no TRUST.md. (Platform `.github/README.md` covers CI surface only.)

### C.2 `WORKFLOWS.md` (org) — overlaps platform `.github/workflows/`
Org doc declares **6 reusable workflows** (`reusable-node-ci`, `reusable-codeql`, `reusable-dependency-review`, `reusable-secret-scan`, `reusable-scorecard`, `reusable-trivy`) that consumer repos call via `uses: szl-holdings/.github/.github/workflows/reusable-*.yml@main`.

**Cross-ref vs platform `.github/workflows/` (22 workflow files):**
`a11y.yml, audit-full.yml, build.yml, ci.yml, codeql.yml, codex-kernel-verify.yml, commitlint.yml, dco.yml, dependabot-auto-merge.yml, dependency-review.yml, deploy-staging.yml, e2e.yml, lighthouse.yml, npm-publish.yml, post-deploy-smoke.yml, readme-qa.yml, sbom.yml, scorecard.yml, security.yml, szl-zarf-publish.yml, tests.yml, update-lockfile-vite.yml`

> **DRIFT-2 (P2 — supply-chain hygiene):** Platform does NOT consume the org's reusable workflows. It has **locally-redefined** `codeql.yml`, `dco.yml`, `sbom.yml`, `scorecard.yml`, `dependency-review.yml`, `security.yml` instead of `uses: szl-holdings/.github/.github/workflows/reusable-*.yml@main`. WORKFLOWS.md explicitly says every repo "should consume these instead of redefining the same logic locally." This is exactly the "fix once, every repo gets the fix" single-source-of-truth that the platform is bypassing. Platform-only workflows (`codex-kernel-verify.yml`, `szl-zarf-publish.yml`, `e2e.yml`, `post-deploy-smoke.yml`, `lighthouse.yml`) are legitimately repo-specific and have no org reusable counterpart.

### C.3 `profile/README.md` (org) vs platform `.github/profile/README.md`
See Section A table + DRIFT-1. The org profile is dated "Updated 2026-05-31 post-K10v2 lutar-lean discharge + HF strict-7 cleanup" and lists the **canonical 7 HF Spaces** and 16 substrate repos. The platform profile lists **10 product web apps** and a different roadmap, with zero overlap on the proof/receipt/HF substrate.

### C.4 `templates/` (org) — issue + PR + community-health templates
Org `templates/` holds `README.md` (index), `REPO_README.md` (placeholder repo readme), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1), `SECURITY.md`. Plus `.github/ISSUE_TEMPLATE/` (bug/feature/security/config — `.yml` forms) and `.github/PULL_REQUEST_TEMPLATE.md`.

**Cross-ref vs platform:** Platform has its OWN `.github/ISSUE_TEMPLATE/` (bug_report.md+yml, feature_request.md+yml, security_report.md, config.yml), `PULL_REQUEST_TEMPLATE.md`, `RELEASE_TEMPLATE.md`, `pull_request_template.md` (lowercase duplicate). Per org `templates/README.md` and `WORKFLOWS.md`, org templates apply only to repos that "don't override them locally" — platform **overrides locally**, which is allowed.

> **DRIFT-2b (P3 — cosmetic):** Org `templates/REPO_README.md` and `templates/README.md` still reference the **old repo name `szl-holdings-platform`** and link `docs/audits/github-org.md` on `master`. The canonical repo is now `szl-holdings/platform` (per org profile README). Stale template self-links.

### C.5 `security.txt` + `SECURITY.md` (org)
- `SECURITY.md`: Trust Tier 1, report to security@szlholdings.com, 72h ack / 7d assessment / 90d disclosure, scope = all `szl-holdings/*`, governed by Doctrine v7 (no fake security claims, `STAGED-ADVISORY` label, DSSE receipts on governance decisions).
- `security.txt`: RFC 9116, mirror of szlholdings.com/.well-known, Expires 2027-05-10.

**Cross-ref vs platform:** Platform has NO root SECURITY.md or security.txt; instead `.github/ISSUE_TEMPLATE/security_report.md` redirects to security@szlholdings.com (consistent). Platform correctly defers to org-level security policy. No drift — this is the intended inheritance.

---

## Section D — Bonus org `.github` content highly relevant to the 180 instillation thesis

The org `.github` repo is NOT just community-health files. It contains the **operational brain** of the instillation effort — directly answering the founder's core question about un-instilled surfaces:

### D.1 `coordination/CURSOR_INSTILLATION_OPERATIONAL_PLAN.md` (read in full)
A 238-hour, 19-item Cursor work plan to **instill every Lean theorem/formula into the runtime organs**. Confirms the instillation gap is a KNOWN, TRACKED program:
- **TIER 1 (8 GAPs):** wire anchor formulas + QEC/Wheeler/Shannon/DPI/Graph-Λ/PAC-Bayes theorems into amaru, rosie, vsp-otel, uds-mesh, a11oy, agi-forecast — each with named runtime file, Lean theorem ref, test file, DSSE receipt schema. **These target the substrate organ repos, NOT the platform monorepo.**
- **TIER 2 (6 SORRY discharges):** lutar-lean sorries incl. highest-priority `CAUCHY_ND` (`Lutar/Uniqueness.lean:120`) which "makes the investor claim 'TH10 machine-checked uniqueness' false."
- **TIER 3 (5 INNOV):** new formulas (Wasserstein, Hoeffding-Azuma, Galois, Pinsker, Lyapunov).

> **Cross-ref to 180 P0-#2/#3:** The platform's `packages/substrate` and `packages/codex-kernel` (the moat) are NOT in this plan's organ list — the plan instills into the **8 standalone substrate repos** (amaru/rosie/sentra/vessels/vsp-otel/uds-mesh/agi-forecast/a11oy), confirming the platform monorepo is a **separate, parallel surface** from the canonical organism. This is the structural root of the instillation gap.

### D.2 `cursor-directives/CURSOR_ONE_OF_ONE_MASTER_2026-05-30.md` (read in full)
The master directive. **Canonical numbers (2026-05-30 03:23 UTC):** 24 HF Spaces, 29 datasets, 2 models, 19 GitHub repos, **217 Lean declarations / 12 axioms / 7 sorries** (note: PR #106 kernel-green snapshot — DIFFERS again from 749/14/163; see DRIFT-3), 35/35 anchor formulas, 7 Zenodo DOIs, Putnam 8.3%. Tiers: T0 merge 25+ PRs, T0.5 "real fixes for bullshit" (SLSA L3 lies → L1 honest in 14 repos; fake `echo "Tests OK"` CI in 4 repos; stub modules; missing scenarios dir), T1 instill theorems, T1.5 RAE-1 receipt-attested eval, T2 UDS/Zarf, T3 R&D, T4 public launch.

### D.3 `doctrine/DOCTRINE_V7.md` (read in full)
ENACTED 2026-05-30, supersedes v6. 16 clauses, each CI-grep-enforced via `doctrine_v7_checker.ts`. Key clauses relevant to drift: §2 No Fake Green, §10 Version-Scoped Badge, §11 Canonical-Number Propagation Deadline (48h — the exact mechanism that DRIFT-3 below violates), §12 Staged-Advisory default, §14 Orchestrator-Mediated Writes Explicit (`[orchestrator: <tool>]`), §15 3-of-N corpus convergence, §16 protection-toggle per-merge auth.
Also present: `doctrine/V7.lean`, `doctrine_v7_checker.ts`, `DOCTRINE_V6_TO_V7_DIFF.md`, `ENFORCEMENT_GUIDE.md`, `DOCTRINE_V7_CHECKLIST.md`.

### D.4 Other coordination/ artifacts (inventoried, not all read in full)
`coordination/` (24 Cursor directive/handoff/roadmap files + `anatomy_alive/` harness with run logs, JSON-LD, receipt DAG diagrams, synthetic trace), `docs/` (M2M_ENVELOPE, UDS_CATALOG_SPONSOR_APPLICATION, WARHACKER_DEMO_V3), `.github/data/lean_numbers.json` + `.github/scripts/lean_numbers.py` (the canonical-number generator), `.github/workflows/lean-numbers.yml` + `hf-daily-activity.yml` + `slsa.yml` + 12 reusable-*.yml.

> **DRIFT-3 (P1 — canonical-number drift, Doctrine v7 §11 violation):** Lean corpus numbers are inconsistent across the org's own canonical sources, all supposedly governed by the §11 48-hour propagation rule:
> | Source | Declarations | Unique axioms | Sorries |
> |---|---|---|---|
> | org `profile/README.md` (2026-05-31) | **749** | 14 | **168** |
> | org `.github/data/lean_numbers.json` (2026-05-31 11:00Z, sha c7c0ba17) | **749** | 14 | **163 raw / 146 noncomment** |
> | org `TRUST.md` (lutar-lean@3de37e5) | **626** | 14 | **189** |
> | `CURSOR_ONE_OF_ONE_MASTER` (2026-05-30, PR#106) | **217** | 12 | **7** |
> The 749/626/217 spread reflects different commits, but per §11 these are the same canonical metric and should be propagated within 48h with version anchors. The platform repo, notably, carries **none** of these numbers — so it cannot drift on them, but it also fails to surface the proof posture at all (DRIFT-1).

---

## Section E — Platform agent-config dirs (`.codex/`, `.agents/`, `.codex-plugin/`) — every file read

### E.1 `.codex-plugin/plugin.json` (1.3 KB)
Declares the **PluginMesh** Codex plugin (slug `pluginmesh`, v1.0.0, MIT, author SZL Holdings). "Safe plugin broker for Codex" — searches a catalog of 50+ plugins across 7 categories, maps goals to plugins, generates `.app.json`/`.mcp.json`/Replit payloads. **MCP server:** stdio, `node scripts/mcp-server.mjs`. **Permissions:** `tools`, `filesystem.read`. **12 tools:** `pluginmesh_search/get/categories/route/app_manifest_template/replit_payload/automation_catalog/alloy_commands/replit_ecosystem_payload/hf_model_router/alloy_meridian_blueprint/replit_mcp_activation`. **Security flags:** neverBypassAuth, neverClaimUnauthenticatedAccess, generateSetupTemplatesOnly.
- **Surface targeted:** Codex IDE plugin broker (developer tooling). Matches the `pluginmesh` MCP server found in `mcp.json` in 180.
- **NOTE:** `homepage` = szlholdings.com/pluginmesh; `repository` = `github.com/szl-holdings/monorepo` — **stale repo name** (should be `platform`).

### E.2 `.codex/scheduled-chats.json` (8.7 KB)
"SZL Holdings — Codex Scheduled Chat Automation Catalog" v1.0.0 (updated 2026-04-25). **15 scheduled-chat agents**, each with id/title/category/cadence/cron/prompt. These are GitHub-activity automation agents, NOT runtime services:
| Category | Chats (cron) |
|---|---|
| status | daily-standup (9am M-F), weekly-pr-synthesis (Mon 8am), team-pr-summary (Fri 5pm) |
| release | release-notes (on-demand), pre-tag-verification (on-demand), changelog-update (Fri 4pm) |
| incidents | ci-failure-triage (on-demand), new-issue-triage (10am M-F) |
| quality | bug-scan (Wed 7am), test-gap-identification (Wed 8am), regression-detection (Tue 9am) |
| maintenance | dependency-drift (Thu 8am), outdated-deps (1st-of-month 9am), agents-md-update (Fri 10am) |
| growth | skill-suggestions (15th 9am) |
- **Surface targeted:** GitHub repo automation over the platform monorepo (operates on PRs/issues/CI/CHANGELOG/AGENTS.md). All artifact slugs cited are the **product** slugs (szl-holdings, api-server, command, pulse, aegis, vessels, terra, counsel, sentra, lyte-command-center, a11oy, carlota-jo) — i.e. these agents see the platform's product view, NOT the organism/HF view. Reinforces the two-narrative split.
- `agents-md-update` chat explicitly validates AGENTS.md against `alloy.commands.md`, `ops/audit/routes.json`, `.github/workflows/`, package.json — an internal consistency agent.

### E.3 `.agents/agent_assets_metadata.toml` (20.5 KB) + `.agents/skills/` (10 SKILL dirs + HARVEST_LOG.md)
This is the agent-skill library already counted in 180 (the 10 harvested skills under `.agents/skills/`).
- **`HARVEST_LOG.md`** (read in full): 10 skills harvested 2026-04-25 (Task #3460) from 5 awesome-claude repos, all SHA-pinned. **License compliance:** 4 MIT sources (attributed) + 1 CC-BY-NC-ND (consulted only, no text reproduced). Skills: `pre-flight-thinking, typescript-refactor, react-component-review, monorepo-impact-analysis, debug-protocol, commit-hygiene, dead-code-detector, api-contract-review, dependency-health, doc-comment-hygiene`.
- **Per-skill surface:** all 10 target the **platform monorepo dev loop** (TypeScript/pnpm/Vite/React/Drizzle) — coding-assistant skills, not runtime gates. Each adapted with this-project artifact slugs and `packages/`+`artifacts/` paths.
- **Surface targeted:** Cursor/Codex coding agents working in the platform repo. These are the "what skills they have" answer: 10 engineering-discipline skills (refactor, review, debug, deps, docs, commits, dead-code, impact-analysis, contracts, pre-flight).

> **Agent-config summary:** Platform's agent layer = (a) **PluginMesh** Codex broker plugin (12 tools, MCP via scripts/mcp-server.mjs), (b) **15 scheduled GitHub-automation chats** (cron-driven repo hygiene), (c) **10 harvested coding-discipline skills**. All three operate on the **platform product monorepo** and its GitHub surface. **None** of them reference the Lean corpus, DSSE receipts, HF Spaces, or the canonical-7 organism — confirming, at the agent-config layer, the same instillation gap: the platform's automation knows the product, not the proof substrate.

---

## Section F — Updated drift register (additions to 180)

| ID | Severity | Drift | Canonical | Stale/divergent |
|---|---|---|---|---|
| DRIFT-1 | **P1** | Two contradictory org-profile READMEs (product framing vs formally-verified-gate framing) | org `.github/profile/README.md` | platform `.github/profile/README.md` |
| DRIFT-2 | **P2** | Platform redefines CI workflows locally instead of consuming org reusable-*.yml | org `WORKFLOWS.md` reusable workflows | platform `.github/workflows/{codeql,dco,sbom,scorecard,dependency-review,security}.yml` |
| DRIFT-2b | P3 | Org templates reference old repo name `szl-holdings-platform` | repo is `szl-holdings/platform` | org `templates/REPO_README.md`, `templates/README.md` |
| DRIFT-3 | **P1** | Lean canonical numbers inconsistent across org's own sources (749 vs 626 vs 217 decls; §11 48h propagation at risk) | `.github/data/lean_numbers.json` (749/14/163, sha c7c0ba17) | org `TRUST.md` (626), `CURSOR_ONE_OF_ONE_MASTER` (217), platform repo carries none |
| DRIFT-4 | P3 | `.codex-plugin/plugin.json` repository field = `github.com/szl-holdings/monorepo` (stale) | `szl-holdings/platform` | platform `.codex-plugin/plugin.json` |
| DRIFT-5 | **P1** (re-stated from 180) | Platform agent configs (.codex/.agents/.codex-plugin) + platform profile know only the product surface; the proof/receipt/HF organism is absent from the platform repo entirely | org `.github` (proof organism) | entire platform repo identity layer |

---

## Section G — Return values (this addendum)

- **Org `.github` files read in full:** 8 — `TRUST.md`, `WORKFLOWS.md`, `SECURITY.md`, `security.txt`, `profile/README.md`, `AGENTS.md`, `doctrine/DOCTRINE_V7.md`, `coordination/CURSOR_INSTILLATION_OPERATIONAL_PLAN.md`, `cursor-directives/CURSOR_ONE_OF_ONE_MASTER_2026-05-30.md` (+ `.github/data/lean_numbers.json`, `templates/README.md`, `templates/REPO_README.md` head, platform `.github/copilot-instructions.md`, `.github/README.md`, `.github/profile/README.md`).
- **Platform agent-config files read in full:** 4 — `.codex-plugin/plugin.json`, `.codex/scheduled-chats.json`, `.agents/skills/HARVEST_LOG.md`, plus `.agents/agent_assets_metadata.toml` (inventoried; covered in 180).
- **New drift items flagged:** 6 (DRIFT-1..5 + 2b); **2 are P1** (DRIFT-1 identity, DRIFT-3 canonical-number).
- **Canonical determination:** org-level `.github` is the published/canonical trust + identity layer; platform `.github` is internal repo-scoped surface and is **stale on identity** (no proofs/HF/DOI).
- **Confirms 180 thesis:** the instillation gap is structural and now also visible at the identity, workflow-inheritance, and agent-config layers — the platform monorepo's automation and branding know the *product*, not the *proof substrate organism* described by the canonical org repo and the `CURSOR_INSTILLATION_OPERATIONAL_PLAN`.

---

*Addendum 181 to the Platform Monorepo Every-File Audit. Companion to 180_PLATFORM_MONOREPO_EVERY_FILE.md.*
