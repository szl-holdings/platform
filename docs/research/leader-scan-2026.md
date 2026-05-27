# Leader Scan — Recommendations & Upgrades (2026)

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Status:** DOCTRINE-PASS · Scan + recommendation set; implementation is downstream.
**Companions:** `agi-stack-synthesis-2026.md`, `perception-bio-synthesis-2026.md`, `agentic-coding-leaders.md`, `best-of-breed-adoption.md`, `ecosystem-pattern-scan-2026-04.md`.
**Scope:** A zoom-out across adjacent spaces — governed AI, agentic ops, mission-edge, receipts + provenance, operator UX — distilling what the current leaders do well and turning that into a prioritized, SZL-original upgrade set.

This document is **not** a copy guide. Patterns are absorbed under fair-use of public documentation; every adopted idea is re-expressed against SZL primitives (Doctrine V6, Λ-receipts, AMI v2, Covenant Policy, Decision Theater, perception-loop, sequence-pipeline). Where an idea would compromise our posture — most often by hiding evidence or by collapsing ranked outputs into a single silent answer — it is explicitly **NOT-ADOPT**, with the reason.

---

## How to read this document

1. **Survey** — Section 1, per leader: design summary, what they do well, what we already cover, gap.
2. **Synthesis** — Section 2 maps the gaps onto our five pillars (Governance, Perception, Sequence-Pipeline, Receipts, Edge).
3. **Recommendations** — Section 3 is the prioritized Impact × Effort table (≤10 entries).
4. **Originality checks** — Section 4, per top-5 recommendation: the SZL-original twist.
5. **Draft follow-ups** — Section 5: five candidate task plans, ready to lift into the project task list (not auto-created).
6. **NOT-ADOPT** — Section 6: what we explicitly decline and why.
7. **Gaps & risks** — Section 7: honest list of what this scan could not answer.
8. **Sources** — Section 8: URL ledger; dated; paywalled material flagged.

---

## 1. Survey — leaders in adjacent spaces

Each row is constrained to *publicly observable* design surface (docs, blog posts, conference talks, OSS repos). Where a vendor's core IP is behind paywall, we mark it and confine the entry to what is public.

### 1.1 Anthropic — Claude Code, Skills, MCP, Constitutional AI

- **Design summary.** Terminal-native agent loop with first-class *skills* (reusable instruction bundles), *hooks* (lifecycle interception), *MCP* (Model Context Protocol — typed tool surface), and *plan-lock* (in-flight plan protection). Constitutional AI surfaces a written governance layer outside the model weights.
- **What they do well.** Tool surface is typed and small. Skills are *retrievable on demand* rather than always-on, which keeps context lean. MCP is the cleanest typed-tool standard publicly available. Hooks make lifecycle observability a first-class concern.
- **What we already cover.** `.local/skills/` + `.agents/skills/` mirrors the skill pattern. `lib/ai-engine/src/plan-lock.ts` covers plan-lock. Our 5-gate model router covers some MCP-style typing. Skills are loaded on demand by `skillSearch()` and the secondary-skill prefix convention.
- **Gap.** We do **not** yet speak MCP over the wire; our typed-tool surface is internal-only. Hook lifecycle is implicit (workflow logs) rather than a typed registry.
- **Source:** `docs.anthropic.com/en/docs/claude-code`, `modelcontextprotocol.io` (both public, May 2026).

### 1.2 Cursor (Anysphere) — IDE-native agent

- **Design summary.** Editor-embedded agent with inline diff edits, ⌘K command palette, background codebase indexer, and codebase-wide chat. Tab-completion model is tuned on edit-acceptance signal.
- **What they do well.** The diff-first ergonomics — every agent action is *previewable* before commit. The background indexer makes "ask the whole repo" feel instant. Edit-acceptance is the right reward signal for code agents.
- **What we already cover.** A11oy Code ships an in-app `/code` panel and a public CLI; retrieval is proof-tagged. Edit-acceptance is captured implicitly in the trajectory store.
- **Gap.** We do **not** surface a diff-preview gate on the *agent's own* destructive actions outside the code surface (e.g., DB schema edits, artifact-config rewrites). Cursor's lesson is that the preview is the governance.
- **Source:** `cursor.com/features`, `cursor.com/blog/series-c` (public, 2026).

### 1.3 Palantir — Foundry, AIP, Ontology

- **Design summary.** Ontology-first data platform; AIP overlays governed LLM tooling onto the ontology so every agent action is typed against an `Object`/`Link`/`Action` schema. Operations are recorded as ontology-aware events.
- **What they do well.** The *ontology is the auth boundary*. An agent that wants to "approve a transfer" must touch a typed `Transfer` action whose ACL is part of the schema. Lineage is automatic because the action types are first-class. The Decision Theater interaction style (slate-grey panels, locked actor identities) is industry-defining for governed ops UX.
- **What we already cover.** `lib/ai-engine/src/governance/`, Covenant Policy, AMI v2 gating, and the operational-ontology pillar of Doctrine V6 are all the same shape. ROSIE Decision Theater is the surface analogue.
- **Gap.** Our ontology is **internal** — there is no public, machine-readable schema export that downstream integrators can bind against. Palantir's competitive moat is partly that *their customers* author objects inside Foundry; we have no equivalent authoring surface.
- **Source:** `palantir.com/platforms/aip` and Palantir AIPCon talks (public recordings, 2025–2026).

### 1.4 Anduril — Lattice OS, mission-edge autonomy

- **Design summary.** A mission-edge OS that runs autonomy stacks on disconnected/intermittent links. Sensor-fusion + asset-tasking + human-on-the-loop approval, with explicit operator UX for slow networks. Hardware-software co-design.
- **What they do well.** **Degraded-mode determinism** — the system designed for the *worst* link, not the best. Approval gates degrade gracefully (queued, cached, replayed) rather than blocking. Operator UX is built around *what the operator can still do when the link is half-dead*.
- **What we already cover.** `artifacts/rosie-mobile` is our mission-edge surface; sync-envelope (Amaru) is the substrate. We have the building blocks.
- **Gap.** We do **not** yet have an *approval-replay* contract: an operator on a degraded link who approves N actions should have their approvals signed, queued, and replayed deterministically when the link returns. Today the gate is link-dependent.
- **Source:** `anduril.com/lattice`, public DoD briefings (2025).

### 1.5 True Anomaly — Mosaic, space-domain operations

- **Design summary.** Space-domain mission ops with autonomous spacecraft tasking and a strong "ops-as-code" cultural posture. Public surface is thin (defence customer base), so this entry is necessarily light.
- **What they do well.** From public talks: treat *each spacecraft tasking* as a typed transaction with provenance, not as a free-form command. Strong emphasis on simulation-before-action.
- **What we already cover.** Our `packages/sim-kit` proposal (perception-bio synthesis §4) and the planner DAG approach (AGI synthesis §3) cover sim-before-action. Receipts cover the typed-transaction posture.
- **Gap.** **Sim-before-action is not yet a mandatory gate** in ROSIE — it's available, not required. True Anomaly's posture (and the broader space-ops convention) is that any action with irreversible kinetic consequence must be replayed in sim with a receipt before the live-fire gate opens.
- **Source:** `trueanomaly.space`, conference talks, news coverage 2024–2026. Most of their actual product surface is **not public** — gap acknowledged.

### 1.6 Scale AI — eval infrastructure, SEAL leaderboards

- **Design summary.** Eval-as-a-product. SEAL leaderboards expose third-party rankings against held-out sets. Strong investment in human-in-the-loop labelling and adversarial red-team evals.
- **What they do well.** **Third-party-judge separation** at scale (the same lesson as Sotopia-RL, but as a *business*). Public leaderboards create accountability that internal evals can't.
- **What we already cover.** `packages/aef-evals` and the proposed `sotopia-judge` (AGI synthesis §9) cover the structural pattern. `packages/agi-forecast` covers the per-axis rating ledger.
- **Gap.** Our evals are **internal**; we have no public "this is how SZL ranks itself against open benchmarks, with receipts" surface. The axis-vector receipt (`agi.axis-rating.v1`) exists in spec but is not published.
- **Source:** `scale.com/leaderboard`, public eval reports (2026).

### 1.7 OpenAI — Agents SDK, Computer Use, Operator

- **Design summary.** The Agents SDK formalises tool-calling + handoff between agents. Computer Use / Operator give an agent screen + keyboard access, with a safety review layer interleaved.
- **What they do well.** **Handoff** as a first-class primitive — one agent explicitly transfers control to another with a typed envelope (state, goal, constraints). The safety review layer on Computer Use is a clean instance of the "broadcast arbitration" pattern (AGI synthesis §8).
- **What we already cover.** Our consciousness/arbitration loop (`lib/ai-engine/src/consciousness/`) is structurally the same. Multi-agent orchestration via the ROSIE planner covers some handoff.
- **Gap.** Handoff is **implicit** in our planner — not a typed envelope. An OpenAI-style `Handoff = { from, to, goal, state, constraints, expectedReturn }` would make multi-agent traces walkable.
- **Source:** `platform.openai.com/docs/agents`, OpenAI DevDay 2025–2026.

### 1.8 LangChain / LangGraph — graph-based agent orchestration

- **Design summary.** LangGraph treats agent flow as a state-machine / graph; checkpoints persist state per node; human-in-the-loop is a typed interrupt.
- **What they do well.** **Typed interrupts** — the graph can pause at a named node, await human input, and resume with state intact. Checkpointing as a first-class concern (not a debug afterthought).
- **What we already cover.** Plan-lock + the proposed planner DAG (AGI synthesis §3) cover most of this. Approval gates are conceptually typed interrupts.
- **Gap.** Our interrupts are **per-plan**, not per-node. A long-running DAG cannot today pause at node 7, persist, and resume from node 7 in a later session — it would re-run.
- **Source:** `langchain-ai.github.io/langgraph`, LangChain blog (public, 2026).

### 1.9 Vercel AI SDK — provider-portable client

- **Design summary.** Provider-portable client; streaming-first; React hooks; structured outputs via schema.
- **What they do well.** The *streaming-first contract* — agents that surface partial results immediately, with a typed delta envelope. Drastically improves perceived latency.
- **What we already cover.** Our model gateway abstracts providers; we stream where the underlying model supports it.
- **Gap.** **Receipt-streaming.** A long-running plan's receipts are written at end-of-stage; an operator watching ROSIE waits. A typed `receipt.partial.v1` envelope with a final `receipt.sealed.v1` would let the Decision Theater render evidence as it accumulates.
- **Source:** `sdk.vercel.ai`, public docs (May 2026).

### 1.10 Sierra (Bret Taylor) — customer-experience agents with guardrails

- **Design summary.** Production CX agents with a strong written *agent policy* layer ("Agent OS") separating *what the agent may say* from *what model produced the candidate*. Eval-driven release process.
- **What they do well.** Policy is the contract; model is the implementation detail. Releases gated on eval deltas, not commits.
- **What we already cover.** Covenant Policy + AMI v2 + the public-claims registry cover the policy-as-contract posture. Eval gating is partially in place via `aef-evals`.
- **Gap.** We do **not** yet **gate releases on a published eval-delta receipt**. A new release of A11oy or ROSIE can ship without an explicit "AMI moved by X on these axes" record at the release-tag level.
- **Source:** `sierra.ai/agentos`, Bret Taylor interviews (public, 2025–2026).

---

## 2. Synthesis — gaps mapped to SZL pillars

| Pillar | Concrete gap surfaced by the scan | Lead source |
|---|---|---|
| **Governance** | Release gating on eval-delta receipt; ontology export for third-party binding; degraded-mode approval replay | Sierra, Palantir, Anduril |
| **Perception** | Diff-preview gate on the agent's own destructive actions beyond code | Cursor |
| **Sequence-Pipeline** | Per-node DAG checkpointing with resumable typed interrupts | LangGraph |
| **Receipts** | Streaming receipts (`receipt.partial` → `receipt.sealed`); published axis-rating ledger | Vercel, Scale |
| **Edge** | Sim-before-action mandatory gate for irreversible kinetic ops; MCP-over-the-wire surface for external integrators | True Anomaly, Anthropic |

Cross-cutting: **typed handoff envelopes** between agents (OpenAI Agents SDK) — touches Governance + Sequence-Pipeline + Receipts simultaneously.

---

## 3. Prioritized recommendations (Impact × Effort)

Scoring: Impact and Effort each on a 1–5 scale. Impact reflects user-visible posture change; Effort reflects implementation weeks for a single senior engineer. Priority = Impact ÷ Effort; ties broken by pillar-coverage breadth.

| # | Recommendation | Pillar | Impact | Effort | Priority | Top-5? |
|---|---|---|---|---|---|---|
| R1 | Typed agent **handoff envelope** (`handoff.v1`) across planner + Decision Theater | Sequence-Pipeline + Receipts | 5 | 2 | **2.50** | ✅ |
| R2 | **Streaming receipts** (`receipt.partial.v1` → `receipt.sealed.v1`) on the Decision Theater wire | Receipts | 5 | 2 | **2.50** | ✅ |
| R3 | **Release-gate eval-delta receipt** (`release.eval-delta.v1`) — no release tag without one | Governance | 5 | 2 | **2.50** | ✅ |
| R4 | **Per-node DAG checkpointing** with resumable typed interrupts | Sequence-Pipeline | 4 | 2 | **2.00** | ✅ |
| R5 | **Degraded-mode approval replay** contract for ROSIE-Mobile | Edge + Governance | 5 | 3 | **1.67** | ✅ |
| R6 | **Diff-preview gate** for agent-initiated destructive actions outside the code surface | Governance | 4 | 3 | 1.33 |  |
| R7 | **Sim-before-action mandatory gate** for kinetic / irreversible plan nodes | Edge | 5 | 4 | 1.25 |  |
| R8 | **Published axis-rating ledger** (`agi.axis-rating.v1` made public per release) | Receipts + Governance | 3 | 2 | 1.50 |  |
| R9 | **MCP-over-the-wire** surface for the SZL typed-tool registry | Edge | 3 | 3 | 1.00 |  |
| R10 | **Ontology export** for third-party binding (Palantir-style schema-as-product) | Governance | 4 | 5 | 0.80 |  |

Honesty note: priority is a rough sort, not a budget. R6–R10 are real and we should pick them up after the top-5; R10 in particular is large enough that it should not be attempted without a separate scoping pass.

---

## 4. Originality checks — the SZL-original twist for the top five

For each top-5 recommendation, we record the *one-of-one* element that makes the result ours, not a clone of the source leader.

### R1 — Typed handoff envelope

- **Borrowed shape.** OpenAI Agents SDK `Handoff`.
- **SZL-original twist.** Every handoff emits a `handoff.v1` receipt whose `expectedReturn` field is hashed *with the receiving agent's policy posture at handoff time*. If the receiving agent's posture changes mid-execution (model swap, policy delta), the return is **rejected** at receipt write and the handoff is logged as `handoff.posture-drift.v1`. OpenAI treats handoff as a control-flow primitive; we treat it as a *posture contract* under Covenant Policy.

### R2 — Streaming receipts

- **Borrowed shape.** Vercel AI SDK streaming envelope.
- **SZL-original twist.** Partial receipts are **not** evidence by themselves — they are *forward-looking commitments*. The `receipt.partial.v1` carries a `commitsToFields[]` list naming which final-receipt fields it pre-declares; the final `receipt.sealed.v1` is rejected if it contradicts a sealed commitment. This is structurally what AMI v2 does for autonomy axes, generalised to all receipt classes. Streaming becomes a *promise* the system must keep, not just a UX nicety.

### R3 — Release-gate eval-delta receipt

- **Borrowed shape.** Sierra's eval-gated release.
- **SZL-original twist.** The gate is not a scalar pass/fail — it is the AMI v2 axis vector delta plus the Doctrine V6 receipt-class coverage delta. A release that *improves* one axis but *regresses* receipt coverage on another is **blocked** even if a naïve composite score improves. Releases must be Pareto-non-decreasing across the axis-vector + coverage tuple. This forbids the "we gained capability by silently dropping evidence" failure mode that scalar gates miss.

### R4 — Per-node DAG checkpointing

- **Borrowed shape.** LangGraph typed interrupts + checkpoints.
- **SZL-original twist.** Checkpoints are **receipts**, not opaque blobs. Each node checkpoint is a `plan.dag.node.checkpoint.v1` receipt whose `resumableFrom` field references the parent `plan.dag.v1` receipt. Resuming a checkpoint is a typed action that emits `plan.dag.node.resumed.v1` and *re-evaluates the policy gate* at resume time, so a checkpoint taken under one posture cannot be silently resumed under a weaker one. LangGraph's checkpoint is state; ours is evidence + re-gated state.

### R5 — Degraded-mode approval replay

- **Borrowed shape.** Anduril Lattice degraded-mode operator UX.
- **SZL-original twist.** Approvals on the edge sign a *bounded forward commitment* — the operator pre-approves up to N actions of a typed class, with a TTL and a kill-condition. When the link returns, the queue replays under the *current* policy posture; any pre-approval whose class has been since restricted is **rejected at replay** and surfaced as `approval.degraded-replay.rejected.v1`. Anduril emphasises operator UX continuity; we emphasise *posture continuity across the link partition*. The receipt class makes the partition itself auditable.

---

## 5. Draft follow-up task proposals (top 5)

These are drafted, not auto-created. Each is sized to be a single task agent's scope and references the relevant synthesis sections.

---

### Draft task D1 — Typed agent handoff envelope (planner + Decision Theater)

**What & Why.** Add a typed `handoff.v1` envelope to `packages/planner` so multi-agent handoffs become walkable in the trajectory store and posture-contracted at handoff time. Today handoffs are implicit in the planner; the receipt is missing.

**Done looks like.**
- `packages/planner/src/handoff.ts` exports `Handoff` typed envelope (`from`, `to`, `goal`, `state`, `constraints`, `expectedReturn`, `posturePostureAtHandoff`).
- Handoff write emits `handoff.v1` receipt; posture-drift at return-time emits `handoff.posture-drift.v1`.
- ROSIE Decision Theater renders the handoff chain (`artifacts/rosie/src/components/HandoffChain.tsx`) with each hop linked to its receipt.
- Integration test: multi-agent scenario in `packages/ouroboros-bench` shows posture-drift is detected when receiving agent's policy posture changes mid-execution.

**Out of scope.** Multi-tenant handoff across orgs; cross-process handoff wire format.

**Relevant files.** `packages/planner/`, `lib/ai-engine/src/flywheel/trajectory-store.ts`, `artifacts/rosie/`, `packages/szl-receipts/`.

---

### Draft task D2 — Streaming receipts as forward commitments

**What & Why.** Introduce `receipt.partial.v1` and `receipt.sealed.v1` envelopes that let long-running plans surface evidence as it accumulates in the Decision Theater, with the partial acting as a *commitment* the final must honour. Today evidence appears only at stage end; operators wait blind.

**Done looks like.**
- `packages/szl-receipts/src/streaming.ts` adds the two envelopes plus a `commitsToFields[]` enforcement check.
- Sealing rejects when a sealed field contradicts a partial's commitment.
- ROSIE Decision Theater (`artifacts/rosie/src/streams/`) subscribes and renders partials with a "promise" indicator that resolves to "sealed" on completion.
- Unit + integration tests cover the contradict-commitment rejection path and the happy path.

**Out of scope.** Adopting streaming for *all* existing receipt classes — only the classes routed through the Decision Theater wire are in scope for the first pass.

**Relevant files.** `packages/szl-receipts/`, `artifacts/rosie/`, `artifacts/api-server/`.

---

### Draft task D3 — Release-gate eval-delta receipt

**What & Why.** Block release-tag creation on a `release.eval-delta.v1` receipt that proves Pareto-non-decreasing on `(AMI v2 axis vector, receipt-class coverage)` against the previous release tag. Today release tags can ship without an evidence delta.

**Done looks like.**
- `packages/aef-evals/src/release-gate.ts` computes the axis-vector + coverage delta against the previous tag.
- `tools/release/` (or equivalent) refuses to create a tag without a `release.eval-delta.v1` receipt whose `paretoNonDecreasing: true` field is signed.
- The receipt is published into the existing axis-rating ledger and linked from the release notes.
- Doctrine V6 scanner gains a check: a marketing surface that quotes a release tag without the receipt link is flagged.

**Out of scope.** Defining new axes; modifying AMI v2 itself.

**Relevant files.** `packages/aef-evals/`, `packages/agi-forecast/`, `packages/szl-receipts/`, `scripts/check-doctrine-v6.mjs`.

---

### Draft task D4 — Per-node DAG checkpointing with re-gated resume

**What & Why.** Add per-node checkpoints to the proposed graph planner (AGI synthesis §3) so a long DAG can pause at a node, persist as a `plan.dag.node.checkpoint.v1` receipt, and resume later under a re-evaluated policy gate.

**Done looks like.**
- `packages/planner/src/graph-planner.ts` (or the proposed sibling) gains `checkpoint(nodeId)` and `resumeFromCheckpoint(receiptId)`.
- Resume re-evaluates the Covenant Policy at resume time; a weakened posture rejects the resume and emits `plan.dag.node.resume.rejected.v1`.
- ROSIE shows checkpointed plans in a "paused plans" lane.
- Tests cover happy resume, posture-weakening rejection, and TTL expiry.

**Out of scope.** Migrating existing linear plans to checkpointable form (opt-in only).

**Relevant files.** `packages/planner/`, `lib/ai-engine/src/plan-lock.ts`, `artifacts/rosie/`.

---

### Draft task D5 — Degraded-mode approval replay (ROSIE-Mobile)

**What & Why.** Operators on degraded links must be able to pre-approve a bounded queue of actions that replay deterministically when the link returns, with each replay re-gated under the *current* policy posture.

**Done looks like.**
- `artifacts/rosie-mobile/` ships a `degradedApproval` flow: operator signs a `approval.degraded.v1` receipt naming `actionClass`, `count`, `ttl`, `killCondition`.
- Sync envelope (Amaru) carries the queued approvals on reconnect.
- `packages/aef-policy-guard/` replay path re-evaluates posture per-action; rejected items emit `approval.degraded-replay.rejected.v1`.
- E2E test simulates link partition + posture change + replay; rejection is observed and surfaced in ROSIE.

**Out of scope.** Hardware-level link detection; secure-element key custody for the signing key (tracked separately).

**Relevant files.** `artifacts/rosie-mobile/`, `artifacts/conduit/`, `packages/aef-policy-guard/`, `packages/szl-receipts/`.

---

## 6. NOT-ADOPT — explicit declines

Recording these so future scans don't re-litigate them.

- **Cursor-style background full-repo indexer that never expires.** Conflicts with our receipt-bound retrieval posture (the index would become an unaccounted-for evidence source). We do scoped retrieval per request, proof-tagged.
- **LangChain `AgentExecutor`-style hidden retries.** Hidden retries hide failure modes. Our retries are explicit, receipted, and capped at the planner layer, never at the tool layer.
- **OpenAI Computer Use's permissive default screen access.** Even with the safety layer, the default posture is too open for our governance stance. If we add a screen-tooling surface, it ships denied-by-default with per-action allow-listing.
- **Scale-style human-labelled eval at the volume they operate at.** Right pattern, wrong scale for us; we ship the *third-party-judge separation* without the labelling-fleet operation. Sotopia-judge (AGI synthesis §9) is the proportionate version.
- **Palantir-style closed ontology authoring inside our product.** We will publish an ontology *export* (R10) before we build an authoring surface. Authoring inside the product is a deferred decision, not a default direction.

---

## 7. Gaps & risks (honest)

- **True Anomaly is largely public-thin.** The entry is light on purpose. If we want a real read on space-domain ops design, we'd need to interview practitioners or attend a closed briefing — neither happened here.
- **Defence-vendor product UX behind login walls** (Palantir Foundry, Anduril Lattice operator console) is mostly seen via demo videos, not first-hand. Risk: we may be over-indexing on the marketing surface.
- **No quantitative comparison.** This is a qualitative scan. A future pass should bench our axis-rating against published leaderboards once R3 + R8 ship, so the comparison is grounded.
- **Anthropic's MCP is still evolving.** Adopting MCP-over-the-wire (R9) means tracking a moving spec; we should not adopt before R1–R5 ship.
- **Sierra and Cursor are private companies on rapid product trajectories.** What is "public" today may be deprecated by the next release; revisit this doc on a quarterly cadence.
- **No paywalled vendor materials were acquired.** Per task scope. Public-only.

---

## 8. Sources (URL ledger, dated)

All accessed May 2026. Public material only.

- Anthropic — `docs.anthropic.com/en/docs/claude-code`, `docs.anthropic.com/en/docs/agents-and-tools/mcp`, `modelcontextprotocol.io`.
- Cursor — `cursor.com/features`, `cursor.com/blog`.
- Palantir — `palantir.com/platforms/aip`, `palantir.com/platforms/foundry`, AIPCon 2025 + 2026 public recordings on YouTube.
- Anduril — `anduril.com/lattice`, public DoD programme briefings.
- True Anomaly — `trueanomaly.space`, news coverage 2024–2026 (TechCrunch, SpaceNews); product internals **not public**.
- Scale AI — `scale.com/leaderboard`, public SEAL reports.
- OpenAI — `platform.openai.com/docs/agents`, DevDay 2025 + 2026 keynotes (public stream).
- LangChain / LangGraph — `langchain-ai.github.io/langgraph`, `blog.langchain.dev`.
- Vercel — `sdk.vercel.ai`.
- Sierra — `sierra.ai/agentos`, Bret Taylor interviews (Stratechery, Acquired, public episodes 2025–2026).

Internal companions: `docs/research/agi-stack-synthesis-2026.md`, `docs/research/perception-bio-synthesis-2026.md`, `docs/research/agentic-coding-leaders.md`, `docs/research/best-of-breed-adoption.md`, `docs/research/ecosystem-pattern-scan-2026-04.md`.

---

**End of scan.** The five draft follow-ups (§5) are ready to lift into the project task list when prioritisation permits. The NOT-ADOPT list (§6) and the gaps list (§7) are intentionally kept honest so the next scan starts from a real baseline rather than aspirational copy.
