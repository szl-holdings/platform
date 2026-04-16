# Human vs. Agent Action Taxonomy

**Last updated:** April 2026
**Purpose:** Classify every action in the platform as human, agent, or system — with governance requirements for each

---

## Action Classes

| Class | Actor | Example | Governance Level |
|-------|-------|---------|-----------------|
| **Human-Initiated** | Operator, executive, analyst | Approve recommendation, override AI, escalate decision | Proof Chain record with user ID and rationale |
| **Agent-Generated** | AI model via Agent Gateway | Generate recommendation, classify signal, summarize evidence | Proof Chain record with model ID, confidence, input sources |
| **System-Automated** | Platform infrastructure | Publish event, enforce policy, create proof record | System log with service ID and timestamp |
| **Hybrid** | Agent proposes, human confirms | Recommendation + approval sequence | Both agent attribution AND human decision receipt |

---

## Governance by Action Class

### Human Actions
Every human action in a governed decision records:
- User ID and role(s)
- Timestamp
- Action type (approve, reject, override, escalate, defer)
- Optional rationale (free text)
- Proof chain linkage

### Agent Actions
Every agent action records:
- Agent/model ID and provider
- Confidence score (0.0 - 1.0)
- Input sources (what evidence the agent considered)
- Output type (recommendation, classification, summary)
- Proof chain linkage with prompt hash
- Review state (pending human review, auto-approved, etc.)

### System Actions
Every system action records:
- Service ID
- Action type
- Timestamp
- Correlation ID (links to the decision chain)

---

## The Override Pattern

When a human overrides an agent recommendation:

```
Agent Recommendation:
  "Initiate port security lockdown"
  Confidence: 82%
  Model: szl-threat-correlation-v3

Human Override:
  "Modified to partial lockdown — Zone B only"
  Rationale: "Local intelligence indicates Zone A is not at risk"
  Overridden by: J. Van den Berg (exec)

Governance Record:
  Original recommendation → preserved in Proof Chain
  Override decision → separate Proof Chain record
  Both linked by correlationId
  Outcome tracks against the override, not the original recommendation
```

This pattern is structurally unique to SZL. Copilots don't record overrides. Palantir logs actions but doesn't link overrides to original recommendations with outcome tracking.

---

## Taxonomy Matrix

| Action | Human | Agent | System | Proof Required |
|--------|-------|-------|--------|---------------|
| Signal classification | Reviews critical | Classifies all | Ingests raw | Agent: yes |
| Cross-domain correlation | Validates | Identifies patterns | Publishes events | Agent: yes |
| Recommendation generation | N/A | Generates | N/A | Agent: yes (L1+) |
| Monte Carlo simulation | Reviews results | N/A | Executes | System: log only |
| Policy evaluation | Reviews denials | N/A | Evaluates automatically | System: log |
| Decision approval | Approves/rejects | N/A | N/A | Human: yes |
| Workflow execution | Monitors | Executes automated steps | Orchestrates | Both: yes |
| Proof capture | Reviews | N/A | Creates automatically | System: yes |
| Outcome recording | Validates | N/A | Computes metrics | System: yes |
| Confidence calibration | N/A | N/A | Runs batch job | System: log |
