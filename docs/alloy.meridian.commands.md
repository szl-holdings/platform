# Alloy Meridian — Command Reference

## Overview

Alloy Meridian is the cognitive agentic business observability and forecasting layer for the SZL Holdings platform. All commands are accessed via the REST API at `/api/meridian/*`.

---

## Status & Health

### Get Meridian Layer Status
```
GET /api/meridian/status
```
Returns the overall Meridian layer status including model router lane health, agent constellation health, and MCP server activation summary.

### Get Model Router Configuration
```
GET /api/meridian/model-router
```
Returns all 8 model lanes with their models, fallback ordering, and key presence status.

### Route a Request
```
POST /api/meridian/model-router/route
Body: { "lane": "strategy", "preferredModelId": "deepseek-r1" }
```
Returns the routing decision including selected model, fallback chain, and env key status.

---

## Agent Constellation

### List All Agents
```
GET /api/meridian/agents
```
Returns all 7 governed agents with health status, lane assignment, approval class, and capability counts.

### Get Agent Detail
```
GET /api/meridian/agents/:agentId
```
Valid IDs: `signal-cartographer`, `forecast-council`, `deepseek-strategist`, `operator-swarm`, `voice-of-business`, `brand-imagination-engine`, `governance-sentinel`

---

## Forecast Council & Tournament

### Run Full Forecast Tournament (All Metrics)
```
GET /api/meridian/forecast
```
Runs all 5 forecasting models (Chronos-2, TimesFM, Kronos, Timer, Lag-Llama) against all 8 business metrics. Returns global tournament rankings and per-metric sessions.

### Run Forecast for Specific Metric
```
GET /api/meridian/forecast/:metric
```
Valid metrics: `revenue_pipeline_velocity`, `delivery_risk`, `incident_likelihood`, `customer_demand`, `cash_runway`, `engineering_throughput`, `market_timing`, `platform_adoption`

Returns: winner model, full rankings, consensus forecast, uncertainty bands, backtest quality scores.

---

## Signal Graph & Signal Debt

### Get Signal Graph
```
GET /api/meridian/signal-graph
```
Returns the business signal graph with nodes (signals), edges (relationships), and health score.

### Get Signal Debt Report
```
GET /api/meridian/signal-debt
```
Returns scored Signal Debt items: stale, missing, contradictory, low-confidence signals ranked by impact.

---

## Decision Weather

### Get Decision Weather Forecast
```
GET /api/meridian/decision-weather
```
Returns probability forecasts for 5 event types over 7d/14d/30d windows:
- `delivery_delay`
- `customer_churn`
- `cost_overrun`
- `incident`
- `opportunity_conversion`

Includes: overall risk level (clear/caution/warning/storm), trend direction, advisory text.

---

## Counterfactual Ledger

### Get All Ledger Entries
```
GET /api/meridian/counterfactual-ledger
```
Returns all counterfactual projections for pending recommendations, each with 4 paths:
- `do_nothing` — baseline trajectory
- `delay_30d` — deferred action outcome
- `delegate` — hand-off to team
- `execute_now` — immediate execution with rollback path

### Get Specific Ledger Entry
```
GET /api/meridian/counterfactual-ledger/:id
```

---

## Business Flight Recorder

### Get Flight Recorder State
```
GET /api/meridian/flight-recorder?limit=50&type=model_call
```
Returns audit log of model calls, forecasts, tool actions, approvals, outcomes, and rollbacks.

Query parameters:
- `limit` — number of records to return (default: 50)
- `type` — filter by record type: `model_call`, `forecast`, `tool_action`, `approval_request`, `approval_decision`, `outcome`, `rollback`

---

## MCP Server Registry & Governance

### Get MCP Registry
```
GET /api/meridian/mcp-registry
```
Returns all registered external MCP servers with activation status, capabilities, and governance policy.

### Check MCP Governance
```
POST /api/meridian/mcp-governance/check
Body: { "serverId": "linear", "capabilityId": "linear.create_issue" }
```
Returns: `permitted`, `requiresApproval`, `reason`, `operationType`.

---

## Founder Intent & Governance

### Get Founder Intent Vector
```
GET /api/meridian/founder-intent
```
Returns the governed strategy memory: mission, core doctrines, risk tolerances, timing preferences, prohibited actions, and decision principles.

### Evaluate Action Against Doctrine
```
POST /api/meridian/governance/evaluate
Body: { "action": "deploy to production", "domain": "infrastructure" }
```
Returns: `compliant`, `violations`, `approvalRequired`, `notes`.

---

## Governance Rules (Summary)

| Operation Type | Approval Required |
|---|---|
| read | No |
| write | Yes |
| delete | Yes |
| send | Yes |
| publish | Yes |
| payment | Yes |
| permission | Yes |

All external MCP mutations are blocked until explicit human approval is recorded in the Flight Recorder.
