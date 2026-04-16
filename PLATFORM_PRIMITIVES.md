# Platform Primitives — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026
**Source of truth for:** the five core abstractions that define the governed decision platform

---

## Overview

The SZL Holdings platform is built on five core primitives. These are not features — they are the structural abstractions that make the platform fundamentally different from dashboards, copilots, and workflow tools.

Every product surface in the ecosystem (Lyte, Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo, Command Portal, CORTEX) is built on top of these same five primitives. Domain packs add domain-specific intelligence; the primitives provide the governance infrastructure.

```
Signal arrives
    │
    ▼
┌─────────────────┐     ┌─────────────────┐
│ Workflow Engine  │────▶│  Monte Carlo     │
│ Orchestrate the  │     │  Simulate risk   │
│ decision process │     │  before acting   │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Covenant Policy  │────▶│  Proof Chain     │
│ Check permission │     │  Record the      │
│ Require approval │     │  audit trail     │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Outcome Graph    │
│ Track result     │
│ Feed back to AI  │
└─────────────────┘
```

---

## 1. Outcome Graph

**Library:** `@szl-holdings/outcome-graph` · **Source:** `lib/outcome-graph/`

### What It Does

The Outcome Graph tracks the full lifecycle of a recommendation from the moment an agent proposes it, through the user's decision, to the real-world outcome it produces.

### Why It Matters

Without outcome tracking, AI systems are open-loop — they make recommendations but never learn whether those recommendations were useful. The Outcome Graph closes the loop. It enables:
- **Acceptance rate tracking** — what percentage of recommendations are accepted vs. rejected vs. overridden
- **Achievement rate tracking** — of accepted recommendations, how many led to the desired outcome
- **Confidence calibration** — adjusting agent confidence scores based on historical accuracy
- **Agent performance benchmarking** — comparing agents by their outcome-adjusted accuracy

### Key Operations

| Operation | Purpose |
|-----------|---------|
| `recordRecommendation()` | An agent proposes an action — captures agent ID, confidence, evidence (proof chain), and domain context |
| `recordDecision()` | The user responds — accepted, rejected, overridden, or deferred — with optional rationale |
| `recordOutcome()` | The real-world result is logged — achieved, partially achieved, not achieved, or unknown |
| `triggerLearningJob()` | Starts a background calibration process (e.g., `confidence_calibration`) using historical outcome data |
| `getOutcomeStats()` | Returns aggregated metrics: acceptance rate, achievement rate, override frequency |

### How It Connects

- References `proof-chain` entries as evidentiary support for recommendations
- Fed into `monte-carlo` simulations as historical calibration data
- Surfaced in Lyte's action queue and CORTEX's command feed
- Powers agent performance dashboards across all domain packs

---

## 2. Proof Chain

**Library:** `@szl-holdings/proof-chain` · **Source:** `lib/proof-chain/`

### What It Does

The Proof Chain generates a verifiable, immutable audit trail for every significant action in the platform. It provides cryptographic provenance for content — especially AI-generated content — and enforces export safety rules before content can leave the system.

### Why It Matters

Enterprise buyers in regulated industries need to answer: *Who approved this? Based on what evidence? When? And can we prove it?*

The Proof Chain makes every decision reconstructable. Compliance officers, regulators, and auditors can trace any action back through its full provenance — from the signal that triggered it, to the agent that recommended it, to the human who approved it, to the outcome it produced.

### Key Operations

| Operation | Purpose |
|-----------|---------|
| `tagAIContent()` | Records the creation of AI-generated content with model metadata, source classification, and parent proof reference |
| `reviewProof()` | Updates the review status (unreviewed → approved / flagged / retracted) and recalculates export safety |
| `isExportSafe()` | Checks whether content has been cleared for external distribution |
| `assertExportSafe()` | Throws if content is not cleared — used as a guard before document generation or client-facing output |
| `getProofChain()` | Retrieves the full provenance chain for a given content item |

### Source Classification

Every piece of content is classified by origin:
- `llm_generated` — produced by an AI model
- `human_authored` — written by a human operator
- `system_computed` — calculated by platform logic (e.g., scores, aggregations)
- `external_ingested` — imported from an external data source
- `hybrid` — human-edited AI output

### Export Safety States

| State | Meaning |
|-------|---------|
| `safe` | Reviewed and approved for external use |
| `restricted` | Approved for internal use only |
| `pending_review` | Awaiting human review |
| `blocked` | Flagged or retracted — cannot be exported |

### How It Connects

- Referenced by `outcome-graph` entries as evidence for recommendations
- Enforced by `covenant-policy` before document generation or client-facing actions
- Surfaced in PRISM Counsel's proof chain viewer and Alloy's governance audit
- Attached to all AI copilot outputs across every domain pack

---

## 3. Covenant Policy

**Library:** `@szl-holdings/covenant-policy` · **Source:** `lib/covenant-policy/`

### What It Does

The Covenant Policy engine defines and enforces what subjects (users, agents, services) can do to resources (data, actions, workflows), under what conditions, with what approval requirements. It is the platform's authorization and governance layer.

### Why It Matters

Human-in-the-loop is not a UI pattern. It is an enforced policy gate.

When an AI agent recommends a consequential action — closing a matter, sanctioning a vessel, approving a deal — the Covenant Policy engine checks whether:
1. The agent has permission to recommend this type of action
2. The action requires human approval (and if so, from whom)
3. The conditions for auto-execution are met (if any)
4. The action complies with domain-specific regulatory constraints

This is structural governance. The AI cannot bypass it. The UI cannot skip it. The API enforces it.

### Key Operations

| Operation | Purpose |
|-----------|---------|
| `checkPermission()` | Evaluates a request against applicable policies — returns `permit`, `deny`, or `escalate` |
| `assertPermission()` | Throws if the request is denied — used as middleware in API routes |
| `createApprovalRequest()` | Creates a pending approval for actions that require human sign-off |
| `reviewApproval()` | Records the approval decision (approved / denied) with reviewer attribution |
| `COVENANT_POLICY_TEMPLATES` | Pre-defined policy sets for common governance scenarios |

### Decision Types

| Decision | Meaning |
|----------|---------|
| `permit` | Action allowed — proceed |
| `deny` | Action blocked — insufficient permission or policy violation |
| `escalate` | Action requires approval from a higher authority before proceeding |

### How It Connects

- Enforced by `workflow-engine` before executing consequential workflow steps
- Checked by AI agents before generating recommendations for restricted action types
- Surfaced in Lyte's approvals center and CORTEX's approval notifications
- Integrated with RBAC roles — policies reference role hierarchy

---

## 4. Monte Carlo Engine

**Library:** `@szl-holdings/monte-carlo` · **Source:** `lib/monte-carlo/`

### What It Does

The Monte Carlo engine runs probabilistic simulations to model risk and uncertainty before action. It takes a scenario definition with input distributions and runs thousands of trials to produce confidence intervals, expected values, and sensitivity rankings.

### Why It Matters

Operators making consequential decisions need more than a recommendation. They need to understand the range of possible outcomes and which variables matter most.

The Monte Carlo engine transforms "the AI thinks we should do X" into "if we do X, the expected outcome is Y with a 90% confidence interval of [A, B], and the variables that matter most are Z1, Z2, and Z3."

### Key Operations

| Operation | Purpose |
|-----------|---------|
| `runSimulation()` | Executes a Monte Carlo simulation with configurable trial count, produces percentile results |
| `computeSensitivity()` | Generates tornado-style sensitivity analysis — ranks input variables by impact on output |
| `calibrate()` | Adjusts distribution parameters using historical outcome data |
| `DOMAIN_SCENARIO_LIBRARY` | Pre-built scenario templates for each domain pack |

### Distribution Types

Supports: Normal, LogNormal, Uniform, Triangular, PERT, Discrete, Custom empirical distributions.

### Domain Scenarios

| Domain | Scenario | What It Models |
|--------|----------|---------------|
| Aegis | `AEGIS_CYBER_RISK` | Expected loss from security incident given current controls |
| Vessels | `VESSELS_VOYAGE_COST` | Total voyage cost with fuel, port, and charter rate uncertainty |
| Terra | `TERRA_DEAL_RETURN` | Expected ROI on distressed property acquisition |
| PRISM Counsel | `PRISM_SETTLEMENT_RANGE` | Likely settlement range given case strength and jurisdiction |

### How It Connects

- Results feed into `outcome-graph` as evidence for recommendations
- Triggered by `workflow-engine` before high-stakes decision steps
- Sensitivity analysis surfaces in Lyte's action queue as "what matters most"
- Historical outcomes from `outcome-graph` calibrate future simulations

---

## 5. Workflow Engine

**Library:** `@szl-holdings/workflow-engine` · **Source:** `lib/workflow-engine/` (wraps `@szl-holdings/forge-runtime`)

### What It Does

The Workflow Engine orchestrates multi-step operational processes with durable state, agent coordination, event-driven triggers, and checkpoint recovery. It is the runtime that makes the other four primitives work together in practice.

### Why It Matters

Consequential decisions are rarely single-step. A dark vessel alert might trigger a sanctions check, a risk simulation, a policy evaluation, a human approval, and a fleet notification — in sequence, with state preserved between steps.

The Workflow Engine ensures these multi-step processes are:
- **Durable** — survive service restarts
- **Observable** — every step is logged
- **Governed** — policy checks at each transition
- **Attributable** — actor identity attached to every state change

### Key Operations

| Operation | Purpose |
|-----------|---------|
| `WorkflowStateMachine` | Defines states, transitions, guards, and side effects for a process |
| `AgentEventBus` | Pub/sub mechanism for inter-agent coordination |
| `DurableJob` | Persistent task that survives restarts with checkpoint/resume |
| State transitions | `pending → running → awaiting_approval → approved → executing → completed` (or `failed`) |

### How It Connects

- Triggers `monte-carlo` simulations at risk-assessment steps
- Evaluates `covenant-policy` at approval gates
- Records every step in `proof-chain`
- Logs final outcomes in `outcome-graph`
- Surfaced in Alloy's Factory Floor and Lyte's action queue

---

## The Core Loop

All five primitives work together in a single governed decision loop:

```
1. Signal arrives (via PRISM Bus or external integration)
       │
2. Workflow Engine starts a decision process
       │
3. Monte Carlo Engine simulates possible outcomes
       │
4. Agent generates recommendation (recorded in Outcome Graph)
       │
5. Covenant Policy checks permission and approval requirements
       │
6. If approval required → Human reviews in Lyte/CORTEX
       │
7. Action executes → Proof Chain records the full trail
       │
8. Outcome is observed → Outcome Graph records the result
       │
9. Learning job calibrates future simulations and confidence
       │
       └──────── Loop repeats ────────┘
```

This loop runs across every domain pack. The domain determines the signal source and the action vocabulary. The governance infrastructure is shared.

---

## Related Documents

| Document | Path |
|----------|------|
| Category positioning | [CATEGORY_POSITIONING.md](CATEGORY_POSITIONING.md) |
| Proof and policy model | [PROOF_AND_POLICY_MODEL.md](PROOF_AND_POLICY_MODEL.md) |
| Decision simulation | [DECISION_SIMULATION.md](DECISION_SIMULATION.md) |
| Architecture | [ARCHITECTURE.md](ARCHITECTURE.md) |
| System overview | [SYSTEM-OVERVIEW.md](SYSTEM-OVERVIEW.md) |
