# 180 — Platform Monorepo Every-File Audit

**Repo:** `szl-holdings/platform` (private monorepo)
**Checkout audited:** `/home/user/workspace/szl-platform/` (full clone — NOT the partial `platform_sparse`)
**Git HEAD:** `ef1f191` — *chore(security): add Trust Tier 1 + 90-day disclosure window to SECURITY.md (#270)*
**Tracked files:** **8,208** (all 8,208 present on disk; clean working tree)
**Remote:** `https://github.com/szl-holdings/platform.git`
**Audit date:** 2026-05-31
**Founder verbatim driver:** *"then go through the mono repo you need to go through each repo and look for the tab code and go through each one by one"*

> **Note on checkout choice.** Two checkouts exist in the workspace. `szl/repos/platform → platform_sparse` is a partial 7,378-file checkout. `/home/user/workspace/szl-platform/` is the **complete** 8,208-file clone at HEAD `ef1f191` and is the one used for this every-file audit. No re-clone was needed; disk was at 92% so a fresh `--depth 50` clone was avoided.

---

## Section 0 — Headline numbers

| Metric | Value |
|---|---|
| Tracked files inventoried | **8,208** |
| Top-level files | 56 (32 docs/config read; 10 critical docs read in full) |
| Top-level directories | 41 |
| Critical docs read in full | **17** (see §2) |
| `SKILL.md` files in repo | **12** (2 in `skills/`, 10 in `.agents/skills/`) — cookbook cites 9; platform has **more** |
| `packages/` | **134** workspace packages (26 are `ouroboros-*`) |
| `lib/` packages | 53 |
| `services/` | 8 microservices (4 TS, 3 Python, 1 Python vertical pack tree) |
| `apps/` | 5 (3 TS APIs, 1 Python eval-runner, 1 Python substrate-inference) |
| `docs/` markdown files | 838 (1,118 files total incl. schemas) |
| Registered artifacts (`artifact.toml`) | **6** (SOT claims 9 → **drift**, see §10) |
| Thesis papers in `papers/*.tex` | **8** (SOT claims 10 → **drift**, see §10) |
| **P0 un-shipped surfaces** | **3** (see §11) |

---

## Section 1 — Top-level file inventory

Every top-level file. Type key: DOC / CONFIG / CODE / ASSET / DATA. "Live-ref" = referenced by a live HF Space (see §9–§10 for the cross-reference basis; nearly all are NOT, because Spaces are independent reimplementations).

| File | Size | Type | One-line description | Class | Live HF ref? |
|---|---|---|---|---|---|
| `ACCESS-CONTROL-MATRIX.md` | 4.9 KB | DOC | 12-row `platform_role` hierarchy + legacy RBAC mapping | DOCTRINE | no |
| `AGENTS.md` | 25.6 KB | DOC | Authoritative repo operating doctrine + 18-agent roster pointer | DOCTRINE | no |
| `ANALYTICS-EVENTS.md` | 10 KB | DOC | Analytics event catalogue | DOC | no |
| `API-CATALOGUE.md` | 856 KB | DOC | Full generated API endpoint catalogue (largest doc) | API_ENDPOINT | no |
| `API-SPEC.md` | 150 B | DOC | **Stub** → `docs/API-SPEC.md` | DOC (stub) | no |
| `ARCHITECTURE.md` | 6.6 KB | DOC | 9-step loop, layer model, 6 primitives; → `docs/architecture/` | DOCTRINE | no |
| `BILLING.md` | 9.3 KB | DOC | Billing model | DOC | no |
| `CHANGELOG.md` | 28 KB | DOC | Keep-a-Changelog history | DOC | no |
| `CITATION.cff` | 1.7 KB | CONFIG | v14.0.0 citation (bumped per GAP-DD-004) | PROOF | no |
| `CODE_OF_CONDUCT.md` | 2 KB | DOC | CoC | DOC | no |
| `CONTEXT.md` | 4.8 KB | DOC | Repo context primer | DOC | no |
| `CONTRIBUTING.md` | 8 KB | DOC | Contribution guide | DOC | no |
| `CREDENTIAL_ROTATION.md` | 10.5 KB | DOC | Firebase/Google/EAS rotation runbook (closes KG001) | DOC | no |
| `DATA-MODEL.md` | 3.4 KB | DOC | 170 schema files / 939 pgTable / 730 live tables | DOC | no |
| `ENVIRONMENT_VARIABLES.md` | 3.7 KB | DOC | Env var reference | CONFIG | no |
| `EXECUTIVE_AUDIT_SUMMARY.md` | 220 B | DOC | **Stub** → `docs/EXECUTIVE_AUDIT_SUMMARY.md` | DOC (stub) | no |
| `INCIDENT_RESPONSE.md` | 4.4 KB | DOC | IR runbooks | DOC | no |
| `KNOWN-GAPS.md` | 15.6 KB | DOC | Remediation log + GAP-DD-001..004 + gitleaks findings | DOCTRINE | no |
| `LICENSE` | 2.6 KB | CONFIG | Apache-2.0 | CONFIG | no |
| `MODEL_BACKBONE_BLUEPRINT.md` | 10.7 KB | DOC | Alloy coordinator + 8 specialists + eval-os jury | DOCTRINE | no |
| `NOTICE` | 562 B | CONFIG | Attribution notice | CONFIG | no |
| `PRODUCT-SURFACES.md` | 5.6 KB | DOC | 11 web + mobile + media surface taxonomy | DOCTRINE | no |
| `README.md` | 20 KB | DOC | Platform README | DOC | no |
| `RELEASE_CHECKLIST.md` | 3.3 KB | DOC | `pnpm release:check` gate sequence | DOC | no |
| `SECRETS_SETUP.md` | 4 KB | DOC | Secrets setup | DOC | no |
| `SECURITY-CHECKLIST.md` | 4.8 KB | DOC | Security controls (corrected per GAP-DD-002) | DOC | no |
| `SECURITY.md` | 6.3 KB | DOC | Trust Tier 1 + 90-day disclosure (HEAD commit) | DOC | no |
| `SOURCE_OF_TRUTH.md` | 7.4 KB | DOC | Canonical metric ledger + platform name map | DOCTRINE | no |
| `SUBSTRATE.md` | 9.8 KB | DOC | Substrate Edge Inference (oLLM) config guide | DOCTRINE | no |
| `SUPPORT.md` | 1.6 KB | DOC | Support policy | DOC | no |
| `SZL-Standby-Content-Calendar.docx` | 386 KB | ASSET | Marketing content calendar | ASSET | no |
| `THESIS_PUBLICATIONS.md` | 27 KB | DOC | Canonical 11-paper thesis ledger + 24 innovations | PROOF | no |
| `alloy.commands.md` | 182 B | DOC | **Stub** → `docs/alloy.commands.md` | DOC (stub) | no |
| `alloy.mcp.commands.md` | 188 B | DOC | **Stub** → `docs/alloy.mcp.commands.md` | DOC (stub) | no |
| `alloy.meridian.commands.md` | 197 B | DOC | **Stub** → `docs/alloy.meridian.commands.md` | DOC (stub) | no |
| `app.json` / `.app.json` | 524 B | CONFIG | Replit app manifest | CONFIG | no |
| `biome.json` | 3.5 KB | CONFIG | Biome lint/format config | CONFIG | no |
| `commitlint.config.js` | 70 B | CONFIG | Commitlint | CONFIG | no |
| `ecosystem-plugin-registry.json` | 10 KB | CONFIG | Plugin registry — 5 shared + per-vertical plugins | CONFIG | no |
| `lighthouserc.json` / `.lighthouserc.json` | 591 B | CONFIG | Lighthouse CI | CONFIG | no |
| `llms.txt` | 3.8 KB | DOC | LLM instruction file — A11oy API + concepts | DOCTRINE | no |
| `main.py` | 1 KB | CODE | Replit run target → `apps/substrate-inference/src/main.py` | CONFIG | no |
| `mcp.json` / `.mcp.json` | 544 B | CONFIG | MCP servers: pluginmesh, alloy, github | CONFIG | no |
| `package.json` | 12.8 KB | CONFIG | Root workspace package (pnpm, Node ≥24) | CONFIG | no |
| `playwright.config.ts` | 1.7 KB | CONFIG | Playwright E2E config | CONFIG | no |
| `pnpm-lock.yaml` | 769 KB | CONFIG | Lockfile | CONFIG | no |
| `pnpm-workspace.yaml` | 5.1 KB | CONFIG | Workspace globs + dependency catalog | CONFIG | no |
| `pyproject.toml` | 143 B | CONFIG | Root Python project marker | CONFIG | no |
| `replit.md` | 11.3 KB | DOC | Replit bootstrap doc | CONFIG | no |
| `replit.nix` | 710 B | CONFIG | Replit Nix deps | CONFIG | no |
| `social-preview.svg` | 3.3 KB | ASSET | OG social preview | ASSET | no |
| `threat_model.md` | 22.9 KB | DOC | Platform threat model (actors, flows, assets, boundaries) | DOCTRINE | no |
| `tsconfig.base.json` / `tsconfig.json` | — | CONFIG | TS project refs | CONFIG | no |
| `turbo.json` | 1.5 KB | CONFIG | Turborepo pipeline | CONFIG | no |
| `vitest.config.ts` | 20.2 KB | CONFIG | Root vitest config | CONFIG | no |
| `vitest.components.config.ts` | 2.7 KB | CONFIG | Component-test vitest config | CONFIG | no |
| `vitest.integration.config.ts` | 3.3 KB | CONFIG | Integration-test vitest config | CONFIG | no |
| `.doctrine-allowlist` | 1.4 KB | CONFIG | Doctrine v7 banned-token exemptions (3 unified-kernel files) | DOCTRINE | no |
| `.env.example` | 30.3 KB | CONFIG | 213 declared env vars | CONFIG | no |
| `.gitleaks.toml` | 27.9 KB | CONFIG | Secret-scan allowlist | CONFIG | no |
| `.replit` / `.replitignore` / `.nvmrc` / `.node-version` / `.npmrc` / `.oxlintrc.json` / `.prettierrc.cjs` / `.gitattributes` / `.gitignore` / `.dockerignore` / `.watchmanconfig` | small | CONFIG | Toolchain configs | CONFIG | no |

### Top-level directories (41) by file count

| Dir | Files | Class | Note |
|---|---|---|---|
| `lib/` | 2,069 | CODE | 53 shared runtime libraries (db, ai-engine, proof-chain, monte-carlo, workflow-engine, outcome-graph, a11oy-fabric, a11oy-fabric-py) |
| `packages/` | 1,707 | CODE | 134 workspace packages — §8 |
| `docs/` | 1,118 | DOC | 838 `.md` — A11oy doctrine set + Hatun spec + architecture |
| `artifacts/` | 953 | CODE/TAB | 7 surface artifacts + api-server — §7 |
| `audit/` | 393 | PROOF | source-of-truth.json + audit reports |
| `ops/` | 347 | CONFIG | Operational harness (audit/routes.json, reports) |
| `archive/` | 261 | CODE | Retired surfaces (lyte-command-center, imperium) |
| `scripts/` | 188 | CODE | Seed/smoke/metrics/CI + mcp-server.mjs |
| `services/` | 179 | CODE/API | 8 microservices — §6 |
| `content/`, `content-package/` | 154+78 | DATA | Seed + marketing content |
| `public/` | 131 | ASSET | Static assets |
| `apps/` | 120 | CODE/API | 5 apps — §7 |
| `tests/` | 83 | CODE | Cross-package tests |
| `workers/` | 42 | CODE | Cloudflare/edge workers |
| `reports/` | 30 | DATA | a11oy-substrate PCPR outputs |
| `infra/` | 26 | CONFIG | IaC |
| `security/` | 16 | DOC | Secret-audit docs |
| `proof-pack/` | 8 | PROOF | Investor proof bundle — §4 note |
| `papers/` | 8 | PROOF | 8 `.tex` thesis papers |
| `substrate/` | 7 | CONFIG | Substrate compose stack (mostly stub) — §3 |
| `skills/` | 6 | SKILL | 2 SKILL.md trees — §5 |
| `payloads/` | 6 | PAYLOAD | 3 Replit onboarding payloads — §4 |
| `.agents/` | 12 | SKILL | 10 harvested SKILL.md + metadata — §5 |
| `.codex/` | 1 | CONFIG | scheduled-chats.json (15 chats) |
| `.codex-plugin/` | 1 | CONFIG | PluginMesh plugin.json (12 tools) |
| (others: analytics, benchmarks, brand, data, dossier, elite-layer, evals, generated, integrations, media, org-profile, paper, profile-readme, sales, seed-data, tools, assets) | ≤18 each | mixed | Supporting dirs |

---

## Section 2 — Critical doc summaries (read in full)

**17 docs read in full.** The 10 required by the task plus 7 special reads.

### SOURCE_OF_TRUTH.md (DOCTRINE)
Canonical metric ledger (last verified 2026-05-04). Headline canonical values: 9 registered artifacts (find by `artifact.toml`), **848** live DB tables, **5,524** API endpoint router declarations, **7 verticals** post-KORA consolidation, **126** monorepo packages (`packages/`+`lib/`), 170 DB schema files, 213 env vars, 6 platform primitives, 11 RBAC roles, 10 thesis papers. Canonical platform-name map (Display ↔ slug ↔ former): A11oy=`/a11oy/`, TENAX=`/sentra/`, SEXTANT=`/vessels/`, DOMAINE=`/terra/`, Counsel=`/counsel/`, LUMINA=`/pulse/`, PARAGON=`/aegis/`, KORA=`/lyte/` (consolidated into A11oy), Carlota Jo=`/carlota-jo/`, Amaru=`/conduit/`. Governed model: **Qwen 3.6 — 27B Reasoning** via HF Inference Endpoints; gateway `lib/ai-engine/src/alloy-model-gateway.ts`. Budget caps $50/day, $1,000/mo, scale-to-zero. *Live deltas noted (DB 798→848, API 2,816→5,524, artifacts 14→9).*

### KNOWN-GAPS.md (DOCTRINE)
Two top gaps RESOLVED (KG001 cred rotation; KG034 historical IP hashing). gitleaks full-history scan (7,014 commits) + working-tree scan = **CLEAN, 0 true positives, 3 documented false positives**. Doc-drift gaps: **GAP-DD-001** (three concurrent 9-axis Lutar name sets — IN-PROGRESS), **GAP-DD-002** (SECURITY-CHECKLIST cited non-existent middleware — RESOLVED), **GAP-DD-003** (perf targets stated as achievements; production 11.5 µs K01 / 3.12 µs K04 vs projected — RESOLVED), **GAP-DD-004** (CITATION.cff v10→v14 — RESOLVED).

### MODEL_BACKBONE_BLUEPRINT.md (DOCTRINE)
Shared governed multi-agent runtime. Coordinator = `@workspace/alloy` (`packages/alloy`). Pipeline: validate envelope → Policy Evaluator → Planner → Run Ledger → Domain-Jury → typed `AgentResponse` w/ `ledgerId`. **8 specialists**: planner / policy-evaluator / approval-router LIVE; retrieval/document/speech/forecasting/anomaly were STUBS in this doc but marked promoted through Phase 7. Jury (`@workspace/eval-os`) scores 5 dimensions (Grounding .25, Actionability .20, Policy .25, Reversibility .15, Confidence .15); pass ≥0.5. Reference lane = KORA `lyte-backbone.ts`.

### EXECUTIVE_AUDIT_SUMMARY.md — **stub** (220 B) → canonical `docs/EXECUTIVE_AUDIT_SUMMARY.md` (Moonshot Phases 1–8 audit).

### PRODUCT-SURFACES.md (DOCTRINE)
11 web apps (KORA/lyte, PARAGON/aegis, SEXTANT/vessels, DOMAINE/terra, Counsel, Carlota Jo [most complete/Beta], TENAX/sentra, Command Portal, LUMINA/pulse, SZL Holdings corporate, API Server). Archived: PRISM Counsel, IMPERIUM. Media: szl-demo-video. Mobile: APEX (`szl-holdings-mobile`, all 9 domains). 5 domain-specific mobile apps = **roadmap, not built**.

### API-SPEC.md — **stub** (150 B) → `docs/API-SPEC.md`.

### ARCHITECTURE.md (DOCTRINE)
9-step loop: Signal→Context→Recommendation→Simulation→Policy→Execution→Proof→Outcome→Learning. 6 governance primitives (Outcome Graph, Proof Chain, Covenant Policy `packages/policy-engine`, Decision Simulation `lib/monte-carlo`, Workflow Engine, Event Fabric `@szl-holdings/prism-bus`). **Self-correcting note:** route-file count corrected 2026-05-30 from "357" to true **30** files under `*/routes/`.

### ACCESS-CONTROL-MATRIX.md (DOCTRINE)
12-level `platform_role` enum (anonymous_visitor=0 … founder_admin=10). Legacy `roles` table (16 names) mapped via `LEGACY_TO_CANONICAL`. Auth = OIDC/PKCE, server-side PG sessions w/ version counter + revocation + refresh tokens. Admin routes require super_admin/ops/exec or `internal:write` token.

### THESIS_PUBLICATIONS.md (PROOF) — most important proof ledger
Author Stephen P. Lutar Jr. (ORCID 0009-0001-0110-4173). Concept DOI `10.5281/zenodo.19944926` → latest **v11**. **11 papers v1–v11** with per-version DOIs; canonical trio = v9 (formalism `20053148`), v10 (impl contract `20053163`), v11 (empirical `20119582`, 2026-05-11). **24 numbered innovations**, each bound to a repo path. Key bindings: #1 bounded recursion `packages/cognitive-runtime/`; #2 compile-time Kahn-sort approval-DAG `packages/substrate/src/compiler.ts`; #9 content-hash reproducibility `apps/eval-runner/`; #10 Lutar-as-a-Service `POST /api/ouroboros/lutar/v10`; #19 measured Λ₁₀ overhead 24,800 calls, p99 ≤1.27 ms, ρ=1.000 on 8,000/8,000; #20 public `ouroboros` 172/172 tests v6.2.0. §7 honest non-claims: no federal contracts/ATO, no outside audit, no signed enterprise contracts, single founder, no revenue/users.

### alloy.commands.md / alloy.mcp.commands.md / alloy.meridian.commands.md — **all 3 are top-level stubs** → canonical `docs/alloy.*.commands.md`. (The a11oy command surface itself is the AGENTS.md "Using Alloy Command Prompts" catalogue: Status/Release/Triage/Quality/Repo/Growth categories.)

### Special reads

- **AGENTS.md (DOCTRINE):** Authoritative operating contract. Loop = Context→Plan→Patch→Test→Screenshot→Verify→Proof→Commit. **18 named agents** (Pathfinder, ForgeMind, PatchPilot, BuildWarden, PixelProof, ClaimGuard, SecretHawk, ReadMeRanger, ProofSmith, ReleaseCaptain, AuditTitan, InterfaceMonk, RouteRover, WorkGraphWeaver, CursorSage, CodexSmith, BoardroomOracle, NarrativeForge). Forbidden: force-push, secret commits, fake screenshots, Bo11y/Bolly/Boss naming. Documents Python substrate `lib/a11oy-fabric-py/`, route manifest `ops/audit/routes.json`, 11 CI workflows, **15 scheduled chats**, `$yeet` draft-PR protocol. Are agents real? They are **doctrine roles** (prompt personas / skill selection logic), not 18 separate running services — backed by `skills/a11oy-code/agent-roster.md` + `docs/A11OY_AGENT_DOCTRINE.md`.
- **llms.txt (DOCTRINE):** A11oy LLM instruction file. Describes the 7 fabric layers (Coverage Graph→Signal Mesh→State Engine→Causal Core→Action Rail→Covenant Layer→Proof Ledger), 11 GET endpoints under `/api/a11oy/`, 7 verticals, Phase-1 seed (32 signals, 5 outcomes, 5 policies, 5 proof packets), **Demo Mode** (in-memory, mutations return 501). Does NOT configure a model list — it's the agent context file for the a11oy surface.
- **ecosystem-plugin-registry.json (CONFIG):** v1.0.0. 5 shared plugins (github, huggingface, vercel, neon, cloudflare) + per-vertical domain plugins (sentra: stix_taxii/otx/cisa_kev/shodan; vessels: marinetraffic/open_meteo/barentswatch; terra: edgar/costar/census; counsel: courtlistener/ofac; pulse: slack; aegis: nvd_cve/mitre_attack; lyte: hubspot; carlota_jo: google_workspace). Governance defaults: human-in-the-loop approval gates, audit events required.
- **mcp.json / .mcp.json (CONFIG):** **3 MCP servers** — `pluginmesh` (stdio, `scripts/mcp-server.mjs`, no auth), `alloy` (http `/api/mcp`, Bearer `ALLOY_INTERNAL_TOKEN`), `github` (npx server-github). Per the activation payload these advertise **12 / 23 / 15 tools** respectively.
- **threat_model.md (DOCTRINE):** Multi-tenant TS/Node SaaS, 6 domain packs + mobile. Stack React 19/Express 5/Drizzle/PG16. Actors table (anon→founder), data-flow diagram through `globalAuthEnforcer`, asset list, trust boundaries. Production scope assumes `NODE_ENV=production`; mockup-sandbox out of scope.
- **.doctrine-allowlist (DOCTRINE):** Doctrine v7 STRICT (Founder authority). Narrowly exempts only 3 `packages/unified-kernel/src/doctrine/` files (the scanner that must contain banned tokens to detect them).
- **docs/a11oy/spec/hatun-doctrine-spec/ (DOCTRINE):** **Hatun Doctrine Specification v0.1.0**, CC-BY-4.0, authored/operated by A11oy. Open standard for **10 governance artifact kinds** (Constitution, SystemCard, RiskReport, BehavioralAuditFinding, WelfareTelemetrySample, AdversarialRobustnessScore, SnapshotFingerprint, CovenantLiftSample, GlasswingPartnerAttestation, CoordinatedAgentVulnerabilityDisclosure). **11 JSON Schema 2020-12 files** in `schemas/` + TS companion types. Grounded in `HATUN_RESEARCH_SWEEP.md`. *(Note: spec lives at `docs/a11oy/spec/hatun-doctrine-spec/`, not the `docs/a11oy/.doctrine-spec/` path in the task — the path was renamed.)*

---

## Section 3 — `substrate/` deep dive (every file)

**Two distinct "substrate" things exist; do not conflate them:**

### A) Top-level `substrate/` dir (7 files — largely a deployment shell + STUB)
| File | What it does | Class |
|---|---|---|
| `substrate/main.py` | **STUB** — prints "Hello from repl-nix-workspace!" Leftover scaffold. | CODE (stub) |
| `substrate/pyproject.toml` | Empty project `repl-nix-workspace` v0.1.0, no deps. | CONFIG (stub) |
| `substrate/SUBSTRATE.md` | Copy of root Substrate Edge Inference guide. | DOCTRINE |
| `substrate/MODEL_BACKBONE_BLUEPRINT.md` | Copy of root backbone blueprint. | DOCTRINE |
| `substrate/.env.substrate.example` | Substrate fleet env template. | CONFIG |
| `substrate/docker-compose.gpu.yml` | **Real** — GPU fleet: `substrate-inference` (oLLM, :8070) + `substrate-py-workers` (:8090), NVIDIA device reservations, healthchecks. | CONFIG |
| `substrate/docker-compose.cpu-stub.yml` | CPU-stub overlay (deterministic stub inference, no GPU). | CONFIG |

### B) `packages/substrate/` — **the real "infra-as-substrate" moat** (`@szl/substrate` v0.2.0, `private:false`)
"Sovereign Execution Substrate — policy-shaped graphs, evidence-chained transitions, confidence-budget routing, counterfactual replay." Single runtime every surface calls the same way. 5 stage primitives `Reason() | Retrieve() | ToolCall() | Verify() | Decide()` + `ApprovalGate()`. Modes: live / dry-run / replay / counterfactual.

| File | What it does |
|---|---|
| `src/compiler.ts` | **Innovation #2.** Kahn topological sort over the approval DAG at **compile time**; throws `SubstrateCompilerError` for cycles / orphan gates / high-risk side-effects reachable without an ancestor `ApprovalGate`. Topology-enforced, not runtime-checked. |
| `src/engine.ts` | Pipeline runtime (`runtime.start(workflow,input,{mode})` → `PipelineRun`). |
| `src/stage-primitives.ts` | The 5 primitive + ApprovalGate factories. |
| `src/budget-router.ts` | Confidence-budget routing. |
| `src/journal.ts` | Evidence-chained transition journal. |
| `src/adapters.ts` | Surface adapters. |
| `src/telemetry.ts` | OTel hooks. |
| `src/python-worker.ts` | Bridge to `services/substrate-py-workers`. |
| `src/types.ts` | WorkflowDefinition / CompiledGraph / PolicyProfile types. |
| `src/cli/{bin,replay}.ts` | `substrate` CLI + replay. |
| `src/workflows/*.ts` (11) | Per-surface seed workflows: opportunity-audit, cross-system-reconciliation, executive-brief, risk-escalation, evidence-based-recommendation, lyte-operational-drift, aegis-threat-triage, vessels-voyage-anomaly, terra-portfolio-anomaly, prism-counsel-evidence-packaging, carlota-jo-task-routing + `seeds/`. |
| `src/{compiler,engine}.test.ts`, `src/workflows/phase2.test.ts` | Test suite. |

**Verdict:** the substrate moat is **real code** in `packages/substrate/` (and supporting `packages/substrate-adapters`, `packages/substrate-client`). The top-level `substrate/` dir is mostly a deploy shell with a vestigial stub `main.py`/`pyproject.toml` (a P2 hygiene item).

---

## Section 4 — `payloads/` deep dive

**Important finding:** `payloads/` in the platform monorepo contains **Replit/Codex onboarding payloads — NOT the UDS payloads** (a11oy.uds, amaru.uds, sentra.uds, vessels.uds, rosie.uds) named in the task. Those `.uds` payloads live **outside** this repo (workspace `szl-uds-deployment/`, `uds-mesh/`, `szl_payload/`) and are out of scope for this monorepo file. The 3 platform payloads:

| File | Structure / contents | Class |
|---|---|---|
| `replit-szl-ecosystem-payload.json` | Ecosystem onboarding: 6 artifacts (a11oy, sentra, terra, carlota-jo, counsel, vessels), MCP `alloy` server, dev commands, AGENTS.md context, 6 scheduled chats. | PAYLOAD |
| `replit-alloy-meridian-payload.json` | "Meridian" cognitive agentic layer: 5 layers, approval classes auto/review/admin_only, **11 MCP tools** (alloy_launch_workflow, …, connector_hub_*), skill-registry schema (`packages/skill-library/src/registry.ts`), 10 active connectors (jira/slack/pagerduty/salesforce/siem/groq/fal-ai/honeyhive/huggingface/elevenlabs). | PAYLOAD |
| `replit-mcp-activation-payload.json` | MCP activation: 3 servers (pluginmesh 12 tools / alloy 23 tools / github 15 tools), activation steps, credential requirements. | PAYLOAD |
| `*-agent-prompt.md` (×3) | Companion copy-paste agent prompts for each payload. | PAYLOAD |

Each payload has a manifest (JSON) + an agent-prompt (.md); **no signing keys** are present in these payloads (they are setup templates, not signed UDS artifacts).

---

## Section 5 — `skills/` deep dive (every SKILL.md)

**12 `SKILL.md` files total.** Cookbook cited 9 → **platform has more (12).** Two distinct trees:

### `skills/` (2 — operational skills)
| Skill | Purpose | Pattern |
|---|---|---|
| `a11oy-code/SKILL.md` | Governs all agent operation in the monorepo: 11-step sequence, agent-selection table (18 agents), scope boundaries, 5 proof levels. Companions: `README.md`, `agent-roster.md`, `checklist.md`, `prompts.md`. | Agent-instruction (no HARVEST_LOG — first-party) |
| `pluginmesh-orchestrator/SKILL.md` | PluginMesh broker: search 50+ plugins / route goals / generate `.app.json`+`.mcp.json` / never bypass OAuth. 12 MCP tools. YAML front-matter (name+description). | Agent-instruction (first-party) |

### `.agents/skills/` (10 — harvested skills, with `HARVEST_LOG.md`)
All MIT-derived (provenance pinned by commit SHA in `HARVEST_LOG.md`; CC-BY-NC-ND source consulted only, no text reproduced):
`pre-flight-thinking`, `typescript-refactor`, `react-component-review`, `monorepo-impact-analysis`, `debug-protocol`, `commit-hygiene`, `dead-code-detector`, `api-contract-review`, `dependency-health`, `doc-comment-hygiene`. Each is an agent-instruction SKILL.md adapted to this monorepo's pnpm/Drizzle/artifact conventions. `HARVEST_LOG.md` is the canonical provenance ledger (source repo, SHA, license, what-taken, adaptation per skill).

There is also `packages/skill-library/` (the runtime skill registry) and `packages/skill-library/src/registry.ts` referenced by the Meridian payload — that is the *executable* skill registry, distinct from these doctrine SKILL.md files.

---

## Section 6 — `services/` deep dive (8 microservices)

| Service | Lang | Package / port | Purpose | Deployed? |
|---|---|---|---|---|
| `alloy-fabric-api` | TS | `@workspace/alloy-fabric-api` | A11oy fabric REST API (10 route files per ARCHITECTURE route count). | Internal; NOT on any HF Space |
| `alloy-fabric-ingest-control` | TS | `@workspace/alloy-fabric-ingest-control` | Ingest control plane for the fabric. | Internal; not shipped |
| `lyte-metrics-store` | Python | `lyte-metrics-store` | KORA/Lyte metrics store (12-test pytest suite; `pip install -e ".[dev]"`). | Internal; not shipped |
| `meridian_control_plane` | Python | (module: flight_recorder, model_policy) | Meridian control plane — model policy + flight recorder. | Internal; not shipped |
| `meridian_forecast_lab` | Python | (forecast_lab.py) | Forecasting lab. | Internal; not shipped |
| `substrate-mcp-gateway` | TS | `@szl/substrate-mcp-gateway` | The `/mcp/*` reverse-proxy sidecar (named in threat_model data-flow). | Internal; not shipped |
| `substrate-py-workers` | Python | `substrate-py-workers` (:8090) | Stage-execution worker fleet (model_router → inference :8070); autoscaling. | GPU compose only; not on HF |
| `verticals/` | Python | (pack tree) | 13+ vertical packs: constellation_graph, finance_fincept, firestorm_ops, lyte_kora, marketing_growth, meridian_infra, nuro_forge, platform, prism_counsel, pulse, sentra_cyber, terra, vessels + `registry.py`, `vertical_moats.json/.py`, `contracts.py`. | Internal; not shipped |

**None of the 8 services is deployed to any live HF Space** — the Spaces run independent `serve.py` apps (see §10).

---

## Section 7 — `apps/` deep dive (5 apps) + artifacts (TABs)

### `apps/` (5)
| App | Lang | Package | Build target | Purpose |
|---|---|---|---|---|
| `alloy-runtime-api` | TS | `@workspace/alloy-runtime-api` | Internal API | Main A11oy runtime API (9 route files; auth middleware here per GAP-DD-002). |
| `alloy-embedding-api` | TS | `@workspace/alloy-embedding-api` | Internal API | Embedding service (8 route files). |
| `alloy-ingestion-orchestrator` | TS | `@workspace/alloy-ingestion-orchestrator` | Internal API | Ingestion orchestration (2 route files). |
| `eval-runner` | Python | (run.py) | Eval harness | **Innovation #9** content-hash reproducibility harness; `test_suite_reproducibility.py` (PR #138). Has Dockerfile + Procfile. |
| `substrate-inference` | Python | `substrate-inference` (:8070) | GPU/STUB service | oLLM-backed edge inference; LIVE w/ CUDA else STUB. Root `main.py` boots this. |

### `artifacts/` — the **TAB / surface code** (the "tab code" the founder asked for)
7 surface artifacts + api-server. Only **6 carry a registered `.replit-artifact/artifact.toml`**: `a11oy`, `carlota-jo`, `counsel`, `sentra`, `terra`, `vessels`. (`api-server` is the shared backend; KORA/lyte-command-center is in `archive/`.)

| Artifact (TAB) | Preview path | `artifact.toml`? | Shipped to right Space? |
|---|---|---|---|
| `artifacts/a11oy` | `/a11oy/` | ✅ | Frontend **bundled** into `dinn_a11oy_space` console JS, but live Space backend is independent `serve.py` — **partial ship** |
| `artifacts/sentra` | `/sentra/` | ✅ | Live `sentra` Space is independent FastAPI (8 immune gates) — **NOT the artifact code** |
| `artifacts/vessels` | `/vessels/` | ✅ | No matching live HF backend — **un-shipped** |
| `artifacts/terra` | `/terra/` | ✅ | **un-shipped** |
| `artifacts/counsel` | `/counsel/` | ✅ | **un-shipped** |
| `artifacts/carlota-jo` | `/carlota-jo/` | ✅ (Beta, most complete) | **un-shipped** |
| `artifacts/api-server` | `/api/` | — | Internal; not on HF |

**Source-of-truth confirmation:** `SOURCE_OF_TRUTH.md` claims **9** registered artifacts (`find artifacts -name artifact.toml`); the live count is **6**. This is a metric drift (see §10).

---

## Section 8 — `packages/` deep dive (134 packages)

The agent backbone + substrate + Ouroboros runtime live here. Notable clusters:

- **Backbone (MODEL_BACKBONE_BLUEPRINT):** `alloy` (coordinator), `eval-os` (jury), `tool-registry`, `agent-core`, `agents-core`, `planner`, `policy-guard`, `approvals-inbox`, `run-ledger`, `szl-alloy`, `guardian`, `cognitive-runtime` (innovation #1+#3), `agents-tools/-prompts/-evals`.
- **AEF stack (7):** `aef-contracts`, `aef-domain-profiles`, `aef-evals`, `aef-evidence-ledger`, `aef-policy-guard`, `aef-retrieval-core`, `aef-sdk`, `aef-storage-adapters`, `aef-workflow-runtime`.
- **Substrate moat:** `substrate` (§3B), `substrate-adapters`, `substrate-client`, `unified-kernel` (doctrine scanner — the `.doctrine-allowlist` target).
- **`codex-kernel`** (typed knowledge graph kernel, innovation #21): `kernel.ts`, `ledger.ts`, `receipts.ts`, `replay.ts`, `hash.ts`, `depth-allocator.ts`, `dresden-venus.ts` (the Venus-tables reference run), CLI (`run.ts`, `run.szl.test.ts`), `runner/*.payload.json`. 29 vitest test calls per SOT.
- **Ouroboros family (26 `ouroboros-*`):** anchor, anduril, aristotle, blanca, davinci, emerald, flashforge, fractional, gauss, guardrails, horizon, integrations (`sovereign-engine.ts` — 44 innovations), invariant (`lutar-invariant-9.ts` — GAP-DD-001 kernel set), jung, lara, loop, newton, oppenheimer, resonance, socrates, theosophy, trithemius, verifier, alloy, bench.
- **Runtime surfaces as packages:** `a11oy-runtime`, `a11oy-cli`, `sentra-runtime`, `amaru-runtime`, `lyte`, `forge`, `nexus-mcp`, `omnia-shell`.
- **Primitives/infra:** `policy-engine`, `proof-chain`(in lib), `evidence-graph`, `evidence-ledger`, `decision-engine`, `simulation`, `signal-mesh`, `workflow-runtime`, `memory-core/-fabric`, `atlas-core/-events`, `db/-migrations/-repository/-schema`, `auth-shared`, `gateway` (innovation #14 zero-trust gate), `tool-mesh`, `connectors`, `plugin-host`, `skill-library`.
- **Stray file:** `packages/proxy-routes.ts` sits at `packages/` root (not in a package dir) — minor hygiene anomaly.

---

## Section 9 — In platform monorepo but NOT in any HF Space (instillation gap)

The HF Spaces audited (`dinn_a11oy_space`, `sentra_live`, `amaru_live_head`) are thin Docker spaces: a single `serve.py` + `index.html` + `console/` + `landing/`. Grep confirms they **do not import** `@workspace/*`, `@szl-holdings/*`, `@szl/substrate`, `alloy-fabric-api`, `codex-kernel`, or `packages/substrate`. Therefore essentially the **entire monorepo runtime is un-instilled** into the live Spaces:

- `packages/substrate/` (the policy-shaped-graph compiler + engine) — **not shipped**.
- `packages/codex-kernel/` (typed knowledge graph + receipts) — **not shipped**.
- `packages/alloy`, `eval-os`, `policy-guard`, `cognitive-runtime`, all backbone packages — **not shipped**.
- `services/` (all 8) and `apps/alloy-*` APIs — **not shipped** to HF.
- `artifacts/{vessels,terra,counsel,carlota-jo}` TAB frontends — **no live HF Space** at all.
- Hatun Doctrine Spec schemas, the 26 ouroboros-* packages, lib/ (2,069 files) — **not shipped**.

The only thing instilled is: A11oy's **built frontend bundle** appears inside `dinn_a11oy_space/console/assets/*.js` (compiled, not source), and the *concepts* (gates, Λ, receipts) are **reimplemented** in each Space's `serve.py`.

## Section 10 — In an HF Space but NOT in platform monorepo (drift)

- **`sentra_live/serve.py`** implements 8 immune gates + `/api/sentra/v1/verdict|inspect|gates|forecast` with **seeded in-memory audit data** and a self-contained `_compute_lambda`. This live API surface has **no source-of-truth file in the monorepo** (`packages/sentra-runtime` is a *different*, TS implementation). The Space's "Doctrine v9 — 456 declarations / 14 axioms / 6 sorries / 12 MCP / 46 policy gates" numbers are **not reproducible from the monorepo**.
- **`amaru_live_head/serve.py`** implements a Cardano-anchored memory receipt chain; the monorepo has only `packages/amaru-runtime` (TS) — a separate codebase → drift.
- **Metric drift inside the monorepo itself** (SOT vs reality on the audited commit):
  - `artifact.toml` registered artifacts: SOT says **9**, actual **6**.
  - Thesis papers `papers/*.tex`: SOT says **10**, actual **8**.
  - These two should be reconciled in `SOURCE_OF_TRUTH.md` / `audit/source-of-truth.json`.

---

## Section 11 — Critical un-shipped surfaces (P0/P1/P2)

### P0 — un-shipped, customer/proof-critical (3)
1. **P0 — Sentra runtime drift (two divergent implementations).** Live `sentra` HF Space (`serve.py`, 8 gates, Doctrine v9 numbers) is **not derived from** `packages/sentra-runtime` or `artifacts/sentra`. The shipped proof surface cannot be regenerated from the monorepo → the canonical claim source and the live demo will diverge silently. **Pick one source of truth and generate the Space from it.**
2. **P0 — Substrate moat is un-instilled.** `packages/substrate/src/compiler.ts` (compile-time Kahn approval-DAG enforcement, innovation #2) and `packages/codex-kernel` (innovation #21) — the two headline technical moats in `THESIS_PUBLICATIONS.md` — are **not deployed to any live, externally-verifiable Space**. The thesis points reviewers to private paths; no public Space exercises them.
3. **P0 — Four registered TAB artifacts have no live Space.** `artifacts/{vessels,terra,counsel,carlota-jo}` are registered (`artifact.toml`) and described as "functional alpha"/Beta in PRODUCT-SURFACES, but **no corresponding live HF Space backend exists** (only a11oy/sentra/amaru have Spaces). The founder's "tab code … one by one" instruction surfaces exactly this: 4 of 7 tabs are un-shipped.

### P1 (3)
4. **P1 — SOURCE_OF_TRUTH metric drift.** artifact count 9→6 and papers 10→8 are stale; downstream decks/READMEs draw from SOT. Re-run the documented verification commands and update both `SOURCE_OF_TRUTH.md` and `audit/source-of-truth.json`.
5. **P1 — GAP-DD-001 still IN-PROGRESS.** Three concurrent 9-axis Lutar name sets ship simultaneously (runtime receipt schema vs historical thesis vs `ouroboros-invariant` kernel-compat). Cosmetic but audit-confusing for a proof-first company.
6. **P1 — Hatun Doctrine Spec not published as its own Space/repo.** The 10-artifact-kind open standard (v0.1.0, CC-BY-4.0) is buried in `docs/a11oy/spec/`; as an "open standard… others invited to adopt," it has no public surface.

### P2 (3)
7. **P2 — Top-level `substrate/` stub.** `substrate/main.py` prints "Hello from repl-nix-workspace!"; `substrate/pyproject.toml` is an empty `repl-nix-workspace` scaffold. Vestigial — remove or replace with a pointer.
8. **P2 — Stray `packages/proxy-routes.ts`** at the `packages/` root (outside any package). Move into the owning package.
9. **P2 — Top-level doc stubs.** `API-SPEC.md`, `EXECUTIVE_AUDIT_SUMMARY.md`, `alloy.commands.md`, `alloy.mcp.commands.md`, `alloy.meridian.commands.md` are 150–220 B redirects to `docs/`. Acceptable, but external readers cloning the repo see empty top-level files.

---

## Appendix — Return summary

- **Files inventoried:** 8,208 tracked files across 56 top-level files + 41 directories (every file accounted for by directory; key dirs enumerated file-by-file).
- **Docs read in full:** **17** (SOURCE_OF_TRUTH, KNOWN-GAPS, MODEL_BACKBONE_BLUEPRINT, EXECUTIVE_AUDIT_SUMMARY [stub], PRODUCT-SURFACES, API-SPEC [stub], ARCHITECTURE, ACCESS-CONTROL-MATRIX, THESIS_PUBLICATIONS, alloy.commands [stub] + special: AGENTS.md, llms.txt, ecosystem-plugin-registry.json, mcp.json, threat_model.md, .doctrine-allowlist, Hatun Doctrine Spec).
- **P0 un-shipped surfaces:** **3** (Sentra runtime drift; substrate moat un-instilled; 4 TAB artifacts with no live Space).
- **SKILL.md count:** 12 (cookbook said 9 — platform has more).
- **MCP servers:** 3 (pluginmesh/alloy/github); 12/23/15 advertised tools.
- **Key drift:** live HF Spaces are independent `serve.py` reimplementations; the monorepo runtime (substrate, codex-kernel, backbone, services, apps) is **not instilled** into any Space.

**Deliverable path:** `/home/user/workspace/szl/audit_2026-05-30_cursor_offline/round2/full_reaudit_2026-05-31/180_PLATFORM_MONOREPO_EVERY_FILE.md`
