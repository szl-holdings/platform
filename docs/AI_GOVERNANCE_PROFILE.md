# SZL Holdings — AI Governance Profile

## Governance Framework

SZL's AI governance is not a compliance overlay — it is embedded in the decision lifecycle. Every AI-generated recommendation flows through the same governed pipeline as human decisions.

## Principles

1. **No autonomous execution** — AI recommends, humans approve. The Policy Engine enforces approval gates based on risk tier.
2. **Evidence over assertion** — Every AI output carries source references, confidence scores, and evidence bundles.
3. **Replay by default** — Every AI interaction is captured in the Trace Graph for full decision replay.
4. **Policy-first** — The Covenant Policy Engine evaluates applicable rules before any recommendation reaches a human.
5. **Calibrated trust** — The Outcome Graph tracks predicted vs. actual outcomes to calibrate AI accuracy over time.

## Risk Tiering

| Tier | AI Behavior | Human Requirement |
|------|------------|------------------|
| Low | Informational analysis, data summarization | Logging only |
| Medium | Recommendation generation, entity extraction | Confidence scoring + audit logging |
| High | Action recommendations with business impact | Human approval gate + full proof chain |
| Critical | Regulatory/financial/legal impact | Multi-approver gate + legal review + enhanced monitoring |

## Model Controls

### Registered Models
All AI models used in the platform are registered in the Model Policy Registry with:
- Allowed use cases
- Prohibited data scopes
- Required approval levels
- Fallback policies
- Evaluation requirements

### Prompt Governance
- All prompts are versioned and auditable
- Input/output pairs are logged for review
- Injection defense evaluation is part of the arena scoring

### Hallucination Resistance
- Every AI response is scored for hallucination resistance
- Claims without evidence references are flagged
- Arena scenarios specifically test for fabricated information

## Observability

| Signal | Instrumentation |
|--------|----------------|
| Model calls | OpenTelemetry spans with token count, latency, confidence |
| Tool calls | Span with input/output, duration, success/failure |
| Agent steps | Multi-step trace with decision points |
| Approval gates | Event with policy reference, approver, rationale |
| Outcomes | Predicted vs. actual deviation tracking |

## Evaluation

AI behavior is continuously evaluated through Command Arena:
- 5 smoke scenarios (baseline governance tests)
- Golden scenarios (known-correct reference cases)
- Regression scenarios (previously-failed cases)
- Domain-specific scenarios (per-domain AI accuracy)

## Compliance Alignment

| Regulation | SZL Coverage |
|-----------|-------------|
| EU AI Act | Human oversight (approval gates), traceability (proof chain), documentation (model registry) |
| NIST AI RMF | Risk management (risk tiering), governance (policy engine), monitoring (observability) |
| SEC AI Disclosure | Decision audit trail (proof chain), model documentation (registry), outcome tracking |
