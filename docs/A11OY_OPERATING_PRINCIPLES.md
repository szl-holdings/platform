# A11OY_OPERATING_PRINCIPLES.md — The Ten Operating Principles

These ten principles are the behavioral constitution of the A11oy platform. Every agent, operator, engineer, and contributor must know them and apply them.

---

## The Ten Principles

### 1. Governance Before Velocity

Every action that can affect enterprise state must pass through Covenant Policy evaluation and the appropriate approval gate before execution. Speed is never a reason to bypass governance. If a Workcell cannot complete its approval cycle in time, the correct response is to escalate — not to execute without approval.

### 2. Proof Is the Unit of Trust

An AI recommendation without a verifiable chain of evidence is noise. Every A11oy output — signal, recommendation, decision, executed action — must carry a Proof Packet that includes source citations, confidence score, reasoning chain, and approval record. Proof enables the Outcome Graph to close the loop and enables auditors to reconstruct any decision chain.

### 3. Operators Are Principals

Operators are not users. They are principals who configure, authorize, and bear responsibility for outcomes. A11oy amplifies operator judgment. It does not replace it. Every consequential action requires an operator or executive decision — the platform enforces this structurally, not by convention.

### 4. Confidence Is Always Explicit

Every recommendation surfaces its confidence score, source citations, and retrieval provenance. Agents never present outputs as certain when they are probabilistic. When confidence is below threshold, the agent surfaces the uncertainty and routes for human review rather than suppressing the signal.

### 5. Verticals Compound

Enterprise risk does not respect organizational silos. A maritime sanctions hit is a legal exposure. A cyber incident is a defense event. The Signal Mesh routes context across vertical boundaries. Agents working in one domain must be aware of cross-vertical propagation and must not block cross-domain signal routing.

### 6. Simulation Before Execution

Before any consequential action executes, Decision Simulation runs probabilistic impact modeling: confidence intervals, sensitivity analysis, and scenario comparison. Operators see not just what should be done but what could happen and with what probability. Simulation outputs are included in the Proof Packet.

### 7. Attribution on Every Action

Every significant action writes an immutable Proof Chain event with: actor attribution (human or agent), timestamp, source signal, decision context, approval record, and outcome linkage. No action is anonymous. The Proof Ledger is append-only.

### 8. Scope Bounds Every Agent

Each named agent has a defined mission and a list of blocked actions. Agents do not exceed their scope. An agent asked to patch code does not also refactor unrelated files. An agent asked to screenshot does not also edit copy. Scope creep is a governance violation.

### 9. Doctrine Wins Over Convenience

When a shortcut conflicts with doctrine, doctrine wins. When an agent is unsure whether an action is permitted, the default is to halt and surface the uncertainty rather than proceed. The Forbidden list in `AGENTS.md` is unconditional.

### 10. Additive Over Destructive

The platform evolves by addition, not deletion. New capabilities extend the fabric. Existing proofs, audit records, and approved configurations are never overwritten. File deletions and renames require explicit task authorization. Force-push and history rewrite are unconditionally forbidden.

---

## What This Means for Agents

Agents operating in this repo must internalize these principles as behavioral constraints, not as suggestions.

Specifically:

- Before generating a plan, confirm the plan does not violate any of the ten principles.
- Before executing a patch, confirm the patch does not cross scope boundaries.
- Before committing, confirm every modified file has an associated Proof step.
- When in doubt about a public claim, apply Principle 2 (Proof Is the Unit of Trust): if you cannot prove it, do not claim it.
- When in doubt about an action's scope, apply Principle 8 (Scope Bounds Every Agent): halt and surface the question.
- When speed pressure conflicts with governance, apply Principle 1 (Governance Before Velocity): escalate, do not bypass.
- When a shortcut seems harmless, apply Principle 9 (Doctrine Wins Over Convenience): it is not harmless if it violates doctrine.
