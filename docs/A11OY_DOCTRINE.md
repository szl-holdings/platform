# A11OY_DOCTRINE.md — Product Thesis and Operating Philosophy

**A11oy** is the Live Enterprise Execution Fabric built by SZL Holdings.

---

## Product Thesis

Enterprise operations have an accountability gap. Dashboards show what happened. Alerts surface what is wrong. Neither tells operators what to do next, who is responsible, or whether a recommended action is safe to execute.

AI tools compound the problem: they add recommendation volume without governance. Operators accumulate more data, more noise, and more untracked decisions.

A11oy closes the gap. It is the governed agentic layer that sits between enterprise data and enterprise decisions — sensing, structuring, correlating, explaining, recommending, approving, executing, verifying, and preserving cryptographic proof across all seven SZL verticals, in real time.

**The core value proposition:** Every signal becomes context. Every context becomes a governed action. Every action carries proof. Every proof closes the loop.

---

## Operating Philosophy

A11oy is built on four convictions:

1. **Governance is a product feature, not a policy document.** Human-in-the-loop is enforced at the execution layer, not asked for in a terms-of-service. Covenant Policy makes it structural.

2. **Proof is the unit of trust.** An AI recommendation without provenance is noise. Every A11oy output — signal, recommendation, decision, action — carries a Proof Packet: source, confidence, reasoning chain, and approval record.

3. **Verticals compound.** A maritime sanctions hit surfaces a legal exposure in Counsel. A cyber incident in TENAX triggers a defense alert in PARAGON. The fabric routes signal context across domain boundaries because enterprise risk does not respect organizational silos.

4. **Operators are principals, not users.** Operators configure, authorize, and review. They set the approval gates. They own the outcomes. A11oy amplifies operator judgment — it does not replace it.

---

## Core Loop

```
Signal → Context → Recommendation → Simulation → Policy → Approval → Execution → Proof → Outcome
```

| Stage | What happens |
|-------|-------------|
| Signal | A business event is ingested and normalized into the Signal Mesh |
| Context | The Causal Core maps the signal to related state across the Coverage Graph |
| Recommendation | The Action Rail generates a governed action brief with confidence and source |
| Simulation | Decision Simulation runs probabilistic impact modeling |
| Policy | Covenant Policy evaluates the action against configured rules and approval thresholds |
| Approval | The action routes to the appropriate approval gate (auto / operator / executive / board) |
| Execution | The action executes with full audit instrumentation |
| Proof | The Proof Ledger records the full chain: signal → recommendation → decision → execution → outcome |
| Outcome | The Outcome Graph updates and feeds back into future recommendations |

---

## Product Principles

1. **Governed by default.** No action executes without policy evaluation. The approval gate is always present.
2. **Proof on every run.** Every executed action generates an immutable Proof Packet.
3. **Vertical-aware context.** Signal routing considers domain relationships, not just the originating vertical.
4. **Confidence is explicit.** Every recommendation displays its confidence score, source citations, and retrieval provenance.
5. **Simulation before execution.** Operators see not just what should be done, but what could happen.

---

## Agent Principles

1. **Agents extend operator judgment — they do not replace it.** Recommendations are advisory until approved.
2. **Every agent has a scope.** Agents are named, bounded, and purpose-specific. See `docs/A11OY_AGENT_DOCTRINE.md`.
3. **Agents carry proof obligations.** Every agent run must produce a Proof Packet.
4. **Agents respect doctrine.** No agent may bypass the Forbidden actions in `AGENTS.md`.
5. **Agents surface uncertainty.** When confidence is low, agents say so explicitly.

---

## Public Principles

1. A11oy is an **active prototype and investor demo platform**. Claims about production customers, revenue, or compliance must use the approved qualifiers.
2. Integrations described as "mock connectors" or "future connector targets" are not live integrations.
3. All product language is original SZL Holdings doctrine. No copied vendor copy.

---

## Engineering Principles

1. **Type safety is non-negotiable.** `pnpm typecheck` must pass before any merge.
2. **Routes are governed.** Every new route must be registered in the API spec and smoke-tested.
3. **Secrets never commit.** Zero tolerance. See `docs/A11OY_SECURITY_DOCTRINE.md`.
4. **The monorepo is additive.** Do not delete files, rename artifacts, or restructure packages without explicit task authorization.
5. **Demo mode is the default.** Phase 1 is in-memory and deterministic. Mutating operations return 501.

---

## Proof Principles

1. Proof is not optional. A task without a Proof Packet is not done.
2. Screenshots are evidence, not illustrations. They must be live captures from the running app.
3. Proof Packets are additive. They are recorded, never overwritten.
4. The Proof Ledger is immutable. No deletions, no rewrites.
5. Proof enables trust. Investors, operators, and auditors rely on proof to evaluate the platform.
