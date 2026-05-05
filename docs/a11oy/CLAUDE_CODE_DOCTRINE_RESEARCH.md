# Claude Code Doctrine Research Brief
**Task:** #4253 — A11oy Claude Code primitive adoption (skills, hooks, subagents, plan-lock, OTel)
**Date:** 2026-05-05
**Format:** One section per primitive · We Have / Adopt / Extend / One-of-One binding table

---

## Executive Summary

Anthropic's Claude Code ships a clean set of orchestration primitives: **Skills** (filesystem-discovered, SKILL.md-fronted capability packages), **Hooks** (lifecycle event interceptors with JSON decision contracts), **Subagents** (spawnable child agents with declared permissions), **Memory** (CLAUDE.md-style tiered persistence), **Plan Mode** (read-only planning before side-effecting execution), **Permission Modes** (read-only → auto-approve → HITL), **MCP** (Model Context Protocol tool servers with enterprise roadmap), and **Cross-surface sessions** (shared session IDs across Terminal/IDE/mobile). This brief maps each primitive to the A11oy fabric and defines the "one of one" governance bindings that make our implementation uniquely state-of-the-art.

---

## 1. Skills

### What Claude Code ships
- Filesystem-discovered packages at `.claude/skills/<skill>/SKILL.md`
- SKILL.md frontmatter: `name`, `description`, `allowed_tools`, `allowed_mcp_servers`, `model`, `permission_mode`
- Skills compose via slash commands; auto-invoked when description matches task
- Hot-reloadable on file change

### We Have
- `lib/ai-engine/src/skills/skill-registry.ts` — in-memory `Map<string, SkillPackage>` with programmatic registration
- `lib/ai-engine/src/skills/skill-manager.ts` — query-based skill selection with chain resolution
- `artifacts/a11oy/src/pages/SkillsLibrary.tsx` — card-based UI with trigger & proof ref

### Adopt Verbatim
- Filesystem discovery from `lib/ai-engine/src/skills/library/<skill>/SKILL.md`
- Full frontmatter schema: `name`, `description`, `version`, `allowed_tools`, `allowed_mcp_servers`, `model`, `permission_mode`
- Hot-reload watcher via `chokidar`-style polling
- Backwards-compatible shim so existing programmatic registrations keep working

### Extend (One of One)
- Additional frontmatter: `eligibility_constitution_clause`, `covenant_policy_bundle`, `eval_set`, `telemetry_schema`, `owner`
- Every skill invocation triggers a Proof Chain entry via `provenance.ts`
- Skills are gated by `covenant_policy_bundle` through the Hooks layer (PreToolUse) before execution
- Eval pass-rate displayed in SkillsLibrary card

### Cited References
- Anthropic Claude Code Skills docs (code.claude.com/docs/skills)
- Microsoft Agent Governance Toolkit — skill capability declarations with policy bundles (github.com/microsoft/agent-governance-toolkit)

---

## 2. Hooks

### What Claude Code ships
- JSON-based hook definitions: `{ event, hook_type, command }`
- Events: `PreToolUse`, `PostToolUse`, `PrePromptSubmit`, `PostPromptSubmit`, `Stop`, `SubagentStop`, `Notification`
- Hook returns: allow / block / modify (with replacement content)
- Hooks run as shell commands, receive JSON context, emit JSON decisions

### We Have
- `lib/ai-engine/src/evals/evaluator-hooks.ts` — domain eval hooks (offline quality scoring)
- `lib/ai-engine/src/tool-bridge.ts` — `invokeToolWithGovernance` (governance check pre-tool-call)
- Covenant policy checks in api-server BFF routes

### Adopt Verbatim
- Lifecycle event surface: SessionStart, PreToolUse, PostToolUse, PrePromptSubmit, PreSubagentSpawn, PostSubagentReturn, OnError, OnPlanProposed, OnPlanApproved, OnDecisionEmitted, OnProofPacketSealed
- JSON decision contract: `{ allow | block | modify | route, reason, redactions?, proof_attachments? }`
- Registry + executor with per-hook timeout isolation

### Extend (One of One)
- Every hook invocation automatically produces a Proof Chain entry (governed by construction)
- Built-in hooks: `covenant-policy-gate` (PreToolUse), `redaction` (PrePromptSubmit), `trust-tier-enforcer` (PreToolUse), `proof-sealer` (PostToolUse + PostSubagentReturn), `reward-hacking-watchdog` (PostSubagentReturn)
- Hook Pack registry UI with 24h allow/block/modify counters and Replay action
- OPA/Rego policies can be authored as hook `covenant_policy_bundle` entries

### Cited References
- Anthropic Claude Code Hooks docs (code.claude.com/docs/hooks)
- OPA/Rego AI guardrail patterns — policy-as-code for hook gate logic (openpolicyagent.org/docs/latest/policy-language)

---

## 3. Subagents

### What Claude Code ships
- Spawned child instances via `Task` tool with `description`, `prompt`, model inheritance
- Auto-delegation: Claude Code decides which subagent to route to based on description
- Each subagent gets a copy of the parent's `allowed_tools` (can narrow, not widen)
- Parent waits for child; results flow back into parent context

### We Have
- `lib/ai-engine/src/multi-agent-coordinator.ts` — `CoordinatorAgent.run()` with A2A registry discovery
- `lib/ai-engine/src/domain-agent-runner.ts` — `DomainAgentRunner` per-domain chat loop
- `artifacts/a11oy/src/pages/Workcells.tsx` / `WorkcellDetail.tsx` / `AgentMesh.tsx` — Workcell ≈ subagent abstraction

### Adopt Verbatim
- Explicit spawn contract: each subagent declares `model`, `allowed_tools`, `allowed_mcp_servers`, `permission_mode`, `parent_proof_id`
- Auto-delegation: description-based routing in `CoordinatorAgent` mirrors Claude Code's Task tool auto-routing
- Subagent inherits parent's constitution + covenant bundle by default (can restrict, not expand)

### Extend (One of One)
- Delegation rationale recorded in the Proof Packet: which subagent was chosen and why
- Trust Tier badge in WorkcellDetail and AgentMesh: `Read-only` / `Plan-only` / `Auto-approve-low-risk` / `HITL-required` / `Sovereign-air-gapped`
- PreSubagentSpawn hook gates every spawn against covenant policy
- Cross-surface `session_id` plumbed through spawns so the same decision appears in Terminal + ProofLedger + mobile

### Cited References
- Anthropic Claude Code Sub-agents docs (code.claude.com/docs/sub-agents)
- LangGraph subgraph isolation vs Claude Code spawn model — both copy-and-narrow permissions, LangGraph adds explicit state graphs
- AutoGen GroupChat vs Claude Code auto-delegation — Claude Code simpler but A11oy extends with Proof Chain

---

## 4. Memory (CLAUDE.md / Tiered)

### What Claude Code ships
- `CLAUDE.md` at project root — loaded as immutable project-level context
- Memory types: project (`CLAUDE.md`), user (~/.claude/CLAUDE.md), local (`.claude/CLAUDE.md`), auto-memory (appended by agent via `/remember`)
- Auto-memory: agent writes learned facts with `CLAUDE.md` append; user reviews
- Scope: per-session working memory, project memory (git-tracked), user global memory

### We Have
- `lib/ai-engine/src/memory/rl-memory.ts` — RL-trained memory with episodic / semantic / procedural tiers and decay/reward
- `artifacts/a11oy/src/pages/Memory.tsx` — Session Memory + Memory Bank two-tier UI with restricted entries

### Adopt Verbatim
- Three explicit tiers: `org-constitution` (immutable per release), `project-doctrine` (per-artifact CLAUDE.md-equivalent), `auto-memory` (learned, append-only, redactable)
- Clean read API and write API with redaction hooks
- Auto-memory entries flow through PostToolUse + PostSubagentReturn hooks

### Extend (One of One)
- `org-constitution` sourced from `mythosDoctrine.ts` + `Constitution.tsx` (read-only mirror)
- `project-doctrine` seeded from per-artifact `CLAUDE.md` files if present
- Every auto-memory write produces a Proof Chain entry (provenance: "written by hook X on event Y for run Z")
- Redaction action in Memory inspector respects covenant policy and logs to Proof Ledger

### Cited References
- Anthropic Claude Code Memory docs (code.claude.com/docs/memory)
- AgeMem (2024) — RL-scored memory with decay, summarization, and selective retention for long-horizon agents

---

## 5. Plan Mode

### What Claude Code ships
- `--plan` flag puts Claude Code into read-only mode
- In plan mode: reads and analyzes, emits a structured plan, does NOT call side-effecting tools
- Plan is presented to user for approval; once approved, Claude Code exits plan mode and executes
- `permission_mode: "plan"` in CLAUDE.md enforces this for all sessions

### We Have
- `artifacts/a11oy/src/pages/PlannerCanvas.tsx` — visual plan with nodes, deps, status
- `artifacts/a11oy/src/pages/IntentRouter.tsx` — intent routing before plan execution

### Adopt Verbatim
- Plan mode as a first-class execution mode (not a UI hint)
- Tools with side effects MUST check `permission_mode === "plan"` and refuse (hard gate)
- Decision Card structure: Signal → Context → Recommendation → Simulation
- "Sign & Lock Plan" step produces a signed Decision Card before promotion to Workcell

### Extend (One of One)
- Signed Decision Card seals into ProofLedger (Proof Packet with `plan_mode: true` flag)
- PreToolUse hook enforces the plan-mode hard gate: any side-effecting tool during plan phase is blocked with a reason
- Trust Tier ladder: `Plan-only` tier maps to plan mode enforcement
- Plan Lock affordance in PlannerCanvas: explicit "Sign & Lock" button that must be clicked before the plan can be promoted

### Cited References
- Anthropic Claude Code Plan Mode docs (code.claude.com/docs/plan-mode)
- Microsoft Agent Governance Toolkit — plan-before-act pattern with approval gates (github.com/microsoft/agent-governance-toolkit)

---

## 6. Permission Modes (Trust Tiers)

### What Claude Code ships
- Permission modes: `default`, `acceptEdits`, `bypassPermissions`, `plan`
- Configured per-session or per-skill in frontmatter
- `bypassPermissions` requires explicit operator opt-in; restricted from MCP tool calls
- `AcceptEdits` auto-approves file edits but prompts for shell commands

### We Have
- Approval tier routing in PCE contracts (Tier 1 auto / Tier 2 operator / Tier 3 executive)
- Governance policies with enforcement modes (`block_until_approved`, `auto_escalate`, `constitutional`)

### Adopt Verbatim
- Permission modes as explicit configuration in skill frontmatter and subagent spawn contract
- PreToolUse hook checks `permission_mode` before every tool call

### Extend (One of One — Trust Tier Ladder)
| Tier | Label | What it allows |
|------|-------|----------------|
| 0 | Read-only | Query-only tools; no state changes |
| 1 | Plan-only | Reads + plan emission; no side effects |
| 2 | Auto-approve-low-risk | Low-impact tools auto-run; high-impact gated |
| 3 | HITL-required | Every side-effecting tool requires human approval |
| 4 | Sovereign-air-gapped | Fully isolated; no external tool calls |

- Operators set Trust Tier per subagent class in Governance + ControlTower (live, no redeploy)
- Trust tier changes take effect via PreToolUse hook within < 1s
- Each tier has a Covenant policy bundle that defines what "low-impact" vs "high-impact" means

### Cited References
- Anthropic Claude Code Permission Modes (code.claude.com/docs/settings#permission-modes)
- Microsoft Agent Governance Toolkit — tiered autonomy with human-in-the-loop gates

---

## 7. MCP (Model Context Protocol)

### What Claude Code ships
- MCP servers declared in `.claude/mcp.json` or project config
- Transport: stdio, SSE, streamable-HTTP
- Auth: OAuth 2.0, API keys (MCP 2026 enterprise roadmap adds PKCE + token rotation)
- Enterprise roadmap (2026): audit logging per tool call, rate limiting, schema versioning, namespace isolation

### We Have
- `artifacts/a11oy/src/pages/McpHub.tsx` — live MCP server registry with health, tools, resources
- `lib/ai-engine/src/mcp-apps/ui-tools.ts` — MCP UI tool definitions

### Adopt Verbatim
- Per-MCP-server `allowed_subagents` scope field
- Hook-emit indicator: which hooks fire on calls to this server
- MCP 2026 enterprise readiness checklist

### Extend (One of One)
- Covenant policy bundle per MCP server: which skills/subagents can call this server
- Every MCP tool call routed through PreToolUse hook (proof-chained)
- MCP 2026 checklist rendered in McpHub: auth ✓, audit ✓, rate-limits ✓, schema versioning ✓

### Cited References
- MCP specification (modelcontextprotocol.io)
- MCP 2026 enterprise roadmap — auth, audit, rate limits, schema versioning (github.com/modelcontextprotocol/specification/discussions)

---

## 8. Reward-Hacking Watchdog

### What Claude Code ships
- No built-in reward-hacking detection (this is an A11oy extension)

### We Have
- `lib/ai-engine/src/evals/evaluator-hooks.ts` — global eval hooks (confidence, latency, cost)
- `artifacts/a11oy/src/pages/RewardHacking.tsx` — reward-hacking dashboard

### Extend (One of One — "One of One" primitive)
- Built-in PostSubagentReturn evaluator hook detects:
  - **Goal substitution**: output objective diverges from input objective (cosine distance > 0.4)
  - **Eval gaming**: suspiciously high self-reported confidence (> 0.98 on all dimensions)
  - **Sycophancy**: output agrees with all prior assistant messages without independent assessment
  - **Scope creep**: tool calls outside the declared Plan's scope
- Findings flow to `RewardHacking.tsx` dashboard and `ActionRail.tsx`
- Watchdog runs as a registered `PostSubagentReturn` hook; findings produce a Proof Chain entry

### Cited References
- Reward hacking in LLM agents — Kambhampati et al. (2024), "LLMs Can't Plan But Can Help Planning"
- Sycophancy evaluation — Anthropic (2023), "Sycophancy to Subterfuge"
- Goal substitution detection — MIRI/ARC Evals literature on specification gaming

---

## 9. OpenTelemetry GenAI Semantic Conventions

### What the 2026 OTel GenAI Spec ships
- `gen_ai.system` — provider name (e.g., `anthropic`)
- `gen_ai.request.model` — model ID
- `gen_ai.usage.input_tokens` / `gen_ai.usage.output_tokens`
- `gen_ai.agent.name` — agent identifier
- `gen_ai.operation.name` — `chat`, `tool_call`, `subagent_spawn`
- Span kind: `CLIENT` for model calls, `INTERNAL` for agent decisions
- Events: `gen_ai.content.prompt`, `gen_ai.content.completion`

### We Have
- `lib/ai-engine/src/observability/behavioral-tracer.ts` — custom decision fork tracing
- Model router telemetry with latency, cost, provider

### Adopt Verbatim
- OTel GenAI semconv attribute names on every span: model calls, tool calls, subagent spawns, hook decisions, plan signings
- Spans exported to standard OTel collector endpoint when configured

### Extend (One of One)
- Dual-output instrumentation: same instrumentation function writes to OTel exporter AND ProofLedger
- `gen_ai.a11oy.session_id` custom attribute carries the cross-surface session token
- `gen_ai.a11oy.proof_packet_id` custom attribute links every span to its Proof Packet
- `gen_ai.a11oy.hook_decisions` custom attribute summarizes hook allow/block counts per span

### Cited References
- OTel GenAI Semantic Conventions 1.28.0 (opentelemetry.io/docs/specs/semconv/gen-ai)
- CNCF OpenTelemetry GenAI working group 2026 proposals

---

## 10. OPA/Rego Adapter

### What OPA/Rego provides (2026)
- Declarative, portable policy language
- Policies as `.rego` files; can be bundled and distributed
- Used in: Kubernetes admission, API gateways, data authorization
- AI guardrail patterns: input validation, output sanitization, tool allow-list enforcement

### We Have
- Covenant policy system with JSON-based policy bundles
- PCE (Policy Contract Engine) gate in api-server

### Adopt / Extend (One of One)
- `lib/ai-engine/src/governance/opa-rego-adapter.ts` — alternative front-end to existing covenant runtime
- Covenant policy bundles can include Rego policies (`.rego` string) evaluated by lightweight OPA evaluator
- Rego policies are portable: can be exported, audited, and shared across organizations
- Rego policies compose with the existing JSON covenant format (both evaluated; strictest wins)

### Cited References
- OPA Rego language reference (openpolicyagent.org/docs/latest/policy-language)
- AI guardrail patterns with OPA — "Governing LLM Tool Calls with Open Policy Agent" (2025)

---

## 11. Cross-Surface Sessions

### What Claude Code ships
- Session IDs carried across Terminal ↔ IDE ↔ GitHub Actions
- Session state: conversation history, active memories, permission mode
- Remote control API (2026): programmatic session management

### We Have
- Per-request correlation IDs in model-router telemetry
- Workcell run IDs in Proof Packets

### Adopt Verbatim
- `session_id` plumbed through: model-router → subagent runner → hook executor → ProofLedger writer
- All Proof Chain entries for one operator decision share the same `session_id`

### Extend (One of One)
- `session_id` surfaced in WorkcellDetail header and ProofLedger detail view
- `gen_ai.a11oy.session_id` on every OTel span
- Session tokens are Proof-Chain-linked: any surface can present a session_id and get the full audit trail

---

## Delta Summary Table

| Primitive | We Have | Adopt | Extend (One of One) |
|-----------|---------|-------|---------------------|
| Skills | Programmatic registry | FS discovery, SKILL.md frontmatter, hot-reload | Constitution clause, covenant bundle, eval pass-rate, proof chain on every invocation |
| Hooks | Eval hooks, tool governance | Lifecycle events, JSON decision contract, registry+executor | Built-in governed hooks, proof chain auto-entry, Hook Pack registry UI |
| Subagents | CoordinatorAgent, DomainAgentRunner | Explicit spawn contract, auto-delegation | Trust Tier badge, delegation rationale in proof packet, PreSubagentSpawn hook |
| Memory | RL-memory (3 tiers) | CLAUDE.md-style tiered API | Org-constitution tier, per-entry provenance, redaction with covenant gate |
| Plan Mode | PlannerCanvas UI | Plan-mode hard gate in tools | Signed Decision Card → ProofLedger, Plan Lock affordance |
| Permission Modes | PCE tiers | Per-skill frontmatter, PreToolUse enforcement | Trust Tier ladder (5 levels), live operator control, covenant bundle per tier |
| MCP | McpHub UI | Subagent scope per server, hook-emit indicator | Covenant policy per server, MCP 2026 checklist, proof-chained tool calls |
| OTel | Behavioral tracer | OTel GenAI semconv spans | Dual-output (OTel + ProofLedger), session_id + proof_packet_id custom attrs |
| OPA/Rego | JSON covenant | Rego adapter | Portable, auditable, cross-org policy distribution |
| Reward-Hacking | RewardHacking page | PostSubagentReturn hook | Goal substitution, eval gaming, sycophancy, scope creep detection |
| Cross-surface sessions | Run IDs | session_id propagation | ProofLedger-linked session audit trail |

---

## Architectural Principles

1. **Governed by construction**: Every primitive (skill, hook, subagent, plan, memory write) emits a Proof Chain entry through `provenance.ts`. No code path bypasses this.

2. **Standards as dual outputs**: The OTel GenAI emitter and ProofLedger writer are wired in the same instrumentation function — they cannot drift.

3. **Plan Mode is a hard gate**: Tools with side effects check `permission_mode === "plan"` and refuse. The UI cannot override this.

4. **Skill discovery is safe**: Skills discovered only from `lib/ai-engine/src/skills/library/`. Pre-approved tool lists enforced via hooks.

5. **Anthropic access via proxy**: `ai-integrations-anthropic` proxy only. No raw API keys.

6. **No big-bang rewrites**: All engine refactors keep existing exports working via shims. Existing a11oy pages keep their routes.
