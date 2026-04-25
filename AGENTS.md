# AGENTS.md — A11oy Repo Operating Doctrine

This file is the authoritative operating contract for every AI agent, Replit task, Codex session, and human contributor working in this repository. Read it before touching a file. Honor it on every commit.

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

1. Be captured live from the running application in this Replit workspace.
2. Show a browser chrome or app frame — not a design mockup or Figma export.
3. Be stored in `docs/assets/screenshots/current/` with ISO-date filename and metadata in `audit/screenshot-catalog.md`.
4. Include the route URL visible in the address bar or be noted in the catalog.
5. Be free of placeholder data labeled "TODO", "LOREM", or "PLACEHOLDER".

Blocked screenshots: blank screens, error pages, loading spinners, Figma exports, screenshots taken outside the running app.

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
| `docs/A11OY_REPLIT_CODEX_DOCTRINE.md` | 11-step agent operating sequence |
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
| `lyte-revenue` | Lyte Revenue | SaaS revenue operations |
| `vessels-maritime` | Vessels Maritime | Fleet and voyage management |
| `terra-real-estate` | Terra Real Estate | Portfolio and asset management |
| `aegis-defense` | Aegis Defense | Defense and intelligence operations |
| `prism-counsel` | PRISM Counsel | Legal matter and contract management |
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
