# SZL Holdings — Command Arena

## Overview

Command Arena is the platform's benchmark and evaluation environment. It evaluates agents, workflows, decisions, and domain scenarios against multi-dimensional scoring criteria.

This is not generic testing. It is:
- A **leaderboard** for agent and workflow performance
- A **regression gate** for release governance
- A **governance scorecard** for compliance readiness
- A **replay scorecard** for audit completeness
- A **scenario harness** for domain-specific evaluation

## Architecture

### Harness

The evaluation harness (`scripts/evals/run-arena.ts`) loads scenario packs from `evals/scenarios/` and evaluates them against the scoring dimensions.

```
evals/
├── scenarios/
│   ├── smoke/           ← Quick validation scenarios
│   ├── golden/          ← Known-good reference cases
│   ├── regression/      ← Previously-failed cases
│   └── domain/          ← Domain-specific scenarios
└── README.md
```

### Scenario Format

```json
{
  "name": "maritime-delay-cascade",
  "domain": "vessels",
  "description": "Port delay triggers cross-domain cascade",
  "trigger": {
    "type": "signal",
    "domain": "vessels",
    "signal": "port_delay_hours",
    "value": 48
  },
  "expected_cascade": ["terra", "prism-counsel"],
  "expectations": {
    "correctness": 0.85,
    "evidence_completeness": 0.7,
    "approval_compliance": 1.0,
    "replay_completeness": 0.6,
    "policy_adherence": 1.0,
    "hallucination_resistance": 0.9,
    "tool_efficiency": 0.8
  },
  "pass_threshold": 0.75,
  "timeout_ms": 5000
}
```

## Scoring Dimensions

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Correctness | 25% | Did the decision reach the right conclusion? |
| Evidence completeness | 15% | Were all source references and proofs attached? |
| Approval compliance | 20% | Were human approval gates respected? |
| Replay completeness | 10% | Can the full decision be replayed from trace? |
| Policy adherence | 15% | Were all applicable policies evaluated? |
| Hallucination resistance | 10% | Were claims grounded in evidence? |
| Tool efficiency | 5% | Were the right tools used with minimal waste? |

## Scenario Categories

### Smoke Scenarios
Quick validation that core platform functions work:
- Health check chain completion
- Cross-domain signal routing
- Proof chain integrity
- Policy engine evaluation

### Golden Scenarios
Reference cases with known-correct outcomes:
- Maritime delay cascade with verified property impact
- Security incident with verified legal hold initiation
- Market volatility with verified rebalance recommendation

### Regression Scenarios
Previously-failed cases that must not regress:
- Mined from production failure traces via Skill Forge
- Each regression scenario includes the original failure trace and the expected fix

### Domain Scenarios
Domain-specific evaluation packs:
- Vessels: route optimization, anomaly detection, compliance
- Terra: distress scoring, valuation accuracy, timeline risk
- Aegis: incident classification, response recommendation, control coverage
- Counsel: deadline tracking, obligation extraction, clause analysis

## Leaderboard

The leaderboard tracks agent and workflow performance across runs:

| Rank | Agent | Score | Runs |
|------|-------|-------|------|
| 1 | SZL Governed Decision Engine v1 | Current baseline | Latest |

## Integration

### Release Governance
Arena results are included in the release trust pack. A release cannot proceed if:
- Any smoke scenario fails
- Overall pass rate drops below 80%
- Any critical-risk scenario fails approval compliance

### CI Pipeline
Arena evaluation is available as a CI step:
```bash
npx tsx scripts/evals/run-arena.ts
```

### Skill Forge
Failed scenarios feed into the Skill Forge failure mining pipeline, where failure modes are clustered and candidate improvements are generated.
