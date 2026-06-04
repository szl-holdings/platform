# SZL Holdings — Decision Lifecycle Model

**Date:** April 22, 2026
**Status:** Canonical reference for the governed decision loop

---

## The Nine-Step Loop

Every consequential action in the SZL platform follows the same lifecycle. This is not optional — the architecture enforces it.

```
┌──────────┐    ┌──────────┐    ┌───────────────┐    ┌────────────┐
│ 1.SIGNAL │───▶│ 2.CONTEXT│───▶│3.RECOMMENDATION│───▶│4.SIMULATION│
└──────────┘    └──────────┘    └───────────────┘    └─────┬──────┘
                                                           │
┌──────────┐    ┌──────────┐    ┌───────────────┐    ┌─────▼──────┐
│ 9.LEARN  │◀───│ 8.OUTCOME│◀───│  7.PROOF      │◀───│ 6.EXECUTE  │
└──────────┘    └──────────┘    └───────────────┘    └─────┬──────┘
                                                           ▲
                                                     ┌─────┴──────┐
                                                     │ 5.POLICY   │
                                                     │  (APPROVE) │
                                                     └────────────┘
```

---

## Step Details

### 1. SIGNAL
**What:** Raw data arrives — an alert, a filing, a market movement, a telemetry event.
**Where:** Event Fabric (`packages/signal-mesh`), domain-specific feeds (`lib/intelligence-feeds`)
**Output:** Structured signal with `signalId`, `domain`, `timestamp`, `source`, `correlationId`

### 2. CONTEXT
**What:** The platform enriches the signal with historical context, related entities, and domain knowledge.
**Where:** Knowledge Store, Entity Graph, domain-specific enrichment routes
**Output:** Enriched signal with related entities, historical precedent, and risk classification

### 3. RECOMMENDATION
**What:** An AI agent or rule engine proposes a specific action based on the enriched signal.
**Where:** `packages/alloy` (agent runtime), `lib/ai-engine`, domain-specific cognitive routes
**Output:** Recommendation with `action`, `rationale`, `confidence`, `sourceReferences[]`, `riskTier`

### 4. SIMULATION
**What:** For medium and high-risk actions, Monte Carlo simulation evaluates potential outcomes.
**Where:** `lib/monte-carlo` (simulation engine), `lib/worldline` (scenario modeling)
**Output:** Probability distribution of outcomes, worst-case analysis, expected value

### 5. POLICY (APPROVE)
**What:** Covenant Policy evaluates whether the action is permitted. Human Approval Gates activate based on risk tier.
**Where:** `lib/covenant-policy`, `packages/guardian`, `lib/approvals`
**States:**
```
draft → recommended → pending_approval → approved → executed
                                       ↘ rejected
                                       ↘ rolled_back
```
**Rules:**
- Low risk: auto-approved by policy engine
- Medium risk: requires team lead approval
- High risk: requires department head approval
- Critical risk: requires executive + policy engine approval

### 6. EXECUTE
**What:** The approved action is carried out — a filing submitted, an alert escalated, a position adjusted, a vendor engaged.
**Where:** Domain-specific execution handlers, `packages/workflow-runtime`
**Output:** Execution result with `success`, `executionId`, `timestamp`, `actorId`

### 7. PROOF
**What:** An immutable evidence record is created linking the signal, recommendation, approval, and execution.
**Where:** `lib/proof-chain`, `packages/evidence-ledger`, `lib/audit`
**Output:** `ProofChainEntry` with hash-linked chain, source references, confidence, actor attribution

### 8. OUTCOME
**What:** The real-world result is tracked — did the action achieve its intended effect?
**Where:** `lib/outcome-graph`
**Output:** `OutcomeNode` with `achievement`, `acceptanceRate`, `agentAccuracy`

### 9. LEARN
**What:** The platform feeds outcomes back to calibrate future recommendations.
**Where:** `packages/cognitive-observability`, agent performance tracking
**Output:** Updated confidence scores, agent performance benchmarks, calibration adjustments

---

## Cross-Domain Decision Examples

### Maritime → Legal (Signal Chain: `maritime-realestate`)
1. SIGNAL: Vessel delay event detected (>24h port congestion)
2. CONTEXT: Cross-reference with charter party terms, demurrage clauses
3. RECOMMENDATION: File demurrage claim against counterparty
4. SIMULATION: Monte Carlo on claim recovery probability
5. POLICY: Legal team approval required (high risk)
6. EXECUTE: Generate claim document, file with counterparty
7. PROOF: Evidence chain links AIS data → delay event → charter terms → claim
8. OUTCOME: Track claim resolution (paid/settled/dismissed)
9. LEARN: Adjust delay threshold and claim probability model

### Security → Compliance (Signal Chain: `security-legal`)
1. SIGNAL: Critical security incident detected
2. CONTEXT: Enrich with affected systems, data classification, regulatory exposure
3. RECOMMENDATION: Escalate to CISO + initiate breach assessment
4. SIMULATION: Evaluate regulatory exposure (GDPR, CCPA, SEC)
5. POLICY: Executive approval for external notification (critical risk)
6. EXECUTE: File incident report, notify affected parties if required
7. PROOF: Full incident timeline with evidence chain
8. OUTCOME: Track regulatory response and remediation completion
9. LEARN: Update detection rules and response playbooks

---

## Implementation References

| Step | Primary Package | Schema | API Route |
|------|----------------|--------|-----------|
| Signal | `packages/signal-mesh` | `signal_chain_*` | `/api/signal-*` |
| Context | `lib/intelligence-feeds` | `knowledge_*` | `/api/intelligence/` |
| Recommendation | `packages/alloy` | `alloy_*` | `/api/alloy-*` |
| Simulation | `lib/monte-carlo` | `simulation_*` | `/api/simulation/` |
| Policy | `packages/guardian` | `guardian_*` | `/api/alloy-governance/` |
| Execute | `packages/workflow-runtime` | `workflow_*` | Domain-specific |
| Proof | `lib/proof-chain` | `audit_*`, `proof_*` | `/api/audit/` |
| Outcome | `lib/outcome-graph` | `outcome_*` | `/api/outcomes/` |
| Learn | `packages/cognitive-observability` | `ai_traces` | `/api/ai-ops-dashboard/` |
