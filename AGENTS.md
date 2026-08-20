# AGENTS.md — A11oy Repo Operating Doctrine

This file is the authoritative operating contract for every AI agent, repository-controlled workspace, Codex session, and human contributor working in this repository. Read it before touching a file. Honor it on every commit.

---

## Product Identity

**A11oy** is the Live Enterprise Execution Fabric built by SZL Holdings. It senses business signals, structures them into causal context, correlates them across seven verticals, explains the reasoning, recommends governed actions, routes for human approval, executes with policy enforcement, and preserves cryptographic proof — in real time.

A11oy is an **active prototype and investor demo platform**. It is not yet in general production. Claims about its capabilities must use the qualifiers defined in `docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md`.

**Parent company:** SZL Holdings  
**Product family:** KORA (command surface), FORGE (execution fabric), APEX (mobile command), domain packs (TENAX, Counsel, PARAGON, SEXTANT, DOMAINE, Carlota Jo, LUMINA)

---

## Core Execution Loop

Every agent working in this repo must follow this loop in order. Do not skip steps.

```
Context → Plan → Patch → Test → Screenshot → Verify → Proof → Commit
```

| Step | What it means |
|------|---------------|
| **Context** | Run Pathfinder Scan. Read AGENTS.md, docs/INDEX.md, docs/APP_STATUS.md, docs/operations/known-gaps.md, the relevant artifact README. Understand the current state before touching anything. |
| **Plan** | Write a specific, scoped plan. State the files you will edit, the sections you will change, and the success criteria. Record the plan in the Workcell or session log before executing. |
| **Patch** | Implement the minimal change that satisfies the plan. One concern per commit. Do not refactor unrelated code. Do not rename files outside scope. |
| **Test** | Run the applicable checks: `pnpm typecheck`, `pnpm test`, `pnpm qa:routes`. Capture every command and its exit code. Do not chase failures unrelated to your patch. |
| **Screenshot** | Capture a live screenshot of every UI surface you modified. Screenshots must pass the quality bar in `docs/A11OY_SCREENSHOT_DOCTRINE.md`. No placeholder images. |
| **Verify** | Confirm the patch satisfies the plan criteria. Re-read the relevant doctrine doc and non-negotiables. Check public-facing copy against `docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md`. |
| **Proof** | Assemble the Proof Packet: plan → patch → test results → screenshot → verification notes. See `docs/A11OY_PROOF_DOCTRINE.md`. |
| **Commit** | Write a clear commit message: what changed, why, what was verified. Reference the Workcell ID or task number. Never force-push or rewrite history. |

---

## Required Before Editing

1. Read this file (`AGENTS.md`) in full.
2. Read `docs/A11OY_NON_NEGOTIABLES.md`.
3. Read the artifact's own README (if editing an artifact).
4. Run `pnpm typecheck` to confirm baseline — record the result.
5. Check `docs/operations/known-gaps.md` to see if your target area has an open gap.
6. Confirm you are not introducing any of the Forbidden actions below.

---

## Required After Editing

1. Run `pnpm typecheck` again — it must pass or explicitly be no worse than baseline.
2. Run `pnpm qa:routes` if you added or changed routes.
3. Capture a screenshot of every UI surface you changed.
4. Write the Proof Packet and record it (inline in the commit, or in `audit/`).
5. Update `docs/operations/known-gaps.md` if your change introduces or closes a gap.
6. Update `docs/APP_STATUS.md` if artifact readiness status changed.

---

## Forbidden

The following actions are prohibited unconditionally:

- **Force-push or history rewrite.** Never `git push --force`, `git rebase -i` on shared history, or `git reset --hard` in a way that discards committed work.
- **Deleting existing files without explicit task authorization.** Additive work only unless the task explicitly authorizes deletion.
- **Committing secrets, tokens, or `.env` contents.** Zero tolerance. See `docs/A11OY_SECURITY_DOCTRINE.md`.
- **Publishing fake screenshots.** All screenshots must be captured live from the running application. See `docs/A11OY_SCREENSHOT_DOCTRINE.md`.
- **Making unqualified public claims.** Never claim production customers, revenue, compliance certification, or partnerships without the approved qualifiers. See `docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md`.
- **Using Bo11y, Bolly, or Boss as product names.** These names are retired. The product is A11oy. See A11oy Naming below.
- **Copying vendor UI, copy, or trade dress.** All product language must be original SZL Holdings / A11oy doctrine. No lifted copy from Claude, Cursor, Copilot, Codex, OpenAI, Google, or any vendor.
- **Running destructive database operations without authorization.** No `DROP TABLE`, `DELETE FROM` without a full backup confirmation.
- **Skipping the Proof step.** Every merged change must have a Proof Packet, even if minimal.

---

## A11oy Naming

### Approved Terms

| Term | Use |
|------|-----|
| A11oy | The governed agentic execution fabric (the product) |
| Live Enterprise Execution Fabric | The full product descriptor |
| Workcell | A governed, encapsulated unit of agentic work |
| Proof Packet | The evidence bundle for a completed Workcell |
| Proof-Carrying Execution (PCE) | The execution model that attaches proof to every run |
| MirrorEval | The quality and alignment evaluation framework |
| Covenant Policy | The policy enforcement layer |
| Proof Ledger | The immutable audit record |
| Action Rail | The governed action recommendation queue |
| Signal Mesh | Signal ingestion and routing layer |
| Causal Core | Causal reasoning engine |
| Coverage Graph | Coverage completeness tracker |
| State Engine | Authoritative enterprise state layer |
| Pathfinder | The context scan agent |
| ForgeMind | The planning agent |
| PatchPilot | The execution agent |
| BuildWarden | The repair and recovery agent |
| PixelProof | The screenshot capture agent |
| ClaimGuard | The public claim review agent |
| SecretHawk | The secret detection agent |
| ReadMeRanger | The documentation refresh agent |
| ProofSmith | The proof packaging agent |
| ReleaseCaptain | The release preparation agent |
| AuditTitan | The full audit orchestration agent |
| InterfaceMonk | The UI consistency agent |
| RouteRover | The route and API health agent |
| WorkGraphWeaver | The workflow dependency mapping agent |
| CursorSage | The Cursor/IDE-specific guidance agent |
| CodexSmith | The Codex-optimized execution agent |
| BoardroomOracle | The investor narrative agent |
| NarrativeForge | The product storytelling agent |

### Avoided / Retired Terms

| Term | Reason |
|------|--------|
| Bo11y | Retired product name — do not use |
| Bolly | Retired product name — do not use |
| Boss | Retired product name — do not use |
| PRAXIS Agent | Ambiguous — use the specific named agent instead |
| AI assistant | Too generic — use the specific A11oy agent name |
| Copilot | Vendor trademark — do not use for A11oy features |
| Autonomous AI | Overstated — use "governed agentic" instead |

---

## Public Claim Safety

A11oy is an **active prototype and investor demo platform**. Use these qualifiers when describing capabilities:

- **For features:** "designed to", "built to", "architected for", "proof-of-concept"
- **For customers:** "design partner conversations", "enterprise evaluation", "investor demo"
- **For compliance:** "architected for SOC 2 readiness", "compliance roadmap", not "SOC 2 certified"
- **For revenue:** Do not state ARR, MRR, or customer counts unless they are documented and verified
- **For integrations:** "mock connector", "future connector target", "roadmap integration" — not "integrated with [Vendor]"

Full rules: `docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md`

---

## Screenshot Proof

Every screenshot submitted as proof must:

1. Be captured live from the running application at an exact 40-character source revision in a repository-controlled environment. No vendor-specific workspace is required.
2. Use GitHub Actions, a protected preview deployment, an authenticated cloud development environment, or a local exact-head checkout whose provider and command or workflow run are recorded.
3. Show a browser chrome or app frame, or carry a source-bound metadata sidecar with the exact route, viewport, capture time, and screenshot SHA-256. Design mockups and Figma exports are not proof.
4. Be stored in `docs/assets/screenshots/current/` with an ISO-date filename and metadata in `audit/screenshot-catalog.md`.
5. Be free of placeholder data labeled "TODO", "LOREM", or "PLACEHOLDER".

Blocked screenshots: blank screens, error pages, loading spinners, design-tool exports, AI-generated images, stale prior-session captures, or captures without exact source and route identity.

Full rules: `docs/A11OY_SCREENSHOT_DOCTRINE.md`

---

## Definition of Done

A task is done when ALL of the following are true:

- [ ] The patch implements exactly what the task plan specified — no more, no less.
- [ ] `pnpm typecheck` passes (or is explicitly no worse than pre-patch baseline).
- [ ] `pnpm qa:routes` passes for any route changes.
- [ ] Every modified UI surface has a live screenshot in `docs/assets/screenshots/current/`.
- [ ] The Proof Packet is assembled and recorded.
- [ ] No secrets, tokens, or `.env` values are committed.
- [ ] No fake public claims are introduced.
- [ ] No Bo11y / Bolly / Boss naming is present in changed files.
- [ ] `docs/operations/known-gaps.md` is updated if new gaps were introduced or closed.
- [ ] `docs/APP_STATUS.md` is updated if artifact readiness changed.
- [ ] The commit message references the Workcell ID or task number.

Full checklist: `docs/A11OY_DEFINITION_OF_DONE.md`

---

## Agent Reference

For the full roster of 18 named agents, their missions, when to invoke them, blocked actions, required outputs, and sample prompts, see:

`docs/A11OY_AGENT_DOCTRINE.md`

Quick reference: `skills/a11oy-code/agent-roster.md`

---

## Doctrine Index

| Document | Purpose |
|----------|---------|
| `docs/A11OY_DOCTRINE.md` | Full product thesis and operating philosophy |
| `docs/A11OY_OPERATING_PRINCIPLES.md` | The ten numbered operating principles |
| `docs/A11OY_PRODUCT_LANGUAGE.md` | Approved terms, tone rules, forbidden language |
| `docs/A11OY_NON_NEGOTIABLES.md` | Hard rules across security, claims, naming, screenshots |
| `docs/A11OY_WORKCELL_DOCTRINE.md` | Workcell definition, statuses, risk classes, approval rules |
| `docs/A11OY_PROOF_DOCTRINE.md` | Proof Packet fields, proof levels, screenshot rule |
| `docs/A11OY_AGENT_DOCTRINE.md` | All 18 named agents with full specifications |
| `docs/A11OY_SCREENSHOT_DOCTRINE.md` | Screenshot quality rules and blocked screenshots |
| `docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md` | Blocked claims, required qualifiers |
| `docs/A11OY_SECURITY_DOCTRINE.md` | Security rules and secret hygiene |
| `docs/A11OY_RELEASE_DOCTRINE.md` | Release readiness checklist and scoring |
| `docs/A11OY_EXECUTION_ENVIRONMENT_DOCTRINE.md` | Provider-neutral, source-bound execution and proof environments |
| `docs/A11OY_DEFINITION_OF_DONE.md` | Full done checklist |

---

## Product Architecture Reference

The following sections describe the A11oy product runtime as built in Phase 1. They are preserved here for agent context and are governed by the doctrine above.

### Phase Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 — Foundation | Complete | Brand, schemas, fabric layer, read-side API, demo seed |
| Phase 2 — Agent Runtime | Planned | Operators, governed tools, MirrorEval, governance, Workcell engine, model router, PCE |
| Phase 3 — Full Platform | Planned | Terminal CLI, MCP server, 150-signal seed, 20 Workcells |

### Core Product Concepts

**Workcell** — An encapsulated unit of agentic work with a defined vertical, declared tools and permissions, covenant policy evaluation, ProofCarryingExecution contract, and MirrorEval monitoring.

**Operators** — Human-in-the-loop principals who configure and authorize Workcells, approve actions at the appropriate tier (auto, operator, executive, board), review MirrorEval results, and access the Proof Ledger for audit.

**MirrorEval** — The quality and alignment evaluation framework assessing every AI recommendation against stated objectives, policy constraints, historical outcome data, and business impact estimates. Results are attached to every ActionBrief before it reaches an approval gate.

### Verticals

| Vertical ID | Label | Domain |
|-------------|-------|--------|
| `lyte-revenue` | KORA Revenue | SaaS revenue operations |
| `vessels-maritime` | SEXTANT Maritime | Fleet and voyage management |
| `terra-real-estate` | DOMAINE Real Estate | Portfolio and asset management |
| `aegis-defense` | PARAGON Defense | Defense and intelligence operations |
| `prism-counsel` | Counsel | Legal matter and contract management |
| `carlota-jo` | Carlota Jo | Professional services consulting |
| `alloy-core` | Alloy Core | Platform health and fabric operations |

### Fabric Layers (Phase 1 — In-Memory)

1. **Coverage Graph** — Coverage completeness across domains
2. **Signal Mesh** — Signal ingestion and routing
3. **State Engine** — Authoritative enterprise state
4. **Causal Core** — Causal reasoning and explanation
5. **Action Rail** — Governed action recommendation and queuing
6. **Covenant Layer** — Policy evaluation and enforcement
7. **Proof Ledger** — Immutable audit and proof recording

### API Surface

Base URL: `/api/a11oy/`

**Read-Side (Phase 1, Operational)**
- `GET /now` — Current summary: signal counts, severity, fabric status
- `GET /signals` — All business signals (filterable by vertical, severity, status)
- `GET /signals/:id` — Single signal by ID
- `GET /outcomes` — Active outcomes
- `GET /actions` — Recommended and active actions
- `GET /proof` — Proof packets list
- `GET /proof/:entityId` — Proof packets for a specific entity
- `GET /governance` — Active covenant policies
- `GET /verticals` — Registered verticals
- `GET /fabric` — Fabric layer health
- `GET /workcells` — Active workcells
- `GET /workcells/:id` — Single workcell by ID

**Write-Side (Phase 2 Stubs — Return 501)**
- `POST /actions/:id/approve` — Approve an action
- `POST /actions/:id/execute` — Execute an action
- `POST /workcells/:id/run` — Run a workcell

### Environment Variables

See `.env.example` for all required and optional environment variables.

### Demo Mode

Phase 1 operates in Demo Mode by default. All data is in-memory and deterministic. No external calls are made. Mutating operations are blocked with a `not_implemented` error envelope.

---

## Ecosystem Operations — Operational Harness

This section documents the SZL Holdings operational harness: audit scripts, CI workflows, scheduled chats, and Alloy command prompts. It is the ops layer that makes the platform self-auditing and repeatably deployable.

### Install, Dev, and Build

```bash
# Install (pnpm required; Node ≥ 24)
pnpm install

# Start all apps in development mode
pnpm dev

# Production build (all artifacts via Turbo)
pnpm build

# Type-check all packages
pnpm typecheck
```

### Audit Commands

Operational audit scripts live in `ops/audit/`. They are dependency-light (Node built-ins + fetch only).

```bash
# Smoke test every route in ops/audit/routes.json
pnpm audit:smoke

# Crawl pages up to MAX_PAGES, check links & structure
pnpm audit:crawl

# Concurrent load test with p95 latency threshold
pnpm audit:stress

# Run all three operational harness scripts in sequence
pnpm audit:operational

# Run all audits (existing static checks + smoke + crawl + stress)
pnpm audit:all
```

**Environment variables for audit scripts:**

| Variable | Default | Description |
|---|---|---|
| `TARGET_URL` | `http://localhost:3000` | Base URL to audit |
| `EXPECTED_TEXT` | *(empty)* | Text that must appear in every response |
| `MAX_PAGES` | `50` | Max pages for URL crawl |
| `STRESS_REQUESTS` | `50` | Total requests for stress test |
| `STRESS_CONCURRENCY` | `5` | Concurrent requests per batch |
| `MAX_P95_MS` | `3000` | p95 latency threshold (ms) |
| `REPORT_DIR` | `ops/reports/` | Output dir for JSON reports |

Reports are written to `ops/reports/` as JSON files and uploaded as GitHub Actions artifacts.

### Known App Routes

The canonical route manifest lives at **`ops/audit/routes.json`**. Key routes:

| App | Preview Path | Key Routes |
|---|---|---|
| SZL Holdings Dashboard | `/` | `/`, `/admin`, `/analytics`, `/settings`, `/support` |
| API Server | `/api` | `/api/health`, `/api/tenants`, `/api/users`, `/api/alerts` |
| Unified Command | `/command` | `/command/`, `/command/map`, `/command/status` |
| LUMINA | `/pulse` | `/pulse/`, `/pulse/briefing` |
| PARAGON | `/aegis` | `/aegis/`, `/aegis/intel`, `/aegis/threats` |
| SEXTANT | `/vessels` | `/vessels/`, `/vessels/map`, `/vessels/fleet` |
| DOMAINE | `/terra` | `/terra/`, `/terra/portfolio`, `/terra/map` |
| Counsel | `/counsel` | `/counsel/`, `/counsel/matters`, `/counsel/contracts` |
| TENAX | `/sentra` | `/sentra/`, `/sentra/threats`, `/sentra/posture` |
| KORA | `/lyte` | `/lyte/`, `/lyte/decisions` |
| A11oy | `/a11oy` | `/a11oy/`, `/a11oy/brand` |
| Carlota Jo | `/carlota-jo` | `/carlota-jo/` |

### CI Expectations

CI workflows live in `.github/workflows/`. Key workflows:

| Workflow | Trigger | Description |
|---|---|---|
| `ci.yml` | Push / PR | Lint, typecheck, unit tests |
| `build.yml` | Push to main | Full artifact build |
| `e2e.yml` | Push to main / manual | Playwright E2E |
| `audit-full.yml` | Scheduled / manual | Full audit suite |
| `nightly-smoke.yml` | Nightly | Route smoke test |
| `operational-audit.yml` | Manual dispatch only | Smoke + crawl + stress (configurable inputs; requires a real TARGET_URL) |
| `security.yml` | Push / PR | Security scanning |
| `dependency-review.yml` | PR | Dependency review |
| `release.yml` | Tag push | Release build and publish |
| `uptime-monitor.yml` | Scheduled | Uptime checks |

The **`operational-audit.yml`** workflow accepts manual dispatch inputs: `target_url`, `expected_text`, `max_pages`, `stress_requests`, `stress_concurrency`, `max_p95_ms`. Reports are uploaded as artifacts with 30-day retention.

### Release Checklist

1. Ensure `main` branch CI is fully green
2. Run `pnpm release:check` — all gates must pass
3. Update `CHANGELOG.md` — move Unreleased entries to a new version section
4. Run `pnpm brand:check` and `pnpm verify:claims:strict`
5. Run `pnpm build` — confirm all artifacts build cleanly
6. Run `pnpm audit:operational` against staging if available
7. Draft release notes (use the Alloy "Draft Release Notes" command in `alloy.commands.md`)
8. Tag the release: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
9. Push the tag to trigger `.github/workflows/release.yml`
10. Verify the deployment completes and run a final smoke test

### Scheduled Chat Catalog

Scheduled chats are defined in **`.codex/scheduled-chats.json`** and automate recurring engineering tasks via AI-assisted analysis.

| ID | Title | Cadence |
|---|---|---|
| `daily-standup` | Daily Standup Summary | Daily (weekdays 9am) |
| `weekly-pr-synthesis` | Weekly PR Synthesis | Monday 8am |
| `team-pr-summary` | Team PR Summary | Friday 5pm |
| `release-notes` | Release Notes Drafting | On demand |
| `pre-tag-verification` | Pre-Tag Release Verification | On demand |
| `changelog-update` | Changelog Update | Friday 4pm |
| `ci-failure-triage` | CI Failure Triage | On demand |
| `new-issue-triage` | New Issue Triage | Daily (weekdays 10am) |
| `bug-scan` | Bug Scan | Wednesday 7am |
| `test-gap-identification` | Test Gap Identification | Wednesday 8am |
| `regression-detection` | Performance Regression Audit | Tuesday 9am |
| `dependency-drift` | Dependency Drift Detection | Thursday 8am |
| `outdated-deps` | Outdated Dependencies Report | 1st of month, 9am |
| `agents-md-update` | AGENTS.md Auto-Update | Friday 10am |
| `skill-suggestions` | Skill Growth Suggestions | 15th of month, 9am |

### Using Alloy Command Prompts

Copy-paste prompts organized by category live in **`alloy.commands.md`**:

| Category | Prompts |
|---|---|
| **Status** | Platform Health Check, Daily Standup Digest, Artifact Route Status |
| **Release** | Draft Release Notes, Release Readiness Gate, Pre-Tag Checklist, Changelog Update |
| **Triage** | CI Failure Investigation, Issue Triage Sweep, Incident Postmortem Template |
| **Quality** | Bug Scan, Test Gap Analysis, Code Review Sweep, Dead Code Detection |
| **Repo** | Dependency Drift Audit, Package Boundary Check, AGENTS.md Accuracy Check, Stale Branch Cleanup |
| **Growth** | Skill Investment Recommendations, Automation Opportunity Scan, Architecture Review |

Open `alloy.commands.md`, find the relevant category, and paste the prompt into Alloy. Each prompt is self-contained and context-aware for this monorepo.

### Draft PRs with `$yeet`

`$yeet` creates a draft PR from the current branch after all tests pass. Use it when a feature is complete and ready for review but not yet production-ready.

**Protocol:**
1. Ensure your branch is up to date with `main`
2. Run `pnpm release:check` — all gates must pass
3. Run `pnpm audit:smoke` against local dev server
4. Invoke `$yeet` in Alloy or your shell integration
5. `$yeet` will: run the test suite, verify the branch is clean, push the branch, and open a draft PR with a generated description
6. The draft PR triggers CI automatically; promote to "ready for review" once CI is green

**Requirements before `$yeet`:**
- `pnpm test` passes
- `pnpm brand:check` passes
- `pnpm typecheck` passes
- No uncommitted changes

---

## Python Substrate

Alongside the TypeScript fabric at `lib/a11oy-fabric/`, the repo ships a
Python substrate engine at `lib/a11oy-fabric-py/`. It defines the pydantic
contract every vertical pack implements and emits deterministic JSON
artifacts plus Proof-Carrying Pack Run (PCPR) companions under
`reports/a11oy-substrate/<pack-slug>/<run-id>.{json,proof.json}`.

The substrate runs **alongside** the TS fabric — it does not replace it.
The TS `Vertical` enum is unchanged; the Python substrate defines a
superset taxonomy in its own contract.

**Package:** `a11oy-fabric-py` (hatchling, pydantic 2, structlog, opentelemetry-api)

**CLI:** `python -m a11oy_fabric_py {list-packs, run, verify}`

**JSON artifacts:** `reports/a11oy-substrate/<pack-slug>/<run-id>.json` + `.proof.json`

**JSON schemas:** `reports/a11oy-substrate/_schema/<Entity>.schema.json`

**Reference packs:**
- `platform-agentops` (vertical `alloy-core`) — substrate self-observation
- `cyber-resilience` (vertical `tenax-cyber`) — TENAX/sentra surface

**Tests:** `pytest lib/a11oy-fabric-py/tests/ -v`

See `lib/a11oy-fabric-py/README.md` for the full contract, the
discovery/governed two-plane execution model, the JSON-artifact
convention, PCPR format, and the recipe for plugging in the seven
follow-up vertical packs (Pulse, Finance/Fincept, Lyte/KORA, Terra,
Vessels, PRISM Counsel, Marketing/Growth).

---

## Cursor Cloud specific instructions

### Node.js version

This repo requires **Node.js ≥ 24** (`engines` field in root `package.json`). The VM's default `/exec-daemon/node` is v22. The update script installs Node 24 via nvm and prepends it to `PATH`. After the update script runs, confirm with `node --version` that v24 is active before running any pnpm commands.

### Starting development

1. Ensure a `.env` file exists at the workspace root (gitignored). Minimum vars for demo mode:
   ```
   NODE_ENV=development
   PORT=3000
   SESSION_SECRET=<any random hex string>
   DATABASE_URL=postgresql://user:password@localhost:5432/szlholdings
   DEMO_MODE=true
   RUNTIME_MODE=local-dev
   ```
2. `pnpm install` — installs all 193 workspace packages.
3. `pnpm --filter @workspace/a11oy dev` — starts the A11oy Vite frontend on port 4110.
4. Other Vite frontends: vessels, terra, sentra, counsel, carlota-jo (each has `dev` script).

### Running services

- **Vite frontends** do NOT need a database or backend to render in dev mode (they use in-memory/demo data in the fabric library).
- **Backend services** (`alloy-runtime-api`, `alloy-embedding-api`, `alloy-fabric-api`) require `DATABASE_URL` pointing to a real PostgreSQL 16 instance.
- **Phase 1 operates in Demo Mode** — all fabric data is in-memory and deterministic; no external API keys are needed.

### Key commands

| Task | Command |
|------|---------|
| Install deps | `pnpm install` |
| Typecheck | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Tests (all via Turbo) | `pnpm test` |
| Tests (vitest direct) | `pnpm test:api` |
| Dev (all) | `pnpm dev` |
| Dev (single app) | `pnpm --filter @workspace/a11oy dev` |
| Python tests | `cd services/lyte-metrics-store && pytest tests/ -v` |

### Known baseline issues

- `pnpm typecheck` has cascading failures from `@szl-holdings/sdk` and ~9 dependent packages. This is a known gap (see README "Platform Status").
- `pnpm lint` reports ~7,292 warnings and 2 errors (existing baseline).
- `pnpm test:api` runs 22,000+ tests; ~116 fail due to the sdk cascade. This is normal.
- The `pnpm-lock.yaml` may drift from `package.json` changes — use `pnpm install` (not `--frozen-lockfile`) in dev.

### Python services

The `services/lyte-metrics-store/` package has a working test suite (12 tests). Install with:
```
cd services/lyte-metrics-store && pip install -e ".[dev]"
```
Run tests with `pytest tests/ -v`.

### Gotchas

- The `preinstall` script in root `package.json` rejects npm/yarn — must use pnpm.
- The `pnpm.onlyBuiltDependencies` field is not set; pnpm will warn about ignored build scripts for `core-js` and `protobufjs`. This is safe to ignore.
- The `.husky/pre-commit` hook runs `biome format`, `oxlint`, and `biome lint` on staged files, plus `pnpm docs:claims-check`. These run automatically on `git commit`.
